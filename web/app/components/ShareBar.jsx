"use client";

import { useEffect, useState } from "react";

const SITE = "https://www.linkedscore.app";

export default function ShareBar({ title }) {
  const [copied, setCopied] = useState(false);
  const [failedUrl, setFailedUrl] = useState("");
  // Set after mount so the server render and first client render match (no hydration
  // mismatch), then real values arrive with a normal re-render.
  const [url, setUrl] = useState(SITE);
  const [canNative, setCanNative] = useState(false);
  useEffect(function () {
    // Always share the canonical host, never the vercel.app duplicate
    try { setUrl(SITE + window.location.pathname); } catch (e) {}
    try { setCanNative(!!navigator.share); } catch (e) {}
  }, []);

  const liHref = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
  const xHref = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url);

  // The OS share sheet is the reliable path inside in-app webviews, where
  // window.open and the async clipboard are both flaky.
  function shareNative() {
    try { navigator.share({ title: title, url: url }).catch(function () {}); } catch (e) {}
  }
  function copyLink() {
    const legacy = function () {
      try {
        const ta = document.createElement("textarea");
        ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        setCopied(true); setTimeout(function () { setCopied(false); }, 1600);
      } catch (e) { setFailedUrl(url); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        setCopied(true);
        setTimeout(function () { setCopied(false); }, 1600);
      }).catch(legacy);
    } else legacy();
  }
  return (
    <div className="share">
      <span className="share-label">Share</span>
      {canNative && <button type="button" onClick={shareNative}>Share…</button>}
      {/* Real links so a webview that blocks window.open degrades to plain navigation. */}
      <a href={liHref} target="_blank" rel="noopener noreferrer" className="share-a">LinkedIn</a>
      <a href={xHref} target="_blank" rel="noopener noreferrer" className="share-a">X</a>
      <button type="button" onClick={copyLink}>{copied ? "Copied ✓" : "Copy link"}</button>
      {failedUrl && (
        <input readOnly value={failedUrl} onFocus={function (e) { e.target.select(); }} aria-label="Article link"
          style={{ flexBasis: "100%", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "8px 10px", fontSize: 13 }} />
      )}
    </div>
  );
}
