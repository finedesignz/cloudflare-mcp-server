import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cfFetch, createErrorResponse, log } from "../utils/index.js";

const targetSchema = z.record(z.any());
const actionSchema = z.record(z.any());

export const pageRuleActions = (
  server: McpServer,
  apiToken: string,
): void => {
  server.tool(
    "cf_list_page_rules",
    "List page rules for a zone.",
    {
      zoneId: z.string().describe("Zone ID"),
    },
    async ({ zoneId }) => {
      log(`Running tool: cf_list_page_rules (${zoneId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/pagerules`,
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
    "cf_create_page_rule",
    "Create a page rule (forwarding, caching, redirects, etc.).",
    {
      zoneId: z.string().describe("Zone ID"),
      targets: z
        .array(targetSchema)
        .describe("Targets array (e.g., [{ target: 'url', constraint: { operator: 'matches', value: 'example.com/*' } }])"),
      actions: z
        .array(actionSchema)
        .describe("Actions array (e.g., forwarding_url, cache_level, always_use_https)"),
      priority: z.number().optional().describe("Priority (lower runs first)"),
      status: z.enum(["active", "disabled"]).optional().describe("Rule status (default active)"),
    },
    async ({ zoneId, targets, actions, priority, status }) => {
      log(`Running tool: cf_create_page_rule (${zoneId})`);
      try {
        const body: Record<string, unknown> = {
          targets,
          actions,
          status: status ?? "active",
        };
        if (priority !== undefined) body.priority = priority;

        const result = await cfFetch({
          path: `/zones/${zoneId}/pagerules`,
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
    "cf_delete_page_rule",
    "Delete a page rule.",
    {
      zoneId: z.string().describe("Zone ID"),
      pageRuleId: z.string().describe("Page rule ID"),
    },
    async ({ zoneId, pageRuleId }) => {
      log(`Running tool: cf_delete_page_rule (${pageRuleId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/pagerules/${pageRuleId}`,
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
};
