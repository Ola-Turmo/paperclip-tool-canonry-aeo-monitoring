/**
 * Canonry AEO Monitoring - Benchmark Engine
 * 
 * Handles benchmark execution, evidence capture, and regression detection.
 * Uses mocks when real engine access is unavailable.
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

// Default benchmark queries for demonstration
const DEFAULT_BENCHMARK_QUERIES: BenchmarkQuery[] = [
  {
    id: "bq_001",
    query: "What is UOS platform architecture?",
    engines: ["google-search", "ai-overviews", "chatgpt", "perplexity"],
    owner: "platform-team",
    cadence: "weekly",
    tags: ["architecture", "core"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bq_002",
    query: "How do I provision a new workspace?",
    engines: ["google-search", "ai-overviews", "claude", "gemini"],
    owner: "platform-team",
    cadence: "weekly",
    tags: ["provisioning", "getting-started"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bq_003",
    query: "What connector integrations are supported?",
    engines: ["google-search", "chatgpt", "perplexity"],
    owner: "connector-team",
    cadence: "biweekly",
    tags: ["connectors", "integrations"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bq_004",
    query: "How does the operations cockpit work?",
    engines: ["google-search", "ai-overviews", "claude"],
    owner: "ops-team",
    cadence: "weekly",
    tags: ["operations", "cockpit"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bq_005",
    query: "What is the department overlay model?",
    engines: ["google-search", "ai-overviews", "perplexity", "gemini"],
    owner: "platform-team",
    cadence: "monthly",
    tags: ["departments", "architecture"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock response generator for demonstration
function generateMockEvidence(
  query: BenchmarkQuery,
  engine: AeoEngine
): BenchmarkEvidence {
  const timestamp = new Date().toISOString();
  
  // Simulate varying citation presence based on engine
  const citationPresenceMap: Record<AeoEngine, CitationPresence> = {
    "google-search": "present",
    "ai-overviews": "partial",
    "chatgpt": "present",
    "claude": "present",
    "perplexity": "present",
    "gemini": "partial",
    "site-search": "unknown",
  };

  // Simulate visibility scores with some variance
  const baseScore = engine === "ai-overviews" ? 75 : engine === "site-search" ? 50 : 85;
  const variance = Math.random() * 20 - 10; // -10 to +10
  const visibilityScore = Math.max(0, Math.min(100, Math.round(baseScore + variance)));

  return {
    queryId: query.id,
    engine,
    capturedAt: timestamp,
    responseText: `[Mock] Response for "${query.query}" on ${engine}`,
    citationPresence: citationPresenceMap[engine],
    citationSources: citationPresenceMap[engine] !== "absent" 
      ? [`https://docs.example.com/${query.id}`] 
      : undefined,
    visibilityScore,
    captureStatus: engine === "site-search" ? "unavailable" : "complete",
    rawResponse: {
      mock: true,
      queryId: query.id,
      engine,
      timestamp,
      responseLength: Math.floor(Math.random() * 500) + 200,
    },
  };
}

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
  const startTime = Date.now();
  const runId = randomUUID();
  const timestamp = new Date().toISOString();

  // Get queries to run
  const queries = options.queryIds && options.queryIds.length > 0
    ? DEFAULT_BENCHMARK_QUERIES.filter(q => options.queryIds!.includes(q.id))
    : DEFAULT_BENCHMARK_QUERIES;

  // Get engines to run
  const engines: AeoEngine[] = options.engines && options.engines.length > 0
    ? options.engines
    : ["google-search", "ai-overviews", "chatgpt", "claude", "perplexity", "gemini"];

  const results: QueryResult[] = [];
  const incompleteCaptures: IncompleteCaptureRecord[] = [];

  // Execute for each query and engine
  for (const query of queries) {
    for (const engine of engines) {
      // Get prior evidence for comparison
      const priorEvidence = await evidenceStore.getPriorRun(
        query.id, 
        engine, 
        options.compareToRunId
      ) ?? undefined;

      // Capture current evidence (mock implementation)
      const currentEvidence = generateMockEvidence(query, engine);

      // Record incomplete captures for audit
      if (currentEvidence.captureStatus !== "complete") {
        incompleteCaptures.push({
          queryId: query.id,
          engine,
          attemptedAt: timestamp,
          reason: currentEvidence.captureStatus,
          context: currentEvidence.captureNote || "Auto-detected during benchmark",
        });
      }

      // Detect regression
      const { status, details } = detectRegression(priorEvidence, currentEvidence);

      results.push({
        queryId: query.id,
        query: query.query,
        engine,
        priorEvidence,
        currentEvidence,
        regressionStatus: status,
        regressionDetails: details,
      });
    }
  }

  // Build run object
  const run: BenchmarkRun = {
    id: runId,
    name: `Benchmark Run ${runId.slice(0, 8)}`,
    description: `Automated benchmark ${options.compareToRunId ? "with comparison" : "initial"}`,
    queryIds: queries.map(q => q.id),
    executedAt: timestamp,
    status: incompleteCaptures.length > results.length * 0.5 ? "partial" : "completed",
    results,
    summary: calculateSummary({ ...({} as BenchmarkRun), id: runId, name: "", queryIds: [], executedAt: timestamp, status: "completed", results, summary: {} as BenchmarkSummary }),
  };

  // Recalculate summary properly
  run.summary = calculateSummary(run);

  // Save the run
  await evidenceStore.saveRun(run);

  const executionMs = Date.now() - startTime;

  return {
    run,
    options,
    executedAt: timestamp,
    executionMs,
    incompleteCaptures,
  };
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
  return DEFAULT_BENCHMARK_QUERIES;
}
