import { getAllPosts, getPost } from "../../../lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article", url: `https://www.linkedscore.app/blog/${post.slug}` },
  };
}

export default function Article({ params }) {
  const post = getPost(params.slug);
  if (!post) return <main className="container"><h1>Not found</h1></main>;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    url: `https://www.linkedscore.app/blog/${post.slug}`,
  };
  return (
    <main className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a className="back" href="/blog">Back to blog</a>
      <article>
        <p className="kicker">Linkedscore</p>
        <h1>{post.title}</h1>
        <p className="post-meta">{post.date}</p>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
      <a className="cta" href="https://calendly.com/aliazad1800/how-to-be-a-linkedin-star">Work with me</a>
    </main>
  );
}
