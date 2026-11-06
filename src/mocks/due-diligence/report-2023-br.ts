import type { DueDiligenceReport } from '../../types/dueDiligence'

export const report2023Br: DueDiligenceReport = {
  id: 'dd-2023-br-01',
  year: 2023,
  supplierId: 'sup-br-01',
  lots: ['lot-soy-01', 'lot-soy-02', 'lot-cattle-01'],
  riskAssessmentSummary:
    'Nel 2023 Fazenda Verde Ltda ha mostrato un profilo di rischio prevalentemente ambra. Due lotti su tre hanno richiesto verifiche aggiuntive per cambio di uso del suolo nelle aree limitrofe. Nessun lotto è stato classificato ROSSO.',
  mitigationSummary:
    'Per i lotti lot-soy-01 e lot-cattle-01 sono state completate le verifiche di conformità entro settembre 2023. I documenti geospaziali aggiornati sono stati acquisiti e archiviati.',
  generatedAt: '2024-01-15T10:00:00Z',
  signedAt: '2024-01-18T09:30:00Z',
  submittedAt: '2024-01-20T16:00:00Z',
  status: 'submitted',
}
