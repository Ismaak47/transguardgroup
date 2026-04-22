/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyntheticEvent } from 'react';

export default function App() {
  const handleIframeLoad = (e: SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const iframe = e.target as HTMLIFrameElement;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        // Inject a style block to hide the floating recaptcha badge perfectly
        const style = doc.createElement('style');
        style.textContent = `
          .grecaptcha-badge { 
            visibility: hidden !important; 
            opacity: 0 !important; 
            display: none !important; 
            pointer-events: none !important;
          }
        `;
        doc.head.appendChild(style);
      }
    } catch (err) {
      console.error("Could not inject iframe styles:", err);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <iframe 
        src="/api/preview" 
        onLoad={handleIframeLoad}
        style={{ width: '100%', height: '100%', border: 'none' }} 
        title="Transguard Group Preview"
      />
    </div>
  );
}
