import type { Lot } from '../../types/lot'

// Pentagon shape
const ring = [[-56.02,-21.13],[-55.86,-21.23],[-55.92,-21.41],[-56.12,-21.41],[-56.18,-21.23],[-56.02,-21.13]]

export const lotCattle03: Lot = {
  id: 'lot-cattle-03',
  commodity: 'cattle',
  supplierId: 'sup-br-01',
  quantity: 91000,
  harvestDate: '2024-11-05',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 45.2 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cattle-03' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cattle-03.pdf',
  riskLevel: 'green',
  riskScore: 27,
  createdAt: '2024-11-10T08:00:00Z',
}
