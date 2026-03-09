/**
 * HTTP-to-stdio bridge for the Cloudflare MCP server.
 * Spawns the stdio server as a child process and proxies JSON-RPC over HTTP.
 *
 * GET  /health        -> health check
 * GET  /tools         -> list tools
 * POST /tools/:name   -> call a specific tool
 * POST /mcp           -> raw MCP JSON-RPC message
 */

import http from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const PORT = parseInt(process.env.HTTP_PORT || "3011", 10);

const child = spawn("node", ["dist/stdio-server.js"], {
  stdio: ["pipe", "pipe", "inherit"],
  env: { ...process.env },
});

let stdoutBuffer = "";
const pendingRequests = new Map();

child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk.toString();
  const lines = stdoutBuffer.split("\n");
  stdoutBuffer = lines.pop() || "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const msg = JSON.parse(trimmed);
      if (msg.id !== undefined && pendingRequests.has(msg.id)) {
        const { resolve } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        resolve(msg);
      }
    } catch {
      // Not JSON; ignore log lines
    }
  }
});

child.on("exit", (code) => {
  console.error(`MCP child process exited with code ${code}`);
  process.exit(code || 1);
});

function sendRpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("RPC timeout (30s)"));
    }, 30000);

    pendingRequests.set(id, {
      resolve: (msg) => {
        clearTimeout(timeout);
        resolve(msg);
      },
    });

    const rpcMsg =
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
    child.stdin.write(rpcMsg);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

async function initialize() {
  const initResp = await sendRpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "http-bridge", version: "1.0.0" },
  });
  child.stdin.write(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }) + "\n",
  );
  console.log(
    `MCP initialized: ${JSON.stringify(initResp.result?.serverInfo || {})}`,
  );
  return initResp;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/tools") {
      const resp = await sendRpc("tools/list", {});
      res.writeHead(200);
      res.end(JSON.stringify(resp.result || resp));
      return;
    }

    const toolMatch = url.pathname.match(/^\/tools\/(.+)$/);
    if (req.method === "POST" && toolMatch) {
      const toolName = decodeURIComponent(toolMatch[1]);
      const body = await readBody(req);
      const params = body ? JSON.parse(body) : {};
      const resp = await sendRpc("tools/call", {
        name: toolName,
        arguments: params,
      });
      res.writeHead(200);
      res.end(JSON.stringify(resp.result || resp));
      return;
    }

    if (req.method === "POST" && url.pathname === "/mcp") {
      const body = await readBody(req);
      const rpcMsg = JSON.parse(body);
      const resp = await sendRpc(rpcMsg.method, rpcMsg.params || {});
      res.writeHead(200);
      res.end(JSON.stringify(resp));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

initialize()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Cloudflare MCP HTTP bridge listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize MCP:", err);
    process.exit(1);
  });
