"use client";

import { useEffect } from "react";

// Counts clicks on the article CTAs (the links marked data-ph-capture-attribute-cta,
// "blog-mid" and "blog-end") as Vercel Web Analytics custom events, so the CTA numbers
// cover every reader and not only those who accepted PostHog. The event holds the article
// slug and the CTA position only, and Vercel Web Analytics stores nothing on the device:
// the same basis as the pageview script in layout.jsx. For readers who accepted analytics,
// PostHog autocapture still records the same clicks with the full journey.
export default function CtaEvents() {
  useEffect(() => {
    // The insights script replays this queue when it loads; once loaded it replaces va.
    window.va = window.va || function va(...params) { (window.vaq = window.vaq || []).push(params); };
    const onClick = (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[data-ph-capture-attribute-cta]") : null;
      if (!a) return;
      const position = String(a.getAttribute("data-ph-capture-attribute-cta") || "").replace(/^blog-/, "");
      const m = window.location.pathname.match(/^\/blog\/([^/?#]+)/);
      try {
        window.va("event", { name: "Blog CTA", data: { slug: m ? m[1] : "blog", position } });
      } catch (err) {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
