import {
  Activity,
  ArrowDownUp,
  Bell,
  BookOpen,
  Box,
  Boxes,
  CircleHelp,
  CloudDownload,
  Code2,
  Database,
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
  Search,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
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
import type { HealthResponse, LibraryViewMode, PackSummary, SearchResult, SortKey } from "./types";

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

export function App() {
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
        <section className="library-panel" aria-labelledby="library-title">
          <LibraryHeader
            packCount={packs.length}
            viewMode={viewMode}
            sortBy={sortBy}
            typeFilter={typeFilter}
            trustFilter={trustFilter}
            healthFilter={healthFilter}
            filterOptions={filterOptions}
            onViewModeChange={handleViewModeChange}
            onSortChange={setSortBy}
            onTypeFilterChange={setTypeFilter}
            onTrustFilterChange={setTrustFilter}
            onHealthFilterChange={setHealthFilter}
          />

          {error ? (
            <ErrorState authError={authError} onRetry={loadDashboard} />
          ) : loading ? (
            <LoadingLibrary viewMode={viewMode} />
          ) : packs.length === 0 ? (
            <EmptyState title="No packs indexed" detail="The local API returned an empty pack library." />
          ) : visiblePacks.length === 0 ? (
            <EmptyState title="No packs match" detail="Search and filters did not match the indexed pack library." />
          ) : (
            <LibraryViews packs={visiblePacks} viewMode={viewMode} />
          )}
        </section>
      </main>
    </div>
  );
}

function Sidebar({ health }: { health: HealthResponse | null }) {
  return (
    <aside className="sidebar" aria-label="Contextarr navigation">
      <div className="brand">
        <div className="brand-mark">
          <Boxes size={24} aria-hidden="true" />
        </div>
        <span>Contextarr</span>
      </div>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) => (
          <button
            className={`nav-item${item.active ? " is-active" : ""}`}
            type="button"
            disabled={!item.active}
            key={item.label}
          >
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
            {item.label === "Review Queue" ? <span className="nav-count">0</span> : null}
          </button>
        ))}
      </nav>

      <div className="system-card">
        <div className="system-heading">
          <HeartPulse size={17} aria-hidden="true" />
          <span>{health?.status === "ok" ? "System Healthy" : "System Pending"}</span>
        </div>
        <p>{health ? `${health.counts.packs} packs / ${health.counts.records} records` : "Local API status loading"}</p>
        <div className="system-meta">
          <span>v0.4.0</span>
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
          <PackCover pack={pack} variant="large" />
          <div className="cover-card-body">
            <h2>{pack.name}</h2>
            <span className="pack-type">{formatPackType(pack.type)}</span>
            <div className="badge-row">
              <HealthBadge pack={pack} />
              <TrustBadge pack={pack} />
            </div>
            <div className="card-footer">
              <span>{formatDate(pack.lastReviewedAt)}</span>
              <MoreVertical size={17} aria-hidden="true" />
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
          <PackCover pack={pack} variant="thumb" />
          <div className="compact-main">
            <h2>{pack.name}</h2>
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
          <button className="ghost-action" type="button" disabled>
            <MoreVertical size={17} aria-hidden="true" />
          </button>
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {packs.map((pack) => (
            <tr key={pack.id}>
              <td>
                <div className="table-pack">
                  <PackCover pack={pack} variant="mini" />
                  <div>
                    <strong>{pack.name}</strong>
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
                <button className="ghost-action" type="button" disabled>
                  <MoreVertical size={17} aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="state-card">
      <SlidersHorizontal size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
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
