# image-flatify

> Take a directory, search image files recursively and rename them based on their creation time, producing a flat directory

[![Rust CI](https://github.com/paazmaya/image-flatify/actions/workflows/linting-and-unit-testing.yml/badge.svg)](https://github.com/paazmaya/image-flatify/actions/workflows/linting-and-unit-testing.yml)
[![codecov](https://codecov.io/gh/paazmaya/image-flatify/branch/main/graph/badge.svg)](https://codecov.io/gh/paazmaya/image-flatify)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify?ref=badge_shield)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=paazmaya_image-flatify&metric=code_smells)](https://sonarcloud.io/dashboard?id=paazmaya_image-flatify)

Got so fed up with mobile devices creating image files named `DCIM_01.JPG`
or similar, hence having the same filenames after importing them to my
computer.

One annoying example is Sony Xperia which saves burst images in separate folders
but the filenames inside those folders are always the same.

This tool will solve that step in the process when renaming and organising images.

The given directory will be searched recursively for media files and they all will be renamed to the given directory.
Those directories which are touched during the operation, in case they will be empty after the rename, will be deleted.

```mermaid
flowchart TD
    Start([User runs image-flatify]) --> ParseArgs[Parse CLI arguments src/main.rs]

    ParseArgs --> CheckDeps{Check external dependencies}
    CheckDeps -->|mediainfo| CheckDeps
    CheckDeps -->|exiftool| CheckDeps
    CheckDeps -->|graphicsmagick| LoopDirs

    LoopDirs[For each input directory] --> Flatify[Call flatify() src/flatify.rs]

    Flatify --> GetImages[get_images() src/finder.rs]

    GetImages --> ReadDir[Read directory recursively via WalkDir]
    ReadDir --> FilterMedia{Filter by media extensions src/media.rs}
    FilterMedia -->|Image/Video file| Collect[Add to file list]
    FilterMedia -->|Subdirectory| ReadDir
    FilterMedia -->|Other| Skip[Skip]

    Collect --> FlatifyLoop[For each file found]

    FlatifyLoop --> TrackDir[Track source directory]
    TrackDir --> GetTarget[get_target_path() src/naming.rs]

    GetTarget --> GetDate[get_date_string() src/date.rs]

    GetDate --> TryMediaInfo{Try mediainfo}
    TryMediaInfo -->|Success| FormatDate[Format date string]
    TryMediaInfo -->|Fail| TryExif{Try exiftool}
    TryExif -->|Success| FormatDate
    TryExif -->|Fail| TryGM{Try graphicsmagick}
    TryGM -->|Success| FormatDate
    TryGM -->|Fail| UseMtime[Use file metadata timestamp]
    UseMtime --> FormatDate

    FormatDate --> BuildName[Build target filename: prefix + date + ext]
    BuildName --> HandleDup{Handle duplicates}
    HandleDup -->|appendHash| AddHash[Append MD5 hash]
    HandleDup -->|counter| Increment[Add counter _1, _2, ...]

    AddHash --> FinalPath[Final target path]
    Increment --> FinalPath

    FinalPath --> MoveFile{Rename/move file unless dry-run}
    MoveFile --> NextFile{More files?}
    NextFile -->|Yes| FlatifyLoop
    NextFile -->|No| CleanDirs[clean_directories() src/cleaner.rs]

    CleanDirs --> SortDirs[Sort by path length deepest first]
    CleanDirs --> CleanLoop[For each tracked dir]
    CleanLoop --> IsEmpty{Directory empty?}
    IsEmpty -->|Yes| Rmdir[Remove directory]
    IsEmpty -->|No| KeepDir[Keep directory]
    Rmdir --> NextDir{More dirs?}
    KeepDir --> NextDir
    NextDir -->|Yes| CleanLoop
    NextDir -->|No| Report[Report results]

    Report --> End([Done])
```

See also [`image-foldarizer`](https://github.com/paazmaya/image-foldarizer) for organising images by their names and counter numbers.

## Installation

### External Tools

Make sure to have [MediaInfo](https://mediaarea.net/en/MediaInfo), [ExifTool](https://exiftool.org/),
and [GraphicsMagick](http://www.graphicsmagick.org/) available in your `PATH` environment variable.

The date of each media file is determined by trying these tools in order:

1. **MediaInfo** — fastest, works with many media formats
2. **ExifTool** — broad EXIF support across image and video types
3. **GraphicsMagick** — fallback for image files
4. **File modification time** — last resort when none of the above produce a result

The versions supported (tested via automation) are
[GraphicsMagick `1.3.42`](http://www.graphicsmagick.org/NEWS.html),
[MediaInfo `24.01`](https://mediaarea.net/MediaInfo/ChangeLog),
and [ExifTool `12`](https://exiftool.org/history.html).
Other versions should work...

They can be installed for example for macOS via [Brew](http://brew.sh):

```sh
brew install graphicsmagick mediainfo exiftool
```

In Ubuntu Linux it can be done with command:

```sh
sudo apt-get install graphicsmagick mediainfo libimage-exiftool-perl
```

In Windows, the applications can be installed via package managers such as `winget`:

```powershell
winget install MediaArea.MediaInfo
winget install OliverBetz.ExifTool
```

### Install CLI binary

Install `image-flatify` using Cargo:

```sh
cargo install image-flatify
```

Or build and install from source:

```sh
git clone https://github.com/paazmaya/image-flatify.git
cd image-flatify
cargo build --release
```

## Command line options

```sh
image-flatify --help
```

```text
Take a directory, search images recursively and rename as single flat directory with date based filenames

Usage: image-flatify [OPTIONS] <DIRECTORY>...

Arguments:
  <DIRECTORY>...  Directory or directories to process

Options:
  -v, --verbose                      Verbose output, will print which file is currently being processed
  -n, --dry-run                      Try it out without actually touching anything
  -K, --keep-in-directories          Keep the renamed image files in their original directory
  -p, --prefix <PREFIX>              Prefix for the resulting filename, default empty [default: ""]
  -a, --append-hash                  Always append a hash string to the filename instead of a possible counter
  -d, --append-date                  Append the ISO date part (YYYY-MM-DD) to the original file basename instead of replacing it
  -l, --lowercase-suffix             Lowercase the resulting file suffixes, or use as is by default
  -D, --no-delete-empty-directories  Do not delete any directories that become empty after processing
  -h, --help                         Print help
  -V, --version                      Print version

Version 6.1.0
```

### Examples

The examples below use `photos/album/DCIM_01.JPG`, with a detected date of
`2026-09-24 13:45:06`. Unless noted otherwise, image-flatify moves the file to the
input directory and names it `2026-09-24-13-45-06.JPG`. The original extension
case is preserved by default.

| Option                                | Example command                                      | Result                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `<DIRECTORY>`                         | `image-flatify photos`                               | `photos/2026-09-24-13-45-06.JPG`                                                                                                      |
| Multiple directories                  | `image-flatify photos holiday-photos`                | Processes both directories independently; for example, `photos/2026-09-24-13-45-06.JPG` and `holiday-photos/2026-09-24-13-45-06.JPG`. |
| `-v`, `--verbose`                     | `image-flatify --verbose photos`                     | Same filename; prints each source-to-target move.                                                                                     |
| `-n`, `--dry-run`                     | `image-flatify --dry-run photos`                     | Same proposed filename; does not move files or delete directories.                                                                    |
| `-K`, `--keep-in-directories`         | `image-flatify -K photos`                            | `photos/album/2026-09-24-13-45-06.JPG`; keeps the renamed file in its source directory.                                               |
| `-p`, `--prefix <PREFIX>`             | `image-flatify --prefix trip- photos`                | `photos/trip-2026-09-24-13-45-06.JPG`                                                                                                 |
| `-a`, `--append-hash`                 | `image-flatify -a photos`                            | `photos/2026-09-24-13-45-06_<32-character-lowercase-hex-hash>.JPG`; the hash varies between runs.                                     |
| `-d`, `--append-date`                 | `image-flatify --append-date photos`                 | `photos/DCIM_01_2026-09-24.JPG`; appends the ISO date to the original basename instead of replacing it with the full timestamp.       |
| `-l`, `--lowercase-suffix`            | `image-flatify -l photos`                            | `photos/2026-09-24-13-45-06.jpg`                                                                                                      |
| `-D`, `--no-delete-empty-directories` | `image-flatify --no-delete-empty-directories photos` | Same filename as the default; leaves source directories in place even if they become empty.                                           |
| `-h`, `--help`                        | `image-flatify --help`                               | Prints usage and options; does not process files.                                                                                     |
| `-V`, `--version`                     | `image-flatify --version`                            | Prints the program version; does not process files.                                                                                   |

If a target filename already exists, the default behavior appends a counter before
the extension, for example `2026-09-24-13-45-06_1.JPG`. `--append-hash` uses a
hash suffix instead of this counter.

Options can be combined. For example, this previews a prefixed filename with a
lowercase extension and prints each proposed move without changing any files:

```sh
image-flatify --verbose --dry-run --prefix trip- --lowercase-suffix photos
```

The proposed output path is `photos/trip-2026-09-24-13-45-06.jpg`.

## Contributing

First thing to do is to file [an issue](https://github.com/paazmaya/image-flatify/issues).

["A Beginner's Guide to Open Source: The Best Advice for Making your First Contribution"](http://www.erikaheidi.com/blog/a-beginners-guide-to-open-source-the-best-advice-for-making-your-first-contribution/).

[Also there is a blog post about "45 Github Issues Dos and Don’ts"](https://davidwalsh.name/45-github-issues-dos-donts).

Format code with `cargo fmt` and run linter checks with `cargo clippy`:

```sh
cargo fmt
cargo clippy -- -D warnings
```

Run test suite:

```sh
cargo test
```

## Version history

[Changes happening across different versions and upcoming changes are tracked in the `CHANGELOG.md` file.](CHANGELOG.md)

## License

Licensed under [the MIT license](LICENSE).

Copyright (c) [Juga Paazmaya](https://paazmaya.fi) <paazmaya@yahoo.com>

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify?ref=badge_large)
