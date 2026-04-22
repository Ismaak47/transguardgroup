import https from "https";

export default function handler(req, res) {
  // Acts as a proxy to fetch the website across standard Vercel environments
  https.get("https://transguardgroup.com/", (response) => {
    res.status(response.statusCode || 200);
    
    // Copy headers but strip iframe-blocking protections
    for (const key in response.headers) {
      if (key.toLowerCase() !== 'x-frame-options' && key.toLowerCase() !== 'content-security-policy') {
        res.setHeader(key, response.headers[key]);
      }
    }
    
    response.pipe(res);
  }).on('error', (err) => {
    console.error(err);
    res.status(500).send("Error fetching site");
  });
}
