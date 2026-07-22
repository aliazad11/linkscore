import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { HOME_CSS, homeHtml, homeMeta, LANDING_LOCALES } from './home.js'

const ORIGIN = 'https://www.linkedscore.app'
const localeUrl = (loc) => ORIGIN + '/' + (loc === 'en' ? '' : loc + '/')

// hreflang alternates (identical in every page) + x-default → English root.
const HREFLANG = LANDING_LOCALES
  .map(([c]) => `    <link rel="alternate" hreflang="${c}" href="${localeUrl(c)}" />\n`)
  .join('') + `    <link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />\n`

// English source strings that get swapped for localized copies in each page's <head>.
// Must match index.html's <title> exactly — the locale swap is a literal string replace.
const EN_TITLE = 'LinkedScore | LinkedIn Growth Plan'
const EN_DESC = 'Get your free LinkedIn Score and a personalized AI growth plan: profile rewrites, post hooks and a 30-day roadmap built for your goal.'
const EN_DESC_SHORT = 'Get your free LinkedIn Score and a personalized AI growth plan.'

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Turn the built English template into a fully localized page (home markup, <head>
// meta, canonical, og:url, <html lang>). en returns the template essentially unchanged.
function localizePage(template, loc) {
  const m = homeMeta(loc)
  const url = localeUrl(loc)
  let html = template
    .replace('<div id="root"></div>', `<div id="root"><div class="ls-home">${homeHtml(loc)}</div></div>`)
    .replace('<html lang="en">', `<html lang="${loc}">`)
    .split(EN_TITLE).join(escAttr(m.title))
    .split(EN_DESC).join(escAttr(m.description))
    .split(EN_DESC_SHORT).join(escAttr(m.description))
    .replace(`<link rel="canonical" href="${ORIGIN}/" />`, `<link rel="canonical" href="${url}" />`)
    .replace(`<meta property="og:url" content="${ORIGIN}/" />`, `<meta property="og:url" content="${url}" />`)
  return html
}

// Prerender the static landing so the hero (LCP element) paints before the app's JS
// runs. In dev we inject the English hero inline; in build we inject only the shared
// chrome (CSS + hreflang) and leave #root empty, then emit one fully-localized page
// per locale in writeBundle. Source of truth is home.js, so there's no drift.
function prerenderLanding() {
  let outDir = 'dist'
  return {
    name: 'prerender-landing',
    configResolved(cfg) { outDir = cfg.build?.outDir || 'dist' },
    transformIndexHtml(html, ctx) {
      html = html.replace('</head>', `  <style id="ls-prerender-css">${HOME_CSS}</style>\n${HREFLANG}  </head>`)
      if (ctx.server) {
        // dev: inject the English hero so the landing shows before hydration
        html = html.replace('<div id="root"></div>', `<div id="root"><div class="ls-home">${homeHtml('en')}</div></div>`)
      }
      return html
    },
    writeBundle() {
      const dir = resolve(process.cwd(), outDir)
      const template = readFileSync(resolve(dir, 'index.html'), 'utf8')
      for (const [loc] of LANDING_LOCALES) {
        const page = localizePage(template, loc)
        if (loc === 'en') {
          writeFileSync(resolve(dir, 'index.html'), page)
        } else {
          mkdirSync(resolve(dir, loc), { recursive: true })
          writeFileSync(resolve(dir, loc, 'index.html'), page)
        }
      }
    },
  }
}

export default defineConfig(() => {
  // No client-exposed secrets: the browser talks only to our own /api/* routes,
  // which hold the Supabase service key server-side.
  return {
    plugins: [react(), prerenderLanding()],
    server: { port: Number(process.env.PORT) || 5173 },
  }
})
