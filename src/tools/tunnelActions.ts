import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cfFetch, createErrorResponse, log } from "../utils/index.js";

function requireAccountId(accountId?: string): string {
  if (!accountId) {
    throw new Error(
      "Cloudflare account ID is required. Provide accountId parameter or set CLOUDFLARE_ACCOUNT_ID.",
    );
  }
  return accountId;
}

export const tunnelActions = (
  server: McpServer,
  apiToken: string,
  defaultAccountId?: string,
): void => {
  server.tool(
    "cf_list_tunnels",
    "List all Cloudflare tunnels for the account.",
    {
      accountId: z
        .string()
        .optional()
        .describe("Account ID (defaults to CLOUDFLARE_ACCOUNT_ID)"),
    },
    async ({ accountId }) => {
      log("Running tool: cf_list_tunnels");
      try {
        const accId = requireAccountId(accountId || defaultAccountId);
        const result = await cfFetch({
          path: `/accounts/${accId}/cfd_tunnel`,
          apiToken,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.tool(
    "cf_get_tunnel",
    "Get details for a specific tunnel.",
    {
      tunnelId: z.string().describe("Tunnel UUID"),
      accountId: z.string().optional().describe("Account ID override"),
    },
    async ({ tunnelId, accountId }) => {
      log(`Running tool: cf_get_tunnel (${tunnelId})`);
      try {
        const accId = requireAccountId(accountId || defaultAccountId);
        const result = await cfFetch({
          path: `/accounts/${accId}/cfd_tunnel/${tunnelId}`,
          apiToken,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.tool(
    "cf_create_tunnel",
    "Create a new Cloudflare tunnel.",
    {
      name: z.string().describe("Tunnel name (unique per account)"),
      accountId: z.string().optional().describe("Account ID override"),
    },
    async ({ name, accountId }) => {
      log(`Running tool: cf_create_tunnel (${name})`);
      try {
        const accId = requireAccountId(accountId || defaultAccountId);
        const result = await cfFetch({
          path: `/accounts/${accId}/cfd_tunnel`,
          method: "POST",
          body: { name },
          apiToken,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.tool(
    "cf_delete_tunnel",
    "Delete a Cloudflare tunnel.",
    {
      tunnelId: z.string().describe("Tunnel UUID"),
      accountId: z.string().optional().describe("Account ID override"),
    },
    async ({ tunnelId, accountId }) => {
      log(`Running tool: cf_delete_tunnel (${tunnelId})`);
      try {
        const accId = requireAccountId(accountId || defaultAccountId);
        const result = await cfFetch({
          path: `/accounts/${accId}/cfd_tunnel/${tunnelId}`,
          method: "DELETE",
          apiToken,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.tool(
    "cf_get_tunnel_token",
    "Get the tunnel token for cloudflared.",
    {
      tunnelId: z.string().describe("Tunnel UUID"),
      accountId: z.string().optional().describe("Account ID override"),
    },
    async ({ tunnelId, accountId }) => {
      log(`Running tool: cf_get_tunnel_token (${tunnelId})`);
      try {
        const accId = requireAccountId(accountId || defaultAccountId);
        const result = await cfFetch({
          path: `/accounts/${accId}/cfd_tunnel/${tunnelId}/token`,
          apiToken,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );
};
