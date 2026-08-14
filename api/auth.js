export default async function handler(req, res) {
  const requiredPassword = process.env.ACCESS_PASSWORD

  if (req.method === 'GET') {
    res.status(200).json({ required: !!requiredPassword })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requiredPassword) {
    res.status(200).json({ ok: true })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const { password } = body || {}
  res.status(200).json({ ok: password === requiredPassword })
}
