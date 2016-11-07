/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');

const getDateString = require('../lib/get-date-string');

/**
 * Get the full file path for the target file, based on the
 * destination directory, while checking that the resulting path
 * does not exist.
 *
 * @param {string} destDir  Destination directory
 * @param {string} filepath  Original file path
 * @param {object}  options    Set of options that most are boolean
 * @param {string}  options.prefix Prefix for the resulting filename, defaults to empty string
 * @param {boolean} options.lowercaseSuffix   Lowercase the resulting file suffix
 * @param {boolean} options.appendHash Always append a hash string to the filename instead of a possible counter
 *
 * @returns {string|boolean} The full target path of the file of false when failed on accessing the filepath
 */
const getTargetPath = function _getTargetPath (destDir, filepath, options) {
  options = options || {};
  options.prefix = options.prefix || '';

  const dateString = getDateString(filepath);
  if (!dateString) {
    return false;
  }

  const namePart = options.prefix + dateString;

  let ext = path.extname(filepath);

  if (options.lowercaseSuffix) {
    ext = ext.toLowerCase();
  }

  if (options.appendHash) {
    const hash = crypto.createHash('md5');
    hash.update(`${destDir}${filepath}${namePart}`);
    const hex = hash.digest('hex');
    ext = `_${hex}${ext}`;
  }

  let targetPath = path.join(destDir, namePart + ext);

  if (!options.appendHash) {
    let counter = 1;

    // Check for existing...
    let currentExists = true;
    while (currentExists) {
      try {
        fs.accessSync(targetPath);
        currentExists = true;
        targetPath = path.join(destDir, `${namePart}_${counter}${ext}`);
        ++counter;
      }
      catch (error) {
        currentExists = false;
      }
    }
  }

  return targetPath;
};

module.exports = getTargetPath;
