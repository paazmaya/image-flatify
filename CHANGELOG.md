# Version history for image-flatify

This changelog covers the version history and possible upcoming changes.
It follows the guidance from https://keepachangelog.com/en/1.0.0/.

## Unreleased
- Minimum supported Node.js version lifted from `10.13.0` to `14.15.0`

## `v2.0.3` (2021-03-02)
- Need to migrate all but one test execution away from Travis CI due to free account limitations
- Now using GitHub Actions to execute tests with Node.js v14
- Fix showing the number of possibly affected files in dry run
- Include files with the `3gp` suffix in the process

## `v2.0.2` (2020-08-24)
- Perhaps does not fail as often with getting MediaInfo installation status

## `v2.0.1` (2020-07-20)
- Dependencies updated, as usual
- Try to allow `mediainfo` exiting with non-zero value, even when it succeeds
- Run tests also against Node.js version 14. Now versions 10 (Travis), 12 (AppVeyor), and 14 (Travis) of Node.js are covered

## `v2.0.0` (2020-02-01)
- Minimum Node.js version lifted from `8.11.1` to `10.13.0`
- Now always printing the total number of files touched, verbose or not

## `v1.1.0` (2018-11-10)
- Use [`npm-shrinkwrap.json`](https://docs.npmjs.com/files/shrinkwrap.json) for locking the working set of 3rd party dependencies
- `mediainfo` exists with non-zero exit code when not used with a file, hence have to tests is existence by checking against an existing file
- Include `mkv` extension to the list of possibly processed files

## `v1.0.0` (2018-11-09)
- Check that both `mediainfo` and `gm` are available before trying anything
- More code coverage, so about time to make first major release

## `v0.9.0` (2018-05-14)
- Minimum Node.js version lifted from `6.9.5` to `8.11.1`
- Randomise hash suffix in order to avoid accidental overwriting
- Achieve `91%` code coverage #1

## `v0.8.0` (2017-07-10)
- Add option to include a hash to the filename before the suffix #3
- More than one directory can be given as a command line input
- Minimum Node.js version lifted from `4.2.0` to `6.9.5`
- Print the number of possibly affected files, also when dry-run

## `v0.7.1` (2016-09-26)
- When not defining `prefix` option, it became `undefined` in the output filename

## `v0.7.0` (2016-09-11)
- Option to prefix resulting filename #9

## `v0.6.2` (2016-08-09)
- Move code coverage from `instanbul` to `nyc`
- Test also in Windows, at [AppVeyor](https://ci.appveyor.com/project/paazmaya/image-flatify)
- Testing command line interface

## `v0.6.1` (2016-05-13)
- Must be relative to the given directory

## `v0.6.0` (2016-05-13)
- Show only relative path when verbose #7
- Option to lowercase file extension #6
- Total number of renamed files #5

## `v0.5.0` (2016-05-12)
- Using shared ESLint configuration #4
- `.mov` extension also included

## `v0.4.0` (2016-02-10)
- Trying to use `mediainfo` when GraphicsMagick does not provide any reasonable value

## `v0.3.1` (2016-02-03)
- Reduce linting warnings while separating logic slightly

## `v0.3.0` (2016-02-01)
- Using GraphicsMagick for getting the creation date when possible

## `v0.2.0` (2016-02-01)
- Include other media files in addition to image files

## `v0.1.0` (2015-11-18)
- Gets the job simply done, hence first release
