import type {
  HealthResponse,
  ComposePreviewRequest,
  ExportArtifact,
  PackDetail,
  PackHealthResponse,
  PackSummary,
  RecordDetail,
  RecordSummary,
  ReviewItemsResponse,
  ReviewItemStatus,
  SearchResponse,
  SkillDetail,
  SkillDocument,
  SkillHealthResponse,
  SkillSummary
} from "./types";

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
  getPack(id: string): Promise<PackDetail>;
  getPackHealth(id: string): Promise<PackHealthResponse>;
  getPackRecords(id: string): Promise<RecordSummary[]>;
  getRecord(id: string): Promise<RecordDetail>;
  getSkills(): Promise<SkillSummary[]>;
  getSkill(id: string): Promise<SkillDetail>;
  getSkillInstructions(id: string): Promise<SkillDocument[]>;
  getSkillExamples(id: string): Promise<SkillDocument[]>;
  getSkillExports(id: string): Promise<SkillDetail["exportProfiles"]>;
  getSkillHealth(id: string): Promise<SkillHealthResponse>;
  getExportPreview(packId: string, profileId: string): Promise<ExportArtifact>;
  getSkillExportPreview(skillId: string, profileId: string): Promise<ExportArtifact>;
  composePreview(request: ComposePreviewRequest): Promise<ExportArtifact>;
  getReviewItems(filters?: {
    status?: string;
    severity?: string;
    type?: string;
    objectType?: string;
    objectId?: string;
    packId?: string;
    skillId?: string;
  }): Promise<ReviewItemsResponse>;
  updateReviewItemStatus(id: string, status: ReviewItemStatus): Promise<ReviewItemsResponse["items"][number]>;
  search(query: string): Promise<SearchResponse>;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? "");
  const token = options.token?.trim();
  const fetchImpl = options.fetchImpl ?? fetch;

  async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetchImpl(toApiUrl(baseUrl, path), {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
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
    getPack: (id: string) => requestJson<PackDetail>(`/api/packs/${encodeURIComponent(id)}`),
    getPackHealth: (id: string) => requestJson<PackHealthResponse>(`/api/packs/${encodeURIComponent(id)}/health`),
    getPackRecords: async (id: string) => {
      const response = await requestJson<{ records: RecordSummary[] }>(`/api/packs/${encodeURIComponent(id)}/records`);
      return response.records;
    },
    getRecord: (id: string) => requestJson<RecordDetail>(`/api/records/${encodeURIComponent(id)}`),
    getSkills: async () => {
      const response = await requestJson<{ skills: SkillSummary[] }>("/api/skills");
      return response.skills;
    },
    getSkill: (id: string) => requestJson<SkillDetail>(`/api/skills/${encodeURIComponent(id)}`),
    getSkillInstructions: async (id: string) => {
      const response = await requestJson<{ instructions: SkillDocument[] }>(
        `/api/skills/${encodeURIComponent(id)}/instructions`
      );
      return response.instructions;
    },
    getSkillExamples: async (id: string) => {
      const response = await requestJson<{ examples: SkillDocument[] }>(`/api/skills/${encodeURIComponent(id)}/examples`);
      return response.examples;
    },
    getSkillExports: async (id: string) => {
      const response = await requestJson<{ exportProfiles: SkillDetail["exportProfiles"] }>(
        `/api/skills/${encodeURIComponent(id)}/exports`
      );
      return response.exportProfiles;
    },
    getSkillHealth: (id: string) => requestJson<SkillHealthResponse>(`/api/skills/${encodeURIComponent(id)}/health`),
    getExportPreview: (packId: string, profileId: string) =>
      requestJson<ExportArtifact>(
        `/api/packs/${encodeURIComponent(packId)}/exports/${encodeURIComponent(profileId)}/preview`
      ),
    getSkillExportPreview: (skillId: string, profileId: string) =>
      requestJson<ExportArtifact>(
        `/api/skills/${encodeURIComponent(skillId)}/exports/${encodeURIComponent(profileId)}/preview`
      ),
    composePreview: (body: ComposePreviewRequest) =>
      requestJson<ExportArtifact>("/api/compose/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    getReviewItems: (filters = {}) => requestJson<ReviewItemsResponse>(`/api/review-items${toQueryString(filters)}`),
    updateReviewItemStatus: async (id: string, status: ReviewItemStatus) => {
      const response = await requestJson<{ item: ReviewItemsResponse["items"][number] }>(
        `/api/review-items/${encodeURIComponent(id)}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        }
      );
      return response.item;
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

function toQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
