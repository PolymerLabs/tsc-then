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

const separatorIndex = process.argv.indexOf('--');

function usage() {
  console.error(`Usage: tsc-then [-p packageDir (maybe repeated)] -- command`);
  process.exit(1);
}

if (separatorIndex === -1) {
  usage();
}

const args = process.argv.slice(2, separatorIndex);

if (args.length % 2 !== 0) {
  usage();
}

const projectDirs = [];
for (let i = 0; i < args.length; i++) {
  if (i % 2 === 0 && args[i] !== '-p') {
    usage();
  }
  if (i % 2 === 1) {
    projectDirs.push(args[i]);
  }
}
if (projectDirs.length === 0) {
  projectDirs.push('');
}

const command = process.argv.slice(separatorIndex + 1);

const initialCompilationPromises: Promise<void>[] = [];
for (const projectDir of projectDirs) {
  const options = { shell: true, cwd: process.cwd(), hideWindows: true };
  const tscArgs = ['-w'];
  if (projectDir !== '') {
    tscArgs.push('-p', projectDir);
  }
  const child = spawn('tsc', tscArgs, options);
  child.on('exit', (code, signal) => {
    console.error(`tsc exited with exit code: ${code}`);
    if (signal) {
      console.error(`signal: ${signal}`);
    }
  });

  let resolve: () => void;
  initialCompilationPromises.push(new Promise<void>((r) => {resolve = r;}));
  let buffer = '';
  const marker = `Compilation complete. Watching for file changes.`
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    // process.stdout.write(chunk);
    buffer += chunk;
    while (true) {
      let index = buffer.indexOf(marker);
      if (index === -1) {
        break;
      }
      resolve!();
      if (buffer.includes(`File change detected. Starting incremental compilation...`)) {
        console.log('\ntsc-then: File change detected. Compiling...\n');
      }
      buffer = buffer.slice(index + marker.length);
      runResponseCommand();
    }
  });
}



let running: Promise<void> | undefined = undefined;
let nextRun = false;
let firstRun = true;
async function runResponseCommand() {
  await Promise.all(initialCompilationPromises);
  if (running) {
    await running;
    if (nextRun) {
      return;
    }
    nextRun = true;
  }
  running = new Promise((resolve) => {
    if (firstRun) {
      console.log('tsc-then: Initial compilation complete!');
      firstRun = false;
    }
    console.log(`\ntsc-then: Running ${command.join(' ')}\n`);
    const options = { shell: true, cwd: process.cwd(), hideWindows: true };
    const responseCommand = spawn(command[0], command.slice(1), options);
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
