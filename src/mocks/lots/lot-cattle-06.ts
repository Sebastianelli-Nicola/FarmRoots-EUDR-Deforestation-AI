import type { Lot } from '../../types/lot'

const ring = [[-52.88,-5.48],[-52.68,-5.40],[-52.60,-5.62],[-52.78,-5.78],[-53.00,-5.72],[-53.05,-5.55],[-52.88,-5.48]]

export const lotCattle06: Lot = {
  id: 'lot-cattle-06',
  commodity: 'cattle',
  supplierId: 'sup-br-01',
  quantity: 95000,
  harvestDate: '2024-07-25',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 47.5 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-cattle-06' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-cattle-06.pdf',
  deforestationDetected: true,
  riskLevel: 'amber',
  riskScore: 65,
  createdAt: '2024-07-30T11:00:00Z',
}
