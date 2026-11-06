import type { Lot } from '../../types/lot'

// Pentagon shape
const ring = [[-53.22,-6.16],[-53.06,-6.26],[-53.12,-6.42],[-53.32,-6.42],[-53.38,-6.26],[-53.22,-6.16]]

export const lotCocoa02: Lot = {
  id: 'lot-cocoa-02',
  commodity: 'cocoa',
  supplierId: 'sup-br-01',
  quantity: 14500,
  harvestDate: '2024-08-02',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 12.8 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cocoa-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cocoa-02.pdf',
  riskLevel: 'amber',
  riskScore: 62,
  createdAt: '2024-08-08T09:00:00Z',
}
