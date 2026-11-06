import type { Lot } from '../../types/lot'

// Pentagon shape
const ring = [[-41.52,-14.73],[-41.36,-14.83],[-41.42,-14.99],[-41.62,-14.99],[-41.68,-14.83],[-41.52,-14.73]]

export const lotCoffee01: Lot = {
  id: 'lot-coffee-01',
  commodity: 'coffee',
  supplierId: 'sup-br-01',
  quantity: 25000,
  harvestDate: '2024-06-30',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 11.7 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-coffee-01' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-coffee-01.pdf',
  riskLevel: 'amber',
  riskScore: 43,
  createdAt: '2024-07-05T10:00:00Z',
}
