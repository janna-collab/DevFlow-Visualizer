import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy to GitHub API or handle repo analysis
  app.post("/api/analyze-repo", async (req, res) => {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    try {
      // Basic GitHub URL parsing
      // Expected: https://github.com/owner/repo
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub URL" });
      }

      const [_, owner, repo] = match;
      
      // Fetch file tree
      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
      let treeResponse = await fetch(treeUrl);
      
      if (!treeResponse.ok) {
        treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
      }

      if (!treeResponse.ok) {
        return res.status(404).json({ error: "Could not fetch repository tree." });
      }

      const treeData = await treeResponse.json();

      // Fetch recent commits (last 31 days)
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?since=${thirtyOneDaysAgo.toISOString()}`;
      const commitsResponse = await fetch(commitsUrl);
      const commitsData = commitsResponse.ok ? await commitsResponse.json() : [];

      res.json({ owner, repo, tree: treeData.tree, recentCommits: commitsData });
    } catch (error: any) {
      console.error("Error fetching repo:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
