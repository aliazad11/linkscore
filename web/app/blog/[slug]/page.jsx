import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "../../../lib/posts";
import ShareBar from "../../components/ShareBar";

const SITE = "https://www.linkedscore.app";

export function generateStaticParams() {
  return getAllPosts().map(function (p) { return { slug: p.slug }; });
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  const og = { title: post.title, description: post.excerpt, type: "article", url: SITE + "/blog/" + post.slug };
  if (post.image) { og.images = [post.image]; }
  return { title: post.title, description: post.excerpt, openGraph: og, alternates: { canonical: SITE + "/blog/" + post.slug } };
}

export default function Article({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    url: SITE + "/blog/" + post.slug,
    author: { "@type": "Person", name: "Ali Azad", url: "https://www.linkedin.com/in/aliazad11/" },
    publisher: { "@type": "Organization", name: "Linkedscore", logo: { "@type": "ImageObject", url: SITE + "/logo.png" } }
  };
  if (post.image) { jsonLd.image = SITE + post.image; }
  return (
    <main className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <a className="back" href="/blog">Back to blog</a>
      <div className="hero">
        {post.image ? <img className="hero-img" src={post.image} alt={post.title} /> : null}
        <p className="kicker">Linkedscore</p>
        <h1>{post.title}</h1>
        <p className="post-meta">{post.date}</p>
      </div>
      <article>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
      <ShareBar title={post.title} />
      <a className="cta" href="https://calendly.com/aliazad1800/how-to-be-a-linkedin-star">Work with me</a>
    </main>
  );
}
