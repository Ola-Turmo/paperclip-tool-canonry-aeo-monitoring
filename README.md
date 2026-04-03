# Canonry AEO Monitoring

canonry-aeo-monitoring monitors answer-engine visibility, citation presence, and discoverability performance across search and answer surfaces. It should help teams measure how content and outputs appear in answer engines and learn what changes meaningfully improve that visibility.

Built as part of the UOS split workspace on top of [Paperclip](https://github.com/paperclipai/paperclip), which remains the upstream control-plane substrate.

## What This Repo Owns

- Query monitoring, response capture, citation detection, and change tracking.
- Comparative analysis across engines or variants.
- Remediation suggestion generation tied to evidence.
- Historical performance storage and trend analysis.

## Runtime Form

- The Paperclip plugin scaffold is the primary delivery surface; evidence capture, monitoring logic, and operator workflows should strengthen that runtime rather than replace it.

## Highest-Value Workflows

- Define benchmark query sets and monitoring cadence.
- Capture engine responses and citation evidence.
- Diff changes over time and detect important regressions.
- Generate evidence-backed remediation proposals.
- Validate whether changes actually improved outcomes.

## Key Connections and Operating Surfaces

- Google Search, AI Overviews, ChatGPT, Claude, Perplexity, Gemini, site-search surfaces, browser automation, query runners, and content inventories needed to measure visibility and citation behavior directly.
- Search Console, web analytics, spreadsheets, docs, warehouses, dashboards, and experiment logs needed to compare prompts, engines, time windows, pages, and interventions.
- Extraction, screenshot, SERP capture, and evidence-preservation tools whenever ranking or citation behavior must be preserved for review rather than summarized from memory.
- Any adjacent system that helps link discoverability changes to content, technical SEO, schema, distribution, or answer-engine outcomes.

## KPI Targets

- Benchmark coverage reaches at least 50 priority queries across at least 4 search or answer-engine surfaces.
- Evidence capture completeness reaches 100% for maintained benchmark runs.
- Regression detection precision reaches >= 85% on the maintained monitoring corpus.
- The top regression class receives a remediation proposal and validation rerun within 7 days.

## Implementation Backlog

### Now
- Stand up the benchmark query library, engine coverage rules, and evidence capture pipeline.
- Build comparison and regression scoring that can separate meaningful changes from daily variance.
- Create the first remediation workflow that links engine regressions back to content and technical causes.

### Next
- Improve query coverage and add stronger time-series reporting for monitored surfaces.
- Automate reruns and validation loops after a remediation proposal is applied.
- Integrate the outputs with the wider operations and SEO planning surfaces.

### Later
- Add portfolio-level discoverability reporting across content collections and brands.
- Support more autonomous remediation testing with strict evidence and rollback discipline.

## Local Plugin Use

```bash
curl -X POST http://127.0.0.1:3100/api/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"packageName":"<absolute-path-to-this-repo>","isLocalPath":true}'
```

## Validation

```bash
pnpm install
pnpm build
pnpm test
pnpm plugin:typecheck
```
