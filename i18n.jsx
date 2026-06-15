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
  en: { nav_about: "About", nav_faq: "FAQ", survey_q: "How accurate is your archetype?", survey_ph: "Anything we got wrong? (optional)", survey_send: "Send feedback", survey_thanks: "Thanks, this helps us sharpen the engine.", survey_rate: "Rate {n} of 5", sc_kicker: "Share your archetype", sc_heading_pre: "Show your network you are ", sc_heading_post: ".", sc_instruction: "Post the image as a regular photo, then paste the caption below. Native photos reach far more people than a link preview.", sc_personal_ph: "Add one line of your own (optional)", sc_try: "Try another caption", sc_male: "Male", sc_female: "Female", sc_download: "Download image", sc_saved: "Saved", share_title: "Share your score", share_sub: "Show your network where you stand.", share_linkedin: "Share on LinkedIn", share_copy: "Copy link", share_copied: "Copied!", share_caption_copy: "Copy caption", share_li_hint: "Caption copied. Paste it into your LinkedIn post.", share_caption: "My LinkedIn score came back: {score}/100. Turns out I am “{archetype}”. LinkedScore gave me a free, specific plan to fix it. Worth 5 minutes.", resume_cta: "Continue your analysis", resume_dismiss: "Dismiss", badge_step3: "Step 3 of 3", q_counter: "Question {n} of {m}", paywall_locked: "Enter your email to unlock the full report", gate_goal: "Built around what you told us:", legal_imprint: "Legal", legal_privacy: "Privacy", legal_terms: "Terms", cc_title: "We value your privacy", cc_desc: "We use essential cookies to run the site and optional analytics to improve it.", cc_accept: "Accept all", cc_reject: "Reject all", cc_customize: "Customize", cc_save: "Save choices", cc_essential: "Essential", cc_essential_desc: "Required for the site to work.", cc_analytics: "Analytics", cc_analytics_desc: "Helps us improve LinkedScore (PostHog, EU).", cc_always_on: "Always on", cc_settings: "Cookie settings", legal_cookies: "Cookies", pdf_upload_cta: "Upload PDF (recommended, 30 seconds)", skip_preliminary: "Skip if you must, your score will be marked preliminary.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} uploaded", gen_title: "Almost there...", gen_sub: "Generating your personalized plan.", link_not_found: "Link Not Found", noun_deal: "deal", noun_customer: "customer", noun_project: "project", noun_client: "client" },
  de: { nav_about: "Über uns", nav_faq: "FAQ", survey_q: "Wie treffend ist dein Archetyp?", survey_ph: "Haben wir etwas falsch eingeschätzt? (optional)", survey_send: "Feedback senden", survey_thanks: "Danke, das hilft uns, die Analyse zu schärfen.", survey_rate: "Mit {n} von 5 bewerten", sc_kicker: "Teile deinen Archetyp", sc_heading_pre: "Zeig deinem Netzwerk, dass du ", sc_heading_post: " bist.", sc_instruction: "Poste das Bild als normales Foto und füge dann den Text darunter ein. Native Fotos erreichen weit mehr Menschen als eine Linkvorschau.", sc_personal_ph: "Füge eine eigene Zeile hinzu (optional)", sc_try: "Anderen Text versuchen", sc_male: "Männlich", sc_female: "Weiblich", sc_download: "Bild herunterladen", sc_saved: "Gespeichert", share_title: "Teile deinen Score", share_sub: "Zeig deinem Netzwerk, wo du stehst.", share_linkedin: "Auf LinkedIn teilen", share_copy: "Link kopieren", share_copied: "Kopiert!", share_caption_copy: "Text kopieren", share_li_hint: "Text kopiert. Füge ihn in deinen LinkedIn-Beitrag ein.", share_caption: "Mein LinkedIn-Score: {score}/100. Offenbar bin ich “{archetype}”. LinkedScore hat mir kostenlos einen konkreten Plan erstellt. 5 Minuten, die sich lohnen.", resume_cta: "Analyse fortsetzen", resume_dismiss: "Schließen", badge_step3: "Schritt 3 von 3", q_counter: "Frage {n} von {m}", paywall_locked: "Gib deine E-Mail ein, um den vollständigen Bericht freizuschalten", gate_goal: "Zugeschnitten auf das, was du uns gesagt hast:", legal_imprint: "Impressum", legal_privacy: "Datenschutz", legal_terms: "AGB", cc_title: "Wir respektieren deine Privatsphäre", cc_desc: "Wir verwenden essenzielle Cookies für den Betrieb der Seite und optionale Analyse-Cookies zur Verbesserung.", cc_accept: "Alle akzeptieren", cc_reject: "Alle ablehnen", cc_customize: "Anpassen", cc_save: "Auswahl speichern", cc_essential: "Essenziell", cc_essential_desc: "Für den Betrieb der Seite erforderlich.", cc_analytics: "Analyse", cc_analytics_desc: "Hilft uns, LinkedScore zu verbessern (PostHog, EU).", cc_always_on: "Immer aktiv", cc_settings: "Cookie-Einstellungen", legal_cookies: "Cookies", pdf_upload_cta: "PDF hochladen (empfohlen, 30 Sekunden)", skip_preliminary: "Überspringen, wenn es sein muss. Dein Score gilt dann als vorläufig.", ss_post: "Beitrag {n}", ss_post_uploaded: "Beitrag {n} hochgeladen", gen_title: "Fast geschafft...", gen_sub: "Ihr personalisierter Plan wird erstellt.", link_not_found: "Link nicht gefunden", noun_deal: "Abschluss", noun_customer: "Kunde", noun_project: "Projekt", noun_client: "Kunde" },
  fr: { nav_about: "À propos", nav_faq: "FAQ", survey_q: "Votre archétype est-il juste ?", survey_ph: "On s'est trompé sur quelque chose ? (facultatif)", survey_send: "Envoyer mon avis", survey_thanks: "Merci, cela nous aide à affiner l'analyse.", survey_rate: "Attribuer {n} étoiles sur 5", sc_kicker: "Partagez votre archétype", sc_heading_pre: "Montrez à votre réseau que vous êtes ", sc_heading_post: ".", sc_instruction: "Publiez l'image comme une photo normale, puis collez le texte ci-dessous. Les photos natives touchent bien plus de monde qu'un aperçu de lien.", sc_personal_ph: "Ajoutez une ligne à vous (facultatif)", sc_try: "Essayer un autre texte", sc_male: "Homme", sc_female: "Femme", sc_download: "Télécharger l'image", sc_saved: "Enregistré", share_title: "Partagez votre score", share_sub: "Montrez à votre réseau où vous en êtes.", share_linkedin: "Partager sur LinkedIn", share_copy: "Copier le lien", share_copied: "Copié !", share_caption_copy: "Copier le texte", share_li_hint: "Texte copié. Collez-le dans votre publication LinkedIn.", share_caption: "Mon score LinkedIn : {score}/100. Apparemment, je suis “{archetype}”. LinkedScore m’a donné un plan concret et gratuit. 5 minutes bien investies.", resume_cta: "Reprendre votre analyse", resume_dismiss: "Fermer", badge_step3: "Étape 3 sur 3", q_counter: "Question {n} sur {m}", paywall_locked: "Saisissez votre e-mail pour débloquer le rapport complet", gate_goal: "Conçu d’après ce que vous nous avez dit :", legal_imprint: "Mentions légales", legal_privacy: "Confidentialité", legal_terms: "Conditions", cc_title: "Nous respectons votre vie privée", cc_desc: "Nous utilisons des cookies essentiels pour faire fonctionner le site et des cookies d’analyse optionnels pour l’améliorer.", cc_accept: "Tout accepter", cc_reject: "Tout refuser", cc_customize: "Personnaliser", cc_save: "Enregistrer", cc_essential: "Essentiels", cc_essential_desc: "Nécessaires au fonctionnement du site.", cc_analytics: "Analyse", cc_analytics_desc: "Nous aide à améliorer LinkedScore (PostHog, UE).", cc_always_on: "Toujours actifs", cc_settings: "Paramètres des cookies", legal_cookies: "Cookies", pdf_upload_cta: "Importer le PDF (recommandé, 30 secondes)", skip_preliminary: "Passez si nécessaire. Votre score sera alors marqué comme préliminaire.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} importé", gen_title: "Presque terminé...", gen_sub: "Génération de votre plan personnalisé.", link_not_found: "Lien introuvable", noun_deal: "contrat", noun_customer: "client", noun_project: "projet", noun_client: "client" },
  es: { nav_about: "Acerca de", nav_faq: "FAQ", survey_q: "¿Cuánto acierta tu arquetipo?", survey_ph: "¿Nos equivocamos en algo? (opcional)", survey_send: "Enviar comentario", survey_thanks: "Gracias, esto nos ayuda a afinar el análisis.", survey_rate: "Puntuar {n} de 5", sc_kicker: "Comparte tu arquetipo", sc_heading_pre: "Muéstrale a tu red que eres ", sc_heading_post: ".", sc_instruction: "Publica la imagen como una foto normal y luego pega el texto debajo. Las fotos nativas llegan a mucha más gente que una vista previa de enlace.", sc_personal_ph: "Añade una línea propia (opcional)", sc_try: "Probar otro texto", sc_male: "Hombre", sc_female: "Mujer", sc_download: "Descargar imagen", sc_saved: "Guardado", share_title: "Comparte tu puntuación", share_sub: "Muestra a tu red dónde estás.", share_linkedin: "Compartir en LinkedIn", share_copy: "Copiar enlace", share_copied: "¡Copiado!", share_caption_copy: "Copiar texto", share_li_hint: "Texto copiado. Pégalo en tu publicación de LinkedIn.", share_caption: "Mi puntuación de LinkedIn: {score}/100. Resulta que soy “{archetype}”. LinkedScore me dio un plan concreto y gratis. Cinco minutos que valen la pena.", resume_cta: "Continúa tu análisis", resume_dismiss: "Cerrar", badge_step3: "Paso 3 de 3", q_counter: "Pregunta {n} de {m}", paywall_locked: "Introduce tu correo para desbloquear el informe completo", gate_goal: "Hecho a partir de lo que nos dijiste:", legal_imprint: "Aviso legal", legal_privacy: "Privacidad", legal_terms: "Términos", cc_title: "Valoramos tu privacidad", cc_desc: "Usamos cookies esenciales para que el sitio funcione y cookies de análisis opcionales para mejorarlo.", cc_accept: "Aceptar todo", cc_reject: "Rechazar todo", cc_customize: "Personalizar", cc_save: "Guardar", cc_essential: "Esenciales", cc_essential_desc: "Necesarias para que el sitio funcione.", cc_analytics: "Analítica", cc_analytics_desc: "Nos ayuda a mejorar LinkedScore (PostHog, UE).", cc_always_on: "Siempre activas", cc_settings: "Configuración de cookies", legal_cookies: "Cookies", pdf_upload_cta: "Subir PDF (recomendado, 30 segundos)", skip_preliminary: "Sáltalo si es necesario. Tu puntuación se marcará como preliminar.", ss_post: "Publicación {n}", ss_post_uploaded: "Publicación {n} subida", gen_title: "Casi listo...", gen_sub: "Generando tu plan personalizado.", link_not_found: "Enlace no encontrado", noun_deal: "operación", noun_customer: "cliente", noun_project: "proyecto", noun_client: "cliente" },
  pt: { nav_about: "Sobre", nav_faq: "FAQ", survey_q: "O teu arquétipo está certo?", survey_ph: "Enganámo-nos nalguma coisa? (opcional)", survey_send: "Enviar feedback", survey_thanks: "Obrigado, isto ajuda-nos a afinar a análise.", survey_rate: "Avaliar {n} de 5", sc_kicker: "Partilha o teu arquétipo", sc_heading_pre: "Mostra à tua rede que és ", sc_heading_post: ".", sc_instruction: "Publica a imagem como uma foto normal e depois cola o texto abaixo. As fotos nativas chegam a muito mais gente do que uma pré-visualização de link.", sc_personal_ph: "Acrescenta uma linha tua (opcional)", sc_try: "Experimentar outro texto", sc_male: "Homem", sc_female: "Mulher", sc_download: "Transferir imagem", sc_saved: "Guardado", share_title: "Partilha a tua pontuação", share_sub: "Mostra à tua rede onde estás.", share_linkedin: "Partilhar no LinkedIn", share_copy: "Copiar ligação", share_copied: "Copiado!", share_caption_copy: "Copiar texto", share_li_hint: "Texto copiado. Cola-o na tua publicação do LinkedIn.", share_caption: "A minha pontuação no LinkedIn: {score}/100. Afinal sou “{archetype}”. O LinkedScore deu-me um plano concreto e gratuito. Cinco minutos que valem a pena.", resume_cta: "Retomar a tua análise", resume_dismiss: "Fechar", badge_step3: "Etapa 3 de 3", q_counter: "Pergunta {n} de {m}", paywall_locked: "Introduz o teu e-mail para desbloquear o relatório completo", gate_goal: "Feito com base no que nos disseste:", legal_imprint: "Informações legais", legal_privacy: "Privacidade", legal_terms: "Termos", cc_title: "Valorizamos a tua privacidade", cc_desc: "Usamos cookies essenciais para o site funcionar e cookies de análise opcionais para o melhorar.", cc_accept: "Aceitar tudo", cc_reject: "Rejeitar tudo", cc_customize: "Personalizar", cc_save: "Guardar", cc_essential: "Essenciais", cc_essential_desc: "Necessários para o site funcionar.", cc_analytics: "Análise", cc_analytics_desc: "Ajuda-nos a melhorar o LinkedScore (PostHog, UE).", cc_always_on: "Sempre ativos", cc_settings: "Definições de cookies", legal_cookies: "Cookies", pdf_upload_cta: "Carregar PDF (recomendado, 30 segundos)", skip_preliminary: "Salta se for preciso. A tua pontuação ficará marcada como preliminar.", ss_post: "Publicação {n}", ss_post_uploaded: "Publicação {n} enviada", gen_title: "Quase lá...", gen_sub: "Gerando o seu plano personalizado.", link_not_found: "Link não encontrado", noun_deal: "negócio", noun_customer: "cliente", noun_project: "projeto", noun_client: "cliente" },
  nl: { nav_about: "Over ons", nav_faq: "FAQ", survey_q: "Hoe goed klopt je archetype?", survey_ph: "Hebben we iets verkeerd ingeschat? (optioneel)", survey_send: "Feedback sturen", survey_thanks: "Bedankt, dit helpt ons de analyse aan te scherpen.", survey_rate: "{n} van 5 sterren geven", sc_kicker: "Deel je archetype", sc_heading_pre: "Laat je netwerk zien dat je ", sc_heading_post: " bent.", sc_instruction: "Plaats de afbeelding als een gewone foto en plak daarna de tekst eronder. Native foto's bereiken veel meer mensen dan een linkvoorbeeld.", sc_personal_ph: "Voeg een eigen regel toe (optioneel)", sc_try: "Probeer een andere tekst", sc_male: "Man", sc_female: "Vrouw", sc_download: "Afbeelding downloaden", sc_saved: "Opgeslagen", share_title: "Deel je score", share_sub: "Laat je netwerk zien waar je staat.", share_linkedin: "Delen op LinkedIn", share_copy: "Link kopiëren", share_copied: "Gekopieerd!", share_caption_copy: "Tekst kopiëren", share_li_hint: "Tekst gekopieerd. Plak het in je LinkedIn-bericht.", share_caption: "Mijn LinkedIn-score: {score}/100. Blijkbaar ben ik “{archetype}”. LinkedScore gaf me gratis een concreet plan. Vijf minuten waard.", resume_cta: "Hervat je analyse", resume_dismiss: "Sluiten", badge_step3: "Stap 3 van 3", q_counter: "Vraag {n} van {m}", paywall_locked: "Voer je e-mail in om het volledige rapport te ontgrendelen", gate_goal: "Afgestemd op wat je ons hebt verteld:", legal_imprint: "Juridische informatie", legal_privacy: "Privacy", legal_terms: "Voorwaarden", cc_title: "We respecteren je privacy", cc_desc: "We gebruiken essentiële cookies om de site te laten werken en optionele analyse-cookies om hem te verbeteren.", cc_accept: "Alles accepteren", cc_reject: "Alles weigeren", cc_customize: "Aanpassen", cc_save: "Opslaan", cc_essential: "Essentieel", cc_essential_desc: "Nodig om de site te laten werken.", cc_analytics: "Analyse", cc_analytics_desc: "Helpt ons LinkedScore te verbeteren (PostHog, EU).", cc_always_on: "Altijd aan", cc_settings: "Cookie-instellingen", legal_cookies: "Cookies", pdf_upload_cta: "PDF uploaden (aanbevolen, 30 seconden)", skip_preliminary: "Sla over als het moet. Je score wordt dan als voorlopig gemarkeerd.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} geüpload", gen_title: "Bijna klaar...", gen_sub: "Je gepersonaliseerde plan wordt gegenereerd.", link_not_found: "Link niet gevonden", noun_deal: "deal", noun_customer: "klant", noun_project: "project", noun_client: "klant" },
  it: { nav_about: "Chi siamo", nav_faq: "FAQ", survey_q: "Quanto è azzeccato il tuo archetipo?", survey_ph: "Abbiamo sbagliato qualcosa? (facoltativo)", survey_send: "Invia feedback", survey_thanks: "Grazie, ci aiuta a perfezionare l'analisi.", survey_rate: "Valuta {n} su 5", sc_kicker: "Condividi il tuo archetipo", sc_heading_pre: "Mostra alla tua rete che sei ", sc_heading_post: ".", sc_instruction: "Pubblica l'immagine come una foto normale, poi incolla il testo qui sotto. Le foto native raggiungono molte più persone di un'anteprima di link.", sc_personal_ph: "Aggiungi una riga tua (facoltativo)", sc_try: "Prova un altro testo", sc_male: "Uomo", sc_female: "Donna", sc_download: "Scarica immagine", sc_saved: "Salvato", share_title: "Condividi il tuo punteggio", share_sub: "Mostra alla tua rete a che punto sei.", share_linkedin: "Condividi su LinkedIn", share_copy: "Copia link", share_copied: "Copiato!", share_caption_copy: "Copia testo", share_li_hint: "Testo copiato. Incollalo nel tuo post su LinkedIn.", share_caption: "Il mio punteggio LinkedIn: {score}/100. A quanto pare sono “{archetype}”. LinkedScore mi ha dato un piano concreto e gratuito. Cinque minuti ben spesi.", resume_cta: "Riprendi la tua analisi", resume_dismiss: "Chiudi", badge_step3: "Passaggio 3 di 3", q_counter: "Domanda {n} di {m}", paywall_locked: "Inserisci la tua e-mail per sbloccare il report completo", gate_goal: "Costruito su ciò che ci hai detto:", legal_imprint: "Note legali", legal_privacy: "Privacy", legal_terms: "Termini", cc_title: "Teniamo alla tua privacy", cc_desc: "Usiamo cookie essenziali per far funzionare il sito e cookie di analisi opzionali per migliorarlo.", cc_accept: "Accetta tutto", cc_reject: "Rifiuta tutto", cc_customize: "Personalizza", cc_save: "Salva", cc_essential: "Essenziali", cc_essential_desc: "Necessari per il funzionamento del sito.", cc_analytics: "Analisi", cc_analytics_desc: "Ci aiuta a migliorare LinkedScore (PostHog, UE).", cc_always_on: "Sempre attivi", cc_settings: "Impostazioni cookie", legal_cookies: "Cookie", pdf_upload_cta: "Carica il PDF (consigliato, 30 secondi)", skip_preliminary: "Salta se proprio devi. Il tuo punteggio sarà segnato come preliminare.", ss_post: "Post {n}", ss_post_uploaded: "Post {n} caricato", gen_title: "Ci siamo quasi...", gen_sub: "Generazione del tuo piano personalizzato.", link_not_found: "Link non trovato", noun_deal: "affare", noun_customer: "cliente", noun_project: "progetto", noun_client: "cliente" },
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
