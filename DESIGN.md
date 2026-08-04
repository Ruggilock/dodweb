# DevOpsDays Lima 2026 — Design System

Source: [design-system.devopsdays.pe](https://design-system.devopsdays.pe/) · v1.0.0 · Updated Apr 2026 · Base: Brand Manual v1.1 · License: Community

> Design system derived from the DevOpsDays Lima 2026 brand manual. Tokens, components and patterns ready to ship in product, event and communications work.

---

## Brand Essence

Four attributes that guide every design, copy and interaction decision. If a piece doesn't reflect at least two of these, it's not DevOpsDays Lima.

| # | Attribute | Description |
|---|-----------|-------------|
| 01 | **Agile** | Small deploys, constant iteration, fast feedback. The same goes for design: prototype and adjust. |
| 02 | **Endemic** | Proudly Peruvian. Local references, color that evokes Lima and Latin American identity. |
| 03 | **Precise** | Observability, metrics and data-driven decisions. Design with intent, no gratuitous ornament. |
| 04 | **Collaborative** | As the hummingbird pollinates, we share knowledge so everyone grows. Open source, open community. |

---

## Logo

**Primary mark:** Icon + wordmark. Use the version with the best contrast against the background. Minimum clearance: isotype height.

**Approved versions:**
- Full color · Light background
- Dark mode
- Icon on purple

**Minimum sizes:**
- Digital · 24px
- Web · 40px
- Print · 15mm

---

## Mascot

**Quri** — a hummingbird pollinating knowledge across the DevOps community. Use it as a narrative accent, **not** as a replacement for the logo. Four official versions/backgrounds (Mascot 01–04).

---

## Color

Infinity Purple + Deploy Lime as the main duo. Neutrals build the architecture; semantics speak to state.

### Brand

| Token | Hex | Alias |
|-------|-----|-------|
| `--purple` | `#53099E` | Infinity Purple · `brand.primary` |
| `--purple-deep` | `#2E005A` | Purple Deep · `hover` |
| `--purple-tint` | `#A17CD1` | Cloud Mauve · `accent` |
| `--lime` | `#A3E37C` | Deploy Lime · `brand.secondary` |
| `--lime-soft` | `#C5EFA8` | Lime Soft · `subtle` |

### Neutrals

| Token | Hex | Alias |
|-------|-----|-------|
| `--ink` | `#0E0520` | Deep Night · `text.primary` |
| `--purple-ink` / `--ink-2` | `#1A0A36` | Ink 2 · `surface.dark` |
| `--mute` | `#8A8496` | Mute · `text.tertiary` |
| `--line` | `#E6E1DA` | Line · `border` |
| `--paper` | `#FBFAF7` | Paper · `surface` |
| `--paper-2` | `#F2EFEA` | Paper 2 |
| `--white` | `#ffffff` | White |

### Semantics

| Token | Hex | Meaning |
|-------|-----|---------|
| `--success` | `#22A06B` | Success |
| `--warn` | `#E6A100` | Warning |
| `--error` | `#D6361C` | Error |
| `--info` | `#3B7BD6` | Info |
| `--purple-wash` | `#EDE6F5` | Purple Wash · tint |

### Utility / alpha

| Token | Value |
|-------|-------|
| `--ink-65` | `rgba(14,5,32,.65)` |
| `--ink-68` | `rgba(14,5,32,.68)` |
| `--ink-72` | `rgba(14,5,32,.72)` |

---

## Typography

Three type families, each with a clear job:

- **Display · Orbitron** (`--f-display: "Orbitron", ui-monospace, monospace`) — Geometric, technical, futuristic. Headlines, CTAs, ticker, anything that should shout. Weights: 400, 500, 700, 800, 900.
- **Text · Poppins** (`--f-text: "Poppins", system-ui, sans-serif`) — Human, readable, warm. Body copy, long paragraphs, forms, UI. Weights: 300, 400, 500, 600, 700.
- **Mono · JetBrains Mono** (`--f-mono: "JetBrains Mono", ui-monospace, monospace`) — Data, code, timestamps, tickers.

### Type scale

| Style | Sample | Size/Line-height | Weight | Tracking |
|-------|--------|-------------------|--------|----------|
| Display XL | "Deploy together." | 64/60 | 900 | -0.03em |
| Display LG | "Build. Ship. Operate." | 48/46 | 800 | -0.02em |
| Display MD | "Build community" | 32/34 | 800 | -0.01em |
| Display SM | "Content section" | 22/25 | 700 | — |
| Body LG | "Two days. One community…" | 18/27 | 400 | — |
| Body MD | Standard reading paragraph | 15/23 | 400 | — |
| Body SM | Captions, secondary metadata | 13/20 | 400 | — |
| Mono | "AUG · 27 · 2026 — .DEPLOY" | 12 | 500 | 0.08em |

---

## Tokens

### Spacing (base 4)

Scale in multiples of 4 to keep vertical/horizontal rhythm consistent.

| Token | Value |
|-------|-------|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 20px |
| `--s-6` | 24px |
| `--s-8` | 32px |
| `--s-10` | 40px |
| `--s-12` | 48px |
| `--s-16` | 64px |
| `--s-20` | 80px |

### Radii

| Token | Value |
|-------|-------|
| `--r-xs` | 4px |
| `--r-sm` | 8px |
| `--r-md` | 12px |
| `--r-lg` | 16px |
| `--r-xl` | 20px |
| `--r-full` | 999px |

### Elevation

Four levels. Purple-tinted shadows to preserve chromatic coherence.

| Token | Use | Value |
|-------|-----|-------|
| `--sh-1` | Resting | `0 1px 2px rgba(14,5,32,.06)` |
| `--sh-2` | Hover / card | `0 4px 12px -4px rgba(14,5,32,.12)` |
| `--sh-3` | Overlay | `0 14px 28px -14px rgba(83,9,158,.25)` |
| `--sh-4` | Modal | `0 24px 48px -20px rgba(83,9,158,.35)` |

---

## Components

### Buttons

Pill shape (`radius: full`). Heights: **36 / 44 / 52** (small / medium / large).

- **Primary** = purple (`--purple`)
- **Secondary** = lime (`--lime`)
- **Ghost** = tertiary actions

**Variants seen:** Submit talk (primary), View agenda (secondary/lime), Contact (outline), Cancel (ghost), Delete (destructive/error).

**States:** Default, Hover, Focus, Disabled.

### Badges

Pill labels for status/category: `PLATFORM`, `CFP OPEN`, `LIVE`, `DEVSECOPS`, `CONFIRMED`, `PENDING`, `CLOSED`. Color follows semantic meaning (e.g. success/lime for open/confirmed, mute for closed).

### Forms

Fields: Full name, Email (helper text "We reply within 48h"), Track (select: Enterprise AI / Modern Leadership / Platform Engineering / Security), Format (select: Keynote 30min / Session 25min / Panel 50min / Workshop 90min), Talk summary (textarea).

### Cards

Content cards with number, title and description, e.g.:
1. **Enterprise AI & Data** — Case studies on deploying AI at scale, from experimentation to ROI, and data readiness.
2. **Modern Leadership** — Building high-performing teams, positive work culture, digital transformation.
3. **Platforms & DevOps** — Best practices in DevOps, platform engineering and software delivery.

### Alerts

Five semantic types:
- **Info** — "The official venue will be announced in July 2026." (`--info`)
- **Success** — "Your CFP submission was received. We reply by June 15." (`--success`)
- **Warning** — "Submissions close May 31. No extensions." (`--warn`)
- **Error** — "We couldn't process your payment. Please check your card details." (`--error`)
- **Highlight** — "Early bird closes this Sunday. 40% off tickets." (lime/brand accent)

### Iconography

Custom icon library for the event — linear style with purple fill. Base size **24px**.

### Patterns

Composed pieces reused across product and communications:
- **Event ticket** (`pattern.ticket`) — attendee ticket card with event name, type, number, date.
- **Section chrome** (`pattern.chrome`) — numbered section headers (e.g. "03 — Sponsors", "2026 Edition").
- **Marquee / Ticker** (`pattern.marquee`) — scrolling brand ticker: "DevOpsDays Lima 2026 ◆ 27–28 · AUG · 2026 ◆ Build · Ship · Operate ◆ SRE · Platform · DevSecOps ◆"

---

## Voice & Tone

We write the way we talk: direct, technical, with Peruvian warmth. No corporate speak, no empty jargon.

| Attribute | Description | Example |
|-----------|--------------|---------|
| **Direct, not dry** | Straight to the point without losing warmth. Short sentences, active verbs, first person plural when it fits. | "CFP is open. Closes May 31. Submit." |
| **Technical, not opaque** | We use the right terms — SRE, platform, observability — but contextualize them for newcomers. | "We want real stories: painful migrations, honest postmortems." |
| **Warm, not casual** | Like a colleague explaining something over a coffee break. Peruvian touches in moderation, never forced. | "See you on the 27th and 28th. Coffee's on us." |
| **Honest, not cheery** | We don't promise magic. We say what happened, failures included. Honest postmortems make the best talks. | "This isn't a vendor conference or a logo parade." |

---

## Do & Don't

### ✓ Do
- Use Orbitron only for headlines and CTAs
- Keep purple as the protagonist on dark backgrounds
- Always pair lime with enough color mass
- Respect the logo clearance area
- Write with short sentences and active verbs
- Show Quri in the original purple shirt

### ✕ Don't
- Use Orbitron for long body copy
- Change the logo colors
- Use lime as text on white (fails contrast)
- Rotate, distort or add effects to the icon
- Set large blocks of text in all caps
- Draw Quri in styles that contradict the identity

---

## Quick reference — CSS custom properties

```css
:root {
  /* Brand */
  --purple: #53099E;
  --purple-deep: #2E005A;
  --purple-ink: #1A0A36;
  --purple-tint: #A17CD1;
  --purple-wash: #EDE6F5;
  --lime: #A3E37C;
  --lime-soft: #C5EFA8;

  /* Neutrals */
  --ink: #0E0520;
  --ink-2: #1A0A36;
  --paper: #FBFAF7;
  --paper-2: #F2EFEA;
  --line: #E6E1DA;
  --mute: #8A8496;
  --white: #fff;
  --ink-65: rgba(14,5,32,.65);
  --ink-68: rgba(14,5,32,.68);
  --ink-72: rgba(14,5,32,.72);

  /* Semantics */
  --success: #22A06B;
  --warn: #E6A100;
  --error: #D6361C;
  --info: #3B7BD6;

  /* Type */
  --f-display: "Orbitron", ui-monospace, monospace;
  --f-text: "Poppins", system-ui, sans-serif;
  --f-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Spacing (base 4) */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-8: 32px; --s-10: 40px;
  --s-12: 48px; --s-16: 64px; --s-20: 80px;

  /* Radii */
  --r-xs: 4px; --r-sm: 8px; --r-md: 12px;
  --r-lg: 16px; --r-xl: 20px; --r-full: 999px;

  /* Elevation */
  --sh-1: 0 1px 2px rgba(14,5,32,.06);
  --sh-2: 0 4px 12px -4px rgba(14,5,32,.12);
  --sh-3: 0 14px 28px -14px rgba(83,9,158,.25);
  --sh-4: 0 24px 48px -20px rgba(83,9,158,.35);
}
```
