# Frag dein Zuhause / Ask Your Home

**Your home, talking energy.** An AI energy advisor where the *house itself* speaks
in the first person — turning Germany's intimidating, jargon-heavy energy transition
into a 2-minute friendly conversation that ends with a concrete, personalized
savings plan.

- **Team:** 01
- **Members:** Ali Kodak, Ayman Karim, Alpha Saliou Diallo
- **Challenge / Track:** Kenergy Solutions GmbH — LAUNCH Rhein-Main Build Days
- **Partner bonus criterion:** Personalization

---

## The problem & who has it

Private households in Germany — **both renters and owners** — face rising heating
and electricity bills and growing pressure from the energy transition (GEG /
"Heizungsgesetz", volatile gas prices). Yet most people do **nothing**, because:

- Professional energy advice (*Energieberater*) is **expensive and slow** — often
  weeks to months of waiting for an appointment.
- The topic feels **technical and overwhelming** — kWh/m², TABULA archetypes, BAFA
  vs. BEG vs. KfW subsidies. People don't know where to start.
- Generic online calculators give **impersonal** numbers that don't tell you what
  *you* should actually do next.

**Customers:**
- **End users:** renters and homeowners who want to cut energy costs but feel stuck.
- **B2B (Kenergy's market):** *Stadtwerke* / utilities that need a warm, engaging
  way to activate end customers and route them toward concrete measures.

**Why we know it's real:** energy prices and the legal push toward heating
modernization are driving demand, while the shortage and cost of certified energy
advisors leaves a large, underserved gap between "I want to save" and "here's
exactly what to do."

---

## Our solution & value proposition

A chat where **your home talks to you**. It asks a handful of simple questions
(rent vs. own, building type, age, size, postcode, heating, monthly cost, existing
upgrades) and instantly returns:

1. A **wow-moment savings estimate** ("~€460/year") right after the postcode.
2. A **personalized top-measures plan** with concrete € savings per measure,
   applicable **subsidies** (BAFA / BEG / KfW), effort level, and a clear next step.
3. **Direct provider links** for each measure and a **handoff to Kenergy** for solar.

**Two phases, one seamless flow:**

| Phase | Name | What happens |
|------|------|--------------|
| 1 | **Catch** | Fast click-through (ownership → building → postcode) → instant average savings number. |
| 2 | **MVP** | The house, in first person, asks personalized questions and produces a tailored plan + provider handoff, then stays available for free chat. |

**Value proposition:** we turn a months-long, intimidating, expensive process into a
**2-minute friendly conversation** that ends with concrete, actionable, monetizable
recommendations — in plain language, no jargon.

**Business model:**
- **Affiliate links (main revenue):** commission on every conversion — smart
  thermostats, tariff switches, balcony solar, insulation leads, PV via Kenergy.
- **Paid placement:** providers can pay to be recommended more prominently.
- **B2B licensing** to Stadtwerke / utilities.

---

## The demo

The tangible demonstration is the **running app itself**, including a built-in
**pitch slide deck** (with a live iPhone-in-Safari mockup beside the slides) that
flows straight into the live product.

### Run it locally

```bash
# 1. install
npm install

# 2. add your OpenRouter key (server-side only — never bundled into the client)
cp .env.example .env
#   then edit .env and set OPENROUTER_API_KEY=sk-or-<your-key>

# 3. start
npm run dev          # → http://localhost:5173
```

> The live LLM chat needs the key from step 2. **Without a key**, the pitch slides,
> the Phase-1 click-flow, and the savings reveal still work; the Phase-2 interview
> falls back to built-in questions so the flow never breaks.

### What to look at

- **`/`** — opens the **pitch deck**; the last slide launches the live app.
- **`/?app=qualify`** — boots straight into the Phase-1 click flow.
- **`/?app=plan`** — jumps to a finished personalized plan (seeded demo profile).
- **`/?app=reveal`** — jumps to the savings wow-moment.

---

## Tech stack

- **Frontend:** React 18 + TypeScript (strict) + Vite 6
- **Styling:** Tailwind CSS 4 (custom design tokens), inline-SVG mascot "Habi"
- **AI backend:** OpenRouter, called through a **server-side Vite middleware**
  (`POST /api/chat`) so the API key never reaches the browser
- **Data:** local TABULA building typology + ETHOS lookup, deterministic
  savings/plan calculation and profile classification (M1–M3 / E1–E4)

### Project structure

```
src/
├── App.tsx                  # phase state machine: pitch → qualify → address → flow → wow → chat
├── components/              # Slides, Phase1, AddressStep, SavingsReveal, PlanView, HouseMascot, …
└── lib/                     # flow, interview (LLM), plan, tabula, ethos, foerderung, massnahmen, …
vite.config.ts               # dev server + server-side /api/chat OpenRouter proxy
.env.example                 # template — copy to .env and add your key
```

## Security

The OpenRouter API key lives **only** in a git-ignored `.env` and is used **server-side
only**. It is never committed and never bundled into the client. See `.env.example`
for the template.
