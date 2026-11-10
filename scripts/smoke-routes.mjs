import { spawn } from "node:child_process";

const port = 3187;
const baseUrl = `http://127.0.0.1:${port}`;
const command = process.platform === "win32" ? "npm.cmd" : "npm";
const server = spawn(command, ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: "inherit",
  env: { ...process.env, PORT: String(port), NEXT_TELEMETRY_DISABLED: "1" },
});

let serverReady = false;
try {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js server exited early with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        serverReady = true;
        break;
      }
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!serverReady) throw new Error("Timed out waiting for the production server.");

  const homeResponse = await fetch(baseUrl);
  const homeHtml = await homeResponse.text();
  if (!homeResponse.ok || !homeHtml.includes("The Fellowship")) {
    throw new Error(`Homepage smoke test failed (HTTP ${homeResponse.status}).`);
  }

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json();
  if (!healthResponse.ok || health.status !== "ok" || health.service !== "the-fellowship") {
    throw new Error("Health endpoint smoke test failed.");
  }

  console.log("Smoke tests passed: / and /api/health");
} finally {
  server.kill("SIGTERM");
}
