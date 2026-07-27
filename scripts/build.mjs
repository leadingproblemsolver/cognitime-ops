import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dist = join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, "index.html"), join(dist, "index.html"));
await cp(join(root, "src"), join(dist, "src"), { recursive: true });
await writeFile(join(dist, ".nojekyll"), "");
for (const required of ["index.html", "src/app.js", "src/domain/cognitime.js", "src/styles.css"]) {
  if (!existsSync(join(dist, required))) throw new Error(`Missing build artifact: ${required}`);
}
console.log(`Built ${dist}`);
