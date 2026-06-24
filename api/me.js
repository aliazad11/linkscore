// Returns the signed-in email (or null) so the client can show login state and gate the
// "my reports" view. Reads the httpOnly session cookie; no body. Node runtime.
import { readSession } from "./_auth.js";

export default async function handler(req, res) {
  const s = readSession(req);
  return res.status(200).json({ email: (s && s.purpose === "session" && s.email) ? s.email : null });
}
