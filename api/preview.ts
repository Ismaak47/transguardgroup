export default async function handler(req, res) {
  try {
    const response = await fetch("https://transguardgroup.com/");
    let html = await response.text();
    
    // Replace the specific nav links and enforce capitalization
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
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    
    res.status(response.status).send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching site");
  }
}
