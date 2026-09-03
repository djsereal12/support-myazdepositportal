# Plan: Grey theme + holographic bubble letters

Replace the pink/lavender palette across DEPOSIT with a light grey, holographic-accent look, and make the script "bubble" headlines interactive holographic text.

## What changes

**1. Re-theme tokens in `src/styles.css` (single source of truth)**
- `--lavender`, `--lavender-soft`, `--lavender-deep` → light-grey/silver scale (keeps the token names so ~24 files that use `text-lavender`, `bg-lavender-soft`, `lavender-wash`, etc. update automatically; no class renames needed).
- `--gradient-pink` / `--gradient-lavender` → light grey washes with a subtle holographic sheen (pearl/silver with faint iridescent tint).
- `--sidebar-primary` and shadow colors (`shadow-lift`, `btn-glass-pink`) re-hued from pink to neutral grey/iridescent.
- Add a `--gradient-holo` token: animated iridescent gradient (grey base with soft rainbow sheen) used for headline text.

**2. Holographic bubble letters**
- New `holo-text` utility: script text (the "deposit" wordmark and hero/script headlines, `font-script`) renders as bubble letters with:
  - Animated iridescent gradient fill (silver → faint rainbow sheen, background-position animation).
  - Soft inner glow + drop shadow for a glossy "bubble" look.
  - Interactive: on hover the gradient shifts/sheens (and a subtle tilt/scale on pointer move for the hero word).
- Apply to the `font-script` usages: site header/footer wordmark (`site-shell.tsx`), hero headline (`index.tsx`), and script headings on other pages.

**3. Sweep check**
- Grep for remaining `pink`/`fuchsia`/`rose` classes and update; verify light/dark contrast stays accessible.

## Files touched
- `src/styles.css` — token + utility changes
- `src/components/site-shell.tsx`, `src/routes/index.tsx` (+ any other script-text headings) — apply `holo-text`
- Minor class cleanups where literal pink utilities appear

## Verification
- Typecheck/build, then preview check of home, pricing, auth, dashboard for the new grey/holo look and hover interaction.
