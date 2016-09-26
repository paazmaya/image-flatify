/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

const fs = require('fs'),
  path = require('path');

const tape = require('tape'),
  flatify = require('../index');

tape('a function is exported', (test) => {
  test.plan(2);

  test.equal(typeof flatify, 'function');
  test.equal(flatify.length, 2, 'has two arguments');
});

tape('private methods exposed for testing', (test) => {
  test.plan(7);

  test.equal(typeof flatify._isMedia, 'function');
  test.equal(typeof flatify._getImages, 'function');
  test.equal(typeof flatify._cleanDirectories, 'function');
  test.equal(typeof flatify._getDateStringMediainfo, 'function');
  test.equal(typeof flatify._getDateStringGraphicsMagick, 'function');
  test.equal(typeof flatify._getDateString, 'function');
  test.equal(typeof flatify._getTargetPath, 'function');
});

tape('getTargetPath - Uses prefix and lowercases', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    prefix: 'hoplaa-',
    lowercaseSuffix: true
  };
  const output = flatify._getTargetPath(destDir, filepath, options);

  test.equal(output, 'hoplaa-2016-06-05-20-40-00.jpg', 'Target filename has prefix');
});

tape('getTargetPath - Keep suffix as is', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    lowercaseSuffix: false
  };
  const output = flatify._getTargetPath(destDir, filepath, options);

  test.equal(output, '2016-06-05-20-40-00.JPG', 'Target filename has uppercase suffix');
});

tape('getDateString - Get date via GM as expected', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = flatify._getDateString(filepath);

  test.equal(output, '2016-06-05-20-40-00', 'Dashed date received');
});

tape('getDateStringGraphicsMagick', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = flatify._getDateStringGraphicsMagick(filepath);

  test.equal(output, '2016:06:05 20:40:00\n');
});

tape('getDateStringMediainfo', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = flatify._getDateStringMediainfo(filepath);

  test.equal(output, '2016-09-10 22:40:42');
});
/*
tape('cleanDirectories', (test) => {
  test.plan(1);

  const options = {
    dryRun: true
  };
  const output = flatify._cleanDirectories(['tests/fixtures'], options);

  test.equal(output, '');
});
*/
tape('getImages', (test) => {
  test.plan(1);

  const output = flatify._getImages('tests', {});

  test.equal(output.length, 1);
});

tape('isMedia', (test) => {
  test.plan(4);

  test.notOk(flatify._isMedia('hoplaa.js'));
  test.ok(flatify._isMedia('hoplaa.jpg'));
  test.ok(flatify._isMedia('hoplaa.jpeg'));
  test.ok(flatify._isMedia('hoplaa.mp4'));
});
