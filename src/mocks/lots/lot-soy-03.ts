import type { Lot } from '../../types/lot'

// Square shape
const ring = [[-54.07,-14.43],[-53.67,-14.43],[-53.67,-14.07],[-54.07,-14.07],[-54.07,-14.43]]

export const lotSoy03: Lot = {
  id: 'lot-soy-03',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 52000,
  harvestDate: '2024-04-28',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 26.0 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-03' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-soy-03.pdf',
  riskLevel: 'green',
  riskScore: 22,
  createdAt: '2024-05-02T10:30:00Z',
}
