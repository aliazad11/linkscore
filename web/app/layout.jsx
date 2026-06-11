import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.linkedscore.app"),
  title: { default: "Linkedscore", template: "%s | Linkedscore" },
  description: "Practical, no-fluff guides to growing on LinkedIn: profile, content and personal brand.",
  openGraph: { type: "website", siteName: "Linkedscore", title: "Linkedscore", description: "Practical, no-fluff guides to growing on LinkedIn.", url: "https://www.linkedscore.app" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header"><div className="container"><a href="https://www.linkedscore.app/" className="logo"><img src="/logo.png" alt="Linkedscore" /></a><nav className="header-nav"><a href="/blog" className="muted">Blog</a><a href="https://www.linkedscore.app/" className="cta cta-sm">Get your free score</a></nav></div></header>
        {children}
        <footer><div className="container"><span>Linkedscore. Practical LinkedIn growth.</span><span className="foot-links"><a href="https://www.linkedscore.app/privacy.html">Privacy</a><a href="https://www.linkedscore.app/terms.html">Terms</a></span></div></footer>
      </body>
    </html>
  );
}
