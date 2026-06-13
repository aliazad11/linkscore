import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { STRINGS, COHORT_T, QUIZ_T } from "./i18n.data.js";

// Launch set (left-to-right). Arabic (RTL) is phase 2.
export const LOCALES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "nl", name: "Nederlands" },
  { code: "it", name: "Italiano" },
];

// Full language name injected into the AI prompt so the report comes back in-language.
export const PROMPT_LANG = {
  en: "English", de: "German", fr: "French", es: "Spanish",
  pt: "Portuguese", nl: "Dutch", it: "Italian", ar: "Arabic",
};

// A few short keys the bulk translation pass didn't cover (dynamic-phase chrome).
// Merged over the generated catalog so they participate in the same fallback chain.
const EXTRA = {
  en: { badge_step3: "Step 3 of 3", q_counter: "Question {n} of {m}", paywall_locked: "Enter your email to unlock the full report", pdf_upload_cta: "Upload PDF (recommended, 30 seconds)", skip_preliminary: "Skip if you must, your score will be marked preliminary.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} uploaded", gen_title: "Almost there...", gen_sub: "Generating your personalized plan.", link_not_found: "Link Not Found", noun_deal: "deal", noun_customer: "customer", noun_project: "project", noun_client: "client" },
  de: { badge_step3: "Schritt 3 von 3", q_counter: "Frage {n} von {m}", paywall_locked: "Gib deine E-Mail ein, um den vollständigen Bericht freizuschalten", pdf_upload_cta: "PDF hochladen (empfohlen, 30 Sekunden)", skip_preliminary: "Überspringen, wenn es sein muss. Dein Score gilt dann als vorläufig.", ss_post: "Beitrag {n}", ss_post_uploaded: "Beitrag {n} hochgeladen", gen_title: "Fast geschafft...", gen_sub: "Ihr personalisierter Plan wird erstellt.", link_not_found: "Link nicht gefunden", noun_deal: "Abschluss", noun_customer: "Kunde", noun_project: "Projekt", noun_client: "Kunde" },
  fr: { badge_step3: "Étape 3 sur 3", q_counter: "Question {n} sur {m}", paywall_locked: "Saisissez votre e-mail pour débloquer le rapport complet", pdf_upload_cta: "Importer le PDF (recommandé, 30 secondes)", skip_preliminary: "Passez si nécessaire. Votre score sera alors marqué comme préliminaire.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} importé", gen_title: "Presque terminé...", gen_sub: "Génération de votre plan personnalisé.", link_not_found: "Lien introuvable", noun_deal: "contrat", noun_customer: "client", noun_project: "projet", noun_client: "client" },
  es: { badge_step3: "Paso 3 de 3", q_counter: "Pregunta {n} de {m}", paywall_locked: "Introduce tu correo para desbloquear el informe completo", pdf_upload_cta: "Subir PDF (recomendado, 30 segundos)", skip_preliminary: "Sáltalo si es necesario. Tu puntuación se marcará como preliminar.", ss_post: "Publicación {n}", ss_post_uploaded: "Publicación {n} subida", gen_title: "Casi listo...", gen_sub: "Generando tu plan personalizado.", link_not_found: "Enlace no encontrado", noun_deal: "operación", noun_customer: "cliente", noun_project: "proyecto", noun_client: "cliente" },
  pt: { badge_step3: "Etapa 3 de 3", q_counter: "Pergunta {n} de {m}", paywall_locked: "Introduz o teu e-mail para desbloquear o relatório completo", pdf_upload_cta: "Carregar PDF (recomendado, 30 segundos)", skip_preliminary: "Salta se for preciso. A tua pontuação ficará marcada como preliminar.", ss_post: "Publicação {n}", ss_post_uploaded: "Publicação {n} enviada", gen_title: "Quase lá...", gen_sub: "Gerando o seu plano personalizado.", link_not_found: "Link não encontrado", noun_deal: "negócio", noun_customer: "cliente", noun_project: "projeto", noun_client: "cliente" },
  nl: { badge_step3: "Stap 3 van 3", q_counter: "Vraag {n} van {m}", paywall_locked: "Voer je e-mail in om het volledige rapport te ontgrendelen", pdf_upload_cta: "PDF uploaden (aanbevolen, 30 seconden)", skip_preliminary: "Sla over als het moet. Je score wordt dan als voorlopig gemarkeerd.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} geüpload", gen_title: "Bijna klaar...", gen_sub: "Je gepersonaliseerde plan wordt gegenereerd.", link_not_found: "Link niet gevonden", noun_deal: "deal", noun_customer: "klant", noun_project: "project", noun_client: "klant" },
  it: { badge_step3: "Passaggio 3 di 3", q_counter: "Domanda {n} di {m}", paywall_locked: "Inserisci la tua e-mail per sbloccare il report completo", pdf_upload_cta: "Carica il PDF (consigliato, 30 secondi)", skip_preliminary: "Salta se proprio devi. Il tuo punteggio sarà segnato come preliminare.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} caricato", gen_title: "Ci siamo quasi...", gen_sub: "Generazione del tuo piano personalizzato.", link_not_found: "Link non trovato", noun_deal: "affare", noun_customer: "cliente", noun_project: "progetto", noun_client: "cliente" },
};
const DICT = {};
for (const code of Object.keys(STRINGS)) DICT[code] = { ...STRINGS[code], ...(EXTRA[code] || {}) };

const SUPPORTED = LOCALES.map((l) => l.code);

export function detectLocale() {
  // 1. URL path prefix (the localized landing routes, e.g. /de/). This is the
  //    strongest signal: the prerendered page the user is on is already in that
  //    language, so it wins over a saved preference.
  try {
    const seg = (location.pathname.split("/")[1] || "").toLowerCase();
    if (seg !== "en" && SUPPORTED.indexOf(seg) !== -1) return seg;
  } catch (e) {}
  try {
    const saved = localStorage.getItem("ls_locale");
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
  } catch (e) {}
  try {
    const langs = navigator.languages || [navigator.language || "en"];
    for (const l of langs) {
      const base = String(l).slice(0, 2).toLowerCase();
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
  } catch (e) {}
  return "en";
}

function saveLocale(code) {
  try { localStorage.setItem("ls_locale", code); } catch (e) {}
}

// `en` is the source of truth. Any missing key in another locale falls back to en,
// so the UI is never broken if a translation is absent.
function translate(locale, key, vars) {
  const dict = DICT[locale] || DICT.en;
  let s = dict[key] != null ? dict[key] : (DICT.en[key] != null ? DICT.en[key] : key);
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

// Cohort card / headline text. English is left untouched (returns the fallback the
// caller already hardcoded); other locales pull from the translation catalog and
// gracefully fall back to English if a field is missing.
export function cohortText(locale, cohortId, field, fallback) {
  if (locale === "en") return fallback;
  const t = COHORT_T[locale] && COHORT_T[locale][cohortId];
  return (t && t[field]) || fallback;
}

// Overlay translations onto a quiz question array WITHOUT touching option `label`,
// which doubles as the stable logic value across the funnel. We only add a `display`
// field (the translated label) and translate the question/subtitle. English passes
// through unchanged, so the English funnel is byte-for-byte identical.
export function localizeQuestions(questions, locale, cohortId) {
  if (locale === "en" || !QUIZ_T[locale]) return questions;
  const G = QUIZ_T[locale].generic || {};
  const C = (QUIZ_T[locale].cohort && QUIZ_T[locale].cohort[cohortId]) || {};
  return questions.map((q) => {
    const tq = G[q.id] || C[q.id];
    if (!tq) return q;
    const opts = tq.options || {};
    return {
      ...q,
      question: tq.question || q.question,
      subtitle: tq.subtitle || q.subtitle,
      options: q.options.map((o) => ({ ...o, display: opts[o.label] || o.label })),
    };
  });
}

const LocaleCtx = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);
  const setLocale = useCallback((c) => {
    saveLocale(c);
    setLocaleState(c);
    try { document.documentElement.lang = c; } catch (e) {}
  }, []);
  // Keep <html lang> in sync with the active locale (the prerendered page sets it
  // server-side; this covers initial hydration and client-side language switches).
  useEffect(() => { try { document.documentElement.lang = locale; } catch (e) {} }, [locale]);
  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx) || { locale: "en", setLocale() {}, t: (k) => k };
}
