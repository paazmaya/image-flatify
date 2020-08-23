/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

const path = require('path');

const tape = require('tape');

const getTargetPath = require('../../lib/get-target-path');

tape('getTargetPath - Uses prefix', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    prefix: 'hoplaa-'
  };
  const output = getTargetPath(destDir, filepath, options);

  test.equal(output, 'hoplaa-2016-06-05-20-40-00.JPG');
});

tape('getTargetPath - Uses prefix and lowercases', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    prefix: 'hoplaa-',
    lowercaseSuffix: true
  };
  const output = getTargetPath(destDir, filepath, options);

  test.equal(output, 'hoplaa-2016-06-05-20-40-00.jpg');
});

tape('getTargetPath - Uses prefix, hash and lowercases', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    prefix: 'hoplaa-',
    appendHash: true,
    lowercaseSuffix: true
  };
  const output = getTargetPath(destDir, filepath, options);

  // Something like hoplaa-2016-06-05-20-40-00_1e7712e1b543b324baa6bd6b101b4dc3.jpg
  test.equal(output.length, 63, 'Target filename has a length of containing the hash');
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

tape('getTargetPath - Add hash before suffix', (test) => {
  test.plan(2);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    appendHash: true
  };
  const output = getTargetPath(destDir, filepath, options);

  // Something like 2016-06-05-20-40-00_706e885f464419f27ebe952861e43d25.JPG
  test.equal(output.length, 56, 'Target filename has a length of containing the hash');
  test.ok(output.indexOf('2016-06-05-20-40-00_') === 0);
});

tape('getTargetPath - Add hash before suffix while lowercased suffix', (test) => {
  test.plan(3);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    lowercaseSuffix: true,
    appendHash: true
  };
  const output = getTargetPath(destDir, filepath, options);

  // Something like 2016-06-05-20-40-00_706e885f464419f27ebe952861e43d25.jpg
  test.equal(output.length, 56, 'Target filename has a length of containing the hash');
  test.ok(output.indexOf('2016-06-05-20-40-00_') === 0);
  test.equal(output.indexOf('.jpg'), 52);
});

tape('getTargetPath - Source not existing', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/not-here.png';
  const options = {
    lowercaseSuffix: true
  };
  const output = getTargetPath(destDir, filepath, options);

  test.notOk(output);
});

tape('getTargetPath - Destination exists, so adding a counter', (test) => {
  test.plan(1);

  const destDir = path.join(__dirname, '..', 'expected');
  const filepath = path.join(__dirname, '..', 'fixtures', 'IMG_0640.JPG');

  const output = getTargetPath(destDir, filepath);

  test.equal(output, path.join(destDir, '2016-06-05-20-40-00_1.JPG'));
});
