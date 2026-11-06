import type { DueDiligenceReport } from '../../types/dueDiligence'

export const report2024It: DueDiligenceReport = {
  id: 'dd-2024-it-01',
  year: 2024,
  supplierId: 'sup-it-01',
  lots: ['lot-wood-01', 'lot-wood-02', 'lot-wood-03'],
  riskAssessmentSummary:
    'Il fornitore La Madera . ha operato nel 2024 con un profilo di rischio complessivamente basso. Due lotti su tre presentano score inferiore a 33 (verde), mentre un lotto ha registrato uno score ambra (48) per variazioni nella copertura forestale adiacente. Non sono stati rilevati cambiamenti di uso del suolo successivi al 31/12/2020.',
  mitigationSummary:
    'Per il lotto lot-wood-03 è stata avviata una verifica indipendente della copertura forestale. Le azioni di mitigazione sono in corso e si prevede la chiusura entro il primo trimestre 2025.',
  generatedAt: '2025-01-10T09:00:00Z',
  signedAt: '2025-01-12T14:30:00Z',
  submittedAt: '2025-01-15T10:00:00Z',
  status: 'submitted',
}
