import type { RiskAssessment } from '../../types/risk'

export const assessmentLot01: RiskAssessment = {
  lotId: 'lot-cocoa-01',
  overallScore: 78,
  level: 'red',
  assessedAt: '2024-07-21T10:00:00Z',
  criteria: [
    { id: 'c01', label: 'Deforestation in adjacent areas', description: 'Evidence of deforestation within 5 km of lot boundary', score: 9, weight: 0.20 },
    { id: 'c02', label: 'Country-level deforestation risk', description: 'National deforestation risk rating from EU country benchmark', score: 7, weight: 0.18 },
    { id: 'c03', label: 'Land use change after 2020-12-31', description: 'Satellite-detected land use change post cut-off date', score: 8, weight: 0.15 },
    { id: 'c04', label: 'Supplier compliance history', description: 'Track record of past compliance with EUDR-related requirements', score: 6, weight: 0.12 },
    { id: 'c05', label: 'Availability of geolocation data', description: 'Quality and completeness of provided GeoJSON coordinates', score: 5, weight: 0.08 },
    { id: 'c06', label: 'Forest coverage at lot location', description: 'Percentage of forested area within lot boundaries', score: 8, weight: 0.08 },
    { id: 'c07', label: 'Protected area proximity', description: 'Distance to nearest IUCN-designated protected area', score: 7, weight: 0.07 },
    { id: 'c08', label: 'Indigenous land overlap', description: 'Overlap with officially recognized indigenous territories', score: 4, weight: 0.05 },
  ],
  mitigationActions: [
    { id: 'mit-01-01', criterionId: 'c01', description: 'Commissionate satellite monitoring report for adjacent area deforestation', status: 'in_progress', dueDate: '2024-09-01' },
    { id: 'mit-01-02', criterionId: 'c03', description: 'Request independent land use audit from accredited body', status: 'pending', dueDate: '2024-10-01' },
    { id: 'mit-01-03', criterionId: 'c06', description: 'Conduct on-site forest coverage verification survey', status: 'pending', dueDate: '2024-10-15' },
    { id: 'mit-01-04', criterionId: 'c07', description: 'Engage legal counsel to assess protected area proximity compliance', status: 'pending', dueDate: '2024-11-01' },
  ],
}
