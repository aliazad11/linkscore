// Dynamic Open Graph image for a shared plan: a branded score card with the
// person's first name, score and archetype. Plain .js (no JSX) so Vercel builds
// it reliably in this non-Next project — @vercel/og / Satori accept a plain
// element tree. Best-effort: if it errors, the shared link still works.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const GOLD = "#c8a96e";

const el = (type, style, children) => ({ type, props: { style, children } });

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";

  let name = "LinkedScore";
  let score = 0;
  let arch = "Your LinkedIn growth plan";
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/plans?id=eq." + encodeURIComponent(id) + "&select=first_name,plan_data", {
      headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY },
    });
    const rows = await r.json();
    if (rows && rows[0] && rows[0].plan_data) {
      name = rows[0].first_name || "LinkedScore";
      score = Math.max(0, Math.min(100, Math.round(Number(rows[0].plan_data.score) || 0)));
      arch = rows[0].plan_data.archetype || arch;
    }
  } catch (e) { /* fall back to defaults */ }

  const tree = el("div", { height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#08080e", padding: "64px 72px", fontFamily: "sans-serif" }, [
    el("div", { display: "flex", color: GOLD, fontSize: 30, fontWeight: 700, letterSpacing: 2 }, "LINKEDSCORE"),
    el("div", { display: "flex", alignItems: "flex-end", justifyContent: "space-between" }, [
      el("div", { display: "flex", flexDirection: "column", maxWidth: 680 }, [
        el("div", { display: "flex", color: "#9696b4", fontSize: 30, marginBottom: 8 }, name + ", you are"),
        el("div", { display: "flex", color: GOLD, fontSize: 64, fontWeight: 800 }, arch),
      ]),
      el("div", { display: "flex", flexDirection: "column", alignItems: "center" }, [
        el("div", { display: "flex", color: "#f5f5fc", fontSize: 140, fontWeight: 800, lineHeight: 1 }, String(score)),
        el("div", { display: "flex", color: "#56566f", fontSize: 24, letterSpacing: 3 }, "OUT OF 100"),
      ]),
    ]),
    el("div", { display: "flex", color: "#9696b4", fontSize: 26 }, "Get your own free LinkedIn score at linkedscore.app"),
  ]);

  return new ImageResponse(tree, { width: 1200, height: 630 });
}
