import { useState, useRef, useEffect } from 'react'
import topics from '../data/phrasebook.json'

const MAX_TURNS = 14

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
      setMessages([...history, ...(isStart ? [] : []), { role: 'assistant', content: data.reply }])
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

      <div className="chat-window">
        {messages.length === 0 && !loading && (
          <p className="chat-empty">
            Pick a topic and start a scenario. The AI will play a patient — try to
            greet them, ask your questions, and respond in isiXhosa where you can.
            After each reply you'll get a short coach note.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'bubble user' : 'bubble assistant'}>
            {m.content}
          </div>
        ))}
        {loading && <div className="bubble assistant loading">…</div>}
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
          <button type="submit" disabled={messages.length === 0 || loading || !input.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  )
}
