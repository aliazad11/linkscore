// Dynamic Open Graph image for a shared plan: a branded score card with the
// person's first name, score and archetype. Best-effort — if it errors, the
// shared link still works, it just falls back to the static og.png.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://luiroqeufcmlyidnrlnt.supabase.co";
const BG = "#08080e";
const GOLD = "#c8a96e";

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

  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG, padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", color: GOLD, fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>LINKEDSCORE</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#9696b4", fontSize: 30, marginBottom: 8 }}>{name}, you are</div>
            <div style={{ color: GOLD, fontSize: 64, fontWeight: 800 }}>{arch}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#f5f5fc", fontSize: 140, fontWeight: 800, lineHeight: 1 }}>{score}</div>
            <div style={{ color: "#56566f", fontSize: 24, letterSpacing: 3 }}>OUT OF 100</div>
          </div>
        </div>
        <div style={{ display: "flex", color: "#9696b4", fontSize: 26 }}>Get your own free LinkedIn score at linkedscore.app</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
