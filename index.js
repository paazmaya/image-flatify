/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (http://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

const fs = require('fs'),
  path = require('path'),
  execSync = require('child_process').execSync;

const fecha = require('fecha'),
  imageExtensions = require('image-extensions');

const INDEX_NOT_FOUND = -1;

/**
 * Check if the given file path has a suffix matching the
 * available media file suffixes.
 *
 * @param {string} filepath  Absolute file path
 *
 * @returns {bool} True in case the filepath is a media file according to the suffix
 */
const isMedia = function _isMedia (filepath) {
  const list = imageExtensions.concat(['mp4', 'avi', 'mpg', 'mpeg', 'mts']);

	return list.indexOf(path.extname(filepath).slice(1).toLowerCase()) !== INDEX_NOT_FOUND;
};

/**
 * Read a directory, by returning all files with full filepath
 *
 * @param {string} directory  Directory
 * @param {object} options    {verbose: boolean}
 *
 * @returns {array} List of image with full path
 */
const getImages = function _getImages (directory, options) {
  if (options.verbose) {
    console.log(`Reading directory ${directory}`);
  }
  let images = [];

  const items = fs.readdirSync(directory)
    .map((item) => (
      path.join(directory, item)
    ));

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
 * @param {object} options      {verbose: boolean}
 *
 * @returns {void}
 */
const cleanDirectories = function _cleanDirectories (directories, options) {
  // Sort by path length so that subdirectory is removed before its parent

  const dirs = directories.sort((itemA, itemB) => (
    itemB.length - itemA.length
  ));

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
 * Get the best guess for the date when the picture was taken
 *
 * @param {string} filepath  Media file path
 *
 * @returns {string} Date formatted as a string
 * @see http://www.graphicsmagick.org/GraphicsMagick.html#details-format
 */
const getDateString = function _getDate (filepath) {
  const formatString = 'YYYY-MM-DD-HH-mm-ss',
    cmdIdentify = `gm identify -format %[EXIF:DateTime] "${filepath}"`,
    cmdMediainfo = `mediainfo -f "${filepath}" | grep "File last modification date (local)"`;

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

  if (typeof exifDate === 'string' && exifDate !== 'unknown') {
    exifDate = exifDate.trim().replace(/(\:|\s)/g, '-');
  }
  else {
    try {
      let mediaDate = execSync(cmdMediainfo, {
        timeout: 2000,
        encoding: 'utf8'
      });
      console.log('mediaDate: ' + mediaDate.indexOf(/\d/));
      exifDate = mediaDate.substr(mediaDate.indexOf(/\d/));
      console.log('exifDate: ' + exifDate);
    }
    catch (error) {
      console.log('Using Mediainfo failed');
    }
    if (typeof exifDate === 'string' && exifDate !== 'unknown') {
      exifDate = exifDate.trim().replace(/(\:|\s)/g, '-');
    }
    else {

      // https://nodejs.org/api/fs.html#fs_stat_time_values
      const stat = fs.statSync(filepath);

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
 *
 * @returns {string} The full target path of the file
 */
const getTargetPath = function _getTargetPath (destDir, filepath) {
  const dateString = getDateString(filepath),
    ext = path.extname(filepath);

  let targetPath = path.join(destDir, dateString + ext),
    counter = 0;

  // Check for existing...
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(destDir, `${dateString}_${counter}${ext}`);
    ++counter;
  }

  return targetPath;
};

/**
 * @param {string} directory  Root directory
 * @param {object} options    Boolean properties: verbose, dryRun, keepInDirectories, noDeleteEmptyDirectories
 *
 * @returns {void}
 */
module.exports = function flatify (directory, options) {
  const files = getImages(directory, options);

  console.log(`Found total of ${files.length} image files to be processed`);
  console.log(options);

  // List of directories that were touched during the renames
  const directories = [];

  files.forEach((filepath) => {
    const sourceDir = path.dirname(filepath);

    let destDir = directory;

    if (options.keepInDirectories) {
      destDir = sourceDir;
    }

    if (directories.indexOf(sourceDir) === INDEX_NOT_FOUND && sourceDir !== directory) {
      directories.push(sourceDir);
    }

    const targetPath = getTargetPath(destDir, filepath);

    if (options.verbose) {
      console.log(`Moving ${filepath} --> ${targetPath}`);
    }
    if (!options.dryRun) {
      fs.renameSync(filepath, targetPath);
    }
  });

  if (!options.noDeleteEmptyDirectories && !options.keepInDirectories) {
    cleanDirectories(directories, options);
  }
};
