import type { Lot } from '../../types/lot'

const ring = [[-56.28,-13.15],[-56.10,-13.08],[-56.02,-13.22],[-56.15,-13.38],[-56.35,-13.32],[-56.40,-13.20],[-56.28,-13.15]]

export const lotSoy05: Lot = {
  id: 'lot-soy-05',
  commodity: 'soy',
  supplierId: 'sup-br-01',
  quantity: 35000,
  harvestDate: '2024-04-15',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 16.8 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-soy-05' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-soy-05.pdf',
  riskLevel: 'green',
  riskScore: 31,
  createdAt: '2024-04-20T11:00:00Z',
}
