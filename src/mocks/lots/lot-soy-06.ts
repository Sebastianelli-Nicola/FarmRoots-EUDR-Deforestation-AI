import type { Lot } from '../../types/lot'

const ring = [[-54.78,-12.35],[-54.58,-12.28],[-54.50,-12.45],[-54.65,-12.60],[-54.85,-12.55],[-54.92,-12.40],[-54.78,-12.35]]

export const lotSoy06: Lot = {
  id: 'lot-soy-06',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 29000,
  harvestDate: '2024-05-20',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 14.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-06' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-soy-06.pdf',
  riskLevel: 'amber',
  riskScore: 52,
  createdAt: '2024-05-25T09:00:00Z',
}
