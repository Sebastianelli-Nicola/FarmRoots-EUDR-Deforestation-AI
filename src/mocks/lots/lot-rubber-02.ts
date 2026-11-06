import type { Lot } from '../../types/lot'

const ring = [[-64.08,-12.18],[-63.88,-12.10],[-63.80,-12.32],[-63.98,-12.48],[-64.20,-12.40],[-64.25,-12.25],[-64.08,-12.18]]

export const lotRubber02: Lot = {
  id: 'lot-rubber-02',
  commodity: 'rubber',
  supplierId: 'sup-id-01',
  quantity: 26000,
  harvestDate: '2024-10-05',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 13.2 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-rubber-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-rubber-02.pdf',
  riskLevel: 'amber',
  riskScore: 60,
  createdAt: '2024-10-10T08:00:00Z',
}
