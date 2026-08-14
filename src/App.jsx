import { useState, useEffect } from 'react'
import Gate from './components/Gate.jsx'
import PhraseBrowser from './components/PhraseBrowser.jsx'
import PracticeChat from './components/PracticeChat.jsx'

const GATE_ENABLED_KEY = 'sitheth_gate_checked'

export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('sitheth_unlocked') === 'true'
  )
  const [gateRequired, setGateRequired] = useState(null) // null = unknown yet
  const [view, setView] = useState('phrasebook')

  useEffect(() => {
    // Ask the server whether a password is even required (ACCESS_PASSWORD may be unset in dev)
    fetch('/api/auth', { method: 'GET' })
      .then((r) => r.json())
      .then((d) => setGateRequired(!!d.required))
      .catch(() => setGateRequired(false))
  }, [])

  if (gateRequired === null) {
    return <div className="loading-screen">Loading Sitheth'iMpilo…</div>
  }

  if (gateRequired && !unlocked) {
    return <Gate onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.png" alt="Sitheth'iMpilo logo" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-xhosa">Sitheth'iMpilo</span>
            <span className="brand-sub">Speak · Connect · Care</span>
          </div>
        </div>
        <nav className="tabs">
          <button
            className={view === 'phrasebook' ? 'tab active' : 'tab'}
            onClick={() => setView('phrasebook')}
          >
            Phrasebook
          </button>
          <button
            className={view === 'practice' ? 'tab active' : 'tab'}
            onClick={() => setView('practice')}
          >
            Practice with AI
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'phrasebook' ? <PhraseBrowser /> : <PracticeChat />}
      </main>

      <footer className="app-footer">
        Built from the UWC Clinical Communication isiXhosa Phrasebook. The AI practice
        partner can make mistakes — always confirm clinical language with a fluent speaker.
      </footer>
    </div>
  )
}
