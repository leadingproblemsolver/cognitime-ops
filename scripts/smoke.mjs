import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildPlan, parseItemsFromLines, planToCsv, planToIcs, planToMarkdown } from "../src/domain/cognitime.js";

const root = new URL("..", import.meta.url).pathname;
const required = ["dist/index.html", "dist/src/app.js", "dist/src/domain/cognitime.js", "dist/src/styles.css"];
for (const rel of required) {
  if (!existsSync(join(root, rel))) throw new Error(`Missing smoke artifact: ${rel}`);
}
const html = await readFile(join(root, "dist/index.html"), "utf8");
if (!html.includes("CogniTime Ops")) throw new Error("Built HTML does not contain product identity.");
const plan = buildPlan({
  goal: "Validate a local-first execution map",
  successMetric: "Exported artifacts are usable by a cold operator",
  horizon: "1 day",
  constraints: "offline only",
  items: parseItemsFromLines("Create artifact | leveraged | 30 | 5 | 5 | 4\nWrite README | high_density | 45 | 3 | 4 | 4"),
});
for (const output of [planToMarkdown(plan), planToCsv(plan), planToIcs(plan)]) {
  if (!output || output.length < 80) throw new Error("An export pathway produced an undersized result.");
}
console.log("Smoke check passed.");
