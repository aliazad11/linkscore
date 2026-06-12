// Lightweight PostHog wrapper. Cleanly no-ops until VITE_POSTHOG_KEY is set,
// so it ships disabled and switches on the moment the key is configured in env.
// posthog-js is lazy-loaded so it never blocks first paint; events fired before
// it finishes loading are queued and flushed once it's ready.
let _ph = null;
const _queue = [];

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return;
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
        capture_pageview: true,
        autocapture: true,
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
