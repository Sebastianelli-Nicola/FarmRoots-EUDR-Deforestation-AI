import type { Lot } from '../../types/lot'

const ring = [[-55.45,-12.85],[-55.32,-12.83],[-55.28,-12.91],[-55.36,-12.98],[-55.50,-12.95],[-55.53,-12.88],[-55.45,-12.85]]

export const lotSoy01: Lot = {
  id: 'lot-soy-01',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 45000,
  harvestDate: '2024-04-20',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 22.0 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-soy-01.pdf',
  riskLevel: 'amber',
  riskScore: 55,
  createdAt: '2024-04-25T09:00:00Z',
}
