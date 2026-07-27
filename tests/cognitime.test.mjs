import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan, parseItemsFromLines, planToCsv, planToIcs, planToMarkdown, summarizeLedger } from "../src/domain/cognitime.js";

const input = {
  goal: "Ship a clear validation artifact",
  successMetric: "One cold user reaches the useful output without help",
  horizon: "2 days",
  constraints: "free and local-first",
  items: parseItemsFromLines([
    "Build output contract | leveraged | 45 | 5 | 5 | 4",
    "Draft main artifact | high_density | 90 | 4 | 5 | 4",
    "Clean old todos | low_density | 30 | 1 | 2 | 5",
    "Wait for missing owner | latent | 20 | 1 | 3 | 2 | owner unknown",
  ].join("\n")),
};

test("buildPlan returns a bounded plan with ordered cognitive phases", () => {
  const plan = buildPlan(input);
  assert.equal(plan.schema_version, "cognitime.plan.v1");
  assert.equal(plan.phases[0].key, "leveraged");
  assert.equal(plan.phases.at(-1).key, "latent");
  assert.equal(plan.next_action, "Build output contract");
  assert.equal(plan.metrics.total_minutes, 185);
  assert.ok(plan.metrics.cds > 0);
});

test("buildPlan rejects missing core input", () => {
  assert.throws(() => buildPlan({ goal: "", successMetric: "metric", items: [] }), /Goal is required/);
  assert.throws(() => buildPlan({ goal: "x", successMetric: "", items: [] }), /Success metric is required/);
  assert.throws(() => buildPlan({ goal: "x", successMetric: "y", items: [] }), /At least one work item/);
});

test("exports produce downstream-usable artifacts", () => {
  const plan = buildPlan(input);
  const md = planToMarkdown(plan);
  const csv = planToCsv(plan);
  const ics = planToIcs(plan, "2026-01-01T09:00:00Z");
  assert.match(md, /## Phases/);
  assert.match(csv, /"plan_id","phase","title"/);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /BEGIN:VEVENT/);
});

test("CSV export neutralizes spreadsheet formula injection", () => {
  const plan = buildPlan({
    goal: "CSV safety",
    successMetric: "Malicious-looking cell remains inert",
    items: [{ title: "=IMPORTXML(\"https://bad.example\")", type: "high_density", minutes: 20 }],
  });
  const csv = planToCsv(plan);
  assert.match(csv, /"'=IMPORTXML/);
});

test("ledger summarizes density, latency, leverage, and re-ramp cost", () => {
  const summary = summarizeLedger([
    { label: "deep build", type: "high_density", minutes: 60, density: 90, leverage: 4, context_switches: 1, re_ramp_minutes: 5 },
    { label: "blocked wait", type: "latent", minutes: 30, density: 10, leverage: 1, context_switches: 2, re_ramp_minutes: 20 },
  ]);
  assert.equal(summary.metrics.total_minutes, 90);
  assert.equal(summary.metrics.ltr, 33);
  assert.equal(summary.metrics.sessions, 2);
  assert.equal(summary.metrics.rci, 8.3);
});
