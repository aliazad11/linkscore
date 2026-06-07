const posts = [
  {
    slug: "linkedin-headline-formula",
    title: "The LinkedIn Headline Formula That Gets You Found",
    date: "2026-06-01",
    excerpt: "Your headline is the most-read line on your profile. Here is a simple formula that makes it searchable and clear.",
    html: "<h2>Why your headline matters</h2><p>Your headline travels everywhere on LinkedIn: search results, the feed, comments, and every connection request. It is the single most-read line you write, and a vague one wastes that reach.</p><h2>The formula</h2><p>Use this shape: who you help, the outcome you create, and one proof point or specialty. Keep it readable, not stuffed with buzzwords.</p><ul><li><strong>Who you help</strong>: name the audience in plain words.</li><li><strong>The outcome</strong>: the result they actually care about.</li><li><strong>Proof or niche</strong>: a number, a focus area, or a signature method.</li></ul><h2>Three quick examples</h2><p>Helping B2B founders turn LinkedIn into pipeline. Building demand for life-science brands. Coaching managers to lead with clarity.</p><h2>Common mistakes</h2><p>Listing only a job title. Packing in five keywords. Writing for recruiters when the real audience is buyers. Pick one audience and speak to it.</p><p>Rewrite your headline today, read it out loud, and ask one question: would the person you want to reach understand it in three seconds?</p>"
  }
];

export function getAllPosts() {
  return posts.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}

export function getPost(slug) {
  return posts.find(function (p) { return p.slug === slug; }) || null;
}
