const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluateExpression } = require("../calculator-core.js");

test("adds numbers", () => {
  assert.equal(evaluateExpression("2+3"), "5");
});

test("handles decimals", () => {
  assert.equal(evaluateExpression("7.5/2.5"), "3");
});

test("rejects invalid input", () => {
  assert.throws(() => evaluateExpression("2+abc"), /Invalid characters/);
});

test("rejects non-finite results", () => {
  assert.throws(() => evaluateExpression("10/0"), /not finite/);
});

test("app wires keypad and keyboard interactions", () => {
  const display = { textContent: "" };
  const listeners = {};
  const keypad = {
    addEventListener(type, handler) {
      listeners[type] = handler;
    }
  };

  global.window = { calculatorCore: { evaluateExpression } };
  global.document = {
    getElementById(id) {
      return id === "display" ? display : null;
    },
    querySelector(selector) {
      return selector === ".keypad" ? keypad : null;
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
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

  delete global.window;
  delete global.document;
});
