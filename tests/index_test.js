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
