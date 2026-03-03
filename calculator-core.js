(function (globalScope) {
  function sanitizeExpression(expression) {
    return String(expression || "").replace(/\s+/g, "");
  }

  function isValidExpression(expression) {
    return /^[0-9+\-*/.()]+$/.test(expression);
  }

  function evaluateExpression(expression) {
    var sanitized = sanitizeExpression(expression);

    if (!sanitized) {
      return "0";
    }

    if (!isValidExpression(sanitized)) {
      throw new Error("Invalid characters in expression.");
    }

    var result = Function('"use strict"; return (' + sanitized + ");")();

    if (!Number.isFinite(result)) {
      throw new Error("Result is not finite.");
    }

    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(10)));
  }

  var calculatorCore = {
    evaluateExpression: evaluateExpression
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = calculatorCore;
  } else {
    globalScope.calculatorCore = calculatorCore;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
