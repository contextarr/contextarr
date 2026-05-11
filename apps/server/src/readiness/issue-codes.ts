export const readinessIssueCodes = {
  sourceCoverageIncomplete: "source.coverage_incomplete",
  sourceWarnings: "source.warnings",
  reviewItem: "review.item",
  governanceMissing: "governance.missing",
  redactionWarnings: "redaction.warnings",
  exportPackBlocked: "export.pack_blocked",
  exportNoProfiles: "export.no_profiles",
  exportNoEligibleProfiles: "export.no_eligible_profiles",
  exportProfileBlocked: "export.profile_blocked",
  exportProfileWarnings: "export.profile_warnings",
  exportNoEligibleRecords: "export.no_eligible_records",
  exportRecordIneligible: "export.record_ineligible",
  mcpPackBlocked: "mcp.pack_blocked",
  mcpNoEligibleRecords: "mcp.no_eligible_records",
  mcpRecordIneligible: "mcp.record_ineligible",
  mcpRecordWarnings: "mcp.record_warnings"
} as const;
