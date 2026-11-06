import type { Supplier } from '../../types/supplier'

export const supplierBr01: Supplier = {
  id: 'sup-br-01',
  name: 'Fazenda Verde Ltda',
  country: 'Brazil',
  countryRiskLevel: 'amber',
  commodities: ['soy', 'cattle'],
  activeLots: 20,
  complianceScore: 61,
  suspended: false,
  subSuppliers: [],
}
