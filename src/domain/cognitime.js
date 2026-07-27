const PHASE_META = {
  leveraged: {
    label: "Leveraged",
    order: 1,
    description: "Work that unlocks several downstream tasks or reduces repeated effort.",
  },
  high_density: {
    label: "High-density",
    order: 2,
    description: "Novel creation, design, analysis, writing, or implementation requiring deep focus.",
  },
  low_density: {
    label: "Low-density",
    order: 3,
    description: "Necessary overhead that should be batched, delegated, templated, or timeboxed.",
  },
  latent: {
    label: "Latent / blocked",
    order: 4,
    description: "Blocked, unclear, waiting, or dependency-bound work that needs an unblock protocol.",
  },
};

const TYPE_DEFAULTS = {
  leveraged: { density: 82, leverage: 5 },
  high_density: { density: 90, leverage: 3 },
  low_density: { density: 42, leverage: 1 },
  latent: { density: 18, leverage: 1 },
};

function clamp(number, min, max) {
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function asText(value, maxLength = 4000) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function csvSafe(value) {
  const text = asText(value, 10000);
  const protectedText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

function slugify(value) {
  return asText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function normalizeDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function normalizeItem(raw, index) {
  const title = asText(raw.title, 240);
  if (!title) throw new Error(`Work item ${index + 1} is missing a title.`);
  const explicitType = asText(raw.type || raw.sessionType || raw.phase, 40).toLowerCase();
  const blocked = Boolean(raw.blocked) || explicitType === "latent" || explicitType === "blocked";
  let type = explicitType.replace("-", "_");
  if (type === "high") type = "high_density";
  if (type === "low") type = "low_density";
  if (type === "lever") type = "leveraged";
  if (!Object.hasOwn(PHASE_META, type)) type = blocked ? "latent" : "high_density";
  if (blocked) type = "latent";

  const defaults = TYPE_DEFAULTS[type === "latent" ? "latent" : type];
  const minutes = clamp(Number(raw.minutes ?? raw.estimateMinutes ?? 45), 5, 1440);
  const leverage = clamp(Number(raw.leverage ?? defaults.leverage), 1, 5);
  const density = clamp(Number(raw.density ?? defaults.density), 0, 100);
  const urgency = clamp(Number(raw.urgency ?? 3), 1, 5);
  const confidence = clamp(Number(raw.confidence ?? 3), 1, 5);
  const dependency = asText(raw.dependency || raw.blocker || "", 400);
  const evidence = asText(raw.evidence || raw.source || "", 500);
  const output = asText(raw.output || raw.deliverable || "", 500);

  const phasePenalty = type === "latent" ? 38 : type === "low_density" ? 16 : 0;
  const score = Math.round(
    leverage * 24 + density * 0.42 + urgency * 8 + confidence * 5 - minutes / 18 - phasePenalty,
  );

  return {
    id: asText(raw.id, 120) || `item-${index + 1}-${slugify(title)}`,
    title,
    type,
    minutes,
    leverage,
    density,
    urgency,
    confidence,
    blocked: type === "latent",
    dependency,
    evidence,
    output,
    score,
  };
}

function phaseFor(item) {
  return item.type;
}

function computeMetrics(items) {
  const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
  const blockedMinutes = items.filter((i) => i.blocked).reduce((sum, item) => sum + item.minutes, 0);
  const leveragedMinutes = items
    .filter((i) => i.type === "leveraged")
    .reduce((sum, item) => sum + item.minutes, 0);
  const weightedDensity = items.reduce((sum, item) => sum + item.density * item.minutes, 0);
  const leverageMinutes = items.reduce((sum, item) => sum + item.leverage * item.minutes, 0);
  const activeMinutes = Math.max(totalMinutes - blockedMinutes, 1);
  return {
    total_minutes: Math.round(totalMinutes),
    active_minutes: Math.round(activeMinutes),
    blocked_minutes: Math.round(blockedMinutes),
    cds: Math.round(weightedDensity / Math.max(totalMinutes, 1)),
    ltr: Math.round((blockedMinutes / Math.max(totalMinutes, 1)) * 100),
    ltf: Number((leverageMinutes / Math.max(totalMinutes, 1)).toFixed(2)),
    leveraged_minutes: Math.round(leveragedMinutes),
  };
}

function buildPhase(key, items) {
  const sorted = [...items].sort((a, b) => b.score - a.score || a.minutes - b.minutes);
  const minutes = sorted.reduce((sum, item) => sum + item.minutes, 0);
  const top = sorted[0];
  const protocol =
    key === "latent"
      ? "Convert every blocked item into one owner, one dependency, one evidence request, and one retry date. Do not treat waiting as work."
      : key === "low_density"
        ? "Batch overhead into one controlled block after leverage/high-density work. Timebox and export the residue."
        : key === "leveraged"
          ? "Ship unlockers first. Preserve reusable output so downstream work starts from a higher baseline."
          : "Protect an uninterrupted block. Define the artifact before starting and stop when the artifact exists.";
  return {
    key,
    label: PHASE_META[key].label,
    description: PHASE_META[key].description,
    minutes,
    protocol,
    top_action: top?.title ?? "No action assigned.",
    items: sorted,
  };
}

export function buildPlan(input) {
  const goal = asText(input.goal, 500);
  if (!goal) throw new Error("Goal is required.");
  const successMetric = asText(input.successMetric || input.metrics, 1000);
  if (!successMetric) throw new Error("Success metric is required.");
  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (rawItems.length === 0) throw new Error("At least one work item is required.");
  if (rawItems.length > 80) throw new Error("Maximum 80 work items per plan.");

  const items = rawItems.map(normalizeItem);
  const grouped = new Map();
  for (const item of items) {
    const key = phaseFor(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  const phases = [...Object.keys(PHASE_META)]
    .filter((key) => grouped.has(key))
    .map((key) => buildPhase(key, grouped.get(key)))
    .sort((a, b) => PHASE_META[a.key].order - PHASE_META[b.key].order);
  const metrics = computeMetrics(items);
  const planId = `cog-${Date.now().toString(36)}-${slugify(goal)}`;
  const now = new Date().toISOString();
  return {
    schema_version: "cognitime.plan.v1",
    plan_id: planId,
    generated_at: now,
    goal,
    success_metric: successMetric,
    constraints: asText(input.constraints, 1000),
    horizon: asText(input.horizon, 200),
    metrics,
    phases,
    next_action: phases[0]?.top_action ?? items[0].title,
    re_ramp_protocol:
      "Before every session, read the goal, success metric, current phase protocol, and last completed output. Then do one visible action within ten minutes.",
    claim_boundary:
      "This is a deterministic planning aid, not proof of productivity gain, clinical cognitive assessment, or automated project success.",
  };
}

export function parseItemsFromLines(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    return {
      title: parts[0],
      type: parts[1] || undefined,
      minutes: parts[2] ? Number(parts[2]) : undefined,
      leverage: parts[3] ? Number(parts[3]) : undefined,
      urgency: parts[4] ? Number(parts[4]) : undefined,
      confidence: parts[5] ? Number(parts[5]) : undefined,
      dependency: parts[6] || undefined,
    };
  });
}

export function planToMarkdown(plan) {
  const lines = [
    `# ${plan.goal}`,
    "",
    `- Plan ID: \`${plan.plan_id}\``,
    `- Generated: ${plan.generated_at}`,
    `- Success metric: ${plan.success_metric}`,
    `- Horizon: ${plan.horizon || "not specified"}`,
    `- Next action: **${plan.next_action}**`,
    "",
    "## Cognitive-time metrics",
    "",
    `- CDS: ${plan.metrics.cds}`,
    `- LTR: ${plan.metrics.ltr}%`,
    `- LTF: ${plan.metrics.ltf}`,
    `- Total minutes: ${plan.metrics.total_minutes}`,
    `- Blocked minutes: ${plan.metrics.blocked_minutes}`,
    "",
    "## Phases",
  ];
  for (const phase of plan.phases) {
    lines.push("", `### ${phase.label}`, "", phase.description, "", `Protocol: ${phase.protocol}`, "");
    phase.items.forEach((item, index) => {
      lines.push(
        `${index + 1}. **${item.title}** — ${item.minutes}m, score ${item.score}, leverage ${item.leverage}/5${item.dependency ? `, dependency: ${item.dependency}` : ""}`,
      );
    });
  }
  lines.push("", "## Re-ramp protocol", "", plan.re_ramp_protocol, "", "## Claim boundary", "", plan.claim_boundary);
  return lines.join("\n");
}

export function planToCsv(plan) {
  const rows = [["plan_id", "phase", "title", "minutes", "score", "leverage", "density", "urgency", "confidence", "blocked", "dependency", "output"]];
  for (const phase of plan.phases) {
    for (const item of phase.items) {
      rows.push([
        plan.plan_id,
        phase.key,
        item.title,
        item.minutes,
        item.score,
        item.leverage,
        item.density,
        item.urgency,
        item.confidence,
        item.blocked ? "true" : "false",
        item.dependency,
        item.output,
      ]);
    }
  }
  return rows.map((row) => row.map(csvSafe).join(",")).join("\n");
}

export function planToIcs(plan, startDateInput) {
  const start = normalizeDate(startDateInput);
  let cursor = new Date(start);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dateTime = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escape = (text) => asText(text, 600).replace(/[,;]/g, "\\$&");
  const events = [];
  for (const phase of plan.phases) {
    for (const item of phase.items) {
      const end = new Date(cursor.getTime() + item.minutes * 60_000);
      events.push([
        "BEGIN:VEVENT",
        `UID:${plan.plan_id}-${item.id}@cognitime-ops`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dateTime(cursor)}`,
        `DTEND:${dateTime(end)}`,
        `SUMMARY:${escape(item.title)}`,
        `DESCRIPTION:${escape(`${phase.label}: ${phase.protocol}`)}`,
        "END:VEVENT",
      ].join("\r\n"));
      cursor = new Date(end.getTime() + 15 * 60_000);
    }
  }
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CogniTime Ops//Execution Map//EN", ...events, "END:VCALENDAR", ""].join("\r\n");
}

export function summarizeLedger(events) {
  const normalized = (Array.isArray(events) ? events : []).map((event, index) => {
    const type = asText(event.type || event.time_type || "high_density", 40).replace("-", "_");
    const minutes = clamp(Number(event.minutes ?? event.duration_minutes ?? 0), 0, 1440);
    const density = clamp(Number(event.density ?? 50), 0, 100);
    const leverage = clamp(Number(event.leverage ?? 1), 1, 5);
    const switches = clamp(Number(event.context_switches ?? 0), 0, 50);
    const reramp = clamp(Number(event.re_ramp_minutes ?? 0), 0, 600);
    return {
      id: asText(event.id, 120) || `event-${index + 1}`,
      label: asText(event.label || event.title || "Untitled session", 240),
      type: Object.hasOwn(PHASE_META, type) ? type : "high_density",
      minutes,
      density,
      leverage,
      context_switches: switches,
      re_ramp_minutes: reramp,
    };
  });
  const total = normalized.reduce((sum, e) => sum + e.minutes, 0);
  const blocked = normalized.filter((e) => e.type === "latent").reduce((sum, e) => sum + e.minutes, 0);
  const densityWeighted = normalized.reduce((sum, e) => sum + e.minutes * e.density, 0);
  const leverageWeighted = normalized.reduce((sum, e) => sum + e.minutes * e.leverage, 0);
  const switches = normalized.reduce((sum, e) => sum + e.context_switches, 0);
  const reramp = normalized.reduce((sum, e) => sum + e.re_ramp_minutes, 0);
  return {
    events: normalized,
    metrics: {
      total_minutes: Math.round(total),
      cds: Math.round(densityWeighted / Math.max(total, 1)),
      ltr: Math.round((blocked / Math.max(total, 1)) * 100),
      ltf: Number((leverageWeighted / Math.max(total, 1)).toFixed(2)),
      rci: switches ? Number((reramp / switches).toFixed(1)) : 0,
      sessions: normalized.length,
    },
  };
}

export const __test__ = { asText, csvSafe, slugify, normalizeItem, computeMetrics, PHASE_META };
