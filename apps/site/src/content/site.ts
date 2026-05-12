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
  launchProof: "https://github.com/contextarr/contextarr/blob/main/docs/launch-proof.md",
  contextPackAnatomy: "https://github.com/contextarr/contextarr/blob/main/docs/context-pack-anatomy.md",
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

export const sevenMinuteSteps = [
  {
    title: "Clone",
    text: "Get the public checkout on your machine.",
    command: "git clone https://github.com/contextarr/contextarr"
  },
  {
    title: "Enter",
    text: "Work from the repo root so demo packs and scripts resolve.",
    command: "cd contextarr"
  },
  {
    title: "Install",
    text: "Install the local workspace packages with the pinned package manager.",
    command: "pnpm install"
  },
  {
    title: "Verify",
    text: "Run the public-surface and demo-pack checks before trusting the demo.",
    command: "pnpm public-surface:verify && pnpm demo:validate"
  },
  {
    title: "Start",
    text: "Launch the local Docker preview against public-safe packs.",
    command: "docker compose up"
  },
  {
    title: "Inspect",
    text: "Open the dashboard, then visit Demo Packs and Proof.",
    command: "http://127.0.0.1:3210"
  },
  {
    title: "Export",
    text: "Generate a Contextarr export or human-readable HTML from a demo pack.",
    command: "pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile codex"
  }
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

export const launchProofReceipts = [
  "15 demo packs with 120 reviewed records and 8 export profiles per pack.",
  "Contextarr export formats include ChatGPT, Claude, Codex, Markdown, JSON records, AGENTS.md, CLAUDE.md, and llms.txt.",
  "human-readable HTML rendering works from local files.",
  "read-only MCP exposes approved context without shell, network, mutation, or agent runtime behavior.",
  "Validation, scanner, screenshots, Docker, site, and release gates exist as repo-local commands."
];

export const contextFitRows = [
  {
    option: "No context",
    fit: "Fast but unreliable",
    outcome: "The AI guesses from the prompt and misses source boundaries."
  },
  {
    option: "Raw notes",
    fit: "Useful but messy",
    outcome: "The AI sees details, but stale notes, drafts, and private material can mix together."
  },
  {
    option: "Contextarr export",
    fit: "Reviewed and portable",
    outcome: "Approved records, source mapping, redaction rules, and the target profile travel together."
  }
];

export const proofDemoSummary = [
  "Start with one question a cold AI cannot answer safely.",
  "Show the raw notes are useful but unstructured.",
  "Run the validated Contextarr export for the matching demo pack.",
  "Compare the answer against source-backed records and trust receipts.",
  "Close on local-only boundaries: no public deploy, no external AI API, no agent execution."
];

export const demoPackCards = [
  {
    name: "AI Workstation Pack",
    slug: "ai-workstation-pack",
    category: "Technical system",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Local AI workstation context, tools, models, and operating notes.",
    demoQuestion: "Which local AI service should I inspect first if inference feels slow?",
    bestExport: "Codex or Claude for troubleshooting briefs; Markdown for human review.",
    proofEval: "Answer should route through stack, capacity, safety, and workflow records before naming a first inspection point."
  },
  {
    name: "Claude Code Project Pack",
    slug: "claude-code-project-pack",
    category: "AI coding",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Project handoff context for coding agents and implementation briefs.",
    demoQuestion: "Write a Codex implementation brief for a scoped UI fix.",
    bestExport: "Claude or Codex for implementation briefs; AGENTS.md for persistent project guidance.",
    proofEval: "Answer should include scope, files, constraints, verification, and no unrelated runtime changes."
  },
  {
    name: "Docker Containers Pack",
    slug: "docker-containers-pack",
    category: "Infrastructure",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Container inventory, stack notes, service boundaries, and troubleshooting context.",
    demoQuestion: "Why can one app reach the proxy but not the database?",
    bestExport: "Codex or Claude for troubleshooting; Markdown for operator review.",
    proofEval: "Answer should distinguish proxy, network, environment, secret, and volume boundaries."
  },
  {
    name: "Internal Support KB Pack",
    slug: "internal-support-kb-pack",
    category: "Internal KB",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Support knowledge base structure, SOPs, review state, and safe handoff context.",
    demoQuestion: "How should a tier-two escalation be routed?",
    bestExport: "Codex or Markdown for support drafting; JSON records for metadata validation.",
    proofEval: "Answer should separate safe response wording from escalation policy and review ownership."
  },
  {
    name: "Obsidian Vault Pack",
    slug: "obsidian-vault-pack",
    category: "Local Markdown",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Markdown vault context for source-backed notes and export-ready records.",
    demoQuestion: "Which notes should be excluded before export?",
    bestExport: "Markdown for human-readable AI briefs; JSON records for metadata-aware review.",
    proofEval: "Answer should cite frontmatter, export rules, source state, and safer reviewed-record alternatives."
  },
  {
    name: "Jellyfin Media Server Pack",
    slug: "jellyfin-media-server-pack",
    category: "Self-hosted media",
    records: 8,
    profiles: 8,
    trust: "Community",
    text: "Media server setup, library notes, maintenance context, and support-ready exports.",
    demoQuestion: "What should be checked before changing transcoding settings?",
    bestExport: "Markdown or Codex for operational review; JSON records for boundary validation.",
    proofEval: "Answer should cover hardware capability, client behavior, storage, and rollback notes."
  },
  {
    name: "UniFi Network Pack",
    slug: "unifi-network-pack",
    category: "Networking",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Network topology, devices, constraints, and troubleshooting context.",
    demoQuestion: "Does the VLAN intent allow this traffic class?",
    bestExport: "Codex or Markdown for policy review; JSON records for local validation.",
    proofEval: "Answer should compare VLAN intent, firewall notes, SSID policy, and maintenance cadence."
  },
  {
    name: "GitHub Workflow Pack",
    slug: "github-workflow-pack",
    category: "DevOps collaboration",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Repository workflow, PR habits, release gates, and automation notes.",
    demoQuestion: "Is this PR ready to release, or only ready to review?",
    bestExport: "Codex for coding-agent workflow; Markdown for maintainer release review.",
    proofEval: "Answer should separate review readiness from release readiness and list missing receipts."
  },
  {
    name: "AWS Infrastructure Pack",
    slug: "aws-infrastructure-pack",
    category: "Cloud infrastructure",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Cloud architecture, account boundaries, operational notes, and AI handoff context.",
    demoQuestion: "What is the safe review path before changing backup or cost policy?",
    bestExport: "Codex or Claude for infrastructure review; Markdown for public-safe summary.",
    proofEval: "Answer should start with backup, cost, IAM, and environment policy before any change path."
  },
  {
    name: "Home Assistant Pack",
    slug: "home-assistant-pack",
    category: "Home automation",
    records: 8,
    profiles: 8,
    trust: "Community",
    text: "Smart home systems, automations, device context, and support notes.",
    demoQuestion: "Which automation class needs human review before changing?",
    bestExport: "ChatGPT or Markdown for automation review; JSON records for validation.",
    proofEval: "Answer should classify automations by risk, device group, schedule, and manual approval need."
  },
  {
    name: "Google Workspace Pack",
    slug: "google-workspace-pack",
    category: "Productivity system",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Workspace administration context, collaboration patterns, and operating notes.",
    demoQuestion: "What can be shared with an external collaborator safely?",
    bestExport: "llms.txt or Markdown for sharing guidance; JSON records for source mapping.",
    proofEval: "Answer should use access rules, shared-drive policy, retention notes, and review state."
  },
  {
    name: "Tailscale VPN Pack",
    slug: "tailscale-vpn-pack",
    category: "Networking security",
    records: 8,
    profiles: 8,
    trust: "Verified",
    text: "Tailnet context, remote access notes, policy boundaries, and support exports.",
    demoQuestion: "Which stale-device or subnet-route fact needs review?",
    bestExport: "Claude or Codex for policy review; Markdown for public-safe route summary.",
    proofEval: "Answer should flag stale devices, subnet route intent, sharing rules, and review cadence."
  },
  {
    name: "VS Code Setup Pack",
    slug: "vscode-setup-pack",
    category: "Development environment",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Editor setup, extensions, local workflow, and coding-agent context.",
    demoQuestion: "Which extension/debug setup is relevant for a coding-agent task?",
    bestExport: "Codex or AGENTS.md for coding-agent setup; Markdown for human overview.",
    proofEval: "Answer should map task type to extensions, debug habits, workspace rules, and avoided assumptions."
  },
  {
    name: "OpenAI Prompt Engineering Pack",
    slug: "openai-prompt-engineering-pack",
    category: "AI prompting",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Prompting practices, reusable patterns, constraints, and target-specific exports.",
    demoQuestion: "How should a prompt template be reviewed before reuse?",
    bestExport: "ChatGPT or Codex for prompt-review briefs; Markdown for lifecycle summaries.",
    proofEval: "Answer should cover purpose, data boundary, rubric fit, model policy, and retirement notes."
  },
  {
    name: "Product Line Pack",
    slug: "fake-product-line-pack",
    category: "Fictional product reference",
    records: 8,
    profiles: 8,
    trust: "Curated",
    text: "Public-safe fictional product context for testing KB, support, and handoff workflows.",
    demoQuestion: "Which fictional buyer segment fits the product best and what should support avoid promising?",
    bestExport: "ChatGPT or Claude for buyer-fit demos; JSON records for product-boundary checks.",
    proofEval: "Answer should cite buyer guide, model comparison, compatibility, FAQ, and support matrix boundaries."
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
