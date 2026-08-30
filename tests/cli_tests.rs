use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn test_cli_version() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.arg("-V")
        .assert()
        .success()
        .stdout(predicate::str::contains("image-flatify 6.0.0"));
}

#[test]
fn test_cli_help() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Usage: image-flatify"));
}

#[test]
fn test_cli_invalid_option() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.arg("-g")
        .assert()
        .failure()
        .stderr(predicate::str::contains("unexpected argument '-g'"));
}

#[test]
fn test_cli_requires_directory() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.arg("-nv")
        .assert()
        .failure()
        .stderr(predicate::str::contains(
            "required arguments were not provided",
        ));
}

#[test]
fn test_cli_non_existing_directory_fails() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.args(["-v", "tests/fixtures", "tests/not-here"])
        .assert()
        .failure()
        .stderr(predicate::str::contains("does not exist"));
}

#[test]
fn test_cli_dry_run_verbose() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.args(["-nv", "tests/fixtures"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Found total of 1 image files"))
        .stdout(predicate::str::contains(
            "Would have moved total of 1 image files",
        ));
}

#[test]
fn test_cli_prefix() {
    let prefix = "i-like-rust";
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.args(["-p", prefix, "-nv", "tests/fixtures"])
        .assert()
        .success()
        .stdout(predicate::str::contains(format!("--> {prefix}2016-06-05")));
}

#[test]
fn test_cli_append_hash() {
    let mut cmd = Command::cargo_bin("image-flatify").unwrap();
    cmd.args(["-anKDv", "tests/fixtures"])
        .assert()
        .success()
        .stdout(predicate::str::is_match(r"40-00_\S+\.JPG").unwrap());
}
