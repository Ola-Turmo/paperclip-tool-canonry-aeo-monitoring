/**
 * Canonry AEO Monitoring - Core Types
 * 
 * Defines the types for benchmark queries, evidence capture,
 * regression detection, and remediation verification.
 */

// Engine types for AEO monitoring
export type AeoEngine = 
  | "google-search" 
  | "ai-overviews" 
  | "chatgpt" 
  | "claude" 
  | "perplexity" 
  | "gemini"
  | "site-search";

export type CitationPresence = "present" | "absent" | "partial" | "unknown";
export type CaptureStatus = "complete" | "incomplete" | "policy-sensitive" | "unavailable";

// Benchmark query definition
export interface BenchmarkQuery {
  id: string;
  query: string;
  engines: AeoEngine[];
  owner?: string;
  cadence?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Captured evidence from a benchmark run
export interface BenchmarkEvidence {
  queryId: string;
  engine: AeoEngine;
  capturedAt: string;
  responseText?: string;
  citationPresence: CitationPresence;
  citationSources?: string[];
  visibilityScore?: number; // 0-100
  captureStatus: CaptureStatus;
  captureNote?: string; // For incomplete or policy-sensitive captures
  rawResponse?: unknown; // Preserved raw response for review
}

// Individual query result within a benchmark run
export interface QueryResult {
  queryId: string;
  query: string;
  engine: AeoEngine;
  priorEvidence?: BenchmarkEvidence; // From previous run
  currentEvidence: BenchmarkEvidence;
  regressionStatus: RegressionStatus;
  regressionDetails?: RegressionDetails;
}

// Regression classification
export type RegressionStatus = 
  | "improved" 
  | "stable" 
  | "minor-regression" 
  | "material-regression"
  | "unknown";

// Detailed regression analysis
export interface RegressionDetails {
  changedFields: string[];
  regressionMagnitude: number; // Negative = improvement, positive = regression
  noiseLevel: "low" | "medium" | "high"; // Based on historical variance
  recommendation?: string;
}

// A complete benchmark run
export interface BenchmarkRun {
  id: string;
  name: string;
  description?: string;
  queryIds: string[];
  executedAt: string;
  status: "running" | "completed" | "partial" | "failed";
  results: QueryResult[];
  summary: BenchmarkSummary;
  remediationRef?: string; // Links to a remediation run
}

// Summary of a benchmark run
export interface BenchmarkSummary {
  totalQueries: number;
  totalEngines: number;
  captureCompleteness: number; // 0-100 percentage
  regressionCounts: {
    improved: number;
    stable: number;
    minorRegression: number;
    materialRegression: number;
    unknown: number;
  };
  materialRegressions: QueryResult[]; // Only those with material regression
  incompleteCaptures: BenchmarkEvidence[]; // Evidence with incomplete/policy-sensitive status
}

// Remediation tracking
export interface Remediation {
  id: string;
  benchmarkRunId: string; // The run that identified the regression
  queryId: string;
  engine: AeoEngine;
  description: string;
  proposedChanges: string[];
  createdAt: string;
  status: "proposed" | "applied" | "verified" | "abandoned";
  verificationRunId?: string; // Links to the rerun that verified
}

// Rerun comparison result
export interface RerunComparison {
  priorRunId: string;
  postRemediationRunId: string;
  remediationId: string;
  queryId: string;
  engine: AeoEngine;
  priorResult: QueryResult;
  postResult: QueryResult;
  outcomeChanged: boolean;
  outcomeStatus: "improved" | "stable" | "regressed" | "indeterminate";
  evidence: RerunEvidence;
}

// Evidence for a rerun comparison
export interface RerunEvidence {
  priorCapture: BenchmarkEvidence;
  postCapture: BenchmarkEvidence;
  changes: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
  conclusion: string;
}

// Incomplete capture record for audit
export interface IncompleteCaptureRecord {
  queryId: string;
  engine: AeoEngine;
  attemptedAt: string;
  reason: CaptureStatus;
  context: string;
  alternativeEvidence?: string; // E.g., "manual review required"
}

// Evidence store operations
export interface EvidenceStore {
  saveRun(run: BenchmarkRun): Promise<void>;
  getRun(runId: string): Promise<BenchmarkRun | null>;
  getPriorRun(queryId: string, engine: AeoEngine, beforeRunId?: string): Promise<BenchmarkEvidence | null>;
  listRuns(limit?: number): Promise<BenchmarkRun[]>;
  saveRemediation(remediation: Remediation): Promise<void>;
  getRemediation(id: string): Promise<Remediation | null>;
  listRemediations(queryId?: string, status?: Remediation["status"]): Promise<Remediation[]>;
  saveIncompleteCapture(record: IncompleteCaptureRecord): Promise<void>;
  listIncompleteCaptures(runId?: string): Promise<IncompleteCaptureRecord[]>;
}

// Benchmark execution options
export interface BenchmarkOptions {
  queryIds?: string[]; // Filter to specific queries, all if empty
  engines?: AeoEngine[]; // Filter to specific engines, all if empty
  compareToRunId?: string; // Prior run to compare against
  skipRemediationCheck?: boolean; // Skip remediation verification
}

// Benchmark execution result
export interface BenchmarkExecutionResult {
  run: BenchmarkRun;
  options: BenchmarkOptions;
  executedAt: string;
  executionMs: number;
  incompleteCaptures: IncompleteCaptureRecord[];
  error?: string;
}

// Action/Query API types
export interface RunBenchmarkParams {
  options?: BenchmarkOptions;
}

export interface GetBenchmarkRunParams {
  runId: string;
}

export interface GetRerunComparisonParams {
  priorRunId: string;
  postRemediationRunId: string;
  remediationId: string;
}

export interface ListRemediationsParams {
  queryId?: string;
  status?: Remediation["status"];
}
