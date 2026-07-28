"use client";

import { useEffect } from "react";

// Initializes PostHog on the blog. No-ops until NEXT_PUBLIC_POSTHOG_KEY is set.
// The blog is served under the same www.linkedscore.app domain as the analyzer,
// so using the same project key links a "read a post -> get your score" journey
// into one session automatically via autocapture.
export default function PostHogInit() {
  useEffect(() => {
    // Public-safe write-only project token (same key as the analyzer so blog -> funnel
    // is one journey). Env var overrides if you rotate. Region: EU Cloud.
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_spF8qvv4nf2kqeURp9rUCccDZjRCReamUeHZMytVDk4y";
    if (!key || typeof window === "undefined" || window.__ph_init) return;
    const boot = () =>
      import("posthog-js")
        .then(({ default: posthog }) => {
          if (window.__ph_init) return;
          posthog.init(key, {
            // Reverse proxy through the canonical domain (vercel.json /ingest rewrites)
            // so ad blockers don't drop tracking. ui_host keeps PostHog links working.
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://www.linkedscore.app/ingest",
            ui_host: "https://eu.posthog.com",
            capture_pageview: true,
            autocapture: true,
            disable_surveys: true,
            person_profiles: "identified_only",
          });
          window.__ph_init = true;
        })
        .catch(() => {});
    // Defer off the critical path on mobile.
    if ("requestIdleCallback" in window) requestIdleCallback(boot, { timeout: 4000 });
    else setTimeout(boot, 2500);
  }, []);
  return null;
}
