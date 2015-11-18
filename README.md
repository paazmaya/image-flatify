# image-flatify

> Take a directory, search image files recursively and rename them based on their creation time, producing a flat directory

Got so fed up with mobile devices creating image files named `DCIM_01.JPG`
or similar, hence having the same filenames after importing them to my
computer.

One annoying example is Sony Xperia which saves burst images in separate folders
but the filenames inside those folders are always the same.

This tool will solve that step in the process when renaming and organising
images.

Please note that the minimum supported version of [Node.js](https://nodejs.org/en/) is `4.2.0`.

## Installation

```sh
[sudo] npm install --global image-flatify
```

## Command line options

```sh
image-flatify --help
```

## Contributing

First thing to do is to file [an issue](https://github.com/paazmaya/image-foldarizer/issues).
Then possibly open a Pull Request for solving the given issue.
ESLint is used for linting the code, please use it by doing:

```sh
npm install
npm run lint
```

## Version history

* `v0.1.0` (2015-11-18) Gets the job simply done, hence first release

## License

Licensed under [the MIT license](LICENSE).

Copyright (c) [Juga Paazmaya](http://paazmaya.fi) <paazmaya@yahoo.com>

