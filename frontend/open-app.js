const { spawn } = require("node:child_process");
const http = require("node:http");

const url = new URL(process.env.APP_URL || "http://127.0.0.1:5500");

function openBrowser() {
  const command = process.platform === "win32"
    ? process.env.ComSpec || "cmd.exe"
    : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url.href] : [url.href];
  const browser = spawn(command, args, { detached: true, stdio: "ignore" });

  browser.on("error", (error) => {
    console.error(`Could not open the frontend in a browser: ${error.message}`);
    process.exitCode = 1;
  });
  browser.unref();
}

const request = http.get(url, (response) => {
  response.resume();

  if (response.statusCode < 200 || response.statusCode >= 400) {
    console.error(`Backend returned HTTP ${response.statusCode}; the frontend was not opened.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Frontend is ready: ${url.href}`);
  openBrowser();
});

request.setTimeout(3000, () => {
  request.destroy(new Error("connection timed out"));
});

request.on("error", (error) => {
  console.error(`Cannot reach the backend at ${url.href}: ${error.message}`);
  console.error("Start the backend in its own terminal, or set APP_URL to the backend URL.");
  process.exitCode = 1;
});
