"use client";

import { useEffect } from "react";

// Initializes PostHog on the blog. No-ops until NEXT_PUBLIC_POSTHOG_KEY is set.
// The blog is served under the same www.linkedscore.app domain as the analyzer,
// so using the same project key links a "read a post -> get your score" journey
// into one session automatically via autocapture.
export default function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === "undefined" || window.__ph_init) return;
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
          capture_pageview: true,
          autocapture: true,
          person_profiles: "identified_only",
        });
        window.__ph_init = true;
      })
      .catch(() => {});
  }, []);
  return null;
}
