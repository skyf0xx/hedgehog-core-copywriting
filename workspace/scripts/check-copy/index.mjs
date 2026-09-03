#!/usr/bin/env node
// checkCopy() as a real CLI: mechanical AI-tell and prose-quality gates
// run as deterministic code and reported as structured JSON, not graded
// by the agent that wrote the draft. Read a file path (or stdin), print
// a validated report to stdout, exit 1 if any error-severity violation
// fired — a real gate the copy-writer loop cannot talk its way past.
//
// Usage: node index.mjs <file>
//        cat draft.md | node index.mjs -

import { readFile } from 'node:fs/promises';
import { checkTells } from './rules/tells.mjs';
import { checkProse } from './rules/prose.mjs';
import { buildReport } from './report.mjs';

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function countParagraphs(text) {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

async function readInput(arg) {
  if (!arg || arg === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  }
  return readFile(arg, 'utf8');
}

export async function checkCopy(text) {
  const wordCount = countWords(text);
  const paragraphCount = countParagraphs(text);

  const tellViolations = checkTells(text, { wordCount });
  const { violations: proseViolations, metrics: proseMetrics } = await checkProse(text, { wordCount });

  const violations = [...tellViolations, ...proseViolations];

  return buildReport(violations, {
    wordCount,
    paragraphCount,
    sentenceCount: proseMetrics.sentenceCount,
    fleschReadingEase: proseMetrics.fleschReadingEase,
    fleschKincaidGrade: proseMetrics.fleschKincaidGrade,
    passiveVoiceRatio: proseMetrics.passiveVoiceRatio,
    sentenceLengthStdDev: proseMetrics.sentenceLengthStdDev,
  });
}

async function main() {
  const arg = process.argv[2];
  const text = await readInput(arg);

  if (!text.trim()) {
    process.stderr.write('check-copy: empty input\n');
    process.exit(2);
  }

  const report = await checkCopy(text);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.pass ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href;
if (isMain) {
  main().catch((err) => {
    process.stderr.write(`check-copy: ${err.stack || err.message}\n`);
    process.exit(2);
  });
}
