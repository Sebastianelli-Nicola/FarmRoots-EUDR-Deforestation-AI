import type { Lot } from '../../types/lot'

const ring = [[-63.88,-10.95],[-63.68,-10.88],[-63.60,-11.08],[-63.78,-11.25],[-64.00,-11.18],[-64.05,-11.02],[-63.88,-10.95]]

export const lotRubber03: Lot = {
  id: 'lot-rubber-03',
  commodity: 'rubber',
  supplierId: 'sup-id-01',
  quantity: 38000,
  harvestDate: '2024-08-20',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 19.0 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-rubber-03' } },
  riskLevel: 'red',
  riskScore: 80,
  blockchainTxHash: '0xdeadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678',
  blockedAt: '2024-11-15T09:30:00Z',
  createdAt: '2024-08-25T07:00:00Z',
}
