import type { Lot } from '../../types/lot'

const ring = [[-62.58,-10.78],[-62.40,-10.70],[-62.32,-10.90],[-62.48,-11.05],[-62.68,-10.98],[-62.72,-10.82],[-62.58,-10.78]]

export const lotPalm02: Lot = {
  id: 'lot-palm-02',
  commodity: 'palm_oil',
  supplierId: 'sup-id-01',
  quantity: 41000,
  harvestDate: '2024-10-28',
  geolocation: { type: 'Polygon', coordinates: [ring], hectares: 20.2 },
  geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'lot-palm-02' } },
  deforestationFreeProof: 'https://docs.example.com/proof/lot-palm-02.pdf',
  riskLevel: 'green',
  riskScore: 25,
  createdAt: '2024-11-01T11:00:00Z',
}
