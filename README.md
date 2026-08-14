# Sitheth'iMpilo — We speak health

An isiXhosa clinical phrasebook for health science students across 37 topics, plus an AI practice partner that roleplays a patient so students can rehearse
out loud and get gentle correction.

## What's here

- `src/` — the React app (Vite). Two views: **Phrasebook** (browse/search/play audio)
  and **Practice with AI** (chat-based roleplay).
- `api/chat.js` — serverless function. Holds `ANTHROPIC_API_KEY` server-side, checks
  the class password, proxies to Claude, returns the patient's reply and a coach note.
- `api/auth.js` — checks the class password for the gate on the frontend.
- `public/audio/` — the 551 audio clips (~24 MB total), served as static files.
- `src/data/phrasebook.json` / `api/data/phrasebook.json` — the extracted phrasebook
  content (same file, kept in both places so the frontend and the serverless function
  can each read it directly).

## Before you deploy: two honest caveats

1. **The password gate is a soft gate, not real security.** It stops casual access
   from someone who doesn't have the password, the same way ProbleMeisha's did. It
   does not stop someone determined to view the site's network requests from finding
   the audio file URLs. Treat this as "keep it off Google," not "protect confidential
   data." Don't put anything in here you wouldn't want a curious student to stumble on.
2. **The AI practice partner can make isiXhosa mistakes.** It's grounded in the
   phrasebook vocabulary for whichever topic is selected, but it is not a certified
   isiXhosa tutor. Tell students it's a practice drill, not a source of truth, and
   have a fluent speaker spot-check it before relying on it in teaching.

## Deploy it — step by step

You said you already have GitHub and Vercel accounts, so this skips account setup
and goes straight to shipping.

**1. Get a Claude API key**
Go to [console.anthropic.com](https://console.anthropic.com), create an API key, and
add a small amount of prepaid credit (USD 5 is plenty to start — practice chat replies
are short, capped at 350 tokens each).

**2. Push this folder to a new GitHub repo**
- On GitHub, create a new **private** repository (e.g. `sitheth-impilo`).
- From this folder, run:
  ```
  git init
  git add .
  git commit -m "Sitheth'iMpilo: isiXhosa clinical phrasebook"
  git branch -M main
  git remote add origin https://github.com/<your-username>/sitheth-impilo.git
  git push -u origin main
  ```
  (Or use GitHub Desktop / the "upload files" button in the browser if you'd rather
  not use the command line — just make sure `public/audio/` comes along; it's the
  bulk of the repo at ~24 MB.)

**3. Import into Vercel**
- In Vercel, click **Add New → Project**, and import the `sitheth-impilo` repo.
- Framework preset should auto-detect as **Vite**. Leave build settings as default.
- Before clicking Deploy, open **Environment Variables** and add:
  | Name | Value |
  |---|---|
  | `ANTHROPIC_API_KEY` | the key from step 1 |
  | `ACCESS_PASSWORD` | `FMHSXCC` |
  | `MODEL_ID` | `claude-sonnet-5` (optional — this is already the default) |
- Click **Deploy**. First build takes a minute or two because of the audio files.

**4. Smoke test**
- Open the deployed URL, enter your `ACCESS_PASSWORD`, confirm audio plays on a few
  phrase cards, then switch to **Practice with AI**, pick a topic, and start a
  scenario to confirm the chat responds.
- If chat returns an error, check **Vercel → your project → Deployments → Functions
  logs** for `api/chat` — the most likely culprits are a missing/incorrect
  `ANTHROPIC_API_KEY` or a `MODEL_ID` that's been deprecated (same failure mode
  Robin hit with ProbleMeisha — swap in a current model ID and redeploy).

**5. Optional: custom domain**
Buy a memorable domain (~USD 15/year) through Vercel's domain settings or elsewhere,
point it at the project, and HTTPS is handled automatically. See the domain
recommendation below.

## Domain recommendation

`sithethimpilo.co.za` is the pick: it's spellable from the name alone (no hyphens
to get wrong when a student types it from memory), the `.co.za` reads as
institutional rather than a side project, and it stays available for a `.app` or
`.health` companion later if this grows beyond one class. `sithethimpilo.app`
is the fallback if the `.co.za` is taken or the registrar is a hassle — `.app`
forces HTTPS by default, which you get anyway on Vercel, so it's a wash technically,
just a slightly less local-feeling URL. I'd avoid a novelty TLD like ProbleMeisha's
`.lol` here: that suited a playful AI examiner persona, but a phrasebook students
rely on for clinical vocabulary reads better with a plain, trustworthy domain.

## Local development

```
npm install
npm run dev        # frontend only, on http://localhost:5173 — /api routes will 404 here
```

To test the serverless functions locally too, install the Vercel CLI and run:
```
npm i -g vercel
cp .env.example .env   # fill in real values
vercel dev
```

## Cost

A few dollars of Claude credit, free tiers of GitHub and
Vercel, optional ~USD 15/year for a custom domain. Audio and phrasebook browsing cost
nothing to run — only the AI practice chat calls the Anthropic API.

## Content provenance

Phrase text, English/isiXhosa pairs, and audio pronunciations are drawn directly from
`isiXhosa Phrasebook 2022`. Topic groupings and section notes (e.g. cultural notes on
greetings and clan names) are preserved from the original slide structure. 57 of 624
phrases in the source deck did not have an attached audio clip and are shown as
text-only entries.
