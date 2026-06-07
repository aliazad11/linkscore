import { getAllPosts, getPost } from "../../../lib/posts";
import ShareBar from "../../components/ShareBar";

export function generateStaticParams() {
  return getAllPosts().map(function (p) { return { slug: p.slug }; });
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  const og = { title: post.title, description: post.excerpt, type: "article", url: "https://www.linkedscore.app/blog/" + post.slug };
  if (post.image) { og.images = [post.image]; }
  return { title: post.title, description: post.excerpt, openGraph: og };
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
    url: "https://www.linkedscore.app/blog/" + post.slug
  };
  if (post.image) { jsonLd.image = post.image; }
  return (
    <main className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
