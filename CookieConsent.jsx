import { useState, useEffect } from "react";
import { useLocale } from "./i18n.jsx";
import { getConsent, setConsent, initAnalytics } from "./analytics.js";

// Lets the footer "Cookie settings" link re-open the banner from anywhere.
let _open = null;
export function openCookieSettings() { if (_open) _open(); }

export function CookieConsent() {
  const { t, locale } = useLocale();
  const base = locale === "en" ? "" : "/" + locale;
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (!getConsent()) setOpen(true); // first visit: no choice stored yet
    _open = () => { const c = getConsent(); setAnalytics(!!(c && c.analytics)); setCustom(true); setOpen(true); };
    return () => { _open = null; };
  }, []);

  const decide = (analyticsOptIn) => {
    setConsent({ analytics: analyticsOptIn, ts: Date.now() });
    if (analyticsOptIn) initAnalytics();
    setOpen(false); setCustom(false);
  };

  if (!open) return null;

  // Accept and Reject share one style (equal weight, per CNIL/AEPD/Garante).
  const btnEqual = { flex: "1 1 130px", padding: "11px 16px", borderRadius: 11, border: "1px solid #c8a96e", background: "transparent", color: "#c8a96e", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
  const btnPrimary = { ...btnEqual, background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#08080e", border: "none" };
  const btnText = { background: "transparent", border: "none", color: "#9696b4", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: "11px 6px" };
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid #1a1a2e" };

  return (
    <div role="dialog" aria-label={t("cc_title")} aria-modal="false"
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9999, padding: "12px", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 560, background: "#0d0d18", border: "1px solid #2a2a3e", borderRadius: 16, padding: "18px 20px", boxShadow: "0 24px 70px -20px rgba(0,0,0,0.95)", fontFamily: "'DM Sans',sans-serif" }}>
        <p style={{ color: "#F9FAFB", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t("cc_title")}</p>
        <p style={{ color: "#b6b5cc", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          {t("cc_desc")} <a href={`${base}/cookies.html`} style={{ color: "#c8a96e" }}>{t("legal_cookies")}</a> · <a href={`${base}/privacy.html`} style={{ color: "#c8a96e" }}>{t("legal_privacy")}</a>
        </p>
        {custom && (
          <div style={{ marginBottom: 14 }}>
            <div style={rowStyle}>
              <div><p style={{ color: "#e8e8f0", fontSize: 13, fontWeight: 600 }}>{t("cc_essential")}</p><p style={{ color: "#7a7a96", fontSize: 11 }}>{t("cc_essential_desc")}</p></div>
              <span style={{ color: "#56c08a", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{t("cc_always_on")}</span>
            </div>
            <div style={rowStyle}>
              <div><p style={{ color: "#e8e8f0", fontSize: 13, fontWeight: 600 }}>{t("cc_analytics")}</p><p style={{ color: "#7a7a96", fontSize: 11 }}>{t("cc_analytics_desc")}</p></div>
              <button onClick={() => setAnalytics(a => !a)} role="switch" aria-checked={analytics} aria-label={t("cc_analytics")}
                style={{ width: 46, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: analytics ? "#c8a96e" : "#2a2a3e", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                <span style={{ position: "absolute", top: 3, left: analytics ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {custom ? (
            <button onClick={() => decide(analytics)} style={btnPrimary}>{t("cc_save")}</button>
          ) : (
            <>
              <button onClick={() => decide(true)} style={btnPrimary}>{t("cc_accept")}</button>
              <button onClick={() => decide(false)} style={btnEqual}>{t("cc_reject")}</button>
              <button onClick={() => setCustom(true)} style={btnText}>{t("cc_customize")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
