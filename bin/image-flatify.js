#!/usr/bin/env node

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

const optionator = require('optionator');

const flatify = require('../index');

let pkg;

try {
  const packageJson = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');

  pkg = JSON.parse(packageJson);
}
catch (error) {
  console.error('Could not read/parse "package.json", quite strange...');
  console.error(error);
  process.exit(1);
}

const optsParser = optionator({
  prepend: `${pkg.name} [options] <directory>`,
  append: `Version ${pkg.version}`,
  options: [
    {
      option: 'help',
      alias: 'h',
      type: 'Boolean',
      description: 'Help and usage instructions'
    },
    {
      option: 'version',
      alias: 'V',
      type: 'Boolean',
      description: 'Version number',
      example: '-V'
    },
    {
      option: 'verbose',
      alias: 'v',
      type: 'Boolean',
      description: 'Verbose output, will print which file is currently being processed'
    },
    {
      option: 'dry-run',
      alias: 'n',
      type: 'Boolean',
      description: 'Try it out without actually touching anything'
    },
    {
      option: 'keep-in-directories',
      alias: 'K',
      type: 'Boolean',
      description: 'Keep the renamed image files in their original directory'
    },
    {
      option: 'prefix',
      alias: 'p',
      type: 'String',
      default: '',
      description: 'Prefix for the resulting filename, default empty'
    },
    {
      option: 'append-hash',
      alias: 'a',
      type: 'Boolean',
      description: 'Always append a hash string to the filename instead of a possible counter'
    },
    {
      option: 'lowercase-suffix',
      alias: 'l',
      type: 'Boolean',
      description: 'Lowercase the resulting file suffixes, or use as is by default'
    },
    {
      option: 'no-delete-empty-directories',
      alias: 'D',
      type: 'Boolean',
      description: 'Do not delete any directories that become empty after processing'
    }
  ]
});

let opts;

try {
  opts = optsParser.parse(process.argv);
}
catch (error) {
  console.error(error.message);
  console.log(optsParser.generateHelp());
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
  console.log(optsParser.generateHelp());
  process.exit(1);
}

const directory = path.resolve(opts._[0]);

try {
  fs.accessSync(directory);
}
catch (error) {
  console.error(`Directory (${directory}) does not exist`);
  process.exit(1);
}

// Fire away
flatify(directory, {
  verbose: typeof opts.verbose === 'boolean' ?
    opts.verbose :
    false,
  dryRun: typeof opts.dryRun === 'boolean' ?
    opts.dryRun :
    false,
  keepInDirectories: typeof opts.keepInDirectories === 'boolean' ?
    opts.keepInDirectories :
    false,
  prefix: opts.prefix,
  appendHash: typeof opts.appendHash === 'boolean' ?
    opts.appendHash :
    false,
  lowercaseSuffix: typeof opts.lowercaseSuffix === 'boolean' ?
    opts.lowercaseSuffix :
    false,
  noDeleteEmptyDirectories: typeof opts.noDeleteEmptyDirectories === 'boolean' ?
    opts.noDeleteEmptyDirectories :
    false
});
