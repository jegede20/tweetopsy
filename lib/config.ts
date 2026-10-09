export const CHECK_WEIGHTS = {
  hook: 30,
  rhythm: 20,
  emotion: 20,
  structure: 15,
  length: 15,
} as const;

export const VERDICTS = [
  { min: 80, label: "Built to travel" },
  { min: 60, label: "Strong" },
  { min: 40, label: "Decent" },
  { min: 0, label: "Flat" },
] as const;

// Ordered by the strength of the opening pattern; keep this list editable.
export const HOOK_RULES = [
  {
    key: "contrarian",
    label: "Contrarian",
    expression: "^(?:most people|everyone thinks|unpopular opinion|hot take|the truth is|stop\\b|don't\\b|do not\\b|you've been lied to|actually\\b|it's not|it is not)",
  },
  {
    key: "numbered-list",
    label: "Numbered list",
    expression: "^(?:(?:\\d{1,2})[.)]|(?:top|\\d+\\s+(?:ways|things|lessons|rules|mistakes))\\b)",
  },
  {
    key: "question",
    label: "Question",
    expression: "^(?:why|how|what|when|where|who|which|would|could|have you|do you)\\b|\\?\\s*$",
  },
  {
    key: "curiosity-gap",
    label: "Curiosity gap",
    expression: "^(?:here's what|here is what|what nobody|what no one|the reason|no one tells you|nobody tells you|this is why|the secret|i found out|until)\\b",
  },
  {
    key: "story-open",
    label: "Story open",
    expression: "^(?:i\\b|when\\b|last (?:night|week|month|year)\\b|one day\\b|the day\\b|in 20\\d{2}\\b)",
  },
] as const;

export const EMOTION_LEXICON = {
  curiosity: ["why", "secret", "discover", "unexpected", "wonder", "curious", "reveal", "hidden", "what if", "unanswered", "truth", "mystery"],
  "fear / loss": ["lose", "risk", "mistake", "fear", "never", "warning", "pain", "avoid", "cost", "danger", "waste", "regret"],
  outrage: ["wrong", "lied", "unfair", "broken", "absurd", "angry", "rigged", "nobody", "stop", "disgrace", "garbage", "hate"],
  awe: ["incredible", "astonishing", "impossible", "beautiful", "extraordinary", "remarkable", "wild", "massive", "unbelievable", "first ever"],
  aspiration: ["build", "success", "freedom", "learn", "better", "growth", "dream", "achieve", "future", "master", "confidence", "independent"],
} as const;

export const STRUCTURE_RULES = {
  list: "(?:^|\\n)\\s*(?:\\d{1,2}[.)]|[-*•])\\s+|^.{0,70}\\b\\d+\\s+(?:things|ways|lessons|rules|steps|ideas|mistakes)\\b",
  howTo: "^(?:how to\\b|here'?s how\\b|step[- ]by[- ]step\\b|to \\w+[^\\n]{0,50},)",
  question: "\\?|^(?:why|how|what|when|where|who|which)\\b",
  contrarian: "^(?:most people|everyone thinks|unpopular opinion|hot take|the truth is|stop\\b|don't\\b|do not\\b|you've been lied to|actually\\b|it's not|it is not)",
  story: "^(?:i\\b|when\\b|last (?:night|week|month|year)\\b|one day\\b|the day\\b|in 20\\d{2}\\b)",
  commandWords: ["stop", "start", "try", "write", "remember", "make", "build", "ask", "use", "keep", "choose", "take", "read", "save", "delete", "imagine", "notice", "do", "never", "please"],
} as const;

// Bands are in characters. They are deliberately broad writing heuristics, not platform limits.
export const LENGTH_BANDS = {
  contrarian: { min: 45, max: 180 },
  question: { min: 65, max: 210 },
  list: { min: 130, max: 275 },
  howTo: { min: 100, max: 250 },
  story: { min: 130, max: 270 },
  command: { min: 55, max: 190 },
  default: { min: 80, max: 220 },
} as const;

export const ENGAGEMENT_BASELINES = {
  // Baseline interaction rates used for a rough comparison only.
  viewsRate: 0.015,
  followerRate: 0.04,
} as const;

export const MAX_HISTORY = 50;
export const MAX_TWEET_LENGTH_FOR_AI = 5000;
