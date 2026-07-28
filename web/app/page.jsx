import { getAllPosts } from "../lib/posts";

export default function Home() {
  const posts = getAllPosts();
  return (
    <main className="container">
      <p className="kicker">LinkedScore</p>
      <h1>LinkedIn growth, minus the fluff.</h1>
      <p>Practical guides to your profile, content and personal brand.</p>
      <ul className="post-list">
        {posts.map((p) => (
          <li key={p.slug}>
            <a className="post-card" href={`/blog/${p.slug}`}>
              {p.image ? <img className="post-thumb" src={p.image} alt={p.title} /> : null}
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
