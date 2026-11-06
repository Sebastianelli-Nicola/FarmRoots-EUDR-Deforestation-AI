import type { RiskAssessment } from '../../types/risk'

export const assessmentLot04: RiskAssessment = {
  lotId: 'lot-rubber-01',
  overallScore: 89,
  level: 'red',
  assessedAt: '2024-09-26T07:00:00Z',
  criteria: [
    { id: 'c01', label: 'Deforestation in adjacent areas', description: 'Evidence of deforestation within 5 km of lot boundary', score: 10, weight: 0.20 },
    { id: 'c02', label: 'Country-level deforestation risk', description: 'National deforestation risk rating from EU country benchmark', score: 9, weight: 0.18 },
    { id: 'c03', label: 'Land use change after 2020-12-31', description: 'Satellite-detected land use change post cut-off date', score: 8, weight: 0.15 },
    { id: 'c04', label: 'Supplier compliance history', description: 'Track record of past compliance with EUDR-related requirements', score: 8, weight: 0.12 },
    { id: 'c05', label: 'Availability of geolocation data', description: 'Quality and completeness of provided GeoJSON coordinates', score: 5, weight: 0.08 },
    { id: 'c06', label: 'Forest coverage at lot location', description: 'Percentage of forested area within lot boundaries', score: 8, weight: 0.08 },
    { id: 'c07', label: 'Protected area proximity', description: 'Distance to nearest IUCN-designated protected area', score: 7, weight: 0.07 },
    { id: 'c08', label: 'Indigenous land overlap', description: 'Overlap with officially recognized indigenous territories', score: 9, weight: 0.05 },
  ],
  mitigationActions: [
    { id: 'mit-04-01', criterionId: 'c01', description: 'Commission third-party deforestation assessment for Kalimantan rubber zone', status: 'pending', dueDate: '2024-12-01' },
    { id: 'mit-04-02', criterionId: 'c02', description: 'Apply country-level risk premium to all Indonesian rubber lots', status: 'in_progress', dueDate: '2024-11-01' },
    { id: 'mit-04-03', criterionId: 'c03', description: 'Obtain certified land use history from Indonesian forestry ministry', status: 'pending', dueDate: '2025-01-15' },
    { id: 'mit-04-04', criterionId: 'c08', description: 'Engage AMAN (indigenous peoples organization) for community consultation', status: 'pending', dueDate: '2025-02-01' },
  ],
}
