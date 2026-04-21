/**
 * Canonry AEO Monitoring - Benchmark Engine
 *
 * Handles benchmark execution, evidence capture, and regression detection.
 * This plugin must never fabricate benchmark queries or evidence.
 */

import { randomUUID } from "crypto";
import type {
  BenchmarkQuery,
  BenchmarkEvidence,
  QueryResult,
  BenchmarkRun,
  BenchmarkSummary,
  RegressionStatus,
  RegressionDetails,
  AeoEngine,
  CaptureStatus,
  CitationPresence,
  BenchmarkOptions,
  BenchmarkExecutionResult,
  IncompleteCaptureRecord,
  Remediation,
  RerunComparison,
  RerunEvidence,
} from "./types.js";
import { evidenceStore } from "./evidence-store.js";

const CONFIGURATION_REQUIRED_MESSAGE =
  "Canonry benchmark execution is not configured. Add real benchmark queries and a real engine capture path before running benchmarks.";

// Detect regression between prior and current evidence
function detectRegression(
  prior: BenchmarkEvidence | undefined,
  current: BenchmarkEvidence
): { status: RegressionStatus; details?: RegressionDetails } {
  if (!prior) {
    return { status: "unknown" };
  }

  const changedFields: string[] = [];
  let regressionMagnitude = 0;

  // Check citation presence
  if (prior.citationPresence !== current.citationPresence) {
    changedFields.push("citationPresence");
  }

  // Check visibility score
  if (prior.visibilityScore !== undefined && current.visibilityScore !== undefined) {
    const scoreDiff = current.visibilityScore - prior.visibilityScore;
    if (Math.abs(scoreDiff) > 5) {
      changedFields.push("visibilityScore");
      regressionMagnitude += scoreDiff;
    }
  }

  // Check capture status
  if (prior.captureStatus !== current.captureStatus) {
    changedFields.push("captureStatus");
  }

  // Classify regression
  let status: RegressionStatus = "stable";
  let noiseLevel: "low" | "medium" | "high" = "low";

  if (regressionMagnitude > 15) {
    status = "material-regression";
    noiseLevel = "low";
  } else if (regressionMagnitude > 5) {
    status = "minor-regression";
    noiseLevel = "medium";
  } else if (regressionMagnitude < -5) {
    status = "improved";
  }

  // Generate recommendation for regressions
  let recommendation: string | undefined;
  if (status === "material-regression") {
    recommendation = `Material visibility regression detected (${Math.abs(Math.round(regressionMagnitude))} points). Review content changes and engine algorithm updates.`;
  } else if (status === "minor-regression") {
    recommendation = `Minor regression detected. Monitor for continued degradation.`;
  }

  const details: RegressionDetails | undefined = changedFields.length > 0
    ? { changedFields, regressionMagnitude, noiseLevel, recommendation }
    : undefined;

  return { status, details };
}

// Calculate benchmark summary
function calculateSummary(run: BenchmarkRun): BenchmarkSummary {
  const regressionCounts = {
    improved: 0,
    stable: 0,
    minorRegression: 0,
    materialRegression: 0,
    unknown: 0,
  };

  const materialRegressions: QueryResult[] = [];
  const incompleteCaptures: BenchmarkEvidence[] = [];

  for (const result of run.results) {
    switch (result.regressionStatus) {
      case "improved":
        regressionCounts.improved++;
        break;
      case "stable":
        regressionCounts.stable++;
        break;
      case "minor-regression":
        regressionCounts.minorRegression++;
        break;
      case "material-regression":
        regressionCounts.materialRegression++;
        materialRegressions.push(result);
        break;
      default:
        regressionCounts.unknown++;
    }

    if (result.currentEvidence.captureStatus !== "complete") {
      incompleteCaptures.push(result.currentEvidence);
    }
  }

  const totalQueries = run.results.length;
  const incompleteCount = incompleteCaptures.length;
  const captureCompleteness = totalQueries > 0
    ? Math.round(((totalQueries - incompleteCount) / totalQueries) * 100)
    : 0;

  return {
    totalQueries,
    totalEngines: new Set(run.results.map(r => r.engine)).size,
    captureCompleteness,
    regressionCounts,
    materialRegressions,
    incompleteCaptures,
  };
}

// Execute a benchmark run
export async function executeBenchmark(
  options: BenchmarkOptions = {}
): Promise<BenchmarkExecutionResult> {
  void options;
  throw new Error(CONFIGURATION_REQUIRED_MESSAGE);
}

// Get a specific benchmark run
export async function getBenchmarkRun(runId: string): Promise<BenchmarkRun | null> {
  return evidenceStore.getRun(runId);
}

// List recent benchmark runs
export async function listBenchmarkRuns(limit: number = 10): Promise<BenchmarkRun[]> {
  return evidenceStore.listRuns(limit);
}

// Propose a remediation for a regression
export async function proposeRemediation(
  runId: string,
  queryId: string,
  engine: AeoEngine,
  description: string,
  proposedChanges: string[]
): Promise<Remediation> {
  const remediation: Remediation = {
    id: randomUUID(),
    benchmarkRunId: runId,
    queryId,
    engine,
    description,
    proposedChanges,
    createdAt: new Date().toISOString(),
    status: "proposed",
  };

  await evidenceStore.saveRemediation(remediation);
  return remediation;
}

// Verify remediation through rerun
export async function verifyRemediation(
  remediationId: string,
  postRemediationRunId: string
): Promise<RerunComparison | null> {
  const remediation = await evidenceStore.getRemediation(remediationId);
  if (!remediation) return null;

  const priorRun = await evidenceStore.getRun(remediation.benchmarkRunId);
  const postRun = await evidenceStore.getRun(postRemediationRunId);
  
  if (!priorRun || !postRun) return null;

  const priorResult = priorRun.results.find(
    r => r.queryId === remediation.queryId && r.engine === remediation.engine
  );
  const postResult = postRun.results.find(
    r => r.queryId === remediation.queryId && r.engine === remediation.engine
  );

  if (!priorResult || !postResult) return null;

  // Determine outcome
  const priorScore = priorResult.currentEvidence.visibilityScore ?? 0;
  const postScore = postResult.currentEvidence.visibilityScore ?? 0;
  const scoreDiff = postScore - priorScore;

  let outcomeStatus: "improved" | "stable" | "regressed" | "indeterminate";
  if (scoreDiff > 10) {
    outcomeStatus = "improved";
  } else if (scoreDiff < -10) {
    outcomeStatus = "regressed";
  } else if (Math.abs(scoreDiff) <= 5) {
    outcomeStatus = "stable";
  } else {
    outcomeStatus = "indeterminate";
  }

  // Build change evidence
  const changes: { field: string; before: unknown; after: unknown }[] = [];
  if (priorResult.currentEvidence.citationPresence !== postResult.currentEvidence.citationPresence) {
    changes.push({
      field: "citationPresence",
      before: priorResult.currentEvidence.citationPresence,
      after: postResult.currentEvidence.citationPresence,
    });
  }
  if (priorResult.currentEvidence.visibilityScore !== postResult.currentEvidence.visibilityScore) {
    changes.push({
      field: "visibilityScore",
      before: priorResult.currentEvidence.visibilityScore,
      after: postResult.currentEvidence.visibilityScore,
    });
  }

  const evidence: RerunEvidence = {
    priorCapture: priorResult.currentEvidence,
    postCapture: postResult.currentEvidence,
    changes,
    conclusion: outcomeStatus === "improved"
      ? `Remediation successful: visibility improved by ${scoreDiff} points.`
      : outcomeStatus === "stable"
      ? `Remediation neutral: visibility change within noise range (${scoreDiff} points).`
      : outcomeStatus === "regressed"
      ? `Remediation insufficient: visibility regressed by ${Math.abs(scoreDiff)} points.`
      : `Remediation inconclusive: visibility change ambiguous (${scoreDiff} points).`,
  };

  const comparison: RerunComparison = {
    priorRunId: remediation.benchmarkRunId,
    postRemediationRunId,
    remediationId,
    queryId: remediation.queryId,
    engine: remediation.engine,
    priorResult,
    postResult,
    outcomeChanged: priorResult.regressionStatus !== postResult.regressionStatus,
    outcomeStatus,
    evidence,
  };

  // Update remediation status
  remediation.status = outcomeStatus === "improved" ? "verified" : 
                       outcomeStatus === "regressed" ? "proposed" : remediation.status;
  remediation.verificationRunId = postRemediationRunId;
  await evidenceStore.saveRemediation(remediation);

  return comparison;
}

// Get benchmark queries
export async function getBenchmarkQueries(): Promise<BenchmarkQuery[]> {
  return [];
}
