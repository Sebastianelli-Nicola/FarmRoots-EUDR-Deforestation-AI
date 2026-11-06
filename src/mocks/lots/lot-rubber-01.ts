import type { Lot } from '../../types/lot'

const ring = [[-63.28,-11.48],[-63.08,-11.40],[-63.00,-11.62],[-63.18,-11.78],[-63.40,-11.72],[-63.45,-11.55],[-63.28,-11.48]]

export const lotRubber01: Lot = {
  id: 'lot-rubber-01',
  commodity: 'rubber',
  supplierId: 'sup-id-01',
  quantity: 31000,
  harvestDate: '2024-09-20',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 18.4 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-rubber-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-rubber-01.pdf',
  riskLevel: 'red',
  riskScore: 89,
  createdAt: '2024-09-25T06:00:00Z',
}
