import type { Lot } from '../../types/lot'

const ring = [[-50.88,-17.18],[-50.68,-17.10],[-50.60,-17.32],[-50.78,-17.48],[-51.00,-17.42],[-51.05,-17.25],[-50.88,-17.18]]

export const lotWood05: Lot = {
  id: 'lot-wood-05',
  commodity: 'wood',
  supplierId: 'sup-it-01',
  quantity: 11000,
  harvestDate: '2024-05-12',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 8.8 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-wood-05' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-wood-05.pdf',
  riskLevel: 'amber',
  riskScore: 53,
  createdAt: '2024-05-18T10:00:00Z',
}
