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
import {
  execSync
} from 'node:child_process';

import fecha from 'fecha';

const STARTS_WITH_WHITESPACE = /^[\s:]+/gu;
const ALL_CHARACTERS = /[a-zA-Z]+/gu;
const COLON_OR_WHITESPACE = /(:|\s)/gu;
const STARTS_WITH_NUMBER = /^\d+/u;

const EXEC_OPTS = {
  timeout: 2000,
  encoding: 'utf8'
};

/**
 * Get the best guess for the date when the video was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string|bool} Date formatted as a string or false when no match
 */
export const getDateStringMediainfo = function getDateStringMediainfo (filepath) {
  const cmdMediainfo = `mediainfo -f "${filepath}" | grep date`;

  let possible = false;

  try {
    const mediaDate = execSync(cmdMediainfo, EXEC_OPTS);

    const lines = mediaDate.split('\n');

    if (lines.length > 0) {
      possible = lines[0].replace(ALL_CHARACTERS, '').trim().replace(STARTS_WITH_WHITESPACE, '');
    }
  }
  catch (error) {
    console.log('Using Mediainfo failed');
  }

  return possible;
};

/**
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string} Date formatted as a string
 * @see https://exiftool.org/exiftool_pod.html
 */
export const getDateStringExiftool = function getDateStringExiftool (filepath) {
  // -s3: Short output format to print values only without any tag names
  const cmdIdentify = `exiftool -s3 -createdate "${filepath}"`;

  let exifDate = '';

  try {
    // gm identify: No decode delegate for this image format (00000.MTS).
    // gm identify: Request did not return an image.
    exifDate = execSync(cmdIdentify, EXEC_OPTS);
  }
  catch (error) {
    console.log('Using exiftool failed');
  }

  return exifDate.trim();
};
/**
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string} Date formatted as a string
 * @see http://www.graphicsmagick.org/GraphicsMagick.html#details-format
 */
export const getDateStringGraphicsMagick = function getDateStringGraphicsMagick (filepath) {
  const cmdIdentify = `gm identify -format %[EXIF:DateTime] "${filepath}"`;

  let exifDate = '';

  try {
    // gm identify: No decode delegate for this image format (00000.MTS).
    // gm identify: Request did not return an image.
    exifDate = execSync(cmdIdentify, EXEC_OPTS);
  }
  catch (error) {
    console.log('Using GraphicsMagick failed');
  }

  return exifDate.trim();
};

/**
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string|bool} Date formatted as a string or false when failed
 */
const getDateString = function getDateString (filepath) {

  try {
    fs.accessSync(filepath);
  }
  catch (error) {
    console.error(`File ${filepath} did not exists`);

    return false;
  }

  let exifDate = getDateStringGraphicsMagick(filepath);

  if (typeof exifDate === 'string' && exifDate.match(STARTS_WITH_NUMBER)) {
    exifDate = exifDate.trim().replace(COLON_OR_WHITESPACE, '-');
  }
  else {
    exifDate = getDateStringMediainfo(filepath);

    if (typeof exifDate === 'string' && exifDate.match(STARTS_WITH_NUMBER)) {
      exifDate = exifDate.trim().replace(COLON_OR_WHITESPACE, '-');
    }
    else {
      // https://nodejs.org/api/fs.html#fs_stat_time_values
      const stat = fs.statSync(filepath);
      const formatString = 'YYYY-MM-DD-HH-mm-ss';

      exifDate = fecha.format(stat.birthtime, formatString);

      // In case birthtime is zero, then should not be trusted and used mtime instead
      // const dateM = fecha.format(stat.mtime, formatString);
      // const dateC = fecha.format(stat.ctime, formatString);
    }
  }

  return exifDate;
};

export default getDateString;
