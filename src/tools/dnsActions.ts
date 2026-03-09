import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cfFetch, createErrorResponse, log } from "../utils/index.js";

const recordTypeEnum = z.enum([
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "LOC",
  "SPF",
  "CAA",
  "PTR",
  "CERT",
  "DNSKEY",
  "DS",
  "NAPTR",
  "SMIMEA",
  "SSHFP",
  "TLSA",
  "URI",
]);

export const dnsActions = (
  server: McpServer,
  apiToken: string,
): void => {
  server.tool(
    "cf_list_dns_records",
    "List DNS records for a zone.",
    {
      zoneId: z.string().describe("Zone ID"),
      type: recordTypeEnum.optional().describe("Filter by record type"),
      name: z.string().optional().describe("Filter by record name"),
      page: z.number().optional().describe("Page number"),
      perPage: z.number().optional().describe("Records per page"),
      proxied: z.boolean().optional().describe("Filter by proxied flag"),
      content: z
        .string()
        .optional()
        .describe("Filter by record content (value)"),
    },
    async ({ zoneId, type, name, page, perPage, proxied, content }) => {
      log(`Running tool: cf_list_dns_records (${zoneId})`);
      try {
        const params = new URLSearchParams();
        if (type) params.append("type", type);
        if (name) params.append("name", name);
        if (page) params.append("page", String(page));
        if (perPage) params.append("per_page", String(perPage));
        if (proxied !== undefined) params.append("proxied", String(proxied));
        if (content) params.append("content", content);

        const path = `/zones/${zoneId}/dns_records${params.toString() ? `?${params.toString()}` : ""}`;
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

  server.tool(
    "cf_get_dns_record",
    "Get a specific DNS record by ID.",
    {
      zoneId: z.string().describe("Zone ID"),
      recordId: z.string().describe("DNS record ID"),
    },
    async ({ zoneId, recordId }) => {
      log(`Running tool: cf_get_dns_record (${recordId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/dns_records/${recordId}`,
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
    "cf_create_dns_record",
    "Create a DNS record (A, AAAA, CNAME, MX, TXT, etc.).",
    {
      zoneId: z.string().describe("Zone ID"),
      type: recordTypeEnum.describe("Record type"),
      name: z.string().describe("Record name (e.g., 'www' or 'sub.example.com')"),
      content: z.string().describe("Record content (e.g., IP address, target)"),
      ttl: z
        .number()
        .optional()
        .describe("TTL in seconds (default automatic)"),
      priority: z
        .number()
        .optional()
        .describe("Priority (for MX/SRV)"),
      proxied: z.boolean().optional().describe("Whether Cloudflare should proxy the record"),
    },
    async ({ zoneId, type, name, content, ttl, priority, proxied }) => {
      log(`Running tool: cf_create_dns_record (${type} ${name})`);
      try {
        const body: Record<string, unknown> = {
          type,
          name,
          content,
        };
        if (ttl !== undefined) body.ttl = ttl;
        if (priority !== undefined) body.priority = priority;
        if (proxied !== undefined) body.proxied = proxied;

        const result = await cfFetch({
          path: `/zones/${zoneId}/dns_records`,
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
    "cf_update_dns_record",
    "Update an existing DNS record.",
    {
      zoneId: z.string().describe("Zone ID"),
      recordId: z.string().describe("DNS record ID"),
      type: recordTypeEnum.describe("Record type"),
      name: z.string().describe("Record name"),
      content: z.string().describe("Record content"),
      ttl: z.number().optional().describe("TTL in seconds"),
      priority: z.number().optional().describe("Priority (for MX/SRV)"),
      proxied: z.boolean().optional().describe("Proxy through Cloudflare"),
    },
    async ({
      zoneId,
      recordId,
      type,
      name,
      content,
      ttl,
      priority,
      proxied,
    }) => {
      log(`Running tool: cf_update_dns_record (${recordId})`);
      try {
        const body: Record<string, unknown> = {
          type,
          name,
          content,
        };
        if (ttl !== undefined) body.ttl = ttl;
        if (priority !== undefined) body.priority = priority;
        if (proxied !== undefined) body.proxied = proxied;

        const result = await cfFetch({
          path: `/zones/${zoneId}/dns_records/${recordId}`,
          method: "PUT",
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
    "cf_delete_dns_record",
    "Delete a DNS record.",
    {
      zoneId: z.string().describe("Zone ID"),
      recordId: z.string().describe("DNS record ID"),
    },
    async ({ zoneId, recordId }) => {
      log(`Running tool: cf_delete_dns_record (${recordId})`);
      try {
        const result = await cfFetch({
          path: `/zones/${zoneId}/dns_records/${recordId}`,
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
