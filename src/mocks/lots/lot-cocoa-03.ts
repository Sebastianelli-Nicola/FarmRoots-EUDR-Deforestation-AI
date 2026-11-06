import type { Lot } from '../../types/lot'

// Square shape
const ring = [[-51.22,-5.23],[-50.82,-5.23],[-50.82,-4.87],[-51.22,-4.87],[-51.22,-5.23]]

export const lotCocoa03: Lot = {
  id: 'lot-cocoa-03',
  commodity: 'cocoa',
  supplierId: 'sup-br-01',
  quantity: 11000,
  harvestDate: '2024-09-10',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 9.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cocoa-03' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cocoa-03.pdf',
  riskLevel: 'green',
  riskScore: 35,
  createdAt: '2024-09-15T10:00:00Z',
}
