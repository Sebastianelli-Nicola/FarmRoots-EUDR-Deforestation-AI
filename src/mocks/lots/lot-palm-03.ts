import type { Lot } from '../../types/lot'

const ring = [[-39.88,-13.18],[-39.70,-13.10],[-39.62,-13.30],[-39.78,-13.45],[-39.98,-13.38],[-40.02,-13.22],[-39.88,-13.18]]

export const lotPalm03: Lot = {
  id: 'lot-palm-03',
  commodity: 'palm_oil',
  supplierId: 'sup-br-01',
  quantity: 33000,
  harvestDate: '2024-09-15',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 16.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-palm-03' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-palm-03.pdf',
  riskLevel: 'green',
  riskScore: 29,
  createdAt: '2024-09-20T10:00:00Z',
}
