import type { DueDiligenceReport } from '../../types/dueDiligence'

export const report2024Id: DueDiligenceReport = {
  id: 'dd-2024-id-01',
  year: 2024,
  supplierId: 'sup-id-01',
  lots: ['lot-palm-01', 'lot-palm-02', 'lot-rubber-01'],
  riskAssessmentSummary:
    'Il fornitore PT Borneo Agro Resources ha registrato il profilo di rischio più elevato del portafoglio nel 2024. Due lotti su tre sono classificati ROSSO (lot-palm-01: score 87, lot-rubber-01: score 82). Il fornitore è stato sospeso in data 15/11/2024 in seguito al blocco automatico su blockchain dei lotti ad alto rischio.',
  mitigationSummary:
    'Sono state attivate complessivamente 15 azioni di mitigazione tra i lotti lot-palm-01 e lot-rubber-01. Il piano di rientro prevede un audit indipendente entro febbraio 2025 e il completamento delle procedure FPIC entro marzo 2025. La sospensione del fornitore rimarrà attiva fino alla verifica positiva dei criteri c01, c03 e c08.',
  generatedAt: '2025-02-01T09:00:00Z',
  status: 'draft',
}
