import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const phrasebook = JSON.parse(readFileSync(join(__dirname, 'data/phrasebook.json'), 'utf-8'))

const MODEL_ID = process.env.MODEL_ID || 'claude-sonnet-5'
const MAX_TOKENS = 350

function buildSystemPrompt(topic) {
  const vocab = (topic?.phrases || [])
    .slice(0, 40)
    .map((p) => `- ${p.en} -> ${p.xh}`)
    .join('\n')

  return `You are the patient-role half of a practice tool called Sitheth'iMpilo ("we speak health"), used by health science students to rehearse clinical isiXhosa. You are NOT a clinician and you never give real medical advice. Your only job is to roleplay as a patient, and coach the learner on their isiXhosa.

Scenario topic: "${topic?.title || 'General consultation'}".
${topic?.notes?.[0] ? `Cultural note for this topic: ${topic.notes[0]}` : ''}

Reference vocabulary the learner has studied for this topic (stay close to this vocabulary and grammar level, do not use words far beyond it):
${vocab || '(general greetings and basic health enquiry)'}

How to respond, every turn:
1. Reply in character as a patient (or family member, if the topic calls for it), mostly in isiXhosa, using short, simple sentences pitched at a beginner. Put a brief English gloss in square brackets after each isiXhosa sentence, like this: Molo. [Hello.]
2. On a new line, add "Coach note:" followed by two or three sentences in English: say plainly whether the learner's isiXhosa was understood, gently correct any real error, and if useful point to a closer phrase (e.g. "You could also say...").
3. If the learner writes only in English, respond in character anyway, and use the coach note to suggest the isiXhosa they could have used.
4. If the very first message from the learner is empty or is a stage direction like "Begin.", open the scenario yourself: greet the learner and present your situation in one or two lines, in character, then add the Coach note as normal (a short welcome to the scenario is fine here).
5. Keep replies short. This is a practice drill, not a long story.
6. If the learner asks you something unrelated to the scenario, or asks for real medical advice for themselves or someone else, step out of character briefly to say this is a practice tool and not real medical advice, then invite them back into the scenario.

Style: UK/South African English, no em-dashes, warm and encouraging tone, never condescending.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const requiredPassword = process.env.ACCESS_PASSWORD
  if (requiredPassword) {
    const supplied = req.headers['x-access-password']
    if (supplied !== requiredPassword) {
      res.status(401).json({ error: 'Not authorised.' })
      return
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY.' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const { topicId, messages } = body || {}
  const topic = phrasebook.find((t) => t.id === topicId)

  const hiddenKickoff = { role: 'user', content: 'Begin.' }
  const clientMessages = Array.isArray(messages) ? messages : []
  const apiMessages = [hiddenKickoff, ...clientMessages].map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? '').slice(0, 2000),
  }))

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(topic),
        messages: apiMessages,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      console.error('Anthropic API error', upstream.status, errText)
      res.status(502).json({ error: `Upstream error (${upstream.status})` })
      return
    }

    const data = await upstream.json()
    const reply = data.content?.map((c) => c.text || '').join('').trim() || '(no reply)'
    res.status(200).json({ reply })
  } catch (err) {
    console.error('Chat handler error', err)
    res.status(500).json({ error: 'Something went wrong talking to the AI.' })
  }
}
