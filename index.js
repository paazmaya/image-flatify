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

const getTargetPath = require('./lib/get-target-path'),
  getImages = require('./lib/get-images');

const INDEX_NOT_FOUND = -1;

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
    try {
      fs.accessSync(item);
    }
    catch (error) {
      console.error(`Directory ${item} did not exists`);

      return;
    }

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

module.exports._cleanDirectories = cleanDirectories;
