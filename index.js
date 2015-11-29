/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (http://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

const fs = require('fs'),
  path = require('path');

const fecha = require('fecha'),
  isImage = require('is-image');

const INDEX_NOT_FOUND = -1;

/**
 * Read a directory, by returning all files with full filepath
 *
 * @param {string} directory  Directory
 * @param {object} options    {verbose: boolean}
 */
const getImages = function _getImages (directory, options) {
  if (options.verbose) {
    console.log(`Reading directory ${directory}`);
  }
  let images = [];

  const items = fs.readdirSync(directory)
    .map((item) => {
      return path.join(directory, item);
    });

  items.forEach((item) => {
    const stat = fs.statSync(item);

    if (stat.isFile() && isImage(item)) {
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
 * @returns {void}
 */
const cleanDirectories = function _cleanDirectories (directories, options) {
  // Sort by path length so that subdirectory is removed before its parent

  const dirs = directories.sort((itemA, itemB) => {
    return itemB.length - itemA.length;
  });

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
    // https://nodejs.org/api/fs.html#fs_stat_time_values
    const stat = fs.statSync(filepath),
      ext = path.extname(filepath),
      dirpath = path.dirname(filepath);

    if (directories.indexOf(dirpath) === INDEX_NOT_FOUND && dirpath !== directory) {
      directories.push(dirpath);
    }

    // In case birthtime is zero, then should not be trusted and used mtime instead
    const dateB = fecha.format(stat.birthtime, 'YYYY-MM-DD-HH-mm-ss-SSS');

    /*
    const dateM = fecha.format(stat.mtime, 'YYYY-MM-DD-HH-mm-ss-SSS');
    const dateC = fecha.format(stat.ctime, 'YYYY-MM-DD-HH-mm-ss-SSS');

    console.log('  ' + dateB);
    console.log('  ' + dateM);
    console.log('  ' + dateC);
    */

    let targetPath = path.join(directory, dateB + ext);

    if (options.keepInDirectories) {
      targetPath = path.join(dirpath, dateB + ext);
    }

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
