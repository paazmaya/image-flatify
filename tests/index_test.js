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

const fs = require('fs'),
  path = require('path');

const tape = require('tape');

const flatify = require('../index');

tape('a function is exported', (test) => {
  test.plan(2);

  test.equal(typeof flatify, 'function');
  test.equal(flatify.length, 2, 'has two arguments');
});

tape('cleanDirectories - non existing single directory', (test) => {
  test.plan(1);

  const options = {
    dryRun: true
  };
  const dirs = ['tests/-/not-existing'];
  const output = flatify._cleanDirectories(dirs, options);

  test.notOk(output);
});
