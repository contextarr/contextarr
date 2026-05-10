import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  Bell,
  BookOpen,
  Box,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  CloudDownload,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Grid2X2,
  HeartPulse,
  Import,
  Layers3,
  Library,
  List,
  Monitor,
  MoreVertical,
  Package,
  PanelLeft,
  PenLine,
  Rows3,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Tags,
  UserRound
} from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiClient } from "./api";
import {
  PackCard as BrandPackCard,
  PackCardMenu,
  PackCover as BrandPackCover,
  PackHealthPill,
  PackTrustBadge,
  normalizePackTrustLevel,
  packTrustLabels,
  resolvePackBrand
} from "./components/pack-card";
import {
  createAgentKitCoverVisual,
  filterAndSortAgentKits,
  getAgentKitFilterOptions,
  type AgentKitLibraryViewMode,
  type AgentKitSortKey
} from "./agent-kits";
import {
  agentKitFormatOptions,
  agentKitRedactionModeOptions,
  agentKitTargetOptions,
  applyAgentKitTemplateToDraft,
  buildAgentKitPreviewMetadata,
  buildAgentKitSaveRequest,
  defaultAgentKitExcludeTags,
  filterAgentKitPacks,
  filterAgentKitSkills,
  getAgentKitPackFilterOptions,
  getAgentKitSkillFilterOptions,
  isAgentKitSaveDisabled,
  parseAgentKitTokenBudget,
  toggleSelectedId,
  validateAgentKitDraft,
  type AgentKitPackFilters,
  type AgentKitSkillFilters
} from "./agent-kit-composer";
import { brandMarkUrl } from "./brand";
import {
  buildComposePreviewRequest,
  composerTargets,
  countSelectedRecords,
  defaultComposerExcludeTags,
  filterComposerRecords,
  getComposerFilterOptions,
  summarizeSelectedPacks
} from "./composer";
import { buildExportOptions, copyTextToClipboard, downloadExportArtifact, getExportTargets } from "./exports";
import {
  createCoverVisual,
  filterAndSortPacks,
  formatPackType,
  getFilterOptions,
  getInitialLibraryView,
  type LibraryPackGroup,
  persistLibraryView
} from "./library";
import { renderRecordBodyHtml } from "./record-rendering";
import { renderSkillDocumentHtml } from "./skill-rendering";
import {
  filterReviewItems,
  filterReviewCandidates,
  reviewAgentKitName,
  reviewPackName,
  reviewSkillName,
  summarizeReviewCandidates,
  summarizeReviewItems,
  type ReviewCandidateFilters,
  type ReviewFilters
} from "./review";
import {
  agentKitHref,
  agentKitsHref,
  collectorsHref,
  composerHref,
  exportsHref,
  healthHref,
  packHref,
  parseHashRoute,
  recordHref,
  reviewQueueHref,
  skillHref,
  skillsHref
} from "./routes";
import { createSkillCoverVisual, filterAndSortSkills, getSkillFilterOptions } from "./skills";
import type {
  ExportArtifact,
  ExportProfileSummary,
  HealthCheck,
  HealthResponse,
  LibraryViewMode,
  ComposeSavePackResponse,
  ContextPackCollectorDefinition,
  ContextPackCollectorId,
  ContextPackCollectorPreview,
  ContextPackCollectorResult,
  PackDetail,
  PackExposureReadiness,
  PackHealthResponse,
  PackSummary,
  RecordDetail,
  RecordSummary,
  ReviewItem,
  ReviewCandidateActivationPlan,
  ReviewCandidateDetail,
  ReviewCandidateSummary,
  ReviewCandidateSourceKind,
  ReviewCandidateStatus,
  Route,
  SearchResult,
  SkillDetail,
  SkillDocument,
  SkillHealthResponse,
  SkillImportKind,
  SkillImportPreview,
  SkillImportResult,
  SkillSummary,
  AgentKitHealthResponse,
  AgentKitExportPreview,
  AgentKitSummary,
  AgentKitTemplateSummary,
  AgentKitDetail,
  SortKey,
  SourceSummary
} from "./types";

const navItems = [
  { label: "Library", icon: Library, href: "#/library", route: "library" },
  { label: "Skills", icon: BookOpen, href: skillsHref(), route: "skills" },
  { label: "Agent Kits", icon: Sparkles, href: agentKitsHref(), route: "agentKits" },
  { label: "Packs", icon: Boxes },
  { label: "Collectors", icon: Layers3, href: collectorsHref(), route: "collectors" },
  { label: "Sources", icon: Database },
  { label: "Review Queue", icon: ShieldCheck, href: reviewQueueHref(), route: "reviewQueue" },
  { label: "Composer", icon: PenLine, href: composerHref("agent-kit"), route: "composer" },
  { label: "Exports", icon: CloudDownload, href: exportsHref(), route: "exports" },
  { label: "Registry", icon: Package },
  { label: "Health", icon: HeartPulse, href: healthHref(), route: "health" },
  { label: "Settings", icon: Settings }
] satisfies Array<{ label: string; icon: typeof Library; href?: string; route?: Route["name"] }>;

const shellActions = [
  { label: "Activity monitor unavailable in developer preview", icon: Activity },
  { label: "Import shortcut unavailable in developer preview", icon: Import },
  { label: "Notifications unavailable in developer preview", icon: Bell },
  { label: "Help center unavailable in developer preview", icon: CircleHelp },
  { label: "User profile unavailable in developer preview", icon: UserRound }
] satisfies Array<{ label: string; icon: typeof Activity }>;

const coverIconMap = {
  book: BookOpen,
  box: Box,
  code: Code2,
  database: Database,
  monitor: Monitor,
  package: Package,
  server: Server,
  sparkles: Sparkles
};

const detailTabs = ["overview", "records", "sources", "exports", "health", "activity", "changelog"] as const;
type DetailTab = (typeof detailTabs)[number];
const skillDetailTabs = ["overview", "instructions", "examples", "sources", "exports", "health"] as const;
type SkillDetailTab = (typeof skillDetailTabs)[number];
const agentKitDetailTabs = ["overview", "context-packs", "skills", "rules", "exports", "health"] as const;
type AgentKitDetailTab = (typeof agentKitDetailTabs)[number];

export function App() {
  const [route, setRoute] = useState<Route>(() => currentRoute());
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [agentKits, setAgentKits] = useState<AgentKitSummary[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() => getInitialLibraryView());
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [packGroup, setPackGroup] = useState<LibraryPackGroup>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [trustFilter, setTrustFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [skillAuthError, setSkillAuthError] = useState(false);
  const [agentKitError, setAgentKitError] = useState<string | null>(null);
  const [agentKitAuthError, setAgentKitAuthError] = useState(false);

  useEffect(() => {
    function handleHashChange() {
      setRoute(currentRoute());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);
    setSkillError(null);
    setSkillAuthError(false);
    setAgentKitError(null);
    setAgentKitAuthError(false);

    try {
      const [healthResponse, packResponse] = await Promise.all([apiClient.getHealth(), apiClient.getPacks()]);
      setHealth(healthResponse);
      setPacks(packResponse);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        setAuthError(true);
        setError("API token required by environment configuration.");
      } else {
        setError(loadError instanceof Error ? loadError.message : "Unable to load Contextarr API data.");
      }
    }

    try {
      setSkills(await apiClient.getSkills());
    } catch (loadError) {
      setSkills([]);
      if (loadError instanceof ApiError && loadError.status === 401) {
        setSkillAuthError(true);
        setSkillError("API token required by environment configuration.");
      } else {
        setSkillError(loadError instanceof Error ? loadError.message : "Unable to load Skill API data.");
      }
    }

    try {
      setAgentKits(await apiClient.getAgentKits());
    } catch (loadError) {
      setAgentKits([]);
      if (loadError instanceof ApiError && loadError.status === 401) {
        setAgentKitAuthError(true);
        setAgentKitError("API token required by environment configuration.");
      } else {
        setAgentKitError(loadError instanceof Error ? loadError.message : "Unable to load Agent Kit API data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await apiClient.search(debouncedQuery);
        if (!cancelled) {
          setSearchResults(response.results);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const filterOptions = useMemo(() => getFilterOptions(packs), [packs]);
  const visiblePacks = useMemo(
    () =>
      filterAndSortPacks(
        packs,
        {
          query: debouncedQuery,
          group: packGroup,
          type: typeFilter,
          trustLevel: trustFilter,
          healthStatus: healthFilter,
          sortBy
        },
        searchResults
      ),
    [debouncedQuery, healthFilter, packGroup, packs, searchResults, sortBy, trustFilter, typeFilter]
  );
  const visibleSkills = useMemo(
    () =>
      filterAndSortSkills(
        skills,
        {
          query: debouncedQuery,
          type: "all",
          trustLevel: "all",
          healthStatus: "all"
        },
        searchResults
      ),
    [debouncedQuery, searchResults, skills]
  );
  const visibleAgentKits = useMemo(
    () =>
      filterAndSortAgentKits(
        agentKits,
        {
          query: debouncedQuery,
          type: "all",
          trustLevel: "all",
          healthStatus: "all",
          target: "all",
          sortBy: "name"
        },
        searchResults
      ),
    [agentKits, debouncedQuery, searchResults]
  );

  function handleViewModeChange(mode: LibraryViewMode) {
    setViewMode(mode);
    persistLibraryView(mode);
  }

  return (
    <div className="app-shell">
      <Sidebar health={health} route={route} />
      <main className="workspace">
        <TopBar query={query} searching={searching} onQueryChange={setQuery} />
        {route.name === "pack" ? (
          <PackDetailPage packId={route.packId} packs={packs} />
        ) : route.name === "record" ? (
          <RecordDetailPage recordId={route.recordId} packs={packs} />
        ) : route.name === "skills" ? (
          <SkillLibraryPage
            skills={skills}
            visibleSkills={visibleSkills}
            query={debouncedQuery}
            searchResults={searchResults}
            loading={loading}
            error={skillError}
            authError={skillAuthError}
            onRetry={loadDashboard}
          />
        ) : route.name === "skill" ? (
          <SkillDetailPage skillId={route.skillId} />
        ) : route.name === "reviewQueue" ? (
          <ReviewQueuePage packs={packs} skills={skills} agentKits={agentKits} initialTab={route.tab ?? "items"} onStatusChanged={loadDashboard} />
        ) : route.name === "agentKits" ? (
          <AgentKitLibraryPage
            agentKits={agentKits}
            visibleAgentKits={visibleAgentKits}
            query={debouncedQuery}
            searchResults={searchResults}
            loading={loading}
            error={agentKitError}
            authError={agentKitAuthError}
            onRetry={loadDashboard}
          />
        ) : route.name === "agentKit" ? (
          <AgentKitDetailPage agentKitId={route.agentKitId} />
        ) : route.name === "collectors" ? (
          <CollectorsPage health={health} onImported={loadDashboard} />
        ) : route.name === "composer" ? (
          <ComposerPage packs={packs} skills={skills} mode={route.mode ?? "agent-kit"} />
        ) : route.name === "exports" ? (
          <ExportsPage packs={packs} skills={skills} />
        ) : route.name === "health" ? (
          <HealthPage health={health} packs={packs} skills={skills} agentKits={agentKits} />
        ) : (
          <LibraryPage
            packs={packs}
            visiblePacks={visiblePacks}
            loading={loading}
            error={error}
            authError={authError}
            viewMode={viewMode}
            sortBy={sortBy}
            packGroup={packGroup}
            typeFilter={typeFilter}
            trustFilter={trustFilter}
            healthFilter={healthFilter}
            filterOptions={filterOptions}
            onRetry={loadDashboard}
            onViewModeChange={handleViewModeChange}
            onSortChange={setSortBy}
            onPackGroupChange={setPackGroup}
            onTypeFilterChange={setTypeFilter}
            onTrustFilterChange={setTrustFilter}
            onHealthFilterChange={setHealthFilter}
          />
        )}
        <footer className="third-party-marks-note">Third-party marks shown for identification only.</footer>
      </main>
    </div>
  );
}

function Sidebar({ health, route }: { health: HealthResponse | null; route: Route }) {
  return (
    <aside className="sidebar" aria-label="Contextarr navigation">
      <a className="brand" href="#/library">
        <div className="brand-mark">
          <img src={brandMarkUrl} alt="" aria-hidden="true" />
        </div>
        <span className="brand-wordmark">
          Context<span>arr</span>
        </span>
      </a>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) =>
          item.href ? (
            <a className={route.name === item.route ? "nav-item is-active" : "nav-item"} href={item.href} key={item.label}>
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === "Review Queue" ? <span className="nav-count">{health?.counts.openReviewItems ?? 0}</span> : null}
            </a>
          ) : (
            <button className="nav-item" type="button" disabled key={item.label}>
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        )}
      </nav>

      <div className="system-card">
        <div className="system-heading">
          <HeartPulse size={17} aria-hidden="true" />
          <span>{health?.status === "ok" ? "System Healthy" : "System Pending"}</span>
        </div>
        <p>
          {health
            ? `${health.counts.packs} packs / ${health.counts.records} records / ${health.counts.skills} skills`
            : "Local API status loading"}
        </p>
        <div className="system-meta">
          <span>v0.7.0</span>
          <span>{health?.authRequired ? "Token auth" : "Local dev"}</span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  query,
  searching,
  onQueryChange
}: {
  query: string;
  searching: boolean;
  onQueryChange(value: string): void;
}) {
  return (
    <header className="topbar">
      <label className="search-box">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          value={query}
          aria-label="Search packs, tags, authors, and descriptions"
          placeholder="Search packs, tags, authors, descriptions..."
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <span className="search-status" aria-hidden="true">
          {searching ? "..." : "/"}
        </span>
      </label>

      <div className="topbar-actions" aria-label="Inactive shell actions">
        {shellActions.map((action) => (
          <button
            className="icon-button"
            type="button"
            disabled
            aria-label={action.label}
            title={action.label}
            key={action.label}
          >
            <action.icon size={19} aria-hidden="true" />
          </button>
        ))}
      </div>
    </header>
  );
}

interface LibraryPageProps {
  packs: PackSummary[];
  visiblePacks: PackSummary[];
  loading: boolean;
  error: string | null;
  authError: boolean;
  viewMode: LibraryViewMode;
  sortBy: SortKey;
  packGroup: LibraryPackGroup;
  typeFilter: string;
  trustFilter: string;
  healthFilter: string;
  filterOptions: ReturnType<typeof getFilterOptions>;
  onRetry(): void;
  onViewModeChange(mode: LibraryViewMode): void;
  onSortChange(sort: SortKey): void;
  onPackGroupChange(value: LibraryPackGroup): void;
  onTypeFilterChange(value: string): void;
  onTrustFilterChange(value: string): void;
  onHealthFilterChange(value: string): void;
}

function LibraryPage(props: LibraryPageProps) {
  return (
    <section className="library-panel" aria-labelledby="library-title">
      <LibraryHeader
        packCount={props.packs.length}
        viewMode={props.viewMode}
        sortBy={props.sortBy}
        packGroup={props.packGroup}
        typeFilter={props.typeFilter}
        trustFilter={props.trustFilter}
        healthFilter={props.healthFilter}
        filterOptions={props.filterOptions}
        onViewModeChange={props.onViewModeChange}
        onSortChange={props.onSortChange}
        onPackGroupChange={props.onPackGroupChange}
        onTypeFilterChange={props.onTypeFilterChange}
        onTrustFilterChange={props.onTrustFilterChange}
        onHealthFilterChange={props.onHealthFilterChange}
      />

      {props.error ? (
        <ErrorState authError={props.authError} onRetry={props.onRetry} />
      ) : props.loading ? (
        <LoadingLibrary viewMode={props.viewMode} />
      ) : props.packs.length === 0 ? (
        <EmptyState title="No packs indexed" detail="The local API returned an empty pack library." />
      ) : props.visiblePacks.length === 0 ? (
        <EmptyState title="No packs match" detail="Search and filters did not match the indexed pack library." />
      ) : (
        <LibraryViews packs={props.visiblePacks} viewMode={props.viewMode} />
      )}
    </section>
  );
}

interface LibraryHeaderProps {
  packCount: number;
  viewMode: LibraryViewMode;
  sortBy: SortKey;
  packGroup: LibraryPackGroup;
  typeFilter: string;
  trustFilter: string;
  healthFilter: string;
  filterOptions: ReturnType<typeof getFilterOptions>;
  onViewModeChange(mode: LibraryViewMode): void;
  onSortChange(sort: SortKey): void;
  onPackGroupChange(value: LibraryPackGroup): void;
  onTypeFilterChange(value: string): void;
  onTrustFilterChange(value: string): void;
  onHealthFilterChange(value: string): void;
}

function LibraryHeader(props: LibraryHeaderProps) {
  return (
    <div className="library-header">
      <div>
        <div className="eyebrow">
          <PanelLeft size={16} aria-hidden="true" />
          <span>Library</span>
        </div>
        <h1 id="library-title">Pack Library</h1>
        <p>Manage, browse, and maintain your local context packs.</p>
      </div>

      <div className="library-controls">
        <div className="segmented" aria-label="Library view mode">
          <ViewButton icon={Grid2X2} label="Cover" mode="cover" current={props.viewMode} onClick={props.onViewModeChange} />
          <ViewButton icon={List} label="Cards" mode="compact" current={props.viewMode} onClick={props.onViewModeChange} />
          <ViewButton icon={Table2} label="Table" mode="table" current={props.viewMode} onClick={props.onViewModeChange} />
        </div>

        <label className="select-control">
          <ArrowDownUp size={16} aria-hidden="true" />
          <select value={props.sortBy} onChange={(event) => props.onSortChange(event.target.value as SortKey)}>
            <option value="name">Name</option>
            <option value="health">Health</option>
            <option value="lastReviewed">Last reviewed</option>
            <option value="records">Records</option>
          </select>
        </label>

        <label className="select-control">
          <Package size={16} aria-hidden="true" />
          <select value={props.packGroup} onChange={(event) => props.onPackGroupChange(event.target.value as LibraryPackGroup)}>
            <option value="all">All packs</option>
            <option value="starter">Starter packs</option>
            <option value="local">Local packs</option>
            <option value="imported">Imported packs</option>
          </select>
        </label>

        <label className="select-control">
          <Filter size={16} aria-hidden="true" />
          <select value={props.typeFilter} onChange={(event) => props.onTypeFilterChange(event.target.value)}>
            <option value="all">All types</option>
            {props.filterOptions.types.map((type) => (
              <option value={type} key={type}>
                {formatPackType(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="select-control compact-select">
          <ShieldCheck size={16} aria-hidden="true" />
          <select value={props.trustFilter} onChange={(event) => props.onTrustFilterChange(event.target.value)}>
            <option value="all">All trust</option>
            {props.filterOptions.trustLevels.map((trust) => (
              <option value={trust} key={trust}>
                {formatPackType(trust)}
              </option>
            ))}
          </select>
        </label>

        <label className="select-control compact-select">
          <HeartPulse size={16} aria-hidden="true" />
          <select value={props.healthFilter} onChange={(event) => props.onHealthFilterChange(event.target.value)}>
            <option value="all">All health</option>
            {props.filterOptions.healthStatuses.map((status) => (
              <option value={status} key={status}>
                {formatPackType(status)}
              </option>
            ))}
          </select>
        </label>

        <button className="primary-action" type="button" disabled>
          <Sparkles size={18} aria-hidden="true" />
          <span>New Pack</span>
        </button>
      </div>

      <div className="library-count">{props.packCount} packs</div>
    </div>
  );
}

function ViewButton({
  icon: Icon,
  label,
  mode,
  current,
  onClick
}: {
  icon: typeof Grid2X2;
  label: string;
  mode: LibraryViewMode;
  current: LibraryViewMode;
  onClick(mode: LibraryViewMode): void;
}) {
  return (
    <button className={current === mode ? "is-selected" : ""} type="button" onClick={() => onClick(mode)}>
      <Icon size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function LibraryViews({ packs, viewMode }: { packs: PackSummary[]; viewMode: LibraryViewMode }) {
  if (viewMode === "cover") {
    return <CoverGrid packs={packs} />;
  }

  if (viewMode === "table") {
    return <DenseTable packs={packs} />;
  }

  return <CompactCards packs={packs} />;
}

function CoverGrid({ packs }: { packs: PackSummary[] }) {
  return (
    <div className="cover-grid">
      {packs.map((pack) => (
        <BrandPackCard pack={pack} key={pack.id} />
      ))}
    </div>
  );
}

function CompactCards({ packs }: { packs: PackSummary[] }) {
  return (
    <div className="compact-grid">
      {packs.map((pack) => {
        const brand = resolvePackBrand(pack);
        return (
          <article className="compact-card" key={pack.id}>
            <a href={packHref(pack.id)} aria-label={`Open ${pack.name}`}>
              <BrandPackCover pack={pack} variant="compact" />
            </a>
            <div className="compact-main">
              <h2>
                <a className="pack-title-link" href={packHref(pack.id)}>
                  {pack.name}
                </a>
              </h2>
              <p>{pack.description}</p>
              <span className="pack-type">{formatPackType(pack.type)}</span>
            </div>
            <div className="compact-metrics">
              <PackHealthPill score={pack.healthScore} status={pack.healthStatus} />
              <PackTrustBadge trustLevel={pack.trustLevel} hasThirdPartyBrand={Boolean(brand)} />
              <span>{pack.sourceCount} sources</span>
              <span>{pack.recordCount} records</span>
              <span>{formatDate(pack.lastReviewedAt)}</span>
            </div>
            <PackCardMenu href={packHref(pack.id)} packName={pack.name} compact />
          </article>
        );
      })}
    </div>
  );
}

function DenseTable({ packs }: { packs: PackSummary[] }) {
  return (
    <div className="table-wrap">
      <table className="pack-table">
        <thead>
          <tr>
            <th>Pack</th>
            <th>Type</th>
            <th>Trust</th>
            <th>Health</th>
            <th>Records</th>
            <th>Sources</th>
            <th>Review Queue</th>
            <th>Last Reviewed</th>
            <th>Version</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          {packs.map((pack) => {
            const brand = resolvePackBrand(pack);
            return (
              <tr key={pack.id}>
                <td>
                  <div className="table-pack">
                    <BrandPackCover pack={pack} variant="mini" />
                    <div>
                      <strong>
                        <a className="pack-title-link" href={packHref(pack.id)}>
                          {pack.name}
                        </a>
                      </strong>
                      <span>{pack.description}</span>
                    </div>
                  </div>
                </td>
                <td>{formatPackType(pack.type)}</td>
                <td>
                  <PackTrustBadge trustLevel={pack.trustLevel} hasThirdPartyBrand={Boolean(brand)} />
                </td>
                <td>
                  <PackHealthPill score={pack.healthScore} status={pack.healthStatus} />
                </td>
                <td>{pack.recordCount}</td>
                <td>{pack.sourceCount}</td>
                <td>
                  <span className={pack.reviewQueueCount > 0 ? "queue-pill has-items" : "queue-pill"}>
                    {pack.reviewQueueCount}
                  </span>
                </td>
                <td>{formatDate(pack.lastReviewedAt)}</td>
                <td>{pack.version}</td>
                <td>
                  <a className="ghost-action open-action" href={packHref(pack.id)} aria-label={`Open ${pack.name}`}>
                    <ExternalLink size={17} aria-hidden="true" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SkillLibraryPage({
  skills,
  visibleSkills,
  query,
  searchResults,
  loading,
  error,
  authError,
  onRetry
}: {
  skills: SkillSummary[];
  visibleSkills: SkillSummary[];
  query: string;
  searchResults: SearchResult[];
  loading: boolean;
  error: string | null;
  authError: boolean;
  onRetry(): void;
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [trustFilter, setTrustFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const filterOptions = useMemo(() => getSkillFilterOptions(skills), [skills]);
  const filteredSkills = useMemo(
    () =>
      filterAndSortSkills(
        visibleSkills,
        {
          query,
          type: typeFilter,
          trustLevel: trustFilter,
          healthStatus: healthFilter
        },
        searchResults
      ),
    [healthFilter, query, searchResults, trustFilter, typeFilter, visibleSkills]
  );

  return (
    <section className="library-panel" aria-labelledby="skills-title">
      <div className="library-header">
        <div>
          <div className="eyebrow">
            <BookOpen size={16} aria-hidden="true" />
            <span>Skills</span>
          </div>
          <h1 id="skills-title">Skill Library</h1>
          <p>Browse local non-executable instruction artifacts and inspect their sources, examples, and export profiles.</p>
        </div>

        <div className="library-controls">
          <label className="select-control">
            <Filter size={16} aria-hidden="true" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {filterOptions.types.map((type) => (
                <option value={type} key={type}>
                  {formatPackType(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="select-control compact-select">
            <ShieldCheck size={16} aria-hidden="true" />
            <select value={trustFilter} onChange={(event) => setTrustFilter(event.target.value)}>
              <option value="all">All trust</option>
              {filterOptions.trustLevels.map((trust) => (
                <option value={trust} key={trust}>
                  {formatPackType(trust)}
                </option>
              ))}
            </select>
          </label>

          <label className="select-control compact-select">
            <HeartPulse size={16} aria-hidden="true" />
            <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
              <option value="all">All health</option>
              {filterOptions.healthStatuses.map((status) => (
                <option value={status} key={status}>
                  {formatPackType(status)}
                </option>
              ))}
            </select>
          </label>

          <button className="primary-action" type="button" disabled>
            <Sparkles size={18} aria-hidden="true" />
            <span>New Skill</span>
          </button>
        </div>

        <div className="library-count">{skills.length} skills</div>
      </div>

      {error ? (
        <ErrorState authError={authError} onRetry={onRetry} />
      ) : loading ? (
        <LoadingLibrary viewMode="compact" />
      ) : skills.length === 0 ? (
        <EmptyState title="No skills indexed" detail="The local API returned an empty Skill library." />
      ) : filteredSkills.length === 0 ? (
        <EmptyState title="No skills match" detail="Search and filters did not match the indexed Skill library." />
      ) : (
        <SkillCards skills={filteredSkills} />
      )}
    </section>
  );
}

function SkillCards({ skills }: { skills: SkillSummary[] }) {
  return (
    <div className="compact-grid skill-grid">
      {skills.map((skill) => (
        <article className="compact-card skill-card" key={skill.id}>
          <a href={skillHref(skill.id)} aria-label={`Open ${skill.name}`}>
            <SkillCover skill={skill} variant="thumb" />
          </a>
          <div className="compact-main">
            <h2>
              <a className="pack-title-link" href={skillHref(skill.id)}>
                {skill.name}
              </a>
            </h2>
            <p>{skill.description}</p>
            <span className="pack-type">{formatPackType(skill.type)}</span>
          </div>
          <div className="compact-metrics">
            <SkillHealthBadge skill={skill} />
            <SkillTrustBadge skill={skill} />
            <span>{skill.instructionCount} instructions</span>
            <span>{skill.exampleCount} examples</span>
            <span>{formatDate(skill.lastReviewedAt)}</span>
          </div>
          <a className="ghost-action open-action" href={skillHref(skill.id)} aria-label={`Open ${skill.name}`}>
            <MoreVertical size={17} aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}

const skillImportKinds: SkillImportKind[] = ["auto", "folder", "markdown", "prompt-template", "claude-skill", "chatgpt-prompts"];

function CollectorsPage({ health, onImported }: { health: HealthResponse | null; onImported(): void }) {
  const [collectors, setCollectors] = useState<ContextPackCollectorDefinition[]>([]);
  const [collectorId, setCollectorId] = useState<ContextPackCollectorId>("blank-pack-starter");
  const [inputPath, setInputPath] = useState("");
  const [packId, setPackId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxRecords, setMaxRecords] = useState("50");
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<ContextPackCollectorPreview | null>(null);
  const [result, setResult] = useState<ContextPackCollectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingCollectors, setLoadingCollectors] = useState(true);
  const selectedCollector = collectors.find((collector) => collector.id === collectorId);

  useEffect(() => {
    let cancelled = false;

    async function loadCollectors() {
      setLoadingCollectors(true);
      setError(null);
      try {
        const response = await apiClient.getContextPackCollectors();
        if (cancelled) {
          return;
        }
        setCollectors(response);
        if (response.length > 0 && !response.some((collector) => collector.id === collectorId)) {
          setCollectorId(response[0].id);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Context Pack collectors.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCollectors(false);
        }
      }
    }

    void loadCollectors();
    return () => {
      cancelled = true;
    };
  }, []);

  const request = useMemo(
    () => ({
      inputPath: inputPath.trim() || undefined,
      packId: packId.trim() || undefined,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      maxRecords: parsePositiveUiInteger(maxRecords),
      overwrite
    }),
    [description, inputPath, maxRecords, name, overwrite, packId]
  );
  const canSubmit =
    Boolean(selectedCollector) &&
    Boolean(request.maxRecords) &&
    (selectedCollector?.inputMode !== "local_path" || Boolean(request.inputPath)) &&
    !busy;

  async function previewCollector() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setPreview(await apiClient.previewContextPackCollector(collectorId, request));
    } catch (loadError) {
      setPreview(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to preview Context Pack collector output.");
    } finally {
      setBusy(false);
    }
  }

  async function runCollector() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await apiClient.runContextPackCollector(collectorId, request);
      setResult(response);
      onImported();
    } catch (loadError) {
      setResult(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to create draft Context Pack.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="library-panel collector-page" aria-labelledby="collectors-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Layers3 size={16} aria-hidden="true" />
            <span>Collectors</span>
          </div>
          <h1 id="collectors-title">Context Pack Collectors</h1>
          <p>Create private draft Context Packs from local, reviewable inputs.</p>
        </div>
        <div className="summary-strip">
          <Stat value={collectors.length} label="Collectors" />
          <Stat value={health?.counts.packs ?? 0} label="Active Packs" />
          <Stat value={health?.counts.openReviewItems ?? 0} label="Open Review" />
        </div>
      </div>

      {loadingCollectors ? (
        <div className="state-card">
          <Layers3 size={34} aria-hidden="true" />
          <h2>Loading collectors</h2>
        </div>
      ) : collectors.length === 0 ? (
        <div className="state-card warning-card">
          <ShieldAlert size={34} aria-hidden="true" />
          <h2>No collectors available</h2>
          <p>The local API did not return any Context Pack collectors.</p>
        </div>
      ) : (
        <div className="collector-grid">
          <div className="composer-panel collector-form">
            <h2>Collector</h2>
            <label className="field-label">
              Type
              <select value={collectorId} onChange={(event) => setCollectorId(event.target.value as ContextPackCollectorId)}>
                {collectors.map((collector) => (
                  <option value={collector.id} key={collector.id}>
                    {collector.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted-note">{selectedCollector?.description}</p>
            {selectedCollector?.inputMode === "local_path" ? (
              <label className="field-label">
                Local path
                <input value={inputPath} onChange={(event) => setInputPath(event.target.value)} placeholder="D:/local/project-notes" />
              </label>
            ) : null}
            <label className="field-label">
              Pack ID
              <input value={packId} onChange={(event) => setPackId(event.target.value)} placeholder="optional-draft-pack-id" />
            </label>
            <label className="field-label">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional display name" />
            </label>
            <label className="field-label">
              Description
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional draft description" />
            </label>
            <label className="field-label">
              Max records
              <input value={maxRecords} onChange={(event) => setMaxRecords(event.target.value)} inputMode="numeric" />
            </label>
            <label className="composer-record collector-checkbox">
              <input checked={overwrite} type="checkbox" onChange={(event) => setOverwrite(event.target.checked)} />
              <span>
                <strong>Overwrite existing draft</strong>
                <small>Only inside the configured draft Context Packs directory.</small>
              </span>
            </label>
            <div className="inline-actions">
              <button className="secondary-action" type="button" disabled={!canSubmit} onClick={previewCollector}>
                Preview Draft Pack
              </button>
              <button className="primary-action" type="button" disabled={!canSubmit} onClick={runCollector}>
                <Import size={18} aria-hidden="true" />
                <span>Create Draft Pack</span>
              </button>
            </div>
          </div>

          <div className="composer-panel collector-preview">
            <h2>Preview</h2>
            {error ? <p className="composer-error">{error}</p> : null}
            {preview ? (
              <CollectorResultPanel
                title={`${preview.packName} (${preview.packId})`}
                counts={{ records: preview.records.length, sources: preview.sourceCount, warnings: preview.warnings.length }}
                warnings={preview.warnings}
                records={preview.records}
              />
            ) : (
              <p className="muted-note">Preview reads local input or starter templates before writing draft pack files.</p>
            )}
          </div>

          <div className="composer-panel collector-preview">
            <h2>Draft Output</h2>
            {result ? (
              <CollectorResultPanel
                title={`${result.packName} (${result.packId})`}
                counts={result.counts}
                warnings={result.warnings}
                validation={result.validation}
              />
            ) : (
              <p className="muted-note">Draft packs are private, unreviewed, and tagged never_export until reviewed.</p>
            )}
            <button className="secondary-action" type="button" disabled>
              Activate after review later
            </button>
          </div>
        </div>
      )}

      <SkillImportPanel health={health} onImported={onImported} />
    </section>
  );
}

function SkillImportPanel({ health, onImported }: { health: HealthResponse | null; onImported(): void }) {
  const [inputPath, setInputPath] = useState("");
  const [kind, setKind] = useState<SkillImportKind>("auto");
  const [skillId, setSkillId] = useState("");
  const [name, setName] = useState("");
  const [maxDocs, setMaxDocs] = useState("50");
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<SkillImportPreview | null>(null);
  const [result, setResult] = useState<SkillImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const localImportsEnabled = Boolean(health?.localImportsEnabled);

  const request = useMemo(
    () => ({
      inputPath: inputPath.trim(),
      kind,
      skillId: skillId.trim() || undefined,
      name: name.trim() || undefined,
      maxDocs: parsePositiveUiInteger(maxDocs),
      overwrite
    }),
    [inputPath, kind, maxDocs, name, overwrite, skillId]
  );
  const canSubmit = localImportsEnabled && Boolean(request.inputPath) && Boolean(request.maxDocs) && !busy;

  async function previewImport() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setPreview(await apiClient.previewSkillImport(request));
    } catch (loadError) {
      setPreview(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to preview Skill import.");
    } finally {
      setBusy(false);
    }
  }

  async function writeImport() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await apiClient.importSkill(request);
      setResult(response);
      onImported();
    } catch (loadError) {
      setResult(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to import Skill.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="collector-skill-import" aria-labelledby="skill-import-title">
      <div className="page-heading compact-heading">
        <div>
          <div className="eyebrow">
            <BookOpen size={16} aria-hidden="true" />
            <span>Skill Imports</span>
          </div>
          <h2 id="skill-import-title">Local Skill Import</h2>
          <p>Generate private draft Skills from local files for human review.</p>
        </div>
        <div className="summary-strip">
          <Stat value={health?.localImportsEnabled ? "On" : "Off"} label="Local Imports" />
          <Stat value={health?.counts.skills ?? 0} label="Indexed Skills" />
          <Stat value={health?.counts.openReviewItems ?? 0} label="Open Review" />
        </div>
      </div>

      {!localImportsEnabled ? (
        <div className="state-card warning-card">
          <ShieldAlert size={34} aria-hidden="true" />
          <h2>Local imports disabled</h2>
          <p>Set CONTEXTARR_ENABLE_LOCAL_IMPORTS=true on the local API to enable draft Skill imports.</p>
        </div>
      ) : (
        <div className="collector-grid">
          <div className="composer-panel collector-form">
            <h2>Import Source</h2>
            <label className="field-label">
              Local path
              <input value={inputPath} onChange={(event) => setInputPath(event.target.value)} placeholder="D:/local/fake-prompts" />
            </label>
            <label className="field-label">
              Kind
              <select value={kind} onChange={(event) => setKind(event.target.value as SkillImportKind)}>
                {skillImportKinds.map((option) => (
                  <option value={option} key={option}>
                    {formatPackType(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Skill ID
              <input value={skillId} onChange={(event) => setSkillId(event.target.value)} placeholder="optional-draft-skill-id" />
            </label>
            <label className="field-label">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional display name" />
            </label>
            <label className="field-label">
              Max docs
              <input value={maxDocs} onChange={(event) => setMaxDocs(event.target.value)} inputMode="numeric" />
            </label>
            <label className="composer-record collector-checkbox">
              <input checked={overwrite} type="checkbox" onChange={(event) => setOverwrite(event.target.checked)} />
              <span>
                <strong>Overwrite existing draft</strong>
                <small>Only inside the configured imported Skills directory.</small>
              </span>
            </label>
            <div className="inline-actions">
              <button className="secondary-action" type="button" disabled={!canSubmit} onClick={previewImport}>
                Preview
              </button>
              <button className="primary-action" type="button" disabled={!canSubmit} onClick={writeImport}>
                <Import size={18} aria-hidden="true" />
                <span>Import Draft Skill</span>
              </button>
            </div>
          </div>

          <div className="composer-panel collector-preview">
            <h2>Preview</h2>
            {error ? <p className="composer-error">{error}</p> : null}
            {preview ? (
              <ImportResultPanel
                title={`${preview.skillName} (${preview.skillId})`}
                counts={preview.counts}
                warnings={preview.warnings}
                documents={preview.documents}
              />
            ) : (
              <p className="muted-note">Preview reads local input and reports draft documents before writing files.</p>
            )}
          </div>

          <div className="composer-panel collector-preview">
            <h2>Imported Draft</h2>
            {result ? (
              <ImportResultPanel
                title={`${result.skillName} (${result.skillId})`}
                counts={result.counts}
                warnings={result.warnings}
                validation={result.validation}
              />
            ) : (
              <p className="muted-note">Written Skills are private, unreviewed, and tagged never_export until reviewed.</p>
            )}
            <button className="secondary-action" type="button" disabled>
              Save as approved Skill later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImportResultPanel({
  title,
  counts,
  warnings,
  documents = [],
  validation
}: {
  title: string;
  counts: { documents: number; sources: number; warnings: number };
  warnings: Array<{ code: string; message: string; file?: string }>;
  documents?: Array<{ id: string; title: string; type: string; tags: string[]; sourceId: string }>;
  validation?: { valid: boolean; errors: number; warnings: number; infos: number };
}) {
  return (
    <div className="import-result">
      <strong>{title}</strong>
      <dl className="fact-grid">
        <Fact label="Documents" value={counts.documents} />
        <Fact label="Sources" value={counts.sources} />
        <Fact label="Warnings" value={counts.warnings} />
        {validation ? <Fact label="Validation" value={`${validation.errors} errors`} /> : null}
      </dl>
      {documents.length > 0 ? (
        <ul className="simple-list">
          {documents.slice(0, 6).map((document) => (
            <li key={document.id}>
              <span>{document.title}</span>
              <em>{formatPackType(document.type)}</em>
            </li>
          ))}
        </ul>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="export-warning-list">
          {warnings.slice(0, 6).map((warning) => (
            <li key={`${warning.code}-${warning.file ?? warning.message}`}>
              {warning.code}{warning.file ? ` ${warning.file}` : ""}: {warning.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CollectorResultPanel({
  title,
  counts,
  warnings,
  records = [],
  validation
}: {
  title: string;
  counts: { records: number; sources: number; warnings: number };
  warnings: Array<{ code: string; message: string; file?: string }>;
  records?: Array<{ id: string; title: string; type: string; tags: string[]; sourceId: string }>;
  validation?: { valid: boolean; errors: number; warnings: number; infos: number };
}) {
  return (
    <div className="import-result">
      <strong>{title}</strong>
      <dl className="fact-grid">
        <Fact label="Records" value={counts.records} />
        <Fact label="Sources" value={counts.sources} />
        <Fact label="Warnings" value={counts.warnings} />
        {validation ? <Fact label="Validation" value={`${validation.errors} errors`} /> : null}
      </dl>
      {records.length > 0 ? (
        <ul className="simple-list">
          {records.slice(0, 6).map((record) => (
            <li key={record.id}>
              <span>{record.title}</span>
              <em>{formatPackType(record.type)}</em>
            </li>
          ))}
        </ul>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="export-warning-list">
          {warnings.slice(0, 6).map((warning) => (
            <li key={`${warning.code}-${warning.file ?? warning.message}`}>
              {warning.code}{warning.file ? ` ${warning.file}` : ""}: {warning.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AgentKitLibraryPage({
  agentKits,
  visibleAgentKits,
  query,
  searchResults,
  loading,
  error,
  authError,
  onRetry
}: {
  agentKits: AgentKitSummary[];
  visibleAgentKits: AgentKitSummary[];
  query: string;
  searchResults: SearchResult[];
  loading: boolean;
  error: string | null;
  authError: boolean;
  onRetry(): void;
}) {
  const [viewMode, setViewMode] = useState<AgentKitLibraryViewMode>("cards");
  const [typeFilter, setTypeFilter] = useState("all");
  const [trustFilter, setTrustFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [sortBy, setSortBy] = useState<AgentKitSortKey>("name");
  const filterOptions = useMemo(() => getAgentKitFilterOptions(agentKits), [agentKits]);
  const filteredAgentKits = useMemo(
    () =>
      filterAndSortAgentKits(
        visibleAgentKits,
        {
          query,
          type: typeFilter,
          trustLevel: trustFilter,
          healthStatus: healthFilter,
          target: targetFilter,
          sortBy
        },
        searchResults
      ),
    [healthFilter, query, searchResults, sortBy, targetFilter, trustFilter, typeFilter, visibleAgentKits]
  );

  return (
    <section className="library-panel" aria-labelledby="agent-kits-title">
      <div className="library-header">
        <div>
          <div className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            <span>Agent Kits</span>
          </div>
          <h1 id="agent-kits-title">Agent Kit Library</h1>
          <p>Browse local task-ready pairings of Context Packs and non-executable Skills.</p>
        </div>

        <div className="library-controls">
          <div className="segmented" aria-label="Agent Kit view mode">
            <button className={viewMode === "cards" ? "is-selected" : ""} type="button" onClick={() => setViewMode("cards")}>
              <List size={16} aria-hidden="true" />
              <span>Cards</span>
            </button>
            <button className={viewMode === "table" ? "is-selected" : ""} type="button" onClick={() => setViewMode("table")}>
              <Table2 size={16} aria-hidden="true" />
              <span>Table</span>
            </button>
          </div>
          <label className="select-control">
            <ArrowDownUp size={16} aria-hidden="true" />
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as AgentKitSortKey)}>
              <option value="name">Name</option>
              <option value="health">Health</option>
              <option value="lastReviewed">Last reviewed</option>
              <option value="contextPacks">Context packs</option>
              <option value="skills">Skills</option>
            </select>
          </label>
          <label className="select-control">
            <Filter size={16} aria-hidden="true" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {filterOptions.types.map((type) => (
                <option value={type} key={type}>
                  {formatPackType(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-control compact-select">
            <Sparkles size={16} aria-hidden="true" />
            <select value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)}>
              <option value="all">All targets</option>
              {filterOptions.targets.map((target) => (
                <option value={target} key={target}>
                  {formatPackType(target)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-control compact-select">
            <ShieldCheck size={16} aria-hidden="true" />
            <select value={trustFilter} onChange={(event) => setTrustFilter(event.target.value)}>
              <option value="all">All trust</option>
              {filterOptions.trustLevels.map((trust) => (
                <option value={trust} key={trust}>
                  {formatPackType(trust)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-control compact-select">
            <HeartPulse size={16} aria-hidden="true" />
            <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
              <option value="all">All health</option>
              {filterOptions.healthStatuses.map((status) => (
                <option value={status} key={status}>
                  {formatPackType(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="library-count">{agentKits.length} kits</div>
      </div>

      {error ? (
        <ErrorState authError={authError} onRetry={onRetry} />
      ) : loading ? (
        <LoadingLibrary viewMode="compact" />
      ) : agentKits.length === 0 ? (
        <EmptyState title="No Agent Kits indexed" detail="The local API returned an empty Agent Kit library." />
      ) : filteredAgentKits.length === 0 ? (
        <EmptyState title="No Agent Kits match" detail="Search and filters did not match the indexed Agent Kit library." />
      ) : viewMode === "table" ? (
        <AgentKitTable agentKits={filteredAgentKits} />
      ) : (
        <AgentKitCards agentKits={filteredAgentKits} />
      )}
    </section>
  );
}

function AgentKitCards({ agentKits }: { agentKits: AgentKitSummary[] }) {
  return (
    <div className="compact-grid skill-grid">
      {agentKits.map((agentKit) => (
        <article className="compact-card skill-card" key={agentKit.id}>
          <a href={agentKitHref(agentKit.id)} aria-label={`Open ${agentKit.name}`}>
            <AgentKitCover agentKit={agentKit} variant="thumb" />
          </a>
          <div className="compact-main">
            <h2>
              <a className="pack-title-link" href={agentKitHref(agentKit.id)}>
                {agentKit.name}
              </a>
            </h2>
            <p>{agentKit.description}</p>
            <span className="pack-type">{formatPackType(agentKit.target)}</span>
          </div>
          <div className="compact-metrics">
            <AgentKitHealthBadge agentKit={agentKit} />
            <AgentKitTrustBadge agentKit={agentKit} />
            <span>{agentKit.contextPackCount} packs</span>
            <span>{agentKit.skillCount} skills</span>
            <span>{formatDate(agentKit.lastReviewedAt)}</span>
          </div>
          <a className="ghost-action open-action" href={agentKitHref(agentKit.id)} aria-label={`Open ${agentKit.name}`}>
            <MoreVertical size={17} aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}

function AgentKitTable({ agentKits }: { agentKits: AgentKitSummary[] }) {
  return (
    <div className="table-wrap">
      <table className="pack-table">
        <thead>
          <tr>
            <th>Agent Kit</th>
            <th>Target</th>
            <th>Trust</th>
            <th>Health</th>
            <th>Packs</th>
            <th>Skills</th>
            <th>Review Queue</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          {agentKits.map((agentKit) => (
            <tr key={agentKit.id}>
              <td>
                <div className="table-pack">
                  <AgentKitCover agentKit={agentKit} variant="mini" />
                  <div>
                    <strong>
                      <a className="pack-title-link" href={agentKitHref(agentKit.id)}>
                        {agentKit.name}
                      </a>
                    </strong>
                    <span>{agentKit.description}</span>
                  </div>
                </div>
              </td>
              <td>{formatPackType(agentKit.target)}</td>
              <td><AgentKitTrustBadge agentKit={agentKit} /></td>
              <td><AgentKitHealthBadge agentKit={agentKit} /></td>
              <td>{agentKit.contextPackCount}</td>
              <td>{agentKit.skillCount}</td>
              <td>
                <span className={agentKit.reviewQueueCount > 0 ? "queue-pill has-items" : "queue-pill"}>
                  {agentKit.reviewQueueCount}
                </span>
              </td>
              <td>
                <a className="ghost-action open-action" href={agentKitHref(agentKit.id)} aria-label={`Open ${agentKit.name}`}>
                  <ExternalLink size={17} aria-hidden="true" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkillDetailPage({ skillId }: { skillId: string }) {
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [instructions, setInstructions] = useState<SkillDocument[]>([]);
  const [examples, setExamples] = useState<SkillDocument[]>([]);
  const [activeTab, setActiveTab] = useState<SkillDetailTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instructionError, setInstructionError] = useState<string | null>(null);
  const [exampleError, setExampleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInstructionError(null);
    setExampleError(null);
    setActiveTab("overview");

    async function loadSkillDetail() {
      try {
        const skillResponse = await apiClient.getSkill(skillId);
        if (!cancelled) {
          setSkill(skillResponse);
        }

        const [instructionResponse, exampleResponse] = await Promise.allSettled([
          apiClient.getSkillInstructions(skillId),
          apiClient.getSkillExamples(skillId)
        ]);
        if (!cancelled) {
          if (instructionResponse.status === "fulfilled") {
            setInstructions(instructionResponse.value);
          } else {
            setInstructions([]);
            setInstructionError(toErrorMessage(instructionResponse.reason, "Unable to load Skill instructions."));
          }

          if (exampleResponse.status === "fulfilled") {
            setExamples(exampleResponse.value);
          } else {
            setExamples([]);
            setExampleError(toErrorMessage(exampleResponse.reason, "Unable to load Skill examples."));
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Skill detail.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSkillDetail();
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  if (loading) {
    return <DetailLoading />;
  }

  if (error || !skill) {
    return (
      <section className="detail-page">
        <BackLink href={skillsHref()} label="Skill Library" />
        <StateCard title="Skill unavailable" detail={error ?? "The local API did not return this Skill."} />
      </section>
    );
  }

  return (
    <section className="detail-page" aria-labelledby="skill-detail-title">
      <BackLink href={skillsHref()} label="Skill Library" />
      <div className="pack-detail-hero">
        <SkillCover skill={skill} variant="large" />
        <div>
          <div className="eyebrow">
            <BookOpen size={16} aria-hidden="true" />
            <span>{formatPackType(skill.type)}</span>
          </div>
          <h1 id="skill-detail-title">{skill.name}</h1>
          <p>{skill.description}</p>
          <div className="hero-badges">
            <SkillHealthBadge skill={skill} />
            <SkillTrustBadge skill={skill} />
            <span className="version-pill">{skill.version}</span>
          </div>
          <div className="last-reviewed">
            <CalendarDays size={15} aria-hidden="true" />
            <span>Last reviewed: {formatDate(skill.lastReviewedAt)}</span>
          </div>
        </div>
      </div>

      <div className="detail-tabs" role="tablist" aria-label={`${skill.name} detail tabs`}>
        {skillDetailTabs.map((tab) => (
          <button
            type="button"
            className={activeTab === tab ? "is-selected" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {formatPackType(tab)}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? <SkillOverview skill={skill} /> : null}
      {activeTab === "instructions" ? (
        <SkillDocumentsTab
          title="Instructions"
          documents={instructions}
          emptyDetail="This Skill has no indexed instructions."
          errorDetail={instructionError}
        />
      ) : null}
      {activeTab === "examples" ? (
        <SkillDocumentsTab
          title="Examples"
          documents={examples}
          emptyDetail="This Skill has no indexed examples."
          errorDetail={exampleError}
        />
      ) : null}
      {activeTab === "sources" ? <SourcesTab sources={skill.sources} /> : null}
      {activeTab === "exports" ? <SkillExportsTab skill={skill} /> : null}
      {activeTab === "health" ? <SkillHealthTab skill={skill} /> : null}
    </section>
  );
}

function SkillOverview({ skill }: {
  skill: SkillDetail;
}) {
  return (
    <div className="detail-grid">
      <article className="detail-card summary-card">
        <h2>
          <BookOpen size={19} aria-hidden="true" />
          Summary
        </h2>
        <p>{skill.description}</p>
        <TagList values={[skill.type, skill.visibility, skill.trustLevel]} />
        <dl className="fact-grid">
          <Fact label="Author" value={skill.author} />
          <Fact label="License" value={skill.license} />
          <Fact label="Created" value={formatDate(skill.createdAt)} />
          <Fact label="Updated" value={formatDate(skill.updatedAt)} />
        </dl>
      </article>

      <article className="detail-card">
        <h2>
          <Rows3 size={19} aria-hidden="true" />
          Skill Stats
        </h2>
        <div className="stat-grid">
          <Stat value={skill.counts.instructions} label="Instructions" />
          <Stat value={skill.counts.examples} label="Examples" />
          <Stat value={skill.counts.sources} label="Sources" />
          <Stat value={skill.counts.exportProfiles} label="Export Profiles" />
        </div>
      </article>

      <article className="detail-card">
        <h2>
          <Sparkles size={19} aria-hidden="true" />
          Targets
        </h2>
        <TagList values={[...skill.targets, ...skill.inputs, ...skill.outputs]} />
      </article>

      <article className="detail-card">
        <h2>
          <CloudDownload size={19} aria-hidden="true" />
          Export Profiles
        </h2>
        <ProfileList profiles={skill.exportProfiles} />
      </article>

      <article className="detail-card">
        <h2>
          <HeartPulse size={19} aria-hidden="true" />
          Skill Health
        </h2>
        <div className="stat-grid">
          <Stat value={`${skill.healthScore}%`} label="Score" />
          <Stat value={formatPackType(skill.healthStatus)} label="Status" />
          <Stat value={skill.reviewQueueCount} label="Open Items" />
        </div>
      </article>
    </div>
  );
}

function SkillDocumentsTab({
  title,
  documents,
  emptyDetail,
  errorDetail
}: {
  title: string;
  documents: SkillDocument[];
  emptyDetail: string;
  errorDetail?: string | null;
}) {
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");

  useEffect(() => {
    setSelectedId(documents[0]?.id ?? "");
  }, [documents]);

  const selected = documents.find((document) => document.id === selectedId) ?? documents[0];

  if (errorDetail) {
    return <StateCard title={`${title} unavailable`} detail={errorDetail} icon={ShieldAlert} />;
  }

  if (!selected) {
    return <StateCard title={title} detail={emptyDetail} icon={BookOpen} />;
  }

  return (
    <div className="records-tab">
      <aside className="record-list-panel">
        <h2>{title}</h2>
        {documents.map((document) => (
          <button
            type="button"
            className={document.id === selected.id ? "record-list-item is-selected" : "record-list-item"}
            onClick={() => setSelectedId(document.id)}
            key={document.id}
          >
            <strong>{document.title}</strong>
            <span>{formatPackType(document.type)} / {document.sources.length} source</span>
          </button>
        ))}
      </aside>
      <article className="detail-card record-preview">
        <div className="record-preview-header">
          <div>
            <p className="eyebrow">{formatPackType(selected.type)}</p>
            <h2>{selected.title}</h2>
          </div>
          <StatusPill value={selected.reviewStatus} />
        </div>
        <div className="record-meta-strip">
          <span>{formatPackType(selected.freshness)}</span>
          <span>{formatPackType(selected.privacy)}</span>
          <span>{formatPackType(selected.sourceStatus)}</span>
        </div>
        <TagList values={selected.tags} />
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderSkillDocumentHtml(selected.body) }} />
      </article>
    </div>
  );
}

function SkillExportsTab({ skill }: { skill: SkillDetail }) {
  return (
    <ExportWorkbench subject={skill} subjectKind="skill" compact />
  );
}

function SkillHealthTab({ skill }: { skill: SkillDetail }) {
  const [health, setHealth] = useState<SkillHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHealth(null);
    setError(null);

    async function loadHealth() {
      try {
        const response = await apiClient.getSkillHealth(skill.id);
        if (!cancelled) {
          setHealth(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Skill health.");
        }
      }
    }

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, [skill.id]);

  if (error) {
    return <StateCard title="Skill health unavailable" detail={error} />;
  }

  if (!health) {
    return <div className="detail-card skeleton-detail" />;
  }

  return (
    <article className="detail-card">
      <h2>
        <HeartPulse size={19} aria-hidden="true" />
        Skill Health
      </h2>
      <div className="stat-grid">
        <Stat value={`${health.score}%`} label="Score" />
        <Stat value={formatPackType(health.status)} label="Status" />
        <Stat value={health.reviewQueueCount} label="Open Items" />
        <Stat value={health.items.length} label="Active Items" />
        <Stat value={skill.validation.errors} label="Validation Errors" />
        <Stat value={skill.validation.warnings} label="Validation Warnings" />
      </div>
      <HealthChecks checks={health.checks} />
      <ReviewItemList items={health.items} packs={[]} skills={[skill]} compact />
    </article>
  );
}

function PackDetailPage({ packId, packs }: { packId: string; packs: PackSummary[] }) {
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [exposureReadiness, setExposureReadiness] = useState<PackExposureReadiness | null>(null);
  const [exposureError, setExposureError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExposureError(null);
    setExposureReadiness(null);
    setActiveTab("overview");

    async function loadPackDetail() {
      try {
        const [packResponse, recordsResponse, exposureResponse] = await Promise.all([
          apiClient.getPack(packId),
          apiClient.getPackRecords(packId),
          apiClient.getPackExposureReadiness(packId).catch((readinessError: unknown) => {
            if (!cancelled) {
              setExposureError(readinessError instanceof Error ? readinessError.message : "Exposure readiness is unavailable.");
            }
            return null;
          })
        ]);
        if (!cancelled) {
          setPack(packResponse);
          setRecords(recordsResponse);
          setExposureReadiness(exposureResponse);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load pack detail.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPackDetail();
    return () => {
      cancelled = true;
    };
  }, [packId]);

  if (loading) {
    return <DetailLoading />;
  }

  if (error || !pack) {
    return (
      <section className="detail-page">
        <BackLink href="#/library" label="Pack Library" />
        <StateCard title="Pack unavailable" detail={error ?? "The local API did not return this pack."} />
      </section>
    );
  }

  const detailBrand = resolvePackBrand(pack);

  return (
    <section className="detail-page" aria-labelledby="pack-detail-title">
      <BackLink href="#/library" label="Pack Library" />
      <div className="pack-detail-hero">
        <BrandPackCover pack={pack} />
        <div>
          <div className="eyebrow">
            <Package size={16} aria-hidden="true" />
            <span>{formatPackType(pack.type)}</span>
          </div>
          <h1 id="pack-detail-title">{pack.name}</h1>
          <p>{pack.description}</p>
          <div className="hero-badges">
            <PackHealthPill score={pack.healthScore} status={pack.healthStatus} />
            <PackTrustBadge trustLevel={pack.trustLevel} hasThirdPartyBrand={Boolean(detailBrand)} />
            <span className="version-pill">{pack.version}</span>
          </div>
          <div className="last-reviewed">
            <CalendarDays size={15} aria-hidden="true" />
            <span>Last reviewed: {formatDate(pack.lastReviewedAt)}</span>
          </div>
        </div>
      </div>

      <div className="detail-tabs" role="tablist" aria-label={`${pack.name} detail tabs`}>
        {detailTabs.map((tab) => (
          <button
            type="button"
            className={activeTab === tab ? "is-selected" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {formatPackType(tab)}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <PackOverview pack={pack} records={records} packs={packs} exposureReadiness={exposureReadiness} exposureError={exposureError} />
      ) : null}
      {activeTab === "records" ? <RecordsTab pack={pack} records={records} /> : null}
      {activeTab === "sources" ? <SourcesTab sources={pack.sources} /> : null}
      {activeTab === "exports" ? <ExportsTab pack={pack} /> : null}
      {activeTab === "health" ? <HealthTab pack={pack} /> : null}
      {activeTab === "activity" ? <PlaceholderTab title="Activity" detail="Activity timelines arrive after pack health and review workflows are implemented." /> : null}
      {activeTab === "changelog" ? <PlaceholderTab title="Changelog" detail="Static HTML can render CHANGELOG.md; API-backed changelog content remains a later read endpoint." /> : null}
    </section>
  );
}

function PackOverview({
  pack,
  records,
  packs,
  exposureReadiness,
  exposureError
}: {
  pack: PackDetail;
  records: RecordSummary[];
  packs: PackSummary[];
  exposureReadiness: PackExposureReadiness | null;
  exposureError: string | null;
}) {
  const related = packs.filter((candidate) => candidate.id !== pack.id && candidate.type === pack.type).slice(0, 3);
  const brand = resolvePackBrand(pack);
  const trustLabel = packTrustLabels[normalizePackTrustLevel(pack.trustLevel, Boolean(brand))];

  return (
    <div className="detail-grid">
      <article className="detail-card summary-card">
        <h2>
          <FileText size={19} aria-hidden="true" />
          Summary
        </h2>
        <p>{pack.description}</p>
        <TagList values={[pack.type, pack.visibility, trustLabel]} />
        <dl className="fact-grid">
          <Fact label="Author" value={pack.author} />
          <Fact label="License" value={pack.license} />
          <Fact label="Created" value={formatDate(pack.createdAt)} />
          <Fact label="Updated" value={formatDate(pack.updatedAt)} />
        </dl>
      </article>

      <article className="detail-card">
        <h2>
          <Rows3 size={19} aria-hidden="true" />
          Pack Stats
        </h2>
        <div className="stat-grid">
          <Stat value={records.length} label="Records" />
          <Stat value={pack.sources.length} label="Sources" />
          <Stat value={pack.exportProfiles.length} label="Export Profiles" />
          <Stat value={pack.reviewQueueCount} label="Review Queue" />
        </div>
      </article>

      <article className="detail-card warning-card">
        <h2>
          <ShieldAlert size={19} aria-hidden="true" />
          Health Warnings
        </h2>
        <p>{pack.validation.errors === 0 ? "No validation errors in the derived index." : `${pack.validation.errors} validation errors found.`}</p>
        <button className="inline-action" type="button" disabled>
          Review Queue
        </button>
      </article>

      <ExposureReadinessPanel readiness={exposureReadiness} error={exposureError} />

      <article className="detail-card">
        <h2>
          <CloudDownload size={19} aria-hidden="true" />
          Export Profiles
        </h2>
        <ProfileList profiles={pack.exportProfiles} />
      </article>

      <article className="detail-card">
        <h2>
          <Package size={19} aria-hidden="true" />
          Related Packs
        </h2>
        {related.length === 0 ? (
          <p>Related pack suggestions arrive as the library grows.</p>
        ) : (
          <ul className="simple-list">
            {related.map((candidate) => (
              <li key={candidate.id}>
                <a href={packHref(candidate.id)}>{candidate.name}</a>
                <HealthBadge pack={candidate} />
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

function ExposureReadinessPanel({ readiness, error }: { readiness: PackExposureReadiness | null; error: string | null }) {
  if (error) {
    return (
      <article className="detail-card warning-card" aria-labelledby="exposure-readiness-title">
        <h2 id="exposure-readiness-title">
          <ShieldAlert size={19} aria-hidden="true" />
          Exposure Readiness
        </h2>
        <p>{error}</p>
      </article>
    );
  }

  if (!readiness) {
    return (
      <article className="detail-card" aria-labelledby="exposure-readiness-title">
        <h2 id="exposure-readiness-title">
          <ShieldCheck size={19} aria-hidden="true" />
          Exposure Readiness
        </h2>
        <p>Exposure readiness is loading.</p>
      </article>
    );
  }

  const hasBlockers = readiness.summary.blockedRecords > 0 || readiness.summary.blockedProfiles > 0 || readiness.blockers.length > 0;
  const hasWarnings = readiness.summary.warningRecords > 0 || readiness.summary.warningProfiles > 0 || readiness.warnings.length > 0;
  const status = hasBlockers ? "Blocked" : hasWarnings ? "Needs review" : "Ready";
  const issues = [...readiness.blockers, ...readiness.warnings].slice(0, 3);

  return (
    <article className={hasBlockers ? "detail-card warning-card" : "detail-card"} aria-labelledby="exposure-readiness-title">
      <h2 id="exposure-readiness-title">
        {hasBlockers ? <ShieldAlert size={19} aria-hidden="true" /> : <ShieldCheck size={19} aria-hidden="true" />}
        Exposure Readiness
      </h2>
      <div className="readiness-summary">
        <span className={hasBlockers ? "readiness-status is-blocked" : hasWarnings ? "readiness-status is-warning" : "readiness-status is-ready"}>
          {status}
        </span>
        <span>{formatPackType(readiness.security.status)}</span>
      </div>
      <div className="stat-grid compact-stat-grid">
        <Stat value={`${readiness.summary.exportEligibleRecords}/${readiness.summary.recordCount}`} label="Export Records" />
        <Stat value={`${readiness.summary.mcpEligibleRecords}/${readiness.summary.recordCount}`} label="MCP Records" />
        <Stat value={`${readiness.summary.exportEligibleProfiles}/${readiness.summary.exportProfileCount}`} label="Profiles" />
        <Stat value={`${readiness.summary.sourceBackedRecords}/${readiness.summary.recordCount}`} label="Source Coverage" />
      </div>
      {issues.length > 0 ? (
        <ul className="simple-list readiness-issues">
          {issues.map((issue) => (
            <li key={`${issue.severity}-${issue.code}`}>
              <strong>{formatPackType(issue.severity)}</strong>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>All active records and profiles meet the default read-only exposure policy.</p>
      )}
      <p className="muted-note">{readiness.policies.mcp.defaultBodyPolicy}.</p>
    </article>
  );
}

function RecordsTab({ pack, records }: { pack: PackDetail; records: RecordSummary[] }) {
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");

  useEffect(() => {
    setSelectedId(records[0]?.id ?? "");
  }, [pack.id, records]);

  return (
    <div className="records-tab">
      <aside className="record-list-panel">
        <h2>Records</h2>
        {records.map((record) => (
          <button
            type="button"
            className={record.id === selectedId ? "record-list-item is-selected" : "record-list-item"}
            onClick={() => setSelectedId(record.id)}
            key={record.id}
          >
            <strong>{record.title}</strong>
            <span>{formatPackType(record.type)} / {record.sources.length} source</span>
          </button>
        ))}
      </aside>
      <RecordPreview recordId={selectedId} />
    </div>
  );
}

function RecordPreview({ recordId }: { recordId: string }) {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setError(null);

    if (!recordId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadRecord() {
      try {
        const response = await apiClient.getRecord(recordId);
        if (!cancelled) {
          setRecord(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
        }
      }
    }

    void loadRecord();
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  if (error) {
    return <StateCard title="Record unavailable" detail={error} />;
  }

  if (!record) {
    return <div className="detail-card skeleton-detail" />;
  }

  return (
    <article className="detail-card record-preview">
      <div className="record-preview-header">
        <div>
          <p className="eyebrow">{formatPackType(record.type)}</p>
          <h2>{record.title}</h2>
        </div>
        <a className="inline-action" href={recordHref(record.id)}>
          Open Record
        </a>
      </div>
      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderRecordBodyHtml(record.body) }} />
    </article>
  );
}

function SourcesTab({ sources }: { sources: SourceSummary[] }) {
  return (
    <article className="detail-card">
      <h2>Source Map</h2>
      <div className="table-wrap">
        <table className="pack-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Type</th>
              <th>Status</th>
              <th>Trust</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>{source.title}</td>
                <td>{formatPackType(source.type)}</td>
                <td>{source.status ?? "unknown"}</td>
                <td>{source.trust ?? "unknown"}</td>
                <td>{source.path ?? source.url ?? source.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ExportsTab({ pack }: { pack: PackDetail }) {
  return (
    <ExportWorkbench subject={pack} subjectKind="pack" compact />
  );
}

function ComposerPage({ packs, skills, mode }: { packs: PackSummary[]; skills: SkillSummary[]; mode: "agent-kit" | "record-export" }) {
  return (
    <>
      <section className="library-panel composer-mode-shell" aria-label="Composer mode">
        <div className="composer-mode-strip">
          <a className={mode === "agent-kit" ? "is-selected" : ""} href={composerHref("agent-kit")}>
            <Sparkles size={16} aria-hidden="true" />
            <span>Agent Kit</span>
          </a>
          <a className={mode === "record-export" ? "is-selected" : ""} href={composerHref("record-export")}>
            <FileText size={16} aria-hidden="true" />
            <span>Record Export</span>
          </a>
        </div>
      </section>
      {mode === "record-export" ? <RecordExportComposerPage packs={packs} /> : <AgentKitComposerPage packs={packs} skills={skills} />}
    </>
  );
}

function AgentKitComposerPage({ packs, skills }: { packs: PackSummary[]; skills: SkillSummary[] }) {
  const [name, setName] = useState("Implementation Support Kit");
  const [goal, setGoal] = useState("Prepare a safe, source-backed assistant brief for a specific task.");
  const [description, setDescription] = useState("Combine selected local context packs with reusable skills without execution, cloud sync, telemetry, or marketplace behavior.");
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [target, setTarget] = useState("codex");
  const [format, setFormat] = useState<"markdown" | "json" | "text">("markdown");
  const [redactionMode, setRedactionMode] = useState<"redacted" | "public_safe">("redacted");
  const [tokenBudget, setTokenBudget] = useState("");
  const [packFilters, setPackFilters] = useState<AgentKitPackFilters>({
    query: "",
    type: "all",
    trustLevel: "all",
    healthStatus: "all"
  });
  const [skillFilters, setSkillFilters] = useState<AgentKitSkillFilters>({
    query: "",
    type: "all",
    trustLevel: "all",
    healthStatus: "all",
    target: "all"
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAgentKit, setSavedAgentKit] = useState<{ id: string; detailHref: string; message: string } | null>(null);
  const [templates, setTemplates] = useState<AgentKitTemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .getAgentKitTemplates()
      .then((loadedTemplates) => {
        if (cancelled) {
          return;
        }
        setTemplates(loadedTemplates);
        setTemplatesLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setTemplateError(toErrorMessage(error, "Unable to load Agent Kit templates."));
        setTemplates([]);
        setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const draft = {
    name,
    goal,
    description,
    selectedPackIds,
    selectedSkillIds,
    target,
    format,
    redactionMode,
    tokenBudget: parseAgentKitTokenBudget(tokenBudget)
  };
  const validation = useMemo(() => validateAgentKitDraft(draft, packs, skills), [draft, packs, skills]);
  const preview = useMemo(() => buildAgentKitPreviewMetadata(draft, packs, skills), [draft, packs, skills]);
  const packFilterOptions = useMemo(() => getAgentKitPackFilterOptions(packs), [packs]);
  const skillFilterOptions = useMemo(() => getAgentKitSkillFilterOptions(skills), [skills]);
  const visiblePacks = useMemo(() => filterAgentKitPacks(packs, packFilters), [packFilters, packs]);
  const visibleSkills = useMemo(() => filterAgentKitSkills(skills, skillFilters), [skillFilters, skills]);
  const saveDisabled = isAgentKitSaveDisabled(draft, packs, skills, saving);
  const notices = [...validation.errors, ...validation.warnings];

  function togglePackSelection(packId: string) {
    setSelectedPackIds((current) => toggleSelectedId(current, packId));
    setSavedAgentKit(null);
    setSaveError(null);
  }

  function toggleSkillSelection(skillId: string) {
    setSelectedSkillIds((current) => toggleSelectedId(current, skillId));
    setSavedAgentKit(null);
    setSaveError(null);
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    const applied = applyAgentKitTemplateToDraft(template);
    setName(applied.name);
    setGoal(applied.goal);
    setDescription(applied.description);
    setSelectedPackIds(applied.selectedPackIds);
    setSelectedSkillIds(applied.selectedSkillIds);
    setTarget(applied.target);
    setFormat(applied.format);
    setRedactionMode(applied.redactionMode);
    setTokenBudget(applied.tokenBudget ? String(applied.tokenBudget) : "");
    setSavedAgentKit(null);
    setSaveError(null);
  }

  async function saveAgentKit() {
    if (saveDisabled) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSavedAgentKit(null);
    try {
      const response = selectedTemplateId
        ? await apiClient.createAgentKitFromTemplate(selectedTemplateId, {
            id: preview.id,
            name: draft.name.trim(),
            goal: draft.goal.trim(),
            description: draft.description.trim(),
            contextPacks: [...draft.selectedPackIds],
            skills: [...draft.selectedSkillIds],
            target: draft.target,
            format: draft.format,
            privacyMode: draft.redactionMode,
            tokenBudget: draft.tokenBudget
          })
        : await apiClient.saveAgentKit(buildAgentKitSaveRequest(draft, packs, skills));
      const savedId = response.agentKit?.id ?? response.id ?? preview.id;
      setSavedAgentKit({
        id: savedId,
        detailHref: response.detailUrl ?? agentKitHref(savedId),
        message: response.message ?? "Agent Kit saved locally."
      });
    } catch (error) {
      setSaveError(toErrorMessage(error, "Unable to save Agent Kit."));
    } finally {
      setSaving(false);
    }
  }

  if (packs.length === 0 || skills.length === 0) {
    return (
      <StateCard
        title="Agent Kit Composer unavailable"
        detail="Agent Kit composition needs indexed context packs and skills from the local API."
        icon={Sparkles}
      />
    );
  }

  return (
    <section className="library-panel composer-page agent-kit-composer" aria-labelledby="agent-kit-composer-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            <span>Agent Kit Composer</span>
          </div>
          <h1 id="agent-kit-composer-title">Agent Kit Composer</h1>
          <p>Pair local context packs with reusable skills for a non-executing assistant export brief.</p>
        </div>
        <a className="secondary-action action-link" href={composerHref("record-export")}>
          Record Export
        </a>
      </div>

      <div className="agent-kit-grid">
        <section className="composer-panel agent-kit-setup">
          <div className="composer-panel-heading">
            <div>
              <h2>Kit Setup</h2>
              <p>Name the job and choose the export contract.</p>
            </div>
          </div>
          <label className="field-label">
            Template
            <select value={selectedTemplateId} onChange={(event) => applyTemplate(event.target.value)}>
              <option value="">Start from scratch</option>
              {templates.map((template) => (
                <option value={template.id} key={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          {templatesLoading ? <p className="muted-note">Loading local templates...</p> : null}
          {templateError ? (
            <p className="composer-error">
              <ShieldAlert size={15} aria-hidden="true" />
              <span>{templateError}</span>
            </p>
          ) : null}
          {selectedTemplateId ? (
            <p className="muted-note">
              Template applied as an unreviewed local draft. Review selections and wording before saving.
            </p>
          ) : null}
          <label className="field-label">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field-label">
            Goal
            <input value={goal} onChange={(event) => setGoal(event.target.value)} />
          </label>
          <label className="field-label">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
          </label>
          <div className="agent-kit-options">
            <label className="field-label">
              Target assistant
              <select value={target} onChange={(event) => setTarget(event.target.value)}>
                {agentKitTargetOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Export format
              <select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
                {agentKitFormatOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Redaction mode
              <select value={redactionMode} onChange={(event) => setRedactionMode(event.target.value as typeof redactionMode)}>
                {agentKitRedactionModeOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Token budget
              <input
                inputMode="numeric"
                min="1"
                placeholder="optional"
                value={tokenBudget}
                onChange={(event) => setTokenBudget(event.target.value.replace(/\D/g, ""))}
              />
            </label>
          </div>
        </section>

        <section className="composer-panel agent-kit-selection">
          <SelectablePacks
            packs={visiblePacks}
            selectedPackIds={selectedPackIds}
            filters={packFilters}
            filterOptions={packFilterOptions}
            onFiltersChange={setPackFilters}
            onToggle={togglePackSelection}
          />
        </section>

        <section className="composer-panel agent-kit-selection">
          <SelectableSkills
            skills={visibleSkills}
            selectedSkillIds={selectedSkillIds}
            filters={skillFilters}
            filterOptions={skillFilterOptions}
            onFiltersChange={setSkillFilters}
            onToggle={toggleSkillSelection}
          />
        </section>

        <aside className="composer-panel agent-kit-preview">
          <div className="composer-panel-heading">
            <div>
              <h2>Preview Metadata</h2>
              <p>{preview.id}</p>
            </div>
          </div>
          <div className="agent-kit-preview-grid">
            <Stat value={preview.contextPackCount} label="Context Packs" />
            <Stat value={preview.skillCount} label="Skills" />
            <Stat value={preview.targetLabel} label="Target" />
            <Stat value={preview.formatLabel} label="Format" />
          </div>
          <dl className="agent-kit-meta">
            <div>
              <dt>Export profile</dt>
              <dd>{preview.exportProfile}</dd>
            </div>
            <div>
              <dt>Redaction</dt>
              <dd>{preview.redactionLabel}</dd>
            </div>
            <div>
              <dt>Excluded tags</dt>
              <dd>{defaultAgentKitExcludeTags.join(", ")}</dd>
            </div>
            <div>
              <dt>Selected packs</dt>
              <dd>{preview.selectedContextPackNames.length > 0 ? preview.selectedContextPackNames.join(", ") : "None"}</dd>
            </div>
            <div>
              <dt>Selected skills</dt>
              <dd>{preview.selectedSkillNames.length > 0 ? preview.selectedSkillNames.join(", ") : "None"}</dd>
            </div>
          </dl>

          <div className="boundary-list" aria-label="Agent Kit boundaries">
            <span>No execution</span>
            <span>No cloud sync</span>
            <span>No telemetry</span>
            <span>No marketplace publish</span>
          </div>

          {notices.length > 0 ? (
            <div className="agent-kit-notices" aria-label="Selection warnings">
              {notices.map((notice) => (
                <p className={`composer-error ${notice.severity}`} key={`${notice.code}-${notice.objectId ?? notice.message}`}>
                  <ShieldAlert size={15} aria-hidden="true" />
                  <span>{notice.message}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="composer-success">Selection is compatible with the current local-only boundaries.</p>
          )}

          <button className="primary-action" type="button" onClick={saveAgentKit} disabled={saveDisabled}>
            {saving ? "Saving..." : "Save Agent Kit"}
          </button>

          {saveError ? (
            <p className="composer-error">
              <ShieldAlert size={15} aria-hidden="true" />
              <span>{saveError}</span>
            </p>
          ) : null}

          {savedAgentKit ? (
            <div className="composer-success-card">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{savedAgentKit.message}</span>
              <a href={savedAgentKit.detailHref}>Open {savedAgentKit.id}</a>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function SelectablePacks({
  packs,
  selectedPackIds,
  filters,
  filterOptions,
  onFiltersChange,
  onToggle
}: {
  packs: PackSummary[];
  selectedPackIds: string[];
  filters: AgentKitPackFilters;
  filterOptions: ReturnType<typeof getAgentKitPackFilterOptions>;
  onFiltersChange(filters: AgentKitPackFilters): void;
  onToggle(packId: string): void;
}) {
  return (
    <>
      <div className="composer-panel-heading">
        <div>
          <h2>Context Packs</h2>
          <p>{packs.length} visible / {selectedPackIds.length} selected</p>
        </div>
      </div>
      <div className="agent-kit-filters">
        <label>
          <Search size={15} aria-hidden="true" />
          <input
            value={filters.query}
            placeholder="Filter packs..."
            onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          />
        </label>
        <select value={filters.type} onChange={(event) => onFiltersChange({ ...filters, type: event.target.value })}>
          <option value="all">All types</option>
          {filterOptions.types.map((type) => (
            <option value={type} key={type}>
              {formatPackType(type)}
            </option>
          ))}
        </select>
        <select value={filters.trustLevel} onChange={(event) => onFiltersChange({ ...filters, trustLevel: event.target.value })}>
          <option value="all">All trust</option>
          {filterOptions.trustLevels.map((trustLevel) => (
            <option value={trustLevel} key={trustLevel}>
              {formatPackType(trustLevel)}
            </option>
          ))}
        </select>
        <select value={filters.healthStatus} onChange={(event) => onFiltersChange({ ...filters, healthStatus: event.target.value })}>
          <option value="all">All health</option>
          {filterOptions.healthStatuses.map((healthStatus) => (
            <option value={healthStatus} key={healthStatus}>
              {formatPackType(healthStatus)}
            </option>
          ))}
        </select>
      </div>
      <div className="composer-pack-list agent-kit-list">
        {packs.map((pack) => (
          <label className={selectedPackIds.includes(pack.id) ? "composer-pack is-active" : "composer-pack"} key={pack.id}>
            <input type="checkbox" checked={selectedPackIds.includes(pack.id)} onChange={() => onToggle(pack.id)} />
            <span>
              <strong>{pack.name}</strong>
              <small>{formatPackType(pack.type)} / {formatPackType(pack.trustLevel)} / {pack.healthScore}% health</small>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

function SelectableSkills({
  skills,
  selectedSkillIds,
  filters,
  filterOptions,
  onFiltersChange,
  onToggle
}: {
  skills: SkillSummary[];
  selectedSkillIds: string[];
  filters: AgentKitSkillFilters;
  filterOptions: ReturnType<typeof getAgentKitSkillFilterOptions>;
  onFiltersChange(filters: AgentKitSkillFilters): void;
  onToggle(skillId: string): void;
}) {
  return (
    <>
      <div className="composer-panel-heading">
        <div>
          <h2>Skills</h2>
          <p>{skills.length} visible / {selectedSkillIds.length} selected</p>
        </div>
      </div>
      <div className="agent-kit-filters">
        <label>
          <Search size={15} aria-hidden="true" />
          <input
            value={filters.query}
            placeholder="Filter skills..."
            onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          />
        </label>
        <select value={filters.target} onChange={(event) => onFiltersChange({ ...filters, target: event.target.value })}>
          <option value="all">All targets</option>
          {filterOptions.targets.map((targetOption) => (
            <option value={targetOption} key={targetOption}>
              {formatPackType(targetOption)}
            </option>
          ))}
        </select>
        <select value={filters.type} onChange={(event) => onFiltersChange({ ...filters, type: event.target.value })}>
          <option value="all">All types</option>
          {filterOptions.types.map((type) => (
            <option value={type} key={type}>
              {formatPackType(type)}
            </option>
          ))}
        </select>
        <select value={filters.healthStatus} onChange={(event) => onFiltersChange({ ...filters, healthStatus: event.target.value })}>
          <option value="all">All health</option>
          {filterOptions.healthStatuses.map((healthStatus) => (
            <option value={healthStatus} key={healthStatus}>
              {formatPackType(healthStatus)}
            </option>
          ))}
        </select>
      </div>
      <div className="composer-pack-list agent-kit-list">
        {skills.map((skill) => (
          <label className={selectedSkillIds.includes(skill.id) ? "composer-pack is-active" : "composer-pack"} key={skill.id}>
            <input type="checkbox" checked={selectedSkillIds.includes(skill.id)} onChange={() => onToggle(skill.id)} />
            <span>
              <strong>{skill.name}</strong>
              <small>{skill.targets.join(", ") || "No targets"} / {skill.healthScore}% health</small>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

function RecordExportComposerPage({ packs }: { packs: PackSummary[] }) {
  const [recordsByPack, setRecordsByPack] = useState<Record<string, RecordSummary[]>>({});
  const [activePackId, setActivePackId] = useState("");
  const [selectedByPack, setSelectedByPack] = useState<Record<string, string[]>>({});
  const [title, setTitle] = useState("Composed Context Export");
  const [target, setTarget] = useState<(typeof composerTargets)[number]["value"]>("codex");
  const [privacyMode, setPrivacyMode] = useState<"redacted" | "public_safe">("redacted");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [privacyFilter, setPrivacyFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [tokenBudget, setTokenBudget] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [artifact, setArtifact] = useState<ExportArtifact | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveResult, setSaveResult] = useState<ComposeSavePackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activePackId && packs[0]) {
      setActivePackId(packs[0].id);
    }
  }, [activePackId, packs]);

  useEffect(() => {
    let cancelled = false;
    if (packs.length === 0) {
      setRecordsByPack({});
      return;
    }

    async function loadRecords() {
      setRecordsLoading(true);
      setError(null);
      try {
        const entries = await Promise.all(packs.map(async (pack) => [pack.id, await apiClient.getPackRecords(pack.id)] as const));
        if (!cancelled) {
          setRecordsByPack(Object.fromEntries(entries));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load records for Composer.");
        }
      } finally {
        if (!cancelled) {
          setRecordsLoading(false);
        }
      }
    }

    void loadRecords();
    return () => {
      cancelled = true;
    };
  }, [packs]);

  const activeRecords = recordsByPack[activePackId] ?? [];
  const filterOptions = useMemo(() => getComposerFilterOptions(activeRecords), [activeRecords]);
  const visibleRecords = useMemo(
    () =>
      filterComposerRecords(activeRecords, {
        query,
        tag: tagFilter,
        type: typeFilter,
        privacy: privacyFilter,
        reviewStatus: reviewFilter
      }),
    [activeRecords, privacyFilter, query, reviewFilter, tagFilter, typeFilter]
  );
  const selectedTarget = composerTargets.find((option) => option.value === target) ?? composerTargets[0];
  const selectedCount = countSelectedRecords(selectedByPack);
  const tokenBudgetValue = tokenBudget.trim() && Number(tokenBudget) > 0 ? Number(tokenBudget) : undefined;

  function togglePack(packId: string) {
    setActivePackId(packId);
    setSelectedByPack((current) => {
      if (Object.prototype.hasOwnProperty.call(current, packId)) {
        const { [packId]: _removed, ...rest } = current;
        return rest;
      }

      return { ...current, [packId]: [] };
    });
    setArtifact(null);
    setSaveResult(null);
  }

  function toggleRecord(packId: string, recordId: string) {
    setSelectedByPack((current) => {
      const selected = new Set(current[packId] ?? []);
      if (selected.has(recordId)) {
        selected.delete(recordId);
      } else {
        selected.add(recordId);
      }

      return { ...current, [packId]: Array.from(selected) };
    });
    setArtifact(null);
    setSaveResult(null);
  }

  function selectVisibleRecords() {
    setSelectedByPack((current) => {
      const selected = new Set(current[activePackId] ?? []);
      for (const record of visibleRecords) {
        selected.add(record.id);
      }

      return { ...current, [activePackId]: Array.from(selected) };
    });
    setArtifact(null);
    setSaveResult(null);
  }

  function clearActivePackRecords() {
    setSelectedByPack((current) => ({ ...current, [activePackId]: [] }));
    setArtifact(null);
    setSaveResult(null);
  }

  async function previewComposition() {
    if (selectedCount === 0) {
      setError("Select at least one record before building a preview.");
      return;
    }

    setLoadingPreview(true);
    setError(null);
    setCopied(false);
    try {
      const request = buildComposePreviewRequest({
        title,
        target,
        format: selectedTarget.format,
        privacyMode,
        selectedByPack,
        excludeTags: defaultComposerExcludeTags,
        tokenBudget: tokenBudgetValue
      });
      setArtifact(await apiClient.composePreview(request));
    } catch (previewError) {
      setArtifact(null);
      setError(previewError instanceof Error ? previewError.message : "Unable to build composed export.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function saveDraftPack() {
    if (selectedCount === 0) {
      setError("Select at least one approved record before saving a draft pack.");
      return;
    }

    setSavingDraft(true);
    setError(null);
    setSaveResult(null);
    try {
      const request = buildComposePreviewRequest({
        title,
        target,
        format: selectedTarget.format,
        privacyMode,
        selectedByPack,
        excludeTags: defaultComposerExcludeTags,
        tokenBudget: tokenBudgetValue
      });
      setSaveResult(
        await apiClient.saveComposedPack({
          ...request,
          name: title || "Composed Context Draft"
        })
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save composed draft pack.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function copyComposition() {
    if (!artifact) {
      return;
    }

    setCopied(await copyTextToClipboard(artifact.content));
  }

  if (packs.length === 0) {
    return <StateCard title="No packs indexed" detail="Composer needs at least one indexed pack." icon={PenLine} />;
  }

  return (
    <section className="library-panel composer-page" aria-labelledby="composer-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <PenLine size={16} aria-hidden="true" />
            <span>Composer</span>
          </div>
          <h1 id="composer-title">Composer</h1>
          <p>Build temporary exports or save a private draft Context Pack from selected approved public-safe records.</p>
        </div>
        <button className="secondary-action" type="button" onClick={saveDraftPack} disabled={selectedCount === 0 || savingDraft}>
          {savingDraft ? "Saving..." : "Save as Draft Pack"}
        </button>
      </div>

      <div className="composer-grid">
        <aside className="composer-panel">
          <h2>Packs</h2>
          <div className="composer-pack-list">
            {packs.map((pack) => {
              const selected = Object.prototype.hasOwnProperty.call(selectedByPack, pack.id);
              return (
                <button
                  className={pack.id === activePackId ? "composer-pack is-active" : "composer-pack"}
                  type="button"
                  onClick={() => setActivePackId(pack.id)}
                  key={pack.id}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => togglePack(pack.id)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select ${pack.name}`}
                  />
                  <span>
                    <strong>{pack.name}</strong>
                    <small>{selectedByPack[pack.id]?.length ?? 0} selected</small>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="composer-panel records-composer">
          <div className="composer-panel-heading">
            <div>
              <h2>Records</h2>
              <p>{recordsLoading ? "Loading records..." : `${visibleRecords.length} visible / ${activeRecords.length} total`}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-action" type="button" onClick={selectVisibleRecords} disabled={!activePackId || visibleRecords.length === 0}>
                Select shown
              </button>
              <button className="secondary-action" type="button" onClick={clearActivePackRecords} disabled={!activePackId}>
                Clear pack
              </button>
            </div>
          </div>

          <div className="composer-filters">
            <label>
              <Search size={15} aria-hidden="true" />
              <input value={query} placeholder="Filter records..." onChange={(event) => setQuery(event.target.value)} />
            </label>
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">All tags</option>
              {filterOptions.tags.map((tag) => (
                <option value={tag} key={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {filterOptions.types.map((type) => (
                <option value={type} key={type}>
                  {formatPackType(type)}
                </option>
              ))}
            </select>
            <select value={privacyFilter} onChange={(event) => setPrivacyFilter(event.target.value)}>
              <option value="all">All privacy</option>
              {filterOptions.privacy.map((privacy) => (
                <option value={privacy} key={privacy}>
                  {privacy}
                </option>
              ))}
            </select>
            <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
              <option value="all">All review</option>
              {filterOptions.reviewStatuses.map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="composer-record-list">
            {visibleRecords.map((record) => (
              <label className="composer-record" key={record.id}>
                <input
                  type="checkbox"
                  checked={(selectedByPack[activePackId] ?? []).includes(record.id)}
                  onChange={() => toggleRecord(activePackId, record.id)}
                />
                <span>
                  <strong>{record.title}</strong>
                  <small>{record.type} / {record.privacy} / {record.reviewStatus}</small>
                </span>
                <span className="tag-row">
                  {record.tags.slice(0, 3).map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              </label>
            ))}
          </div>
        </section>

        <aside className="composer-panel composer-output">
          <h2>Preview</h2>
          <label className="field-label">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="field-label">
            Target
            <select value={target} onChange={(event) => setTarget(event.target.value as typeof target)}>
              {composerTargets.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Privacy
            <select value={privacyMode} onChange={(event) => setPrivacyMode(event.target.value as "redacted" | "public_safe")}>
              <option value="redacted">Redacted</option>
              <option value="public_safe">Public safe only</option>
            </select>
          </label>
          <label className="field-label">
            Token budget
            <input
              inputMode="numeric"
              min="1"
              placeholder="warning only"
              value={tokenBudget}
              onChange={(event) => setTokenBudget(event.target.value.replace(/\D/g, ""))}
            />
          </label>
          <div className="composer-summary">
            <Stat value={selectedCount} label="Selected Records" />
            <p>{summarizeSelectedPacks(packs, selectedByPack)}</p>
            <p>Default exclusions: {defaultComposerExcludeTags.join(", ")}</p>
          </div>
          <button className="primary-action" type="button" onClick={previewComposition} disabled={selectedCount === 0 || loadingPreview}>
            {loadingPreview ? "Building..." : "Build Preview"}
          </button>
          {error ? (
            <p className="composer-error">
              <ShieldAlert size={15} aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
          {saveResult ? (
            <div className="composer-success-card">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <strong>{saveResult.name}</strong>
                <p>
                  Draft pack saved for review with {saveResult.counts.records} records. It is private, unindexed, and excluded
                  from exports until approved.
                </p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {artifact ? (
        <ExportPreview artifact={artifact} onCopy={copyComposition} onDownload={() => downloadExportArtifact(artifact)} copied={copied} />
      ) : null}
    </section>
  );
}

function ExportsPage({ packs, skills }: { packs: PackSummary[]; skills: SkillSummary[] }) {
  const [subjectKind, setSubjectKind] = useState<"pack" | "skill">("pack");
  const [selectedPackId, setSelectedPackId] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPackId && packs[0]) {
      setSelectedPackId(packs[0].id);
    }
  }, [packs, selectedPackId]);

  useEffect(() => {
    if (!selectedSkillId && skills[0]) {
      setSelectedSkillId(skills[0].id);
    }
  }, [selectedSkillId, skills]);

  useEffect(() => {
    let cancelled = false;
    if (subjectKind !== "pack" || !selectedPackId) {
      setPack(null);
      return;
    }

    setLoading(true);
    setError(null);

    async function loadPack() {
      try {
        const response = await apiClient.getPack(selectedPackId);
        if (!cancelled) {
          setPack(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load export profiles.");
          setPack(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPack();
    return () => {
      cancelled = true;
    };
  }, [selectedPackId, subjectKind]);

  useEffect(() => {
    let cancelled = false;
    if (subjectKind !== "skill" || !selectedSkillId) {
      setSkill(null);
      return;
    }

    setLoading(true);
    setError(null);

    async function loadSkill() {
      try {
        const response = await apiClient.getSkill(selectedSkillId);
        if (!cancelled) {
          setSkill(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Skill export profiles.");
          setSkill(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSkill();
    return () => {
      cancelled = true;
    };
  }, [selectedSkillId, subjectKind]);

  if (packs.length === 0 && skills.length === 0) {
    return <StateCard title="No exportable objects indexed" detail="The local API returned an empty pack and Skill library." icon={CloudDownload} />;
  }

  const activeSubject = subjectKind === "skill" ? skill : pack;

  return (
    <section className="library-panel" aria-labelledby="exports-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <CloudDownload size={16} aria-hidden="true" />
            <span>Exports</span>
          </div>
          <h1 id="exports-title">Export Center</h1>
          <p>Generate local, profile-driven pack and Skill artifacts for assistant and agent targets.</p>
        </div>
        <div className="inline-actions">
          <label className="select-control export-pack-select">
            <Filter size={16} aria-hidden="true" />
            <select value={subjectKind} onChange={(event) => setSubjectKind(event.target.value as "pack" | "skill")}>
              <option value="pack">Context Packs</option>
              <option value="skill">Skills</option>
            </select>
          </label>
          <label className="select-control export-pack-select">
            {subjectKind === "skill" ? <BookOpen size={16} aria-hidden="true" /> : <Package size={16} aria-hidden="true" />}
            <select
              value={subjectKind === "skill" ? selectedSkillId : selectedPackId}
              onChange={(event) =>
                subjectKind === "skill" ? setSelectedSkillId(event.target.value) : setSelectedPackId(event.target.value)
              }
            >
              {(subjectKind === "skill" ? skills : packs).map((candidate) => (
                <option value={candidate.id} key={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <StateCard title="Exports unavailable" detail={error} icon={CloudDownload} />
      ) : loading || !activeSubject ? (
        <DetailLoading />
      ) : (
        <ExportWorkbench subject={activeSubject} subjectKind={subjectKind} />
      )}
    </section>
  );
}

function ExportWorkbench({
  subject,
  subjectKind,
  compact = false
}: {
  subject: PackDetail | SkillDetail;
  subjectKind: "pack" | "skill";
  compact?: boolean;
}) {
  const [target, setTarget] = useState("all");
  const [profileId, setProfileId] = useState(subject.exportProfiles[0]?.id ?? "");
  const [artifact, setArtifact] = useState<ExportArtifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const targets = getExportTargets(subject.exportProfiles);
  const options = buildExportOptions(subject, target);
  const selectedProfile = options.find((option) => option.profile.id === profileId)?.profile ?? options[0]?.profile;

  useEffect(() => {
    setTarget("all");
    setProfileId(subject.exportProfiles[0]?.id ?? "");
    setArtifact(null);
    setError(null);
    setCopied(false);
  }, [subject.id, subject.exportProfiles]);

  useEffect(() => {
    if (!selectedProfile && options[0]) {
      setProfileId(options[0].profile.id);
    } else if (selectedProfile && selectedProfile.id !== profileId) {
      setProfileId(selectedProfile.id);
    }
  }, [options, profileId, selectedProfile]);

  async function previewExport() {
    if (!selectedProfile) {
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      setArtifact(
        subjectKind === "skill"
          ? await apiClient.getSkillExportPreview(subject.id, selectedProfile.id)
          : await apiClient.getExportPreview(subject.id, selectedProfile.id)
      );
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to build export preview.");
      setArtifact(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyExport() {
    if (!artifact) {
      return;
    }

    const copiedToClipboard = await copyTextToClipboard(artifact.content);
    setCopied(copiedToClipboard);
    if (!copiedToClipboard) {
      setError("Unable to copy export content from this browser session.");
    }
  }

  return (
    <article className={compact ? "detail-card export-workbench compact" : "detail-card export-workbench"}>
      <div className="export-header">
        <div>
          <h2>Export Profiles</h2>
          <p>{subject.exportProfiles.length} profile-driven targets for {subject.name}.</p>
        </div>
        <div className="export-controls">
          <label className="select-control">
            <Filter size={16} aria-hidden="true" />
            <select value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="all">All targets</option>
              {targets.map((candidate) => (
                <option value={candidate} key={candidate}>
                  {formatPackType(candidate)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-control">
            <CloudDownload size={16} aria-hidden="true" />
            <select value={selectedProfile?.id ?? ""} onChange={(event) => setProfileId(event.target.value)}>
              {options.map((option) => (
                <option value={option.profile.id} key={option.profile.id}>
                  {option.profile.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-action" type="button" onClick={previewExport} disabled={!selectedProfile || loading}>
            <CloudDownload size={18} aria-hidden="true" />
            <span>{loading ? "Building" : "Preview"}</span>
          </button>
        </div>
      </div>

      <ProfileList profiles={options.map((option) => option.profile)} />

      {error ? <StateCard title="Export failed" detail={error} icon={ShieldAlert} /> : null}
      {artifact ? (
        <ExportPreview artifact={artifact} onCopy={copyExport} onDownload={() => downloadExportArtifact(artifact)} copied={copied} />
      ) : (
        <div className="export-placeholder">
          <CloudDownload size={26} aria-hidden="true" />
          <h2>No preview loaded</h2>
          <p>{selectedProfile ? `${selectedProfile.name} is ready.` : "No export profile matches this target."}</p>
        </div>
      )}
    </article>
  );
}

function ExportPreview({
  artifact,
  copied,
  onCopy,
  onDownload
}: {
  artifact: ExportArtifact;
  copied: boolean;
  onCopy(): void;
  onDownload(): void;
}) {
  return (
    <div className="export-preview">
      <div className="export-preview-toolbar">
        <div>
          <strong>{artifact.filename}</strong>
          <span>{formatPackType(artifact.target)} / {artifact.estimatedTokens} estimated tokens / {artifact.byteLength} bytes</span>
        </div>
        <div className="export-actions">
          <button type="button" onClick={onCopy}>
            <Copy size={16} aria-hidden="true" />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button type="button" onClick={onDownload}>
            <Download size={16} aria-hidden="true" />
            <span>Download</span>
          </button>
        </div>
      </div>
      <div className="export-stats">
        <Stat value={artifact.includedRecords.length} label="Included" />
        <Stat value={artifact.excludedRecords.length} label="Excluded" />
        <Stat value={artifact.sources.length} label="Sources" />
        <Stat value={artifact.warnings.length} label="Warnings" />
      </div>
      {artifact.warnings.length > 0 ? (
        <ul className="export-warning-list">
          {artifact.warnings.map((warning) => (
            <li key={`${warning.code}-${warning.recordId ?? warning.pattern ?? warning.message}`}>{warning.message}</li>
          ))}
        </ul>
      ) : null}
      <pre className="export-code"><code>{artifact.content}</code></pre>
    </div>
  );
}

function agentKitPreviewToArtifact(preview: AgentKitExportPreview, fallbackName: string): ExportArtifact {
  return {
    packId: preview.packId ?? preview.agentKitId,
    packName: preview.packName ?? fallbackName,
    profileId: preview.profileId,
    profileName: preview.profileName ?? preview.profileId,
    target: preview.target,
    format: preview.format,
    filename: preview.filename,
    mimeType: preview.mimeType ?? (preview.format === "json" ? "application/json" : "text/markdown"),
    content: preview.content,
    includedRecords: preview.includedRecords ?? [],
    excludedRecords: preview.excludedRecords ?? [],
    sources: preview.sources ?? [],
    warnings: preview.warnings,
    generatedAt: preview.generatedAt ?? "",
    byteLength: preview.byteLength ?? preview.content.length,
    estimatedTokens: preview.estimatedTokens ?? Math.max(1, Math.ceil(preview.content.length / 4))
  };
}

function HealthTab({ pack }: { pack: PackDetail }) {
  const [health, setHealth] = useState<PackHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHealth(null);
    setError(null);

    async function loadHealth() {
      try {
        const response = await apiClient.getPackHealth(pack.id);
        if (!cancelled) {
          setHealth(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load pack health.");
        }
      }
    }

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, [pack.id]);

  if (error) {
    return <StateCard title="Health unavailable" detail={error} />;
  }

  if (!health) {
    return <div className="detail-card skeleton-detail" />;
  }

  return (
    <article className="detail-card">
      <h2>Health</h2>
      <div className="stat-grid">
        <Stat value={`${health.score}%`} label="Score" />
        <Stat value={formatPackType(health.status)} label="Status" />
        <Stat value={health.reviewQueueCount} label="Open Items" />
        <Stat value={health.items.length} label="Active Items" />
      </div>
      <HealthChecks checks={health.checks} />
      <ReviewItemList items={health.items} packs={[pack]} compact />
    </article>
  );
}

function ReviewQueuePage({
  packs,
  skills,
  agentKits,
  initialTab,
  onStatusChanged
}: {
  packs: PackSummary[];
  skills: SkillSummary[];
  agentKits: AgentKitSummary[];
  initialTab: "items" | "drafts";
  onStatusChanged(): void;
}) {
  const [activeTab, setActiveTab] = useState<"items" | "drafts">(initialTab);
  const [response, setResponse] = useState<{ items: ReviewItem[] } | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({
    objectType: "all",
    objectId: "all",
    status: "open",
    severity: "all",
    type: "all"
  });
  const [candidateResponse, setCandidateResponse] = useState<{
    candidates: ReviewCandidateSummary[];
    skippedRoots: Array<{ rootLabel: string; reason: string; message: string }>;
  } | null>(null);
  const [candidateFilters, setCandidateFilters] = useState<ReviewCandidateFilters>({
    sourceKind: "all",
    status: "all",
    query: ""
  });
  const [candidateDetail, setCandidateDetail] = useState<ReviewCandidateDetail | null>(null);
  const [candidateActivationPlan, setCandidateActivationPlan] = useState<ReviewCandidateActivationPlan | null>(null);
  const [selectedCandidateKey, setSelectedCandidateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reviewResponse = await apiClient.getReviewItems(reviewFiltersToQuery(filters));
      setResponse({ items: reviewResponse.items });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load review queue.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const loadCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setCandidateError(null);
    try {
      const reviewResponse = await apiClient.getReviewCandidates();
      setCandidateResponse({
        candidates: reviewResponse.candidates,
        skippedRoots: reviewResponse.skippedRoots
      });
    } catch (loadError) {
      setCandidateError(loadError instanceof Error ? loadError.message : "Unable to load draft intake.");
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "drafts" && !candidateResponse && !loadingCandidates) {
      void loadCandidates();
    }
  }, [activeTab, candidateResponse, loadCandidates, loadingCandidates]);

  async function updateStatus(item: ReviewItem, status: "accepted" | "ignored" | "reviewed") {
    await apiClient.updateReviewItemStatus(item.id, status);
    await loadItems();
    onStatusChanged();
  }

  async function inspectCandidate(candidate: ReviewCandidateSummary) {
    setSelectedCandidateKey(candidate.key);
    setCandidateError(null);
    setCandidateDetail(null);
    setCandidateActivationPlan(null);
    try {
      const [detail, plan] = await Promise.all([
        apiClient.getReviewCandidate(candidate.key),
        apiClient.getReviewCandidateActivationPlan(candidate.key)
      ]);
      setCandidateDetail(detail);
      setCandidateActivationPlan(plan);
    } catch (loadError) {
      setCandidateDetail(null);
      setCandidateActivationPlan(null);
      setCandidateError(loadError instanceof Error ? loadError.message : "Unable to load review candidate detail.");
    }
  }

  const items = response?.items ?? [];
  const visibleItems = filterReviewItems(items, filters);
  const summary = summarizeReviewItems(items);
  const candidates = candidateResponse?.candidates ?? [];
  const visibleCandidates = filterReviewCandidates(candidates, candidateFilters);
  const candidateSummary = summarizeReviewCandidates(candidates);

  return (
    <section className="detail-page" aria-labelledby="review-queue-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Review Queue</span>
          </div>
          <h1 id="review-queue-title">Review Queue</h1>
          <p>SQLite-backed attention items plus read-only draft intake for local untrusted Context Pack candidates.</p>
        </div>
        {activeTab === "drafts" ? (
          <div className="summary-strip">
            <Stat value={candidateSummary.ready} label="Ready" />
            <Stat value={candidateSummary.blocked} label="Blocked" />
            <Stat value={candidateSummary.invalid + candidateSummary.duplicates} label="Needs Fix" />
          </div>
        ) : (
          <div className="summary-strip">
            <Stat value={summary.open} label="Open" />
            <Stat value={summary.errors} label="Errors" />
            <Stat value={summary.warnings} label="Warnings" />
          </div>
        )}
      </div>

      <div className="detail-tabs review-tabs" role="tablist" aria-label="Review queue sections">
        <a className={activeTab === "items" ? "is-selected" : ""} href={reviewQueueHref()} role="tab" aria-selected={activeTab === "items"}>
          Review Items
        </a>
        <a
          className={activeTab === "drafts" ? "is-selected" : ""}
          href={reviewQueueHref("drafts")}
          role="tab"
          aria-selected={activeTab === "drafts"}
        >
          Draft Intake
        </a>
      </div>

      {activeTab === "drafts" ? (
        <>
          <ReviewCandidateFiltersBar filters={candidateFilters} onChange={setCandidateFilters} />
          {candidateError ? <StateCard title="Draft intake unavailable" detail={candidateError} /> : null}
          {loadingCandidates ? (
            <DetailLoading />
          ) : candidates.length === 0 ? (
            <StateCard
              title="No draft candidates"
              detail="Configured draft, composed, and quarantine folders do not currently contain candidate Context Packs."
              icon={CheckCircle2}
            />
          ) : visibleCandidates.length === 0 ? (
            <StateCard title="No matching draft candidates" detail="Adjust the intake filters to see more candidates." />
          ) : (
            <div className="draft-intake-layout">
              <div className="review-list">
                {visibleCandidates.map((candidate) => (
                  <ReviewCandidateCard
                    candidate={candidate}
                    selected={selectedCandidateKey === candidate.key}
                    onInspect={inspectCandidate}
                    key={candidate.key}
                  />
                ))}
              </div>
              <ReviewCandidateDetailPanel
                candidate={candidateDetail}
                activationPlan={candidateActivationPlan}
                skippedRoots={candidateResponse?.skippedRoots ?? []}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <ReviewFiltersBar filters={filters} packs={packs} skills={skills} agentKits={agentKits} onChange={setFilters} />

          {error ? (
            <StateCard title="Review queue unavailable" detail={error} />
          ) : loading ? (
            <DetailLoading />
          ) : items.length === 0 ? (
            <StateCard title="No review items" detail="All indexed demo packs, Skills, and Agent Kits are healthy." icon={CheckCircle2} />
          ) : visibleItems.length === 0 ? (
            <StateCard title="No matching review items" detail="Adjust the queue filters to see more items." />
          ) : (
            <div className="review-list">
              {visibleItems.map((item) => (
                <ReviewItemCard item={item} packs={packs} skills={skills} agentKits={agentKits} onUpdateStatus={updateStatus} key={item.id} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function HealthPage({
  health,
  packs,
  skills,
  agentKits
}: {
  health: HealthResponse | null;
  packs: PackSummary[];
  skills: SkillSummary[];
  agentKits: AgentKitSummary[];
}) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const response = await apiClient.getReviewItems();
        if (!cancelled) {
          setItems(response.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load health items.");
        }
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = summarizeReviewItems(items);
  const typeBreakdown = Array.from(
    items.reduce((map, item) => map.set(item.type, (map.get(item.type) ?? 0) + 1), new Map<string, number>())
  ).sort((left, right) => right[1] - left[1]);

  return (
    <section className="detail-page" aria-labelledby="health-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <HeartPulse size={16} aria-hidden="true" />
            <span>Health</span>
          </div>
          <h1 id="health-title">System Health</h1>
          <p>Deterministic local health derived from Context Pack, Skill, and Agent Kit validation, review, freshness, and source coverage checks.</p>
        </div>
        <div className="summary-strip">
          <Stat value={health?.counts.packs ?? packs.length} label="Packs" />
          <Stat value={health?.counts.skills ?? skills.length} label="Skills" />
          <Stat value={health?.counts.agentKits ?? agentKits.length} label="Agent Kits" />
          <Stat value={health?.counts.openReviewItems ?? summary.open} label="Open Items" />
        </div>
      </div>

      {error ? <StateCard title="Health unavailable" detail={error} /> : null}

      <div className="detail-grid">
        <article className="detail-card">
          <h2>Severity</h2>
          <div className="stat-grid">
            <Stat value={summary.errors} label="Errors" />
            <Stat value={summary.warnings} label="Warnings" />
            <Stat value={summary.infos} label="Info" />
          </div>
        </article>
        <article className="detail-card">
          <h2>Issue Types</h2>
          {typeBreakdown.length === 0 ? (
            <p className="muted-note">No generated review items.</p>
          ) : (
            <ul className="simple-list">
              {typeBreakdown.map(([type, count]) => (
                <li key={type}>
                  <span>{formatPackType(type)}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="detail-card">
        <h2>Pack Health</h2>
        <div className="table-wrap">
          <table className="pack-table">
            <thead>
              <tr>
                <th>Pack</th>
                <th>Status</th>
                <th>Score</th>
                <th>Open Items</th>
                <th>Records</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id}>
                  <td>
                    <a className="pack-title-link" href={packHref(pack.id)}>
                      {pack.name}
                    </a>
                  </td>
                  <td>{formatPackType(pack.healthStatus)}</td>
                  <td>{pack.healthScore}%</td>
                  <td>{pack.reviewQueueCount}</td>
                  <td>{pack.recordCount}</td>
                  <td>{formatDate(pack.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="detail-card">
        <h2>Skill Health</h2>
        <div className="table-wrap">
          <table className="pack-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Status</th>
                <th>Score</th>
                <th>Open Items</th>
                <th>Instructions</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td>
                    <a className="pack-title-link" href={skillHref(skill.id)}>
                      {skill.name}
                    </a>
                  </td>
                  <td>{formatPackType(skill.healthStatus)}</td>
                  <td>{skill.healthScore}%</td>
                  <td>{skill.reviewQueueCount}</td>
                  <td>{skill.instructionCount}</td>
                  <td>{formatDate(skill.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="detail-card">
        <h2>Agent Kit Health</h2>
        <div className="table-wrap">
          <table className="pack-table">
            <thead>
              <tr>
                <th>Agent Kit</th>
                <th>Status</th>
                <th>Score</th>
                <th>Open Items</th>
                <th>Packs</th>
                <th>Skills</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {agentKits.map((agentKit) => (
                <tr key={agentKit.id}>
                  <td>
                    <a className="pack-title-link" href={agentKitHref(agentKit.id)}>
                      {agentKit.name}
                    </a>
                  </td>
                  <td>{formatPackType(agentKit.healthStatus)}</td>
                  <td>{agentKit.healthScore}%</td>
                  <td>{agentKit.reviewQueueCount}</td>
                  <td>{agentKit.contextPackCount}</td>
                  <td>{agentKit.skillCount}</td>
                  <td>{formatDate(agentKit.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function AgentKitDetailPage({ agentKitId }: { agentKitId: string }) {
  const [agentKit, setAgentKit] = useState<AgentKitDetail | null>(null);
  const [health, setHealth] = useState<AgentKitHealthResponse | null>(null);
  const [activeTab, setActiveTab] = useState<AgentKitDetailTab>("overview");
  const [preview, setPreview] = useState<AgentKitExportPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewingProfileId, setPreviewingProfileId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveTab("overview");
    setPreview(null);
    setPreviewError(null);

    async function loadAgentKit() {
      try {
        const [response, healthResponse] = await Promise.all([apiClient.getAgentKit(agentKitId), apiClient.getAgentKitHealth(agentKitId)]);
        if (!cancelled) {
          setAgentKit(response);
          setHealth(healthResponse);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Agent Kit.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAgentKit();
    return () => {
      cancelled = true;
    };
  }, [agentKitId]);

  async function previewExport(profileId: string) {
    setPreviewingProfileId(profileId);
    setPreview(null);
    setPreviewError(null);
    try {
      setPreview(await apiClient.getAgentKitExportPreview(agentKitId, profileId));
      setCopied(false);
    } catch (loadError) {
      setPreviewError(loadError instanceof Error ? loadError.message : "Unable to preview Agent Kit export.");
    } finally {
      setPreviewingProfileId(null);
    }
  }

  async function copyAgentKitExport() {
    if (!preview?.content) {
      return;
    }

    setCopied(await copyTextToClipboard(preview.content));
  }

  if (loading) {
    return <DetailLoading />;
  }

  if (error || !agentKit) {
    return (
      <section className="detail-page">
        <BackLink href={agentKitsHref()} label="Agent Kit Library" />
        <StateCard title="Agent Kit unavailable" detail={error ?? "The local API did not return this Agent Kit."} />
      </section>
    );
  }

  return (
    <section className="detail-page" aria-labelledby="agent-kit-detail-title">
      <BackLink href={agentKitsHref()} label="Agent Kit Library" />
      <div className="pack-detail-hero">
        <AgentKitCover agentKit={agentKit} variant="large" />
        <div>
          <div className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            <span>{formatPackType(agentKit.type)}</span>
          </div>
          <h1 id="agent-kit-detail-title">{agentKit.name}</h1>
          <p>{agentKit.description}</p>
          <div className="hero-badges">
            <AgentKitHealthBadge agentKit={agentKit} />
            <AgentKitTrustBadge agentKit={agentKit} />
            <span className="version-pill">{agentKit.version}</span>
          </div>
          <div className="last-reviewed">
            <CalendarDays size={15} aria-hidden="true" />
            <span>Last reviewed: {formatDate(agentKit.lastReviewedAt)}</span>
          </div>
        </div>
      </div>

      <div className="detail-tabs" role="tablist" aria-label={`${agentKit.name} detail tabs`}>
        {agentKitDetailTabs.map((tab) => (
          <button
            type="button"
            className={activeTab === tab ? "is-selected" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {formatPackType(tab)}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="detail-grid">
        <article className="detail-card summary-card">
          <h2>
            <Sparkles size={19} aria-hidden="true" />
            Kit Summary
          </h2>
          <p>{agentKit.description}</p>
          <dl className="fact-grid">
            <Fact label="Target" value={formatPackType(agentKit.target)} />
            <Fact label="Privacy" value={formatPackType(agentKit.privacyMode)} />
            <Fact label="Context Packs" value={agentKit.counts.contextPacks} />
            <Fact label="Skills" value={agentKit.counts.skills} />
            <Fact label="Export Profiles" value={agentKit.counts.exportProfiles} />
            <Fact label="Token Budget" value={agentKit.tokenBudget ?? "Warning only"} />
          </dl>
        </article>
        <article className="detail-card">
          <h2>Boundaries</h2>
          <ul className="simple-list">
            <li><span>No execution</span><strong>{String(agentKit.manifest.containsExecutableCode === false)}</strong></li>
            <li><span>No network requirement</span><strong>{String(agentKit.manifest.requiresNetwork === false)}</strong></li>
            <li><span>Visibility</span><strong>{formatPackType(agentKit.visibility)}</strong></li>
            <li><span>Review Queue</span><strong>{agentKit.reviewQueueCount}</strong></li>
          </ul>
        </article>
        </div>
      ) : null}

      {activeTab === "context-packs" ? (
        <article className="detail-card">
          <h2>Context Packs</h2>
          <ul className="simple-list">
            {agentKit.contextPacks.map((pack) => (
              <li key={pack.id}>
                <a href={packHref(pack.id)}>{pack.name}</a>
                <span>{formatPackType(pack.healthStatus)}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {activeTab === "skills" ? (
        <article className="detail-card">
          <h2>Skills</h2>
          <ul className="simple-list">
            {agentKit.skills.map((skill) => (
              <li key={skill.id}>
                <a href={skillHref(skill.id)}>{skill.name}</a>
                <span>{skill.targets.join(", ")}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {activeTab === "rules" ? (
        <article className="detail-card">
          <h2>Rules</h2>
          <dl className="fact-grid">
            <Fact label="Default Export" value={String(agentKit.manifest.exportProfile ?? "Not set")} />
            <Fact label="Compatibility" value={formatPackType(String((agentKit.manifest.compatibility as { contextarr?: string } | undefined)?.contextarr ?? "current"))} />
            <Fact label="Required Packs" value={agentKit.contextPacks.length} />
            <Fact label="Required Skills" value={agentKit.skills.length} />
          </dl>
          <p className="muted-note">Agent Kits prepare validated export briefs only; Contextarr does not run kits or execute Skills.</p>
        </article>
      ) : null}

      {activeTab === "exports" ? (
        <article className="detail-card">
          <h2>Export Profiles</h2>
          <div className="profile-grid">
            {agentKit.exportProfiles.map((profile) => (
              <article className="profile-card" key={profile.id}>
                <strong>{profile.name}</strong>
                <span>{formatPackType(profile.target)} / {profile.format}</span>
                <em>{profile.privacyMode ?? "redacted"}</em>
                <button
                  className="ghost-action"
                  type="button"
                  onClick={() => void previewExport(profile.id)}
                  disabled={previewingProfileId === profile.id}
                >
                  Preview
                </button>
              </article>
            ))}
          </div>
          {previewError ? <p className="error-note">{previewError}</p> : null}
          {preview ? (
            <div className="export-preview">
              <div className="export-preview-header">
                <div>
                  <h3>{preview.filename}</h3>
                  <p>{formatPackType(preview.target)} / {preview.format}</p>
                </div>
                <span className="status-pill info">{formatPackType(preview.contentStatus)}</span>
              </div>
              <div className="stat-grid">
                <Stat value={preview.includedContextPacks.length} label="Context Packs" />
                <Stat value={preview.includedSkills.length} label="Skills" />
                <Stat value={preview.warnings.length} label="Warnings" />
              </div>
              {preview.warnings.length > 0 ? (
                <ul className="simple-list">
                  {preview.warnings.map((warning) => (
                    <li key={warning.code}>
                      <span>{warning.message}</span>
                      <strong>{warning.code}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}
              {preview.content ? (
                <ExportPreview
                  artifact={agentKitPreviewToArtifact(preview, agentKit.name)}
                  copied={copied}
                  onCopy={() => void copyAgentKitExport()}
                  onDownload={() => downloadExportArtifact(agentKitPreviewToArtifact(preview, agentKit.name))}
                />
              ) : null}
            </div>
          ) : null}
        </article>
      ) : null}

      {activeTab === "health" ? (
        <article className="detail-card">
          <h2>Health</h2>
          {health ? (
            <>
              <div className="stat-grid">
                <Stat value={`${health.score}%`} label="Score" />
                <Stat value={formatPackType(health.status)} label="Status" />
                <Stat value={health.reviewQueueCount} label="Open Items" />
                <Stat value={health.items.length} label="Active Items" />
              </div>
              <HealthChecks checks={health.checks} />
              <ReviewItemList items={health.items} packs={[]} skills={[]} agentKits={[agentKit]} compact />
            </>
          ) : (
            <p className="muted-note">Agent Kit health is unavailable.</p>
          )}
        </article>
      ) : null}
    </section>
  );
}

function RecordDetailPage({ recordId, packs }: { recordId: string; packs: PackSummary[] }) {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadRecord() {
      try {
        const response = await apiClient.getRecord(recordId);
        if (!cancelled) {
          setRecord(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecord();
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  if (loading) {
    return <DetailLoading />;
  }

  if (error || !record) {
    return (
      <section className="detail-page">
        <BackLink href="#/library" label="Pack Library" />
        <StateCard title="Record unavailable" detail={error ?? "The local API did not return this record."} />
      </section>
    );
  }

  const pack = packs.find((candidate) => candidate.id === record.packId);

  return (
    <section className="detail-page" aria-labelledby="record-title">
      <BackLink href={packHref(record.packId)} label={pack?.name ?? record.packId} />
      <div className="record-detail-layout">
        <article className="detail-card record-document">
          <p className="eyebrow">{formatPackType(record.type)}</p>
          <h1 id="record-title">{record.title}</h1>
          <div className="record-meta-strip">
            <span>{formatPackType(record.freshness)}</span>
            <span>{formatPackType(record.privacy)}</span>
            <span>{formatPackType(record.reviewStatus)}</span>
          </div>
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderRecordBodyHtml(record.body) }} />
        </article>

        <aside className="detail-card record-sidebar">
          <h2>Metadata</h2>
          <dl className="fact-grid single-column">
            <Fact label="Pack" value={record.packId} />
            <Fact label="Confidence" value={formatPackType(record.confidence)} />
            <Fact label="Source Status" value={formatPackType(record.sourceStatus)} />
            <Fact label="Last Reviewed" value={formatDate(record.lastReviewed ?? null)} />
            <Fact label="File" value={record.filePath} />
          </dl>
          <h2>Tags</h2>
          <TagList values={record.tags} />
          <h2>Sources</h2>
          <ul className="source-list">
            {record.resolvedSources.map((source) => (
              <li key={source.id}>
                <strong>{source.title}</strong>
                <span>{source.path ?? source.url ?? source.id}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function ReviewCandidateFiltersBar({
  filters,
  onChange
}: {
  filters: ReviewCandidateFilters;
  onChange(filters: ReviewCandidateFilters): void;
}) {
  return (
    <div className="review-filters candidate-filters">
      <label className="select-control">
        <Layers3 size={16} aria-hidden="true" />
        <select
          value={filters.sourceKind}
          onChange={(event) => onChange({ ...filters, sourceKind: event.target.value as ReviewCandidateSourceKind | "all" })}
        >
          <option value="all">All sources</option>
          <option value="draft_pack">Draft packs</option>
          <option value="composed_pack">Composed packs</option>
          <option value="imported_pack">Imported packs</option>
          <option value="restored_quarantine">Restored quarantine</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>
      <label className="select-control">
        <ShieldCheck size={16} aria-hidden="true" />
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as ReviewCandidateStatus | "all" })}>
          <option value="all">All status</option>
          <option value="ready_for_review">Ready for review</option>
          <option value="invalid">Invalid</option>
          <option value="blocked">Blocked</option>
          <option value="duplicate_active_id">Duplicate active ID</option>
        </select>
      </label>
      <label className="select-control candidate-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={filters.query}
          aria-label="Search draft candidates"
          placeholder="Search candidates"
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </label>
    </div>
  );
}

function ReviewCandidateCard({
  candidate,
  selected,
  onInspect
}: {
  candidate: ReviewCandidateSummary;
  selected: boolean;
  onInspect(candidate: ReviewCandidateSummary): void;
}) {
  return (
    <article className={`review-card candidate-card severity-${candidateSeverity(candidate.status)} ${selected ? "is-selected" : ""}`}>
      <div className="review-card-main">
        <div className="review-card-title">
          <StatusPill value={candidateSeverity(candidate.status)} />
          <span>{formatPackType(candidate.status)}</span>
          <span>{formatPackType(candidate.sourceKind)}</span>
          <em>{candidate.validation.status}</em>
        </div>
        <h2>{candidate.name}</h2>
        <p>{candidate.recommendedAction}</p>
        <div className="review-card-meta">
          {candidate.packId ? <span>{candidate.packId}</span> : null}
          <span>{candidate.pathLabel}</span>
          <span>{candidate.counts.records} records</span>
          <span>{candidate.counts.sources} sources</span>
          <span>{candidate.counts.exportProfiles} exports</span>
        </div>
      </div>
      <div className="review-actions">
        <button type="button" onClick={() => onInspect(candidate)}>
          Inspect
        </button>
      </div>
    </article>
  );
}

function ReviewCandidateDetailPanel({
  candidate,
  activationPlan,
  skippedRoots
}: {
  candidate: ReviewCandidateDetail | null;
  activationPlan: ReviewCandidateActivationPlan | null;
  skippedRoots: Array<{ rootLabel: string; reason: string; message: string }>;
}) {
  if (!candidate) {
    return (
      <aside className="detail-card candidate-detail-panel" aria-label="Draft candidate detail">
        <h2>Candidate Detail</h2>
        <p className="muted-note">Inspect a draft candidate to review validation, security, records, sources, and export metadata.</p>
        {skippedRoots.length > 0 ? (
          <div className="candidate-skipped-roots">
            <h3>Skipped Roots</h3>
            <ul className="simple-list">
              {skippedRoots.map((root) => (
                <li key={`${root.rootLabel}:${root.reason}`}>
                  <span>{root.rootLabel}</span>
                  <strong>{formatPackType(root.reason)}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="detail-card candidate-detail-panel" aria-label={`${candidate.name} candidate detail`}>
      <h2>{candidate.name}</h2>
      <div className="fact-grid">
        <Fact label="Status" value={formatPackType(candidate.status)} />
        <Fact label="Source" value={formatPackType(candidate.sourceKind)} />
        <Fact label="Validation" value={formatPackType(candidate.validation.status)} />
        <Fact label="Security" value={formatPackType(candidate.security.status)} />
      </div>
      <p className="muted-note">{candidate.recommendedAction}</p>
      <ReviewCandidateActivationPlanView plan={activationPlan} />

      <CandidateIssueList title="Validation Issues" issues={candidate.validationIssues} />
      <CandidateSecurityList findings={candidate.securityFindings} />

      <h3>Records</h3>
      {candidate.records.length === 0 ? (
        <p className="muted-note">No record metadata available.</p>
      ) : (
        <ul className="simple-list candidate-metadata-list">
          {candidate.records.slice(0, 8).map((record) => (
            <li key={record.id}>
              <span>{record.title}</span>
              <strong>{formatPackType(record.reviewStatus)}</strong>
            </li>
          ))}
        </ul>
      )}

      <h3>Sources and Exports</h3>
      <div className="stat-grid">
        <Stat value={candidate.sources.length} label="Sources" />
        <Stat value={candidate.exportProfiles.length} label="Profiles" />
        <Stat value={candidate.security.findingCount} label="Findings" />
      </div>
    </aside>
  );
}

function ReviewCandidateActivationPlanView({ plan }: { plan: ReviewCandidateActivationPlan | null }) {
  if (!plan) {
    return null;
  }

  return (
    <section className={`candidate-plan candidate-plan-${plan.status}`} aria-label="Manual activation plan">
      <h3>Manual Activation Plan</h3>
      <div className="fact-grid">
        <Fact label="Plan" value={plan.status === "ready" ? "Ready" : "Blocked"} />
        <Fact label="Target" value={plan.target.pathLabel ?? plan.target.activePacksRootLabel} />
        <Fact label="Blockers" value={plan.blockers.length} />
        <Fact label="Warnings" value={plan.warnings.length} />
      </div>

      <h3>Checks</h3>
      <ul className="simple-list candidate-plan-list">
        {plan.checks.map((check) => (
          <li key={check.id}>
            <span>{check.message}</span>
            <strong>{formatPackType(check.status)}</strong>
          </li>
        ))}
      </ul>

      {plan.blockers.length > 0 ? (
        <>
          <h3>Blocking Conditions</h3>
          <ul className="simple-list candidate-issue-list">
            {plan.blockers.map((blocker) => (
              <li key={blocker.code}>
                <span>{blocker.message}</span>
                <strong>{blocker.code}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {plan.warnings.length > 0 ? (
        <>
          <h3>Warnings</h3>
          <ul className="simple-list candidate-issue-list">
            {plan.warnings.map((warning) => (
              <li key={warning.code}>
                <span>{warning.message}</span>
                <strong>{warning.code}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>Next Steps</h3>
      <ol className="candidate-next-steps">
        {plan.nextSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="muted-note">{plan.boundaries.join(" ")}</p>
    </section>
  );
}

function CandidateIssueList({
  title,
  issues
}: {
  title: string;
  issues: Array<{ severity: string; code: string; message: string; file?: string }>;
}) {
  return (
    <>
      <h3>{title}</h3>
      {issues.length === 0 ? (
        <p className="muted-note">No validation issues reported.</p>
      ) : (
        <ul className="simple-list candidate-issue-list">
          {issues.slice(0, 8).map((issue) => (
            <li key={`${issue.code}:${issue.file ?? ""}:${issue.message}`}>
              <span>{issue.message}</span>
              <strong>{issue.code}</strong>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CandidateSecurityList({
  findings
}: {
  findings: ReviewCandidateDetail["securityFindings"];
}) {
  return (
    <>
      <h3>Security Findings</h3>
      {findings.length === 0 ? (
        <p className="muted-note">No scanner findings reported.</p>
      ) : (
        <ul className="simple-list candidate-issue-list">
          {findings.slice(0, 8).map((finding) => (
            <li key={finding.id}>
              <span>{finding.message}</span>
              <strong>{formatPackType(finding.severity)}</strong>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function candidateSeverity(status: ReviewCandidateStatus): ReviewItem["severity"] {
  if (status === "blocked" || status === "invalid") {
    return "error";
  }
  if (status === "duplicate_active_id") {
    return "warning";
  }
  return "info";
}

function ReviewFiltersBar({
  filters,
  packs,
  skills,
  agentKits,
  onChange
}: {
  filters: ReviewFilters;
  packs: PackSummary[];
  skills: SkillSummary[];
  agentKits: AgentKitSummary[];
  onChange(filters: ReviewFilters): void;
}) {
  const selectableObjects =
    filters.objectType === "agent_kit"
      ? agentKits.map((agentKit) => ({ id: agentKit.id, name: agentKit.name }))
      : filters.objectType === "skill"
      ? skills.map((skill) => ({ id: skill.id, name: skill.name }))
      : filters.objectType === "pack"
        ? packs.map((pack) => ({ id: pack.id, name: pack.name }))
        : [];

  return (
    <div className="review-filters">
      <label className="select-control">
        <Layers3 size={16} aria-hidden="true" />
        <select
          value={filters.objectType}
          onChange={(event) =>
            onChange({
              ...filters,
              objectType: event.target.value as ReviewFilters["objectType"],
              objectId: "all"
            })
          }
        >
          <option value="all">All objects</option>
          <option value="pack">Context Packs</option>
          <option value="skill">Skills</option>
          <option value="agent_kit">Agent Kits</option>
        </select>
      </label>
      <label className="select-control">
        <ShieldCheck size={16} aria-hidden="true" />
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as ReviewFilters["status"] })}>
          <option value="all">All status</option>
          <option value="open">Open</option>
          <option value="accepted">Accepted</option>
          <option value="reviewed">Reviewed</option>
          <option value="ignored">Ignored</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label className="select-control">
        <ShieldAlert size={16} aria-hidden="true" />
        <select value={filters.severity} onChange={(event) => onChange({ ...filters, severity: event.target.value as ReviewFilters["severity"] })}>
          <option value="all">All severity</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
        </select>
      </label>
      <label className="select-control">
        <Filter size={16} aria-hidden="true" />
        <select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value as ReviewFilters["type"] })}>
          <option value="all">All checks</option>
          <option value="validation">Validation</option>
          <option value="freshness">Freshness</option>
          <option value="export_safety">Export Safety</option>
          <option value="export_readiness">Export Readiness</option>
          <option value="example_coverage">Example Coverage</option>
          <option value="safety_rules">Safety Rules</option>
          <option value="target_compatibility">Target Compatibility</option>
          <option value="disallowed_pattern">Disallowed Pattern</option>
          <option value="ai_draft">AI Draft</option>
          <option value="review_status">Review Status</option>
          <option value="trust">Trust</option>
          <option value="source_coverage">Source Coverage</option>
        </select>
      </label>
      <label className="select-control">
        {filters.objectType === "agent_kit" ? (
          <Sparkles size={16} aria-hidden="true" />
        ) : filters.objectType === "skill" ? (
          <BookOpen size={16} aria-hidden="true" />
        ) : (
          <Package size={16} aria-hidden="true" />
        )}
        <select
          value={filters.objectId}
          onChange={(event) => onChange({ ...filters, objectId: event.target.value })}
          disabled={filters.objectType === "all"}
        >
          <option value="all">
            {filters.objectType === "agent_kit" ? "All Agent Kits" : filters.objectType === "skill" ? "All skills" : "All packs"}
          </option>
          {selectableObjects.map((object) => (
            <option value={object.id} key={object.id}>
              {object.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ReviewItemCard({
  item,
  packs,
  skills,
  agentKits,
  onUpdateStatus
}: {
  item: ReviewItem;
  packs: PackSummary[];
  skills: SkillSummary[];
  agentKits: AgentKitSummary[];
  onUpdateStatus(item: ReviewItem, status: "accepted" | "ignored" | "reviewed"): void;
}) {
  return (
    <article className={`review-card severity-${item.severity}`}>
      <div className="review-card-main">
        <div className="review-card-title">
          <StatusPill value={item.severity} />
          <span>{formatPackType(item.type)}</span>
          <em>{item.status}</em>
        </div>
        <h2>{item.message}</h2>
        <p>{item.suggestedAction}</p>
        <div className="review-card-meta">
          {reviewObjectAnchor(item, packs, skills, agentKits)}
          {item.recordId ? reviewDocumentAnchor(item) : null}
          {item.sourceId ? <span>{item.sourceId}</span> : null}
        </div>
      </div>
      <div className="review-actions">
        <button type="button" onClick={() => onUpdateStatus(item, "accepted")} disabled={item.status === "accepted"}>
          Accept
        </button>
        <button type="button" onClick={() => onUpdateStatus(item, "reviewed")} disabled={item.status === "reviewed"}>
          Mark Reviewed
        </button>
        <button type="button" onClick={() => onUpdateStatus(item, "ignored")} disabled={item.status === "ignored"}>
          Ignore
        </button>
        <button type="button" disabled>
          Edit Later
        </button>
      </div>
    </article>
  );
}

function ReviewItemList({
  items,
  packs,
  skills = [],
  agentKits = [],
  compact = false
}: {
  items: ReviewItem[];
  packs: PackSummary[];
  skills?: SkillSummary[];
  agentKits?: AgentKitSummary[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return <p className="muted-note">No active review items for this object.</p>;
  }

  return (
    <div className={compact ? "review-list compact" : "review-list"}>
      {items.map((item) => (
        <article className={`review-card severity-${item.severity}`} key={item.id}>
          <div className="review-card-main">
            <div className="review-card-title">
              <StatusPill value={item.severity} />
              <span>{formatPackType(item.type)}</span>
              <em>{item.status}</em>
            </div>
            <h2>{item.message}</h2>
            <p>{item.suggestedAction}</p>
            <div className="review-card-meta">
              {reviewObjectAnchor(item, packs, skills, agentKits)}
              {item.recordId ? reviewDocumentAnchor(item) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function reviewFiltersToQuery(filters: ReviewFilters): {
  status?: string;
  severity?: string;
  type?: string;
  objectType?: string;
  objectId?: string;
} {
  return {
    status: filters.status === "all" ? undefined : filters.status,
    severity: filters.severity === "all" ? undefined : filters.severity,
    type: filters.type === "all" ? undefined : filters.type,
    objectType: filters.objectType === "all" ? undefined : filters.objectType,
    objectId: filters.objectId === "all" ? undefined : filters.objectId
  };
}

function reviewObjectAnchor(item: ReviewItem, packs: PackSummary[], skills: SkillSummary[], agentKits: AgentKitSummary[]) {
  if (item.objectType === "agent_kit") {
    const agentKitId = item.agentKitId ?? item.objectId;
    return <a href={agentKitHref(agentKitId)}>{reviewAgentKitName(agentKitId, agentKits)}</a>;
  }

  if (item.objectType === "skill") {
    const skillId = item.skillId ?? item.objectId;
    return <a href={skillHref(skillId)}>{reviewSkillName(skillId, skills)}</a>;
  }

  return <a href={packHref(item.packId)}>{reviewPackName(item.packId, packs)}</a>;
}

function reviewDocumentAnchor(item: ReviewItem) {
  if (!item.recordId) {
    return null;
  }

  if (item.objectType === "skill") {
    return <span>{item.recordId}</span>;
  }

  return <a href={recordHref(item.recordId)}>{item.recordId}</a>;
}

function HealthChecks({ checks }: { checks: HealthCheck[] }) {
  return (
    <div className="health-check-grid">
      {checks.map((check) => (
        <div className={`health-check ${check.status}`} key={check.id}>
          <strong>{check.label}</strong>
          <span>{check.status === "pass" ? "Pass" : formatPackType(check.status)}</span>
          <em>{check.count}</em>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return <span className={`status-pill ${value}`}>{formatPackType(value)}</span>;
}

function ProfileList({ profiles }: { profiles: ExportProfileSummary[] }) {
  return (
    <div className="profile-grid">
      {profiles.map((profile) => (
        <article className="profile-card" key={profile.id}>
          <strong>{profile.name}</strong>
          <span>{formatPackType(profile.target)} / {profile.format}</span>
          <em>{profile.privacyMode ?? "redacted"}</em>
        </article>
      ))}
    </div>
  );
}

function PackCover({ pack, variant }: { pack: PackSummary; variant: "large" | "thumb" | "mini" }) {
  const cover = createCoverVisual(pack);
  const Icon = coverIconMap[cover.icon];

  return (
    <div className={`pack-cover pack-cover-${variant}`} style={{ "--accent": cover.accentColor } as CSSProperties}>
      {cover.coverImage ? (
        <img src={cover.coverImage} alt="" />
      ) : (
        <>
          <Icon size={variant === "mini" ? 18 : variant === "thumb" ? 30 : 52} aria-hidden="true" />
          <span>{cover.initials}</span>
        </>
      )}
    </div>
  );
}

function SkillCover({ skill, variant }: { skill: SkillSummary; variant: "large" | "thumb" | "mini" }) {
  const cover = createSkillCoverVisual(skill);
  const Icon = coverIconMap[cover.icon];

  return (
    <div className={`pack-cover pack-cover-${variant}`} style={{ "--accent": cover.accentColor } as CSSProperties}>
      {cover.coverImage ? (
        <img src={cover.coverImage} alt="" />
      ) : (
        <>
          <Icon size={variant === "mini" ? 18 : variant === "thumb" ? 30 : 52} aria-hidden="true" />
          <span>{cover.initials}</span>
        </>
      )}
    </div>
  );
}

function AgentKitCover({ agentKit, variant }: { agentKit: AgentKitSummary; variant: "large" | "thumb" | "mini" }) {
  const cover = createAgentKitCoverVisual(agentKit);

  return (
    <div className={`pack-cover pack-cover-${variant}`} style={{ "--accent": cover.accentColor } as CSSProperties}>
      {cover.coverImage ? (
        <img src={cover.coverImage} alt="" />
      ) : (
        <>
          <Sparkles size={variant === "mini" ? 18 : variant === "thumb" ? 30 : 52} aria-hidden="true" />
          <span>{cover.initials}</span>
        </>
      )}
    </div>
  );
}

function HealthBadge({ pack }: { pack: PackSummary }) {
  return (
    <span className={`health-badge ${pack.healthStatus}`}>
      <HeartPulse size={14} aria-hidden="true" />
      {pack.healthScore}%
    </span>
  );
}

function SkillHealthBadge({ skill }: { skill: SkillSummary }) {
  return (
    <span className={`health-badge ${skill.healthStatus}`}>
      <HeartPulse size={14} aria-hidden="true" />
      {skill.healthScore}%
    </span>
  );
}

function AgentKitHealthBadge({ agentKit }: { agentKit: AgentKitSummary }) {
  return (
    <span className={`health-badge ${agentKit.healthStatus}`}>
      <HeartPulse size={14} aria-hidden="true" />
      {agentKit.healthScore}%
    </span>
  );
}

function TrustBadge({ pack }: { pack: PackSummary }) {
  return (
    <span className="trust-badge">
      <ShieldCheck size={14} aria-hidden="true" />
      {formatPackType(pack.trustLevel)}
    </span>
  );
}

function SkillTrustBadge({ skill }: { skill: SkillSummary }) {
  return (
    <span className="trust-badge">
      <ShieldCheck size={14} aria-hidden="true" />
      {formatPackType(skill.trustLevel)}
    </span>
  );
}

function AgentKitTrustBadge({ agentKit }: { agentKit: AgentKitSummary }) {
  return (
    <span className="trust-badge">
      <ShieldCheck size={14} aria-hidden="true" />
      {formatPackType(agentKit.trustLevel)}
    </span>
  );
}

function TagList({ values }: { values: string[] }) {
  return (
    <div className="tag-list">
      {values.map((value, index) => (
        <span className="tag-chip" key={`${value}-${index}`}>
          <Tags size={13} aria-hidden="true" />
          {formatPackType(value)}
        </span>
      ))}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="back-link" href={href}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}

function LoadingLibrary({ viewMode }: { viewMode: LibraryViewMode }) {
  const count = viewMode === "table" ? 8 : 6;

  return (
    <div className={`skeleton-wrap ${viewMode}`}>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <span />
          <strong />
          <em />
        </div>
      ))}
    </div>
  );
}

function DetailLoading() {
  return (
    <section className="detail-page">
      <div className="skeleton-card detail-skeleton" />
      <div className="skeleton-card detail-skeleton" />
    </section>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <StateCard title={title} detail={detail} icon={SlidersHorizontal} />;
}

function ErrorState({ authError, onRetry }: { authError: boolean; onRetry(): void }) {
  return (
    <div className="state-card error-card">
      <ShieldCheck size={24} aria-hidden="true" />
      <h2>{authError ? "API token required" : "Local API unavailable"}</h2>
      <p>
        {authError
          ? "The local API requires a token from environment configuration."
          : "The web app could not read the local Contextarr API."}
      </p>
      <button className="retry-button" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function StateCard({
  title,
  detail,
  icon: Icon = ShieldAlert
}: {
  title: string;
  detail: string;
  icon?: typeof ShieldAlert;
}) {
  return (
    <div className="state-card">
      <Icon size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

function PlaceholderTab({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="detail-card placeholder-tab">
      <CheckCircle2 size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{detail}</p>
    </article>
  );
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function parsePositiveUiInteger(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not reviewed";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

function currentRoute(): Route {
  return parseHashRoute(typeof window === "undefined" ? "" : window.location.hash);
}
