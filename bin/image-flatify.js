#!/usr/bin/env node

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

const optionator = require('optionator');

const flatify = require('../index');

var pkg;

try {
  var packageJson = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8');
  pkg = JSON.parse(packageJson);
}
catch (error) {
  console.error('Could not read/parse "package.json", quite strange...');
  console.error(error);
  process.exit();
}

var optsParser = optionator({
  prepend: `${pkg.name} [options] <directory>`,
  append: `Version ${pkg.version}`,
  options: [
    {
      option: 'help',
      alias: 'h',
      type: 'Boolean',
      default: false,
      description: 'Help and usage instructions'
    },
    {
      option: 'version',
      alias: 'V',
      type: 'Boolean',
      default: false,
      description: 'Version number',
      example: '-V'
    },
    {
      option: 'verbose',
      alias: 'v',
      type: 'Boolean',
      default: false,
      description: 'Verbose output, will print which file is currently being processed'
    },
    {
      option: 'keep-in-directories',
      alias: 'K',
      type: 'Boolean',
      default: false,
      description: 'Keep the renamed image files in their original directory'
    },
    {
      option: 'delete-empty-directories',
      alias: 'D',
      type: 'Boolean',
      default: true,
      description: 'Delete any directories that become empty after processing'
    }
  ]
});

var opts;

try {
  opts = optsParser.parse(process.argv);
}
catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (opts.version) {
  console.log(pkg.version);
  process.exit(0);
}

if (opts.help) {
  console.log(optsParser.generateHelp());
  process.exit(0);
}

if (opts._.length !== 1) {
	console.error('Directory not specified');
  process.exit(1);
}

var directory = path.resolve(opts._[0]);

if (!fs.existsSync(directory)) {
	console.error(`Directory (${directory}) does not exist`);
  process.exit(1);
}

// Fire away
flatify(directory, {verbose: opts.verbose});
