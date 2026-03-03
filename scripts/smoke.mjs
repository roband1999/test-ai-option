import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appUrl = pathToFileURL(path.join(rootDir, "src", "app.js")).href;

const clickedVariants = [];
const buttonListeners = [];

class FakeAudioParam {
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeAudioNode {
  constructor() {
    this.gain = new FakeAudioParam();
    this.frequency = new FakeAudioParam();
    this.Q = new FakeAudioParam();
  }

  connect() {}
  start() {}
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }

  createOscillator() {
    return new FakeAudioNode();
  }

  createGain() {
    return new FakeAudioNode();
  }

  createBiquadFilter() {
    return new FakeAudioNode();
  }

  resume() {
    return Promise.resolve();
  }
}

const buttons = Array.from({ length: 4 }, (_, variant) => ({
  dataset: { laserVariant: String(variant) },
  addEventListener(type, listener) {
    if (type === "click") {
      buttonListeners.push({ listener, variant });
    }
  }
}));

globalThis.window = { AudioContext: FakeAudioContext };
globalThis.document = {
  querySelectorAll(selector) {
    if (selector !== "[data-laser-variant]") {
      throw new Error(`Unexpected selector: ${selector}`);
    }

    return buttons;
  }
};

await import(appUrl);

for (const { listener, variant } of buttonListeners) {
  await listener();
  clickedVariants.push(variant);
}

if (clickedVariants.length !== buttons.length) {
  throw new Error(`Expected ${buttons.length} buttons to register, received ${clickedVariants.length}`);
}

console.log(`Smoke test passed for ${clickedVariants.length} laser buttons`);
