/**
 * image-flatify
 * https://github.com/paazmaya/image-flatify
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */
/* eslint-disable handle-callback-err */

import fs from 'fs';
import path from 'path';
import {
    execFile
} from 'child_process';

import tape from 'tape';

import pkg from '../package.json' assert { type: 'json' };
const bin = path.join('bin', 'image-flatify');

tape('cli should output version number', (test) => {
  test.plan(1);

  execFile('node', [bin, '-V'], null, (err, stdout) => {
    test.equals(stdout.trim(), pkg.version, 'Version is the same as in package.json');
  });

});

tape('cli should output help by default', (test) => {
  test.plan(1);

  execFile('node', [bin], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('image-flatify [options] <directory>') !== -1, 'Help appeared');
  });

});

tape('cli should output help when requested', (test) => {
  test.plan(1);

  execFile('node', [bin, '--help'], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('image-flatify [options] <directory>') !== -1, 'Help appeared');
  });

});

tape('cli should complain when non existing option used', (test) => {
  test.plan(1);

  execFile('node', [bin, '-g'], null, (err, stdout, stderr) => {
    test.ok(stderr.trim().indexOf('Invalid option ') !== -1, 'Complaint seen');
  });

});

tape('cli should use given prefix, verbose dry run', (test) => {
  test.plan(1);

  const prefix = 'i-like-lego';

  execFile('node', [bin, '-p', prefix, '-nv', 'tests/fixtures'], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf(`--> ${prefix}`) > 120, 'Prefix seen');
  });

});

tape('cli should not have prefix when not specified, verbose dry run', (test) => {
  test.plan(1);

  execFile('node', [bin, '-nv', 'tests/fixtures'], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('--> 20') > 120, 'Prefix not seen');
  });

});

tape('cli should require at least one directory', (test) => {
  test.plan(1);

  execFile('node', [bin, '-nv'], null, (err, stdout, stderr) => {
    test.ok(stderr.trim().indexOf('Directory/directories were not specified') !== -1);
  });

});

tape('cli should accept two directory', (test) => {
  test.plan(1);

  execFile('node', [bin, '-n', 'tests/fixtures', 'tests/lib'], null, (err, stdout, stderr) => {
    test.equal(stderr.trim(), '', 'No errors since both directories existed');
  });

});

tape('cli should accept two directory, but fail when the latter does not exist', (test) => {
  test.plan(2);

  execFile('node', [bin, '-v', 'tests/fixtures', 'tests/not-here'], null, (err, stdout, stderr) => {
    test.ok(stderr.trim().indexOf(`tests${path.sep}not-here) does not exist`) !== -1);
    test.equal(stdout.trim(), '', 'No standard output since error existed');
  });

});

tape('cli does not move files when dry-run', (test) => {
  test.plan(1);

  execFile('node', [bin, '-nv', path.join('tests', 'fixtures')], null, (err, stdout) => {
    test.ok(stdout.trim().indexOf('Would have moved total of ') !== -1);
  });

});
tape('cli appends with hash', (test) => {
  test.plan(1);

  const regex = /40-00_\S+\.JPG/gu;

  execFile('node', [bin, '-anKDv', path.join('tests', 'fixtures')], null, (err, stdout) => {
    test.ok(regex.test(stdout));
  });

});
