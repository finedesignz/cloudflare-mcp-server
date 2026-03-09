import fs from "fs";
import path from "path";
import dotenv from "dotenv";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface CfFetchOptions<T = unknown> {
  path: string;
  method?: HttpMethod;
  body?: T;
  apiToken: string;
}

const CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4";

export async function cfFetch<T = unknown, B = unknown>({
  path,
  method = "GET",
  body,
  apiToken,
}: CfFetchOptions<B>): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${CLOUDFLARE_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string; code?: number }>;
    result?: T;
  };

  if (!data.success) {
    const errorMessage =
      data.errors?.map((e) => e.message || `Code ${e.code}`).join("; ") ||
      `Cloudflare API request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return (data.result ?? (data as unknown as T)) as T;
}

export function log(...args: unknown[]): void {
  console.error("[CF-MCP]", ...args);
}

export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), process.env.ENV_FILE || ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export function createErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

export function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../package.json",
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}
