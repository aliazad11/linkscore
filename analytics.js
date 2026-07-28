// Lightweight PostHog wrapper. Cleanly no-ops until VITE_POSTHOG_KEY is set,
// so it ships disabled and switches on the moment the key is configured in env.
// posthog-js is lazy-loaded so it never blocks first paint; events fired before
// it finishes loading are queued and flushed once it's ready.
let _ph = null;
const _queue = [];

// PostHog project token — write-only, public-safe key (fine to ship in client code).
// Env var overrides it if you ever rotate. Region: EU Cloud.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "phc_spF8qvv4nf2kqeURp9rUCccDZjRCReamUeHZMytVDk4y";
// Reverse proxy: events route through our own domain (vercel.json /ingest rewrites)
// so ad blockers that blanket-block posthog.com domains don't drop the tracking.
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://www.linkedscore.app/ingest";

// ── Consent (GDPR) ──────────────────────────────────────────────────────────
// Analytics (PostHog) is non-essential and stays off until the visitor opts in.
// The language preference (ls_locale) is functional/strictly-necessary and is
// not gated. Consent shape: { analytics: bool, ts: number }.
const CONSENT_KEY = "ls_consent_v1";
export function getConsent() {
  try { const v = JSON.parse(localStorage.getItem(CONSENT_KEY)); return v && typeof v === "object" ? v : null; }
  catch (e) { return null; }
}
export function setConsent(c) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) {}
}
export function hasAnalyticsConsent() {
  const c = getConsent();
  return !!(c && c.analytics);
}

export function initAnalytics() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return; // never load analytics without opt-in
  if (_ph) return; // already initialized
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        ui_host: "https://eu.posthog.com",
        capture_pageview: true,
        autocapture: true,
        disable_surveys: true,
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
