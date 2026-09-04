import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCopy } from '../index.mjs';

test('fails on text stacked with banned AI-tell vocabulary and phrasing', async () => {
  const text = `It's important to note that our platform is not just a tool — it's a comprehensive solution. We leverage cutting-edge technology to deliver a seamless, robust experience. This could potentially unlock a paradigm shift.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, false);
  assert.ok(report.errorCount > 0);
  assert.ok(report.violations.some((v) => v.rule === 'tells/banned-word'));
  assert.ok(report.violations.some((v) => v.rule === 'tells/negation-formula'));
  assert.ok(report.violations.some((v) => v.rule === 'tells/hedge-stack'));
});

test('reports banned vocabulary as a warning, not an error', async () => {
  // Vocabulary is the cheapest check to defeat by substitution, so it
  // reports rather than decides. This draft is concrete and varied apart
  // from two flagged words, and should not fail on them alone.
  const text = `We rebuilt the importer last March. It reads a 40MB CSV in eight seconds, down from four minutes, and it no longer chokes on the BOM that Excel writes. Sarah found the bug by diffing two exports byte for byte. The fix was a robust three-line change to leverage the existing parser.`;
  const report = await checkCopy(text);
  const banned = report.violations.filter((v) => v.rule === 'tells/banned-word');
  assert.ok(banned.length > 0, 'expected the banned words to still be reported');
  assert.ok(banned.every((v) => v.severity === 'warning'));
  assert.equal(report.pass, true);
});

test('fails abstract prose that dodges the vocabulary list entirely', async () => {
  // The failure mode the vocabulary rules structurally cannot catch: no
  // banned word, readable grade level, and nothing a reader could check.
  const text = `Modern teams face a growing set of demands on their time and attention. Managing work across many tools creates friction that slows delivery down. Our platform brings these workflows together in one place. The system connects to the services your team already uses. Teams that adopt this approach report faster cycle times and clearer visibility. Managers can see where work sits without asking for status updates.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, false);
  assert.ok(report.violations.some((v) => v.rule === 'prose/abstraction-density' && v.severity === 'error'));
  assert.ok(!report.violations.some((v) => v.rule === 'tells/banned-word'), 'sample should contain no banned vocabulary');
});

test('passes concrete prose in a register that scores high on the reading grade', async () => {
  // Long-form prose failed the general-audience grade ceiling for being
  // exactly as dense as the register calls for. The profile carries the
  // register-dependent thresholds; the universal checks are unchanged.
  const text = `The trouble with measuring writing is that the sentences we can count are rarely the sentences that matter. A sentence is not sharper for being short, nor duller for running long; Faulkner and Hemingway both wrote well, and any metric that ranks one above the other has told you about the metric instead of the prose. Counting cannot tell you that prose is good. It can tell you, reliably and cheaply, that prose is machine-shaped: that its sentences fall within a narrow band, that its vocabulary clusters around a handful of words no working writer reaches for.`;
  const strict = await checkCopy(text, { style: 'marketing' });
  const longForm = await checkCopy(text, { style: 'long-form' });
  assert.ok(strict.violations.some((v) => v.rule === 'prose/grade-level'));
  assert.ok(!longForm.violations.some((v) => v.rule === 'prose/grade-level'));
  assert.equal(longForm.pass, true);
});

test('rejects an unknown style rather than silently using the default', async () => {
  await assert.rejects(() => checkCopy('Some text here.', { style: 'nonsense' }), /unknown profile/);
});

test('does not score abstraction on passages too short to measure', async () => {
  const report = await checkCopy('The kettle boiled. Rachel poured.');
  assert.equal(report.metrics.concreteNounShare, null);
  assert.ok(!report.violations.some((v) => v.rule === 'prose/abstraction-density'));
});

test('flags a because-not-because negation contrast', async () => {
  const text = `A draft ships because a script checked it and exited 0, not because an agent read it and judged it clean.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, false);
  assert.ok(report.violations.some((v) => v.rule === 'tells/negation-formula'));
});

test('passes on plain, varied, concrete prose', async () => {
  const text = `Every handoff between Slack and your ticket tracker drops something. A decision made in chat never makes it into the ticket. We built a single feed that both tools write to. Comments sync both ways.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, true);
  assert.equal(report.errorCount, 0);
});

test('flags repeated words as an error', async () => {
  const text = `The cat sat on the the mat and looked around the room slowly before deciding where to go next.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/repeated-word' && v.severity === 'error'));
});

test('reports Flesch metrics on a real document', async () => {
  const text = `The cat sat on the mat. It watched the birds fly across the yard, wondering if it should chase them or simply enjoy the warm afternoon sun instead.`;
  const report = await checkCopy(text);
  assert.equal(typeof report.metrics.fleschReadingEase, 'number');
  assert.equal(typeof report.metrics.fleschKincaidGrade, 'number');
});

test('flags low sentence-length variance (burstiness) on uniform sentences', async () => {
  const text = [
    'The team shipped the feature today.',
    'The team tested the feature today.',
    'The team reviewed the feature today.',
    'The team deployed the feature today.',
    'The team measured the feature today.',
    'The team debugged the feature today.',
    'The team released the feature today.',
    'The team monitored the feature today.',
  ].join(' ');
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/low-burstiness' && v.severity === 'error'));
});

test('does not flag burstiness on short passages, where variance is noise', async () => {
  // Four sentences of good, concrete prose measure a stddev of 2.8 — below
  // every profile floor, purely because four samples cannot describe a
  // distribution. Failing this draft is the false positive the sentence
  // floor exists to prevent.
  const text = `Every handoff between Slack and your ticket tracker drops something. A decision made in chat never makes it into the ticket. We built a single feed that both tools write to. Comments sync both ways.`;
  const report = await checkCopy(text);
  assert.ok(!report.violations.some((v) => v.rule === 'prose/low-burstiness'));
});

test('does not flag ordinary connective words as weasel words', async () => {
  const text = `Then there's the whiskers. The cat still runs the household from that chair by the window. It just makes the smugness official.`;
  const report = await checkCopy(text);
  const weaselWords = report.violations
    .filter((v) => v.rule === 'prose/weasel-word')
    .map((v) => v.message);
  assert.ok(
    !weaselWords.some((m) => /`(that|Then|still|just|also|so|about)`/i.test(m)),
    `expected no weasel-word hits on connective words, got: ${weaselWords.join(', ')}`,
  );
});

test('still flags genuine hedging as a weasel word', async () => {
  const text = `Some experts say the results are arguably promising, though the study reportedly used a small sample.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/weasel-word'));
});
