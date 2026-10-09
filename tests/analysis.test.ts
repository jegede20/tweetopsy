import test from "node:test";
import assert from "node:assert/strict";
import { analyze } from "@/lib/analysis";

const strongTweet = `Most people think the best ideas arrive fully formed. They don't.\n\nA rough first draft is a door, not a verdict. Write the messy version today; make it beautiful tomorrow.`;

test("strong contrarian story has a recognizable hook and a bounded score", () => {
  const result = analyze(strongTweet);
  assert.equal(result.hookPattern, "Contrarian");
  assert.equal(result.checks.hook.highlights.length, 1);
  assert.ok(result.score >= 60 && result.score <= 100);
  assert.equal(result.cause, "Contrarian hook");
});

test("weak vague post remains analyzable and suggests practical fixes", () => {
  const result = analyze("I think maybe things are just kind of good sometimes.");
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.suggestions.length > 0);
  assert.equal(result.structure.key, "story");
});

test("numbered list is detected and uses the longer structure band", () => {
  const result = analyze("5 lessons I learned from starting over:\n1. Begin before you feel ready.\n2. Ask for help.\n3. Keep going when progress is quiet.\n4. Protect your attention.\n5. Notice how far you have come.");
  assert.equal(result.structure.key, "list");
  assert.equal(result.length.min, 130);
  assert.ok(result.checks.structure.score >= 8);
});

test("question opener is annotated as a question", () => {
  const result = analyze("Why do some ideas stay with us long after the conversation ends? The answer is often one useful detail, shared at exactly the right moment.");
  assert.equal(result.hookPattern, "Question");
  assert.equal(result.structure.key, "question");
  assert.ok(result.highlights.some((range) => range.kind === "hook"));
});

test("empty and emoji-only strings do not throw or receive a writing score", () => {
  for (const text of ["", "   ", "✨🧵🪄"]) {
    const result = analyze(text);
    assert.equal(result.score, 0);
    assert.equal(result.text, text);
    assert.deepEqual(result.highlights, []);
  }
});

test("an overlong first line scores below a concise opener", () => {
  const concise = analyze("Most people mistake motion for progress. A smaller first step changes that.");
  const long = analyze("Most people mistake motion for progress because they stay busy, fill every hour, and keep adding a new system instead of choosing the next useful action.");
  assert.ok(concise.checks.hook.score > long.checks.hook.score);
});

test("engagement estimate is separate from score and uses stats baseline", () => {
  const result = analyze("A short sample text.", { likes: 100, reposts: 10, replies: 5, views: 5000, followers: 1000 });
  assert.ok(result.engagement);
  assert.equal(result.engagement?.multiple, 1.5333333333333334);
  assert.equal(result.stats?.likes, 100);
});
