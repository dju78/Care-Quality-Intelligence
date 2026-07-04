import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { initSchema, ensureDefaultConfig } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import { router } from "./routes.js";
import { adminRouter } from "./adminRoutes.js";
import { importRouter } from "./importRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4001;

initSchema();
ensureDefaultConfig();
seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Aldanat Quality Intelligence API" }));
app.use("/api", router);
app.use("/api/admin", adminRouter);
app.use("/api/import", importRouter);

// In production, serve the built client alongside the API.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

app.listen(PORT, () => {
  console.log(`AQI API listening on http://localhost:${PORT}`);
});
