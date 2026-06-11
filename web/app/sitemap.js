import { getAllPosts } from "../lib/posts";

const SITE = "https://www.linkedscore.app";

export default function sitemap() {
  const posts = getAllPosts().map(function (p) {
    return { url: SITE + "/blog/" + p.slug, lastModified: p.date, changeFrequency: "monthly", priority: 0.8 };
  });
  return [
    { url: SITE + "/", changeFrequency: "weekly", priority: 1 },
    { url: SITE + "/blog", changeFrequency: "weekly", priority: 0.9 },
  ].concat(posts);
}
