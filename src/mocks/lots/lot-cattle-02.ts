import type { Lot } from '../../types/lot'

const ring = [[-55.28,-20.42],[-55.08,-20.35],[-55.00,-20.55],[-55.18,-20.72],[-55.38,-20.65],[-55.42,-20.50],[-55.28,-20.42]]

export const lotCattle02: Lot = {
  id: 'lot-cattle-02',
  commodity: 'cattle',
  supplierId: 'sup-br-01',
  quantity: 72000,
  harvestDate: '2024-10-20',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 35.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cattle-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cattle-02.pdf',
  riskLevel: 'green',
  riskScore: 32,
  createdAt: '2024-10-25T10:00:00Z',
}
