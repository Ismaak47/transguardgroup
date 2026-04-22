import express from "express";
import { createServer as createViteServer } from "vite";
import https from "https";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route to bypass CORS & iframe protections
  app.get("/api/preview", (req, res) => {
    https.get("https://transguardgroup.com/", (response) => {
      // Pass the status code
      res.status(response.statusCode || 200);
      
      // Copy headers, but strip ones that prevent iframing
      for (const key in response.headers) {
        if (key.toLowerCase() !== 'x-frame-options' && key.toLowerCase() !== 'content-security-policy') {
          res.setHeader(key, response.headers[key] as string | string[]);
        }
      }
      
      response.pipe(res);
    }).on('error', (err) => {
      console.error(err);
      res.status(500).send("Error fetching site");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
