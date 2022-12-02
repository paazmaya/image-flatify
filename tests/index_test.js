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

import flatify from '../index.js';

tape('a function is exported', (test) => {
  test.plan(2);

  test.equal(typeof flatify, 'function');
  test.equal(flatify.length, 2, 'has two arguments');
});
