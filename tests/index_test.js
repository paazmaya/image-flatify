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

import flatify from '../index.js';

tape('a function is exported', (test) => {
  test.plan(2);

  test.equal(typeof flatify, 'function');
  test.equal(flatify.length, 2, 'has two arguments');
});

tape('flatify - dry run without moving files', (test) => {
  test.plan(1);

  flatify(path.join('tests', 'fixtures'), {
    verbose: false,
    dryRun: true,
    keepInDirectories: false,
    prefix: '',
    appendHash: false,
    lowercaseSuffix: false,
    noDeleteEmptyDirectories: false
  });

  test.pass('Completed without error');
});

tape('flatify - dry run verbose', (test) => {
  test.plan(1);

  flatify(path.join('tests', 'fixtures'), {
    verbose: true,
    dryRun: true,
    keepInDirectories: false,
    prefix: '',
    appendHash: false,
    lowercaseSuffix: false,
    noDeleteEmptyDirectories: false
  });

  test.pass('Completed without error');
});

tape('flatify - dry run with keepInDirectories', (test) => {
  test.plan(1);

  flatify(path.join('tests', 'fixtures'), {
    verbose: false,
    dryRun: true,
    keepInDirectories: true,
    prefix: 'test-',
    appendHash: false,
    lowercaseSuffix: false,
    noDeleteEmptyDirectories: false
  });

  test.pass('Completed without error');
});

tape('flatify - from parent directory covers subdirectory tracking', (test) => {
  test.plan(1);

  // tests/ contains tests/fixtures/IMG_0640.JPG in a subdirectory
  flatify('tests', {
    verbose: false,
    dryRun: true,
    keepInDirectories: false,
    prefix: '',
    appendHash: false,
    lowercaseSuffix: false,
    noDeleteEmptyDirectories: false
  });

  test.pass('Completed without error');
});

tape('flatify - dry run with noDeleteEmptyDirectories', (test) => {
  test.plan(1);

  flatify('tests', {
    verbose: false,
    dryRun: true,
    keepInDirectories: false,
    prefix: '',
    appendHash: false,
    lowercaseSuffix: false,
    noDeleteEmptyDirectories: true
  });

  test.pass('Completed without error');
});

tape('flatify - actually moves files (non-dry-run)', (test) => {
  test.plan(2);

  const tmpDir = fs.mkdtempSync(path.join('tests', 'tmp-flatify-'));
  fs.copyFileSync(path.join('tests', 'fixtures', 'IMG_0640.JPG'), path.join(tmpDir, 'IMG_0640.JPG'));

  flatify(tmpDir, {
    verbose: false,
    dryRun: false,
    keepInDirectories: false,
    prefix: '',
    appendHash: false,
    lowercaseSuffix: false,
    noDeleteEmptyDirectories: false
  });

  const remaining = fs.readdirSync(tmpDir);
  test.notOk(remaining.includes('IMG_0640.JPG'), 'Original file was renamed');
  test.equal(remaining.length, 1, 'One renamed file exists');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true });
});
