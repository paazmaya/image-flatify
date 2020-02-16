/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */



const tape = require('tape');

const getDateString = require('../../lib/get-date-string');

tape('getDateString - Get date via GM as expected', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateString(filepath);

  test.equal(output, '2016-06-05-20-40-00', 'Dashed date received');
});

tape('getDateString - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateString(filepath);

  test.notOk(output);
});

tape('getDateStringGraphicsMagick - existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateString._getDateStringGraphicsMagick(filepath);

  test.equal(output, '2016:06:05 20:40:00');
});

tape('getDateStringGraphicsMagick - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateString._getDateStringGraphicsMagick(filepath);

  test.notOk(output);
});

tape('getDateStringMediainfo - existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateString._getDateStringMediainfo(filepath);

  test.ok(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/u.test(output), 'Date looking format');
});

tape('getDateStringMediainfo - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateString._getDateStringMediainfo(filepath);

  test.notOk(output);
});

tape('getDateString - not an image file', (test) => {
  test.plan(1);

  const filepath = 'LICENSE';
  const output = getDateString(filepath);

  test.equal(typeof output, 'string');
});
