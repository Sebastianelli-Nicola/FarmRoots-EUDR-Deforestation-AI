import type { Lot } from '../../types/lot'

const ring = [[-49.58,-16.48],[-49.38,-16.40],[-49.30,-16.62],[-49.48,-16.78],[-49.70,-16.72],[-49.75,-16.55],[-49.58,-16.48]]

export const lotWood04: Lot = {
  id: 'lot-wood-04',
  commodity: 'wood',
  supplierId: 'sup-it-01',
  quantity: 15000,
  harvestDate: '2024-04-20',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 10.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-wood-04' } },
  deforestationFreeProof: 'https://docs.internal/proof/lot-wood-04.pdf',
  deforestationDetected: true,
  riskLevel: 'red',
  riskScore: 75,
  blockchainTxHash: '0xc4d5e6f7a8b9c0d1e2f3c4d5e6f7a8b9c0d1e2f3c4d5e6f7a8b9c0d1e2f3a4b5',
  blockedAt: '2024-04-25T13:00:00Z',
  createdAt: '2024-04-22T09:00:00Z',
}
