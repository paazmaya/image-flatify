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
 * @param {object} options    Boolean properties: verbose, keepInDirectories, deleteEmptyDirectories
 */
module.exports = function flatify(directory, options) {
	var files = getImages(directory, options);
	console.log(`Found total of ${files.length} image files to be processed`);

	files.forEach(function (filepath) {
		// https://nodejs.org/api/fs.html#fs_stat_time_values
		var stat = fs.statSync(filepath),
			ext = path.extname(filepath),
			dirpath = path.dirname(filepath);

		console.log(filepath);

		// In case it is zero, then should not be trusted and used mtime instead
		console.log(stat.birthtime.getTime());
		var dater = fecha.format(stat.birthtime, 'YYYY-MM-DD-HH-mm-ss-SSS-ZZ');

		var targetPath = path.join(directory, dater + ext);
		console.log(targetPath);
	});
};
