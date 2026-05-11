import type {
  ReviewCandidateActivationMode,
  ReviewCandidateActivationResult,
  ReviewCandidateSourceKind
} from "@contextarr/review-candidates";
import type { ContextarrDatabase } from "./db";

export interface ReviewCandidateActivationHistoryItem {
  schemaVersion: "contextarr.review-candidate-activation-history.v1";
  id: number;
  proofId: string;
  candidateKey: string;
  packId: string;
  name: string;
  status: "applied";
  mode: ReviewCandidateActivationMode;
  activatedAt: string;
  indexRefreshedAt: string | null;
  source: ReviewCandidateActivationResult["source"];
  target: ReviewCandidateActivationResult["target"];
  validation: ReviewCandidateActivationResult["validation"];
  security: ReviewCandidateActivationResult["security"];
  warnings: ReviewCandidateActivationResult["warnings"];
  effects: ReviewCandidateActivationResult["effects"];
  activation: ReviewCandidateActivationResult;
}

interface ReviewCandidateActivationHistoryRow {
  id: number;
  proof_id: string;
  candidate_key: string;
  pack_id: string;
  name: string;
  source_kind: ReviewCandidateSourceKind;
  source_label: string;
  source_path_label: string;
  target_path_label: string;
  mode: ReviewCandidateActivationMode;
  status: "applied";
  activated_at: string;
  index_refreshed_at: string | null;
  validation_json: string;
  security_json: string;
  warnings_json: string;
  effects_json: string;
  activation_json: string;
}

export function recordReviewCandidateActivation(
  db: ContextarrDatabase,
  activation: ReviewCandidateActivationResult
): ReviewCandidateActivationHistoryItem {
  const result = db
    .prepare(
      `INSERT INTO review_candidate_activations (
        proof_id, candidate_key, pack_id, name, source_kind, source_label,
        source_path_label, target_path_label, mode, status, activated_at,
        index_refreshed_at, validation_json, security_json, warnings_json,
        effects_json, activation_json
      ) VALUES (
        @proofId, @candidateKey, @packId, @name, @sourceKind, @sourceLabel,
        @sourcePathLabel, @targetPathLabel, @mode, 'applied', @activatedAt,
        NULL, @validationJson, @securityJson, @warningsJson,
        @effectsJson, @activationJson
      )`
    )
    .run({
      proofId: activation.proofId,
      candidateKey: activation.candidateKey,
      packId: activation.packId,
      name: activation.name,
      sourceKind: activation.source.kind,
      sourceLabel: activation.source.label,
      sourcePathLabel: activation.source.pathLabel,
      targetPathLabel: activation.target.pathLabel,
      mode: activation.mode,
      activatedAt: activation.activatedAt,
      validationJson: JSON.stringify(activation.validation),
      securityJson: JSON.stringify(activation.security),
      warningsJson: JSON.stringify(activation.warnings),
      effectsJson: JSON.stringify(activation.effects),
      activationJson: JSON.stringify(activation)
    });

  const item = getReviewCandidateActivation(db, Number(result.lastInsertRowid));
  if (!item) {
    throw new Error("Recorded review candidate activation could not be read back.");
  }
  return item;
}

export function markReviewCandidateActivationIndexed(
  db: ContextarrDatabase,
  id: number,
  indexRefreshedAt: string
): ReviewCandidateActivationHistoryItem | null {
  db.prepare("UPDATE review_candidate_activations SET index_refreshed_at = ? WHERE id = ?").run(indexRefreshedAt, id);
  return getReviewCandidateActivation(db, id);
}

export function getReviewCandidateActivation(
  db: ContextarrDatabase,
  id: number
): ReviewCandidateActivationHistoryItem | null {
  const row = db
    .prepare("SELECT * FROM review_candidate_activations WHERE id = ?")
    .get(id) as ReviewCandidateActivationHistoryRow | undefined;
  return row ? mapActivationHistoryRow(row) : null;
}

export function listReviewCandidateActivations(
  db: ContextarrDatabase,
  options: { limit?: number; packId?: string; candidateKey?: string } = {}
): ReviewCandidateActivationHistoryItem[] {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (options.packId) {
    clauses.push("pack_id = ?");
    params.push(options.packId);
  }
  if (options.candidateKey) {
    clauses.push("candidate_key = ?");
    params.push(options.candidateKey);
  }

  const limit = normalizeLimit(options.limit);
  params.push(limit);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM review_candidate_activations
       ${where}
       ORDER BY activated_at DESC, id DESC
       LIMIT ?`
    )
    .all(...params) as ReviewCandidateActivationHistoryRow[];

  return rows.map(mapActivationHistoryRow);
}

function mapActivationHistoryRow(row: ReviewCandidateActivationHistoryRow): ReviewCandidateActivationHistoryItem {
  const activation = parseJson<ReviewCandidateActivationResult>(row.activation_json);
  return {
    schemaVersion: "contextarr.review-candidate-activation-history.v1",
    id: row.id,
    proofId: row.proof_id,
    candidateKey: row.candidate_key,
    packId: row.pack_id,
    name: row.name,
    status: row.status,
    mode: row.mode,
    activatedAt: row.activated_at,
    indexRefreshedAt: row.index_refreshed_at,
    source: activation.source,
    target: activation.target,
    validation: parseJson<ReviewCandidateActivationResult["validation"]>(row.validation_json),
    security: parseJson<ReviewCandidateActivationResult["security"]>(row.security_json),
    warnings: parseJson<ReviewCandidateActivationResult["warnings"]>(row.warnings_json),
    effects: parseJson<ReviewCandidateActivationResult["effects"]>(row.effects_json),
    activation
  };
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function normalizeLimit(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 25;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 100);
}
