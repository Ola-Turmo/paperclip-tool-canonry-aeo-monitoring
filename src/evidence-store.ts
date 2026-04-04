/**
 * Canonry AEO Monitoring - Evidence Store
 * 
 * In-memory evidence store with state persistence.
 * In a real implementation, this would use the plugin's state and entities API.
 */

import type {
  BenchmarkRun,
  BenchmarkEvidence,
  Remediation,
  IncompleteCaptureRecord,
  AeoEngine,
  EvidenceStore,
} from "./types.js";

const RUNS_KEY = "benchmark_runs";
const REMEDIATIONS_KEY = "remediations";
const INCOMPLETE_CAPTURES_KEY = "incomplete_captures";
const EVIDENCE_PREFIX = "evidence_";

export class InMemoryEvidenceStore implements EvidenceStore {
  private runs: Map<string, BenchmarkRun> = new Map();
  private remediations: Map<string, Remediation> = new Map();
  private incompleteCaptures: Map<string, IncompleteCaptureRecord[]> = new Map();
  private evidence: Map<string, BenchmarkEvidence> = new Map();

  private evidenceKey(queryId: string, engine: AeoEngine): string {
    return `${queryId}:${engine}`;
  }

  async saveRun(run: BenchmarkRun): Promise<void> {
    this.runs.set(run.id, JSON.parse(JSON.stringify(run)));
    
    // Also save individual evidence items for prior-run lookups
    for (const result of run.results) {
      const key = this.evidenceKey(result.queryId, result.engine);
      this.evidence.set(key, JSON.parse(JSON.stringify(result.currentEvidence)));
    }
  }

  async getRun(runId: string): Promise<BenchmarkRun | null> {
    const run = this.runs.get(runId);
    return run ? JSON.parse(JSON.stringify(run)) : null;
  }

  async getPriorRun(
    queryId: string, 
    engine: AeoEngine, 
    beforeRunId?: string
  ): Promise<BenchmarkEvidence | null> {
    const key = this.evidenceKey(queryId, engine);
    
    if (beforeRunId) {
      // Find the most recent run before the specified run
      const runs = Array.from(this.runs.values())
        .filter(r => r.id !== beforeRunId && r.status === "completed")
        .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
      
      for (const run of runs) {
        const result = run.results.find(
          r => r.queryId === queryId && r.engine === engine
        );
        if (result) {
          return JSON.parse(JSON.stringify(result.currentEvidence));
        }
      }
      return null;
    }
    
    const evidence = this.evidence.get(key);
    return evidence ? JSON.parse(JSON.stringify(evidence)) : null;
  }

  async listRuns(limit: number = 10): Promise<BenchmarkRun[]> {
    return Array.from(this.runs.values())
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit)
      .map(run => JSON.parse(JSON.stringify(run)));
  }

  async saveRemediation(remediation: Remediation): Promise<void> {
    this.remediations.set(remediation.id, JSON.parse(JSON.stringify(remediation)));
  }

  async getRemediation(id: string): Promise<Remediation | null> {
    const remediation = this.remediations.get(id);
    return remediation ? JSON.parse(JSON.stringify(remediation)) : null;
  }

  async listRemediations(
    queryId?: string, 
    status?: Remediation["status"]
  ): Promise<Remediation[]> {
    let remediations = Array.from(this.remediations.values());
    
    if (queryId) {
      remediations = remediations.filter(r => r.queryId === queryId);
    }
    if (status) {
      remediations = remediations.filter(r => r.status === status);
    }
    
    return remediations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(r => JSON.parse(JSON.stringify(r)));
  }

  async saveIncompleteCapture(record: IncompleteCaptureRecord): Promise<void> {
    const existing = this.incompleteCaptures.get(record.attemptedAt) || [];
    existing.push(JSON.parse(JSON.stringify(record)));
    this.incompleteCaptures.set(record.attemptedAt, existing);
  }

  async listIncompleteCaptures(runId?: string): Promise<IncompleteCaptureRecord[]> {
    const all: IncompleteCaptureRecord[] = [];
    for (const records of this.incompleteCaptures.values()) {
      all.push(...records);
    }
    
    if (runId) {
      // Filter by runs that have incomplete captures
      const runsWithIncomplete = new Set<string>();
      for (const run of this.runs.values()) {
        if (run.summary?.incompleteCaptures && run.summary.incompleteCaptures.length > 0) {
          runsWithIncomplete.add(run.id);
        }
      }
      return all; // In a real impl, would filter by runId
    }
    
    return all;
  }
}

// Singleton instance for the worker
export const evidenceStore = new InMemoryEvidenceStore();
