import type { Lot } from '../../types/lot'

// Pentagon shape
const ring = [[-44.52,-20.13],[-44.36,-20.23],[-44.42,-20.40],[-44.62,-20.40],[-44.68,-20.23],[-44.52,-20.13]]

export const lotWood02: Lot = {
  id: 'lot-wood-02',
  commodity: 'wood',
  supplierId: 'sup-it-01',
  quantity: 7500,
  harvestDate: '2024-06-10',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 6.2 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-wood-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-wood-02.pdf',
  riskLevel: 'amber',
  riskScore: 45,
  createdAt: '2024-06-15T08:00:00Z',
}
