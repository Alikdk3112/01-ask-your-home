# HANDOFF — Frag dein Zuhause

> Übergabe-Dokument für die Weiterarbeit in einer neuen Session. Stand: 2026-05-29.
> Projektpfad: `/Users/ali/Desktop/Hackathon/Claude/frag-dein-zuhause`

---

## TL;DR — wo wir stehen

Das Produkt ist **fertig gebaut, getestet und demo-bereit**. Der gesamte Journey läuft
end-to-end im Browser (Phase 1 Click-UI → Adresseingabe mit Live-Autocomplete → Kontextfragen
→ Wow-Moment → Plan → freier LLM-Chat), der Production-Build ist sauber, der OpenRouter-Key
leakt nicht ins Bundle. Es gibt **noch kein Git-Repo** (vor dem GitHub-Upload `git init` nötig —
`.gitignore` ist aber schon vorhanden und schützt `.env`).

- ✅ `npm run build` → 0 TS-Fehler, 1621 Module, `dist` JS 275.13 kB (gzip 78.47 kB), CSS 25.56 kB (gzip 5.70 kB)
- ✅ Sicherheit: kein `sk-or-` / `OPENROUTER_API_KEY` in `dist/` oder `src/` (nur `.env.example`-Platzhalter)
- ✅ `.env` ist gitignored, lokal vorhanden (188 B)
- ✅ Keine Geviertstriche (`—`) mehr in `src/` (natürliche dt. Interpunktion; `40%`/`kWh/m²` bleiben)
- ✅ PLZ-Override, Freitext→Option-Mapping, DB-Match-Skip live verifiziert (siehe unten)
- ✅ Keine Konsolenfehler im kompletten Durchlauf

---

## Was diese Session geändert hat (wichtigster Kontext)

Phase 1 + 2 wurden umgebaut. Vier zusammenhängende Änderungen, alle live verifiziert:

1. **Phase 1 ist jetzt ein Click-UI** (`components/Phase1.tsx`), kein Chat mehr:
   Eigentum → Haustyp → PLZ → **regionaler Catcher** (animiertes Ø-Einsparpotenzial via
   `lib/regional.ts`, `estimateRegionalSavings`). CTA „Konkreten Plan erstellen" führt zur
   Adresseingabe.

2. **Adresseingabe mit Live-Autocomplete** (`components/AddressStep.tsx`):
   Freitext-Suche bundesweit über OpenStreetMap/Nominatim (`lib/geo.ts` → `/api/geo/search`),
   PLZ→Ort-Vorbefüllung über OpenPLZ (`/api/geo/plz`). Beide Dienste **keyless**, serverseitig
   gebündelt im neuen `geoProxy()`-Plugin in `vite.config.ts`.

3. **PLZ-Override-Regel** *(wörtliche Nutzervorgabe, bindend):*
   > „Wenn in der Adresseingabe eine Adresse eingegeben wird mit einer anderen PLZ als aus
   > Phase 1 übernommen, dann wird die aktuelle aus der Adresseingabe verwendet, und nicht
   > die aus Phase 1."

   Umgesetzt in `AddressStep.tsx` (`choose()` setzt `plz`/`ort` aus dem gewählten Treffer) und
   `App.tsx` (`onAddressComplete` nutzt `addr.plz` für DB-Match + Plan). **Die PLZ ist nicht
   mehr gesperrt**, das Feld ist editierbar, die Adresse gewinnt. **Verifiziert:** Phase 1
   `60594` (Frankfurt) → Adresse „Domshof, Bremen" gewählt → Feld springt auf `28195`,
   DB-Match nutzt Bremen (MFH, Baujahr ~1965).

4. **Erweiterter Fragenpool + Freitext→Option-Mapping** (`lib/flow.ts`):
   - Neue Schritte: `monthlyCost`, `existingMeasures`, `priority` (mit Interstitials).
   - `buildContextSequence(profile, building)` baut die Fragefolge aus einem **kuratierten Pool**
     und **überspringt** Felder, die schon aus Phase 1 stammen oder per DB-Match bekannt sind
     (`building.knownFields`) — z. B. Baujahr bei ETHOS-Treffer.
   - `matchFreeTextToOption(step, text)` bildet Freitext auf eine Antwortoption ab (Misch-Modus
     Buttons **oder** Tippen). **Verifiziert:** „läuft alles mit Gas"→**Gas**,
     „75 Quadratmeter"→**50–80 m²**, „180 Euro"→**150–250 €**. Kein Treffer → Notiz + sanfter
     Reprompt (alter Fallback bleibt).

5. **Geviertstriche entfernt:** alle `—` in `src/` durch Komma/Punkt/„und" ersetzt.
   **Bewusst beibehalten:** `40%`, `200 kWh/m²` (nicht ausschreiben) und En-Dash-Zahlenspannen
   wie `370–550 €`.

---

## Was ist das Produkt

KI-gestützter Energieberater als Chat-Interface (Hackathon LAUNCH Rhein-Main, Partner
**Kenergy Solutions**). Das **Haus spricht in der Ich-Perspektive**. Ablauf:

```
Phase 1 (Click-UI)        Adresseingabe            Phase 2 (Chat)
──────────────────        ─────────────            ──────────────
Eigentum/Miete       →    OSM-Autocomplete    →    Kontextfragen (flow)
Haustyp              →    PLZ-Override        →    Wow-Moment (deterministisch)
PLZ                  →    ETHOS-DB-Match      →    Plan + Förderung + Kenergy
Regionaler Catcher        (knownFields-Skip)       Freier LLM-Chat
```

Design: **Kenergy Blau/Weiß**. Architektur-Entscheidung: **Vite-Server-Proxy** (Key bleibt
serverseitig; zusätzlich keyless Geo-Proxy).

---

## Tech-Stack

- **Vite 6.4.2** + **React 18.3.1** + **TypeScript 5.6** (strict, `noUnusedLocals/Parameters`)
- **Tailwind CSS 4** via `@tailwindcss/vite` (`@theme`-Tokens in `src/styles.css`)
- `canvas-confetti` (Wow-Moment), `lucide-react` (Icons)
- **OpenRouter** als LLM-Backend (Default-Modell `openai/gpt-4o-mini`, via `OPENROUTER_MODEL`
  überschreibbar), aufgerufen über **Vite-Middleware-Proxy** `POST /api/chat`
- **Keyless Geo-Proxy** `GET /api/geo/plz` (OpenPLZ) + `GET /api/geo/search` (Nominatim/OSM)

Scripts: `npm run dev` (Vite), `npm run build` (`tsc --noEmit && vite build`), `npm run preview`.

---

## Projektstruktur & Dateirollen

```
frag-dein-zuhause/
├── vite.config.ts          # ZWEI Proxy-Plugins:
│                           #  • openRouterProxy(env): /api/chat, Key serverseitig via
│                           #    loadEnv(mode, cwd, '') OHNE VITE_-Präfix; 401/429/Netzfehler.
│                           #  • geoProxy(): /api/geo/plz (OpenPLZ) + /api/geo/search (Nominatim),
│                           #    keyless, UA 'FragDeinZuhause/1.0 (Kenergy Energieberater)'.
│                           #  Beide via configureServer + configurePreviewServer.
├── .env                    # ECHTER Key (gitignored, lokal vorhanden) — NICHT committen
├── .env.example            # NUR Platzhalter (sk-or-...). Vorlage für echte .env.
├── .gitignore              # .env / .env.local / .env.*.local + dist/ + node_modules/ ignoriert
├── index.html
├── src/
│   ├── main.tsx            # React-Entry
│   ├── App.tsx             # (326 Z.) State-Machine: Phase 'qualify'→'address'→'flow'→'wow'→'chat'.
│   │                       #   onPhase1Complete / onAddressComplete (DB-Match + buildContextSequence) /
│   │                       #   advance / onPick / onFreeText (nutzt matchFreeTextToOption) / sendChat.
│   ├── styles.css          # Tailwind @theme-Tokens (Kenergy-Palette)
│   ├── components/
│   │   ├── Phase1.tsx          # (292 Z.) Click-UI: Eigentum→Haustyp→PLZ→regionaler Catcher (CountUp)
│   │   ├── AddressStep.tsx     # (173 Z.) Adresse mit OSM-Autocomplete; PLZ-Override (Adresse gewinnt)
│   │   ├── SavingsReveal.tsx   # Wow-Moment + Confetti (reduced-motion-aware)
│   │   ├── PlanView.tsx        # Maßnahmen-Karten, Förderung, Kenergy-CTA, Vermieter-Brief-Btn
│   │   ├── CountUp.tsx         # requestAnimationFrame-CountUp (ease-out)
│   │   ├── PresetButtons.tsx   # Preset-Antwort-Buttons (grid-fähig)
│   │   └── TypingIndicator.tsx # 3-Punkte-Typing-Animation
│   └── lib/
│       ├── types.ts        # UserProfile (+ plz/ort/street/houseNumber, monthlyCost/
│       │                   #   existingMeasures/priority), EnergyPlan, PlanMeasure, EthosResult,
│       │                   #   EthosBuilding (matched/knownFields), ChatApiResult, Period, …
│       ├── flow.ts         # (365 Z.) STEPS-Katalog inkl. monthlyCost/existingMeasures/priority;
│       │                   #   buildSequence / buildContextSequence (Skip-Logik) /
│       │                   #   matchFreeTextToOption + STOPWORDS.
│       ├── regional.ts     # (58 Z.) estimateRegionalSavings() — Ø-Catcher für Phase 1
│       ├── geo.ts          # (33 Z.) lookupPlzOrt(plz) / searchAddress(query, signal) / AddressHit
│       ├── ethos.ts        # ethosLookup(plz) (Regionstatistik) + ethosBuildingMatch(plz,type)
│       │                   #   → EthosBuilding (Bremen-Grid echt, sonst Bundesland-Fallback)
│       ├── ethos_compact.json  # komprimierte Geo-Daten
│       ├── tabula.ts       # TABULA/EPISCOPE kWh/m² (ist vs soll), Heizpreise, BUILDING_LABEL
│       ├── massnahmen.ts   # (491 Z.) MASSNAHMEN-Katalog M01…M18 (zielgruppe, Einsparung,
│       │                   #   Invest, foerderTyp, kenergyCta, briefVorlage, baujahrRelevantBis)
│       ├── profile.ts      # Klassifikation M1–M3 / E1–E4 + PROFILE_INTRO + FEATURED-Listen
│       ├── plan.ts         # (192 Z.) buildPlan(): filtert+rankt → Top 5, Caps, Förder-Aggregat.
│       │                   #   ⚠️ Ranking-Fix siehe „Bekannter Bug".
│       ├── foerderung.ts   # KfW 458 / BAFA BEG / Balkonkraftwerk-Zuschuss
│       ├── brief.ts        # generateVermieterBrief() — siehe Follow-up #1
│       ├── api.ts          # Client-Fetch an /api/chat (callHouse)
│       └── prompt.ts       # SYSTEM_PROMPT (Haus-Persona) + buildContextMessage(profile, plan)
└── .claude/launch.json     # Preview-Config (Name „dev"/„frag-dein-zuhause", Port 5173)
```

> Hinweis: `PlzInput.tsx` aus früheren Ständen existiert **nicht mehr** — die PLZ-Eingabe ist
> inline in `Phase1.tsx`.

---

## 🔒 KRITISCHES Sicherheits-Constraint (unbedingt einhalten)

> Wörtliche Nutzervorgabe: *„Die API ist eine von open router, erstelle dafür am besten ein
> Konstante in einer env datei, da das produkt am ende auf github hochgeladen wird."*

- Der **OpenRouter-API-Key MUSS** in einer **gitignored `.env`** liegen — **niemals** committen,
  **niemals** ins Client-Bundle bündeln.
- Umgesetzt über `loadEnv(mode, process.cwd(), '')` in `vite.config.ts` (ohne `VITE_`-Präfix →
  nur im Node-Prozess verfügbar) + Server-Proxy. Der Browser ruft nur `/api/chat` bzw. `/api/geo/*`.
- **Vor jedem Commit / GitHub-Push prüfen:**
  ```bash
  grep -rn "sk-or-" dist/ src/        # muss leer sein (außer .env.example-Platzhalter)
  grep -rn "OPENROUTER_API_KEY" dist/ # muss leer sein
  git status                          # .env darf NICHT auftauchen
  ```

---

## Setup & Befehle

```bash
cd /Users/ali/Desktop/Hackathon/Claude/frag-dein-zuhause

# 1. Echten Key eintragen (.env existiert bereits lokal; NICHT committen)
#    OPENROUTER_API_KEY=sk-or-<dein-echter-key>   in .env
#    optional: OPENROUTER_MODEL=<modell-id>

# 2. Dependencies (falls node_modules fehlt)
npm install

# 3. Dev-Server (beide Proxies aktiv; LLM-Chat braucht echten Key, Geo ist keyless)
npm run dev          # http://localhost:5173

# 4. Production-Build + Typecheck
npm run build

# 5. Build lokal testen (Proxies auch im preview aktiv)
npm run preview
```

Ohne gültigen Key liefert der Proxy eine freundliche Auth-Fehlermeldung (Flow + Plan
funktionieren trotzdem komplett — nur der freie LLM-Chat am Ende nicht). Die Adress-Suche
funktioniert immer (keyless).

---

## Verifikationsstand (diese Session, im Browser via Claude Preview MCP)

| Check | Ergebnis |
|---|---|
| `npm run build` | ✅ 0 Fehler, 1621 Module, JS 275.13 kB / gzip 78.47 kB |
| Key in `dist/` + `src/` | ✅ nicht vorhanden (nur `.env.example`-Platzhalter) |
| `.env` gitignored | ✅ ja |
| Geviertstriche in `src/` | ✅ keine |
| Konsolenfehler | ✅ keine im gesamten Durchlauf |
| **PLZ-Override** | ✅ Phase 1 `60594` → Adresse „Domshof, Bremen" → Feld `28195`, DB-Match Bremen MFH ~1965 |
| **DB-Match-Skip** | ✅ Baujahr-Frage übersprungen (per ETHOS-Treffer bekannt) |
| **Freitext→Option** | ✅ Gas / 50–80 m² / 150–250 € korrekt zugeordnet |
| **Längerer Dialog** | ✅ Heizung→Wohnfläche→Monatskosten→Bestand→Ziel→Vermieter (Mieter-Pfad) |
| **Wow + Plan** | ✅ Reveal, dann voller Plan mit Vermieter-Brief + Kenergy-CTA |

### Verifizierter Durchlauf (zum Nachklicken)

Mieter · MFH · Phase-1-PLZ Frankfurt → Adresse Bremen (Domshof) → Heizung „Gas" (Freitext) →
Wohnfläche „75 m²" (Freitext) → Monatskosten „180 €" (Freitext) → Bestand „Teilweise" →
Ziel „Niedrigere Kosten" → Vermieter „Gut erreichbar" → Wow → Plan (inkl. Vermieter-Brief +
Kenergy-CTA).

> ⚠️ Die früher dokumentierten Personas **Sarah (M1, Frankfurt)** und **Markus (E2, Wiesbaden)**
> stammen aus dem alten Chat-Only-Flow. Sie sollten **vor dem Demo erneut durchgeklickt** werden,
> da Phase 1 jetzt Click-UI ist und die Fragefolge per Skip-Logik variiert.

---

## Bekannter Bug (behoben — Kontext für Regressions-Vorsicht)

**`src/lib/plan.ts`, Ranking-Formel (~Z. 120).** Investitionsfreie Nicht-Featured-Maßnahmen
(z. B. M02 „Heizung nachts absenken", Invest `[0,0]`) bekamen `rank = 100 - 99 = 1` und
kollidierten mit den Featured-Indizes (0…n) → verdrängte den **Vermieter-Brief (Index 4)** aus
den Top 5. **Fix:** Basis `100 → 1000`:
```ts
const rank = featuredIdx >= 0 ? featuredIdx : 1000 - Math.min(kostenNutzen, 99)
```
**Vorsicht:** Wer an Sortierung/FEATURED-Listen schraubt, beide Demo-Pfade erneut durchklicken.

---

## Offene Punkte / Follow-ups

1. **Vermieter-Brief listet ggf. mieterseitige Maßnahme** *(Content-Qualität, kein Funktionsfehler).*
   `src/lib/brief.ts` → `generateVermieterBrief()` recycelt `plan.measures.filter(m => m.foerderEuro > 0)`.
   Bei Mieter-Profilen kann die einzige geförderte Top-5-Maßnahme das **Balkonkraftwerk** sein —
   im Brief an den Vermieter wirkt das unstimmig. **Vorschlag:** eigentümer-relevante Hüllen-/
   Heizungs-Maßnahmen passend zum Archetyp neu berechnen (Filter `zielgruppe` ⊇ `eigentuemer`),
   statt `plan.measures` zu recyceln.

2. **Git-Repo initialisieren** *(vor GitHub-Upload)*. Aktuell **kein Repo** (`git init` nötig).
   `.gitignore` ist da; nach `git init` prüfen, dass `.env` **nicht** im ersten Commit landet.

3. **Demo-Personas an den neuen Flow angleichen** (siehe Verifikations-Warnung oben):
   exakte Top-5-Maßnahmen-IDs für Sarah/Markus erneut bestätigen.

4. **Kein README anlegen, außer der User bittet ausdrücklich darum.** (Globale Instruktion
   verbietet unaufgeforderte Doku-Dateien. Diese HANDOFF.md wurde explizit angefragt.)

---

## Hinweise für die nächste Session

- **Phasen-Logik** in `App.tsx`: `'qualify'` (Phase1) → `'address'` (AddressStep) → `'flow'`
  (Kontextfragen) → `'wow'` (Reveal) → `'chat'` (freier LLM-Dialog). Der Wow-Moment feuert erst
  **nach dem letzten Schritt** der dynamischen `contextSeq`.
- **Fragefolge** kommt aus `buildContextSequence()` — sie überspringt Phase-1-Felder und
  DB-Match-Felder. Wer Fragen hinzufügt: in den **Pool in `flow.ts`** eintragen, nicht hart in
  `App.tsx`. Für Freitext-Unterstützung ggf. `matchFreeTextToOption` erweitern.
- **Browser-Verifikation** lief über **Claude Preview MCP** (`npm run dev`, Port 5173). Wegen der
  **Typing-Delays** zwischen den Schritten warten (~0.75–1 s nach Haus-Nachricht, mehr nach
  Interstitial + Folge-Schritt).
- **React Controlled Inputs:** `preview_fill` reicht für die Adress-Suche; für PLZ/Hausnummer
  zuverlässiger der native Setter + `dispatchEvent(new Event('input', {bubbles:true}))`.
  Buttons mit Icon haben oft leeren `textContent` (Label kommt aus `aria-label`) → beim Klick per
  Text ggf. über `aria-label` oder Ausschluss-Logik („nicht 'Zurück'") gehen.
- **Adress-Autocomplete** ist debounced (~320 ms) + Netzwerk → nach Tippen ~1.5–2 s warten, bevor
  die Trefferliste (`ul li button`) gelesen/geklickt wird. Nominatim braucht den identifizierenden
  User-Agent (UA mit „example.com" wird **403** geblockt).
- **Plan-Berechnung ist rein deterministisch lokal** (TABULA + Heizspiegel). Die LLM wird
  **ausschließlich** für den freien Chat nach dem Plan verwendet (`prompt.ts` + `api.ts`).
