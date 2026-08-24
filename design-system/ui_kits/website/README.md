# FMP — Website UI Kit

High-fidelity recreation of FMP's institutional / course-marketing website, built from the brand's key-visual system (no production source was supplied — this reproduces the established visual language, not a live codebase).

## Run
Open `index.html`. React 18 + Babel-in-browser; components load as `text/babel` scripts and export to `window`. Tokens come from `../../colors_and_type.css`; assets from `../../assets/`.

## Surface
A single-page marketing home that interactively demonstrates the system:
- **Sticky header** that gains a blurred cream background on scroll, with primary CTA.
- **Hero** — cream ground, serif-italic headline with red emphasis word, photo in the signature soft-superellipse mask + red panel + sparkle, OAB/MEC seals.
- **Courses** — category filter (Todos / Graduação / Especialização / Extensão) that live-filters a card grid; light cards (Graduação/Extensão) and dark prestige cards (Especialização).
- **Prestige band** — the dark "Especializações" treatment: red corner glow, tracing arc, serif-italic headline, +40-anos stats grid.
- **Footer** — dark, white lockup, dark accreditation seals, link columns.
- **Enrollment modal** — two-step "Vestibular 2026" flow (form → confirmation) triggered by every CTA.

## Components (`window` exports)
| File | Exports |
|---|---|
| `Shared.jsx` | `Sparkle` (PNG mark), `Logo`, `LogoLockup`, `Eyebrow`, `Button` (primary/ghost/text + hover/press), `Pill`, `Seal`, `Icon` (Lucide-style monoline) |
| `Header.jsx` | `Header` |
| `Hero.jsx` | `Hero` |
| `Courses.jsx` | `Courses`, `CourseCard` |
| `Prestige.jsx` | `Prestige` |
| `Footer.jsx` | `Footer` |

## Notes
- Headline serif is **Noto Serif Italic** (brand font).
- UI icons are inline **Lucide-style** monoline paths; swap for the official set if provided.
- Photography uses the supplied key-visuals from `assets/`.
