/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

const fs = require('fs');

/**
 * Remove an empty directory that was touched during the operation.
 *
 * @param {string} item        Single directory to remove if empty
 * @param {object}  options    Set of options that most are boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 * @param {boolean} options.appendHash Always append a hash string to the filename instead of a possible counter
 *
 * @returns {void}
 */
const cleanDirectory = function cleanDirectory (item, options) {
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
};

/**
 * Remove any empty directories that were touched during the operation.
 *
 * @param {string} directories  List of directories to remove if empty
 * @param {object}  options    Set of options that most are boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 * @param {boolean} options.appendHash Always append a hash string to the filename instead of a possible counter
 *
 * @returns {void}
 */
const cleanDirectories = function cleanDirectories (directories, options) {
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

    cleanDirectory(item, options);
  });
};

module.exports = cleanDirectories;

// Exposed for unit testing
module.exports._cleanDirectory = cleanDirectory;
