export const siteMeta = {
  title: "Contextarr | Own your AI context",
  description:
    "Contextarr is a local-first Context Pack system for preparing trusted AI context from files you control. It validates, redacts, exports, and exposes approved Context Packs through read-only MCP.",
  url: "https://contextarr.com",
  ogTitle: "Contextarr",
  ogDescription: "Own your AI context. Validate it locally. Export it anywhere."
};

export const links = {
  github: "https://github.com/contextarr/contextarr",
  demoPacks: "https://github.com/contextarr/contextarr/tree/main/demo-packs",
  packFormat: "https://github.com/contextarr/contextarr/blob/main/docs/pack-format.md",
  docs: "https://github.com/contextarr/contextarr/tree/main/docs",
  quickstart: "https://github.com/contextarr/contextarr/blob/main/docs/quickstart.md",
  docker: "https://github.com/contextarr/contextarr/blob/main/docs/docker.md",
  security: "https://github.com/contextarr/contextarr/blob/main/docs/security.md",
  mcp: "https://github.com/contextarr/contextarr/blob/main/docs/mcp.md",
  cli: "https://github.com/contextarr/contextarr/blob/main/docs/cli-agent-mode.md",
  api: "https://github.com/contextarr/contextarr/blob/main/docs/api.md",
  packAuthoring: "https://github.com/contextarr/contextarr/blob/main/docs/pack-authoring.md",
  exportProfiles: "https://github.com/contextarr/contextarr/blob/main/docs/export-profiles.md",
  contributing: "https://github.com/contextarr/contextarr/blob/main/CONTRIBUTING.md",
  license: "https://github.com/contextarr/contextarr/blob/main/LICENSE",
  verification: "https://github.com/contextarr/contextarr#verification",
  issues: "https://github.com/contextarr/contextarr/issues",
  securityEmail: "security@contextarr.com"
};

export const proofChips = [
  "Source-backed",
  "Structured",
  "Validated",
  "Export-ready",
  "Local-first",
  "Review-first"
];

export const contextPackExamples = [
  "AI Workstation Pack",
  "OpenAI Prompt Engineering Pack",
  "Claude Code Project Pack",
  "Docker Containers Pack",
  "Obsidian Vault Pack"
];

export const audienceRows = [
  "AI power users",
  "Developers",
  "Self-hosters",
  "Homelab operators",
  "Obsidian and Markdown users",
  "Internal KB owners"
];

export const notAProductRows = [
  "Not a chatbot",
  "Not an agent runner",
  "Not a hosted vault",
  "Not a vector DB",
  "Not a marketplace"
];

export const futureDirectionLines = [
  "Native Skills are instruction artifacts.",
  "Imported external Skills may be preserved as untrusted artifacts.",
  "Agent Kits pair Context Packs and Skills for export.",
  "Contextarr prepares and packages. It does not execute."
];

export const installCommands = [
  "git clone https://github.com/contextarr/contextarr",
  "cd contextarr",
  "docker compose up"
];

export const proofComparisonRows = [
  {
    label: "Manual prompt",
    title: "Pasted context drifts",
    text: "Notes get stale, source links disappear, and draft facts can get mixed with trusted project state."
  },
  {
    label: "Contextarr export",
    title: "Reviewed records travel together",
    text: "Approved records render with source metadata, redaction rules, and the right target profile."
  },
  {
    label: "AI handoff",
    title: "The model starts grounded",
    text: "ChatGPT, Claude, Codex, local agents, and read-only MCP receive the same approved context."
  }
];

export const howItWorksCards = [
  {
    title: "Assemble",
    text:
      "Bring local notes, Markdown records, source maps, project state, system details, and rules into structured Context Packs.",
    chips: ["local files", "records", "sources"]
  },
  {
    title: "Review",
    text:
      "Validate schema, source coverage, freshness, redaction rules, review state, and export readiness before trusting context.",
    chips: ["schema", "redaction", "human review"]
  },
  {
    title: "Route",
    text:
      "Send the right approved version through human-readable HTML, exports, CLI, API, Docker, or read-only MCP.",
    chips: ["HTML", "exports", "MCP"]
  }
];

export const runLocallySteps = [
  {
    title: "Run the Docker preview",
    text: "Start the local dashboard against public-safe demo packs. The app binds to localhost by default.",
    command: "docker compose up"
  },
  {
    title: "Inspect demo packs",
    text: "Open the Pack Library to browse records, sources, health, review state, and export profiles.",
    command: "http://127.0.0.1:3210"
  },
  {
    title: "Validate a pack",
    text: "Run deterministic checks before a pack becomes trusted context for exports or MCP.",
    command: "pnpm --filter @contextarr/cli contextarr validate demo-packs/ai-workstation-pack"
  },
  {
    title: "Render HTML",
    text: "Generate human-readable static HTML so approved records can be reviewed outside the app.",
    command: "pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/site-smoke"
  },
  {
    title: "Export a brief",
    text: "Create target-ready AI context with redaction rules, sources, and profile-specific structure.",
    command: "pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile codex"
  },
  {
    title: "Use read-only MCP",
    text: "Expose approved context to clients without granting mutation, shell, network, or agent-runtime behavior.",
    command: "pnpm contextarr-mcp"
  }
];

export const demoPackCards = [
  {
    name: "AI Workstation Pack",
    slug: "ai-workstation-pack",
    category: "Technical system",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Local AI workstation context, tools, models, and operating notes."
  },
  {
    name: "Claude Code Project Pack",
    slug: "claude-code-project-pack",
    category: "AI coding",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Project handoff context for coding agents and implementation briefs."
  },
  {
    name: "Docker Containers Pack",
    slug: "docker-containers-pack",
    category: "Infrastructure",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Container inventory, stack notes, service boundaries, and troubleshooting context."
  },
  {
    name: "Internal Support KB Pack",
    slug: "internal-support-kb-pack",
    category: "Internal KB",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Support knowledge base structure, SOPs, review state, and safe handoff context."
  },
  {
    name: "Obsidian Vault Pack",
    slug: "obsidian-vault-pack",
    category: "Local Markdown",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Markdown vault context for source-backed notes and export-ready records."
  },
  {
    name: "Jellyfin Media Server Pack",
    slug: "jellyfin-media-server-pack",
    category: "Self-hosted media",
    records: 8,
    profiles: 8,
    trust: "Community",
    text: "Media server setup, library notes, maintenance context, and support-ready exports."
  },
  {
    name: "UniFi Network Pack",
    slug: "unifi-network-pack",
    category: "Networking",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Network topology, devices, constraints, and troubleshooting context."
  },
  {
    name: "GitHub Workflow Pack",
    slug: "github-workflow-pack",
    category: "DevOps collaboration",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Repository workflow, PR habits, release gates, and automation notes."
  },
  {
    name: "AWS Infrastructure Pack",
    slug: "aws-infrastructure-pack",
    category: "Cloud infrastructure",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Cloud architecture, account boundaries, operational notes, and AI handoff context."
  },
  {
    name: "Home Assistant Pack",
    slug: "home-assistant-pack",
    category: "Home automation",
    records: 8,
    profiles: 8,
    trust: "Community",
    text: "Smart home systems, automations, device context, and support notes."
  },
  {
    name: "Google Workspace Pack",
    slug: "google-workspace-pack",
    category: "Productivity system",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Workspace administration context, collaboration patterns, and operating notes."
  },
  {
    name: "Tailscale VPN Pack",
    slug: "tailscale-vpn-pack",
    category: "Networking security",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Tailnet context, remote access notes, policy boundaries, and support exports."
  },
  {
    name: "VS Code Setup Pack",
    slug: "vscode-setup-pack",
    category: "Development environment",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Editor setup, extensions, local workflow, and coding-agent context."
  },
  {
    name: "OpenAI Prompt Engineering Pack",
    slug: "openai-prompt-engineering-pack",
    category: "AI prompting",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Prompting practices, reusable patterns, constraints, and target-specific exports."
  },
  {
    name: "Product Line Pack",
    slug: "fake-product-line-pack",
    category: "Fictional product reference",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Public-safe fictional product context for testing KB, support, and handoff workflows."
  }
];

export const useCaseCards = [
  {
    title: "Coding agents",
    text: "Stop rebuilding project context for Codex, Claude Code, Cursor-style tools, and local coding agents."
  },
  {
    title: "Homelab and self-hosted systems",
    text: "Keep system context, Docker stacks, network details, maintenance notes, and troubleshooting context ready."
  },
  {
    title: "Obsidian and Markdown users",
    text: "Turn local notes into source-backed, reviewed, export-ready Context Packs without leaving readable files behind."
  },
  {
    title: "Internal KB owners",
    text: "Prepare support docs, SOPs, product notes, and operating knowledge for safer AI use."
  },
  {
    title: "Consultants and operators",
    text: "Build reusable client, project, and handoff context with redacted exports and visible review state."
  },
  {
    title: "Local AI users",
    text: "Serve approved context through local files, CLI, API, Docker, rendered HTML, and read-only MCP."
  }
];

export const packFormatRows = [
  ["contextarr-pack.json", "manifest and metadata"],
  ["records/", "Markdown records"],
  ["sources/sources.yaml", "source map"],
  ["rules/", "validation, redaction, and freshness rules"],
  ["exports/", "target profiles"],
  ["examples/", "optional fixtures"]
];

export const docsIndexGroups = [
  {
    title: "Start here",
    links: [
      { label: "Quickstart", href: links.quickstart },
      { label: "Docker", href: links.docker },
      { label: "FAQ", href: "/faq" },
      { label: "Public surface contract", href: "https://github.com/contextarr/contextarr/blob/main/docs/public-surface.md" }
    ]
  },
  {
    title: "Build Context Packs",
    links: [
      { label: "Pack format", href: links.packFormat },
      { label: "Pack authoring", href: links.packAuthoring },
      { label: "Export profiles", href: links.exportProfiles },
      { label: "Implementation status", href: "https://github.com/contextarr/contextarr/blob/main/docs/implementation-status.md" }
    ]
  },
  {
    title: "Interfaces",
    links: [
      { label: "CLI agent mode", href: links.cli },
      { label: "API", href: links.api },
      { label: "Read-only MCP", href: links.mcp },
      { label: "Security", href: links.security }
    ]
  },
  {
    title: "Project",
    links: [
      { label: "Roadmap", href: "/roadmap" },
      { label: "Contributing", href: links.contributing },
      { label: "License", href: links.license },
      { label: "GitHub issues", href: links.issues }
    ]
  }
];
