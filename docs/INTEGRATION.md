# Integration Contract

## Input contract

The browser UI accepts line-based work items.

```text
title | type | minutes | leverage | urgency | confidence | dependency
```

The domain module accepts structured input:

```js
buildPlan({
  goal: "Ship artifact",
  successMetric: "Cold user completes workflow",
  constraints: "free, local-first",
  horizon: "3 days",
  items: [
    {
      title: "Define success metric",
      type: "leveraged",
      minutes: 35,
      leverage: 5,
      urgency: 5,
      confidence: 4,
      dependency: ""
    }
  ]
})
```

## Output contract

`buildPlan()` returns:

```yaml
schema_version: cognitime.plan.v1
plan_id: string
generated_at: iso_datetime
goal: string
success_metric: string
constraints: string
horizon: string
metrics:
  total_minutes: number
  active_minutes: number
  blocked_minutes: number
  cds: number
  ltr: number
  ltf: number
  leveraged_minutes: number
phases:
  - key: leveraged | high_density | low_density | latent
    label: string
    description: string
    minutes: number
    protocol: string
    top_action: string
    items:
      - id: string
        title: string
        type: string
        minutes: number
        leverage: 1..5
        density: 0..100
        urgency: 1..5
        confidence: 1..5
        blocked: boolean
        dependency: string
        evidence: string
        output: string
        score: number
next_action: string
re_ramp_protocol: string
claim_boundary: string
```

## Export functions

```js
planToMarkdown(plan)
planToCsv(plan)
planToIcs(plan, optionalStartDate)
summarizeLedger(events)
```

## Downstream use

- Markdown: paste into README, GitHub issue, project memo, or work journal.
- JSON: pass into another script or archive as project context.
- CSV: inspect in spreadsheets; formula-like cells are neutralized.
- ICS: import planned blocks into a calendar.
- Workspace JSON: manual backup, transfer, or cold-user evidence artifact.

## Non-integration boundary

This release intentionally does not include automatic Notion publishing, calendar write APIs, OAuth, Supabase sync, AI generation, billing, or cross-device accounts. Those can be layered later after evidence shows the local-first workflow is useful.
