// Deterministic profile scoring - the instrument behind the LinkedIn Score.
//
// WHY (2026-07-27 retest experiment): the model-only score failed as a measurement.
// Identical input re-ran 48 -> 62 (About 42 -> 72 on the SAME text) and a genuinely
// improved profile scored LOWER because the model anchored on the user's self-
// description instead of the uploaded profile. A retestable score must be (a)
// reproducible and (b) monotone in real improvement, so measurable features are
// computed HERE and the model's judgment is blended in only within a capped band.
//
// v3 (after two adversarial-review rounds, 30 + 24 findings). Governing principle:
// when confidence is low, return the section as UNMEASURED (null) and let the model
// score it freely - NEVER emit a wrong deterministic anchor. A false low anchor on a
// good profile is the worst possible outcome (user improves, score stuck), so the
// bias is always toward null over a guess. Concretely v3:
//  - Name/headline: the search SKIPS the Contact sidebar (URL/email/digit lines that
//    precede the name in every export); an ambiguous window -> unmeasured, not "42 gap".
//  - Section markers are folded at load (accented forms like "resume"/"experiencia"
//    now match); localized full forms incl. hyphenated "Honors-Awards", "Formacao".
//  - Dates matched per line, month-name + "de"-particle + native present-words aware;
//    experience bounded at Education so degrees never count as roles.
//  - Word-boundary tokens (Mumbai != mba); location detected via a country/region set
//    (any country, comma-less "Singapore"/"Greater X Area", 2-line wrapped locations).
//  - NO independent "overall" anchor: overall is the weighted average of the BLENDED
//    sub-scores, so partial measurement can never contradict itself.
//  - Security: the blend runs SERVER-SIDE and only when the request truly carried a
//    profile; a forged anchor far from the model's own read is rejected; _anchored is
//    server-controlled. headlineText is sanitized before it enters the prompt.
//
// PURE module (no browser APIs, no pdfjs) - shared by App.jsx and generate-plan.js.
// PDF text extraction lives in pdftext.js.

// German transliteration so ASCII-typed "Mueller" matches "Müller" and vice versa.
const translit = (s) => s.replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ß/g, "ss");
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const foldT = (s) => translit(String(s || "").toLowerCase()).normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s) => fold(s).replace(/\s+/g, " ");
const compact = (s) => fold(s).replace(/[\s\-.]+/g, "");

const HELP_VERBS = ["i help", "we help", "helping", "ich helfe", "wir helfen", "j'aide", "nous aidons", "ayudo", "ayudamos", "ajudo", "ajudamos", "ik help", "wij helpen", "aiuto", "aiutiamo"].map(fold);
const AUDIENCE_WORDS = ["clients", "companies", "teams", "founders", "leaders", "parents", "schools", "brands", "executives", "professionals", "kunden", "unternehmen", "eltern", "schulen", "familien", "entreprises", "equipes", "dirigeants", "empresas", "equipos", "lideres", "equipas", "bedrijven", "ouders", "aziende", "imprese", "famiglie"].map(fold);
const OUTCOME_WORDS = ["grow", "growth", "revenue", "results", "impact", "transform", "scale", "wachstum", "umsatz", "ergebnisse", "wirkung", "foerdern", "erkennen", "croissance", "resultats", "crecimiento", "resultados", "crescimento", "groei", "resultaten", "crescita", "risultati"].map(fold);
const CTA_WORDS = ["message me", "contact me", "book a", "reach out", "get in touch", "let's talk", "dm me", "schreib mir", "kontaktieren sie", "erstgespraech", "ecrivez-moi", "contactez-moi", "contactame", "escribeme", "envie-me", "neem contact", "contattami", "scrivimi"].map(fold);
const CREDENTIAL_WORDS = ["certified", "certification", "accredited", "licensed", "zertifiziert", "zertifizierung", "certifie", "certifiee", "certificado", "certificada", "gecertificeerd", "certificato", "certificata", "phd", "doctorate", "doktor", "mba", "msc"].map(fold);

const SECTION_MARKERS = {
  summary: ["summary", "zusammenfassung", "info", "resume", "extracto", "acerca de", "resumo", "samenvatting", "riepilogo", "sommario", "about", "uber mich", "profil", "profile"],
  experience: ["experience", "berufserfahrung", "erfahrung", "expérience", "experiencia", "experiência", "ervaring", "werkervaring", "esperienza", "esperienza lavorativa"],
  education: ["education", "ausbildung", "bildung", "formation", "educacion", "formacion", "formacao", "formacao academica", "educacao", "opleiding", "formazione", "istruzione", "estudios"],
  skills: ["top skills", "top-kenntnisse", "kenntnisse", "principales competences", "competences", "aptitudes principales", "aptitudes", "competencias principales", "competencias", "principais competencias", "competencias", "belangrijkste vaardigheden", "vaardigheden", "principali competenze", "competenze"],
  certifications: ["certifications", "licenses & certifications", "licenses and certifications", "zertifikate", "bescheinigungen", "zertifizierungen", "certificats", "licencias y certificaciones", "certificaciones", "certificacoes", "certificaten", "certificazioni"],
  languages: ["languages", "sprachen", "langues", "idiomas", "talen", "lingue"],
  honors: ["honors", "awards", "honors & awards", "honors-awards", "auszeichnungen", "distinctions", "premios", "premios y distinciones", "premios", "onderscheidingen", "riconoscimenti"],
};
for (const k of Object.keys(SECTION_MARKERS)) SECTION_MARKERS[k] = [...new Set(SECTION_MARKERS[k].map(fold))];
const ANY_MARKER = [...new Set(Object.values(SECTION_MARKERS).flat())];

// Countries + regions (folded) for structural location detection - any geography,
// so a location line terminates the headline window worldwide.
const COUNTRIES = new Set(["germany", "deutschland", "france", "espana", "spain", "portugal", "nederland", "netherlands", "italia", "italy", "united states", "usa", "united kingdom", "uk", "england", "scotland", "ireland", "canada", "australia", "new zealand", "india", "singapore", "malaysia", "indonesia", "philippines", "china", "hong kong", "japan", "korea", "south korea", "brazil", "brasil", "mexico", "argentina", "chile", "colombia", "peru", "united arab emirates", "uae", "saudi arabia", "qatar", "kuwait", "egypt", "south africa", "nigeria", "kenya", "switzerland", "schweiz", "suisse", "austria", "osterreich", "belgium", "belgie", "belgique", "luxembourg", "sweden", "sverige", "norway", "denmark", "danmark", "finland", "poland", "polska", "czech republic", "czechia", "hungary", "romania", "greece", "turkey", "turkiye", "israel", "ukraine", "russia", "vietnam", "thailand", "pakistan", "bangladesh"].map(fold));
const REGION_HINT = /\b(area|region|regiao|gebiet|umgebung|metropolitan|greater|bay area|province|county|kanton|bundesland|estado|provincia)\b/i;

const clampBand = (v) => Math.max(35, Math.min(92, Math.round(v)));

function isMarkerLine(line, markers) {
  const l = norm(line).replace(/[:：]\s*$/, "").trim();
  return l.length <= 42 && markers.includes(l);
}
function findMarker(lines, markers) {
  for (let i = 0; i < lines.length; i++) if (lines[i] && isMarkerLine(lines[i], markers)) return i;
  return -1;
}
// A contact/sidebar line that must never be mistaken for the name or headline.
// The last clause catches a bare URL slug ("simona-grandits-managing-director") that
// pdf.js can split onto its own line after the "www.linkedin.com/in/" fragment.
// \S@\S matches an email but NOT the "@ Company" idiom ("Head of Social @ QIAGEN"),
// which is a real headline, not a contact line.
const isContactLine = (l) => /\S@\S|www\.|https?:|linkedin\.com|\.com\b|\.io\b|\(linkedin\)|\(personal\)|\+?\d[\d ()-]{6,}/i.test(l) || /\d{4,}/.test(l) || /^[a-z0-9]+(?:-[a-z0-9]*){2,}-?$/.test(l.trim());
// A location line: comma with a country/region last-segment, OR a bare country, OR a
// SHORT region-hint phrase ("Greater Chicago Area"). The word cap on the region-hint
// branch stops a real headline continuation ("Driving growth across the Nordic region")
// from being mistaken for a location and truncating the headline.
function looksLikeLocation(l) {
  if (!l || l.length > 70 || /[|·•]/.test(l) || /\d{4}/.test(l)) return false;
  const n = norm(l);
  if (COUNTRIES.has(n)) return true;
  if (l.includes(",")) {
    const segs = n.split(",").map((s) => s.trim());
    if (segs.slice(-2).some((s) => COUNTRIES.has(s))) return true;
  }
  if (REGION_HINT.test(l) && l.split(/\s+/).length <= 5) return true;
  return false;
}

// Per-line date-range detector. A role date line is essentially JUST a date range
// (plus an optional "(N years M months)" duration): "February 2016 - June 2019",
// "enero de 2016 - marzo de 2019", "2019 - Present". The month-name allow-list plus a
// residual-text check reject a year-range that appears INSIDE a description sentence
// ("Grew EBITDA 2018-2021 by 40%", "Led the 2020-2023 transformation") - those are
// prose, not role boundaries, and must not inflate roleCount or zero currentRoleDesc.
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "januar", "februar", "marz", "maerz", "mai", "juni", "juli", "oktober", "dezember", "janvier", "fevrier", "mars", "avril", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre", "enero", "febrero", "marzo", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre", "janeiro", "fevereiro", "marco", "maio", "junho", "julho", "setembro", "outubro", "novembro", "dezembro", "januari", "februari", "maart", "mei", "augustus", "gennaio", "febbraio", "aprile", "maggio", "giugno", "luglio", "settembre", "ottobre", "dicembre", "de", "of", "du"].map(fold);
const PRESENT_WORDS = ["present", "heute", "actualidad", "actual", "presente", "heden", "oggi", "today", "aujourd", "aujourd'hui", "o momento", "momento", "derzeit", "en cours", "current", "now"].map(fold);
const YEAR = "(?:19|20)\\d{2}";
const DATEPT = "(?:(?:" + MONTHS.join("|") + ")\\.?\\s+){0,2}" + YEAR;
const PRESENT_RE = PRESENT_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const RANGE_RE = new RegExp(DATEPT + "\\s*[-–—]\\s*(?:" + DATEPT + "|" + PRESENT_RE + ")", "u");
function isDateRangeLine(line) {
  if (!line) return false;
  const l = fold(line).trim();
  const m = l.match(RANGE_RE);
  if (!m) return false;
  // Residual text after removing the range and any "(duration)": a real date line has
  // almost nothing left; a prose sentence with an embedded year-range has plenty.
  const residual = (l.slice(0, m.index) + l.slice(m.index + m[0].length)).replace(/\([^)]*\)/g, "");
  return residual.replace(/[^\p{L}]/gu, "").length <= 3;
}

function hasAny(text, folded) {
  const n = " " + norm(text) + " ";
  const c = compact(text);
  return folded.some((w) => {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp("(^|[^\\p{L}])" + esc + "($|[^\\p{L}])", "u").test(n)) return true;
    const cw = w.replace(/[\s\-.]+/g, "");
    return cw.length >= 8 && c.includes(cw);
  });
}

// ── The measurement ──────────────────────────────────────────────────────────────
export function measureProfile(text, ctx = {}) {
  if (typeof text !== "string" || text.replace(/\s+/g, "").length < 200) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const iSummary = findMarker(lines, SECTION_MARKERS.summary);
  const iExperience = findMarker(lines, SECTION_MARKERS.experience);
  const iEducation = findMarker(lines, SECTION_MARKERS.education);
  const hasSkills = findMarker(lines, SECTION_MARKERS.skills) !== -1;
  const hasEducation = iEducation !== -1;
  const hasCertSection = findMarker(lines, SECTION_MARKERS.certifications) !== -1;
  const hasLanguages = findMarker(lines, SECTION_MARKERS.languages) !== -1;
  const hasHonors = findMarker(lines, SECTION_MARKERS.honors) !== -1;

  // Language-coverage gate: can't confidently measure an export whose headers speak
  // none of our marker languages -> null -> model-only (never fake anchors).
  const signals = [iSummary !== -1, iExperience !== -1, hasSkills, hasEducation].filter(Boolean).length;
  if (signals < 2) return null;

  // Name line: skip the Contact sidebar, match the real name (fold + translit + compact).
  const first = ctx.firstName || "", last = ctx.lastName || "";
  const nameVariants = (s) => [fold(s), foldT(s)].filter((x) => x.length >= 2);
  const fv = nameVariants(first), lv = nameVariants(last);
  let nameIdx = -1;
  if (fv.length || lv.length) {
    nameIdx = lines.findIndex((l) => {
      if (!l || l.length > 60 || isContactLine(l) || isMarkerLine(l, ANY_MARKER)) return false;
      const fl = fold(l), flt = foldT(l), cl = compact(l);
      const hit = (vs) => vs.some((v) => fl.includes(v) || flt.includes(v) || cl.includes(v.replace(/[\s\-.]+/g, "")));
      // Word-boundary check so a name never matches inside a longer hyphenated slug
      // ("grandits" in "grandits-global-leader-emea").
      const word = (vs) => vs.some((v) => new RegExp("(^|[^\\p{L}])" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^\\p{L}])", "u").test(fl) || new RegExp("(^|[^\\p{L}])" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^\\p{L}])", "u").test(flt));
      const hasFirst = fv.length ? hit(fv) : false;
      const hasLast = lv.length ? hit(lv) : false;
      return (hasFirst && hasLast) || (last.length >= 4 && word(lv) && l.split(/[\s]+/).length <= 5 && (l.match(/-/g) || []).length < 2);
    });
  }

  // Headline window: lines after the name up to the first section marker or location,
  // Contact lines skipped. Ambiguity -> UNMEASURED (null), never a false "gap".
  let headline = "";
  let headlineMeasured = false;
  if (nameIdx !== -1) {
    const buf = [];
    let clean = true;
    for (let i = nameIdx + 1; i < Math.min(nameIdx + 7, lines.length); i++) {
      const l = lines[i];
      if (!l) { if (buf.length) break; else continue; }
      if (isMarkerLine(l, ANY_MARKER)) break;
      if (isContactLine(l)) continue;
      if (looksLikeLocation(l)) break;
      buf.push(l);
      if (buf.join(" ").length > 240) { clean = false; break; }
      if (buf.length >= 4) break;
    }
    headline = buf.join(" ").trim().slice(0, 220);
    headlineMeasured = clean && headline.length >= 8;
  }

  // About region: Summary marker to the next structural marker. Content measured by
  // total non-skill, non-marker character mass (robust to line-broken styles).
  let aboutMeasured = false, aboutContentLen = 0, aboutHasNumbers = false, aboutCta = false, aboutRegion = "";
  if (iSummary !== -1) {
    let end = Math.min(iSummary + 70, lines.length);
    for (let i = iSummary + 1; i < end; i++) {
      if (lines[i] && isMarkerLine(lines[i], [...SECTION_MARKERS.experience, ...SECTION_MARKERS.education, ...SECTION_MARKERS.certifications, ...SECTION_MARKERS.skills])) { end = i; break; }
    }
    const region = lines.slice(iSummary + 1, end).filter((l) => l && !isMarkerLine(l, ANY_MARKER) && !isContactLine(l));
    aboutRegion = region.join("\n");
    // Skill lines are short single terms; count only substantive content.
    aboutContentLen = region.filter((l) => l.length >= 25 || /[.!?,]/.test(l)).join(" ").length;
    aboutHasNumbers = /\d/.test(aboutRegion);
    aboutCta = hasAny(aboutRegion, CTA_WORDS);
    aboutMeasured = aboutContentLen >= 120; // confident there IS an About; else unmeasured
  }

  // Experience region: after Experience marker, bounded at Education.
  let expMeasured = false, roleCount = 0, describedRoles = 0, currentRoleDescLen = 0, expHasNumbers = false;
  if (iExperience !== -1) {
    const end = iEducation !== -1 && iEducation > iExperience ? iEducation : lines.length;
    const expLines = lines.slice(iExperience + 1, end);
    const dateIdx = [];
    for (let i = 0; i < expLines.length; i++) if (isDateRangeLine(expLines[i])) dateIdx.push(i);
    roleCount = dateIdx.length;
    if (roleCount) {
      // Described roles: date lines followed by a substantive, non-location line.
      for (const di of dateIdx) {
        for (let j = di + 1; j < Math.min(di + 6, expLines.length); j++) {
          const l = expLines[j];
          if (!l || isDateRangeLine(l)) break;
          if (looksLikeLocation(l)) continue;
          if (l.length >= 60) { describedRoles++; break; }
        }
      }
      const firstDesc = [];
      for (let j = dateIdx[0] + 1; j < (dateIdx[1] != null ? dateIdx[1] - 1 : Math.min(dateIdx[0] + 16, expLines.length)); j++) {
        const l = expLines[j];
        if (l && l.length >= 30 && !looksLikeLocation(l)) firstDesc.push(l);
      }
      currentRoleDescLen = firstDesc.join(" ").length;
      expHasNumbers = (firstDesc.join(" ").match(/\d+/g) || []).length >= 2;
      expMeasured = true;
    }
  }

  const websites = (text.match(/\bwww\.[^\s)]+|https?:\/\/[^\s)]+/gi) || []).length;
  const hasCerts = hasCertSection || hasAny(text, CREDENTIAL_WORDS);

  // ── Section anchors (null = unmeasured -> model scores freely). ──
  let headlineScore = null;
  if (headlineMeasured) {
    let h = 35 + 8;
    if (headline.length >= 40) h += 6;
    if (headline.length >= 70) h += 4;
    if (/[|·•]/.test(headline)) h += 6;
    let lex = 0;
    if (hasAny(headline, HELP_VERBS)) lex += 8;
    if (hasAny(headline, AUDIENCE_WORDS)) lex += 5;
    if (hasAny(headline, OUTCOME_WORDS)) lex += 5;
    if (hasAny(headline, CREDENTIAL_WORDS)) lex += 4;
    h += Math.min(lex, 14);
    const jobWords = norm(ctx.jobTitle || "").split(/[^\p{L}]+/u).filter((w) => w.length >= 5);
    if (jobWords.some((w) => compact(headline).includes(compact(w)))) h += 6;
    if (headline.length >= 70 && /[|·•]/.test(headline)) h += 5; // structured AND substantial -> elite reachable
    headlineScore = clampBand(h);
  }

  let aboutScore = null;
  if (aboutMeasured) {
    let a = 35 + 10;
    if (aboutContentLen >= 300) a += 8;
    if (aboutContentLen >= 700) a += 6;
    let lex = 0;
    if (hasAny(aboutRegion, HELP_VERBS)) lex += 6;
    if (hasAny(aboutRegion, AUDIENCE_WORDS)) lex += 4;
    if (aboutCta) lex += 6;
    a += Math.min(lex, 12);
    if (aboutHasNumbers) a += 4;
    if (aboutContentLen >= 900) a += 5; // genuinely rich
    aboutScore = clampBand(a);
  }

  let experienceScore = null;
  if (expMeasured) {
    let e = 35 + 6;
    if (roleCount >= 2) e += 4;
    if (roleCount >= 4) e += 4;
    if (currentRoleDescLen >= 150) e += 8;
    if (currentRoleDescLen >= 350) e += 6;
    if (expHasNumbers) e += 8;
    if (describedRoles >= 3) e += 10;
    experienceScore = clampBand(e);
  }

  let completeness = 35;
  if (websites >= 2) completeness += 12; else if (websites >= 1) completeness += 7;
  if (hasSkills) completeness += 11;
  if (hasEducation) completeness += 11;
  if (hasCerts) completeness += 12;
  if (hasLanguages) completeness += 6;
  if (hasHonors) completeness += 5;
  completeness = clampBand(completeness);

  // Provisional overall (model-independent estimate over measured parts) - only used
  // as the forge-reconciliation reference server-side; the DISPLAYED overall is
  // recomputed from the blended sub-scores in blendPlanScores.
  const parts = [];
  if (headlineScore != null) parts.push([headlineScore, 0.3]);
  if (aboutScore != null) parts.push([aboutScore, 0.3]);
  if (experienceScore != null) parts.push([experienceScore, 0.25]);
  parts.push([completeness, 0.15]);
  const wsum = parts.reduce((s, [, w]) => s + w, 0);
  const provisionalOverall = clampBand(parts.reduce((s, [v, w]) => s + v * w, 0) / wsum);

  return {
    det: { headline: headlineScore, about: aboutScore, experience: experienceScore, completeness, provisionalOverall },
    features: {
      headlineMeasured, headlineText: sanitizeForPrompt(headline), headlineLen: headline.length,
      headlineSeparator: /[|·•]/.test(headline),
      headlinePositioning: hasAny(headline, HELP_VERBS) || hasAny(headline, AUDIENCE_WORDS),
      aboutMeasured, aboutContentLen, aboutCta,
      expMeasured, roleCount, describedRoles, currentRoleDescLen, expHasNumbers,
      websites, hasSkills, hasEducation, hasCerts, hasLanguages,
    },
  };
}

// Strip quotes/newlines/control chars so a headline can't break out of its quoted
// slot or inject directives into the prompt's highest-authority section.
function sanitizeForPrompt(s) {
  return String(s || "").replace(/["'` -]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

// Wire payload for the request. Carries the per-section anchors + provisional overall
// (server reconciles the latter against the model's own read to reject forgery).
export function detPayload(m) {
  if (!m || !m.det) return null;
  const n = (v) => (Number.isFinite(v) ? Math.round(v) : null);
  return { headline: n(m.det.headline), about: n(m.det.about), experience: n(m.det.experience), completeness: n(m.det.completeness), provisionalOverall: n(m.det.provisionalOverall) };
}
export function validDet(d) {
  if (!d || typeof d !== "object") return null;
  const ok = (v) => v == null || (Number.isFinite(Number(v)) && Number(v) >= 35 && Number(v) <= 92);
  if (!ok(d.headline) || !ok(d.about) || !ok(d.experience) || !ok(d.completeness) || !ok(d.provisionalOverall)) return null;
  if (!Number.isFinite(Number(d.completeness))) return null;
  const r = (v) => (v == null ? null : Math.round(Number(v)));
  return { headline: r(d.headline), about: r(d.about), experience: r(d.experience), completeness: r(d.completeness) == null ? 50 : r(d.completeness), provisionalOverall: r(d.provisionalOverall) };
}

// ── Prompt block ─────────────────────────────────────────────────────────────────
export function measuredBlock(m) {
  if (!m) return "";
  const f = m.features, d = m.det, yn = (b) => (b ? "yes" : "no");
  const sec = (label, measured, detail) =>
    `- ${label}: ` + (measured ? detail : "could not be reliably measured from the export text; read the attached PDF yourself and score this section independently and honestly");
  const anchorLine = (v) => (v == null ? "score it yourself from the PDF" : "within 5 points of " + v);
  return `
MEASURED PROFILE FEATURES (computed deterministically from the uploaded profile text; GROUND TRUTH for scoring):
${sec("Headline", f.headlineMeasured, `"${f.headlineText}" (${f.headlineLen} chars; positioning separator: ${yn(f.headlineSeparator)}; audience/outcome language: ${yn(f.headlinePositioning)})`)}
${sec("About/Summary", f.aboutMeasured, `present, ~${f.aboutContentLen} chars of substantive content; call to action: ${yn(f.aboutCta)}`)}
${sec("Experience", f.expMeasured, `${f.roleCount} dated role(s), ${f.describedRoles} with real descriptions; current role description ~${f.currentRoleDescLen} chars; concrete numbers: ${yn(f.expHasNumbers)}`)}
- Completeness: websites ${f.websites}; skills section ${yn(f.hasSkills)}; education ${yn(f.hasEducation)}; certifications/credentials ${yn(f.hasCerts)}
SCORING CONSISTENCY, CRITICAL: set profile_scores.headline ${anchorLine(d.headline)}; profile_scores.about ${anchorLine(d.about)}; profile_scores.experience ${anchorLine(d.experience)}. Anchored sections are computed from what the profile ACTUALLY contains; your judgment refines them, it never overrules them. Sections marked "could not be reliably measured" are yours to score honestly from the PDF. NEVER mention these anchors, measurements or any measurement process in user-visible text, and never state a numeric score in prose.
PERCEPTION VS GROUND TRUTH, CRITICAL: the quiz answers and the note describe the situation as the user sees it, possibly written BEFORE their latest profile edits. The uploaded profile text is the current ground truth. When the measurements show a recommendation is ALREADY implemented (a positioned headline with audience language, a substantive About with a call to action, described experience, listed certifications), acknowledge that progress in the diagnosis and urgency, do NOT advise a change that is already done, and advise the NEXT lever instead. If the note claims a problem the current profile no longer shows, say plainly that their profile is already ahead of their own description.`;
}

// ── The blend (SERVER-SIDE, api/generate-plan.js) ────────────────────────────────
// Runs once before the plan is stored, so gate teaser, report, /plan/:id link and
// dashboard all share one number. Sub-scores: 0.6 anchor + 0.4 model-clamped-to-
// anchor+-5 (null anchor -> model passes through). Overall is the weighted average of
// the RESULTING sub-scores + completeness, so partial measurement is self-consistent.
// FORGE GUARD: the caller must pass hadProfile=true (a real document was in the
// request) AND the provisional overall must be within 25 of the model's own overall;
// otherwise the anchors are ignored (logged) and the plan stays model-only. This caps
// a tampered client payload to at most the model's own honest read.
export function blendPlanScores(plan, det, opts = {}) {
  if (!plan || typeof plan !== "object" || !det) return plan;
  // hadProfile MUST be set by the server only after it RECOMPUTED det from the profile
  // text itself (never from a client-supplied score). That server-recompute is the real
  // forge defense: a tampered score field is ignored because the number is derived here
  // from the text. No output-vs-model reconciliation band exists, and deliberately so -
  // a legitimate rescue (the model badly under-scores a genuinely strong profile) is
  // indistinguishable by magnitude from a forge, so any band tight enough to catch
  // forgery would also throw away the exact rescue this system exists to perform.
  if (opts.hadProfile !== true) { plan._anchored = false; return plan; }
  const ps = (plan.profile_scores && typeof plan.profile_scores === "object") ? plan.profile_scores : (plan.profile_scores = {});
  const blend = (anchor, model) => {
    if (anchor == null) return Number.isFinite(Number(model)) ? clampBand(Number(model)) : model;
    const mv = Number(model);
    const anchored = Number.isFinite(mv) ? Math.max(anchor - 5, Math.min(anchor + 5, mv)) : anchor;
    return clampBand(0.6 * anchor + 0.4 * anchored);
  };
  ps.headline = blend(det.headline, ps.headline);
  ps.about = blend(det.about, ps.about);
  ps.experience = blend(det.experience, ps.experience);
  // Overall from the blended sub-scores + deterministic completeness. Internally
  // consistent by construction: no independent overall anchor to contradict them.
  const comp = Number.isFinite(Number(det.completeness)) ? Number(det.completeness) : 50;
  const sub = [];
  if (Number.isFinite(Number(ps.headline))) sub.push([Number(ps.headline), 0.3]);
  if (Number.isFinite(Number(ps.about))) sub.push([Number(ps.about), 0.3]);
  if (Number.isFinite(Number(ps.experience))) sub.push([Number(ps.experience), 0.25]);
  sub.push([comp, 0.15]);
  const wsum = sub.reduce((s, [, w]) => s + w, 0);
  ps.overall = clampBand(sub.reduce((s, [v, w]) => s + v * w, 0) / wsum);
  plan.score = ps.overall;
  plan._anchored = true;
  // Prose must agree with the blended number: normalize every score-mention form the
  // model emits ("score of 58", "58/100", "58 out of 100").
  const scrub = (s) => typeof s === "string"
    ? s.replace(/\b((?:overall|linkedin)?\s?(?:score|rating|estimate)\s+(?:of|:)\s+)\d{1,3}\b/gi, (mm, p1) => p1 + plan.score)
        .replace(/\b\d{1,3}\s*\/\s*100\b/g, plan.score + "/100")
        .replace(/\b\d{1,3}(\s+out of\s+100)\b/gi, (mm, p1) => plan.score + p1)
    : s;
  for (const k of ["urgency", "closing_message", "headline"]) plan[k] = scrub(plan[k]);
  return plan;
}
