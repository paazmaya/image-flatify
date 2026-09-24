//! Target file path generation module.

use crate::date::get_date_string;
use crate::FlatifyOptions;
use md5::{Digest, Md5};
use rand::RngExt;
use std::path::{Path, PathBuf};

/// Extract the ISO date portion (first 10 characters) from a dash-separated date string.
fn extract_iso_date(date_string: &str) -> String {
    date_string.chars().take(10).collect()
}

/// Build the file extension (including leading dot), lowercased if requested.
fn build_extension(filepath: &Path, lowercase_suffix: bool) -> String {
    filepath
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| {
            if lowercase_suffix {
                format!(".{}", e.to_ascii_lowercase())
            } else {
                format!(".{}", e)
            }
        })
        .unwrap_or_default()
}

/// Build the name portion of the filename from the stem, prefix, and date.
fn build_name_part(
    stem: &str,
    options: &FlatifyOptions,
    date_part: &str,
    date_iso: &str,
) -> String {
    if options.append_date {
        format!("{}{}_{}", options.prefix, stem, date_iso)
    } else {
        format!("{}{}", options.prefix, date_part)
    }
}

/// Compute the MD5 hash of the given input as a lowercase hex string.
fn generate_md5_hash(input: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    hasher
        .finalize()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

/// Build the input string used for generating the MD5 hash suffix.
fn build_hash_input(dest_dir: &Path, filepath: &Path, name_part: &str, rand_val: f64) -> String {
    format!(
        "{}{}{}{}",
        dest_dir.display(),
        filepath.display(),
        name_part,
        rand_val
    )
}

/// Join a filename with the destination directory, handling the empty-dir case.
fn join_with_dest_dir(dest_dir: &Path, filename: String) -> PathBuf {
    if dest_dir.as_os_str().is_empty() {
        PathBuf::from(filename)
    } else {
        dest_dir.join(filename)
    }
}

/// Resolve filename collisions by appending an incrementing counter suffix.
fn resolve_collision(dest_dir: &Path, name_part: &str, ext: &str) -> PathBuf {
    let mut counter = 1;
    let mut target_path = join_with_dest_dir(dest_dir, format!("{name_part}{ext}"));
    while target_path.exists() {
        let next_filename = format!("{name_part}_{counter}{ext}");
        target_path = join_with_dest_dir(dest_dir, next_filename);
        counter += 1;
    }
    target_path
}

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
    let date_iso = extract_iso_date(&date_string);
    let date_part = date_string;

    let ext = build_extension(filepath, options.lowercase_suffix);

    let stem = filepath
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or_default();
    let name_part = build_name_part(stem, options, &date_part, &date_iso);

    if options.append_hash {
        let mut rng = rand::rng();
        let rand_val: f64 = rng.random();
        let hash_input = build_hash_input(dest_dir, filepath, &name_part, rand_val);
        let hex = generate_md5_hash(&hash_input);
        let target_filename = format!("{name_part}_{hex}{ext}");
        return Some(join_with_dest_dir(dest_dir, target_filename));
    }

    Some(resolve_collision(dest_dir, &name_part, &ext))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_iso_date() {
        assert_eq!(extract_iso_date("2016-06-05-20-40-00"), "2016-06-05");
        assert_eq!(extract_iso_date("2023-12-25-08-30-45"), "2023-12-25");
        assert_eq!(extract_iso_date("short"), "short");
        assert_eq!(extract_iso_date(""), "");
    }

    #[test]
    fn test_build_extension_uppercase() {
        let path = Path::new("tests/fixtures/IMG_0640.JPG");
        assert_eq!(build_extension(path, false), ".JPG");
    }

    #[test]
    fn test_build_extension_lowercase() {
        let path = Path::new("tests/fixtures/IMG_0640.JPG");
        assert_eq!(build_extension(path, true), ".jpg");
    }

    #[test]
    fn test_build_extension_none() {
        let path = Path::new("no_extension_file");
        assert_eq!(build_extension(path, false), "");
    }

    #[test]
    fn test_build_extension_lowercase_already() {
        let path = Path::new("tests/fixtures/file.jpg");
        assert_eq!(build_extension(path, true), ".jpg");
    }

    #[test]
    fn test_build_name_part_with_append_date() {
        let options = FlatifyOptions {
            prefix: "pre-".to_string(),
            append_date: true,
            ..Default::default()
        };
        assert_eq!(
            build_name_part("IMG_0640", &options, "2016-06-05-20-40-00", "2016-06-05"),
            "pre-IMG_0640_2016-06-05"
        );
    }

    #[test]
    fn test_build_name_part_without_append_date() {
        let options = FlatifyOptions::default();
        assert_eq!(
            build_name_part("IMG_0640", &options, "2016-06-05-20-40-00", "2016-06-05"),
            "2016-06-05-20-40-00"
        );
    }

    #[test]
    fn test_build_name_part_with_prefix() {
        let options = FlatifyOptions {
            prefix: "hoplaa-".to_string(),
            ..Default::default()
        };
        assert_eq!(
            build_name_part("IMG_0640", &options, "2016-06-05-20-40-00", "2016-06-05"),
            "hoplaa-2016-06-05-20-40-00"
        );
    }

    #[test]
    fn test_build_name_part_empty_stem() {
        let options = FlatifyOptions {
            prefix: "pre-".to_string(),
            append_date: true,
            ..Default::default()
        };
        assert_eq!(
            build_name_part("", &options, "2023-01-15-10-00-00", "2023-01-15"),
            "pre-_2023-01-15"
        );
    }

    #[test]
    fn test_generate_md5_hash_empty() {
        assert_eq!(generate_md5_hash(""), "d41d8cd98f00b204e9800998ecf8427e");
    }

    #[test]
    fn test_generate_md5_hash_abc() {
        assert_eq!(generate_md5_hash("abc"), "900150983cd24fb0d6963f7d28e17f72");
    }

    #[test]
    fn test_generate_md5_hash_known_value() {
        assert_eq!(
            generate_md5_hash("hello-world"),
            "2095312189753de6ad47dfe20cbe97ec"
        );
    }

    #[test]
    fn test_build_hash_input() {
        let dest_dir = Path::new("dest");
        let filepath = Path::new("src/file.jpg");
        let result = build_hash_input(dest_dir, filepath, "name", 0.5);
        assert_eq!(result, "destsrc/file.jpgname0.5");
    }

    #[test]
    fn test_build_hash_input_empty_dest() {
        let dest_dir = Path::new("");
        let filepath = Path::new("src/file.jpg");
        let result = build_hash_input(dest_dir, filepath, "name", 1.0);
        assert_eq!(result, "src/file.jpgname1");
    }

    #[test]
    fn test_join_with_dest_dir_empty() {
        let dest_dir = Path::new("");
        assert_eq!(
            join_with_dest_dir(dest_dir, "file.jpg".to_string()),
            PathBuf::from("file.jpg")
        );
    }

    #[test]
    fn test_join_with_dest_dir_non_empty() {
        let dest_dir = Path::new("output");
        assert_eq!(
            join_with_dest_dir(dest_dir, "file.jpg".to_string()),
            PathBuf::from("output").join("file.jpg")
        );
    }

    #[test]
    fn test_resolve_collision_no_conflict() {
        let temp_dir = std::env::temp_dir();
        let dir = temp_dir.join("image_flatify_no_conflict_test");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();

        let stem = "unique-file-12345";
        assert!(!dir.join(format!("{stem}.jpg")).exists());

        let result = resolve_collision(&dir, stem, ".jpg");
        assert_eq!(result, dir.join(format!("{stem}.jpg")));

        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn test_resolve_collision_single_conflict() {
        let temp_dir = std::env::temp_dir();
        let dir = temp_dir.join("image_flatify_single_conflict_test");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();

        let stem = "conflict-file-12345";
        let original = dir.join(format!("{stem}.jpg"));
        std::fs::write(&original, "test").unwrap();

        let result = resolve_collision(&dir, stem, ".jpg");
        assert_eq!(result, dir.join(format!("{stem}_1.jpg")));

        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn test_resolve_collision_multiple_conflicts() {
        let temp_dir = std::env::temp_dir();
        let dir = temp_dir.join("image_flatify_multi_conflict_test");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();

        let stem = "multi-conflict-12345";
        std::fs::write(dir.join(format!("{stem}.jpg")), "test").unwrap();
        std::fs::write(dir.join(format!("{stem}_1.jpg")), "test").unwrap();
        std::fs::write(dir.join(format!("{stem}_2.jpg")), "test").unwrap();

        let result = resolve_collision(&dir, stem, ".jpg");
        assert_eq!(result, dir.join(format!("{stem}_3.jpg")));

        std::fs::remove_dir_all(&dir).unwrap();
    }

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
