import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const srcDir = path.join(rootDir, "src");
const publicDir = await directoryExists(distDir) ? distDir : srcDir;
const port = Number(process.env.PORT || 4173);

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = req.url === "/" ? "/index.html" : req.url || "/index.html";
    const filePath = path.join(publicDir, requestPath);
    const resolvedPath = path.normalize(filePath);

    if (!resolvedPath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const fileInfo = await stat(resolvedPath);
    if (fileInfo.isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": getContentType(resolvedPath) });
    createReadStream(resolvedPath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${publicDir} at http://127.0.0.1:${port}`);
});

async function directoryExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function getContentType(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }

  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }

  return "application/octet-stream";
}
