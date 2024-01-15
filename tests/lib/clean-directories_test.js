/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

import fs from 'node:fs';
import path from 'node:path';

import tape from 'tape';

import cleanDirectories, {cleanDirectory} from '../../lib/clean-directories.js';

tape('cleanDirectories - non existing single directory', (test) => {
  test.plan(1);

  const options = {
    dryRun: true
  };
  const dirs = ['tests/-/not-existing'];
  const output = cleanDirectories(dirs, options);

  test.notOk(output);
});

tape('cleanDirectories - removes directory', (test) => {
  test.plan(1);

  const tmpDir = path.join('tests', 'temporary-folder');

  try {
    fs.accessSync(tmpDir);
  }
  catch (error) {
    fs.mkdirSync(tmpDir);
  }

  const options = {
    dryRun: false,
    verbose: true
  };
  cleanDirectories([tmpDir, 'not-here'], options);

  try {
    fs.accessSync(tmpDir);
    test.fail();
  }
  catch (error) {
    test.pass();
  }
});

tape('cleanDirectories._cleanDirectory - does not remove when dry run, but tells about it', (test) => {
  test.plan(1);

  const tmpDir = path.join('tests', 'temporary-folder');

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
  cleanDirectory(tmpDir, options);

  try {
    fs.accessSync(tmpDir);
    test.pass();
  }
  catch (error) {
    test.fail();
  }
});

tape('cleanDirectories._cleanDirectory - removes directory', (test) => {
  test.plan(1);

  const tmpDir = path.join('tests', 'temporary-folder');

  try {
    fs.accessSync(tmpDir);
  }
  catch (error) {
    fs.mkdirSync(tmpDir);
  }

  const options = {
    dryRun: false,
    verbose: true
  };
  cleanDirectory(tmpDir, options);

  try {
    fs.accessSync(tmpDir);
    test.fail();
  }
  catch (error) {
    test.pass();
  }
});

tape('cleanDirectories._cleanDirectory - does not remove non empty directory', (test) => {
  test.plan(1);

  const directory = path.resolve('node_modules');

  const options = {
    dryRun: true,
    verbose: true
  };
  cleanDirectory(directory, options);

  try {
    fs.accessSync(directory);
    test.pass();
  }
  catch (error) {
    test.fail();
  }
});
