const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "calculator-core.js"
];

for (const file of requiredFiles) {
  const location = path.join(process.cwd(), file);

  if (!fs.existsSync(location)) {
    throw new Error(`Missing required build asset: ${file}`);
  }
}

console.log("Build check passed.");
