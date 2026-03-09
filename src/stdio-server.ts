#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools/index.js";
import { getPackageVersion, log } from "./utils/index.js";

async function main() {
  try {
    // Prefer command-line args for token/account, then env vars (client can inject at launch).
    const args = process.argv.slice(2);
    let apiTokenArg: string | undefined;
    let accountIdArg: string | undefined;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--token" && args[i + 1]) {
        apiTokenArg = args[i + 1];
      }
      if (args[i] === "--account" && args[i + 1]) {
        accountIdArg = args[i + 1];
      }
    }

    const apiToken = apiTokenArg || process.env.CLOUDFLARE_API_TOKEN;
    const defaultAccountId =
      accountIdArg || process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken) {
      console.error(
        "Error: CLOUDFLARE_API_TOKEN environment variable is required",
      );
      console.error(
        "Pass --token <value> when launching the server or set CLOUDFLARE_API_TOKEN in the environment.",
      );
      process.exit(1);
    }

    log("Starting Cloudflare MCP Server (stdio)");

    const server = new McpServer({
      name: "cloudflare-mcp-server",
      version: getPackageVersion(),
    });

    tools.forEach((register) => {
      register(server, apiToken, defaultAccountId);
    });

    log("Tools registered successfully");

    const transport = new StdioServerTransport();
    await server.connect(transport);

    log("MCP Server connected via stdio transport");
  } catch (error) {
    console.error("Fatal error starting MCP server:", error);
    process.exit(1);
  }
}

main();
