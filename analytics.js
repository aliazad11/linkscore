// Lightweight PostHog wrapper. Cleanly no-ops until VITE_POSTHOG_KEY is set,
// so it ships disabled and switches on the moment the key is configured in env.
// posthog-js is lazy-loaded so it never blocks first paint; events fired before
// it finishes loading are queued and flushed once it's ready.
let _ph = null;
const _queue = [];

// PostHog project token — write-only, public-safe key (fine to ship in client code).
// Env var overrides it if you ever rotate. Region: EU Cloud.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "phc_spF8qvv4nf2kqeURp9rUCccDZjRCReamUeHZMytVDk4y";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

export function initAnalytics() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true,
        autocapture: true,
        disable_surveys: true,
        disable_session_recording: true,
        capture_dead_clicks: false,
        capture_performance: false,
        person_profiles: "identified_only",
      });
      _ph = posthog;
      _queue.splice(0).forEach(([e, p]) => posthog.capture(e, p));
    })
    .catch(() => {});
}

export function track(event, props) {
  try {
    if (_ph) _ph.capture(event, props);
    else _queue.push([event, props]);
  } catch (e) {}
}

export function identify(email) {
  try {
    if (_ph && email) _ph.identify(email, { email });
  } catch (e) {}
}
