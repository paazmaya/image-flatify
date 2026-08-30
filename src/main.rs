//! CLI entry point for image-flatify.

use clap::Parser;
use std::path::PathBuf;
use std::process;
use which::which;

use image_flatify::{flatify, FlatifyOptions};

#[derive(Parser, Debug)]
#[command(
    name = "image-flatify",
    version,
    about = "Take a directory, search images recursively and rename as single flat directory with date based filenames",
    after_help = "Version 6.0.0"
)]
struct Cli {
    /// Verbose output, will print which file is currently being processed
    #[arg(short = 'v', long = "verbose")]
    verbose: bool,

    /// Try it out without actually touching anything
    #[arg(short = 'n', long = "dry-run")]
    dry_run: bool,

    /// Keep the renamed image files in their original directory
    #[arg(short = 'K', long = "keep-in-directories")]
    keep_in_directories: bool,

    /// Prefix for the resulting filename, default empty
    #[arg(short = 'p', long = "prefix", default_value = "")]
    prefix: String,

    /// Always append a hash string to the filename instead of a possible counter
    #[arg(short = 'a', long = "append-hash")]
    append_hash: bool,

    /// Lowercase the resulting file suffixes, or use as is by default
    #[arg(short = 'l', long = "lowercase-suffix")]
    lowercase_suffix: bool,

    /// Do not delete any directories that become empty after processing
    #[arg(short = 'D', long = "no-delete-empty-directories")]
    no_delete_empty_directories: bool,

    /// Directory or directories to process
    #[arg(required = true, value_name = "DIRECTORY")]
    directories: Vec<PathBuf>,
}

fn check_external_tools() {
    if which("mediainfo").is_err() {
        eprintln!(
            "Warning: MediaInfo is not available. Date detection will use exiftool or GraphicsMagick modification time as fallback."
        );
    }
    if which("exiftool").is_err() {
        eprintln!(
            "Warning: ExifTool is not available. Date detection will use GraphicsMagick or file modification time as fallback."
        );
    }
    if which("gm").is_err() {
        eprintln!(
            "Warning: GraphicsMagick is not available. Date detection will use file modification time as fallback."
        );
    }
}

fn main() {
    let cli = Cli::parse();

    // Check directory existence upfront
    for dir in &cli.directories {
        if !dir.exists() {
            eprintln!("Directory ({}) does not exist", dir.display());
            process::exit(1);
        }
    }

    check_external_tools();

    let options = FlatifyOptions {
        verbose: cli.verbose,
        dry_run: cli.dry_run,
        keep_in_directories: cli.keep_in_directories,
        prefix: cli.prefix,
        append_hash: cli.append_hash,
        lowercase_suffix: cli.lowercase_suffix,
        no_delete_empty_directories: cli.no_delete_empty_directories,
    };

    for dir in cli.directories {
        flatify(dir, &options);
    }
}
