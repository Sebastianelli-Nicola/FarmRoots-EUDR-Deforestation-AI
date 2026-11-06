import type { CommodityType, RiskLevel } from './lot'

export interface Supplier {
  id: string;
  name: string;
  country: string;
  countryRiskLevel: RiskLevel;
  commodities: CommodityType[];
  activeLots: number;
  complianceScore: number;
  suspended: boolean;
  suspendedAt?: string;
  subSuppliers?: Supplier[];
}
