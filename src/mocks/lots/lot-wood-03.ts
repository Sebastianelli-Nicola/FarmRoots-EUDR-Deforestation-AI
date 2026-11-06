import type { Lot } from '../../types/lot'

const ring = [[-43.88,-18.78],[-43.70,-18.70],[-43.62,-18.90],[-43.78,-19.05],[-43.98,-18.98],[-44.02,-18.82],[-43.88,-18.78]]

export const lotWood03: Lot = {
  id: 'lot-wood-03',
  commodity: 'wood',
  supplierId: 'sup-it-01',
  quantity: 9200,
  harvestDate: '2024-09-05',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 7.1 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-wood-03' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-wood-03.pdf',
  riskLevel: 'green',
  riskScore: 21,
  createdAt: '2024-09-10T11:00:00Z',
}
