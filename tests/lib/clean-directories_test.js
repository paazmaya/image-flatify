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

const cleanDirectories = require('../../lib/clean-directories');

tape('cleanDirectories - non existing single directory', (test) => {
  test.plan(1);

  const options = {
    dryRun: true
  };
  const dirs = ['tests/-/not-existing'];
  const output = cleanDirectories(dirs, options);

  test.notOk(output);
});

tape('cleanDirectories._cleanDirectory - does not remove when dry run, but tells about it', (test) => {
  test.plan(1);

  const tmpDir = path.join(__dirname, 'temporary-folder');

  try {
    fs.accessSync(tmpDir);
  }
  catch (error) {
    fs.mkdirSync(tmpDir);
  }

  const options = {
    dryRun: true,
    verbose: true
  };
  cleanDirectories._cleanDirectory(tmpDir, options);

  test.ok(fs.existsSync(tmpDir));
});
