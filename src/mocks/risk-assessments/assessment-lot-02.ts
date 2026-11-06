import type { RiskAssessment } from '../../types/risk'

export const assessmentLot02: RiskAssessment = {
  lotId: 'lot-palm-01',
  overallScore: 94,
  level: 'red',
  assessedAt: '2024-11-11T08:00:00Z',
  criteria: [
    { id: 'c01', label: 'Deforestation in adjacent areas', description: 'Evidence of deforestation within 5 km of lot boundary', score: 10, weight: 0.20 },
    { id: 'c02', label: 'Country-level deforestation risk', description: 'National deforestation risk rating from EU country benchmark', score: 9, weight: 0.18 },
    { id: 'c03', label: 'Land use change after 2020-12-31', description: 'Satellite-detected land use change post cut-off date', score: 9, weight: 0.15 },
    { id: 'c04', label: 'Supplier compliance history', description: 'Track record of past compliance with EUDR-related requirements', score: 8, weight: 0.12 },
    { id: 'c05', label: 'Availability of geolocation data', description: 'Quality and completeness of provided GeoJSON coordinates', score: 6, weight: 0.08 },
    { id: 'c06', label: 'Forest coverage at lot location', description: 'Percentage of forested area within lot boundaries', score: 9, weight: 0.08 },
    { id: 'c07', label: 'Protected area proximity', description: 'Distance to nearest IUCN-designated protected area', score: 8, weight: 0.07 },
    { id: 'c08', label: 'Indigenous land overlap', description: 'Overlap with officially recognized indigenous territories', score: 7, weight: 0.05 },
  ],
  mitigationActions: [
    { id: 'mit-02-01', criterionId: 'c01', description: 'Immediate satellite deforestation audit for Borneo concession area', status: 'in_progress', dueDate: '2024-12-01' },
    { id: 'mit-02-02', criterionId: 'c02', description: 'Engage Indonesian government liaison for country risk dialogue', status: 'pending', dueDate: '2025-01-15' },
    { id: 'mit-02-03', criterionId: 'c03', description: 'Commission independent post-2020 land use change report', status: 'pending', dueDate: '2024-12-15' },
    { id: 'mit-02-04', criterionId: 'c04', description: 'Develop supplier improvement plan with quarterly review schedule', status: 'pending', dueDate: '2024-12-01' },
    { id: 'mit-02-05', criterionId: 'c06', description: 'Deploy drone survey to document remaining forest canopy', status: 'in_progress', dueDate: '2024-11-30' },
    { id: 'mit-02-06', criterionId: 'c07', description: 'Legal review of concession boundaries vs protected area maps', status: 'pending', dueDate: '2024-12-31' },
    { id: 'mit-02-07', criterionId: 'c08', description: 'Conduct FPIC (Free Prior Informed Consent) process with local communities', status: 'pending', dueDate: '2025-02-01' },
  ],
}
