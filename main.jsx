import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initAnalytics } from './analytics.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Defer analytics off the critical path so it doesn't compete with first paint
// or interactivity on a throttled mobile CPU. Early funnel events are queued in
// analytics.js and flushed once PostHog finishes loading, so nothing is lost.
const boot = () => initAnalytics()
if ("requestIdleCallback" in window) requestIdleCallback(boot, { timeout: 4000 })
else setTimeout(boot, 2500)
