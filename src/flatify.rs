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
    let mut moved_files = 0;

    for filepath in &files {
        let source_dir = filepath.parent().unwrap_or_else(|| Path::new(""));

        let dest_dir = if options.keep_in_directories {
            source_dir
        } else {
            dir
        };

        let mut curr = source_dir;
        while curr != dir && !curr.as_os_str().is_empty() {
            if !touched_directories.contains(&curr.to_path_buf()) {
                touched_directories.push(curr.to_path_buf());
            }
            match curr.parent() {
                Some(p) => curr = p,
                None => break,
            }
        }

        let target_path = match get_target_path(dest_dir, filepath, options) {
            Some(p) => p,
            None => continue,
        };

        if options.verbose {
            let in_path = filepath.strip_prefix(dir).unwrap_or(filepath);
            let out_path = target_path.strip_prefix(dir).unwrap_or(&target_path);
            println!("Moving {} --> {}", in_path.display(), out_path.display());
        }

        if !options.dry_run {
            if let Err(e) = fs::rename(filepath, &target_path) {
                eprintln!(
                    "Failed to move {} to {}: {}",
                    filepath.display(),
                    target_path.display(),
                    e
                );
            }
        }
        moved_files += 1;
    }

    if !options.no_delete_empty_directories && !options.keep_in_directories {
        clean_directories(touched_directories, options);
    }

    if options.dry_run {
        println!(
            "Would have moved total of {} image files, but did not due to dry-run",
            moved_files
        );
    } else {
        println!("Moved total of {} image files", moved_files);
    }
}
