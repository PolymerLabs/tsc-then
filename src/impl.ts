/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { spawn } from 'child_process';

const argv = process.argv.slice(3);

const options = { shell: true, cwd: process.cwd(), hideWindows: true };
const child = spawn('tsc', ['-w'], options);
child.on('exit', (code, signal) => {
  console.error(`tsc exited with exit code: ${code}`);
  if (signal) {
    console.error(`signal: ${signal}`);
  }
});

let buffer = '';
const marker = `Compilation complete. Watching for file changes.`
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  buffer += chunk;
  while (true) {
    let index = buffer.indexOf(marker);
    if (index === -1) {
      break;
    }
    if (buffer.includes(`File change detected. Starting incremental compilation...`)) {
      console.log('\ntsc-then: File change detected. Compiling...\n');
    }
    buffer = buffer.slice(index + marker.length);
    runResponseCommand();
  }
});

let running: Promise<void> | undefined = undefined;
let nextRun = false;
async function runResponseCommand() {
  if (running) {
    await running;
    if (nextRun) {
      return;
    }
    nextRun = true;
  }
  running = new Promise((resolve) => {
    console.log(`\ntsc-then: Running ${argv.join(' ')}\n`);
    const options = { shell: true, cwd: process.cwd(), hideWindows: true };
    const responseCommand = spawn(argv[0], argv.slice(1), options);
    responseCommand.stdout.setEncoding('utf8');
    responseCommand.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
    });
    responseCommand.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
    });
    responseCommand.on('exit', () => {
      resolve();
    });
  });
  await running;
  console.log('\ntsc-then: command finished\n')
  running = undefined;
  nextRun = false;
}
