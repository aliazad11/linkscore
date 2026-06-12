import { createContext, useContext, useState, useMemo, useCallback } from "react";

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

const SUPPORTED = LOCALES.map((l) => l.code);

export function detectLocale() {
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
// so the UI is never broken while translations are filled in.
const STRINGS = {
  en: {
    cohort_q: "Which best describes you?",
    cohort_sub: "This shapes your entire plan, be honest.",
    form_title: "Let's make this personal.",
    form_sub: "We need a few details to tailor your plan.",
    lbl_first: "First Name", lbl_last: "Last Name", lbl_age: "Age",
    lbl_title: "Current Title", lbl_linkedin: "LinkedIn Profile URL",
    btn_continue: "Continue →", btn_back: "← Back", btn_skip_continue: "Skip & Continue →",
    pdf_title: "Upload your LinkedIn PDF.",
    analyzing_title: "Analyzing, {name}...",
    analyzing_sub: "Building your plan, this takes 30 to 60 seconds.",
    paywall_badge: "Analysis Complete",
    paywall_ready: "Your plan is ready,",
    email_label: "Email Address",
    btn_unlock: "Unlock My LinkedIn Plan →",
    btn_generating: "Generating your plan...",
    result_badge: "Your LinkedIn Plan",
    btn_start_over: "Start Over",
  },
  de: {
    cohort_q: "Was beschreibt Sie am besten?",
    cohort_sub: "Das prägt Ihren gesamten Plan, seien Sie ehrlich.",
    form_title: "Machen wir es persönlich.",
    form_sub: "Wir brauchen ein paar Angaben, um Ihren Plan anzupassen.",
    lbl_first: "Vorname", lbl_last: "Nachname", lbl_age: "Alter",
    lbl_title: "Aktuelle Position", lbl_linkedin: "LinkedIn-Profil-URL",
    btn_continue: "Weiter →", btn_back: "← Zurück", btn_skip_continue: "Überspringen →",
    pdf_title: "Laden Sie Ihr LinkedIn-PDF hoch.",
    analyzing_title: "Analyse läuft, {name}...",
    analyzing_sub: "Ihr Plan wird erstellt, das dauert 30 bis 60 Sekunden.",
    paywall_badge: "Analyse abgeschlossen",
    paywall_ready: "Ihr Plan ist fertig,",
    email_label: "E-Mail-Adresse",
    btn_unlock: "Meinen LinkedIn-Plan freischalten →",
    btn_generating: "Ihr Plan wird erstellt...",
    result_badge: "Ihr LinkedIn-Plan",
    btn_start_over: "Neu starten",
  },
  fr: {
    cohort_q: "Qu'est-ce qui vous décrit le mieux ?",
    cohort_sub: "Cela façonne tout votre plan, soyez honnête.",
    form_title: "Personnalisons cela.",
    form_sub: "Quelques détails pour adapter votre plan.",
    lbl_first: "Prénom", lbl_last: "Nom", lbl_age: "Âge",
    lbl_title: "Poste actuel", lbl_linkedin: "URL du profil LinkedIn",
    btn_continue: "Continuer →", btn_back: "← Retour", btn_skip_continue: "Passer →",
    pdf_title: "Importez votre PDF LinkedIn.",
    analyzing_title: "Analyse en cours, {name}...",
    analyzing_sub: "Création de votre plan, cela prend 30 à 60 secondes.",
    paywall_badge: "Analyse terminée",
    paywall_ready: "Votre plan est prêt,",
    email_label: "Adresse e-mail",
    btn_unlock: "Débloquer mon plan LinkedIn →",
    btn_generating: "Création de votre plan...",
    result_badge: "Votre plan LinkedIn",
    btn_start_over: "Recommencer",
  },
  // es / pt / nl / it: report is already in-language via the prompt; UI strings
  // fall back to English until the translation pass fills them in.
};

function translate(locale, key, vars) {
  const dict = STRINGS[locale] || {};
  let s = dict[key] != null ? dict[key] : (STRINGS.en[key] != null ? STRINGS.en[key] : key);
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

const LocaleCtx = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);
  const setLocale = useCallback((c) => {
    saveLocale(c);
    setLocaleState(c);
    try { document.documentElement.lang = c; } catch (e) {}
  }, []);
  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx) || { locale: "en", setLocale() {}, t: (k) => k };
}
