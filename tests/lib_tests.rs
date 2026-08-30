use std::fs;
use tempfile::tempdir;

use image_flatify::{flatify, FlatifyOptions};

#[test]
fn test_flatify_dry_run() {
    let options = FlatifyOptions {
        verbose: false,
        dry_run: true,
        keep_in_directories: false,
        prefix: String::new(),
        append_hash: false,
        lowercase_suffix: false,
        no_delete_empty_directories: false,
    };
    flatify("tests/fixtures", &options);
}

#[test]
fn test_flatify_dry_run_verbose() {
    let options = FlatifyOptions {
        verbose: true,
        dry_run: true,
        keep_in_directories: false,
        prefix: String::new(),
        append_hash: false,
        lowercase_suffix: false,
        no_delete_empty_directories: false,
    };
    flatify("tests/fixtures", &options);
}

#[test]
fn test_flatify_dry_run_with_keep_in_directories() {
    let options = FlatifyOptions {
        verbose: false,
        dry_run: true,
        keep_in_directories: true,
        prefix: "test-".to_string(),
        append_hash: false,
        lowercase_suffix: false,
        no_delete_empty_directories: false,
    };
    flatify("tests/fixtures", &options);
}

#[test]
fn test_flatify_moves_files() {
    let tmp = tempdir().unwrap();
    let tmp_file = tmp.path().join("IMG_0640.JPG");
    fs::copy("tests/fixtures/IMG_0640.JPG", &tmp_file).unwrap();
    assert!(tmp_file.exists());

    let options = FlatifyOptions {
        verbose: true,
        dry_run: false,
        keep_in_directories: false,
        prefix: "myprefix-".to_string(),
        append_hash: false,
        lowercase_suffix: true,
        no_delete_empty_directories: false,
    };

    flatify(tmp.path(), &options);

    assert!(!tmp_file.exists());
    let expected_target = tmp.path().join("myprefix-2016-06-05-20-40-00.jpg");
    assert!(
        expected_target.exists(),
        "Target file should exist: {}",
        expected_target.display()
    );
}

#[test]
fn test_flatify_clean_empty_subdirectories() {
    let tmp = tempdir().unwrap();
    let sub = tmp.path().join("nested").join("folder");
    fs::create_dir_all(&sub).unwrap();
    let tmp_file = sub.join("IMG_0640.JPG");
    fs::copy("tests/fixtures/IMG_0640.JPG", &tmp_file).unwrap();

    let options = FlatifyOptions {
        verbose: false,
        dry_run: false,
        keep_in_directories: false,
        prefix: String::new(),
        append_hash: false,
        lowercase_suffix: false,
        no_delete_empty_directories: false,
    };

    flatify(tmp.path(), &options);

    // File should have been moved to root of tmp
    assert!(tmp.path().join("2016-06-05-20-40-00.JPG").exists());
    // Subdirectories should have been cleaned up
    assert!(!sub.exists());
    assert!(!tmp.path().join("nested").exists());
}
