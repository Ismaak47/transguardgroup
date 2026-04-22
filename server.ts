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

      // Inject DNS prefetching and preconnections directly into the proxied HTML's head for blazing fast image and asset loading
      html = html.replace('</head>', `
        <link rel="preconnect" href="https://transguardgroup.com" crossorigin>
        <link rel="dns-prefetch" href="https://transguardgroup.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.gstatic.com">
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
      </head>`);

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
      
      // Apply aggressive caching
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
      
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
