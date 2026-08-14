import { useState, useRef, useEffect } from 'react'
import topics from '../data/phrasebook.json'

const MAX_TURNS = 14

function splitReply(content) {
  const match = content.match(/coach note:?\s*/i)
  if (!match) return { patientText: content, coachNote: '' }
  const idx = match.index
  return {
    patientText: content.slice(0, idx).trim(),
    coachNote: content.slice(idx + match[0].length).trim(),
  }
}

function UserAvatar() {
  return (
    <div className="avatar avatar-user" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.4-3.6 4.2-5.5 7-5.5s5.6 1.9 7 5.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function PatientAvatar() {
  return (
    <div className="avatar avatar-assistant">
      <img src="/logo.png" alt="" />
    </div>
  )
}

export default function PracticeChat() {
  const [topicId, setTopicId] = useState(topics[0]?.id)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function startScenario() {
    setMessages([])
    setError('')
    send([], true)
  }

  async function send(history, isStart) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-password': sessionStorage.getItem('sitheth_password') || '',
        },
        body: JSON.stringify({ topicId, messages: history, isStart }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Server error (${res.status})`)
      }
      const data = await res.json()
      setMessages([...history, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const next = [...messages, { role: 'user', content: input.trim() }]
    setMessages(next)
    setInput('')
    await send(next, false)
  }

  const turnsUsed = messages.filter((m) => m.role === 'user').length
  const limitReached = turnsUsed >= MAX_TURNS
  const topicTitle = topics.find((t) => t.id === topicId)?.title

  return (
    <div className="practice-layout">
      <div className="practice-controls">
        <label htmlFor="topic-select">Scenario topic</label>
        <select
          id="topic-select"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          disabled={messages.length > 0}
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        {messages.length === 0 ? (
          <button className="primary" onClick={startScenario} disabled={loading}>
            {loading ? 'Starting…' : 'Start scenario'}
          </button>
        ) : (
          <button onClick={startScenario} disabled={loading}>Restart</button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="chat-header">
          <PatientAvatar />
          <div>
            <p className="chat-header-name">Patient roleplay</p>
            <p className="chat-header-topic">{topicTitle}</p>
          </div>
        </div>
      )}

      <div className="chat-window">
        {messages.length === 0 && !loading && (
          <p className="chat-empty">
            Pick a topic and start a scenario. The AI will play a patient — try to
            greet them, ask your questions, and respond in isiXhosa where you can.
            After each reply you'll get a short coach note.
          </p>
        )}
        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div className="msg-row user" key={i}>
                <div className="bubble-stack">
                  <div className="bubble user">{m.content}</div>
                </div>
                <UserAvatar />
              </div>
            )
          }
          const { patientText, coachNote } = splitReply(m.content)
          return (
            <div className="msg-row assistant" key={i}>
              <PatientAvatar />
              <div className="bubble-stack">
                <div className="bubble assistant">{patientText}</div>
                {coachNote && (
                  <div className="coach-note">
                    <span className="coach-label">Coach note</span>
                    {coachNote}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="msg-row assistant">
            <PatientAvatar />
            <div className="typing-indicator" aria-label="Patient is typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="chat-error">{error}</p>}

      {limitReached ? (
        <p className="chat-limit">
          That's a good stopping point for this scenario. Hit Restart to try another topic.
        </p>
      ) : (
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={messages.length === 0 ? 'Start a scenario first…' : 'Type your response…'}
            disabled={messages.length === 0 || loading}
          />
          <button type="submit" disabled={messages.length === 0 || loading || !input.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12l16-7-6 16-2.5-6.5L4 12z" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}
