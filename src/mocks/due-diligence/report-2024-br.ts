import type { DueDiligenceReport } from '../../types/dueDiligence'

export const report2024Br: DueDiligenceReport = {
  id: 'dd-2024-br-01',
  year: 2024,
  supplierId: 'sup-br-01',
  lots: ['lot-soy-01', 'lot-soy-02', 'lot-cocoa-01', 'lot-coffee-01', 'lot-cattle-01'],
  riskAssessmentSummary:
    'Il fornitore Fazenda Verde Ltda ha mostrato un profilo di rischio misto nel 2024. Il lotto lot-cocoa-01 è stato classificato ROSSO (score 78) per deforestazione nelle aree adiacenti e cambio di uso del suolo post-2020. I lotti di soia e caffè presentano rischio ambra, mentre il lotto lot-soy-02 è verde. Il fornitore non è stato sospeso ma richiede monitoraggio rafforzato.',
  mitigationSummary:
    'Per il lotto lot-cocoa-01 sono state avviate 7 azioni di mitigazione, di cui 2 in corso e 5 in attesa. Il lotto è stato bloccato sulla blockchain in data 22/07/2024. Si raccomanda una revisione trimestrale dello stato di conformità.',
  generatedAt: '2025-01-20T11:00:00Z',
  signedAt: '2025-01-22T16:00:00Z',
  status: 'signed',
}
