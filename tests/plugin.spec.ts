import { beforeEach, describe, expect, it } from "vitest";
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
        { entityId: "iss_1", entityType: "issue" },
      );

      expect(
        harness.getState({
          scopeKind: "issue",
          scopeId: "iss_1",
          stateKey: "seen",
        }),
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

    it("returns zero configured benchmark queries by default", async () => {
      const data = await harness.getData<{ queries: unknown[] }>("benchmark-queries");
      expect(Array.isArray(data.queries)).toBe(true);
      expect(data.queries).toHaveLength(0);
    });

    it("refuses to run a benchmark without configured queries and engines", async () => {
      const result = await harness.performAction<{
        success: boolean;
        error?: string;
      }>("run-benchmark", {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("not configured");
    });

    it("lists zero benchmark runs until real benchmarks exist", async () => {
      const data = await harness.getData<{ runs: unknown[] }>("benchmark-runs");
      expect(Array.isArray(data.runs)).toBe(true);
      expect(data.runs).toHaveLength(0);
    });

    it("returns error for non-existent run", async () => {
      const data = await harness.getData<{ run?: unknown; error?: string }>(
        "benchmark-run",
        { runId: "non-existent-run" },
      );
      expect(data.error).toBe("Run not found");
    });

    it("returns a no-material-regressions response when no run exists", async () => {
      const result = await harness.performAction<{ error?: string }>("get-regression-report", {
        runId: "non-existent-run",
      });
      expect(result.error).toBe("Run not found");
    });

    it("lists remediations and starts empty", async () => {
      const data = await harness.getData<{ remediations: unknown[] }>("remediations");
      expect(Array.isArray(data.remediations)).toBe(true);
      expect(data.remediations).toHaveLength(0);
    });
  });
});
