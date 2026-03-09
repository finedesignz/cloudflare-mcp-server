import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cfFetch, createErrorResponse, log } from "../utils/index.js";

export const sslActions = (
  server: McpServer,
  apiToken: string,
): void => {
  server.tool(
    "cf_get_ssl_setting",
    "Get the current SSL/TLS mode for a zone.",
    {
      zoneId: z.string().describe("Zone ID"),
    },
    async ({ zoneId }) => {
      log(`Running tool: cf_get_ssl_setting (${zoneId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/settings/ssl`,
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
    "cf_update_ssl_setting",
    "Update the SSL/TLS mode for a zone (off, flexible, full, strict).",
    {
      zoneId: z.string().describe("Zone ID"),
      mode: z
        .enum(["off", "flexible", "full", "strict"])
        .describe("Desired SSL mode"),
    },
    async ({ zoneId, mode }) => {
      log(`Running tool: cf_update_ssl_setting (${zoneId} -> ${mode})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/settings/ssl`,
          method: "PATCH",
          body: { value: mode },
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
    "cf_list_certificates",
    "List SSL certificates for a zone.",
    {
      zoneId: z.string().describe("Zone ID"),
    },
    async ({ zoneId }) => {
      log(`Running tool: cf_list_certificates (${zoneId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/ssl/certificates`,
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
