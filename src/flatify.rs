//! Main flatify orchestration logic.

use std::fs;
use std::path::{Path, PathBuf};

use crate::cleaner::clean_directories;
use crate::finder::get_images;
use crate::naming::get_target_path;
use crate::FlatifyOptions;

/// Process directory: search media recursively, determine new paths, move files, and clean empty directories.
pub fn flatify<P: AsRef<Path>>(directory: P, options: &FlatifyOptions) {
    let dir = directory.as_ref();
    let files = get_images(dir, options.verbose);

    println!("Found total of {} image files to be processed", files.len());

    let mut touched_directories: Vec<PathBuf> = Vec::new();
    let mut moved = 0;

    for filepath in &files {
        let source_dir = filepath.parent().unwrap_or_else(|| Path::new(""));

        for parent in collect_touched_directories(source_dir, dir) {
            if !touched_directories.contains(&parent) {
                touched_directories.push(parent);
            }
        }

        let dest_dir = if options.keep_in_directories {
            source_dir
        } else {
            dir
        };

        if process_file(filepath, dest_dir, dir, options) {
            moved += 1;
        }
    }

    if !options.no_delete_empty_directories && !options.keep_in_directories {
        clean_directories(touched_directories, options);
    }

    if options.dry_run {
        println!("Would have moved total of {moved} image files, but did not due to dry-run");
    } else {
        println!("Moved total of {moved} image files");
    }
}

/// Collect the ancestor directories of `source_dir` up to (but excluding) `root`.
fn collect_touched_directories(source_dir: &Path, root: &Path) -> Vec<PathBuf> {
    let mut directories = Vec::new();
    let mut curr = source_dir;

    while curr != root && !curr.as_os_str().is_empty() {
        directories.push(curr.to_path_buf());
        match curr.parent() {
            Some(parent) => curr = parent,
            None => break,
        }
    }

    directories
}

/// Move a single file to its computed target path.
///
/// Returns whether a move was attempted (i.e. a target path could be computed).
fn process_file(filepath: &Path, dest_dir: &Path, root: &Path, options: &FlatifyOptions) -> bool {
    let target_path = match get_target_path(dest_dir, filepath, options) {
        Some(path) => path,
        None => return false,
    };

    if options.verbose {
        let in_path = filepath.strip_prefix(root).unwrap_or(filepath);
        let out_path = target_path.strip_prefix(root).unwrap_or(&target_path);
        println!("Moving {} --> {}", in_path.display(), out_path.display());
    }

    if !options.dry_run {
        if let Err(e) = fs::rename(filepath, &target_path) {
            let from = filepath.display();
            let to = target_path.display();
            eprintln!("Failed to move {from} to {to}: {e}");
        }
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_collect_touched_directories_walks_up_to_root() {
        let dirs = collect_touched_directories(Path::new("root/a/b"), Path::new("root"));
        assert_eq!(
            dirs,
            vec![PathBuf::from("root/a/b"), PathBuf::from("root/a")]
        );
    }

    #[test]
    fn test_collect_touched_directories_stops_at_source_equal_root() {
        let dirs = collect_touched_directories(Path::new("root"), Path::new("root"));
        assert!(dirs.is_empty());
    }

    #[test]
    fn test_collect_touched_directories_stops_when_no_parent() {
        let tmp = tempdir().unwrap();

        // Walk up to the filesystem root, which has no parent.
        let mut root_only = tmp.path().to_path_buf();
        while let Some(parent) = root_only.parent() {
            root_only = parent.to_path_buf();
        }

        let dirs = collect_touched_directories(&root_only, Path::new("<unreachable-root>"));
        assert_eq!(dirs, vec![root_only]);
    }

    #[test]
    fn test_process_file_moves_file() {
        let tmp = tempdir().unwrap();
        let src = tmp.path().join("IMG_0640.JPG");
        fs::copy("tests/fixtures/IMG_0640.JPG", &src).unwrap();
        let dest = tmp.path().join("dest");
        fs::create_dir(&dest).unwrap();

        let options = FlatifyOptions {
            verbose: true,
            dry_run: false,
            ..Default::default()
        };

        assert!(process_file(&src, &dest, tmp.path(), &options));
        assert!(!src.exists());
        assert_eq!(fs::read_dir(&dest).unwrap().count(), 1);
    }

    #[test]
    fn test_process_file_dry_run_keeps_file() {
        let tmp = tempdir().unwrap();
        let src = tmp.path().join("IMG_0640.JPG");
        fs::copy("tests/fixtures/IMG_0640.JPG", &src).unwrap();

        let options = FlatifyOptions {
            verbose: true,
            dry_run: true,
            ..Default::default()
        };

        assert!(process_file(&src, tmp.path(), tmp.path(), &options));
        assert!(src.exists());
    }

    #[test]
    fn test_process_file_missing_file_returns_false() {
        let tmp = tempdir().unwrap();
        let missing = tmp.path().join("does-not-exist.JPG");

        let options = FlatifyOptions::default();
        assert!(!process_file(&missing, tmp.path(), tmp.path(), &options));
    }

    #[test]
    fn test_process_file_reports_rename_failure() {
        let tmp = tempdir().unwrap();
        let src = tmp.path().join("IMG_0640.JPG");
        fs::copy("tests/fixtures/IMG_0640.JPG", &src).unwrap();

        // Destination directory does not exist, so the rename fails.
        let dest = tmp.path().join("missing-dest");
        let options = FlatifyOptions {
            verbose: false,
            dry_run: false,
            ..Default::default()
        };

        assert!(process_file(&src, &dest, tmp.path(), &options));
        assert!(src.exists());
    }
}
