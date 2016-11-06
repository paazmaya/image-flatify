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

const imageExtensions = require('image-extensions');

const INDEX_NOT_FOUND = -1,
  EXTENSIONS = imageExtensions.concat(['mp4', 'avi', 'mpg', 'mpeg', 'mts', 'mov']);

/**
 * Check if the given file path has a suffix matching the
 * available media file suffixes.
 *
 * @param {string} filepath  Absolute file path
 *
 * @returns {bool} True in case the filepath is a media file according to the suffix
 */
const isMedia = function _isMedia (filepath) {
  const ext = path.extname(filepath).slice(1).toLowerCase();

  return EXTENSIONS.indexOf(ext) !== INDEX_NOT_FOUND;
};

/**
 * Read a directory recursively, by returning all files with full filepath
 *
 * @param {string} directory  Directory
 * @param {object}  options    Set of options that most are boolean
 * @param {boolean} options.verbose Print out current process
 *
 * @returns {array} List of image with full path
 */
const getImages = function _getImages (directory, options) {
  if (options.verbose) {
    console.log(`Reading directory ${directory}`);
  }
  let images = [];

  try {
    fs.accessSync(directory);
  }
  catch (error) {
    console.error(`Directory ${directory} did not exists`);

    return images;
  }

  const items = fs.readdirSync(directory)
    .map((item) =>
      path.join(directory, item)
    );

  items.forEach((item) => {
    const stat = fs.statSync(item);

    if (stat.isFile() && isMedia(item)) {
      images.push(item);
    }
    else if (stat.isDirectory()) {
      images = images.concat(_getImages(item, options));
    }
  });

  return images;
};

module.exports = getImages;

// Exposed for testing
module.exports._isMedia = isMedia;
