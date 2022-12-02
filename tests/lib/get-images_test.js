/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

import tape from 'tape';

import getImages, {isMedia} from '../../lib/get-images.js';

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

  test.notOk(isMedia('hoplaa.js'));
  test.ok(isMedia('hoplaa.jpg'));
  test.ok(isMedia('hoplaa.jpeg'));
  test.ok(isMedia('hoplaa.mp4'));
  test.ok(isMedia('hoplaa.test.GIF'));
});
