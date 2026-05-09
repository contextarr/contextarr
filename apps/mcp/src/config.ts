import { loadConfig, type ServerConfig } from "@contextarr/server";

export interface ContextarrMcpConfig extends ServerConfig {
  rescanOnStart: boolean;
  maxResults: number;
  maxRecordChars: number;
  maxPreviewChars: number;
  allowPrivate: boolean;
}

export function loadMcpConfig(env: NodeJS.ProcessEnv = process.env): ContextarrMcpConfig {
  const base = loadConfig(env);

  return {
    ...base,
    rescanOnStart: parseBoolean(env.CONTEXTARR_MCP_RESCAN_ON_START, true),
    maxResults: parsePositiveInteger(env.CONTEXTARR_MCP_MAX_RESULTS, 8),
    maxRecordChars: parsePositiveInteger(env.CONTEXTARR_MCP_MAX_RECORD_CHARS, 12000),
    maxPreviewChars: parsePositiveInteger(env.CONTEXTARR_MCP_MAX_PREVIEW_CHARS, 24000),
    allowPrivate: parseBoolean(env.CONTEXTARR_MCP_ALLOW_PRIVATE, false)
  };
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value?.trim()) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePositiveInteger(value: string | undefined, defaultValue: number): number {
  if (!value?.trim()) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}
