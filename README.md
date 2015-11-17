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

Either ImageMagick or GraphicsMagick needs to be available via `PATH`
environment, since it used used by [the `gm` module](https://www.npmjs.com/package/gm),
which is used for retrieving the image creation time.


### License

Licensed under [the MIT license](LICENSE).

Copyright (c) [Juga Paazmaya](http://paazmaya.fi) <paazmaya@yahoo.com>

