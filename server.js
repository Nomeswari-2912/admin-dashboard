const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const files = {
  "/": ["portal.html", "text/html; charset=utf-8"],
  "/users": ["portal.html", "text/html; charset=utf-8"],
  "/users/new": ["portal.html", "text/html; charset=utf-8"],
  "/users/new/profile": ["portal.html", "text/html; charset=utf-8"],
  "/users/new/preferences": ["portal.html", "text/html; charset=utf-8"],
  "/users/list": ["portal.html", "text/html; charset=utf-8"],
  "/users/edit": ["portal.html", "text/html; charset=utf-8"],
  "/courses": ["portal.html", "text/html; charset=utf-8"],
  "/courses/new": ["portal.html", "text/html; charset=utf-8"],
  "/courses/list": ["portal.html", "text/html; charset=utf-8"],
  "/course-admin": ["index.html", "text/html; charset=utf-8"],
  "/basic": ["basic.html", "text/html; charset=utf-8"],
  "/details": ["index.html", "text/html; charset=utf-8"],
  "/settings": ["index.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/portal.css": ["portal.css", "text/css; charset=utf-8"],
  "/portal.js": ["portal.js", "text/javascript; charset=utf-8"],
  "/assets/springboard-logo.png": ["assets/springboard-logo.png", "image/png"],
  "/assets/figma-liquid-art.png": ["assets/figma-liquid-art.png", "image/png"],
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = files[pathname];

  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const [relativePath, contentType] = file;
  fs.readFile(path.join(root, relativePath), (error, content) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Could not load the requested app file.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(content);
  });
});

const port = Number(process.env.PORT) || 5500;
server.listen(port, "127.0.0.1", () => {
  console.log(`Course admin app running at http://127.0.0.1:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the other server or set PORT to an available port.`);
    process.exitCode = 1;
    return;
  }
  throw error;
});
