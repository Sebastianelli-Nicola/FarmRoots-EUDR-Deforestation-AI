import type { Lot } from '../../types/lot'

// Irregular octagon shape
const ring = [[-53.55,-12.92],[-53.42,-12.86],[-53.30,-12.90],[-53.22,-13.02],[-53.28,-13.15],[-53.45,-13.22],[-53.65,-13.18],[-53.75,-13.05],[-53.70,-12.95],[-53.55,-12.92]]

export const lotSoy07: Lot = {
  id: 'lot-soy-07',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 61000,
  harvestDate: '2024-03-30',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 30.2 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-07' } },
  riskLevel: 'red',
  riskScore: 78,
  createdAt: '2024-04-05T07:00:00Z',
}
