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
// Analytics (PostHog) and advertising measurement (Google Ads) are non-essential and
// each stays off until the visitor opts in. The language preference (ls_locale) is
// functional/strictly-necessary and is not gated.
// Consent shape: { analytics: bool, marketing: bool, ts: number }. A choice stored before
// the Advertising toggle existed has no `marketing` field: it reads as advertising off and
// the banner does not ask again.
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
export function hasMarketingConsent() {
  const c = getConsent();
  return !!(c && c.marketing === true);
}

// Campaign tags on the landing URL, read once at load before the app cleans the address:
// query tags (?utm_source=...) and the blog's fragment form (#start&utm_source=blog&...).
// Kept in memory only (nothing is stored before analytics consent). funnel_started carries
// them, and PostHog gets them as session properties once it starts, so blog -> analysis
// starts are countable per article.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const _utm = {};
try {
  [window.location.search, window.location.hash.replace(/^#/, "")].forEach((part) => {
    const q = new URLSearchParams(part);
    UTM_KEYS.forEach((k) => { const v = q.get(k); if (v && !_utm[k]) _utm[k] = v.slice(0, 200); });
  });
} catch (e) {}
export function landingUtm() {
  return { ..._utm };
}

// Google click ids on the landing URL (?gclid=, or ?gbraid= / ?wbraid= on iOS), read once at
// load: the app may clean the address bar (?start=1) before the visitor answers the banner.
// Kept in memory only and handed to the Google tag as page_location, so an ad click is
// still attributed when advertising consent comes a few seconds after landing.
let _adsLanding = null;
try {
  const q = new URLSearchParams(window.location.search);
  if (q.get("gclid") || q.get("gbraid") || q.get("wbraid")) _adsLanding = window.location.origin + window.location.pathname + window.location.search;
} catch (e) {}

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
      if (Object.keys(_utm).length) posthog.register_for_session({ ..._utm });
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

// ── Google Ads conversion measurement ───────────────────────────────────────
// Runs only with advertising consent (the banner's Advertising toggle). Without it the
// Google tag is never loaded, so nothing reaches Google Ads (basic consent mode).
// With it, the tag runs with ad storage on and ad personalization off: it measures which ad
// clicks end in a purchase and builds no remarketing audiences. Enhanced conversions are
// off, so no email or other user data is sent.
const ADS_ID = "AW-18594430123";
const ADS_PURCHASE = ADS_ID + "/1NqJCJ2v8r4dEKv5waJF"; // conversion action "LinkedScore report purchase"
let _adsOn = false;

// The address handed to the tag: the ad landing URL when there was one, otherwise the page
// without its query (a Stripe session id or a sign-in token can sit there briefly) and
// without a report id.
function adsPageLocation() {
  if (_adsLanding) return _adsLanding;
  return window.location.origin + window.location.pathname.replace(/^\/plan\/[^/]+/, "/plan/");
}

// Removes the tag's click-id storage (_gcl_* cookies and keys). Used when advertising
// consent is missing or withdrawn. Nothing else on the site uses this prefix.
function purgeAdsStorage() {
  try {
    Object.keys(window.localStorage).filter((k) => k.indexOf("_gcl_") === 0).forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {}
  try {
    const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n.indexOf("_gcl_") === 0);
    if (!names.length) return;
    // The tag sets its cookies on the parent domain (.linkedscore.app): expire them on the
    // host and on every parent domain; browsers ignore the public-suffix ones.
    const parts = window.location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < parts.length - 1; i++) domains.push("; domain=." + parts.slice(i).join("."));
    names.forEach((n) => domains.forEach((d) => { document.cookie = n + "=; Max-Age=0; path=/" + d; }));
  } catch (e) {}
}

export function initAds() {
  if (typeof window === "undefined") return;
  try {
    if (!hasMarketingConsent()) { purgeAdsStorage(); return; } // never load Google without opt-in
    if (_adsOn) {
      // Already loaded on this page: advertising was switched off and on again in the banner.
      window.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted" });
      return;
    }
    _adsOn = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied", analytics_storage: "denied" });
    window.gtag("js", new Date());
    window.gtag("config", ADS_ID, { page_location: adsPageLocation(), allow_ad_personalization_signals: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ADS_ID;
    document.head.appendChild(s);
  } catch (e) {}
}

// Advertising switched off in the banner: stop the tag's ad storage if it already ran on
// this page, and remove the click ids it stored.
export function revokeAds() {
  try { if (_adsOn && typeof window.gtag === "function") window.gtag("consent", "update", { ad_storage: "denied", ad_user_data: "denied" }); } catch (e) {}
  purgeAdsStorage();
}

// Google gets a one-way hash of the order reference, never the reference itself: a Stripe
// session id returns the buyer's email and report id from /api/pay-status, and a report id
// opens the paid report through /api/get-plan. The same order always hashes to the same
// value, so Google still dedupes on it. Resolves to "" when hashing is unavailable.
function adsOrderRef(tid) {
  try {
    const subtle = window.crypto && window.crypto.subtle;
    if (!tid || !subtle || typeof TextEncoder === "undefined") return Promise.resolve("");
    return subtle.digest("SHA-256", new TextEncoder().encode("linkedscore-ads:" + tid))
      .then((buf) => "ls_" + Array.from(new Uint8Array(buf).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join(""))
      .catch(() => "");
  } catch (e) { return Promise.resolve(""); }
}

// One paid report = one Google Ads conversion. A no-op without advertising consent, sent at
// most once per transaction id in this tab (Google also dedupes on transaction_id), and it
// never throws, so it can never break the unlock flow.
const ADS_SENT_KEY = "ls_ads_sent_v1";
const _adsSent = new Set();
export function trackAdsPurchase(opts) {
  try {
    const { value, currency, transactionId } = opts || {};
    if (typeof window === "undefined" || !hasMarketingConsent()) return;
    initAds();
    if (typeof window.gtag !== "function") return;
    const tid = transactionId ? String(transactionId).slice(0, 200) : "";
    if (tid) {
      if (_adsSent.has(tid)) return;
      let sent = [];
      try { sent = JSON.parse(sessionStorage.getItem(ADS_SENT_KEY) || "[]"); } catch (e) { sent = []; }
      if (!Array.isArray(sent)) sent = [];
      _adsSent.add(tid);
      if (sent.indexOf(tid) !== -1) return;
      try { sessionStorage.setItem(ADS_SENT_KEY, JSON.stringify(sent.concat(tid).slice(-20))); } catch (e) {}
    }
    const params = {
      send_to: ADS_PURCHASE,
      value: typeof value === "number" && isFinite(value) && value > 0 ? value : 9.99,
      currency: currency || "EUR",
    };
    const send = (ref) => {
      try {
        if (!hasMarketingConsent()) return; // withdrawn while the hash was computed
        if (ref) params.transaction_id = ref;
        window.gtag("event", "conversion", params);
      } catch (e) {}
    };
    adsOrderRef(tid).then(send, () => send(""));
  } catch (e) {}
}
