import { spawn } from "node:child_process";

const port = 3187;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PORT: String(port), NEXT_TELEMETRY_DISABLED: "1" },
  },
);

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

  const routes = [
    { path: "/", includes: "The Fellowship" },
    { path: "/login", includes: "Đăng nhập" },
    { path: "/signup", includes: "Tạo tài khoản" },
  ];

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route.path}`);
    const html = await response.text();
    if (!response.ok || !html.includes(route.includes)) {
      throw new Error(`Route smoke test failed for ${route.path} (HTTP ${response.status}).`);
    }
  }

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json();
  if (!healthResponse.ok || health.status !== "ok" || health.service !== "the-fellowship") {
    throw new Error("Health endpoint smoke test failed.");
  }

  console.log("Smoke tests passed: /, /login, /signup, and /api/health");
} finally {
  server.kill("SIGTERM");
}
