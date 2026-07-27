import { buildPlan, parseItemsFromLines, planToCsv, planToIcs, planToMarkdown, summarizeLedger } from "./domain/cognitime.js";

const STORAGE_KEY = "cognitime.ops.v1";
const $ = (selector) => document.querySelector(selector);
const state = loadState();

const sampleItems = [
  "Define single measurable success metric | leveraged | 35 | 5 | 5 | 4",
  "Draft first artifact users can judge | high_density | 90 | 4 | 5 | 4",
  "Create validation checklist | leveraged | 45 | 5 | 4 | 5",
  "Clean duplicated notes and old branches | low_density | 40 | 1 | 2 | 5",
  "Wait for unclear stakeholder approval | latent | 30 | 1 | 3 | 2 | missing owner",
].join("\n");

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { plans: [], ledger: [] };
  } catch {
    return { plans: [], ledger: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setStatus(message, tone = "info") {
  const el = $("#status");
  el.textContent = message;
  el.dataset.tone = tone;
}

function download(name, body, type = "text/plain") {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function renderPlan(plan) {
  const target = $("#plan-output");
  if (!plan) {
    target.innerHTML = '<p class="muted">No execution map generated yet.</p>';
    return;
  }
  const phaseHtml = plan.phases.map((phase) => `
    <section class="phase-card ${phase.key}">
      <div class="phase-head"><span>${phase.label}</span><strong>${phase.minutes}m</strong></div>
      <p>${phase.description}</p>
      <p class="protocol">${phase.protocol}</p>
      <ol>${phase.items.map((item) => `<li><strong>${item.title}</strong><span>${item.minutes}m · score ${item.score} · L${item.leverage}/5</span>${item.dependency ? `<em>Dependency: ${item.dependency}</em>` : ""}</li>`).join("")}</ol>
    </section>`).join("");
  target.innerHTML = `
    <section class="summary-card">
      <h2>${plan.goal}</h2>
      <p>${plan.success_metric}</p>
      <div class="metrics">
        <div><span>CDS</span><strong>${plan.metrics.cds}</strong></div>
        <div><span>LTR</span><strong>${plan.metrics.ltr}%</strong></div>
        <div><span>LTF</span><strong>${plan.metrics.ltf}</strong></div>
        <div><span>Total</span><strong>${plan.metrics.total_minutes}m</strong></div>
      </div>
      <p class="next"><strong>Next action:</strong> ${plan.next_action}</p>
    </section>
    ${phaseHtml}
  `;
}

function renderLedger() {
  const summary = summarizeLedger(state.ledger);
  $("#ledger-output").innerHTML = `
    <div class="metrics small">
      <div><span>Sessions</span><strong>${summary.metrics.sessions}</strong></div>
      <div><span>Minutes</span><strong>${summary.metrics.total_minutes}</strong></div>
      <div><span>CDS</span><strong>${summary.metrics.cds}</strong></div>
      <div><span>LTR</span><strong>${summary.metrics.ltr}%</strong></div>
      <div><span>RCI</span><strong>${summary.metrics.rci}</strong></div>
    </div>
    <ul class="ledger-list">${summary.events.slice(-8).reverse().map((e) => `<li><strong>${e.label}</strong><span>${e.type} · ${e.minutes}m · density ${e.density}</span></li>`).join("") || "<li>No ledger sessions yet.</li>"}</ul>
  `;
}

function latestPlan() {
  return state.plans[state.plans.length - 1];
}

function generatePlan(event) {
  event.preventDefault();
  try {
    const plan = buildPlan({
      goal: $("#goal").value,
      successMetric: $("#successMetric").value,
      constraints: $("#constraints").value,
      horizon: $("#horizon").value,
      items: parseItemsFromLines($("#items").value),
    });
    state.plans.push(plan);
    saveState();
    renderPlan(plan);
    setStatus("Execution map generated locally. No data left this browser.", "success");
  } catch (error) {
    setStatus(error.message, "danger");
  }
}

function exportLatest(kind) {
  const plan = latestPlan();
  if (!plan) return setStatus("Generate a plan first.", "danger");
  if (kind === "json") return download(`${plan.plan_id}.json`, JSON.stringify(plan, null, 2), "application/json");
  if (kind === "csv") return download(`${plan.plan_id}.csv`, planToCsv(plan), "text/csv");
  if (kind === "ics") return download(`${plan.plan_id}.ics`, planToIcs(plan), "text/calendar");
  return download(`${plan.plan_id}.md`, planToMarkdown(plan), "text/markdown");
}

function addLedger(event) {
  event.preventDefault();
  const entry = {
    id: `ledger-${Date.now().toString(36)}`,
    label: $("#sessionLabel").value,
    type: $("#sessionType").value,
    minutes: Number($("#sessionMinutes").value),
    density: Number($("#sessionDensity").value),
    leverage: Number($("#sessionLeverage").value),
    context_switches: Number($("#contextSwitches").value),
    re_ramp_minutes: Number($("#rerampMinutes").value),
  };
  state.ledger.push(entry);
  saveState();
  renderLedger();
  setStatus("Session added to local ledger.", "success");
}

function importWorkspace(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.plans) || !Array.isArray(data.ledger)) throw new Error("Invalid workspace export.");
      state.plans = data.plans;
      state.ledger = data.ledger;
      saveState();
      renderPlan(latestPlan());
      renderLedger();
      setStatus("Workspace imported.", "success");
    } catch (error) {
      setStatus(error.message, "danger");
    }
  };
  reader.readAsText(file);
}

function init() {
  $("#items").value = sampleItems;
  $("#planner-form").addEventListener("submit", generatePlan);
  $("#ledger-form").addEventListener("submit", addLedger);
  document.querySelectorAll("[data-export]").forEach((btn) => btn.addEventListener("click", () => exportLatest(btn.dataset.export)));
  $("#export-workspace").addEventListener("click", () => download("cognitime-workspace.json", JSON.stringify(state, null, 2), "application/json"));
  $("#import-workspace").addEventListener("change", (e) => e.target.files[0] && importWorkspace(e.target.files[0]));
  $("#clear-local").addEventListener("click", () => {
    if (confirm("Delete all local CogniTime plans and ledger entries from this browser?")) {
      state.plans = [];
      state.ledger = [];
      saveState();
      renderPlan(null);
      renderLedger();
      setStatus("Local workspace cleared.", "success");
    }
  });
  renderPlan(latestPlan());
  renderLedger();
}

init();
