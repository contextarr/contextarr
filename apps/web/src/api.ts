import type { HealthResponse, PackSummary, SearchResponse } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
  getPacks(): Promise<PackSummary[]>;
  search(query: string): Promise<SearchResponse>;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? "");
  const token = options.token?.trim();
  const fetchImpl = options.fetchImpl ?? fetch;

  async function requestJson<T>(path: string): Promise<T> {
    const response = await fetchImpl(toApiUrl(baseUrl, path), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response), response.status);
    }

    return response.json() as Promise<T>;
  }

  return {
    getHealth: () => requestJson<HealthResponse>("/api/health"),
    getPacks: async () => {
      const response = await requestJson<{ packs: PackSummary[] }>("/api/packs");
      return response.packs;
    },
    search: (query: string) => requestJson<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`)
  };
}

export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_CONTEXTARR_API_BASE,
  token: import.meta.env.VITE_CONTEXTARR_API_TOKEN
});

export function toApiUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
