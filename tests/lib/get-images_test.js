/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */



const tape = require('tape');

const getImages = require('../../lib/get-images');

tape('getImages - got one image in sub directory', (test) => {
  test.plan(1);

  const output = getImages('tests', {});

  test.equal(output.length, 2);
});

tape('getImages - got no images', (test) => {
  test.plan(1);

  const output = getImages('not even existing', {});

  test.equal(output.length, 0);
});

tape('isMedia', (test) => {
  test.plan(5);

  test.notOk(getImages._isMedia('hoplaa.js'));
  test.ok(getImages._isMedia('hoplaa.jpg'));
  test.ok(getImages._isMedia('hoplaa.jpeg'));
  test.ok(getImages._isMedia('hoplaa.mp4'));
  test.ok(getImages._isMedia('hoplaa.test.GIF'));
});
