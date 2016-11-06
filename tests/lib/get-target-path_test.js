/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

const tape = require('tape');

const getTargetPath = require('../../lib/get-target-path');

tape('getTargetPath - Uses prefix and lowercases', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    prefix: 'hoplaa-',
    lowercaseSuffix: true
  };
  const output = getTargetPath(destDir, filepath, options);

  test.equal(output, 'hoplaa-2016-06-05-20-40-00.jpg', 'Target filename has prefix');
});

tape('getTargetPath - Keep suffix as is', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    lowercaseSuffix: false
  };
  const output = getTargetPath(destDir, filepath, options);

  test.equal(output, '2016-06-05-20-40-00.JPG', 'Target filename has uppercase suffix');
});
