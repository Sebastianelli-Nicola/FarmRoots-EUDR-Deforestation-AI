import type { Lot } from '../../types/lot'

// Square shape
const ring = [[-41.02,-15.77],[-40.62,-15.77],[-40.62,-15.37],[-41.02,-15.37],[-41.02,-15.77]]

export const lotCoffee02: Lot = {
  id: 'lot-coffee-02',
  commodity: 'coffee',
  supplierId: 'sup-br-01',
  quantity: 19000,
  harvestDate: '2024-07-15',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 9.8 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-coffee-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-coffee-02.pdf',
  riskLevel: 'green',
  riskScore: 30,
  createdAt: '2024-07-20T11:00:00Z',
}
