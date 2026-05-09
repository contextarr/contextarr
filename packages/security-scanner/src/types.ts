export const SECURITY_SCANNER_REPORT_SCHEMA_VERSION = "contextarr.security-scanner-report.v1";

export type SecurityScannerArtifactType =
  | "context_pack"
  | "skill"
  | "agent_kit"
  | "export_profile"
  | "validation_rule_set"
  | "redaction_rule_set"
  | "template"
  | "demo_pack"
  | "registry_policy"
  | "unknown";

export type SecurityScannerStatus =
  | "policy_clean"
  | "policy_warning"
  | "critical_findings"
  | "blocked"
  | "scanning_failed";

export type SecurityFindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type SecurityFindingCategory =
  | "secret"
  | "credential_request"
  | "shell_command"
  | "executable_file"
  | "script_file"
  | "prompt_injection"
  | "hidden_instruction"
  | "network_instruction"
  | "remote_instruction_loading"
  | "obfuscation"
  | "unicode_invisible_text"
  | "source_license"
  | "stale_source"
  | "dependency"
  | "unsafe_claim"
  | "agent_kit_pairing"
  | "review_status"
  | "manifest_policy"
  | "redaction"
  | "unknown";

export type SecurityRecommendedAction = "activate" | "quarantine" | "review" | "block";

export interface SecurityScannerSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  secretHits: number;
  shellCommandHits: number;
  promptInjectionHits: number;
  hiddenInstructionHits: number;
  networkInstructionHits: number;
  executableFileHits: number;
  licenseWarnings: number;
  sourceWarnings: number;
}

export interface SecurityScannerFinding {
  id: string;
  code: string;
  severity: SecurityFindingSeverity;
  category: SecurityFindingCategory;
  file: string;
  path: string;
  line?: number;
  message: string;
  evidenceSnippet?: string;
  recommendedAction: SecurityRecommendedAction;
  blocking: boolean;
  ruleId: string;
  confidence: number;
}

export interface SecurityScannerReportV1 {
  schemaVersion: typeof SECURITY_SCANNER_REPORT_SCHEMA_VERSION;
  artifactId: string;
  artifactType: SecurityScannerArtifactType;
  artifactVersion: string;
  scannerVersion: string;
  status: SecurityScannerStatus;
  summary: SecurityScannerSummary;
  findings: SecurityScannerFinding[];
  limitations: string[];
  recommendedAction: SecurityRecommendedAction;
}
