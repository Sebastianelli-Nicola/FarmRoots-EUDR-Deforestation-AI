import type { Lot } from '../../types/lot'

// Square shape
const ring = [[-54.68,-20.02],[-54.28,-20.02],[-54.28,-19.62],[-54.68,-19.62],[-54.68,-20.02]]

export const lotCattle01: Lot = {
  id: 'lot-cattle-01',
  commodity: 'cattle',
  supplierId: 'sup-br-01',
  quantity: 85000,
  harvestDate: '2024-10-12',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 42.0 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cattle-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cattle-01.pdf',
  riskLevel: 'amber',
  riskScore: 61,
  createdAt: '2024-10-15T09:00:00Z',
}
