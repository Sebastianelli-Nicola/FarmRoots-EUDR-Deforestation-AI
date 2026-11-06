import type { Lot } from '../../types/lot'

// Pentagon shape
const ring = [[-55.80,-14.66],[-55.64,-14.76],[-55.70,-14.92],[-55.90,-14.92],[-55.96,-14.76],[-55.80,-14.66]]

export const lotSoy04: Lot = {
  id: 'lot-soy-04',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 41000,
  harvestDate: '2024-05-05',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 20.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-04' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-soy-04.pdf',
  riskLevel: 'amber',
  riskScore: 48,
  createdAt: '2024-05-10T08:00:00Z',
}
