(function () {
  var display = document.getElementById("display");
  var keypad = document.querySelector(".keypad");
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-mode-toggle]"));
  var modeLabel = document.getElementById("mode-label");
  var expression = "";
  var currentMode = "basic";
  var audioContext = null;
  var soundTimeout = null;

  var keypads = {
    basic: [
      { label: "C", action: "clear", className: "key--muted" },
      { label: "DEL", action: "backspace", className: "key--muted" },
      { label: "/", value: "/", className: "key--accent" },
      { label: "*", value: "*", className: "key--accent" },
      { label: "7", value: "7" },
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "-", value: "-", className: "key--accent" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
      { label: "+", value: "+", className: "key--accent" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "=", action: "evaluate", className: "key--equal" },
      { label: "0", value: "0", className: "key--wide" },
      { label: ".", value: "." }
    ],
    scientific: [
      { label: "C", action: "clear", className: "key--muted" },
      { label: "DEL", action: "backspace", className: "key--muted" },
      { label: "(", value: "(", className: "key--muted" },
      { label: ")", value: ")", className: "key--muted" },
      { label: "/", value: "/", className: "key--accent" },
      { label: "sin", value: "sin(", className: "key--scientific" },
      { label: "cos", value: "cos(", className: "key--scientific" },
      { label: "tan", value: "tan(", className: "key--scientific" },
      { label: "log", value: "log(", className: "key--scientific" },
      { label: "ln", value: "ln(", className: "key--scientific" },
      { label: "pi", value: "pi", className: "key--scientific" },
      { label: "e", value: "e", className: "key--scientific" },
      { label: "sqrt", value: "sqrt(", className: "key--scientific" },
      { label: "x^2", value: "^2", className: "key--scientific" },
      { label: "x^y", value: "^", className: "key--accent" },
      { label: "7", value: "7" },
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "abs", value: "abs(", className: "key--scientific" },
      { label: "*", value: "*", className: "key--accent" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
      { label: ".", value: "." },
      { label: "-", value: "-", className: "key--accent" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "0", value: "0" },
      { label: "+", value: "+", className: "key--accent" },
      { label: "=", action: "evaluate", className: "key--equal key--equal-scientific" }
    ]
  };

  function syncDisplay(value) {
    display.textContent = value || "0";
  }

  function getAudioContext() {
    if (audioContext) {
      return audioContext;
    }

    var AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    audioContext = new AudioContextConstructor();
    return audioContext;
  }

  function fireLaser(button) {
    var context = getAudioContext();

    if (button && button.classList && button.classList.add) {
      button.classList.add("key--firing");
      clearTimeout(soundTimeout);
      soundTimeout = setTimeout(function () {
        button.classList.remove("key--firing");
      }, 120);
    }

    if (!context) {
      return;
    }

    if (typeof context.resume === "function" && context.state === "suspended") {
      context.resume();
    }

    var now = typeof context.currentTime === "number" ? context.currentTime : 0;
    var oscillator = context.createOscillator();
    var gainNode = context.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.09);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  function isPlayableKey(key) {
    if (/^[0-9+\-*/.^()]$/.test(key)) {
      return true;
    }

    if (key === "Enter" || key === "=" || key === "Backspace" || key === "Escape") {
      return true;
    }

    return key.toLowerCase() === "c" || (currentMode === "scientific" && (key.toLowerCase() === "p" || key.toLowerCase() === "e"));
  }

  function appendValue(value) {
    expression += value;
    syncDisplay(expression);
  }

  function clearDisplay() {
    expression = "";
    syncDisplay("0");
  }

  function backspace() {
    expression = expression.slice(0, -1);
    syncDisplay(expression || "0");
  }

  function evaluate() {
    try {
      expression = window.calculatorCore.evaluateExpression(expression);
      syncDisplay(expression);
    } catch (error) {
      expression = "";
      syncDisplay("Error");
    }
  }

  function createKey(buttonConfig) {
    var button = document.createElement("button");
    var classNames = ["key"];

    button.type = "button";
    button.textContent = buttonConfig.label;

    if (buttonConfig.className) {
      classNames = classNames.concat(buttonConfig.className.split(" "));
    }

    button.className = classNames.join(" ");

    if (buttonConfig.value) {
      button.dataset.value = buttonConfig.value;
    }

    if (buttonConfig.action) {
      button.dataset.action = buttonConfig.action;
    }

    return button;
  }

  function renderKeypad(mode) {
    keypad.textContent = "";
    keypad.className = "keypad keypad--" + mode;

    keypads[mode].forEach(function (buttonConfig) {
      keypad.appendChild(createKey(buttonConfig));
    });
  }

  function setMode(mode) {
    currentMode = mode;
    renderKeypad(mode);
    modeButtons.forEach(function (button) {
      button.classList.toggle("mode-toggle__button--active", button.dataset.modeToggle === mode);
      button.setAttribute("aria-pressed", button.dataset.modeToggle === mode ? "true" : "false");
    });

    if (modeLabel) {
      modeLabel.textContent = mode === "scientific" ? "Scientific Flight Computer" : "Basic Flight Computer";
    }
  }

  keypad.addEventListener("click", function (event) {
    var button = event.target.closest("button");

    if (!button) {
      return;
    }

    fireLaser(button);

    if (button.dataset.value) {
      appendValue(button.dataset.value);
      return;
    }

    switch (button.dataset.action) {
      case "clear":
        clearDisplay();
        break;
      case "backspace":
        backspace();
        break;
      case "evaluate":
        evaluate();
        break;
      default:
        break;
    }
  });

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setMode(button.dataset.modeToggle);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (isPlayableKey(event.key)) {
      fireLaser();
    }

    if (/^[0-9+\-*/.^()]$/.test(event.key)) {
      appendValue(event.key);
      return;
    }

    if (currentMode === "scientific") {
      if (event.key.toLowerCase() === "p") {
        appendValue("pi");
        return;
      }

      if (event.key.toLowerCase() === "e") {
        appendValue("e");
        return;
      }
    }

    if (event.key === "Enter" || event.key === "=") {
      event.preventDefault();
      evaluate();
      return;
    }

    if (event.key === "Backspace") {
      backspace();
      return;
    }

    if (event.key.toLowerCase() === "c" || event.key === "Escape") {
      clearDisplay();
    }
  });

  setMode("basic");
  syncDisplay("0");
})();
