import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "uos-tool-canonry-aeo-monitoring",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Canonry Aeo Monitoring",
  description:
    "Canonry AEO monitoring - benchmark-driven evidence capture and regression detection for answer engine optimization",
  author: "turmo.dev",
  categories: ["automation"],
  capabilities: [
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write",
    "ui.dashboardWidget.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "health-widget",
        displayName: "Canonry Aeo Monitoring Health",
        exportName: "DashboardWidget",
      },
      {
        type: "dashboardWidget",
        id: "benchmark-widget",
        displayName: "Canonry Benchmark Results",
        exportName: "BenchmarkWidget",
      },
    ],
  },
};

export default manifest;
