import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// PWA service worker — production only (never cache Vite dev assets).
// Network-first passthrough: no staleness risk, offline shell fallback.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/igra/sw.js').catch(() => {});
  });
}
