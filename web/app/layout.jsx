import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.linkedscore.app"),
  title: { default: "Linkedscore", template: "%s | Linkedscore" },
  description: "Practical, no-fluff guides to growing on LinkedIn: profile, content, and personal brand.",
  openGraph: { type: "website", siteName: "Linkedscore", title: "Linkedscore", description: "Practical, no-fluff guides to growing on LinkedIn.", url: "https://www.linkedscore.app" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header"><div className="container"><a href="/" className="logo"><img src="https://raw.githubusercontent.com/aliazad11/linkscore/main/logo.png" alt="Linkedscore" /></a><a href="/blog" className="muted">Blog</a></div></header>
        {children}
        <footer><div className="container">Linkedscore. Practical LinkedIn growth.</div></footer>
      </body>
    </html>
  );
}
