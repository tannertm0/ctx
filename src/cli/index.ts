#!/usr/bin/env node

import { Command } from 'commander';
import { registerInit } from './init';
import { registerSync } from './sync';
import { registerStatus } from './status';
import { registerDiff } from './diff';
import { registerAdd } from './add';

const program = new Command();

program
  .name('ctx')
  .description('Manage AI context across your team\'s codebase')
  .version('0.1.0');

registerInit(program);
registerSync(program);
registerStatus(program);
registerDiff(program);
registerAdd(program);

program.parse(process.argv);
