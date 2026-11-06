import type { Supplier } from '../../types/supplier'

export const supplierIt01: Supplier = {
  id: 'sup-it-01',
  name: 'La Madera .',
  country: 'Mexico',
  countryRiskLevel: 'green',
  commodities: ['wood'],
  activeLots: 5,
  complianceScore: 88,
  suspended: false,
  subSuppliers: [],
}
