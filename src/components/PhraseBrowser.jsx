import { useMemo, useRef, useState } from 'react'
import topics from '../data/phrasebook.json'

function normalize(s) {
  return (s || '').toLowerCase()
}

export default function PhraseBrowser() {
  const [selectedId, setSelectedId] = useState(topics[0]?.id)
  const [query, setQuery] = useState('')
  const [playingKey, setPlayingKey] = useState(null)
  const audioRef = useRef(null)

  const selectedTopic = topics.find((t) => t.id === selectedId)

  const searchResults = useMemo(() => {
    const q = normalize(query)
    if (!q) return null
    const results = []
    for (const t of topics) {
      for (const p of t.phrases) {
        if (normalize(p.en).includes(q) || normalize(p.xh).includes(q)) {
          results.push({ ...p, topicTitle: t.title, key: `${t.id}-${results.length}` })
        }
      }
    }
    return results
  }, [query])

  function playAudio(key, file) {
    if (!file) return
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (playingKey === key) {
      setPlayingKey(null)
      return
    }
    const audio = new Audio(`/audio/${file}`)
    audioRef.current = audio
    audio.onended = () => setPlayingKey(null)
    audio.play()
    setPlayingKey(key)
  }

  const listToShow = searchResults ?? (selectedTopic?.phrases || [])

  return (
    <div className="browser-layout">
      <aside className="topic-sidebar">
        <input
          className="search-input"
          type="search"
          placeholder="Search English or isiXhosa…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="topic-list">
          {topics.map((t) => (
            <li key={t.id}>
              <button
                className={!searchResults && t.id === selectedId ? 'topic-btn active' : 'topic-btn'}
                onClick={() => {
                  setQuery('')
                  setSelectedId(t.id)
                }}
              >
                <span>{t.title}</span>
                <span className="count">{t.phrases.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="phrase-panel">
        {searchResults ? (
          <h2>{searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{query}"</h2>
        ) : (
          <>
            <h2>{selectedTopic?.title}</h2>
            {selectedTopic?.notes?.map((n, i) => (
              <p className="topic-note" key={i}>{n}</p>
            ))}
          </>
        )}

        <ul className="phrase-list">
          {listToShow.map((p, i) => {
            const key = p.key || `${selectedId}-${i}`
            return (
              <li className="phrase-card" key={key}>
                <div className="phrase-text">
                  <span className="phrase-en">{p.en}</span>
                  <span className="phrase-xh">{p.xh}</span>
                  {p.exEn && (
                    <span className="phrase-example">
                      e.g. {p.exEn} — <em>{p.exXh}</em>
                    </span>
                  )}
                  {searchResults && <span className="phrase-topic">{p.topicTitle}</span>}
                </div>
                <button
                  className={playingKey === key ? 'play-btn playing' : 'play-btn'}
                  disabled={!p.audio}
                  onClick={() => playAudio(key, p.audio)}
                  aria-label={p.audio ? `Play pronunciation of ${p.xh}` : 'No audio available'}
                  title={p.audio ? 'Play pronunciation' : 'No audio for this entry'}
                >
                  {playingKey === key ? '❙❙' : '▶'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
