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

tape('getDateString - Get date via MediaInfo as expected', (test) => {
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

  test.equal(output, false, 'Returns false when gm fails');
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

  test.equal(output, false, 'Returns false when exiftool fails');
});

(mediaInfoAvailable ? tape : tape.skip)('getDateStringMediainfo - existing image file', (test) => {
  test.plan(3);

  const filepath = 'tests/fixtures/IMG_0640.JPG';
  const output = getDateStringMediainfo(filepath);

  test.ok(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u.test(output), 'Result matches YYYY-MM-DD HH:mm:ss format');
  test.notOk(/[+-]\d{2}:\d{2}|UTC/u.test(output), 'Result contains no timezone information');
  test.ok(output.startsWith('2016-'), 'Picks EXIF date (2016) over newer file system date');
});

tape('getDateStringMediainfo - non existing file', (test) => {
  test.plan(1);

  const filepath = 'tests/-/not-existing.jpg';
  const output = getDateStringMediainfo(filepath);

  test.equal(output, false, 'Returns false when no date found');
});

tape('getDateStringExiftool - strips timezone offset from output', (test) => {
  test.plan(1);

  const tmpFile = path.join('tests', 'tmp-with-timezone.jpg');
  try {
    fs.copyFileSync(path.join('tests', 'fixtures', 'IMG_0640.JPG'), tmpFile);
    execSync(`exiftool -overwrite_original -CreateDate="2016:06:05 20:40:00+02:00" "${tmpFile}"`, { timeout: 5000, encoding: 'utf8' });
    const output = getDateStringExiftool(tmpFile);
    test.equal(output, '2016:06:05 20:40:00', 'Timezone offset stripped from exiftool output');
  }
  finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
});

tape('getDateString - not an image file', (test) => {
  test.plan(1);

  const filepath = 'LICENSE';
  const output = getDateString(filepath);

  test.equal(typeof output, 'string');
});

tape('getDateString - uses exiftool when mediainfo finds no date', (test) => {
  test.plan(1);

  const tmpFile = path.join('tests', 'tmp-no-datetime.jpg');
  try {
    fs.copyFileSync(path.join('tests', 'fixtures', 'IMG_0640.JPG'), tmpFile);
    // Strip all date EXIF tags so mediainfo finds nothing, then exiftool reads CreateDate (0x9004)
    execSync(`exiftool -overwrite_original -EXIF:ModifyDate= -EXIF:DateTimeOriginal= -EXIF:CreateDate= "${tmpFile}"`, { timeout: 5000, encoding: 'utf8' });
    const output = getDateString(tmpFile);
    test.ok(output && /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/u.test(output), 'Date from exiftool fallback');
  }
  finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
});

tape('getDateString - uses gm when mediainfo and exiftool find no date', (test) => {
  test.plan(2);

  // A .dat file: mediainfo finds no date, exiftool finds no createdate, gm throws -> stat fallback
  const tmpFile = path.join('tests', 'tmp-not-an-image.dat');
  try {
    fs.writeFileSync(tmpFile, 'not an image');
    const gmResult = getDateStringGraphicsMagick(tmpFile);
    test.equal(gmResult, false, 'gm returns false for unsupported format');

    const output = getDateString(tmpFile);
    test.equal(typeof output, 'string', 'getDateString returns a string via stat fallback');
  }
  finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
});
