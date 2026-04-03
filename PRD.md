---
repo: "uos-tool-canonry-aeo-monitoring"
display_name: "uos-tool-canonry-aeo-monitoring"
package_name: "uos-tool-canonry-aeo-monitoring"
lane: "tool plugin"
artifact_class: "TypeScript package / Paperclip AEO monitoring plugin"
maturity: "newly scaffolded extracted tool plugin"
generated_on: "2026-04-03"
assumptions: "Grounded in the current split-repo contents, package metadata, README/PRD alignment pass, and the Paperclip plugin scaffold presence where applicable; deeper module-level inspection should refine implementation detail as the code evolves."
autonomy_mode: "maximum-capability autonomous work with deep research and explicit learning loops"
---

# PRD: canonry-aeo-monitoring

## 1. Product Intent

**Package / repo:** `uos-tool-canonry-aeo-monitoring`  
**Lane:** tool plugin  
**Artifact class:** TypeScript package / Paperclip AEO monitoring plugin  
**Current maturity:** newly scaffolded extracted tool plugin  
**Source-of-truth assumption:** This split repo is now the canonical home for the tool, delivered as a Paperclip plugin scaffold with repo-local worker, manifest, UI, and tests.
**Runtime form:** The Paperclip plugin scaffold is the primary delivery surface; evidence capture, monitoring logic, and operator workflows should strengthen that runtime rather than replace it.

canonry-aeo-monitoring monitors answer-engine visibility, citation presence, and discoverability performance across search and answer surfaces. It should help teams measure how content and outputs appear in answer engines and learn what changes meaningfully improve that visibility.

## 2. Problem Statement

Answer-engine optimization is easy to mythologize and hard to measure. Citation presence, ranking, and response quality change across engines and over time; without disciplined monitoring, teams chase anecdotes instead of evidence.

## 3. Target Users and Jobs to Be Done

- Teams tracking answer-engine visibility and citation outcomes.
- Researchers comparing engines, prompts, and content variants.
- Autonomous agents generating monitoring plans and remediation suggestions.

## 4. Outcome Thesis

**North star:** AEO work becomes an evidence system: monitored, comparable, and tied to actual changes in visibility or citation outcomes rather than narratives.

### 12-month KPI targets
- Benchmark coverage reaches at least 50 priority queries across at least 4 search or answer-engine surfaces.
- Evidence capture completeness reaches 100% for maintained benchmark runs.
- Regression detection precision reaches >= 85% on the maintained monitoring corpus.
- The top regression class receives a remediation proposal and validation rerun within 7 days.
- Time-series comparison is available for 100% of benchmark queries tracked in the active program.

### Acceptance thresholds for the next implementation wave
- A maintained benchmark query set exists with owners, cadence, and engine coverage.
- Each captured result preserves enough evidence for later human review and diffing.
- Regression scoring distinguishes noise from meaningful visibility changes.
- Remediation proposals can be tied back to concrete content or technical changes.

## 5. In Scope

- Query monitoring, response capture, citation detection, and change tracking.
- Comparative analysis across engines or variants.
- Remediation suggestion generation tied to evidence.
- Historical performance storage and trend analysis.

## 6. Explicit Non-Goals

- Optimizing for vanity movement without business relevance.
- Making unsupported causal claims from sparse observations.
- Treating a single engine or query set as universal truth.

## 7. Maximum Tool and Connection Surface

- This repo should assume it may use any connection, API, browser flow, CLI, document surface, dataset, or storage system materially relevant to completing the job, as long as the access pattern is lawful, auditable, and proportionate to risk.
- Do not artificially limit execution to the tools already named in the repo if adjacent systems are clearly required to close the loop.
- Prefer first-party APIs and direct integrations when available, but use browser automation, provider CLIs, structured import/export, and human-review queues when they are the most reliable path to completion.
- Treat communication systems, docs, spreadsheets, issue trackers, code hosts, cloud consoles, dashboards, databases, and admin panels as valid operating surfaces whenever the repo's job depends on them.
- Escalate only when the action is irreversible, privacy-sensitive, financially material, or likely to create external side effects without adequate review.

### Priority surfaces for AEO monitoring
- Google Search, AI Overviews, ChatGPT, Claude, Perplexity, Gemini, site-search surfaces, browser automation, query runners, and content inventories needed to measure visibility and citation behavior directly.
- Search Console, web analytics, spreadsheets, docs, warehouses, dashboards, and experiment logs needed to compare prompts, engines, time windows, pages, and interventions.
- Extraction, screenshot, SERP capture, and evidence-preservation tools whenever ranking or citation behavior must be preserved for review rather than summarized from memory.
- Any adjacent system that helps link discoverability changes to content, technical SEO, schema, distribution, or answer-engine outcomes.

### Selection rules
- Start by identifying the systems that would let the repo complete the real job end to end, not just produce an intermediate artifact.
- Use the narrowest safe action for high-risk domains, but not the narrowest tool surface by default.
- When one system lacks the evidence or authority needed to finish the task, step sideways into the adjacent system that does have it.
- Prefer a complete, reviewable workflow over a locally elegant but operationally incomplete one.

## 8. Autonomous Operating Model

This PRD assumes **maximum-capability autonomous work**. The repo should not merely accept tasks; it should research deeply, compare options, reduce uncertainty, ship safely, and learn from every outcome. Autonomy here means higher standards for evidence, reversibility, observability, and knowledge capture—not just faster execution.

### Required research before every material task
1. Read the repo README, this PRD, touched source modules, existing tests, and recent change history before proposing a solution.
1. Trace impact across adjacent UOS repos and shared contracts before changing interfaces, schemas, or runtime behavior.
1. Prefer evidence over assumption: inspect current code paths, add repro cases, and study real failure modes before implementing a fix.
1. Use external official documentation and standards for any upstream dependency, provider API, framework, CLI, or format touched by the task.
1. For non-trivial work, compare at least two approaches and explicitly choose based on reversibility, operational safety, and long-term maintainability.

### Repo-specific decision rules
- Measurement rigor beats anecdotal wins.
- Citations and visibility should be treated as empirical outcomes, not brand storytelling.
- Monitoring quality matters more than broad but noisy coverage.

### Mandatory escalation triggers
- Any collection pattern that may violate terms, policies, or ethical boundaries.
- High-confidence claims drawn from weak or biased samples.

## 9. Continuous Learning Requirements

### Required learning loop after every task
- Every completed task must leave behind at least one durable improvement: a test, benchmark, runbook, migration note, ADR, or automation asset.
- Capture the problem, evidence, decision, outcome, and follow-up questions in repo-local learning memory so the next task starts smarter.
- Promote repeated fixes into reusable abstractions, templates, linters, validators, or code generation rather than solving the same class of issue twice.
- Track confidence and unknowns; unresolved ambiguity becomes a research backlog item, not a silent assumption.
- Prefer instrumented feedback loops: telemetry, evaluation harnesses, fixtures, or replayable traces should be added whenever feasible.

### Repo-specific research agenda
- Which queries best represent true business exposure?
- What response changes matter most: inclusion, citation, rank, tone, or answer quality?
- How stable are results across engines, times, and prompts?
- Which remediation actions actually move the needle consistently?

### Repo-specific memory objects that must stay current
- Benchmark query library.
- Engine-response/citation history.
- Remediation experiment archive.
- Monitoring drift cases.

## 10. Core Workflows the Repo Must Master

1. Define benchmark query sets and monitoring cadence.
1. Capture engine responses and citation evidence.
1. Diff changes over time and detect important regressions.
1. Generate evidence-backed remediation proposals.
1. Validate whether changes actually improved outcomes.

## 11. Interfaces and Dependencies

- Paperclip plugin runtime, manifest, worker, UI, and local install flows.

- Potential search/answer engine access paths.
- `@uos/skills-catalog` if tool metadata or outputs need cataloging.

## 12. Implementation Backlog

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

## 13. Risks and Mitigations

- Noisy benchmarks creating false narratives.
- Engine volatility mistaken for durable trend.
- Measurement methods drifting without notice.

## 14. Definition of Done

A task in this repo is only complete when all of the following are true:

- The code, configuration, or skill behavior has been updated with clear intent.
- Tests, evals, replay cases, or validation artifacts were added or updated to protect the changed behavior.
- Documentation, runbooks, or decision records were updated when the behavior, contract, or operating model changed.
- The task produced a durable learning artifact rather than only a code diff.
- Cross-repo consequences were checked wherever this repo touches shared contracts, orchestration, or downstream users.

### Repo-specific completion requirements
- Monitoring outputs include evidence, confidence, and sampling context.
- Recommendations can be traced back to observed response changes.

## 15. Recommended Repo-Local Knowledge Layout

- `/docs/research/` for research briefs, benchmark notes, and upstream findings.
- `/docs/adrs/` for decision records and contract changes.
- `/docs/lessons/` for task-by-task learning artifacts and postmortems.
- `/evals/` for executable quality checks, golden cases, and regression suites.
- `/playbooks/` for operator runbooks, migration guides, and incident procedures.
