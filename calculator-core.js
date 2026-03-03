(function (globalScope) {
  var SCIENTIFIC_FUNCTIONS = {
    sin: "Math.sin",
    cos: "Math.cos",
    tan: "Math.tan",
    log: "Math.log10",
    ln: "Math.log",
    sqrt: "Math.sqrt",
    abs: "Math.abs"
  };

  function sanitizeExpression(expression) {
    return String(expression || "").replace(/\s+/g, "");
  }

  function isValidExpression(expression) {
    return /^[0-9a-z+\-*/^.,()]+$/i.test(expression);
  }

  function hasBalancedParentheses(expression) {
    var depth = 0;

    for (var index = 0; index < expression.length; index += 1) {
      if (expression[index] === "(") {
        depth += 1;
      } else if (expression[index] === ")") {
        depth -= 1;
      }

      if (depth < 0) {
        return false;
      }
    }

    return depth === 0;
  }

  function hasOnlySupportedTokens(expression) {
    var stripped = expression.replace(/sin|cos|tan|log|ln|sqrt|abs|pi|e/gi, "");
    return !/[a-z]/i.test(stripped);
  }

  function normalizeScientificExpression(expression) {
    var normalized = expression;

    Object.keys(SCIENTIFIC_FUNCTIONS).forEach(function (name) {
      normalized = normalized.replace(new RegExp(name + "(?=\\()", "gi"), SCIENTIFIC_FUNCTIONS[name]);
    });

    normalized = normalized.replace(/\bpi\b/gi, "Math.PI");
    normalized = normalized.replace(/\be\b/g, "Math.E");
    normalized = normalized.replace(/\^/g, "**");

    return normalized;
  }

  function evaluateExpression(expression) {
    var sanitized = sanitizeExpression(expression);

    if (!sanitized) {
      return "0";
    }

    if (!isValidExpression(sanitized)) {
      throw new Error("Invalid characters in expression.");
    }

    if (!hasOnlySupportedTokens(sanitized)) {
      throw new Error("Invalid characters in expression.");
    }

    if (!hasBalancedParentheses(sanitized)) {
      throw new Error("Unbalanced parentheses.");
    }

    var normalized = normalizeScientificExpression(sanitized);

    if (/[a-df-z]/i.test(normalized.replace(/Math\.(?:sin|cos|tan|log10|log|sqrt|abs|PI|E)/g, ""))) {
      throw new Error("Unsupported expression.");
    }

    var result = Function('"use strict"; return (' + normalized + ");")();

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
