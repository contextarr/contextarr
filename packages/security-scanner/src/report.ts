import {
  SECURITY_SCANNER_REPORT_SCHEMA_VERSION,
  type SecurityFindingCategory,
  type SecurityRecommendedAction,
  type SecurityScannerArtifactType,
  type SecurityScannerFinding,
  type SecurityScannerReportV1,
  type SecurityScannerStatus,
  type SecurityScannerSummary
} from "./types";

export function createSecurityScannerReport(options: {
  artifactId: string;
  artifactType: SecurityScannerArtifactType;
  artifactVersion: string;
  scannerVersion: string;
  findings: Omit<SecurityScannerFinding, "id">[];
  limitations: string[];
  status?: SecurityScannerStatus;
  cleanRecommendedAction?: "activate" | "quarantine";
}): SecurityScannerReportV1 {
  const findings = options.findings
    .slice()
    .sort(compareFindingWithoutId)
    .map((finding, index) => ({
      id: `finding-${String(index + 1).padStart(4, "0")}`,
      ...finding
    }));
  const status = options.status ?? deriveStatus(findings);

  return {
    schemaVersion: SECURITY_SCANNER_REPORT_SCHEMA_VERSION,
    artifactId: options.artifactId,
    artifactType: options.artifactType,
    artifactVersion: options.artifactVersion,
    scannerVersion: options.scannerVersion,
    status,
    summary: summarizeFindings(findings),
    findings,
    limitations: options.limitations.slice().sort(),
    recommendedAction: recommendedActionForStatus(status, options.cleanRecommendedAction ?? "activate")
  };
}

export function summarizeFindings(findings: SecurityScannerFinding[]): SecurityScannerSummary {
  return {
    critical: countSeverity(findings, "critical"),
    high: countSeverity(findings, "high"),
    medium: countSeverity(findings, "medium"),
    low: countSeverity(findings, "low"),
    info: countSeverity(findings, "info"),
    secretHits: countCategory(findings, "secret"),
    shellCommandHits: countCategory(findings, "shell_command"),
    promptInjectionHits: countCategory(findings, "prompt_injection"),
    hiddenInstructionHits: countCategory(findings, "hidden_instruction"),
    networkInstructionHits: countCategory(findings, "network_instruction") + countCategory(findings, "remote_instruction_loading"),
    executableFileHits: countCategory(findings, "executable_file") + countCategory(findings, "script_file"),
    licenseWarnings: countCategory(findings, "source_license"),
    sourceWarnings: countCategory(findings, "stale_source")
  };
}

function deriveStatus(findings: SecurityScannerFinding[]): SecurityScannerStatus {
  if (findings.some((finding) => finding.blocking)) {
    return "blocked";
  }
  if (findings.some((finding) => finding.severity === "critical")) {
    return "critical_findings";
  }
  if (findings.some((finding) => finding.severity !== "info")) {
    return "policy_warning";
  }
  return "policy_clean";
}

function recommendedActionForStatus(status: SecurityScannerStatus, cleanRecommendedAction: "activate" | "quarantine"): SecurityRecommendedAction {
  if (status === "blocked" || status === "critical_findings" || status === "scanning_failed") {
    return "block";
  }
  if (status === "policy_warning") {
    return "review";
  }
  return cleanRecommendedAction;
}

function countSeverity(findings: SecurityScannerFinding[], severity: SecurityScannerFinding["severity"]): number {
  return findings.filter((finding) => finding.severity === severity).length;
}

function countCategory(findings: SecurityScannerFinding[], category: SecurityFindingCategory): number {
  return findings.filter((finding) => finding.category === category).length;
}

function compareFindingWithoutId(
  left: Omit<SecurityScannerFinding, "id">,
  right: Omit<SecurityScannerFinding, "id">
): number {
  return (
    left.file.localeCompare(right.file) ||
    (left.line ?? 0) - (right.line ?? 0) ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message)
  );
}
