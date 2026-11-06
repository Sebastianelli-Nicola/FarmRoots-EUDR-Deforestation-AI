import type { Lot } from '../../types/lot'

const ring = [[-51.58,-4.15],[-51.38,-4.08],[-51.30,-4.28],[-51.48,-4.45],[-51.70,-4.38],[-51.75,-4.22],[-51.58,-4.15]]

export const lotCattle05: Lot = {
  id: 'lot-cattle-05',
  commodity: 'cattle',
  supplierId: 'sup-br-01',
  quantity: 110000,
  harvestDate: '2024-08-15',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 55.0 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cattle-05' } },
  riskLevel: 'red',
  riskScore: 85,
  blockchainTxHash: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
  blockedAt: '2024-08-20T14:00:00Z',
  createdAt: '2024-08-18T09:00:00Z',
}
