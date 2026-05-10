import type {
  AgentKitContextPackSummary,
  AgentKitDetail,
  AgentKitExportPreview,
  AgentKitHealthResponse,
  AgentKitSkillSummary,
  AgentKitSummary,
  AgentKitTemplateCreateRequest,
  AgentKitTemplateSummary,
  CreateAgentKitRequest,
  HealthResponse,
  ComposeSavePackRequest,
  ComposeSavePackResponse,
  ComposePreviewRequest,
  ContextPackCollectorDefinition,
  ContextPackCollectorId,
  ContextPackCollectorPreview,
  ContextPackCollectorRequest,
  ContextPackCollectorResult,
  ExportArtifact,
  PackDetail,
  PackExposureReadiness,
  PackHealthResponse,
  PackSummary,
  RecordDetail,
  RecordSummary,
  ReviewItemsResponse,
  ReviewCandidatesResponse,
  ReviewCandidateActivationPlan,
  ReviewCandidateDetail,
  ReviewItemStatus,
  SaveAgentKitResponse,
  SearchResponse,
  SkillDetail,
  SkillDocument,
  SkillHealthResponse,
  SkillImportPreview,
  SkillImportRequest,
  SkillImportResult,
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
  getPackExposureReadiness(id: string): Promise<PackExposureReadiness>;
  getPackHealth(id: string): Promise<PackHealthResponse>;
  getPackRecords(id: string): Promise<RecordSummary[]>;
  getRecord(id: string): Promise<RecordDetail>;
  getSkills(): Promise<SkillSummary[]>;
  getSkill(id: string): Promise<SkillDetail>;
  getSkillInstructions(id: string): Promise<SkillDocument[]>;
  getSkillExamples(id: string): Promise<SkillDocument[]>;
  getSkillExports(id: string): Promise<SkillDetail["exportProfiles"]>;
  getSkillHealth(id: string): Promise<SkillHealthResponse>;
  previewSkillImport(request: SkillImportRequest): Promise<SkillImportPreview>;
  importSkill(request: SkillImportRequest): Promise<SkillImportResult>;
  getContextPackCollectors(): Promise<ContextPackCollectorDefinition[]>;
  previewContextPackCollector(id: ContextPackCollectorId, request: ContextPackCollectorRequest): Promise<ContextPackCollectorPreview>;
  runContextPackCollector(id: ContextPackCollectorId, request: ContextPackCollectorRequest): Promise<ContextPackCollectorResult>;
  getAgentKits(): Promise<AgentKitSummary[]>;
  getAgentKit(id: string): Promise<AgentKitDetail>;
  getAgentKitContextPacks(id: string): Promise<AgentKitContextPackSummary[]>;
  getAgentKitSkills(id: string): Promise<AgentKitSkillSummary[]>;
  getAgentKitHealth(id: string): Promise<AgentKitHealthResponse>;
  getAgentKitExportPreview(agentKitId: string, profileId: string): Promise<AgentKitExportPreview>;
  saveAgentKit(request: CreateAgentKitRequest): Promise<SaveAgentKitResponse>;
  getAgentKitTemplates(): Promise<AgentKitTemplateSummary[]>;
  getAgentKitTemplate(id: string): Promise<AgentKitTemplateSummary>;
  createAgentKitFromTemplate(id: string, request: AgentKitTemplateCreateRequest): Promise<SaveAgentKitResponse>;
  getExportPreview(packId: string, profileId: string): Promise<ExportArtifact>;
  getSkillExportPreview(skillId: string, profileId: string): Promise<ExportArtifact>;
  composePreview(request: ComposePreviewRequest): Promise<ExportArtifact>;
  saveComposedPack(request: ComposeSavePackRequest): Promise<ComposeSavePackResponse>;
  getReviewItems(filters?: {
    status?: string;
    severity?: string;
    type?: string;
    objectType?: string;
    objectId?: string;
    packId?: string;
    skillId?: string;
    agentKitId?: string;
  }): Promise<ReviewItemsResponse>;
  getReviewCandidates(filters?: { sourceKind?: string; status?: string; q?: string }): Promise<ReviewCandidatesResponse>;
  getReviewCandidate(key: string): Promise<ReviewCandidateDetail>;
  getReviewCandidateActivationPlan(key: string): Promise<ReviewCandidateActivationPlan>;
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
    getPackExposureReadiness: (id: string) =>
      requestJson<PackExposureReadiness>(`/api/packs/${encodeURIComponent(id)}/exposure-readiness`),
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
    previewSkillImport: (body: SkillImportRequest) =>
      requestJson<SkillImportPreview>("/api/import-skills/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    importSkill: (body: SkillImportRequest) =>
      requestJson<SkillImportResult>("/api/import-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    getContextPackCollectors: async () => {
      const response = await requestJson<{ collectors: ContextPackCollectorDefinition[] }>("/api/context-pack-collectors");
      return response.collectors;
    },
    previewContextPackCollector: (id: ContextPackCollectorId, body: ContextPackCollectorRequest) =>
      requestJson<ContextPackCollectorPreview>(`/api/context-pack-collectors/${encodeURIComponent(id)}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    runContextPackCollector: (id: ContextPackCollectorId, body: ContextPackCollectorRequest) =>
      requestJson<ContextPackCollectorResult>(`/api/context-pack-collectors/${encodeURIComponent(id)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    getAgentKits: async () => {
      const response = await requestJson<{ agentKits: AgentKitSummary[] }>("/api/agent-kits");
      return response.agentKits;
    },
    getAgentKit: (id: string) => requestJson<AgentKitDetail>(`/api/agent-kits/${encodeURIComponent(id)}`),
    getAgentKitContextPacks: async (id: string) => {
      const response = await requestJson<{ contextPacks: AgentKitContextPackSummary[] }>(
        `/api/agent-kits/${encodeURIComponent(id)}/context-packs`
      );
      return response.contextPacks;
    },
    getAgentKitSkills: async (id: string) => {
      const response = await requestJson<{ skills: AgentKitSkillSummary[] }>(
        `/api/agent-kits/${encodeURIComponent(id)}/skills`
      );
      return response.skills;
    },
    getAgentKitHealth: (id: string) => requestJson<AgentKitHealthResponse>(`/api/agent-kits/${encodeURIComponent(id)}/health`),
    getAgentKitExportPreview: (agentKitId: string, profileId: string) =>
      requestJson<AgentKitExportPreview>(
        `/api/agent-kits/${encodeURIComponent(agentKitId)}/exports/${encodeURIComponent(profileId)}/preview`
      ),
    saveAgentKit: (body: CreateAgentKitRequest) =>
      requestJson<SaveAgentKitResponse>("/api/agent-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    getAgentKitTemplates: async () => {
      const response = await requestJson<{ templates: AgentKitTemplateSummary[] }>("/api/agent-kit-templates");
      return response.templates;
    },
    getAgentKitTemplate: (id: string) =>
      requestJson<AgentKitTemplateSummary>(`/api/agent-kit-templates/${encodeURIComponent(id)}`),
    createAgentKitFromTemplate: (id: string, body: AgentKitTemplateCreateRequest) =>
      requestJson<SaveAgentKitResponse>(`/api/agent-kit-templates/${encodeURIComponent(id)}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
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
    saveComposedPack: (body: ComposeSavePackRequest) =>
      requestJson<ComposeSavePackResponse>("/api/compose/save-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }),
    getReviewItems: (filters = {}) => requestJson<ReviewItemsResponse>(`/api/review-items${toQueryString(filters)}`),
    getReviewCandidates: (filters = {}) =>
      requestJson<ReviewCandidatesResponse>(`/api/review-candidates${toQueryString(filters)}`),
    getReviewCandidate: async (key: string) => {
      const response = await requestJson<{ candidate: ReviewCandidateDetail }>(`/api/review-candidates/${encodeURIComponent(key)}`);
      return response.candidate;
    },
    getReviewCandidateActivationPlan: async (key: string) => {
      const response = await requestJson<{ plan: ReviewCandidateActivationPlan }>(
        `/api/review-candidates/${encodeURIComponent(key)}/activation-plan`
      );
      return response.plan;
    },
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
