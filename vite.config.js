import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { HOME_CSS, HOME_HTML } from './home.js'

// Prerender the static landing into index.html so the hero (the LCP element)
// paints immediately, before the app's JS downloads and executes. React then
// mounts into #root and takes over with identical markup. Source of truth stays
// home.js, so there's no drift.
function prerenderLanding() {
  return {
    name: 'prerender-landing',
    transformIndexHtml(html) {
      return html
        .replace('</head>', `  <style id="ls-prerender-css">${HOME_CSS}</style>\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root"><div class="ls-home">${HOME_HTML}</div></div>`)
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
