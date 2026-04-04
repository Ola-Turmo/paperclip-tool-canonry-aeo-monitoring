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

  const handleRunBenchmark = async () => {
    const result = await runBenchmark({}) as { success: boolean; runId?: string };
    if (result.success && result.runId) {
      // Benchmark was run successfully
      console.log("Benchmark completed:", result.runId);
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
        <div>Available Queries: {queriesData?.queries?.length ?? 0}</div>
      </div>

      <button
        onClick={() => void handleRunBenchmark()}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.25rem",
          cursor: "pointer",
        }}
      >
        Run Benchmark
      </button>

      {queriesData?.queries && queriesData.queries.length > 0 && (
        <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          <strong>Sample Queries:</strong>
          <ul style={{ margin: "0.25rem 0", paddingLeft: "1rem" }}>
            {queriesData.queries.slice(0, 3).map((q) => (
              <li key={q.id}>{q.query.slice(0, 50)}...</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
