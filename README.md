# image-flatify

> Take a directory, search image files recursively and rename them based on their creation time, producing a flat directory

[![Build Status](https://travis-ci.org/paazmaya/image-flatify.svg?branch=master)](https://travis-ci.org/paazmaya/image-flatify)
[![codecov](https://codecov.io/gh/paazmaya/image-flatify/branch/master/graph/badge.svg)](https://codecov.io/gh/paazmaya/image-flatify)

Got so fed up with mobile devices creating image files named `DCIM_01.JPG`
or similar, hence having the same filenames after importing them to my
computer.

One annoying example is Sony Xperia which saves burst images in separate folders
but the filenames inside those folders are always the same.

This tool will solve that step in the process when renaming and organising
images.

Please note that the minimum supported version of [Node.js](https://nodejs.org/en/) is `4.2.0`.

## Installation

Make sure to have [GraphicsMagick](http://www.graphicsmagick.org/) and [Mediainfo](https://mediaarea.net/en/MediaInfo)
available in the `PATH`.
They can be installed for example for Mac via [Brew](http://brew.sh):

```sh
brew install graphicsmagick mediainfo
```

Now install the command line tool globally, which might need increased privileges:

```sh
[sudo] npm install --global image-flatify
```

## Command line options

```sh
image-flatify --help
```

```sh
image-flatify [options] <directory>

  -h, --help                 Help and usage instructions
  -V, --version              Version number
  -v, --verbose              Verbose output, will print which file is currently being
                             processed
  -n, --dry-run              Try it out without actually touching anything
  -K, --keep-in-directories  Keep the renamed image files in their original directory
  -D, --no-delete-empty-directories  Do not delete any directories that become empty
                                     after processing

Version 0.5.0
```

### Example commands

The following command shows how the renaming would be done in the current directory, but it is
not done since the `--dry-run` option is used.

```sh
image-flatify -vn .
```

## Contributing

First thing to do is to file [an issue](https://github.com/paazmaya/image-flatify/issues).

[Please refer to a GitHub blog post on how to create somewhat perfect pull request.](https://github.com/blog/1943-how-to-write-the-perfect-pull-request "How to write the perfect pull request")

Then possibly open a Pull Request for solving the given issue.
[ESLint](http://eslint.org) is used for linting the code and unit testing is done with [tape](https://github.com/substack/tape).

Execute them by running:

```sh
npm install
npm test
```

## Version history

* `v0.6.0` (2016-)
  - Show only relative path when verbose #7
  - Option to lowercase file extension #6
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

Copyright (c) [Juga Paazmaya](http://paazmaya.fi) <paazmaya@yahoo.com>

