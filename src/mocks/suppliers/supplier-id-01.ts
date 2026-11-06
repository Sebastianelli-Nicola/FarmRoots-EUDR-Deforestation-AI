import type { Supplier } from '../../types/supplier'

export const supplierIdR01: Supplier = {
  id: 'sup-id-01',
  name: 'PT Borneo Agro Resources',
  country: 'Indonesia',
  countryRiskLevel: 'red',
  commodities: ['palm_oil', 'rubber'],
  activeLots: 5,
  complianceScore: 34,
  suspended: true,
  suspendedAt: '2024-11-15T09:30:00Z',
  subSuppliers: [],
}
