/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Take a directory, search images recursively and rename as single flat directory with date based filenames
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

import fs from 'fs';
import path from 'path';

import getTargetPath from './lib/get-target-path.js';
import getImages from './lib/get-images.js';
import cleanDirectories from './lib/clean-directories.js';

const INDEX_NOT_FOUND = -1;

/**
 * @param {string}  directory  Root directory
 * @param {object}  options    Set of options that most are boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 * @param {boolean} options.keepInDirectories Rename in the original folders
 * @param {string}  options.prefix Prefix for the resulting filename, defaults to empty string
 * @param {boolean} options.lowercaseSuffix   Lowercase the resulting file suffix
 * @param {boolean} options.noDeleteEmptyDirectories Do not delete any directories, even when empty
 * @param {boolean} options.appendHash Always append a hash string to the filename instead of a possible counter
 *
 * @returns {void}
 */
export default function flatify (directory, options) {
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
    }
    ++movedFiles;
  });

  if (!options.noDeleteEmptyDirectories && !options.keepInDirectories) {
    cleanDirectories(directories, options);
  }

  if (options.dryRun) {
    console.log(`Would have moved total of ${movedFiles} image files, but did not due to dry-run`);
  }
  else {
    console.log(`Moved total of ${movedFiles} image files`);
  }
}
