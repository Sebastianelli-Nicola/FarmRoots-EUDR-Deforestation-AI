import type { Lot } from '../../types/lot'

const ring = [[-62.08,-10.18],[-61.90,-10.10],[-61.82,-10.30],[-61.98,-10.45],[-62.18,-10.38],[-62.22,-10.22],[-62.08,-10.18]]

export const lotCoffee03: Lot = {
  id: 'lot-coffee-03',
  commodity: 'coffee',
  supplierId: 'sup-br-01',
  quantity: 22000,
  harvestDate: '2024-06-10',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 11.0 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-coffee-03' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-coffee-03.pdf',
  riskLevel: 'green',
  riskScore: 26,
  createdAt: '2024-06-15T09:00:00Z',
}
