//! Target file path generation module.

use crate::date::get_date_string;
use crate::FlatifyOptions;
use md5::{Digest, Md5};
use rand::RngExt;
use std::path::{Path, PathBuf};

/// Generate the full target file path for a media file.
///
/// Handles prefix, lowercase suffix, random MD5 hash suffix, and counter-based
/// conflict resolution when destination already exists.
pub fn get_target_path<P1: AsRef<Path>, P2: AsRef<Path>>(
    dest_dir: P1,
    filepath: P2,
    options: &FlatifyOptions,
) -> Option<PathBuf> {
    let dest_dir = dest_dir.as_ref();
    let filepath = filepath.as_ref();

    let date_string = get_date_string(filepath)?;
    let name_part = format!("{}{}", options.prefix, date_string);

    let ext = filepath
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| {
            if options.lowercase_suffix {
                format!(".{}", e.to_ascii_lowercase())
            } else {
                format!(".{}", e)
            }
        })
        .unwrap_or_default();

    if options.append_hash {
        let mut rng = rand::rng();
        let rand_val: f64 = rng.random();
        let hash_input = format!(
            "{}{}{}{}",
            dest_dir.display(),
            filepath.display(),
            name_part,
            rand_val
        );

        let mut hasher = Md5::new();
        hasher.update(hash_input.as_bytes());
        let hex: String = hasher
            .finalize()
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect();

        let target_filename = format!("{name_part}_{hex}{ext}");
        let target_path = if dest_dir.as_os_str().is_empty() {
            PathBuf::from(target_filename)
        } else {
            dest_dir.join(target_filename)
        };
        return Some(target_path);
    }

    let initial_filename = format!("{name_part}{ext}");
    let mut target_path = if dest_dir.as_os_str().is_empty() {
        PathBuf::from(initial_filename)
    } else {
        dest_dir.join(initial_filename)
    };

    let mut counter = 1;
    while target_path.exists() {
        let next_filename = format!("{name_part}_{counter}{ext}");
        target_path = if dest_dir.as_os_str().is_empty() {
            PathBuf::from(next_filename)
        } else {
            dest_dir.join(next_filename)
        };
        counter += 1;
    }

    Some(target_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_target_path_basic() {
        let options = FlatifyOptions {
            prefix: "hoplaa-".to_string(),
            ..Default::default()
        };
        let target = get_target_path("", "tests/fixtures/IMG_0640.JPG", &options);
        assert_eq!(
            target,
            Some(PathBuf::from("hoplaa-2016-06-05-20-40-00.JPG"))
        );
    }

    #[test]
    fn test_get_target_path_lowercase_suffix() {
        let options = FlatifyOptions {
            prefix: "hoplaa-".to_string(),
            lowercase_suffix: true,
            ..Default::default()
        };
        let target = get_target_path("", "tests/fixtures/IMG_0640.JPG", &options);
        assert_eq!(
            target,
            Some(PathBuf::from("hoplaa-2016-06-05-20-40-00.jpg"))
        );
    }

    #[test]
    fn test_get_target_path_append_hash() {
        let options = FlatifyOptions {
            prefix: "hoplaa-".to_string(),
            append_hash: true,
            lowercase_suffix: true,
            ..Default::default()
        };
        let target = get_target_path("", "tests/fixtures/IMG_0640.JPG", &options).unwrap();
        let name = target.to_str().unwrap();
        assert_eq!(name.len(), 63);
        assert!(name.starts_with("hoplaa-2016-06-05-20-40-00_"));
        assert!(name.ends_with(".jpg"));
    }

    #[test]
    fn test_get_target_path_collision_counter() {
        let options = FlatifyOptions::default();
        let target = get_target_path("tests/expected", "tests/fixtures/IMG_0640.JPG", &options);
        assert_eq!(
            target,
            Some(PathBuf::from("tests/expected/2016-06-05-20-40-00_1.JPG"))
        );
    }
}
