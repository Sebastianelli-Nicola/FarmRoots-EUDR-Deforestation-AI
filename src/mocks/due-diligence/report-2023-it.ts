import type { DueDiligenceReport } from '../../types/dueDiligence'

export const report2023It: DueDiligenceReport = {
  id: 'dd-2023-it-01',
  year: 2023,
  supplierId: 'sup-it-01',
  lots: ['lot-wood-01', 'lot-wood-02'],
  riskAssessmentSummary:
    'Nel 2023 La Madera . ha operato con un profilo di rischio basso su entrambi i lotti monitorati. Nessun cambio di uso del suolo rilevato successivamente al 31/12/2020. Il fornitore ha mantenuto le certificazioni FSC per tutta la durata del periodo.',
  mitigationSummary:
    'Nessuna azione di mitigazione richiesta per l\'anno 2023. Il monitoraggio periodico è proseguito secondo il piano approvato.',
  generatedAt: '2024-01-08T09:00:00Z',
  signedAt: '2024-01-10T11:00:00Z',
  submittedAt: '2024-01-12T14:00:00Z',
  status: 'submitted',
}
