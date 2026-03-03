import test from "node:test";
import assert from "node:assert/strict";

import { buildLaserEnvelope, createLaserPreset } from "../src/sound.js";

test("laser presets loop predictably by variant", () => {
  assert.deepEqual(createLaserPreset(0), createLaserPreset(4));
  assert.deepEqual(createLaserPreset(1), createLaserPreset(5));
});

test("laser envelopes preserve a tiny attack and match release to duration", () => {
  const preset = createLaserPreset(2);
  const envelope = buildLaserEnvelope(preset);

  assert.equal(envelope.attack, 0.005);
  assert.equal(envelope.release, preset.duration);
  assert.ok(envelope.body > 0);
});
