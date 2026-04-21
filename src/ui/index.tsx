import { usePluginAction, usePluginData, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";

type HealthData = {
  status: "ok" | "degraded" | "error";
  checkedAt: string;
};

type BenchmarkHealthData = {
  status: string;
  recentRuns: number;
  checkedAt: string;
};

type BenchmarkQueriesData = {
  queries: Array<{
    id: string;
    query: string;
    engines: string[];
    owner?: string;
    cadence?: string;
  }>;
};

export function DashboardWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = usePluginData<HealthData>("health");
  const ping = usePluginAction("ping");

  if (loading) return <div>Loading plugin health...</div>;
  if (error) return <div>Plugin error: {error.message}</div>;

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <strong>Canonry AEO Monitoring</strong>
      <div>Health: {data?.status ?? "unknown"}</div>
      <div>Checked: {data?.checkedAt ?? "never"}</div>
      <button onClick={() => void ping()}>Ping Worker</button>
    </div>
  );
}

export function BenchmarkWidget(_props: PluginWidgetProps) {
  const { data: healthData, loading: healthLoading } = usePluginData<BenchmarkHealthData>("benchmark-health");
  const { data: queriesData, loading: queriesLoading } = usePluginData<BenchmarkQueriesData>("benchmark-queries");
  const runBenchmark = usePluginAction("run-benchmark");
  const queryCount = queriesData?.queries?.length ?? 0;

  const handleRunBenchmark = async () => {
    const result = await runBenchmark({}) as { success: boolean; runId?: string; error?: string };
    if (result.success && result.runId) {
      // Benchmark was run successfully
      console.log("Benchmark completed:", result.runId);
      return;
    }
    if (result && typeof result.error === "string") {
      console.warn("Benchmark unavailable:", result.error);
    }
  };

  if (healthLoading || queriesLoading) {
    return <div>Loading benchmark data...</div>;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <strong>Canonry Benchmark</strong>
      
      <div style={{ fontSize: "0.875rem" }}>
        <div>Status: {healthData?.status ?? "unknown"}</div>
        <div>Recent Runs: {healthData?.recentRuns ?? 0}</div>
        <div>Configured Queries: {queryCount}</div>
      </div>

      <button
        onClick={() => void handleRunBenchmark()}
        disabled={queryCount === 0}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: queryCount === 0 ? "#64748b" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.25rem",
          cursor: queryCount === 0 ? "not-allowed" : "pointer",
        }}
      >
        Run Benchmark
      </button>

      {queryCount > 0 ? (
        <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          <strong>Configured Queries:</strong>
          <ul style={{ margin: "0.25rem 0", paddingLeft: "1rem" }}>
            {(queriesData?.queries ?? []).slice(0, 3).map((q) => (
              <li key={q.id}>{q.query.slice(0, 50)}...</li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          No benchmark queries configured yet. Add real queries before running Canonry benchmarks.
        </div>
      )}
    </div>
  );
}
