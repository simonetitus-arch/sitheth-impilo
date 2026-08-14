import { useState } from 'react'

export default function Gate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem('sitheth_unlocked', 'true')
        sessionStorage.setItem('sitheth_password', password)
        onUnlock()
      } else {
        setError('That password is not right. Try again.')
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gate-screen">
      <form className="gate-card" onSubmit={submit}>
        <img src="/logo.png" alt="Sitheth'iMpilo logo" className="gate-logo" />
        <h1>Sitheth'iMpilo</h1>
        <p className="gate-sub">We speak health — isiXhosa for clinical practice</p>
        <label htmlFor="pw">This app is shared with a class password</label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter the password"
          autoFocus
        />
        {error && <p className="gate-error">{error}</p>}
        <button type="submit" disabled={loading || !password}>
          {loading ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
