import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route to bypass CORS & iframe protections
  app.get("/api/preview", async (req, res) => {
    try {
      const response = await fetch("https://transguardgroup.com/");
      let html = await response.text();
      
      // Update specific text to match the requested capitalized words
      html = html.replace(/>\s*Supplier Login\s*</gi, '>USER LOGIN<');
      html = html.replace(/>\s*Careers\s*</gi, '>APPLICATION<');

      // Copy headers, but strip ones that prevent iframing or conflict with body injection
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'x-frame-options' && 
            lowerKey !== 'content-security-policy' && 
            lowerKey !== 'content-encoding' && 
            lowerKey !== 'content-length' && 
            lowerKey !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });
      
      res.status(response.status).send(html);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching site");
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
