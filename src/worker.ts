import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import {
  executeBenchmark,
  getBenchmarkRun,
  listBenchmarkRuns,
  proposeRemediation,
  verifyRemediation,
  getBenchmarkQueries,
} from "./benchmark-engine.js";
import { evidenceStore } from "./evidence-store.js";
import type {
  BenchmarkOptions,
  Remediation,
  AeoEngine,
} from "./types.js";

const plugin = definePlugin({
  async setup(ctx) {
    // Basic event handling - observe issues
    ctx.events.on("issue.created", async (event) => {
      const issueId = event.entityId ?? "unknown";
      await ctx.state.set(
        { scopeKind: "issue", scopeId: issueId, stateKey: "seen" },
        true
      );
      ctx.logger.info("Observed issue.created", { issueId });
    });

    // Health check
    ctx.data.register("health", async () => {
      return { status: "ok", checkedAt: new Date().toISOString() };
    });

    // Benchmark health - checks if evidence store is accessible
    ctx.data.register("benchmark-health", async () => {
      try {
        const runs = await evidenceStore.listRuns(1);
        return {
          status: "ok",
          checkedAt: new Date().toISOString(),
          recentRuns: runs.length,
        };
      } catch (error) {
        return {
          status: "degraded",
          checkedAt: new Date().toISOString(),
          error: String(error),
        };
      }
    });

    // Get benchmark queries
    ctx.data.register("benchmark-queries", async () => {
      const queries = await getBenchmarkQueries();
      return { queries };
    });

    // Get benchmark run details
    ctx.data.register("benchmark-run", async (params: Record<string, unknown>) => {
      const runId = params.runId as string;
      const run = await getBenchmarkRun(runId);
      if (!run) {
        return { error: "Run not found", runId };
      }
      return { run };
    });

    // List recent benchmark runs
    ctx.data.register("benchmark-runs", async (params: Record<string, unknown>) => {
      const limit = (params.limit as number) ?? 10;
      const runs = await listBenchmarkRuns(limit);
      return { runs };
    });

    // List remediations
    ctx.data.register("remediations", async (params: Record<string, unknown>) => {
      const remediations = await evidenceStore.listRemediations(
        params.queryId as string | undefined,
        params.status as Remediation["status"] | undefined
      );
      return { remediations };
    });

    // Ping action
    ctx.actions.register("ping", async () => {
      ctx.logger.info("Ping action invoked");
      return { pong: true, at: new Date().toISOString() };
    });

    // Run benchmark action - the core benchmark execution
    ctx.actions.register("run-benchmark", async (params: Record<string, unknown>) => {
      const options = params.options as BenchmarkOptions | undefined;
      ctx.logger.info("Running benchmark", { options });
      try {
        const result = await executeBenchmark(options);
        
        // Log summary for operators
        ctx.logger.info("Benchmark completed", {
          runId: result.run.id,
          totalQueries: result.run.summary.totalQueries,
          materialRegressions: result.run.summary.regressionCounts.materialRegression,
          captureCompleteness: result.run.summary.captureCompleteness,
          incompleteCaptures: result.incompleteCaptures.length,
        });

        return {
          success: true,
          runId: result.run.id,
          summary: result.run.summary,
          executedAt: result.executedAt,
          executionMs: result.executionMs,
          incompleteCaptures: result.incompleteCaptures.map(ic => ({
            queryId: ic.queryId,
            engine: ic.engine,
            reason: ic.reason,
            context: ic.context,
          })),
        };
      } catch (error) {
        ctx.logger.error("Benchmark failed", { error: String(error) });
        return {
          success: false,
          error: String(error),
        };
      }
    });

    // Propose remediation action
    ctx.actions.register("propose-remediation", async (params: Record<string, unknown>) => {
      const runId = params.runId as string;
      const queryId = params.queryId as string;
      const engine = params.engine as string;
      const description = params.description as string;
      const proposedChanges = params.proposedChanges as string[];
      
      ctx.logger.info("Proposing remediation", {
        runId,
        queryId,
        engine,
      });
      try {
        const remediation = await proposeRemediation(
          runId,
          queryId,
          engine as AeoEngine,
          description,
          proposedChanges
        );
        return {
          success: true,
          remediation,
        };
      } catch (error) {
        ctx.logger.error("Propose remediation failed", { error: String(error) });
        return {
          success: false,
          error: String(error),
        };
      }
    });

    // Verify remediation through rerun
    ctx.actions.register("verify-remediation", async (params: Record<string, unknown>) => {
      const remediationId = params.remediationId as string;
      const postRemediationRunId = params.postRemediationRunId as string;
      
      ctx.logger.info("Verifying remediation", {
        remediationId,
        postRemediationRunId,
      });
      try {
        const comparison = await verifyRemediation(
          remediationId,
          postRemediationRunId
        );
        if (!comparison) {
          return {
            success: false,
            error: "Remediation or run not found",
          };
        }
        return {
          success: true,
          comparison,
        };
      } catch (error) {
        ctx.logger.error("Verify remediation failed", { error: String(error) });
        return {
          success: false,
          error: String(error),
        };
      }
    });

    // Get regression report
    ctx.actions.register("get-regression-report", async (params: Record<string, unknown>) => {
      const runId = params.runId as string;
      const run = await getBenchmarkRun(runId);
      if (!run) {
        return { error: "Run not found" };
      }

      const materialRegressions = run.summary.materialRegressions;
      if (materialRegressions.length === 0) {
        return {
          runId: run.id,
          status: "no-material-regressions",
          summary: run.summary,
        };
      }

      // Generate remediation-oriented report
      const report = {
        runId: run.id,
        status: "material-regressions-detected",
        summary: run.summary,
        materialRegressions: materialRegressions.map(r => ({
          queryId: r.queryId,
          query: r.query,
          engine: r.engine,
          regressionStatus: r.regressionStatus,
          regressionDetails: r.regressionDetails,
          currentEvidence: {
            citationPresence: r.currentEvidence.citationPresence,
            visibilityScore: r.currentEvidence.visibilityScore,
            captureStatus: r.currentEvidence.captureStatus,
          },
        })),
        remediationGuidance: materialRegressions.map(r => ({
          queryId: r.queryId,
          engine: r.engine,
          recommendation: r.regressionDetails?.recommendation,
          proposedRemediation: {
            queryId: r.queryId,
            engine: r.engine,
            description: `Address visibility regression for query "${r.query}" on ${r.engine}`,
            proposedChanges: [
              "Review content quality and relevance",
              "Check for recent engine algorithm updates",
              "Verify citation structure and metadata",
            ],
          },
        })),
      };

      return report;
    });
  },

  async onHealth() {
    return { status: "ok", message: "Canonry AEO Monitoring plugin worker is running" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
