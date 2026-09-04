// Style profiles: the small set of thresholds that legitimately differ by
// register, and nothing else.
//
// The distinction this file draws, and the reason it is this short:
//
//   Universal — abstraction density, AI-tell vocabulary, sentence-length
//   uniformity, repeated words. These do not vary by register. Vague prose
//   is vague in a landing page and in an essay; a draft whose sentences all
//   land within two words of each other reads as machine output either way.
//   Measured across published landing copy, a literary essay, Orwell, and
//   technical documentation, concrete-noun share stayed within 0.774-1.000
//   for all four. There is no register in which abstraction is good, so
//   there is no threshold here to vary.
//
//   Per-register — reading grade, reading ease, em-dash rate, and the
//   sentence-length floor. These genuinely differ, and holding all
//   registers to one number is what made the gate report fourteen warnings
//   against a good essay.
//
// Four fields, and adding a fifth is a real decision rather than a
// formality: every field here has to be read by a rule in tells.mjs or
// prose.mjs, or it is a knob that appears configurable and does nothing.
// An `anchorPer1000Min` field lived here briefly and was removed for
// exactly that reason — anchors (numbers, proper nouns, prices, quoted
// material) do vary by register, 28.9 per 1000 words in an essay against a
// landing page's 74.6, but no rule scores them, so the field was
// documentation pretending to be configuration.
//
// Three profiles, not eight. Each exists because a measured sample failed
// under `general` for a reason that was the register's fault rather than
// the draft's. A fourth gets added the same way — when a real draft fails
// for a reason a threshold here should have allowed — not in advance.

export const PROFILES = {
  // Marketing, product, and UI copy. Short sentences, plain vocabulary.
  // The measured landing-page sample ran grade 2.8.
  marketing: {
    label: 'marketing',
    readingGradeMax: 9,
    readingEaseMin: 55,
    emDashPer1000Max: 2,
    minSentenceLengthStdDev: 4,
  },

  // The default. General-audience prose with no stated register: docs,
  // announcements, internal writing.
  general: {
    label: 'general',
    readingGradeMax: 10,
    readingEaseMin: 50,
    emDashPer1000Max: 2,
    minSentenceLengthStdDev: 3,
  },

  // Essays, articles, technical writing, anything argued at length. Longer
  // sentences and subordinate clauses are the register working correctly,
  // not drift. The measured essay sample ran grade 11.7 — fine for the
  // register, and a violation under `general`.
  //
  // The em-dash allowance matters most here: two dashes in 173 words tripped
  // the AI-tic threshold on prose using them for a single ordinary aside.
  // The tic is dashes as a structural default, which shows at higher rates
  // than considered use ever reaches.
  'long-form': {
    label: 'long-form',
    readingGradeMax: 14,
    readingEaseMin: 35,
    emDashPer1000Max: 6,
    minSentenceLengthStdDev: 5,
  },
};

export const DEFAULT_PROFILE = 'general';

export function resolveProfile(name) {
  if (!name) return PROFILES[DEFAULT_PROFILE];
  const profile = PROFILES[name];
  if (!profile) {
    const known = Object.keys(PROFILES).join(', ');
    throw new Error(`unknown profile "${name}" (known: ${known})`);
  }
  return profile;
}
