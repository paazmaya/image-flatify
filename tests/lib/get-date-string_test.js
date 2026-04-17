/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import tape from 'tape';

import getDateString, {getDateStringMediainfo, getDateStringExiftool, getDateStringGraphicsMagick} from '../../lib/get-date-string.js';

let mediaInfoAvailable = false;
try {
  execSync('mediainfo --Version', { timeout: 2000, encoding: 'utf8' });
  mediaInfoAvailable = true;
}
catch {
  // mediainfo not available on this system
}

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

tape('getDateStringGraphicsMagick - existing image file', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateStringGraphicsMagick(filepath);

  test.equal(output, '2016:06:05 20:40:00');
});

tape('getDateStringGraphicsMagick - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateStringGraphicsMagick(filepath);

  test.notOk(output);
});

tape('getDateStringExiftool - existing image file', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateStringExiftool(filepath);

  test.equal(output, '2016:06:05 20:40:00');
});

tape('getDateStringExiftool - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateStringExiftool(filepath);

  test.notOk(output);
});

(mediaInfoAvailable ? tape : tape.skip)('getDateStringMediainfo - existing image file', (test) => {
  test.plan(1);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateStringMediainfo(filepath);

  test.ok(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/u.test(output), 'Date looking format');
});

tape('getDateStringMediainfo - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateStringMediainfo(filepath);

  test.notOk(output);
});

tape('getDateString - not an image file', (test) => {
  test.plan(1);

  const filepath = 'LICENSE';
  const output = getDateString(filepath);

  test.equal(typeof output, 'string');
});

tape('getDateString - uses exiftool when gm finds no DateTime EXIF', (test) => {
  test.plan(1);

  const tmpFile = path.join('tests', 'tmp-no-datetime.jpg');
  try {
    fs.copyFileSync(path.join('tests', 'fixtures', 'IMG_0640.JPG'), tmpFile);
    // Strip ModifyDate (0x0132, what gm reads via %[EXIF:DateTime]) and DateTimeOriginal (0x9003)
    // while preserving CreateDate (0x9004, what exiftool reads via -createdate)
    execSync(`exiftool -overwrite_original -EXIF:ModifyDate= -EXIF:DateTimeOriginal= "${tmpFile}"`, { timeout: 5000, encoding: 'utf8' });
    const output = getDateString(tmpFile);
    test.ok(output && /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/u.test(output), 'Date from exiftool fallback');
  }
  finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
});
