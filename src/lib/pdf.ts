import type { EnergyPlan, UserProfile } from './types'

function euro(n: number): string {
  return n.toLocaleString('en-US')
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const KAT_LABEL: Record<string, string> = {
  sofort: 'Now',
  klein: 'Small',
  mittel: 'Medium',
  gross: 'Large',
}

/**
 * Builds a printable HTML document of the energy plan client-side and opens the
 * print dialog. Via "Save as PDF" a PDF is produced — no server, no external
 * library, and without any data leaving the device.
 */
export function exportPlanPdf(plan: EnergyPlan, profile: UserProfile): void {
  const heute = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const adresse = [profile.street, profile.houseNumber].filter(Boolean).join(' ')
  const ort = [profile.plz, profile.ort].filter(Boolean).join(' ')
  const standort = [adresse, ort].filter(Boolean).join(', ') || 'My home'

  const measureRows = plan.measures
    .map((m, i) => {
      const ersparnis =
        m.savedEuroMax > 0 ? `€${euro(m.savedEuroMin)}–${euro(m.savedEuroMax)}/year` : 'depends on implementation'
      const invest = m.investMax > 0 ? `€${euro(m.investMin)}–${euro(m.investMax)}` : '—'
      const foerder = m.foerderEuro > 0 ? `€${euro(m.foerderEuro)}${m.foerderProgramm ? ` · ${esc(m.foerderProgramm)}` : ''}` : '—'
      const details = [esc(m.beschreibung), m.hinweis ? `Note: ${esc(m.hinweis)}` : '']
        .filter(Boolean)
        .join('<br/>')
      return `
        <tr>
          <td class="rank">${i + 1}</td>
          <td>
            <div class="m-name">${esc(m.name)} <span class="kat">${KAT_LABEL[m.kategorie] ?? ''}</span></div>
            <div class="m-desc">${details}</div>
            <div class="m-meta">Effort: ${esc(m.aufwand)}</div>
          </td>
          <td class="num save">${ersparnis}</td>
          <td class="num">${invest}</td>
          <td class="num">${foerder}</td>
        </tr>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Energy plan – ${esc(standort)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2430; margin: 0; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  .sub { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .brand { display:flex; align-items:center; justify-content:space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; }
  .brand .logo { font-weight: 700; color: #2563eb; font-size: 15px; }
  .kpis { display: flex; gap: 12px; margin-bottom: 22px; }
  .kpi { flex:1; border:1px solid #e5e7eb; border-radius: 10px; padding: 12px; text-align:center; }
  .kpi .v { font-size: 18px; font-weight: 700; }
  .kpi .l { font-size: 11px; color:#6b7280; margin-top: 2px; }
  .kpi.save .v { color:#16a34a; }
  .kpi.foerder .v { color:#2563eb; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background:#f3f4f6; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .02em; color:#374151; }
  td { padding: 9px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td.num { white-space: nowrap; text-align: right; }
  td.num.save { color:#16a34a; font-weight: 600; }
  td.rank { font-weight: 700; color:#2563eb; width: 22px; }
  .m-name { font-weight: 600; }
  .kat { font-size: 10px; color:#6b7280; font-weight: 400; }
  .m-desc { color:#4b5563; margin-top: 3px; line-height: 1.4; }
  .m-meta { color:#9ca3af; margin-top: 3px; font-size: 11px; }
  .sources { margin-top: 22px; font-size: 11px; color:#6b7280; line-height: 1.5; border-top:1px solid #e5e7eb; padding-top: 12px; }
  .sources b { color:#374151; }
  @media print { body { padding: 0; } @page { margin: 16mm; } }
</style>
</head>
<body>
  <div class="brand">
    <div>
      <h1>My energy plan</h1>
      <div class="sub">${esc(standort)} · ${esc(plan.archetypLabel)} · created on ${heute}</div>
    </div>
    <div class="logo">Ask Your Home<br/><span style="font-weight:400;color:#6b7280;font-size:11px">powered by Kenergy</span></div>
  </div>

  <div class="kpis">
    <div class="kpi save"><div class="v">€${euro(plan.estimatedSavingsMin)}–${euro(plan.estimatedSavingsMax)}</div><div class="l">Savings / year</div></div>
    <div class="kpi foerder"><div class="v">€${euro(plan.totalFoerder)}</div><div class="l">Possible grants</div></div>
    <div class="kpi"><div class="v">${euro(plan.co2SavingsKg)} kg</div><div class="l">CO₂ / year</div></div>
  </div>

  <table>
    <thead>
      <tr><th></th><th>Measure</th><th class="num">Savings</th><th class="num">Investment</th><th class="num">Grant</th></tr>
    </thead>
    <tbody>${measureRows}</tbody>
  </table>

  <div class="sources">
    <b>Sources &amp; methodology:</b> Energy demand per the European building typology TABULA/EPISCOPE,
    energy prices per Heizspiegel 2025. Grants per BAFA BEG individual measures 2026 plus
    KfW 458 (heating) and KfW 270 (PV loan). Regional building data from ETHOS.<br/>
    All figures are guidelines and do not replace binding professional energy advice.
  </div>

  <script>window.onload = function(){ window.focus(); window.print(); }</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) {
    // Popup blocked: fall back to a blob download of the HTML document.
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'energy-plan.html'
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
