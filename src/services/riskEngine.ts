import type { CommodityType, RiskLevel } from '../types/lot'
import type { Lot } from '../types/lot'
import type { Supplier } from '../types/supplier'
import type { RegulatoryRiskCriteria, RiskAssessment, CriterionProjection, RiskForecast } from '../types/risk'

export const RISK_CRITERIA: Omit<RegulatoryRiskCriteria, 'score'>[] = [
  { id: 'c01', label: 'Deforestation in adjacent areas', description: 'Evidence of deforestation within 5 km of lot boundary', weight: 0.20 },
  { id: 'c02', label: 'Country-level deforestation risk', description: 'National deforestation risk rating from EU country benchmark', weight: 0.18 },
  { id: 'c03', label: 'Land use change after 2020-12-31', description: 'Satellite-detected land use change post cut-off date', weight: 0.15 },
  { id: 'c04', label: 'Supplier compliance history', description: 'Track record of past compliance with EUDR-related requirements', weight: 0.12 },
  { id: 'c05', label: 'Availability of geolocation data', description: 'Quality and completeness of provided GeoJSON coordinates', weight: 0.08 },
  { id: 'c06', label: 'Forest coverage at lot location', description: 'Percentage of forested area within lot boundaries', weight: 0.08 },
  { id: 'c07', label: 'Protected area proximity', description: 'Distance to nearest IUCN-designated protected area', weight: 0.07 },
  { id: 'c08', label: 'Indigenous land overlap', description: 'Overlap with officially recognized indigenous territories', weight: 0.05 },
]

export function computeOverallScore(criteria: RegulatoryRiskCriteria[]): number {
  const weightedSum = criteria.reduce((acc, c) => acc + c.score * c.weight, 0)
  const totalWeight = criteria.reduce((acc, c) => acc + c.weight, 0)
  return Math.round((weightedSum / totalWeight) * 10)
}

export function computeRiskLevel(score: number): RiskLevel {
  if (score < 33) return 'green'
  if (score < 66) return 'amber'
  return 'red'
}

// Criteria that tend to worsen environmentally without intervention (score increase per 30-day period, only when score >= 6)
const ENVIRONMENTAL_DRIFT: Partial<Record<string, number>> = {
  c01: 0.4,
  c03: 0.3,
  c06: 0.25,
  c02: 0.1,
}

// Commodity-specific high-risk criteria
const COMMODITY_HIGH_CRITERIA: Record<CommodityType, string[]> = {
  wood:     ['c01', 'c03', 'c06', 'c07'],
  cattle:   ['c01', 'c02', 'c03', 'c08'],
  soy:      ['c02', 'c03', 'c05', 'c06'],
  cocoa:    ['c01', 'c06', 'c07', 'c08'],
  coffee:   ['c04', 'c06'],
  palm_oil: ['c01', 'c02', 'c08'],
  rubber:   ['c06'],
}

const CRITERION_RATIONALE: Record<string, { improving: string; stable: string; worsening: string }> = {
  c01: {
    improving: 'Il monitoraggio satellitare in corso ridurrà l\'incertezza sulla deforestazione adiacente.',
    stable: 'Nessun monitoraggio attivo pianificato. Il rischio di deforestazione adiacente rimane invariato.',
    worsening: 'La pressione agricola stagionale nella regione può incrementare il rischio di deforestazione limitrofa.',
  },
  c02: {
    improving: 'I progressi nei programmi di conservazione forestale migliorano il profilo di rischio del paese.',
    stable: 'Il rating EUDR del paese rimane stabile. Nessun cambiamento atteso a breve termine.',
    worsening: 'Le tendenze politiche ed economiche del paese potrebbero peggiorare il rating di rischio.',
  },
  c03: {
    improving: 'L\'audit indipendente sull\'uso del suolo fornirà prove aggiornate per il periodo di riferimento.',
    stable: 'Nessun audit pianificato. La valutazione del cambio d\'uso del suolo rimane basata sui dati attuali.',
    worsening: 'L\'espansione agricola in corso nell\'area potrebbe rilevare ulteriori cambiamenti d\'uso del suolo.',
  },
  c04: {
    improving: 'Le azioni di compliance del fornitore in corso migliorano lo storico di conformità EUDR.',
    stable: 'Nessuna azione di aggiornamento della compliance fornitore pianificata a breve.',
    worsening: 'Senza interventi, lo storico di non-conformità del fornitore pesa negativamente.',
  },
  c05: {
    improving: 'Il miglioramento della qualità e completezza dei dati GeoJSON è in corso.',
    stable: 'La qualità dei dati di geolocalizzazione è stabile. Nessun aggiornamento previsto.',
    worsening: 'La mancanza di aggiornamenti ai geodati riduce la fiducia nella precisione delle coordinate.',
  },
  c06: {
    improving: 'Le azioni di verifica della copertura forestale in loco miglioreranno la valutazione.',
    stable: 'Nessuna variazione attesa nella copertura forestale del lotto.',
    worsening: 'La stagione secca e le attività agricole potrebbero ridurre ulteriormente la copertura forestale.',
  },
  c07: {
    improving: 'La consulenza legale sulla prossimità alle aree protette è in corso.',
    stable: 'La distanza dalle aree protette IUCN rimane costante. Nessuna variazione attesa.',
    worsening: 'Nuove designazioni di aree protette nella regione potrebbero aggravare la valutazione.',
  },
  c08: {
    improving: 'La verifica delle sovrapposizioni con i territori indigeni è in corso.',
    stable: 'I confini dei territori indigeni riconosciuti non cambiano. Valore stabile.',
    worsening: 'Potenziali rivendicazioni territoriali non registrate potrebbero emergere nel periodo.',
  },
}

export function generateAssessmentForLot(lot: Lot, supplier: Supplier): RiskAssessment {
  const targetAvg = lot.riskScore / 10
  const highCriteria = COMMODITY_HIGH_CRITERIA[lot.commodity] ?? []

  // Generate raw scores with commodity/compliance modifiers
  const rawCriteria = RISK_CRITERIA.map(template => {
    const seed = template.id.charCodeAt(1) * 31 + lot.id.length * 17 + lot.riskScore
    const noise = (((seed * 1234567) & 0xffff) % 21 - 10) / 10
    const isHigh = highCriteria.includes(template.id)
    const complianceFactor = (100 - supplier.complianceScore) / 100
    const base = isHigh ? targetAvg + 1.8 + complianceFactor : targetAvg - 0.8 + noise
    return { ...template, score: Math.min(10, Math.max(0.1, base + noise)) }
  })

  // Calibrate: scale all scores so the weighted average matches lot.riskScore
  const currentWeightedAvg = rawCriteria.reduce((sum, c) => sum + c.score * c.weight, 0)
  const scaleFactor = currentWeightedAvg > 0 ? targetAvg / currentWeightedAvg : 1

  const criteria: RegulatoryRiskCriteria[] = rawCriteria.map(c => ({
    ...c,
    score: Math.min(10, Math.max(0, Math.round(c.score * scaleFactor))),
  }))

  const overallScore = computeOverallScore(criteria)

  return {
    lotId: lot.id,
    criteria,
    overallScore,
    level: computeRiskLevel(overallScore),
    assessedAt: lot.createdAt,
    mitigationActions: [],
  }
}

export function generateForecasts(assessment: RiskAssessment): RiskForecast[] {
  return ([30, 60, 90] as const).map(horizon => {
    const periods = horizon / 30

    const projections: CriterionProjection[] = assessment.criteria.map(criterion => {
      const actions = assessment.mitigationActions.filter(a => a.criterionId === criterion.id)

      let mitigationReduction = 0
      for (const action of actions) {
        if (action.status === 'done') continue
        const prob =
          action.status === 'in_progress'
            ? horizon === 30 ? 0.75 : horizon === 60 ? 0.95 : 1.0
            : horizon === 30 ? 0.20 : horizon === 60 ? 0.60 : 0.90
        mitigationReduction += 1.5 * prob
      }

      const drift = ENVIRONMENTAL_DRIFT[criterion.id] ?? 0
      const environmentalIncrease =
        criterion.score >= 6 && actions.length === 0 ? drift * periods : 0

      const raw = criterion.score - mitigationReduction + environmentalIncrease
      const projectedScore = Math.min(10, Math.max(0, Math.round(raw)))
      const delta = projectedScore - criterion.score
      // Contributo arrotondato a intero (scala 0-100): la somma di tutti i contributi = delta totale esatto
      const contribution = Math.round(delta * criterion.weight * 10)

      let rationale: string
      const templates = CRITERION_RATIONALE[criterion.id]
      if (delta < -0.5 && templates) {
        rationale = templates.improving
      } else if (delta > 0.5 && templates) {
        rationale = templates.worsening
      } else {
        rationale = templates?.stable ?? 'Nessuna variazione significativa attesa nel periodo.'
      }

      return {
        criterionId: criterion.id,
        label: criterion.label,
        weight: criterion.weight,
        currentScore: criterion.score,
        projectedScore,
        delta,
        contribution,
        rationale,
      }
    })

    // projectedScore = overallScore + somma intera dei contributi (nessun arrotondamento aggiuntivo)
    // Garantisce: Σ contributions = projectedScore - overallScore (esatto, per costruzione)
    const overallDelta = projections.reduce((sum, p) => sum + p.contribution, 0)
    const projectedScore = Math.max(0, Math.min(100, assessment.overallScore + overallDelta))
    const projectedLevel = computeRiskLevel(projectedScore)
    const scoreDelta = overallDelta

    const improving = projections.filter(p => p.delta < -0.5).sort((a, b) => a.delta - b.delta)
    const worsening = projections.filter(p => p.delta > 0.5).sort((a, b) => b.delta - a.delta)

    let summaryExplanation: string
    if (scoreDelta <= -3 && improving.length > 0) {
      const labels = improving.slice(0, 2).map(p => `"${p.label}"`).join(' e ')
      summaryExplanation =
        `Tra ${horizon} giorni il punteggio dovrebbe scendere a ${projectedScore}/100 (${scoreDelta} punti). ` +
        `I criteri ${labels} mostrano il miglioramento più significativo grazie alle azioni di mitigazione in corso.` +
        (worsening.length > 0
          ? ` Tuttavia "${worsening[0].label}" potrebbe peggiorare in assenza di contromisure aggiuntive.`
          : ' Nessun peggioramento significativo atteso.')
    } else if (scoreDelta >= 3) {
      const wLabels = worsening.slice(0, 2).map(p => `"${p.label}"`).join(' e ')
      summaryExplanation =
        `Tra ${horizon} giorni il punteggio potrebbe aumentare a ${projectedScore}/100 (+${scoreDelta} punti) in assenza di interventi. ` +
        `I criteri ${wLabels} mostrano una tendenza peggiorativa legata a fattori ambientali stagionali. ` +
        `Si raccomanda l'adozione urgente di misure di mitigazione.`
    } else {
      summaryExplanation =
        `Tra ${horizon} giorni il punteggio di rischio dovrebbe rimanere sostanzialmente stabile a ${projectedScore}/100. ` +
        (improving.length > 0
          ? `Alcune azioni di mitigazione ("${improving[0].label}") apporteranno miglioramenti contenuti. `
          : '') +
        `Il profilo di rischio complessivo non subirà variazioni sostanziali nel breve termine.`
    }

    return {
      lotId: assessment.lotId,
      horizon,
      currentScore: assessment.overallScore,
      projectedScore,
      projectedLevel,
      criteriaProjections: projections,
      summaryExplanation,
    }
  })
}
