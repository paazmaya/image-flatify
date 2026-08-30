//! Date string extraction module using 3rd-party CLI tools (MediaInfo, ExifTool, GraphicsMagick) and filesystem metadata.

use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use regex::Regex;
use std::fs;
use std::path::Path;
use std::process::Command;

/// Format raw date string by replacing colons and whitespace with dashes.
fn format_date_dashed(raw: &str) -> String {
    let re = Regex::new(r"[:\s]").expect("valid regex");
    re.replace_all(raw.trim(), "-").to_string()
}

/// Extract date using MediaInfo CLI.
pub fn get_date_string_mediainfo<P: AsRef<Path>>(filepath: P) -> Option<String> {
    let path = filepath.as_ref();
    let output = Command::new("mediainfo")
        .arg("-f")
        .arg(path)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let date_pattern = Regex::new(r"(?i)(\d{4}[-:]\d{2}[-:]\d{2})[ T](\d{2}:\d{2}:\d{2})").ok()?;

    let mut candidates: Vec<(i64, String)> = Vec::new();

    for line in stdout.lines() {
        if line.to_ascii_lowercase().contains("date") {
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
pub fn get_date_string_exiftool<P: AsRef<Path>>(filepath: P) -> Option<String> {
    let path = filepath.as_ref();
    let output = Command::new("exiftool")
        .arg("-s3")
        .arg("-createdate")
        .arg(path)
        .output()
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
pub fn get_date_string_graphicsmagick<P: AsRef<Path>>(filepath: P) -> Option<String> {
    let path = filepath.as_ref();
    let output = Command::new("gm")
        .arg("identify")
        .arg("-format")
        .arg("%[EXIF:DateTime]")
        .arg(path)
        .output()
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
    let path = filepath.as_ref();

    if !path.exists() {
        eprintln!("File {} did not exists", path.display());
        return None;
    }

    let starts_with_number = Regex::new(r"^\d+").expect("valid regex");

    // 1. MediaInfo
    if let Some(date) = get_date_string_mediainfo(path) {
        if starts_with_number.is_match(&date) {
            return Some(format_date_dashed(&date));
        }
    }

    // 2. ExifTool
    if let Some(date) = get_date_string_exiftool(path) {
        if starts_with_number.is_match(&date) {
            return Some(format_date_dashed(&date));
        }
    }

    // 3. GraphicsMagick
    if let Some(date) = get_date_string_graphicsmagick(path) {
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
}
