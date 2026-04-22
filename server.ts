import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route to bypass CORS & iframe protections
  app.get("/api/preview", async (req, res) => {
    const targetPath = req.query?.path ? decodeURIComponent(req.query.path as string) : '/';
    
    try {
      const fetchUrl = new URL(targetPath, "https://transguardgroup.com").href;
      const response = await fetch(fetchUrl);
      let html = await response.text();
      
      // Update specific text to match the requested capitalized words
      html = html.replace(/>\s*Supplier Login\s*</gi, '>USER LOGIN<');
      html = html.replace(/>\s*Careers\s*</gi, '>APPLICATION<');

      // Inject DNS prefetching, preconnections, base tag, link interceptor, and recaptcha hider
      html = html.replace('</head>', `
        <base href="https://transguardgroup.com/">
        <link rel="preconnect" href="https://transguardgroup.com" crossorigin>
        <link rel="dns-prefetch" href="https://transguardgroup.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.gstatic.com">
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
        <style>
          .grecaptcha-badge { 
            visibility: hidden !important; 
            opacity: 0 !important; 
            display: none !important; 
            pointer-events: none !important;
          }
        </style>
        <script>
          (function() {
            var prefetched = {};
            document.addEventListener('mouseover', function(e) {
              var link = e.target.closest('a');
              if (!link || !link.href) return;
              try {
                var url = new URL(link.href);
                if (url.hostname !== 'transguardgroup.com' && url.hostname !== window.location.hostname) return;
                if (url.protocol === 'mailto:' || url.protocol === 'tel:') return;
                if (url.pathname.match(/\\.(pdf|jpg|jpeg|png|gif|svg|mp4)$/i)) return;
                
                var targetPath = '/api/preview?path=' + encodeURIComponent(url.pathname + url.search + url.hash);
                if (!prefetched[targetPath]) {
                  prefetched[targetPath] = true;
                  var prefetchLink = document.createElement('link');
                  prefetchLink.rel = 'prefetch';
                  prefetchLink.href = window.location.origin + targetPath;
                  document.head.appendChild(prefetchLink);
                }
              } catch(err) {}
            }, { passive: true });

            document.addEventListener('click', function(e) {
              var link = e.target.closest('a');
              if (!link || !link.href) return;
              var hrefAttr = link.getAttribute('href');
              if (!hrefAttr || hrefAttr.startsWith('#') || hrefAttr.startsWith('javascript:')) return;
              
              try {
                var url = new URL(link.href);
                if (url.hostname !== 'transguardgroup.com' && url.hostname !== window.location.hostname) return;
                if (url.protocol === 'mailto:' || url.protocol === 'tel:') return;
                if (link.target === '_blank') return;
                if (url.pathname.match(/\\.(pdf|jpg|jpeg|png|gif|svg|mp4)$/i)) return; 
                
                e.preventDefault();
                e.stopPropagation();
                window.location.href = window.location.origin + '/api/preview?path=' + encodeURIComponent(url.pathname + url.search + url.hash);
              } catch(err) {}
            }, true);
          })();
        </script>
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
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
      
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
