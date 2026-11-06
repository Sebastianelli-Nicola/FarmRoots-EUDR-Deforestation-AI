export interface DueDiligenceReport {
  id: string;
  year: number;
  supplierId: string;
  lots: string[];
  riskAssessmentSummary: string;
  mitigationSummary: string;
  generatedAt: string;
  signedAt?: string;
  submittedAt?: string;
  status: 'draft' | 'signed' | 'submitted';
}
