// The output contract every rule module returns through, and the shape
// checkCopy() emits as JSON. This is what makes the gate mechanical: the
// caller (the loop skill, read by an agent) parses a fixed shape rather
// than trusting prose about whether the draft "looks clean."

import { z } from 'zod';

export const grain = z.enum(['sentence', 'paragraph', 'document']);
export const severity = z.enum(['error', 'warning']);

export const violation = z.object({
  rule: z.string().min(1),
  grain,
  severity,
  message: z.string().min(1),
  excerpt: z.string(),
  location: z.object({
    paragraph: z.number().int().min(0).optional(),
    sentence: z.number().int().min(0).optional(),
  }),
});

export const report = z.object({
  pass: z.boolean(),
  violationCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  violations: z.array(violation),
  metrics: z.object({
    profile: z.string().min(1),
    wordCount: z.number().int().min(0),
    sentenceCount: z.number().int().min(0),
    paragraphCount: z.number().int().min(0),
    fleschReadingEase: z.number().nullable(),
    fleschKincaidGrade: z.number().nullable(),
    passiveVoiceRatio: z.number().min(0).max(1),
    sentenceLengthStdDev: z.number().min(0),
    // null below the noun-count floor, where the ratio is too noisy to
    // report as if it meant something. See abstraction.mjs.
    concreteNounShare: z.number().min(0).max(1).nullable(),
    nounCount: z.number().int().min(0),
  }),
});

export function buildReport(violations, metrics) {
  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.length - errorCount;
  return report.parse({
    pass: errorCount === 0,
    violationCount: violations.length,
    errorCount,
    warningCount,
    violations,
    metrics,
  });
}
