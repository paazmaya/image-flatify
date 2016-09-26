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
  execSync = require('child_process').execSync;

const fecha = require('fecha'),
  imageExtensions = require('image-extensions');

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

/**
 * Remove any empty directories that were touched during the operation
 *
 * @param {string} directories  List of directories to remove if empty
 * @param {object}  options    Set of options that most are boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 *
 * @returns {void}
 */
const cleanDirectories = function _cleanDirectories (directories, options) {
  // Sort by path length so that subdirectory is removed before its parent

  const dirs = directories.sort((itemA, itemB) =>
    itemB.length - itemA.length
  );

  dirs.forEach((item) => {
    const files = fs.readdirSync(item);

    if (files.length > 0) {
      if (options.verbose) {
        console.log(`Cannot delete directory which has files (${files.length}): ${item}`);
      }

      return;
    }
    // Check if empty and delete
    if (options.verbose) {
      console.log(`Deleting empty directory ${item}`);
    }
    if (!options.dryRun) {
      fs.rmdirSync(item);
    }
  });
};

/**
 * Get the best guess for the date when the video was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string|bool} Date formatted as a string or false when no match
 */
const getDateStringMediainfo = function _getDateStringMediainfo (filepath) {
  const cmdMediainfo = `mediainfo -f "${filepath}" | grep date`;

  let possible = false;

  try {
    const mediaDate = execSync(cmdMediainfo, {
      timeout: 2000,
      encoding: 'utf8'
    });

    const lines = mediaDate.split('\n');

    if (lines.length > 0) {
      const MATCH_REPLACE = /^[\s:]+/g;
      possible = lines[0].replace(/[a-zA-Z]+/g, '').trim().replace(MATCH_REPLACE, '');
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
 * @see http://www.graphicsmagick.org/GraphicsMagick.html#details-format
 */
const getDateStringGraphicsMagick = function _getDateStringGraphicsMagick (filepath) {
  const cmdIdentify = `gm identify -format %[EXIF:DateTime] "${filepath}"`;

  let exifDate;

  try {
    // gm identify: No decode delegate for this image format (00000.MTS).
    // gm identify: Request did not return an image.
    exifDate = execSync(cmdIdentify, {
      timeout: 2000,
      encoding: 'utf8'
    });
  }
  catch (error) {
    console.log('Using GraphicsMagick failed');
  }

  return exifDate;
};

/**
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string} Date formatted as a string
 */
const getDateString = function _getDateString (filepath) {

  let exifDate = getDateStringGraphicsMagick(filepath);

  const MATCH_REPLACE = /(:|\s)/g;

  if (typeof exifDate === 'string' && exifDate.match(/^\d+/)) {
    exifDate = exifDate.trim().replace(MATCH_REPLACE, '-');
  }
  else {
    exifDate = getDateStringMediainfo(filepath);

    if (typeof exifDate === 'string' && exifDate.match(/^\d+/)) {
      exifDate = exifDate.trim().replace(MATCH_REPLACE, '-');
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

/**
 * @param {string}  directory  Root directory
 * @param {object}  options    Set of options that most are boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 * @param {boolean} options.keepInDirectories Rename in the original folders
 * @param {string}  options.prefix Prefix for the resulting filename, defaults to empty string
 * @param {boolean} options.lowercaseSuffix   Lowercase the resulting file suffix
 * @param {boolean} options.noDeleteEmptyDirectories Do not delete any directories, even when empty
 *
 * @returns {void}
 */
module.exports = function flatify (directory, options) {
  const files = getImages(directory, options);

  console.log(`Found total of ${files.length} image files to be processed`);

  // List of directories that were touched during the renames
  const directories = [];

  // Counter for files that were moved/renamed/touched
  let movedFiles = 0;

  files.forEach((filepath) => {
    const sourceDir = path.dirname(filepath);

    let destDir = directory;

    if (options.keepInDirectories) {
      destDir = sourceDir;
    }

    if (directories.indexOf(sourceDir) === INDEX_NOT_FOUND && sourceDir !== directory) {
      directories.push(sourceDir);
    }

    const targetPath = getTargetPath(destDir, filepath, options);

    if (options.verbose) {
      const inPath = path.relative(directory, filepath),
        outPath = path.relative(directory, targetPath);
      console.log(`Moving ${inPath} --> ${outPath}`);
    }
    if (!options.dryRun) {
      fs.renameSync(filepath, targetPath);
      ++movedFiles;
    }
  });

  if (!options.noDeleteEmptyDirectories && !options.keepInDirectories) {
    cleanDirectories(directories, options);
  }

  console.log(`Moved total of ${movedFiles} image files`);
};

// Exposed for testing
module.exports._isMedia = isMedia;
module.exports._getImages = getImages;
module.exports._cleanDirectories = cleanDirectories;
module.exports._getDateStringMediainfo = getDateStringMediainfo;
module.exports._getDateStringGraphicsMagick = getDateStringGraphicsMagick;
module.exports._getDateString = getDateString;
module.exports._getTargetPath = getTargetPath;
