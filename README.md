# image-flatify

> Take a directory, search image files recursively and rename them based on their creation time, producing a flat directory

[![Windows build status](https://ci.appveyor.com/api/projects/status/h561l3h2l26aobr1/branch/master?svg=true)](https://ci.appveyor.com/project/paazmaya/image-flatify/branch/master)
[![Node.js CI](https://github.com/paazmaya/image-flatify/actions/workflows/linting-and-unit-testing.yml/badge.svg)](https://github.com/paazmaya/image-flatify/actions/workflows/linting-and-unit-testing.yml)
[![codecov](https://codecov.io/gh/paazmaya/image-flatify/branch/master/graph/badge.svg)](https://codecov.io/gh/paazmaya/image-flatify)
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
    Start([User runs<br/>image-flatify]) --> ParseArgs[Parse CLI arguments<br/>src/main.rs]

    ParseArgs --> CheckDeps{Check external<br/>dependencies}
    CheckDeps -->|mediainfo| CheckDeps
    CheckDeps -->|exiftool| CheckDeps
    CheckDeps -->|graphicsmagick| LoopDirs

    LoopDirs[For each input directory] --> Flatify[Call flatify()<br/>src/flatify.rs]

    Flatify --> GetImages[get_images()<br/>src/finder.rs]

    GetImages --> ReadDir[Read directory<br/>recursively via WalkDir]
    ReadDir --> FilterMedia{Filter by media<br/>extensions<br/>src/media.rs}
    FilterMedia -->|Image/Video file| Collect[Add to file list]
    FilterMedia -->|Subdirectory| ReadDir
    FilterMedia -->|Other| Skip[Skip]

    Collect --> FlatifyLoop[For each file found]

    FlatifyLoop --> TrackDir[Track source<br/>directory]
    TrackDir --> GetTarget[get_target_path()<br/>src/naming.rs]

    GetTarget --> GetDate[get_date_string()<br/>src/date.rs]

    GetDate --> TryMediaInfo{Try<br/>mediainfo}
    TryMediaInfo -->|Success| FormatDate[Format date string]
    TryMediaInfo -->|Fail| TryExif{Try<br/>exiftool}
    TryExif -->|Success| FormatDate
    TryExif -->|Fail| TryGM{Try<br/>graphicsmagick}
    TryGM -->|Success| FormatDate
    TryGM -->|Fail| UseMtime[Use file<br/>metadata timestamp]
    UseMtime --> FormatDate

    FormatDate --> BuildName[Build target filename:<br/>prefix + date + ext]
    BuildName --> HandleDup{Handle duplicates}
    HandleDup -->|appendHash| AddHash[Append MD5 hash]
    HandleDup -->|counter| Increment[Add counter<br/>_1, _2, ...]

    AddHash --> FinalPath[Final target path]
    Increment --> FinalPath

    FinalPath --> MoveFile{Rename/move file<br/>unless dry-run}
    MoveFile --> NextFile{More files?}
    NextFile -->|Yes| FlatifyLoop
    NextFile -->|No| CleanDirs[clean_directories()<br/>src/cleaner.rs]

    CleanDirs --> SortDirs[Sort by path length<br/>deepest first]
    CleanDirs --> CleanLoop[For each tracked dir]
    CleanLoop --> IsEmpty{Directory<br/>empty?}
    IsEmpty -->|Yes| Rmdir[Remove directory]
    IsEmpty -->|No| KeepDir[Keep directory]
    Rmdir --> NextDir{More dirs?}
    KeepDir --> NextDir
    NextDir -->|Yes| CleanLoop
    NextDir -->|No| Report[Report results]

    Report --> End([Done])
```

Please note that the minimum supported version of [Node.js](https://nodejs.org/en/) is `24.12.0`, which is [the active Long Term Support (LTS) version](https://github.com/nodejs/Release#release-schedule).

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
winget install MediaArea.MediaInfo.CLI
winget install PhilHarvey.ExifTool
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
  -l, --lowercase-suffix             Lowercase the resulting file suffixes, or use as is by default
  -D, --no-delete-empty-directories  Do not delete any directories that become empty after processing
  -h, --help                         Print help
  -V, --version                      Print version

Version 6.0.0
```

### Example commands

The following command shows how the renaming would be done in the current directory, but it is
not done since the `--dry-run` option is used.

```sh
image-flatify -vn .
```

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
