import type { RiskLevel } from './lot'

export interface RegulatoryRiskCriteria {
  id: string;
  label: string;
  description: string;
  score: number;
  weight: number;
}

export interface MitigationAction {
  id: string;
  criterionId: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  dueDate: string;
}

export interface RiskAssessment {
  lotId: string;
  criteria: RegulatoryRiskCriteria[];
  overallScore: number;
  level: RiskLevel;
  assessedAt: string;
  mitigationActions: MitigationAction[];
}

export interface CriterionProjection {
  criterionId: string;
  label: string;
  weight: number;
  currentScore: number;
  projectedScore: number;
  delta: number;
  contribution: number; // impatto sullo score 0-100: delta * weight * 10 (non arrotondato)
  rationale: string;
}

export interface RiskForecast {
  lotId: string;
  horizon: 30 | 60 | 90;
  currentScore: number;
  projectedScore: number;
  projectedLevel: RiskLevel;
  criteriaProjections: CriterionProjection[];
  summaryExplanation: string;
}
