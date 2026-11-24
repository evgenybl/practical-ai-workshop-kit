#!/usr/bin/env node
'use strict';
/*
 * The command-line form of the workbook's checker. It prints what the page
 * would show for the same answer.
 *
 *   node tools/check.js <exercise> <answer file> [--json]
 *
 * Exit code: 0 when nothing needs another look, 1 when something does,
 * 2 when the command itself is wrong (unknown exercise, missing file).
 */
const fs = require('fs');
const lib = require('./lib');

function usage(C) {
  const lines = [
    'Usage: node tools/check.js <exercise> <answer file> [--json]',
    '',
    'Exercises:'
  ];
  // In the order of the session (an object lists number-like keys first).
  const order = ['1', 'reply', '2-request', '2', '3', '4a', '4b', '5', 'quiz'];
  for (const id of order.concat(Object.keys(C.EXERCISES).filter((k) => !order.includes(k)))) { lines.push('  ' + id.padEnd(10) + ' ' + C.EXERCISES[id].name); }
  lines.push('', 'Example: node tools/check.js 2 recorded/answers/ex2-answer.txt');
  return lines.join('\n');
}

function main(argv) {
  const { checker: C } = lib.loadWorkbook();
  const args = argv.filter((a) => a !== '--json');
  const json = argv.includes('--json');
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(usage(C));
    return args.length === 0 ? 2 : 0;
  }
  if (args.length !== 2) {
    console.error(usage(C));
    return 2;
  }
  const [exercise, file] = args;
  if (!C.EXERCISES[String(exercise).toLowerCase()]) {
    console.error('There is no exercise "' + exercise + '".\n\n' + usage(C));
    return 2;
  }
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error('Cannot read the answer file "' + file + '": ' + e.code);
    return 2;
  }
  const result = C.runExercise(exercise, text);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    process.stdout.write(C.formatResult(result));
  }
  return result.rules.some((r) => r.status === 'look') ? 1 : 0;
}

if (require.main === module) { process.exitCode = main(process.argv.slice(2)); }
module.exports = { main };
