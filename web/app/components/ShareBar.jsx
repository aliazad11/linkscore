"use client";

import { useState } from "react";

const SITE = "https://www.linkedscore.app";

export default function ShareBar({ title }) {
  const [copied, setCopied] = useState(false);
  // Always share the canonical host, never the vercel.app duplicate
  function getUrl() { return typeof window !== "undefined" ? SITE + window.location.pathname : SITE; }
  function shareLinkedIn() { window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(getUrl()), "_blank", "noopener,noreferrer"); }
  function shareX() { window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(getUrl()), "_blank", "noopener,noreferrer"); }
  function copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(getUrl()).then(function () {
        setCopied(true);
        setTimeout(function () { setCopied(false); }, 1600);
      }).catch(function () {});
    }
  }
  return (
    <div className="share">
      <span className="share-label">Share</span>
      <button type="button" onClick={shareLinkedIn}>LinkedIn</button>
      <button type="button" onClick={shareX}>X</button>
      <button type="button" onClick={copyLink}>{copied ? "Copied ✓" : "Copy link"}</button>
    </div>
  );
}
