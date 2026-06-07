"use client";

export default function ShareBar({ title }) {
  function getUrl() { return typeof window !== "undefined" ? window.location.href : ""; }
  function shareLinkedIn() { window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(getUrl()), "_blank"); }
  function shareX() { window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(getUrl()), "_blank"); }
  function copyLink() { if (navigator.clipboard) { navigator.clipboard.writeText(getUrl()); } }
  return (
    <div className="share">
      <span className="share-label">Share</span>
      <button type="button" onClick={shareLinkedIn}>LinkedIn</button>
      <button type="button" onClick={shareX}>X</button>
      <button type="button" onClick={copyLink}>Copy link</button>
    </div>
  );
}
