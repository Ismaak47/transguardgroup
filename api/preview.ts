export default async function handler(req, res) {
  try {
    const response = await fetch("https://transguardgroup.com/");
    let html = await response.text();
    
    // Replace the specific nav links and enforce capitalization
    html = html.replace(/>\s*Supplier Login\s*</gi, '>USER LOGIN<');
    html = html.replace(/>\s*Careers\s*</gi, '>APPLICATION<');

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
    
    res.status(response.status).send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching site");
  }
}
