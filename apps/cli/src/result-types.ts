export type CliStatus = "success" | "warning" | "blocked" | "failed";

export type CliSeverity = "critical" | "high" | "medium" | "low" | "info";

export type CliOutputMode = "text" | "json";

export const CliExitCode = {
  Success: 0,
  GeneralError: 1,
  ValidationFailed: 2,
  SecurityPolicyBlocked: 3,
  ReviewStatusBlocked: 4,
  NotFound: 5,
  InvalidArguments: 6,
  RedactionOrExportBlocked: 7,
  UnavailableDependency: 8,
  ConfigError: 9,
  UnsupportedTarget: 10,
  QuarantineRequired: 11,
  SignatureOrHashVerificationFailed: 12,
  RevokedArtifact: 13,
  OutputSizeLimitExceeded: 14,
  DatabaseUnavailable: 15
} as const;

export type CliExitCode = (typeof CliExitCode)[keyof typeof CliExitCode];

export interface CliErrorV1 {
  code: string;
  severity: CliSeverity;
  message: string;
  file?: string;
  path?: string;
  hint?: string;
}

export interface CliWarningV1 {
  code: string;
  severity: Exclude<CliSeverity, "critical">;
  message: string;
  file?: string;
  path?: string;
  hint?: string;
}

export interface CliResultV1<TData = unknown> {
  schemaVersion: "contextarr.cli-result.v1";
  command: string;
  status: CliStatus;
  ok: boolean;
  data: TData;
  warnings: CliWarningV1[];
  errors: CliErrorV1[];
  meta: {
    generatedAt?: string;
    contextarrVersion: string;
    workingDirectory?: string;
    redacted: boolean;
  };
}
