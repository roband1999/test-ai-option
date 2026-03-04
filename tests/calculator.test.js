const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluateExpression } = require("../calculator-core.js");

test("adds numbers", () => {
  assert.equal(evaluateExpression("2+3"), "5");
});

test("handles decimals", () => {
  assert.equal(evaluateExpression("7.5/2.5"), "3");
});

test("supports scientific functions and constants", () => {
  assert.equal(evaluateExpression("sqrt(81)+log(100)+ln(e)+sin(pi/2)+abs(-4)"), "17");
});

test("supports exponents", () => {
  assert.equal(evaluateExpression("2^3+3^2"), "17");
});

test("rejects invalid input", () => {
  assert.throws(() => evaluateExpression("2+abc"), /Invalid characters/);
});

test("rejects unbalanced parentheses", () => {
  assert.throws(() => evaluateExpression("sqrt(9"), /Unbalanced parentheses/);
});

test("rejects non-finite results", () => {
  assert.throws(() => evaluateExpression("10/0"), /not finite/);
});

test("app wires keypad and keyboard interactions", () => {
  const display = { textContent: "" };
  const listeners = {};
  const modeListeners = {};
  const appendedButtons = [];
  const audioEvents = [];
  const calculatorClasses = new Set();
  const calculator = {
    classList: {
      toggle(className, force) {
        if (force) {
          calculatorClasses.add(className);
          return true;
        }

        calculatorClasses.delete(className);
        return false;
      }
    }
  };
  const keypad = {
    className: "keypad keypad--basic",
    textContent: "",
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    appendChild(node) {
      appendedButtons.push(node);
    }
  };
  const modeButtons = [
    {
      dataset: { modeToggle: "basic" },
      setAttribute() {},
      addEventListener(type, handler) {
        modeListeners.basic = handler;
      },
      classList: { toggle() {} }
    },
    {
      dataset: { modeToggle: "scientific" },
      setAttribute() {},
      addEventListener(type, handler) {
        modeListeners.scientific = handler;
      },
      classList: { toggle() {} }
    }
  ];

  function MockAudioContext() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }

  MockAudioContext.prototype.createOscillator = function () {
    return {
      type: "",
      frequency: {
        setValueAtTime(value, time) {
          audioEvents.push(["frequency:set", value, time]);
        },
        exponentialRampToValueAtTime(value, time) {
          audioEvents.push(["frequency:ramp", value, time]);
        }
      },
      connect() {},
      start(time) {
        audioEvents.push(["oscillator:start", time]);
      },
      stop(time) {
        audioEvents.push(["oscillator:stop", time]);
      }
    };
  };

  MockAudioContext.prototype.createGain = function () {
    return {
      gain: {
        setValueAtTime(value, time) {
          audioEvents.push(["gain:set", value, time]);
        },
        exponentialRampToValueAtTime(value, time) {
          audioEvents.push(["gain:ramp", value, time]);
        }
      },
      connect() {}
    };
  };

  MockAudioContext.prototype.resume = function () {
    audioEvents.push(["resume"]);
  };

  global.window = {
    calculatorCore: { evaluateExpression },
    AudioContext: MockAudioContext
  };
  global.document = {
    getElementById(id) {
      if (id === "display") {
        return display;
      }

      if (id === "mode-label") {
        return { textContent: "" };
      }

      return null;
    },
    querySelector(selector) {
      if (selector === ".keypad") {
        return keypad;
      }

      if (selector === ".calculator") {
        return calculator;
      }

      return null;
    },
    querySelectorAll(selector) {
      return selector === "[data-mode-toggle]" ? modeButtons : [];
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    createElement(tagName) {
      return {
        tagName,
        type: "",
        textContent: "",
        className: "",
        dataset: {},
        classList: {
          add() {},
          remove() {}
        }
      };
    }
  };

  delete require.cache[require.resolve("../app.js")];
  require("../app.js");

  assert.equal(display.textContent, "0");

  listeners.click({
    target: {
      dataset: { value: "8" },
      classList: { add() {}, remove() {} },
      closest() {
        return this;
      }
    }
  });

  listeners.keydown({ key: "+" });
  listeners.keydown({ key: "2" });
  listeners.keydown({ key: "Enter", preventDefault() {} });
  assert.equal(display.textContent, "10");

  listeners.keydown({ key: "Backspace" });
  assert.equal(display.textContent, "1");

  listeners.keydown({ key: "Escape" });
  assert.equal(display.textContent, "0");
  assert.equal(calculatorClasses.has("calculator--devilish"), false);

  listeners.keydown({ key: "6" });
  listeners.keydown({ key: "6" });
  listeners.keydown({ key: "6" });
  assert.equal(display.textContent, "666");
  assert.equal(calculatorClasses.has("calculator--devilish"), true);

  listeners.keydown({ key: "Backspace" });
  assert.equal(display.textContent, "66");
  assert.equal(calculatorClasses.has("calculator--devilish"), false);

  listeners.keydown({ key: "Escape" });
  assert.equal(display.textContent, "0");

  modeListeners.scientific();
  listeners.click({
    target: {
      dataset: { value: "sqrt(" },
      closest() {
        return this;
      }
    }
  });
  listeners.keydown({ key: "9" });
  listeners.click({
    target: {
      dataset: { value: ")" },
      closest() {
        return this;
      }
    }
  });
  listeners.keydown({ key: "Enter", preventDefault() {} });
  assert.equal(display.textContent, "3");
  assert.equal(keypad.className, "keypad keypad--scientific");
  assert.ok(appendedButtons.length > 0);
  assert.ok(audioEvents.some((event) => event[0] === "oscillator:start"));
  const eventCount = audioEvents.length;

  listeners.keydown({ key: "q" });
  assert.equal(audioEvents.length, eventCount);

  delete global.window;
  delete global.document;
});
