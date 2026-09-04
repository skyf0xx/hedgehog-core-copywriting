#!/usr/bin/env node
// checkCopy() as a real CLI: mechanical AI-tell and prose-quality gates
// run as deterministic code and reported as structured JSON, not graded
// by the agent that wrote the draft. Read a file path (or stdin), print
// a validated report to stdout, exit 1 if any error-severity violation
// fired — a real gate the copy-writer loop cannot talk its way past.
//
// Usage: node index.mjs <file> [--style <profile>]
//        cat draft.md | node index.mjs - --style long-form
//
// The profile selects register-dependent thresholds only (reading grade,
// em-dash rate, sentence-length floor). The checks that decide whether a
// draft is machine-shaped — abstraction density and AI-tell phrasing —
// are identical in every profile, because no register makes them acceptable.

import { readFile } from 'node:fs/promises';
import { checkTells } from './rules/tells.mjs';
import { checkProse } from './rules/prose.mjs';
import { checkAbstraction } from './rules/abstraction.mjs';
import { resolveProfile, PROFILES, DEFAULT_PROFILE } from './rules/profiles.mjs';
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

export async function checkCopy(text, { style } = {}) {
  const profile = resolveProfile(style);
  const wordCount = countWords(text);
  const paragraphCount = countParagraphs(text);

  const tellViolations = checkTells(text, { wordCount, profile });
  const { violations: proseViolations, metrics: proseMetrics } = await checkProse(text, { wordCount, profile });
  const { violations: abstractionViolations, metrics: abstractionMetrics } = checkAbstraction(text);

  const violations = [...tellViolations, ...proseViolations, ...abstractionViolations];

  return buildReport(violations, {
    profile: profile.label,
    wordCount,
    paragraphCount,
    sentenceCount: proseMetrics.sentenceCount,
    fleschReadingEase: proseMetrics.fleschReadingEase,
    fleschKincaidGrade: proseMetrics.fleschKincaidGrade,
    passiveVoiceRatio: proseMetrics.passiveVoiceRatio,
    sentenceLengthStdDev: proseMetrics.sentenceLengthStdDev,
    concreteNounShare: abstractionMetrics.concreteNounShare,
    nounCount: abstractionMetrics.nounCount,
  });
}

// Minimal flag parsing — one option, and adding a dependency to read it
// would be more machinery than the whole CLI surface justifies.
function parseArgs(argv) {
  const args = { file: undefined, style: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--style') {
      args.style = argv[++i];
    } else if (argv[i].startsWith('--style=')) {
      args.style = argv[i].slice('--style='.length);
    } else if (args.file === undefined) {
      args.file = argv[i];
    }
  }
  return args;
}

async function main() {
  const { file: arg, style } = parseArgs(process.argv.slice(2));

  if (style && !PROFILES[style]) {
    process.stderr.write(
      `check-copy: unknown style "${style}" — known: ${Object.keys(PROFILES).join(', ')} (default: ${DEFAULT_PROFILE})\n`,
    );
    process.exit(2);
  }

  const text = await readInput(arg);

  if (!text.trim()) {
    process.stderr.write('check-copy: empty input\n');
    process.exit(2);
  }

  const report = await checkCopy(text, { style });
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
