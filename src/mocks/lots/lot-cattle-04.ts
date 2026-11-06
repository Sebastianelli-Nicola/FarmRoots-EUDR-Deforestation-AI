import type { Lot } from '../../types/lot'

const ring = [[-53.92,-19.95],[-53.72,-19.88],[-53.65,-20.08],[-53.80,-20.22],[-54.00,-20.18],[-54.05,-20.02],[-53.92,-19.95]]

export const lotCattle04: Lot = {
  id: 'lot-cattle-04',
  commodity: 'cattle',
  supplierId: 'sup-br-01',
  quantity: 68000,
  harvestDate: '2024-09-28',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 33.8 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cattle-04' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cattle-04.pdf',
  riskLevel: 'amber',
  riskScore: 58,
  createdAt: '2024-10-03T07:00:00Z',
}
