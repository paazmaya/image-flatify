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

/**
 * Read a directory, by returning all files with full filepath
 *
 * @param {string} directory  Directory
 * @param {object} options    {verbose: boolean}
 */
var getImages = function _getImages(directory, options) {
	if (options.verbose) {
		console.log(`Reading directory ${directory}`);
	}
	var images = [];

	var items = fs.readdirSync(directory)
		.map(function mapItems(item) {
			return path.join(directory, item);
		});

	items.forEach(function eachItems(item) {
		var stat = fs.statSync(item);
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
 * @param {string} directory  Root directory
 * @param {object} options    Boolean properties: verbose, dryRun, keepInDirectories, noDeleteEmptyDirectories
 */
module.exports = function flatify(directory, options) {
	var files = getImages(directory, options);
	console.log(`Found total of ${files.length} image files to be processed`);
	console.log(options);

	// List of directories that were touched during the renames
	var directories = [];

	files.forEach(function (filepath) {
		// https://nodejs.org/api/fs.html#fs_stat_time_values
		var stat = fs.statSync(filepath),
			ext = path.extname(filepath),
			dirpath = path.dirname(filepath);

		//console.log(filepath);
		if (directories.indexOf(dirpath) === -1 && dirpath !== directory) {
			directories.push(dirpath);
		}

		// In case birthtime is zero, then should not be trusted and used mtime instead
		//console.log(stat.birthtime.getTime());
		var dateB = fecha.format(stat.birthtime, 'YYYY-MM-DD-HH-mm-ss-SSS');

		/*
		var dateM = fecha.format(stat.mtime, 'YYYY-MM-DD-HH-mm-ss-SSS');
		var dateC = fecha.format(stat.ctime, 'YYYY-MM-DD-HH-mm-ss-SSS');

		console.log('  ' + dateB);
		console.log('  ' + dateM);
		console.log('  ' + dateC);
		*/

		var targetPath = path.join(directory, dateB + ext);
		if (options.keepInDirectories) {
			targetPath = path.join(dirpath, dateB + ext);
		}
		//console.log(targetPath);


		if (options.verbose) {
			console.log(`Moving ${filepath} --> ${targetPath}`);
		}
		if (!options.dryRun) {
			fs.renameSync(filepath, targetPath);
		}

	});

	if (!options.noDeleteEmptyDirectories && !options.keepInDirectories) {

		// Sort by path length so that subdirectory is removed before its parent
		directories = directories.sort(function (a, b) {
		  return b.length - a.length;
		});

		directories.forEach(function (item) {
			var files = fs.readdirSync(item);
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

	}
};
