# image-flatify

> Take a directory, search image files recursively and rename them based on their creation time, producing a flat directory

[![Build Status](https://travis-ci.org/paazmaya/image-flatify.svg?branch=master)](https://travis-ci.org/paazmaya/image-flatify)
[![Windows build status](https://ci.appveyor.com/api/projects/status/h561l3h2l26aobr1/branch/master?svg=true)](https://ci.appveyor.com/project/paazmaya/image-flatify/branch/master)
[![codecov](https://codecov.io/gh/paazmaya/image-flatify/branch/master/graph/badge.svg)](https://codecov.io/gh/paazmaya/image-flatify)
[![dependencies Status](https://david-dm.org/paazmaya/image-flatify/status.svg)](https://david-dm.org/paazmaya/image-flatify)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify?ref=badge_shield)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=paazmaya_image-flatify&metric=code_smells)](https://sonarcloud.io/dashboard?id=paazmaya_image-flatify)

Got so fed up with mobile devices creating image files named `DCIM_01.JPG`
or similar, hence having the same filenames after importing them to my
computer.

One annoying example is Sony Xperia which saves burst images in separate folders
but the filenames inside those folders are always the same.

This tool will solve that step in the process when renaming and organising images.

The given directory will be searched recursively for media files and they all will be renamed to the given directory.
Those directories which are touched during the operation, in case they will be empty after the rename, the directory will be renamed.

Please note that the minimum supported version of [Node.js](https://nodejs.org/en/) is `10.13.0`, which is [the active Long Term Support (LTS) version](https://github.com/nodejs/Release#release-schedule).

See also [`image-foldarizer`](https://github.com/paazmaya/image-foldarizer) for organising images by their names and counter numbers.

## Installation

Make sure to have both [GraphicsMagick](http://www.graphicsmagick.org/) and
[Mediainfo](https://mediaarea.net/en/MediaInfo) available in the `PATH` environment variable.

The versions supported (tested via automation) are
[GraphicsMagick `1.3.31`](http://www.graphicsmagick.org/NEWS.html)
and [MediaInfo `18.08`](https://mediaarea.net/MediaInfo/ChangeLog).
Other versions should work...

They can be installed for example for macOS via [Brew](http://brew.sh):

```sh
brew install graphicsmagick mediainfo
```

In Ubuntu Linux it can be done with command:

```sh
sudo apt-get install graphicsmagick mediainfo
```

In Windows, the applications need to be downloaded from their sites and once installed,
their installation paths should be added in the `Path` system environment variable.

Now install the `image-flatify` command line tool globally, which might need increased privileges:

```sh
[sudo] npm install --global image-flatify
```

## Command line options

```sh
image-flatify --help
```

```sh
image-flatify [options] <directory> [more directories]

  -h, --help                 Help and usage instructions
  -V, --version              Version number
  -v, --verbose              Verbose output, will print which file is currently being processed
  -n, --dry-run              Try it out without actually touching anything
  -K, --keep-in-directories  Keep the renamed image files in their original directory
  -p, --prefix String        Prefix for the resulting filename, default empty
  -a, --append-hash          Always append a hash string to the filename instead of a possible counter
  -l, --lowercase-suffix     Lowercase the resulting file suffixes, or use as is by default
  -D, --no-delete-empty-directories  Do not delete any directories that become empty after processing

Version 2.0.0
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

Linting is done with [ESLint](http://eslint.org) and can be executed with `npm run lint`.
There should be no errors appearing after any JavaScript file changes.

Unit tests are written with [`tape`](https://github.com/substack/tape) and can be executed with `npm test`.

Code coverage is inspected with [`nyc`](https://github.com/istanbuljs/nyc) and
can be executed with `npm run coverage` after running `npm test`.
Please make sure it is over 90% at all times.

## Version history

* `v2.0.2` (2020-08-24)
  - Perhaps does not fail as often with getting MediaInfo installation status
* `v2.0.1` (2020-07-20)
  - Dependencies updated, as usual
  - Try to allow `mediainfo` exiting with non-zero value, even when it succeeds
  - Run tests also against Node.js version 14. Now versions 10 (Travis), 12 (AppVeyor), and 14 (Travis) of Node.js are covered
* `v2.0.0` (2020-02-01)
  - Minimum Node.js version lifted from `8.11.1` to `10.13.0`
  - Now always printing the total number of files touched, verbose or not
* `v1.1.0` (2018-11-10)
  - Use [`npm-shrinkwrap.json`](https://docs.npmjs.com/files/shrinkwrap.json) for locking the working set of 3rd party dependencies
  - `mediainfo` exists with non-zero exit code when not used with a file, hence have to tests is existence by checking against an existing file
  - Include `mkv` extension to the list of possibly processed files
* `v1.0.0` (2018-11-09)
  - Check that both `mediainfo` and `gm` are available before trying anything
  - More code coverage, so about time to make first major release
* `v0.9.0` (2018-05-14)
  - Minimum Node.js version lifted from `6.9.5` to `8.11.1`
  - Randomise hash suffix in order to avoid accidental overwriting
  - Achieve `91%` code coverage #1
* `v0.8.0` (2017-07-10)
  - Add option to include a hash to the filename before the suffix #3
  - More than one directory can be given as a command line input
  - Minimum Node.js version lifted from `4.2.0` to `6.9.5`
  - Print the number of possibly affected files, also when dry-run
* `v0.7.1` (2016-09-26)
  - When not defining `prefix` option, it became `undefined` in the output filename
* `v0.7.0` (2016-09-11)
  - Option to prefix resulting filename #9
* `v0.6.2` (2016-08-09)
  - Move code coverage from `instanbul` to `nyc`
  - Test also in Windows, at [AppVeyor](https://ci.appveyor.com/project/paazmaya/image-flatify)
  - Testing command line interface
* `v0.6.1` (2016-05-13)
  - Must be relative to the given directory
* `v0.6.0` (2016-05-13)
  - Show only relative path when verbose #7
  - Option to lowercase file extension #6
  - Total number of renamed files #5
* `v0.5.0` (2016-05-12)
  - Using shared ESLint configuration #4
  - `.mov` extension also included
* `v0.4.0` (2016-02-10)
  - Trying to use `mediainfo` when GraphicsMagick does not provide any reasonable value
* `v0.3.1` (2016-02-03)
  - Reduce linting warnings while separating logic slightly
* `v0.3.0` (2016-02-01)
  - Using GraphicsMagick for getting the creation date when possible
* `v0.2.0` (2016-02-01)
  - Include other media files in addition to image files
* `v0.1.0` (2015-11-18)
  - Gets the job simply done, hence first release

## License

Licensed under [the MIT license](LICENSE).

Copyright (c) [Juga Paazmaya](https://paazmaya.fi) <paazmaya@yahoo.com>

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fpaazmaya%2Fimage-flatify?ref=badge_large)
