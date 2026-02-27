import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// API Routes
app.get("/api/trees", async (req, res) => {
  const { data, error } = await supabase
    .from("trees")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get("/api/trees/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("trees")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

app.post("/api/trees", async (req, res) => {
  const { id, name, case_number, data } = req.body;
  const { error } = await supabase.from("trees").upsert({
    id: id || undefined,
    name,
    case_number,
    data
  }, { onConflict: "id" });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get("/api/trees/:id/logs", async (req, res) => {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("case_id", req.params.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/trees/:id/logs", async (req, res) => {
  const { user_email, action, details } = req.body;
  const { error } = await supabase.from("audit_logs").insert({
    case_id: req.params.id,
    user_email,
    action,
    details
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Vite middleware for development or Static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the dev server if not in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
