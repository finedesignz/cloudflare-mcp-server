import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cfFetch, createErrorResponse, log } from "../utils/index.js";

export const zoneActions = (
  server: McpServer,
  apiToken: string,
): void => {
  server.tool(
    "cf_list_zones",
    "List all zones (domains) in the Cloudflare account.",
    {
      page: z.number().optional().describe("Page number (default 1)"),
      perPage: z
        .number()
        .optional()
        .describe("Items per page (default 50, max 100)"),
      name: z.string().optional().describe("Filter by zone name"),
      status: z
        .enum(["active", "pending", "initializing", "moved", "deleted", "deactivated"])
        .optional()
        .describe("Filter by status"),
      accountId: z
        .string()
        .optional()
        .describe("Filter by account ID (defaults to token's account)"),
    },
    async ({ page, perPage, name, status, accountId }) => {
      log("Running tool: cf_list_zones");
      try {
        const params = new URLSearchParams();
        if (page) params.append("page", String(page));
        if (perPage) params.append("per_page", String(perPage));
        if (name) params.append("name", name);
        if (status) params.append("status", status);
        if (accountId) params.append("account.id", accountId);

        const path = `/zones${params.toString() ? `?${params.toString()}` : ""}`;
        const result = await cfFetch<{ result: unknown }>({
          path,
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
    "cf_get_zone",
    "Get details for a specific zone by ID.",
    {
      zoneId: z.string().describe("Cloudflare zone ID"),
    },
    async ({ zoneId }) => {
      log(`Running tool: cf_get_zone (${zoneId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}`,
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
    "cf_create_zone",
    "Add a new domain (zone) to Cloudflare.",
    {
      name: z.string().describe("Root domain to add, e.g., example.com"),
      accountId: z
        .string()
        .optional()
        .describe("Account ID to associate (optional)"),
      jumpstart: z
        .boolean()
        .optional()
        .describe("Whether to scan for existing DNS records (default true)"),
      type: z
        .enum(["full", "partial"])
        .optional()
        .describe("Setup type (default full)"),
    },
    async ({ name, accountId, jumpstart, type }) => {
      log(`Running tool: cf_create_zone (${name})`);
      try {
        const body: Record<string, unknown> = {
          name,
          jumpstart: jumpstart ?? true,
          type: type ?? "full",
        };
        if (accountId) {
          body.account = { id: accountId };
        }

        const result = await cfFetch({
          path: "/zones",
          method: "POST",
          body,
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
    "cf_delete_zone",
    "Remove a zone from Cloudflare.",
    {
      zoneId: z.string().describe("Zone ID to delete"),
    },
    async ({ zoneId }) => {
      log(`Running tool: cf_delete_zone (${zoneId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}`,
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
    "cf_purge_cache",
    "Purge cache for a zone (all cache or specific URLs).",
    {
      zoneId: z.string().describe("Zone ID"),
      purgeEverything: z
        .boolean()
        .optional()
        .describe("Purge all cache (default true if urls not provided)"),
      urls: z
        .array(z.string())
        .optional()
        .describe("Specific URLs to purge (if not purging everything)"),
    },
    async ({ zoneId, purgeEverything, urls }) => {
      log(`Running tool: cf_purge_cache (${zoneId})`);
      try {
        const shouldPurgeAll = purgeEverything ?? !urls?.length;
        if (!shouldPurgeAll && (!urls || urls.length === 0)) {
          throw new Error(
            "Provide urls to purge or set purgeEverything=true",
          );
        }

        const body = shouldPurgeAll
          ? { purge_everything: true }
          : { files: urls };

        const result = await cfFetch({
          path: `/zones/${zoneId}/purge_cache`,
          method: "POST",
          body,
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
