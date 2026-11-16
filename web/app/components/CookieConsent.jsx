"use client";

import { useEffect, useState } from "react";
import { consentLocale, consentText, getConsent, setConsent } from "../../lib/consent";

// The app's cookie banner (CookieConsent.jsx in the repo root) brought to the blog: same
// copy in the same 7 languages, same equal-weight Accept and Reject, same Customize panel,
// and the same stored choice, so a reader decides once for the blog and the app together.
// It renders nothing on the server and opens after hydration only when no choice is stored.
const SITE = "https://www.linkedscore.app";

// Lets the footer "Cookie settings" button re-open the banner.
let _open = null;

export function CookieSettingsButton({ children }) {
  return (
    <button type="button" className="foot-link-btn" onClick={() => { if (_open) _open(); }}>
      {children}
    </button>
  );
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [locale, setLocale] = useState("en");
  const [card, setCard] = useState(null);

  useEffect(() => {
    setLocale(consentLocale());
    if (!getConsent()) setOpen(true); // first visit: no choice stored yet
    _open = () => { const c = getConsent(); setAnalytics(!!(c && c.analytics)); setCustom(true); setOpen(true); };
    return () => { _open = null; };
  }, []);

  // While the banner is up it floats over the bottom of the page; pad the body by its real
  // height so it never hides the end of the article or the footer links on a phone.
  useEffect(() => {
    if (!open || !card) { document.body.style.paddingBottom = ""; return undefined; }
    const apply = () => { document.body.style.paddingBottom = card.offsetHeight + 24 + "px"; };
    apply();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(apply); ro.observe(card); }
    return () => { if (ro) ro.disconnect(); document.body.style.paddingBottom = ""; };
  }, [open, card]);

  const decide = (analyticsOptIn) => {
    setConsent({ analytics: analyticsOptIn, ts: Date.now() });
    // Anonymous decision beacon (no cookies, no PII), tagged so blog and app accept rates
    // can be told apart in the logs. PostHogInit picks the decision up from setConsent.
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/api/log-consent?src=blog&c=" + (analyticsOptIn ? "accept" : "reject"));
    } catch (e) {}
    setOpen(false);
    setCustom(false);
  };

  if (!open) return null;

  const t = consentText(locale);
  const base = locale === "en" ? "" : "/" + locale;

  // Accept and Reject share one style (equal weight, per CNIL/AEPD/Garante).
  const btnEqual = { flex: "1 1 130px", minHeight: 44, padding: "11px 16px", borderRadius: 11, border: "1px solid #c8a96e", background: "transparent", color: "#c8a96e", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
  const btnPrimary = { ...btnEqual, background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#08080e", border: "none" };
  const btnText = { minHeight: 44, background: "transparent", border: "none", color: "#9696b4", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "11px 6px" };
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid #1a1a2e" };
  const link = { color: "#c8a96e", textDecoration: "underline" };
  const p = { margin: 0 };

  return (
    <div role="dialog" aria-label={t.cc_title} aria-modal="false" lang={locale}
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9999, padding: "12px", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div ref={setCard} style={{ pointerEvents: "auto", width: "100%", maxWidth: 560, background: "#0d0d18", border: "1px solid #2a2a3e", borderRadius: 16, padding: "18px 20px", boxShadow: "0 24px 70px -20px rgba(0,0,0,0.95)", lineHeight: 1.5 }}>
        <p style={{ ...p, color: "#F9FAFB", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t.cc_title}</p>
        <p style={{ ...p, color: "#b6b5cc", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          {t.cc_desc} <a href={`${SITE}${base}/cookies.html`} style={link}>{t.legal_cookies}</a> · <a href={`${SITE}${base}/privacy.html`} style={link}>{t.legal_privacy}</a>
        </p>
        {custom && (
          <div style={{ marginBottom: 14 }}>
            <div style={rowStyle}>
              <div><p style={{ ...p, color: "#e8e8f0", fontSize: 13, fontWeight: 600 }}>{t.cc_essential}</p><p style={{ ...p, color: "#7a7a96", fontSize: 11 }}>{t.cc_essential_desc}</p></div>
              <span style={{ color: "#56c08a", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{t.cc_always_on}</span>
            </div>
            <div style={rowStyle}>
              <div><p style={{ ...p, color: "#e8e8f0", fontSize: 13, fontWeight: 600 }}>{t.cc_analytics}</p><p style={{ ...p, color: "#7a7a96", fontSize: 11 }}>{t.cc_analytics_desc}</p></div>
              <button type="button" onClick={() => setAnalytics((a) => !a)} role="switch" aria-checked={analytics} aria-label={t.cc_analytics}
                style={{ width: 46, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: analytics ? "#c8a96e" : "#2a2a3e", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                <span style={{ position: "absolute", top: 3, left: analytics ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {custom ? (
            <button type="button" onClick={() => decide(analytics)} style={btnPrimary}>{t.cc_save}</button>
          ) : (
            <>
              <button type="button" onClick={() => decide(true)} style={btnEqual}>{t.cc_accept}</button>
              <button type="button" onClick={() => decide(false)} style={btnEqual}>{t.cc_reject}</button>
              <button type="button" onClick={() => setCustom(true)} style={btnText}>{t.cc_customize}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
