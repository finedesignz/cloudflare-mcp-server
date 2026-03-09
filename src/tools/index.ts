import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zoneActions } from "./zoneActions.js";
import { dnsActions } from "./dnsActions.js";
import { sslActions } from "./sslActions.js";
import { pageRuleActions } from "./pageRuleActions.js";
import { tunnelActions } from "./tunnelActions.js";
import { analyticsActions } from "./analyticsActions.js";

type ToolRegistrar = (
  server: McpServer,
  apiToken: string,
  defaultAccountId?: string,
) => void;

export const tools: ToolRegistrar[] = [
  zoneActions,
  dnsActions,
  sslActions,
  pageRuleActions,
  tunnelActions,
  analyticsActions,
];
