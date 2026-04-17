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


const COLON_OR_WHITESPACE = /(:|\s)/gu;
const STARTS_WITH_NUMBER = /^\d+/u;
const MEDIAINFO_DATE_PATTERN = /(\d{4}[-:]\d{2}[-:]\d{2})[ T](\d{2}:\d{2}:\d{2})/u;
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
  const cmdMediainfo = `mediainfo -f "${filepath}"`;

  let possible = false;

  try {
    const mediaDate = execSync(cmdMediainfo, EXEC_OPTS);

    const lines = mediaDate.split('\n').filter((line) => /date/iu.test(line));

    if (lines.length > 0) {
      const candidates = lines
        .map((line) => {
          const match = MEDIAINFO_DATE_PATTERN.exec(line);

          return match
            ? `${match[1].replace(/:/gu, '-')} ${match[2]}`
            : null;
        })
        .filter(Boolean)
        .map((str) => ({
          str,
          ms: new Date(str.replace(' ', 'T')).getTime()
        }))
        .filter(({
          ms
        }) => !isNaN(ms) && ms > 0);

      if (candidates.length > 0) {
        candidates.sort((a, b) => a.ms - b.ms);
        possible = candidates[0].str;
      }
    }
  }
  /* c8 ignore next 5 */
  catch {
    console.log('Using Mediainfo failed');

    return false;
  }

  return possible;
};

/**
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string|bool} Date formatted as a string or false when failed
 * @see https://exiftool.org/exiftool_pod.html
 */
export const getDateStringExiftool = function getDateStringExiftool (filepath) {
  // -s3: Short output format to print values only without any tag names
  const cmdIdentify = `exiftool -s3 -createdate "${filepath}"`;

  let exifDate = '';

  try {
    exifDate = execSync(cmdIdentify, EXEC_OPTS);
  }
  catch {
    console.log('Using exiftool failed');

    return false;
  }

  // Remove possible timezone information
  return exifDate.trim().replace(/[+-]\d{2}:\d{2}$/u, '');
};
/**
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string|bool} Date formatted as a string or false when failed
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
  catch {
    console.log('Using GraphicsMagick failed');

    return false;
  }

  return exifDate.trim();
};

/**
 * Get the best guess for the date when the picture was taken.
 * Order of tools:
 * 1. MediaInfo
 * 2. ExifTool
 * 3. GraphicsMagick
 * 4. File modification time
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string|bool} Date formatted as a string or false when failed
 */
const getDateString = function getDateString (filepath) {

  try {
    fs.accessSync(filepath);
  }
  catch {
    console.error(`File ${filepath} did not exists`);

    return false;
  }

  let exifDate = getDateStringMediainfo(filepath);

  if (typeof exifDate === 'string' && STARTS_WITH_NUMBER.exec(exifDate)) {
    exifDate = exifDate.trim().replace(COLON_OR_WHITESPACE, '-');
  }
  /* c8 ignore start */
  else {
    exifDate = getDateStringExiftool(filepath);

    if (typeof exifDate === 'string' && STARTS_WITH_NUMBER.exec(exifDate)) {
      exifDate = exifDate.trim().replace(COLON_OR_WHITESPACE, '-');
    }
    else {
      exifDate = getDateStringGraphicsMagick(filepath);

      if (typeof exifDate === 'string' && STARTS_WITH_NUMBER.exec(exifDate)) {
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
  }
  /* c8 ignore stop */

  return exifDate;
};

export default getDateString;
