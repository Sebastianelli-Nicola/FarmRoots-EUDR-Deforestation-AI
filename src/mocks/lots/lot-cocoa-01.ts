import type { Lot } from '../../types/lot'

const ring = [[-50.88,-3.78],[-50.68,-3.70],[-50.60,-3.92],[-50.78,-4.08],[-51.00,-4.02],[-51.05,-3.85],[-50.88,-3.78]]

export const lotCocoa01: Lot = {
  id: 'lot-cocoa-01',
  commodity: 'cocoa',
  supplierId: 'sup-br-01',
  quantity: 18000,
  harvestDate: '2024-07-18',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 15.3 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cocoa-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cocoa-01.pdf',
  deforestationDetected: true,
  riskLevel: 'red',
  riskScore: 78,
  blockchainTxHash: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
  blockedAt: '2024-07-22T16:45:00Z',
  createdAt: '2024-07-20T08:00:00Z',
}
