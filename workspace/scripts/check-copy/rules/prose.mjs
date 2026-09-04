// Prose-quality checks: passive voice, weasel words, repeated words,
// readability, and sentence-length variance (burstiness). Backed by retext
// plugins rather than hand-rolled grammar/readability logic — sentence
// boundary detection and syllable counting are both known to be
// error-prone to reimplement from scratch.
//
// Readability thresholds live in profiles.mjs, not here: reading grade is
// the clearest case of a number that is only meaningful relative to a
// register. A single ceiling reported a good essay as too dense for
// writing exactly as dense as an essay should be.
//
// write-good was removed rather than tuned. Measured against a validation
// set, its `adverb` check ("X can weaken meaning") produced eight false
// positives on one good essay and two true ones; disabling the noisy
// checks left a residue that still fired on three good samples
// ("it is" is wordy) while falling silent on the AI-shaped one — signal
// anti-correlated with quality. Its `weasel` check duplicated
// retext-intensify, its `passive` check duplicated retext-passive (and had
// to be deduped by character offset), and its `cliches` check caught one
// of seven stacked clichés in a deliberately loaded test. Clichés are
// covered as explicit phrases in tells.mjs, where a phrase list works.

import { unified } from 'unified';
import retextEnglish from 'retext-english';
import retextStringify from 'retext-stringify';
import retextPassive from 'retext-passive';
import retextIntensify from 'retext-intensify';
import retextRepeatedWords from 'retext-repeated-words';
import retextReadability from 'retext-readability';
import { visit } from 'unist-util-visit';
import { toString } from 'nlcst-to-string';
import { syllable } from 'syllable';
import { flesch } from 'flesch';
import { fleschKincaid } from 'flesch-kincaid';

// retext-intensify's `weasel` rule fires off a merged fillers+hedges+weasels
// word list (see retext-intensify/lib/index.js) with no way to select a
// subset at match time — only an `ignore` list of exact phrases. A chunk of
// that merged list (from the `weasels` package specifically) is ordinary
// grammatical/connective vocabulary with no hedging signal on its own —
// "that", "then", "so", "just", "also", "still", "about", "up", "down",
// "well" carry the sentence in normal conversational prose and fire on
// nearly every casual paragraph regardless of quality. Ignored here so the
// rule keeps catching actual vagueness (arguably, reportedly, some, often,
// probably, experts, and the rest of `weasels`/`hedges`/`fillers`) without
// the noise floor drowning it out on a casual or humorous register.
// Three distinguishable categories share one merged list, and only one of
// them is a quality signal:
//
//   1. Actual hedging — `arguably`, `reportedly`, `allegedly`, `presumably`,
//      `supposedly`, `somewhat`, `experts`, `probably`. Kept: these mark a
//      claim the writer is declining to stand behind.
//   2. Ordinary grammar — `that`, `then`, `so`, `only`, `rather`, `better`,
//      `few`, `most`, `can`, `will`, `would`, `should`, `must`. Ignored:
//      these carry sentences in every register and fire on nearly every
//      paragraph regardless of quality.
//   3. Perception and cognition verbs — `saw`, `knew`, `felt`, `looked`,
//      `noticed`, `thought`, `wondered`, `watched`. Ignored, and these are
//      the clearest case: concrete narrative writing is built from them, so
//      flagging them penalizes exactly the specificity the rest of this
//      gate rewards.
//
// Measured effect: a literary essay drew 14 warnings before this list and
// the write-good removal, of which 2 were fair. Comparatives (`better`) and
// restrictives (`only`) accounted for the largest share of the rest.
const WEASEL_IGNORE = [
  // Connectives and ordinary function words.
  'about', 'again', 'all', 'also', 'back', 'even', 'ever', 'far', 'just',
  'like', 'over', 'own', 'so', 'still', 'that', 'then', 'up', 'well',
  'only', 'rather', 'quite', 'enough', 'close', 'real', 'right', 'too',
  // Comparatives and quantifiers doing ordinary work.
  'better', 'few', 'most', 'many', 'much', 'little', 'bit', 'lots', 'sort',
  'several', 'various', 'huge', 'vast', 'tiny', 'pretty',
  // Modals: these state a claim's strength, which is grammar, not hedging.
  'can', 'will', 'would', 'should', 'must', 'may', 'might', 'could',
  // Perception and cognition verbs — the vocabulary of concrete writing.
  'saw', 'knew', 'felt', 'looked', 'looks', 'noticed', 'thought', 'watched',
  'wondered', 'wanted', 'wished', 'understood', 'realised', 'realized',
  'recognised', 'recognized', 'heard', 'smelled', 'touched', 'began',
  'started', 'decided', 'find', 'finds', 'found', 'say', 'says', 'read',
  'think', 'thinks', 'consider', 'considers', 'understand', 'understands',
  // Ordinary verbs the list treats as vague.
  'helps', 'works', 'supports', 'acts', 'gains', 'improved', 'useful',
  'effective', 'efficient', 'excellent',
];

const SENTENCE_SPLIT = /[.!?]+[\s\n]+/;
const NOMINALIZATION = /\b\w+(tion|ment|ance|ence)s?\b/gi;

function excerptAround(text, index, length, radius = 40) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

function splitSentences(text) {
  return text
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export async function checkProse(text, { wordCount, profile }) {
  const violations = [];
  const sentences = splitSentences(text);

  // Sentence-length variance (burstiness): human writing mixes short and
  // long sentences; uniform length reads as machine output. An error rather
  // than a warning — a structural tell, and structural tells are what
  // survive a model being told to avoid a vocabulary list.
  //
  // The sentence floor is eight, not four, precisely because this is now an
  // error. Standard deviation over a handful of sentences describes the
  // sample rather than the writing: measured across the validation set,
  // three-sentence samples ranged from 1.41 to 6.13 with no relation to
  // quality, and a four-sentence paragraph of good concrete prose scored
  // 2.77 — a failing draft under any useful threshold. At eight-plus
  // sentences the signal holds: the AI-shaped sample runs 2.24 across
  // twelve sentences while every good sample of comparable length clears 4.
  //
  // Note this check only fires below the floor. Bad prose can score high
  // (a deliberately abstract sample hit 9.93), so burstiness catches one
  // specific failure — mechanical uniformity — and is not evidence of
  // quality in the other direction.
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const lengthStdDev = stdDev(lengths);
  if (sentences.length >= 8 && lengthStdDev < profile.minSentenceLengthStdDev) {
    violations.push({
      rule: 'prose/low-burstiness',
      grain: 'document',
      severity: 'error',
      message: `Sentence length barely varies (stddev ${lengthStdDev.toFixed(1)} words, floor ${profile.minSentenceLengthStdDev} for ${profile.label}) — mix short and long sentences on purpose`,
      excerpt: '',
      location: {},
    });
  }

  // Nominalization density: verbs/adjectives turned into abstract nouns
  // (-tion/-ment/-ance/-ence) read as bureaucratic and remove the actor.
  const nominalizations = text.match(NOMINALIZATION) || [];
  const nominalizationRate = wordCount === 0 ? 0 : (nominalizations.length / wordCount) * 100;
  if (nominalizationRate > 3) {
    violations.push({
      rule: 'prose/nominalization-density',
      grain: 'document',
      severity: 'warning',
      message: `${nominalizations.length} nominalizations (${nominalizationRate.toFixed(1)}% of words) — prefer the verb form ("implement" over "implementation")`,
      excerpt: '',
      location: {},
    });
  }

  // retext pipeline: passive voice, weasel words, repeated words, readability.
  const processor = unified()
    .use(retextEnglish)
    .use(retextPassive)
    .use(retextIntensify, { ignore: WEASEL_IGNORE })
    .use(retextRepeatedWords)
    // Age tracks the profile's grade ceiling (US grade + ~5 years), so
    // per-sentence readability flags stay consistent with the
    // document-level grade check below rather than contradicting it.
    .use(retextReadability, { age: profile.readingGradeMax + 5, threshold: 4 })
    .use(retextStringify);

  const file = await processor.process(text);
  let passiveCount = 0;

  for (const msg of file.messages) {
    const start = msg.place?.start?.offset ?? 0;
    const end = msg.place?.end?.offset ?? start;
    const excerpt = excerptAround(text, start, end - start);

    if (msg.source === 'retext-passive') {
      passiveCount++;
      violations.push({
        rule: 'prose/passive-voice',
        grain: 'sentence',
        severity: 'warning',
        message: msg.reason,
        excerpt,
        location: {},
      });
    } else if (msg.source === 'retext-intensify' && msg.ruleId === 'weasel') {
      violations.push({
        rule: 'prose/weasel-word',
        grain: 'sentence',
        severity: 'warning',
        message: msg.reason,
        excerpt,
        location: {},
      });
    } else if (msg.source === 'retext-repeated-words') {
      violations.push({
        rule: 'prose/repeated-word',
        grain: 'sentence',
        severity: 'error',
        message: msg.reason,
        excerpt,
        location: {},
      });
    } else if (msg.source === 'retext-readability') {
      violations.push({
        rule: 'prose/hard-to-read-sentence',
        grain: 'sentence',
        severity: 'warning',
        message: msg.reason,
        excerpt,
        location: {},
      });
    }
  }

  const passiveVoiceRatio = sentences.length === 0 ? 0 : Math.min(1, passiveCount / sentences.length);

  // Document-level Flesch scores: retext-readability only flags individual
  // hard-to-read sentences, so counts are gathered from the same parse
  // tree and scored with the flesch/flesch-kincaid formulas directly.
  const tree = unified().use(retextEnglish).parse(text);
  const counts = { sentence: 0, word: 0, syllable: 0 };
  visit(tree, 'SentenceNode', () => {
    counts.sentence++;
  });
  visit(tree, 'WordNode', (node) => {
    counts.word++;
    counts.syllable += syllable(toString(node));
  });

  const fleschReadingEase = counts.sentence > 0 && counts.word > 0 ? flesch(counts) : null;
  const fleschKincaidGrade = counts.sentence > 0 && counts.word > 0 ? fleschKincaid(counts) : null;

  if (fleschReadingEase !== null && fleschReadingEase < profile.readingEaseMin) {
    violations.push({
      rule: 'prose/reading-ease',
      grain: 'document',
      severity: 'warning',
      message: `Flesch Reading Ease ${fleschReadingEase.toFixed(1)} is below the ${profile.label} floor of ${profile.readingEaseMin} — simplify sentence and word length`,
      excerpt: '',
      location: {},
    });
  }
  if (fleschKincaidGrade !== null && fleschKincaidGrade > profile.readingGradeMax) {
    violations.push({
      rule: 'prose/grade-level',
      grain: 'document',
      severity: 'warning',
      message: `Flesch-Kincaid grade ${fleschKincaidGrade.toFixed(1)} is above the ${profile.label} ceiling of ${profile.readingGradeMax} — shorten sentences or simplify vocabulary`,
      excerpt: '',
      location: {},
    });
  }

  return {
    violations,
    metrics: {
      sentenceCount: sentences.length,
      passiveVoiceRatio,
      sentenceLengthStdDev: lengthStdDev,
      fleschReadingEase,
      fleschKincaidGrade,
    },
  };
}
