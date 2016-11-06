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
  path = require('path');

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
 *
 * @returns {string} The full target path of the file
 */
const getTargetPath = function _getTargetPath (destDir, filepath, options) {
  options = options || {};
  options.prefix = options.prefix || '';

  const dateString = options.prefix + getDateString(filepath);

  let ext = path.extname(filepath);

  if (options.lowercaseSuffix) {
    ext = ext.toLowerCase();
  }

  let targetPath = path.join(destDir, dateString + ext),
    counter = 1;

  // Check for existing...
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(destDir, `${dateString}_${counter}${ext}`);
    ++counter;
  }

  return targetPath;
};

module.exports = getTargetPath;
