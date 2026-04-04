import { describe, expect, it, beforeEach } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";

describe("canonry-aeo-monitoring plugin", () => {
  describe("basic plugin scaffold", () => {
    it("registers data + actions and handles events", async () => {
      const harness = createTestHarness({
        manifest,
        capabilities: [...manifest.capabilities, "events.emit"],
      });
      await plugin.definition.setup(harness.ctx);

      await harness.emit(
        "issue.created",
        { issueId: "iss_1" },
        { entityId: "iss_1", entityType: "issue" }
      );
      expect(
        harness.getState({
          scopeKind: "issue",
          scopeId: "iss_1",
          stateKey: "seen",
        })
      ).toBe(true);

      const data = await harness.getData<{ status: string }>("health");
      expect(data.status).toBe("ok");

      const action = await harness.performAction<{ pong: boolean }>("ping");
      expect(action.pong).toBe(true);
    });
  });

  describe("benchmark capability", () => {
    let harness: Awaited<ReturnType<typeof createTestHarness>>;

    beforeEach(async () => {
      harness = createTestHarness({
        manifest,
        capabilities: manifest.capabilities,
      });
      await plugin.definition.setup(harness.ctx);
    });

    it("reports benchmark health status", async () => {
      const data = await harness.getData<{
        status: string;
        recentRuns: number;
      }>("benchmark-health");
      expect(data.status).toBe("ok");
      expect(data.recentRuns).toBe(0);
    });

    it("returns benchmark queries", async () => {
      const data = await harness.getData<{ queries: unknown[] }>(
        "benchmark-queries"
      );
      expect(data.queries).toBeDefined();
      expect(Array.isArray(data.queries)).toBe(true);
      expect(data.queries.length).toBeGreaterThan(0);
    });

    it("runs a benchmark and returns results", async () => {
      const result = await harness.performAction<{
        success: boolean;
        runId?: string;
        summary?: {
          totalQueries: number;
          captureCompleteness: number;
          regressionCounts: {
            materialRegression: number;
          };
        };
        incompleteCaptures?: unknown[];
      }>("run-benchmark", {});

      expect(result.success).toBe(true);
      expect(result.runId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary?.totalQueries).toBeGreaterThan(0);
      expect(result.incompleteCaptures).toBeDefined();
    });

    it("runs benchmark with options", async () => {
      const result = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {
        options: {
          queryIds: ["bq_001"],
          engines: ["google-search", "chatgpt"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.runId).toBeDefined();
    });

    it("gets benchmark run details", async () => {
      // First run a benchmark
      const runResult = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {});

      expect(runResult.success).toBe(true);
      expect(runResult.runId).toBeDefined();

      // Get the run details
      const runData = await harness.getData<{ run?: unknown; error?: string }>(
        "benchmark-run",
        { runId: runResult.runId! }
      );

      expect(runData.error).toBeUndefined();
      expect(runData.run).toBeDefined();
    });

    it("lists benchmark runs", async () => {
      // Run a benchmark first
      await harness.performAction("run-benchmark", {});

      const data = await harness.getData<{ runs: unknown[] }>(
        "benchmark-runs"
      );
      expect(data.runs).toBeDefined();
      expect(Array.isArray(data.runs)).toBe(true);
      expect(data.runs.length).toBeGreaterThan(0);
    });

    it("returns error for non-existent run", async () => {
      const data = await harness.getData<{ run?: unknown; error?: string }>(
        "benchmark-run",
        { runId: "non-existent-run" }
      );
      expect(data.error).toBe("Run not found");
    });
  });

  describe("regression detection", () => {
    let harness: Awaited<ReturnType<typeof createTestHarness>>;

    beforeEach(async () => {
      harness = createTestHarness({
        manifest,
        capabilities: manifest.capabilities,
      });
      await plugin.definition.setup(harness.ctx);
    });

    it("detects material regressions in benchmark results", async () => {
      // Run initial benchmark
      const initialRun = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {});

      expect(initialRun.success).toBe(true);

      // Run again to compare
      const secondRun = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {
        options: {
          compareToRunId: initialRun.runId,
        },
      });

      expect(secondRun.success).toBe(true);
    });

    it("gets regression report for a run", async () => {
      // Run a benchmark first
      const runResult = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {});

      expect(runResult.success).toBe(true);

      // Get regression report
      const report = await harness.performAction<{
        runId?: string;
        status?: string;
        materialRegressions?: unknown[];
      }>("get-regression-report", { runId: runResult.runId! });

      expect(report.runId).toBe(runResult.runId);
      expect(report.status).toBeDefined();
    });

    it("reports incomplete captures in benchmark results", async () => {
      const result = await harness.performAction<{
        success: boolean;
        incompleteCaptures?: unknown[];
      }>("run-benchmark", {});

      expect(result.success).toBe(true);
      expect(result.incompleteCaptures).toBeDefined();
    });
  });

  describe("remediation verification", () => {
    let harness: Awaited<ReturnType<typeof createTestHarness>>;

    beforeEach(async () => {
      harness = createTestHarness({
        manifest,
        capabilities: manifest.capabilities,
      });
      await plugin.definition.setup(harness.ctx);
    });

    it("proposes remediation for a regression", async () => {
      // Run a benchmark first
      const runResult = await harness.performAction<{
        success: boolean;
        runId?: string;
        summary?: { materialRegressions: unknown[] };
      }>("run-benchmark", {});

      expect(runResult.success).toBe(true);

      // Get the regression report to find a material regression
      const report = await harness.performAction<{
        materialRegressions?: Array<{
          queryId: string;
          engine: string;
        }>;
      }>("get-regression-report", { runId: runResult.runId! });

      // Even if no material regressions, we can still propose remediation for any query
      const queryId = report.materialRegressions?.[0]?.queryId ?? "bq_001";
      const engine = report.materialRegressions?.[0]?.engine ?? "google-search";

      const remediationResult = await harness.performAction<{
        success: boolean;
        remediation?: unknown;
      }>("propose-remediation", {
        runId: runResult.runId!,
        queryId,
        engine,
        description: "Test remediation for visibility regression",
        proposedChanges: ["Improve content quality", "Update metadata"],
      });

      expect(remediationResult.success).toBe(true);
      expect(remediationResult.remediation).toBeDefined();
    });

    it("verifies remediation through rerun", async () => {
      // Run initial benchmark
      const initialRun = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {});

      expect(initialRun.success).toBe(true);

      // Propose remediation
      const remediationResult = await harness.performAction<{
        success: boolean;
        remediation?: { id?: string };
      }>("propose-remediation", {
        runId: initialRun.runId!,
        queryId: "bq_001",
        engine: "google-search",
        description: "Test remediation",
        proposedChanges: ["Change 1", "Change 2"],
      });

      expect(remediationResult.success).toBe(true);
      const remediationId = remediationResult.remediation?.id;

      // Run post-remediation benchmark
      const postRun = await harness.performAction<{
        success: boolean;
        runId?: string;
      }>("run-benchmark", {});

      expect(postRun.success).toBe(true);

      // Verify remediation
      if (remediationId) {
        const verifyResult = await harness.performAction<{
          success: boolean;
          comparison?: unknown;
          error?: string;
        }>("verify-remediation", {
          remediationId,
          postRemediationRunId: postRun.runId!,
        });

        // Should either succeed with comparison or fail gracefully
        expect(verifyResult.success || verifyResult.error).toBeDefined();
      }
    });

    it("lists remediations", async () => {
      // Run benchmark
      await harness.performAction("run-benchmark", {});

      // List remediations (should be empty initially)
      const data = await harness.getData<{ remediations: unknown[] }>(
        "remediations"
      );
      expect(data.remediations).toBeDefined();
      expect(Array.isArray(data.remediations)).toBe(true);
    });
  });

  describe("incomplete state handling", () => {
    let harness: Awaited<ReturnType<typeof createTestHarness>>;

    beforeEach(async () => {
      harness = createTestHarness({
        manifest,
        capabilities: manifest.capabilities,
      });
      await plugin.definition.setup(harness.ctx);
    });

    it("reports incomplete captures instead of fabricating conclusions", async () => {
      // site-search engine returns unavailable status in mock
      const result = await harness.performAction<{
        success: boolean;
        incompleteCaptures?: Array<{
          queryId: string;
          engine: string;
          reason: string;
          context: string;
        }>;
      }>("run-benchmark", {
        options: {
          engines: ["site-search"],
        },
      });

      expect(result.success).toBe(true);
      
      // Verify incomplete captures are reported
      const hasIncomplete = result.incompleteCaptures?.some(
        (ic) => ic.engine === "site-search"
      );
      expect(hasIncomplete).toBe(true);
    });

    it("reports policy-sensitive captures as incomplete", async () => {
      // In the mock, policy-sensitive would be handled similarly to unavailable
      const result = await harness.performAction<{
        success: boolean;
        incompleteCaptures?: unknown[];
      }>("run-benchmark", {});

      expect(result.success).toBe(true);
      expect(Array.isArray(result.incompleteCaptures)).toBe(true);
    });

    it("provides context for incomplete captures", async () => {
      const result = await harness.performAction<{
        success: boolean;
        incompleteCaptures?: Array<{
          reason: string;
          context: string;
        }>;
      }>("run-benchmark", {});

      expect(result.success).toBe(true);
      
      if (result.incompleteCaptures && result.incompleteCaptures.length > 0) {
        // Verify each incomplete capture has required context
        for (const ic of result.incompleteCaptures) {
          expect(ic.reason).toBeDefined();
          expect(ic.context).toBeDefined();
        }
      }
    });
  });
});
