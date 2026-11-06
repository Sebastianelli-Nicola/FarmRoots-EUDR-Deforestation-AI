import type { RiskAssessment } from '../../types/risk'

export const assessmentLot03: RiskAssessment = {
  lotId: 'lot-soy-01',
  overallScore: 55,
  level: 'amber',
  assessedAt: '2024-04-26T11:00:00Z',
  criteria: [
    { id: 'c01', label: 'Deforestation in adjacent areas', description: 'Evidence of deforestation within 5 km of lot boundary', score: 6, weight: 0.20 },
    { id: 'c02', label: 'Country-level deforestation risk', description: 'National deforestation risk rating from EU country benchmark', score: 7, weight: 0.18 },
    { id: 'c03', label: 'Land use change after 2020-12-31', description: 'Satellite-detected land use change post cut-off date', score: 5, weight: 0.15 },
    { id: 'c04', label: 'Supplier compliance history', description: 'Track record of past compliance with EUDR-related requirements', score: 4, weight: 0.12 },
    { id: 'c05', label: 'Availability of geolocation data', description: 'Quality and completeness of provided GeoJSON coordinates', score: 3, weight: 0.08 },
    { id: 'c06', label: 'Forest coverage at lot location', description: 'Percentage of forested area within lot boundaries', score: 5, weight: 0.08 },
    { id: 'c07', label: 'Protected area proximity', description: 'Distance to nearest IUCN-designated protected area', score: 4, weight: 0.07 },
    { id: 'c08', label: 'Indigenous land overlap', description: 'Overlap with officially recognized indigenous territories', score: 3, weight: 0.05 },
  ],
  mitigationActions: [
    { id: 'mit-03-01', criterionId: 'c01', description: 'Request updated deforestation alert report for Mato Grosso region', status: 'done', dueDate: '2024-06-01' },
    { id: 'mit-03-02', criterionId: 'c02', description: 'Apply enhanced due diligence protocol for Brazil-origin soy', status: 'in_progress', dueDate: '2024-07-01' },
  ],
}
