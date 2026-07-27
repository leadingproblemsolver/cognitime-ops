import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const port = Number(process.env.PORT || 4173);
const types = new Map([[".html", "text/html"], [".js", "text/javascript"], [".css", "text/css"], [".json", "application/json"]]);
const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  let target = normalize(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^\/+/, "");
  if (target.includes("..")) {
    res.writeHead(400); res.end("bad path"); return;
  }
  const file = join(root, target);
  if (!existsSync(file)) {
    res.writeHead(404); res.end("not found"); return;
  }
  res.writeHead(200, { "content-type": types.get(extname(file)) || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
server.listen(port, "127.0.0.1", () => console.log(`CogniTime Ops: http://127.0.0.1:${port}`));
