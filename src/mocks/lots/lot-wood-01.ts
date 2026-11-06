import type { Lot } from '../../types/lot'

// Square shape
const ring = [[-45.42,-19.78],[-45.02,-19.78],[-45.02,-19.38],[-45.42,-19.38],[-45.42,-19.78]]

export const lotWood01: Lot = {
  id: 'lot-wood-01',
  commodity: 'wood',
  supplierId: 'sup-it-01',
  quantity: 12000,
  harvestDate: '2024-03-15',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 8.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-wood-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-wood-01.pdf',
  riskLevel: 'green',
  riskScore: 18,
  createdAt: '2024-03-20T10:00:00Z',
}
