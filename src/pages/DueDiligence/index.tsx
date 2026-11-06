import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Card, CardContent, CardActions, Chip, Button, Divider,
  Stepper, Step, StepLabel, Grid, Table, TableHead,
  TableBody, TableRow, TableCell, Alert,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GavelIcon from '@mui/icons-material/Gavel'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { mockReports } from '../../mocks'
import { useLotStore } from '../../stores/lotStore'
import { useSupplierStore } from '../../stores/supplierStore'
import type { DueDiligenceReport } from '../../types/dueDiligence'
import type { Lot } from '../../types/lot'
import type { Supplier } from '../../types/supplier'
import RiskBadge from '../../components/ui/RiskBadge'

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMODITY_IT: Record<string, string> = {
  wood:     'Legno',
  cattle:   'Bestiame',
  soy:      'Soia',
  cocoa:    'Cacao',
  coffee:   'Caffè',
  palm_oil: 'Olio di palma',
  rubber:   'Gomma',
}

const STATUS_LABEL: Record<DueDiligenceReport['status'], string> = {
  draft:     'Bozza',
  signed:    'Firmata',
  submitted: 'Inviata',
}

const STATUS_COLOR: Record<DueDiligenceReport['status'], 'warning' | 'primary' | 'success'> = {
  draft:     'warning',
  signed:    'primary',
  submitted: 'success',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDfFree(lot: Lot): boolean {
  return Boolean(lot.deforestationFreeProof) && !lot.deforestationDetected
}

function yearStatus(reports: DueDiligenceReport[]): string {
  if (reports.every((r) => r.status === 'submitted')) return 'Completata'
  if (reports.some((r) => r.status === 'draft'))      return 'In preparazione'
  return 'Parzialmente completata'
}

function yearStatusColor(reports: DueDiligenceReport[]): 'success' | 'warning' | 'default' {
  if (reports.every((r) => r.status === 'submitted')) return 'success'
  if (reports.some((r) => r.status === 'draft'))      return 'warning'
  return 'default'
}

// ─── Report timeline stepper ──────────────────────────────────────────────────

function ReportTimeline({ report }: { report: DueDiligenceReport }) {
  const steps = [
    { label: 'Generata',  date: report.generatedAt },
    { label: 'Firmata',   date: report.signedAt },
    { label: 'Inviata',   date: report.submittedAt },
  ]
  const activeStep =
    report.status === 'submitted' ? 3 :
    report.status === 'signed'    ? 2 : 1

  return (
    <Stepper activeStep={activeStep} sx={{ mt: 1, mb: 0.5 }}>
      {steps.map((step) => (
        <Step key={step.label}>
          <StepLabel
            optional={step.date
              ? <Typography variant="caption" color="text.secondary">
                  {format(parseISO(step.date), 'dd/MM/yyyy')}
                </Typography>
              : undefined
            }
          >
            <Typography variant="caption">{step.label}</Typography>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  )
}

// ─── Lot breakdown table inside a report ─────────────────────────────────────

function ReportLotTable({ lotIds, allLots }: { lotIds: string[]; allLots: Lot[] }) {
  const lots = lotIds.map((id) => allLots.find((l) => l.id === id)).filter(Boolean) as Lot[]
  if (lots.length === 0) return null

  return (
    <Table size="small" sx={{ mt: 1 }}>
      <TableHead>
        <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f9fafb' } }}>
          <TableCell>ID Lotto</TableCell>
          <TableCell>Commodity</TableCell>
          <TableCell align="right">Quantità</TableCell>
          <TableCell align="right">Superficie</TableCell>
          <TableCell>Rischio</TableCell>
          <TableCell>DF-free</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lots.map((lot) => {
          const compliant = isDfFree(lot)
          return (
            <TableRow key={lot.id} hover sx={{ bgcolor: compliant ? 'inherit' : '#fef9f0' }}>
              <TableCell>
                <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {lot.id}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{COMMODITY_IT[lot.commodity]}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{lot.quantity.toLocaleString('it-IT')} kg</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{lot.geolocation.hectares} ha</Typography>
              </TableCell>
              <TableCell>
                {compliant
                  ? <RiskBadge level={lot.riskLevel} />
                  : <Typography variant="caption" color="text.disabled">—</Typography>
                }
              </TableCell>
              <TableCell>
                {compliant
                  ? <Chip label="Conforme" color="success" size="small" variant="outlined" />
                  : lot.deforestationDetected
                    ? <Chip label="Deforestazione rilevata" color="error" size="small" variant="outlined" />
                    : <Chip label="Prova mancante" color="warning" size="small" variant="outlined" />
                }
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Single report card ───────────────────────────────────────────────────────

function ReportCard({
  report,
  allLots,
  supplierName,
  supplierCountry,
}: {
  report: DueDiligenceReport
  allLots: Lot[]
  supplierName: string
  supplierCountry: string
}) {
  const [expanded, setExpanded] = useState(false)
  const reportLots = report.lots
    .map((id) => allLots.find((l) => l.id === id))
    .filter(Boolean) as Lot[]
  const nonCompliant = reportLots.filter((l) => !isDfFree(l))
  const commodities  = [...new Set(reportLots.map((l) => COMMODITY_IT[l.commodity]))].join(', ')

  return (
    <Card variant="outlined" sx={{
      borderColor: report.status === 'draft' ? 'warning.light' : report.status === 'signed' ? 'primary.light' : 'success.light',
    }}>
      <CardContent sx={{ pb: 1 }}>

        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>{supplierName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {supplierCountry} · {commodities} · {report.lots.length} lotti
              {nonCompliant.length > 0 && (
                <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                  · {nonCompliant.length} non conformi
                </Box>
              )}
            </Typography>
          </Box>
          <Chip
            label={STATUS_LABEL[report.status]}
            color={STATUS_COLOR[report.status]}
            size="small"
          />
        </Box>

        {/* Non-compliance warning */}
        {nonCompliant.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }}>
            {nonCompliant.length} lott{nonCompliant.length > 1 ? 'i' : 'o'} non conforme alla norma Deforestation Free.
            La dichiarazione non può essere inviata fino alla risoluzione delle non conformità.
          </Alert>
        )}

        {/* Timeline */}
        <ReportTimeline report={report} />

        <Divider sx={{ my: 1.5 }} />

        {/* Expandable detail */}
        <Box
          onClick={() => setExpanded((e) => !e)}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', mb: expanded ? 1.5 : 0 }}
        >
          <Typography variant="caption" fontWeight={600}>
            {expanded ? 'Nascondi dettagli' : 'Mostra dettagli'}
          </Typography>
          <ExpandMoreIcon fontSize="small" sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </Box>

        {expanded && (
          <Box>
            {/* Risk assessment summary */}
            <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.6}>
              Valutazione del rischio
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, mb: 2, color: '#374151', lineHeight: 1.6 }}>
              {report.riskAssessmentSummary}
            </Typography>

            {/* Mitigation summary */}
            <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.6}>
              Misure di mitigazione
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, mb: 2, color: '#374151', lineHeight: 1.6 }}>
              {report.mitigationSummary}
            </Typography>

            {/* Lots table */}
            <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.6}>
              Lotti inclusi
            </Typography>
            <ReportLotTable lotIds={report.lots} allLots={allLots} />
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        {report.status === 'draft' && (
          <Button
            variant="contained"
            size="small"
            startIcon={<GavelIcon />}
            disabled={nonCompliant.length > 0}
          >
            Firma dichiarazione
          </Button>
        )}
        {report.status === 'signed' && (
          <Button variant="contained" size="small" startIcon={<SendIcon />}>
            Invia al sistema EUDR
          </Button>
        )}
        {report.status === 'submitted' && (
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>
            Scarica PDF
          </Button>
        )}
        {report.status === 'draft' && nonCompliant.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
            Risolvi le non conformità per poter firmare
          </Typography>
        )}
      </CardActions>
    </Card>
  )
}

// ─── Year section ─────────────────────────────────────────────────────────────

function YearSection({
  year,
  reports,
  allLots,
  allSuppliers,
  defaultOpen,
}: {
  year: number
  reports: DueDiligenceReport[]
  allLots: Lot[]
  allSuppliers: Supplier[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const totalLots = reports.reduce((sum, r) => sum + r.lots.length, 0)

  return (
    <Accordion
      expanded={open}
      onChange={(_e, isExp) => setOpen(isExp)}
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5, minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 1 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 2, bgcolor: '#f0fdf4', flexShrink: 0,
          }}>
            <DescriptionOutlinedIcon fontSize="small" sx={{ color: 'success.main' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{year}</Typography>
            <Typography variant="caption" color="text.secondary">
              {reports.length} catene di fornitura · {totalLots} lotti totali
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={yearStatus(reports)}
              color={yearStatusColor(reports)}
              size="small"
            />
            {reports.map((r) => (
              <Chip key={r.id} label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2.5, pb: 3, pt: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reports.map((report) => {
            const supplier = allSuppliers.find((s) => s.id === report.supplierId)
            return (
              <ReportCard
                key={report.id}
                report={report}
                allLots={allLots}
                supplierName={supplier?.name ?? report.supplierId}
                supplierCountry={supplier?.country ?? '—'}
              />
            )
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

// ─── Due Diligence page ───────────────────────────────────────────────────────

export default function DueDiligence() {
  const lots      = useLotStore((s) => s.lots)
  const suppliers = useSupplierStore((s) => s.suppliers)

  const currentYear = new Date().getFullYear()

  // Group reports by year, descending
  const reportsByYear = new Map<number, DueDiligenceReport[]>()
  for (const r of mockReports) {
    if (!reportsByYear.has(r.year)) reportsByYear.set(r.year, [])
    reportsByYear.get(r.year)!.push(r)
  }
  const historicalYears = Array.from(reportsByYear.keys()).sort((a, b) => b - a)

  const pendingCount  = mockReports.filter((r) => r.status !== 'submitted').length
  const submittedCount = mockReports.filter((r) => r.status === 'submitted').length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Page header ── */}
      <Box>
        <Typography variant="h6" fontWeight={700}>Due Diligence EUDR</Typography>
        <Typography variant="body2" color="text.secondary">
          Reg. (EU) 2023/1115 · Operatore: Farm Roots S.r.l. ·{' '}
          {submittedCount} dichiarazione{submittedCount !== 1 ? 'i' : ''} inviate{' '}
          {pendingCount > 0 && `· ${pendingCount} in corso`}
        </Typography>
      </Box>

      {/* ── Current year — no DD started ── */}
      {!reportsByYear.has(currentYear) && (
        <Card sx={{ border: '1px dashed #d1d5db', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <DescriptionOutlinedIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Nessuna dichiarazione avviata per il {currentYear}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Ai sensi del Reg. (EU) 2023/1115, ogni operatore deve presentare
              una dichiarazione di due diligence prima di immettere prodotti regolamentati
              sul mercato UE o esportarli.
            </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
              {[
                'Raccolta dei dati di origine (coordinate GeoJSON)',
                'Valutazione del rischio (14 criteri EUDR)',
                'Definizione misure di mitigazione',
                'Firma e invio al sistema informativo CE',
              ].map((step, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {i + 1}.
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      {step}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Button variant="contained" startIcon={<AddIcon />} size="large">
              Prepara dichiarazione {currentYear}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Historical years ── */}
      {historicalYears.map((year, idx) => (
        <YearSection
          key={year}
          year={year}
          reports={reportsByYear.get(year)!}
          allLots={lots}
          allSuppliers={suppliers}
          defaultOpen={idx === 0}
        />
      ))}
    </Box>
  )
}
