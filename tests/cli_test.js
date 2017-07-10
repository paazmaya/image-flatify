/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */
/* eslint-disable handle-callback-err */

'use strict';

const fs = require('fs'),
  path = require('path'),
  execFile = require('child_process').execFile;

const tape = require('tape');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

tape('cli should output version number', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '-V'], null, (err, stdout) => {
    test.equals(stdout.trim(), pkg.version, 'Version is the same as in package.json');
  });

});

tape('cli should output help by default', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('image-flatify [options] <directory>') !== -1, 'Help appeared');
  });

});

tape('cli should output help when requested', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '--help'], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('image-flatify [options] <directory>') !== -1, 'Help appeared');
  });

});

tape('cli should complain when package.json is gone', (test) => {
  test.plan(1);

  const nameFrom = 'package.json',
    nameTo = '_package.json';

  fs.renameSync(nameFrom, nameTo);

  execFile('node', [pkg.bin, '-h'], null, (err, stdout, stderr) => {
    test.ok(stderr.trim().indexOf('Could not read') !== -1, 'Complaint seen');
    fs.renameSync(nameTo, nameFrom);
  });

});

tape('cli should complain when non existing option used', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '-g'], null, (err, stdout, stderr) => {
    test.ok(stderr.trim().indexOf('Invalid option ') !== -1, 'Complaint seen');
  });

});

tape('cli should use given prefix, verbose dry run', (test) => {
  test.plan(1);

  const prefix = 'i-like-lego';

  execFile('node', [pkg.bin, '-p', prefix, '-nv', 'tests/fixtures'], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('--> ' + prefix + '20') !== -1, 'Prefix seen');
  });

});

tape('cli should not have prefix when not specified, verbose dry run', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '-nv', 'tests/fixtures'], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('--> 20') !== -1, 'Prefix not seen');
  });

});

tape('cli should require at least one directory', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '-nv'], null, (err, stdout, stderr) => {
    test.equal(stderr.trim(), 'Directory/directories were not specified');
  });

});

tape('cli should accept two directory', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '-nv', 'tests/fixtures', 'tests/lib'], null, (err, stdout, stderr) => {
    test.equal(stderr.trim(), '', 'No errors since both directories existed');
  });

});

tape('cli should accept two directory, but fail when the latter does not exist', (test) => {
  test.plan(2);

  execFile('node', [pkg.bin, '-nv', 'tests/fixtures', 'tests/not-here'], null, (err, stdout, stderr) => {
    test.ok(stderr.trim().indexOf(`tests${path.sep}not-here) does not exist`) !== -1);
    test.equal(stdout.trim(), '', 'No standard output since error existed');
  });

});

tape('cli does not move files when dry-run', (test) => {
  test.plan(1);

  execFile('node', [pkg.bin, '-nv', path.join(__dirname, 'fixtures')], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('Would have moved total of ') !== -1);
  });

});
