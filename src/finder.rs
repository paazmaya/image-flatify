//! Recursive directory walking and media file discovery module.

use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::media::is_media;

/// Read a directory recursively, returning all media files found.
///
/// If `directory` does not exist or is inaccessible, an error message is printed
/// to stderr and an empty `Vec` is returned.
pub fn get_images<P: AsRef<Path>>(directory: P, verbose: bool) -> Vec<PathBuf> {
    let dir = directory.as_ref();
    if verbose {
        println!("Reading directory {}", dir.display());
    }

    if !dir.exists() {
        eprintln!("Directory {} did not exists", dir.display());
        return Vec::new();
    }

    let mut images = Vec::new();

    for entry in WalkDir::new(dir)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if entry.file_type().is_file() && is_media(path) {
            images.push(path.to_path_buf());
        }
    }

    images
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_images_fixtures() {
        let files = get_images("tests/fixtures", false);
        assert_eq!(files.len(), 1);
        assert!(files[0].ends_with("IMG_0640.JPG"));
    }

    #[test]
    fn test_get_images_non_existing() {
        let files = get_images("not even existing", false);
        assert_eq!(files.len(), 0);
    }
}
