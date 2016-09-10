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
  test.plan(6);

  test.equal(typeof flatify._isMedia, 'function');
  test.equal(typeof flatify._getImages, 'function');
  test.equal(typeof flatify._cleanDirectories, 'function');
  test.equal(typeof flatify._getDateStringMediainfo, 'function');
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
  const targetPath = flatify._getTargetPath(destDir, filepath, options);

  test.equal(targetPath, 'hoplaa-2016-06-05-20-40-00.jpg', 'Target filename has prefix');
});

tape('getTargetPath - Keep suffix as is', (test) => {
  test.plan(1);

  const destDir = '';
  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const options = {
    prefix: '',
    lowercaseSuffix: false
  };
  const targetPath = flatify._getTargetPath(destDir, filepath, options);

  test.equal(targetPath, '2016-06-05-20-40-00.JPG', 'Target filename has prefix');
});
