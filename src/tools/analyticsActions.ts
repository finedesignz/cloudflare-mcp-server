import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cfFetch, createErrorResponse, log } from "../utils/index.js";

export const analyticsActions = (
  server: McpServer,
  apiToken: string,
): void => {
  server.tool(
    "cf_get_zone_analytics",
    "Get traffic analytics for a zone (requests, bandwidth, threats, pageviews) over a date range.",
    {
      zoneId: z.string().describe("Zone ID"),
      since: z
        .string()
        .describe("Start date/time (YYYY-MM-DD or ISO8601, e.g., 2024-01-01)"),
      until: z
        .string()
        .describe("End date/time (YYYY-MM-DD or ISO8601)"),
      continuous: z
        .boolean()
        .optional()
        .describe("Return continuous series (default true)"),
      timezone: z
        .string()
        .optional()
        .describe("Timezone identifier, e.g., 'America/Los_Angeles'"),
    },
    async ({ zoneId, since, until, continuous, timezone }) => {
      log(`Running tool: cf_get_zone_analytics (${zoneId})`);
      try {
        const params = new URLSearchParams({
          since,
          until,
        });
        if (continuous !== undefined) {
          params.append("continuous", String(continuous));
        } else {
          params.append("continuous", "true");
        }
        if (timezone) params.append("timezone", timezone);

        const path = `/zones/${zoneId}/analytics/dashboard?${params.toString()}`;
        const result = await cfFetch({
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
};
