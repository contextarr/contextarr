export type ReadinessStatus = "ready" | "review_needed" | "blocked";
export type ReadinessDimensionId = "source" | "review" | "governance" | "redaction" | "export" | "mcp";

export interface ReadinessDimensionDefinition {
  id: ReadinessDimensionId;
  label: string;
  weight: number;
}

export const readinessDimensionDefinitions: ReadonlyArray<ReadinessDimensionDefinition> = [
  { id: "source", label: "Source", weight: 20 },
  { id: "review", label: "Review", weight: 20 },
  { id: "governance", label: "Governance", weight: 10 },
  { id: "redaction", label: "Redaction", weight: 15 },
  { id: "export", label: "Export", weight: 20 },
  { id: "mcp", label: "MCP", weight: 15 }
];

export function statusForIssueSeverities(severities: Array<"blocker" | "warning">): ReadinessStatus {
  if (severities.includes("blocker")) {
    return "blocked";
  }

  return severities.includes("warning") ? "review_needed" : "ready";
}
