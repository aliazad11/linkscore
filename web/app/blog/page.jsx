import { getAllPosts } from "../../lib/posts";

export const metadata = { title: "Blog" };

export default function Blog() {
  const posts = getAllPosts();
  return (
    <main className="container">
      <a className="back" href="https://www.linkedscore.app/">Back</a>
      <h1>Blog</h1>
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
