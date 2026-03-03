(function () {
  var display = document.getElementById("display");
  var keypad = document.querySelector(".keypad");
  var expression = "";

  function syncDisplay(value) {
    display.textContent = value || "0";
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

  keypad.addEventListener("click", function (event) {
    var button = event.target.closest("button");

    if (!button) {
      return;
    }

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

  document.addEventListener("keydown", function (event) {
    if (/^[0-9+\-*/.]$/.test(event.key)) {
      appendValue(event.key);
      return;
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

  syncDisplay("0");
})();
