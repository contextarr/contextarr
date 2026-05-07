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
  Database,
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
  createCoverVisual,
  filterAndSortPacks,
  formatPackType,
  getFilterOptions,
  getInitialLibraryView,
  persistLibraryView
} from "./library";
import { renderRecordBodyHtml } from "./record-rendering";
import { packHref, parseHashRoute, recordHref } from "./routes";
import type {
  ExportProfileSummary,
  HealthResponse,
  LibraryViewMode,
  PackDetail,
  PackSummary,
  RecordDetail,
  RecordSummary,
  Route,
  SearchResult,
  SortKey,
  SourceSummary
} from "./types";

const navItems = [
  { label: "Library", icon: Library, active: true },
  { label: "Packs", icon: Boxes },
  { label: "Collectors", icon: Layers3 },
  { label: "Sources", icon: Database },
  { label: "Review Queue", icon: ShieldCheck },
  { label: "Composer", icon: PenLine },
  { label: "Exports", icon: CloudDownload },
  { label: "Registry", icon: Package },
  { label: "Health", icon: HeartPulse },
  { label: "Settings", icon: Settings }
];

const coverIconMap = {
  book: BookOpen,
  box: Box,
  code: Code2,
  database: Database,
  monitor: Monitor,
  package: Package,
  server: Server
};

const detailTabs = ["overview", "records", "sources", "exports", "health", "activity", "changelog"] as const;
type DetailTab = (typeof detailTabs)[number];

export function App() {
  const [route, setRoute] = useState<Route>(() => currentRoute());
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() => getInitialLibraryView());
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [typeFilter, setTypeFilter] = useState("all");
  const [trustFilter, setTrustFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

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
          type: typeFilter,
          trustLevel: trustFilter,
          healthStatus: healthFilter,
          sortBy
        },
        searchResults
      ),
    [debouncedQuery, healthFilter, packs, searchResults, sortBy, trustFilter, typeFilter]
  );

  function handleViewModeChange(mode: LibraryViewMode) {
    setViewMode(mode);
    persistLibraryView(mode);
  }

  return (
    <div className="app-shell">
      <Sidebar health={health} />
      <main className="workspace">
        <TopBar query={query} searching={searching} onQueryChange={setQuery} />
        {route.name === "pack" ? (
          <PackDetailPage packId={route.packId} packs={packs} />
        ) : route.name === "record" ? (
          <RecordDetailPage recordId={route.recordId} packs={packs} />
        ) : (
          <LibraryPage
            packs={packs}
            visiblePacks={visiblePacks}
            loading={loading}
            error={error}
            authError={authError}
            viewMode={viewMode}
            sortBy={sortBy}
            typeFilter={typeFilter}
            trustFilter={trustFilter}
            healthFilter={healthFilter}
            filterOptions={filterOptions}
            onRetry={loadDashboard}
            onViewModeChange={handleViewModeChange}
            onSortChange={setSortBy}
            onTypeFilterChange={setTypeFilter}
            onTrustFilterChange={setTrustFilter}
            onHealthFilterChange={setHealthFilter}
          />
        )}
      </main>
    </div>
  );
}

function Sidebar({ health }: { health: HealthResponse | null }) {
  return (
    <aside className="sidebar" aria-label="Contextarr navigation">
      <a className="brand" href="#/library">
        <div className="brand-mark">
          <Boxes size={24} aria-hidden="true" />
        </div>
        <span>Contextarr</span>
      </a>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) =>
          item.active ? (
            <a className="nav-item is-active" href="#/library" key={item.label}>
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          ) : (
            <button className="nav-item" type="button" disabled key={item.label}>
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === "Review Queue" ? <span className="nav-count">0</span> : null}
            </button>
          )
        )}
      </nav>

      <div className="system-card">
        <div className="system-heading">
          <HeartPulse size={17} aria-hidden="true" />
          <span>{health?.status === "ok" ? "System Healthy" : "System Pending"}</span>
        </div>
        <p>{health ? `${health.counts.packs} packs / ${health.counts.records} records` : "Local API status loading"}</p>
        <div className="system-meta">
          <span>v0.5.0</span>
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
          placeholder="Search packs, tags, authors, descriptions..."
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <span className="search-status">{searching ? "..." : "/"}</span>
      </label>

      <div className="topbar-actions" aria-label="Inactive shell actions">
        {[Activity, Import, Bell, CircleHelp, UserRound].map((Icon, index) => (
          <button className="icon-button" type="button" disabled key={index}>
            <Icon size={19} aria-hidden="true" />
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
  typeFilter: string;
  trustFilter: string;
  healthFilter: string;
  filterOptions: ReturnType<typeof getFilterOptions>;
  onRetry(): void;
  onViewModeChange(mode: LibraryViewMode): void;
  onSortChange(sort: SortKey): void;
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
        typeFilter={props.typeFilter}
        trustFilter={props.trustFilter}
        healthFilter={props.healthFilter}
        filterOptions={props.filterOptions}
        onViewModeChange={props.onViewModeChange}
        onSortChange={props.onSortChange}
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
  typeFilter: string;
  trustFilter: string;
  healthFilter: string;
  filterOptions: ReturnType<typeof getFilterOptions>;
  onViewModeChange(mode: LibraryViewMode): void;
  onSortChange(sort: SortKey): void;
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
        <article className="cover-card" key={pack.id}>
          <a href={packHref(pack.id)} aria-label={`Open ${pack.name}`}>
            <PackCover pack={pack} variant="large" />
          </a>
          <div className="cover-card-body">
            <h2>
              <a className="pack-title-link" href={packHref(pack.id)}>
                {pack.name}
              </a>
            </h2>
            <span className="pack-type">{formatPackType(pack.type)}</span>
            <div className="badge-row">
              <HealthBadge pack={pack} />
              <TrustBadge pack={pack} />
            </div>
            <div className="card-footer">
              <span>{formatDate(pack.lastReviewedAt)}</span>
              <ExternalLink size={17} aria-hidden="true" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function CompactCards({ packs }: { packs: PackSummary[] }) {
  return (
    <div className="compact-grid">
      {packs.map((pack) => (
        <article className="compact-card" key={pack.id}>
          <a href={packHref(pack.id)} aria-label={`Open ${pack.name}`}>
            <PackCover pack={pack} variant="thumb" />
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
            <HealthBadge pack={pack} />
            <TrustBadge pack={pack} />
            <span>{pack.sourceCount} sources</span>
            <span>{pack.recordCount} records</span>
            <span>{formatDate(pack.lastReviewedAt)}</span>
          </div>
          <a className="ghost-action open-action" href={packHref(pack.id)} aria-label={`Open ${pack.name}`}>
            <MoreVertical size={17} aria-hidden="true" />
          </a>
        </article>
      ))}
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
          {packs.map((pack) => (
            <tr key={pack.id}>
              <td>
                <div className="table-pack">
                  <PackCover pack={pack} variant="mini" />
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
                <TrustBadge pack={pack} />
              </td>
              <td>
                <HealthBadge pack={pack} />
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PackDetailPage({ packId, packs }: { packId: string; packs: PackSummary[] }) {
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveTab("overview");

    async function loadPackDetail() {
      try {
        const [packResponse, recordsResponse] = await Promise.all([
          apiClient.getPack(packId),
          apiClient.getPackRecords(packId)
        ]);
        if (!cancelled) {
          setPack(packResponse);
          setRecords(recordsResponse);
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

  return (
    <section className="detail-page" aria-labelledby="pack-detail-title">
      <BackLink href="#/library" label="Pack Library" />
      <div className="pack-detail-hero">
        <PackCover pack={pack} variant="large" />
        <div>
          <div className="eyebrow">
            <Package size={16} aria-hidden="true" />
            <span>{formatPackType(pack.type)}</span>
          </div>
          <h1 id="pack-detail-title">{pack.name}</h1>
          <p>{pack.description}</p>
          <div className="hero-badges">
            <HealthBadge pack={pack} />
            <TrustBadge pack={pack} />
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

      {activeTab === "overview" ? <PackOverview pack={pack} records={records} packs={packs} /> : null}
      {activeTab === "records" ? <RecordsTab pack={pack} records={records} /> : null}
      {activeTab === "sources" ? <SourcesTab sources={pack.sources} /> : null}
      {activeTab === "exports" ? <ExportsTab profiles={pack.exportProfiles} /> : null}
      {activeTab === "health" ? <HealthTab pack={pack} /> : null}
      {activeTab === "activity" ? <PlaceholderTab title="Activity" detail="Activity timelines arrive after pack health and review workflows are implemented." /> : null}
      {activeTab === "changelog" ? <PlaceholderTab title="Changelog" detail="Static HTML can render CHANGELOG.md; API-backed changelog content remains a later read endpoint." /> : null}
    </section>
  );
}

function PackOverview({ pack, records, packs }: { pack: PackDetail; records: RecordSummary[]; packs: PackSummary[] }) {
  const related = packs.filter((candidate) => candidate.id !== pack.id && candidate.type === pack.type).slice(0, 3);

  return (
    <div className="detail-grid">
      <article className="detail-card summary-card">
        <h2>
          <FileText size={19} aria-hidden="true" />
          Summary
        </h2>
        <p>{pack.description}</p>
        <TagList values={[pack.type, pack.visibility, pack.trustLevel]} />
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

function ExportsTab({ profiles }: { profiles: ExportProfileSummary[] }) {
  return (
    <article className="detail-card">
      <h2>Export Profiles</h2>
      <ProfileList profiles={profiles} />
      <p className="muted-note">Profiles are displayed as metadata only. Export generation starts in Phase 7.</p>
    </article>
  );
}

function HealthTab({ pack }: { pack: PackDetail }) {
  return (
    <article className="detail-card">
      <h2>Health</h2>
      <div className="stat-grid">
        <Stat value={`${pack.healthScore}%`} label="Score" />
        <Stat value={formatPackType(pack.healthStatus)} label="Status" />
        <Stat value={pack.validation.errors} label="Errors" />
        <Stat value={pack.validation.warnings} label="Warnings" />
      </div>
      <p className="muted-note">Full deterministic health rules and review queue workflows remain Phase 6.</p>
    </article>
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

function HealthBadge({ pack }: { pack: PackSummary }) {
  return (
    <span className={`health-badge ${pack.healthStatus}`}>
      <HeartPulse size={14} aria-hidden="true" />
      {pack.healthScore}%
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

function TagList({ values }: { values: string[] }) {
  return (
    <div className="tag-list">
      {values.map((value) => (
        <span className="tag-chip" key={value}>
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

function formatDate(value: string | null): string {
  if (!value) {
    return "Not reviewed";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function currentRoute(): Route {
  return parseHashRoute(typeof window === "undefined" ? "" : window.location.hash);
}
