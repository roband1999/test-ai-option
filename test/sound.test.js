import test from "node:test";
import assert from "node:assert/strict";

import { buildFartEnvelope, createFartPreset } from "../src/sound.js";

test("fart presets loop predictably by variant", () => {
  assert.deepEqual(createFartPreset(0), createFartPreset(4));
  assert.deepEqual(createFartPreset(1), createFartPreset(5));
});

test("fart envelopes keep a short attack and a meaningful hold", () => {
  const preset = createFartPreset(2);
  const envelope = buildFartEnvelope(preset);

  assert.equal(envelope.attack, 0.01);
  assert.ok(envelope.hold >= 0.08);
  assert.ok(envelope.release > envelope.hold);
});
