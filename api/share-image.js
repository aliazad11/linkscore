// Dynamic 1080x1350 (4:5) "Verdict" share image: a per-user intelligence-dossier
// card the owner downloads and posts NATIVELY on LinkedIn (image + caption), which
// outperforms a link-preview unfurl. Rendered deterministically with @vercel/og
// (Satori) so it is byte-identical every run. The gold treatment is IDENTICAL at
// every score; only the bar width and an 85+ hairline change, so a low score reads
// as a brave starting line, never as failure. Best-effort: any failure still 200s.
//
// buildCard() is exported pure so it can be rendered locally for QA without deploy.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const GOLD = "#c8a96e";
const WHITE = "#f5f5fc";
const LAV = "#9696b4";
const DIM = "#56566f";
const TRACK = "#1c1c2c";

const box = (style, children) => ({ type: "div", props: { style: { display: "flex", ...style }, children } });
const text = (style, content) => ({ type: "div", props: { style: { display: "flex", ...style }, children: content } });

function clampScore(n) { return Math.max(0, Math.min(100, Math.round(Number(n) || 0))); }

function bandLine(score) {
  if (score < 55) return "An honest starting line.";
  if (score < 70) return "Real signal, under-leveraged.";
  if (score < 85) return "Strong. The ceiling is higher.";
  return "Top-tier presence.";
}

// A big score numeral in solid champagne gold. Identical at every score, so a low
// score never looks "worse" than a high one (gold steady is the dignity guarantee).
function numeral(score, size) {
  return text({
    fontSize: size, fontWeight: 800, fontFamily: "Poppins", lineHeight: 1, color: GOLD,
  }, String(score));
}

function bar(score, width) {
  return box({ width: width, height: 14, background: TRACK, borderRadius: 100, overflow: "hidden" }, [
    box({ width: `${score}%`, height: "100%", background: GOLD, borderRadius: 100 }, []),
  ]);
}

function label(content) {
  return text({ color: LAV, fontSize: 24, fontWeight: 500, fontFamily: "Poppins", letterSpacing: 4 }, content);
}

function bracket(pos) {
  return { type: "div", props: { style: { display: "flex", position: "absolute", width: 46, height: 46, ...pos }, children: [] } };
}

export function buildCard(data) {
  const name = (data.name && String(data.name).trim()) || "";
  const score = clampScore(data.score);
  const archetype = (data.archetype && String(data.archetype).trim()) || "Your LinkedIn presence";
  const tl = !!data.tlAvailable;
  const tlScore = clampScore(data.tlScore);

  // Center block: single hero number, or two equal numbers when a TL score exists.
  let center;
  if (tl) {
    const colW = 420;
    const scoreCol = (n, lab) => box({ flexDirection: "column", alignItems: "center", width: colW }, [
      numeral(n, 230),
      box({ height: 2, width: 110, background: GOLD, margin: "14px 0 12px" }, []),
      label(lab),
      box({ height: 18 }, []),
      bar(n, 300),
    ]);
    center = box({ flexDirection: "column", alignItems: "center", flexGrow: 1, justifyContent: "center" }, [
      box({ alignItems: "flex-start", justifyContent: "center" }, [
        scoreCol(score, "LINKEDIN SCORE"),
        box({ width: 1, height: 300, background: "#23232f", margin: "0 4px" }, []),
        scoreCol(tlScore, "THOUGHT LEADER"),
      ]),
      box({ height: 30 }, []),
      text({ color: WHITE, fontSize: 32, fontWeight: 500, fontFamily: "Poppins" }, bandLine(score)),
    ]);
  } else {
    center = box({ flexDirection: "column", alignItems: "center", flexGrow: 1, justifyContent: "center" }, [
      numeral(score, 400),
      box({ height: 2, width: 120, background: GOLD, margin: "20px 0 10px" }, []),
      score >= 85 ? box({ height: 1, width: 80, background: GOLD, marginBottom: 16 }, []) : box({ height: 14 }, []),
      box({ alignItems: "baseline", gap: 12 }, [
        label("LINKEDIN SCORE"),
        text({ color: DIM, fontSize: 24, fontWeight: 500, fontFamily: "Poppins" }, "/ 100"),
      ]),
      box({ height: 26 }, []),
      text({ color: WHITE, fontSize: 34, fontWeight: 500, fontFamily: "Poppins" }, bandLine(score)),
      box({ height: 30 }, []),
      bar(score, 760),
    ]);
  }

  return box({
    position: "relative", width: "100%", height: "100%", flexDirection: "column",
    backgroundImage: `linear-gradient(180deg, #0a0a0f, #08080e)`, padding: "84px 80px", fontFamily: "Poppins",
  }, [
    bracket({ top: 48, left: 48, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` }),
    bracket({ top: 48, right: 48, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` }),
    bracket({ bottom: 48, left: 48, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` }),
    bracket({ bottom: 48, right: 48, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` }),

    // Header: wordmark (+ underline). TL pill is NOT here; when present it becomes a hero column.
    box({ justifyContent: "space-between", alignItems: "flex-start" }, [
      box({ flexDirection: "column" }, [
        text({ color: GOLD, fontSize: 26, fontWeight: 500, fontFamily: "Poppins", letterSpacing: 5 }, "LINKEDSCORE"),
        box({ height: 1, width: 96, background: GOLD, marginTop: 7 }, []),
      ]),
    ]),

    // Name + archetype
    box({ flexDirection: "column", marginTop: 36 }, [
      name ? text({ color: LAV, fontSize: 34, fontWeight: 400, fontFamily: "Poppins" }, `${name}, you are`) : text({ color: LAV, fontSize: 34, fontWeight: 400, fontFamily: "Poppins" }, "You are"),
      text({ color: WHITE, fontSize: 64, fontWeight: 800, fontFamily: "Poppins", lineHeight: 1.05, marginTop: 6, maxWidth: 900 }, archetype),
    ]),

    center,

    // Footer
    box({ flexDirection: "column" }, [
      text({ color: WHITE, fontSize: 28, fontWeight: 500, fontFamily: "Poppins" }, "Get your honest score free"),
      text({ color: GOLD, fontSize: 28, fontWeight: 800, fontFamily: "Poppins", marginTop: 2 }, "linkedscore.app"),
    ]),
  ]);
}

async function loadFonts(origin) {
  const grab = (f, weight) => fetch(origin + "/fonts/" + f).then((r) => r.arrayBuffer()).then((data) => ({ name: "Poppins", data, weight, style: "normal" }));
  return Promise.all([
    grab("Poppins-ExtraBold.ttf", 800),
    grab("Poppins-Medium.ttf", 500),
    grab("Poppins-Regular.ttf", 400),
  ]);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req) {
  const u = new URL(req.url);
  const sp = u.searchParams;
  const origin = u.origin;

  let data = { name: sp.get("name") || "", score: sp.get("score") || 72, archetype: sp.get("arch") || "The Quiet Operator", tlAvailable: sp.get("tl") != null, tlScore: sp.get("tl") || 0 };

  const id = sp.get("id") || "";
  if (id && UUID_RE.test(id)) {
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/plans?id=eq." + encodeURIComponent(id) + "&select=first_name,plan_data", {
        headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY },
      });
      const rows = await r.json();
      if (rows && rows[0] && rows[0].plan_data) {
        const pd = rows[0].plan_data;
        const tlA = !!(pd.thought_leader && pd.thought_leader.available);
        data = { name: rows[0].first_name || "", score: pd.score, archetype: pd.archetype || "Your LinkedIn presence", tlAvailable: tlA, tlScore: tlA ? pd.thought_leader.score : 0 };
      }
    } catch (e) { /* fall back to defaults/query */ }
  }

  const fonts = await loadFonts(origin);
  return new ImageResponse(buildCard(data), { width: 1080, height: 1350, fonts });
}
