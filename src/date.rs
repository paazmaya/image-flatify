//! Date string extraction module using 3rd-party CLI tools (MediaInfo, ExifTool, GraphicsMagick) and filesystem metadata.

use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use regex::Regex;
use std::fs;
use std::path::Path;
use std::process::{Command, Output};

/// Trait for running external commands, allowing mocking in tests.
pub trait CommandRunner {
    fn run(&self, program: &str, args: &[&str]) -> std::io::Result<Output>;
}

/// Default implementation using std::process::Command.
pub struct RealCommandRunner;

impl CommandRunner for RealCommandRunner {
    fn run(&self, program: &str, args: &[&str]) -> std::io::Result<Output> {
        Command::new(program).args(args).output()
    }
}

/// Format raw date string by replacing colons and whitespace with dashes.
fn format_date_dashed(raw: &str) -> String {
    let re = Regex::new(r"[:\s]").expect("valid regex");
    re.replace_all(raw.trim(), "-").to_string()
}

/// Extract date using MediaInfo CLI.
pub fn get_date_string_mediainfo<P: AsRef<Path>>(
    filepath: P,
    runner: &dyn CommandRunner,
) -> Option<String> {
    let path = filepath.as_ref();
    let output = runner.run("mediainfo", &["-f", path.to_str()?]).ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let date_pattern = Regex::new(r"(?i)(\d{4}[-:]\d{2}[-:]\d{2})[ T](\d{2}:\d{2}:\d{2})").ok()?;

    let mut candidates: Vec<(i64, String)> = Vec::new();

    for line in stdout.lines() {
        let lower = line.to_ascii_lowercase();
        // Skip filesystem-level date lines; only use media metadata dates.
        if lower.contains("date") && !lower.contains("file ") {
            if let Some(caps) = date_pattern.captures(line) {
                let date_part = caps[1].replace(':', "-");
                let time_part = &caps[2];
                let formatted = format!("{date_part} {time_part}");

                if let Ok(naive) = NaiveDateTime::parse_from_str(&formatted, "%Y-%m-%d %H:%M:%S") {
                    let ts = Utc.from_utc_datetime(&naive).timestamp_millis();
                    if ts > 0 {
                        candidates.push((ts, formatted));
                    }
                }
            }
        }
    }

    if candidates.is_empty() {
        return None;
    }

    candidates.sort_by_key(|(ts, _)| *ts);
    Some(candidates[0].1.clone())
}

/// Extract date using ExifTool CLI.
pub fn get_date_string_exiftool<P: AsRef<Path>>(
    filepath: P,
    runner: &dyn CommandRunner,
) -> Option<String> {
    let path = filepath.as_ref();
    let output = runner
        .run("exiftool", &["-s3", "-createdate", path.to_str()?])
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Strip timezone offset like +02:00 or -05:00
    let tz_re = Regex::new(r"[+-]\d{2}:\d{2}$").ok()?;
    let cleaned = tz_re.replace(trimmed, "").trim().to_string();

    if cleaned.is_empty() {
        None
    } else {
        Some(cleaned)
    }
}

/// Extract date using GraphicsMagick CLI.
pub fn get_date_string_graphicsmagick<P: AsRef<Path>>(
    filepath: P,
    runner: &dyn CommandRunner,
) -> Option<String> {
    let path = filepath.as_ref();
    let output = runner
        .run(
            "gm",
            &["identify", "-format", "%[EXIF:DateTime]", path.to_str()?],
        )
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

/// Get the best guess for the date when the picture/media was taken.
/// Order of tools:
/// 1. MediaInfo
/// 2. ExifTool
/// 3. GraphicsMagick
/// 4. File creation / modification time fallback
pub fn get_date_string<P: AsRef<Path>>(filepath: P) -> Option<String> {
    get_date_string_with_runner(filepath, &RealCommandRunner)
}

pub fn get_date_string_with_runner<P: AsRef<Path>>(
    filepath: P,
    runner: &dyn CommandRunner,
) -> Option<String> {
    let path = filepath.as_ref();

    if !path.exists() {
        eprintln!("File {} did not exists", path.display());
        return None;
    }

    let starts_with_number = Regex::new(r"^\d+").expect("valid regex");

    // 1. MediaInfo
    if let Some(date) = get_date_string_mediainfo(path, runner) {
        if starts_with_number.is_match(&date) {
            return Some(format_date_dashed(&date));
        }
    }

    // 2. ExifTool
    if let Some(date) = get_date_string_exiftool(path, runner) {
        if starts_with_number.is_match(&date) {
            return Some(format_date_dashed(&date));
        }
    }

    // 3. GraphicsMagick
    if let Some(date) = get_date_string_graphicsmagick(path, runner) {
        if starts_with_number.is_match(&date) {
            return Some(format_date_dashed(&date));
        }
    }

    // 4. File metadata fallback (creation / modification time)
    if let Ok(metadata) = fs::metadata(path) {
        let system_time = metadata
            .created()
            .or_else(|_| metadata.modified())
            .unwrap_or_else(|_| std::time::SystemTime::now());

        let dt: DateTime<Local> = system_time.into();
        return Some(dt.format("%Y-%m-%d-%H-%M-%S").to_string());
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io;
    use std::process::Output;

    struct MockRunner {
        responses: Vec<(String, Vec<String>, (Option<Output>, bool))>,
        index: std::cell::RefCell<usize>,
    }

    impl MockRunner {
        fn new(responses: Vec<(String, Vec<String>, (Option<Output>, bool))>) -> Self {
            Self {
                responses,
                index: std::cell::RefCell::new(0),
            }
        }
    }

    impl CommandRunner for MockRunner {
        fn run(&self, program: &str, args: &[&str]) -> io::Result<Output> {
            let idx = *self.index.borrow();
            if idx >= self.responses.len() {
                return Err(io::Error::new(
                    io::ErrorKind::Other,
                    "no more mock responses",
                ));
            }
            let (expected_program, expected_args, (output, _)) = &self.responses[idx];
            assert_eq!(program, *expected_program, "unexpected program");
            let args_strings: Vec<String> = args.iter().map(|s| s.to_string()).collect();
            assert_eq!(args_strings, *expected_args, "unexpected args");
            *self.index.borrow_mut() += 1;
            output
                .clone()
                .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "no output"))
        }
    }

    fn make_output(success: bool, stdout: &str) -> (Option<Output>, bool) {
        let mut cmd = if success {
            std::process::Command::new("true")
        } else {
            std::process::Command::new("false")
        };
        let output = cmd.output().unwrap_or_else(|_| Output {
            status: std::process::ExitStatus::default(),
            stdout: vec![],
            stderr: vec![],
        });
        let mut out = output;
        out.stdout = stdout.as_bytes().to_vec();
        (Some(out), success)
    }

    fn mock_resp(
        program: &str,
        args: &[&str],
        success: bool,
        stdout: &str,
    ) -> (String, Vec<String>, (Option<Output>, bool)) {
        (
            program.to_string(),
            args.iter().map(|s| s.to_string()).collect(),
            make_output(success, stdout),
        )
    }

    #[test]
    fn test_format_date_dashed() {
        assert_eq!(
            format_date_dashed("2016:06:05 20:40:00"),
            "2016-06-05-20-40-00"
        );
        assert_eq!(
            format_date_dashed("2016-06-05 20:40:00"),
            "2016-06-05-20-40-00"
        );
        assert_eq!(
            format_date_dashed("  2023:12:25  08:30:45  "),
            "2023-12-25--08-30-45"
        );
        assert_eq!(
            format_date_dashed("2024-01-01T12:00:00"),
            "2024-01-01T12-00-00"
        );
    }

    #[test]
    fn test_get_date_string_fixture() {
        let date = get_date_string("tests/fixtures/IMG_0640.JPG");
        assert!(date.is_some());
        assert_eq!(date.unwrap(), "2016-06-05-20-40-00");
    }

    #[test]
    fn test_get_date_string_non_existing() {
        let date = get_date_string("tests/-/not-existing.jpg");
        assert!(date.is_none());
    }

    #[test]
    fn test_get_date_string_with_valid_fixture() {
        let date = get_date_string("tests/fixtures/IMG_0640.JPG");
        assert!(date.is_some());
        let date_str = date.unwrap();
        assert!(Regex::new(r"^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$")
            .unwrap()
            .is_match(&date_str));
    }

    #[test]
    fn test_file_metadata_fallback() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_date_fallback.txt");

        fs::write(&test_file, "test content").unwrap();

        let metadata = fs::metadata(&test_file).unwrap();
        let created = metadata.created().unwrap();
        let dt: DateTime<Local> = created.into();
        let expected = dt.format("%Y-%m-%d-%H-%M-%S").to_string();

        let date = get_date_string(&test_file);
        assert!(date.is_some());
        assert_eq!(date.unwrap(), expected);

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_format_date_dashed_edge_cases() {
        assert_eq!(format_date_dashed(""), "");
        assert_eq!(format_date_dashed("no-dates-here"), "no-dates-here");
        assert_eq!(format_date_dashed("2023:01:01"), "2023-01-01");
        assert_eq!(format_date_dashed("2023-01-01"), "2023-01-01");
    }

    // MediaInfo tests
    #[test]
    fn test_mediainfo_command_fails() {
        let runner = MockRunner::new(vec![mock_resp("mediainfo", &["-f", "test.jpg"], false, "")]);
        let result = get_date_string_mediainfo("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_mediainfo_no_date_lines() {
        let runner = MockRunner::new(vec![mock_resp(
            "mediainfo",
            &["-f", "test.jpg"],
            true,
            "General\nComplete name: test.jpg",
        )]);
        let result = get_date_string_mediainfo("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_mediainfo_file_date_skipped() {
        let runner = MockRunner::new(vec![mock_resp(
            "mediainfo",
            &["-f", "test.jpg"],
            true,
            "File created date: 2023:01:01 12:00:00",
        )]);
        let result = get_date_string_mediainfo("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_mediainfo_valid_date_found() {
        let runner = MockRunner::new(vec![mock_resp(
            "mediainfo",
            &["-f", "test.jpg"],
            true,
            "Encoded date: 2023:01:01 12:00:00",
        )]);
        let result = get_date_string_mediainfo("test.jpg", &runner);
        assert_eq!(result, Some("2023-01-01 12:00:00".to_string()));
    }

    // ExifTool tests
    #[test]
    fn test_exiftool_command_fails() {
        let runner = MockRunner::new(vec![mock_resp(
            "exiftool",
            &["-s3", "-createdate", "test.jpg"],
            false,
            "",
        )]);
        let result = get_date_string_exiftool("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_exiftool_empty_output() {
        let runner = MockRunner::new(vec![mock_resp(
            "exiftool",
            &["-s3", "-createdate", "test.jpg"],
            true,
            "",
        )]);
        let result = get_date_string_exiftool("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_exiftool_with_timezone() {
        let runner = MockRunner::new(vec![mock_resp(
            "exiftool",
            &["-s3", "-createdate", "test.jpg"],
            true,
            "2023:01:01 12:00:00+02:00",
        )]);
        let result = get_date_string_exiftool("test.jpg", &runner);
        assert_eq!(result, Some("2023:01:01 12:00:00".to_string()));
    }

    #[test]
    fn test_exiftool_timezone_only_result_empty() {
        let runner = MockRunner::new(vec![mock_resp(
            "exiftool",
            &["-s3", "-createdate", "test.jpg"],
            true,
            "+02:00",
        )]);
        let result = get_date_string_exiftool("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_exiftool_valid_date() {
        let runner = MockRunner::new(vec![mock_resp(
            "exiftool",
            &["-s3", "-createdate", "test.jpg"],
            true,
            "2023:01:01 12:00:00",
        )]);
        let result = get_date_string_exiftool("test.jpg", &runner);
        assert_eq!(result, Some("2023:01:01 12:00:00".to_string()));
    }

    // GraphicsMagick tests
    #[test]
    fn test_gm_command_fails() {
        let runner = MockRunner::new(vec![mock_resp(
            "gm",
            &["identify", "-format", "%[EXIF:DateTime]", "test.jpg"],
            false,
            "",
        )]);
        let result = get_date_string_graphicsmagick("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_gm_empty_output() {
        let runner = MockRunner::new(vec![mock_resp(
            "gm",
            &["identify", "-format", "%[EXIF:DateTime]", "test.jpg"],
            true,
            "",
        )]);
        let result = get_date_string_graphicsmagick("test.jpg", &runner);
        assert!(result.is_none());
    }

    #[test]
    fn test_gm_valid_date() {
        let runner = MockRunner::new(vec![mock_resp(
            "gm",
            &["identify", "-format", "%[EXIF:DateTime]", "test.jpg"],
            true,
            "2023:01:01 12:00:00",
        )]);
        let result = get_date_string_graphicsmagick("test.jpg", &runner);
        assert_eq!(result, Some("2023:01:01 12:00:00".to_string()));
    }

    // Integration tests for get_date_string_with_runner
    #[test]
    fn test_get_date_string_mediainfo_priority() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_mediainfo_priority.jpg");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![mock_resp(
            "mediainfo",
            &["-f", &path_str],
            true,
            "Encoded date: 2023:01:01 12:00:00",
        )]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert_eq!(result, Some("2023-01-01-12-00-00".to_string()));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_exiftool_fallback() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_exiftool_fallback.jpg");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", &path_str],
                true,
                "General\nComplete name: test.jpg",
            ),
            mock_resp(
                "exiftool",
                &["-s3", "-createdate", &path_str],
                true,
                "2023:01:01 12:00:00",
            ),
        ]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert_eq!(result, Some("2023-01-01-12-00-00".to_string()));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_gm_fallback() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_gm_fallback.jpg");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", &path_str],
                true,
                "General\nComplete name: test.jpg",
            ),
            mock_resp("exiftool", &["-s3", "-createdate", &path_str], true, ""),
            mock_resp(
                "gm",
                &["identify", "-format", "%[EXIF:DateTime]", &path_str],
                true,
                "2023:01:01 12:00:00",
            ),
        ]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert_eq!(result, Some("2023-01-01-12-00-00".to_string()));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_all_tools_fail_uses_fallback() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_all_fail.txt");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", &path_str],
                true,
                "General\nComplete name: test.jpg",
            ),
            mock_resp("exiftool", &["-s3", "-createdate", &path_str], true, ""),
            mock_resp(
                "gm",
                &["identify", "-format", "%[EXIF:DateTime]", &path_str],
                true,
                "",
            ),
        ]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert!(result.is_some());
        let date_str = result.unwrap();
        assert!(Regex::new(r"^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$")
            .unwrap()
            .is_match(&date_str));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_mediainfo_invalid_format_skips() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_invalid_format.jpg");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", &path_str],
                true,
                "Encoded date: not-a-date",
            ),
            mock_resp(
                "exiftool",
                &["-s3", "-createdate", &path_str],
                true,
                "2023:01:01 12:00:00",
            ),
        ]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert_eq!(result, Some("2023-01-01-12-00-00".to_string()));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_exiftool_not_starting_with_number() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_exiftool_nan.jpg");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", &path_str],
                true,
                "General\nComplete name: test.jpg",
            ),
            mock_resp(
                "exiftool",
                &["-s3", "-createdate", &path_str],
                true,
                "unknown date",
            ),
            mock_resp(
                "gm",
                &["identify", "-format", "%[EXIF:DateTime]", &path_str],
                true,
                "2023:01:01 12:00:00",
            ),
        ]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert_eq!(result, Some("2023-01-01-12-00-00".to_string()));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_gm_not_starting_with_number() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_gm_nan.jpg");
        fs::write(&test_file, "test").unwrap();
        let path_str = test_file.to_string_lossy().to_string();

        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", &path_str],
                true,
                "General\nComplete name: test.jpg",
            ),
            mock_resp("exiftool", &["-s3", "-createdate", &path_str], true, ""),
            mock_resp(
                "gm",
                &["identify", "-format", "%[EXIF:DateTime]", &path_str],
                true,
                "unknown",
            ),
        ]);
        let result = get_date_string_with_runner(&test_file, &runner);
        assert!(result.is_some());
        let date_str = result.unwrap();
        assert!(Regex::new(r"^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$")
            .unwrap()
            .is_match(&date_str));

        fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_get_date_string_final_none_when_no_metadata() {
        let runner = MockRunner::new(vec![
            mock_resp(
                "mediainfo",
                &["-f", "nonexistent.jpg"],
                true,
                "General\nComplete name: test.jpg",
            ),
            mock_resp(
                "exiftool",
                &["-s3", "-createdate", "nonexistent.jpg"],
                true,
                "",
            ),
            mock_resp(
                "gm",
                &["identify", "-format", "%[EXIF:DateTime]", "nonexistent.jpg"],
                true,
                "",
            ),
        ]);
        let result = get_date_string_with_runner("nonexistent.jpg", &runner);
        assert!(result.is_none());
    }
}
