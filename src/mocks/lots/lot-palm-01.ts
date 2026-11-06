import type { Lot } from '../../types/lot'

// Irregular octagon shape
const ring = [[-52.08,-4.45],[-51.92,-4.40],[-51.80,-4.50],[-51.82,-4.62],[-51.92,-4.73],[-52.10,-4.76],[-52.22,-4.66],[-52.20,-4.52],[-52.08,-4.45]]

export const lotPalm01: Lot = {
  id: 'lot-palm-01',
  commodity: 'palm_oil',
  supplierId: 'sup-id-01',
  quantity: 62000,
  harvestDate: '2024-08-05',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 35.8 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-palm-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-palm-01.pdf',
  riskLevel: 'red',
  riskScore: 94,
  blockchainTxHash: '0xf9e8d7c6b5a49382f9e8d7c6b5a49382f9e8d7c6b5a49382f9e8d7c6b5a49382',
  blockedAt: '2024-11-15T09:30:00Z',
  createdAt: '2024-11-10T07:00:00Z',
}
