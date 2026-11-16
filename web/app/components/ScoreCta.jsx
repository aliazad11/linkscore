// Invitation from an article to the analyzer. A plain link (no client JS), so it works
// before hydration and costs nothing on mobile. #start opens the funnel directly. It is a
// fragment, not ?start=1, so for crawlers every article still links to the homepage itself
// instead of adding robots-blocked URLs. The app reads the tags after the # (analytics.js),
// which together with the PostHog capture attribute makes blog -> analysis starts countable
// per article and per position.
const APP = "https://www.linkedscore.app/";

// The price as the blog states it. Keep in step with the Payment Link in api/_paid.js.
export const PRICE = "€9.99";

export function ctaHref(slug, position) {
  const q = new URLSearchParams({
    utm_source: "blog",
    utm_medium: "article_cta",
    utm_campaign: slug,
    utm_content: position,
  });
  return APP + "#start&" + q.toString();
}

export default function ScoreCta({ slug }) {
  return (
    <aside className="cta-inline" aria-label="Get your LinkedScore">
      <div className="cta-inline-copy">
        <p className="cta-inline-title">How does your own LinkedIn profile score?</p>
        <p className="cta-inline-text">LinkedScore reads your profile and recent posts and shows your score free in about 10 minutes. The full plan is {PRICE}.</p>
      </div>
      <a className="cta cta-sm" href={ctaHref(slug, "mid")} data-ph-capture-attribute-cta="blog-mid">Get your free score →</a>
    </aside>
  );
}

// Splits an article before its second section heading, so the invitation appears once the
// reader has finished the opening section. Articles with fewer headings get no inline card.
export function splitForCta(html) {
  const re = /<h2[\s>]/gi;
  let m;
  let n = 0;
  while ((m = re.exec(html))) {
    n += 1;
    if (n === 2) return [html.slice(0, m.index), html.slice(m.index)];
  }
  return [html, ""];
}
