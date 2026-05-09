import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const requiredFiles = [
  "docs/audits/v1-core-stabilization-audit.md",
  "docs/contextarr_phase_by_phase_prd_to_v1.md",
  "docs/signing-and-trust-model.md",
  "docs/private-registry-requirements.md",
  "docs/marketplace-non-goals.md"
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing Phase 28 document: ${file}`);
  }
}

if (!failed) {
  const roadmap = read("docs/roadmap.md");
  const audit = read("docs/audits/v1-core-stabilization-audit.md");
  const signing = read("docs/signing-and-trust-model.md");
  const registry = read("docs/private-registry-requirements.md");
  const marketplace = read("docs/marketplace-non-goals.md");
  const packageJson = JSON.parse(read("package.json"));

  const requiredText = [
    [roadmap, "Phase 28: Signing and trust model research. Complete.", "roadmap Phase 28 status"],
    [roadmap, "Phase 29: Private team registry prototype. Frozen behind the v1.0 core-stabilization gate.", "roadmap Phase 29 freeze"],
    [audit, "Phase 29 is not started. Registry behavior remains blocked.", "audit Phase 29 boundary"],
    [audit, "Context Packs reach v1.0 first.", "audit v1 bridge gate"],
    [signing, "Phase 28 must not add signing code", "signing implementation boundary"],
    [registry, "Phase 29 must not begin just because this document exists.", "registry implementation boundary"],
    [marketplace, "Contextarr is not a marketplace.", "marketplace non-goal"]
  ];

  for (const [content, text, label] of requiredText) {
    if (!content.includes(text)) {
      fail(`Missing ${label}: ${text}`);
    }
  }

  if (packageJson.scripts["phase29:verify"]) {
    fail("Phase 29 verifier must not exist while registry behavior is frozen.");
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr Phase 28 docs verified.");
}
