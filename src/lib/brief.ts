import type { EnergyPlan, UserProfile } from './types'
import { BUILDING_LABEL } from './tabula'
import { plzRegionLabel } from './ethos'

// Briefvorlage für Mieter:innen (§554 BGB / Hinweis auf Förderungen an den Vermieter).
export function generateVermieterBrief(profile: UserProfile, plan: EnergyPlan): string {
  const ort = profile.plz ? `${profile.plz} ${plzRegionLabel(profile.plz)}` : 'my place of residence'
  const typ = profile.buildingType ? BUILDING_LABEL[profile.buildingType].toLowerCase() : 'building'

  // Highlight measures with funding potential for the landlord.
  const foerderbar = plan.measures.filter((m) => m.foerderEuro > 0)
  const foerderZeilen = foerderbar.length
    ? foerderbar
        .map((m) => `  • ${m.name}: grant up to €${m.foerderEuro} (${m.foerderProgramm})`)
        .join('\n')
    : '  • Heating optimization and insulation measures are funded through BAFA/KfW.'

  return `Subject: Energy improvements to our ${typ}

Dear Landlord,

I live in your ${typ} in ${ort} and would like to talk with you about ways to reduce our building’s energy costs and CO₂ emissions.

An initial assessment shows that the building currently uses about ${plan.pctOverStandard}% more energy than is common today. Several measures would pay off financially for you as the owner thanks to government funding:

${foerderZeilen}

These investments increase the property’s value, improve its energy efficiency rating, and can be partly refinanced via the modernization levy. I’d be happy to help coordinate with specialist contractors.

I would welcome a short conversation.

Kind regards,
[Your name]`
}
