import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.linkedscore.app"),
  title: { default: "Linkedscore", template: "%s | Linkedscore" },
  description: "Practical, no-fluff guides to growing on LinkedIn: profile, content, and personal brand.",
  openGraph: { type: "website", siteName: "Linkedscore", title: "Linkedscore", description: "Practical, no-fluff guides to growing on LinkedIn.", url: "https://www.linkedscore.app" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header"><div className="container"><a href="https://www.linkedscore.app/" className="logo"><img src="/logo.png" alt="Linkedscore" /></a><a href="/blog" className="muted">Blog</a></div></header>
        {children}
        <footer><div className="container">Linkedscore. Practical LinkedIn growth.</div></footer>
      </body>
    </html>
  );
}
