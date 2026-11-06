import type { Lot } from '../../types/lot'

const ring = [[-54.28,-13.42],[-54.15,-13.38],[-54.10,-13.48],[-54.18,-13.57],[-54.32,-13.55],[-54.38,-13.46],[-54.28,-13.42]]

export const lotSoy02: Lot = {
  id: 'lot-soy-02',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 38000,
  harvestDate: '2024-05-10',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 18.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-soy-02.pdf',
  riskLevel: 'green',
  riskScore: 28,
  createdAt: '2024-05-15T14:00:00Z',
}
