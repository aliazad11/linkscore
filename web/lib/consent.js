// Analytics consent on the blog. Same storage key and shape as the app (analytics.js), and the
// blog is served on the same origin (www.linkedscore.app/blog via the rewrite in vercel.json),
// so one decision covers both: decide on an article and the app does not ask again, and a
// "Reject all" in the app keeps PostHog off the blog too. Consent shape: { analytics, ts }.
import { CONSENT_STRINGS } from "./consent-strings";

const CONSENT_KEY = "ls_consent_v1";
// Fired on window after the banner stores a decision, so PostHogInit can react on this page.
export const CONSENT_EVENT = "ls:consent";

export function isConsentKey(key) {
  return key === CONSENT_KEY;
}

export function getConsent() {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY));
    return v && typeof v === "object" ? v : null;
  } catch (e) {
    return null;
  }
}

export function setConsent(c) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) {}
  try { window.dispatchEvent(new Event(CONSENT_EVENT)); } catch (e) {}
}

export function hasAnalyticsConsent() {
  const c = getConsent();
  return !!(c && c.analytics);
}

// Banner language: the language saved in the app first, then the browser languages, then
// English. The blog has no language prefix in its URLs, so this is the app's own order
// (i18n.jsx detectLocale) minus the path check.
const SUPPORTED = Object.keys(CONSENT_STRINGS);
export function consentLocale() {
  try {
    const saved = localStorage.getItem("ls_locale");
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
  } catch (e) {}
  try {
    const langs = navigator.languages || [navigator.language || "en"];
    for (const l of langs) {
      const base = String(l).slice(0, 2).toLowerCase();
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
  } catch (e) {}
  return "en";
}

export function consentText(locale) {
  return { ...CONSENT_STRINGS.en, ...(CONSENT_STRINGS[locale] || {}) };
}

// PostHog keeps its ids under ph_* and __ph_* names in cookies, localStorage and
// sessionStorage. Before this gate the blog set them for every reader, so they are removed
// whenever analytics consent is missing. Nothing else on the site uses these prefixes.
function isPostHogName(name) {
  return name.indexOf("ph_") === 0 || name.indexOf("__ph_") === 0;
}

export function purgeAnalyticsStorage() {
  [window.localStorage, window.sessionStorage].forEach((store) => {
    try {
      Object.keys(store).filter(isPostHogName).forEach((k) => store.removeItem(k));
    } catch (e) {}
  });
  try {
    const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(isPostHogName);
    if (!names.length) return;
    // PostHog sets its cookie on the parent domain (.linkedscore.app), so expire it on the
    // host and on every parent domain; browsers ignore the public-suffix ones.
    const parts = window.location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < parts.length - 1; i++) domains.push("; domain=." + parts.slice(i).join("."));
    names.forEach((n) => domains.forEach((d) => {
      document.cookie = n + "=; Max-Age=0; path=/" + d;
    }));
  } catch (e) {}
}
