"use client";

import { useEffect } from "react";
import { CONSENT_EVENT, hasAnalyticsConsent, isConsentKey, purgeAnalyticsStorage } from "../lib/consent";

// Starts PostHog on the blog, but only with analytics consent (the same ls_consent_v1 choice
// the app uses, see lib/consent.js). Without it nothing loads and any PostHog cookie or storage
// left from before the gate is removed. The blog is served under the same www.linkedscore.app
// domain as the analyzer, so for readers who accept, the same project key links a
// "read a post -> get your score" journey into one session via autocapture.
export default function PostHogInit() {
  useEffect(() => {
    // Public-safe write-only project token (same key as the analyzer so blog -> funnel
    // is one journey). Env var overrides if you rotate. Region: EU Cloud.
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_spF8qvv4nf2kqeURp9rUCccDZjRCReamUeHZMytVDk4y";
    if (!key || typeof window === "undefined") return;

    let requested = false;
    const boot = () => {
      if (requested || window.__ph_init || !hasAnalyticsConsent()) return;
      requested = true;
      import("posthog-js")
        .then(({ default: posthog }) => {
          if (window.__ph_init || !hasAnalyticsConsent()) return;
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
        .catch(() => { requested = false; });
    };

    // A decision made on this page (the banner) or in another tab (the app).
    const onDecision = () => {
      if (hasAnalyticsConsent()) { boot(); return; }
      // Consent withdrawn while PostHog runs on this page: reload, so it stops and the fresh
      // page clears its storage before anything else runs.
      if (window.__ph_init) { window.location.reload(); return; }
      purgeAnalyticsStorage();
    };
    const onStorage = (e) => { if (isConsentKey(e.key)) onDecision(); };

    if (hasAnalyticsConsent()) {
      // Defer off the critical path on mobile.
      if ("requestIdleCallback" in window) requestIdleCallback(boot, { timeout: 4000 });
      else setTimeout(boot, 2500);
    } else {
      purgeAnalyticsStorage();
    }
    window.addEventListener(CONSENT_EVENT, onDecision);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onDecision);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return null;
}
