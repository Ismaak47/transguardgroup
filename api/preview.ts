export default async function handler(req, res) {
  const targetPath = req.query?.path ? decodeURIComponent(req.query.path) : '/';
  
  try {
    const fetchUrl = new URL(targetPath, "https://transguardgroup.com").href;
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    let html = await response.text();
    
    // Replace the specific nav links and enforce capitalization
    html = html.replace(/>\s*Supplier Login\s*</gi, '>USER LOGIN<');
    html = html.replace(/>\s*Careers\s*</gi, '>APPLICATION<');

    // Inject Application dropdown identical to Services dropdown
    html = html.replace(
      /<li id="menu-item-889"[^>]*>.*?<\/li>/is,
      `<li id="menu-item-889" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children menu-item-889 nav-item ">
        <a href="#" class="nav-link ">APPLICATION</a>
        <ul class="sub-menu dropdown-content drop-tg">
          <li class="menu-item menu-item-type-post_type nav-item "><a href="/apply-now/" class="nav-link ">APPLY NOW</a></li>
          <li class="menu-item menu-item-type-post_type nav-item "><a href="/selected-applicant/" class="nav-link ">SELECTED APPLICANTS</a></li>
        </ul>
      </li>`
    );

    // Prevent mobile dropdown "refused to connect" bug by adding preventDefault to empty hash links
    html = html.replace(/href="#"/g, 'href="#" onclick="event.preventDefault();"');

    // Inject DNS prefetching, preconnections, base tag, link interceptor, and recaptcha hider
    html = html.replace(/<\/head>/i, `
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
            if (!link) return;
            var hrefAttr = (link.getAttribute('href') || '').trim();
            
            // Handle Hash Links (fixes the mobile dropdown "refused to connect" bug caused by <base> tags)
            if (hrefAttr.startsWith('#')) {
              e.preventDefault();
              if (hrefAttr.length > 1) {
                try {
                  var targetEl = document.getElementById(hrefAttr.substring(1)) || document.querySelector('[name="' + hrefAttr.substring(1) + '"]');
                  if (targetEl) targetEl.scrollIntoView();
                } catch(err) {}
              }
              return;
            }

            if (!hrefAttr || hrefAttr.startsWith('javascript:') || !link.href) return;
            
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

    // Copy headers but strip iframe-blocking and native encodings so express can format
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

    // Force Vercel's Edge Network to cache the payload (Stale-While-Revalidate caching) to skip the fetching hop entirely for most users
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    
    res.status(response.status).send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching site");
  }
}

