#!/usr/bin/env node

import {spawn} from 'child_process';
import {once} from 'events';
import {join} from 'path';

import Chalk from 'chalk';
import {commandJoin} from 'command-join';
import main from 'main-function';

import type {PackageMangerName} from './@context';
import {detectPackageManger} from './@context';

const hasOwnProperty = Object.prototype.hasOwnProperty;

main(async ([firstArg, ...restArgs]) => {
  const cwd = process.cwd();

  const [name, dir] = await detectPackageManger(cwd);

  const {scripts = {}} = require(join(dir, 'package.json'));

  const command: string = name;
  let subcommand: string | undefined = firstArg;

  switch (firstArg) {
    case '--help':
    case '-h':
      console.info(`\
USAGES:

  xpm add/remove(rm)/install/run/exec [options]
  xpm [script] [options]
`);
      return;
    case undefined:
      subcommand = 'install';
      break;
    case 'add':
      switch (name) {
        case 'npm':
          subcommand = 'install';
          break;
      }

      break;
    case 'remove':
    case 'rm':
      switch (name) {
        case 'npm':
          subcommand = 'uninstall';
          break;
        case 'yarn':
          subcommand = 'remove';
          break;
      }

      break;
    case 'install':
    case 'run':
    case 'exec':
      break;
    default:
      switch (name) {
        case 'npm':
          if (restArgs.length > 0) {
            restArgs.unshift('--');
          }

          break;
      }

      restArgs.unshift(subcommand);

      if (hasOwnProperty.call(scripts, subcommand)) {
        subcommand = 'run';
      } else {
        switch (name) {
          case 'yarn':
            subcommand = undefined;
            break;
          default:
            subcommand = 'exec';
            break;
        }
      }

      break;
  }

  const args = [subcommand, ...restArgs].filter(
    (arg): arg is string => typeof arg === 'string',
  );

  console.info(`${colorizePackageMangerName(name)} ${commandJoin(args)}`);
  console.info();

  const cp = spawn(
    command,
    args.map(arg => commandJoin([arg])),
    {
      shell: true,
      cwd: dir,
      stdio: 'inherit',
    },
  );

  const [code] = (await once(cp, 'exit')) as [number];

  return code;
});

function colorizePackageMangerName(name: PackageMangerName): string {
  switch (name) {
    case 'npm':
      return Chalk.red(name);
    case 'yarn':
      return Chalk.cyan(name);
    case 'pnpm':
      return Chalk.yellow(name);
  }
}
