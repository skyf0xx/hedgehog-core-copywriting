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
  const text = `The team shipped the feature today. The team tested the feature today. The team reviewed the feature today. The team deployed the feature today.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/low-burstiness'));
});
