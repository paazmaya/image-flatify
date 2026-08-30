//! image-flatify
//! Take a directory, search images recursively and rename as single flat directory with date based filenames.

pub mod cleaner;
pub mod date;
pub mod finder;
pub mod flatify;
pub mod media;
pub mod naming;

pub use cleaner::{clean_directories, clean_directory};
pub use date::{
    get_date_string, get_date_string_exiftool, get_date_string_graphicsmagick,
    get_date_string_mediainfo,
};
pub use finder::get_images;
pub use flatify::flatify;
pub use media::is_media;
pub use naming::get_target_path;

/// Options for configuring image-flatify execution.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct FlatifyOptions {
    /// Print out verbose information about current process.
    pub verbose: bool,
    /// Try it out without touching any files.
    pub dry_run: bool,
    /// Keep renamed files in their original directories.
    pub keep_in_directories: bool,
    /// Prefix for the resulting filename.
    pub prefix: String,
    /// Always append a hash string to the filename instead of a counter.
    pub append_hash: bool,
    /// Lowercase the resulting file suffixes.
    pub lowercase_suffix: bool,
    /// Do not delete any empty directories.
    pub no_delete_empty_directories: bool,
}
