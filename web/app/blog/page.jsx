import { getAllPosts } from "../../lib/posts";

export const metadata = {
  title: "Blog | LinkedScore",
  description:
    "Practical LinkedIn strategy from a decade of running executive social media: profile positioning, content that builds authority and the mechanics behind reach.",
};

export default function Blog() {
  const posts = getAllPosts();
  return (
    <main className="container">
      <a className="back" href="https://www.linkedscore.app/">Back</a>
      <h1>Blog</h1>
      <p>Most LinkedIn advice is written to go viral, not to be right. This blog is the opposite bet.</p>
      <p>
        I am Ali Azad. I have spent more than a decade running social media for a life sciences
        company, a global tech brand and one of the biggest e-commerce platforms in my region, and I
        build LinkedScore, an AI analyzer that reads real LinkedIn profiles and scores what they
        actually communicate. The articles here come out of that work: hundreds of profile audits,
        executive programs measured in millions of impressions and the patterns that separate
        authority from noise.
      </p>
      <p>
        What you will find is strategy you can act on. How the algorithm actually distributes your
        posts, what a headline has to do before anyone clicks, which popular tactics quietly cost
        you trust and what your SSI score really measures. No growth hacks, no posting quotas, no
        magic best time to post.
      </p>
      <p>
        New articles land a few times a month. Start with any card below, or{" "}
        <a href="https://www.linkedscore.app/" style={{ color: "var(--gold)" }}>run the free analysis</a>{" "}
        first and read with your own score in hand.
      </p>
      <ul className="post-list">
        {posts.map((p) => (
          <li key={p.slug}>
            <a className="post-card" href={`/blog/${p.slug}`}>
              {p.image ? <img className="post-thumb" src={p.image} alt={p.title} loading="lazy" width="1376" height="768" /> : null}
              <h2>{p.title}</h2>
              <p className="post-meta">{p.date}</p>
              <p>{p.excerpt}</p>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
