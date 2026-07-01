# VO Recording Guide (v6)

The films ship **captions-first** — they work fully muted today. Your voiceover is the
upgrade that makes them world-class, and both players have the slot pre-built.

## Why your voice (not TTS)
Founder voice reads as conviction. No AI/TTS voices, ever — it is the fastest way to
make the whole company look synthetic.

## Kit (perfectly acceptable minimum)
- Your phone's voice-memo app, held 15–20cm from your mouth, slightly off-axis.
- A quiet, soft-furnished room (bedroom with curtains beats an echoey kitchen).
- Record everything three times; keep the take where you sound like you're telling a
  friend, not presenting.

## Pacing marks
Scripts live in `scripts/investor-film.md` and `scripts/customer-film.md` with exact
`[start–end]` timings per line. Rules of thumb:
- Land each VO line INSIDE its window; short is always better than squeezed.
- Leave one full second of silence before "[00–08]" begins (the ritual beat).
- Numbers slowly: "three point two billion", "two hundred and fifty thousand".
- Smile on the last line of each film — you can hear it.

## Recording order
1. Customer film (easier, warmer) — 5 lines.
2. Investor film — 7 lines, confident and flat-calm; zero hype words.
3. The two vertical cuts reuse customer-film lines; no extra recording needed.

## Dropping the audio in
Export as `.m4a` or `.mp3`, one file per film:
- `public/audio/customer-film-vo.m4a`
- `public/audio/investor-film-vo.m4a` *(note: served publicly by Next; if the investor
  VO must stay gated, host it behind /api/investor instead — flag when ready and it
  will be wired that way).*
The FilmPlayer detects the file and enables the sound toggle; captions remain on by
default regardless.

## Underscore (music)
None is shipped — no copyrighted or stock music is used anywhere. TODO-FOUNDER
(shared with v5): commission the ~2s signature ignition sound and a 20–30s warm
underscore; both drop into the same audio slots.
