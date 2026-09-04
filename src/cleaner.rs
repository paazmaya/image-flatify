//! Empty directory cleanup module.

use std::fs;
use std::path::{Path, PathBuf};

use crate::FlatifyOptions;

/// Remove a directory if it is empty.
pub fn clean_directory<P: AsRef<Path>>(item: P, options: &FlatifyOptions) {
    let path = item.as_ref();

    let entries = match fs::read_dir(path) {
        Ok(read_dir) => {
            let count = read_dir.count();
            if count > 0 {
                if options.verbose {
                    println!(
                        "Cannot delete directory which has files ({}): {}",
                        count,
                        path.display()
                    );
                }
                return;
            }
            count
        }
        Err(_) => return,
    };

    if entries == 0 {
        if options.verbose {
            println!("Deleting empty directory {}", path.display());
        }
        if !options.dry_run {
            if let Err(e) = fs::remove_dir(path) {
                if options.verbose {
                    eprintln!("Failed to delete directory {}: {}", path.display(), e);
                }
            }
        }
    }
}

/// Remove empty directories in descending order of path length.
pub fn clean_directories(mut directories: Vec<PathBuf>, options: &FlatifyOptions) {
    // Sort by path string length descending so child directories are removed before parents
    directories.sort_by_key(|b| std::cmp::Reverse(b.to_string_lossy().len()));

    for dir in directories {
        if !dir.exists() {
            eprintln!("Directory {} did not exists", dir.display());
            continue;
        }
        clean_directory(&dir, options);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_clean_directory_removes_empty() {
        let tmp = tempdir().unwrap();
        let sub = tmp.path().join("empty_sub");
        fs::create_dir(&sub).unwrap();
        assert!(sub.exists());

        let options = FlatifyOptions {
            dry_run: false,
            verbose: true,
            ..Default::default()
        };
        clean_directory(&sub, &options);
        assert!(!sub.exists());
    }

    #[test]
    fn test_clean_directory_dry_run_preserves() {
        let tmp = tempdir().unwrap();
        let sub = tmp.path().join("empty_sub");
        fs::create_dir(&sub).unwrap();

        let options = FlatifyOptions {
            dry_run: true,
            verbose: true,
            ..Default::default()
        };
        clean_directory(&sub, &options);
        assert!(sub.exists());
    }

    #[test]
    fn test_clean_directory_keeps_non_empty() {
        let tmp = tempdir().unwrap();
        let sub = tmp.path().join("sub_with_file");
        fs::create_dir(&sub).unwrap();
        fs::write(sub.join("file.txt"), "hello").unwrap();

        let options = FlatifyOptions {
            dry_run: false,
            verbose: true,
            ..Default::default()
        };
        clean_directory(&sub, &options);
        assert!(sub.exists());
    }

    #[test]
    fn test_clean_directory_read_dir_error() {
        let tmp = tempdir().unwrap();
        let missing = tmp.path().join("does_not_exist");

        let options = FlatifyOptions::default();
        // fs::read_dir fails, function should return early without panicking.
        clean_directory(&missing, &options);
        assert!(!missing.exists());
    }

    #[test]
    fn test_clean_directories_missing_directory() {
        let tmp = tempdir().unwrap();
        let missing = tmp.path().join("does_not_exist");

        let options = FlatifyOptions::default();
        // Should print a message and continue instead of panicking.
        clean_directories(vec![missing], &options);
    }
}
