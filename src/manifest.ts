import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "uos-tool-canonry-aeo-monitoring",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Canonry Aeo Monitoring",
  description: "uos-tool-canonry-aeo-monitoring plugin",
  author: "turmo.dev",
  categories: ["automation"],
  capabilities: [
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "health-widget",
        displayName: "Canonry Aeo Monitoring Health",
        exportName: "DashboardWidget"
      }
    ]
  }
};

export default manifest;
