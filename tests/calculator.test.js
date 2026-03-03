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

  global.window = { calculatorCore: { evaluateExpression } };
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
      return selector === ".keypad" ? keypad : null;
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
        dataset: {}
      };
    }
  };

  delete require.cache[require.resolve("../app.js")];
  require("../app.js");

  assert.equal(display.textContent, "0");

  listeners.click({
    target: {
      dataset: { value: "8" },
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

  delete global.window;
  delete global.document;
});
