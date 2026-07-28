import "./globals.css";
import PostHogInit from "./posthog-init";

export const metadata = {
  metadataBase: new URL("https://www.linkedscore.app"),
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  title: { default: "LinkedScore", template: "%s | LinkedScore" },
  description: "Practical, no-fluff guides to growing on LinkedIn: profile, content and personal brand.",
  openGraph: { type: "website", siteName: "LinkedScore", title: "LinkedScore", description: "Practical, no-fluff guides to growing on LinkedIn.", url: "https://www.linkedscore.app" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PostHogInit />
        <header className="site-header"><div className="container"><a href="https://www.linkedscore.app/" className="logo"><img src="/logo.png" alt="LinkedScore" /></a><nav className="header-nav"><a href="/blog" className="muted">Blog</a><a href="https://www.linkedscore.app/" className="cta cta-sm">Get your free score</a></nav></div></header>
        {children}
        <footer><div className="container"><span>LinkedScore. Practical LinkedIn growth.</span><span className="foot-links"><a href="https://www.linkedscore.app/privacy.html">Privacy</a><a href="https://www.linkedscore.app/terms.html">Terms</a></span></div></footer>
      </body>
    </html>
  );
}
