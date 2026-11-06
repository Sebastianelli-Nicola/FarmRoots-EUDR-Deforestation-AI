import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  PieChart, Pie, Cell,
  Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import {
  Grid, Card, CardContent, Typography, Box, Stack,
  Table, TableHead, TableBody, TableRow, TableCell,
  LinearProgress, Chip, List, ListItem, ListItemIcon,
  ListItemText, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Divider,
} from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BlockIcon from '@mui/icons-material/Block'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import { useLotStore } from '../../stores/lotStore'
import { useSupplierStore } from '../../stores/supplierStore'
import { mockReports } from '../../mocks'
import type { Lot } from '../../types/lot'
import type { Supplier } from '../../types/supplier'
import RiskBadge from '../../components/ui/RiskBadge'
import LotMap from '../../components/map/LotMap'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS: Record<string, string> = {
  'Basso rischio': '#16a34a',
  'Medio rischio': '#d97706',
  'Alto rischio':  '#dc2626',
}

const COMMODITY_IT: Record<string, string> = {
  wood:     'Legno',
  cattle:   'Bestiame',
  soy:      'Soia',
  cocoa:    'Cacao',
  coffee:   'Caffè',
  palm_oil: 'Olio di palma',
  rubber:   'Gomma',
}

function nonComplianceLabel(lot: Lot): string {
  return lot.deforestationDetected ? 'Deforestazione rilevata' : 'Prova mancante'
}

function nonComplianceColor(lot: Lot): 'error' | 'warning' {
  return lot.deforestationDetected ? 'error' : 'warning'
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

type Accent = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'

interface KpiCardProps {
  title: string
  value: number | string
  subtitle?: string
  accent: Accent
}

const accentColor: Record<Accent, string> = {
  success:   '#16a34a',
  warning:   '#d97706',
  error:     '#dc2626',
  info:      '#0284c7',
  primary:   '#059669',
  secondary: '#6366f1',
}

function KpiCard({ title, value, subtitle, accent }: KpiCardProps) {
  return (
    <Card sx={{ borderLeft: `4px solid ${accentColor[accent]}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="caption" fontWeight={600} textTransform="uppercase"
          letterSpacing={0.8} color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, color: accentColor[accent] }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Compliance KPI Card (DF-free lots — risk is secondary info) ──────────────

function ComplianceKpiCard({ title, value, accent, subtitle }: KpiCardProps) {
  const color = accentColor[accent]
  return (
    <Card sx={{
      background: 'linear-gradient(145deg, rgba(5,150,105,0.06) 0%, transparent 65%)',
      border: '1px solid rgba(5,150,105,0.2)',
      borderLeft: `4px solid ${color}`,
      position: 'relative',
    }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
          <Typography variant="caption" fontWeight={700} textTransform="uppercase"
            letterSpacing={0.8} color="text.secondary">
            {title}
          </Typography>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.4,
            px: 0.75, py: 0.2, borderRadius: 99,
            bgcolor: 'rgba(5,150,105,0.1)',
            border: '1px solid rgba(5,150,105,0.25)',
          }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 9, color: '#059669' }} />
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#059669', lineHeight: 1 }}>
              DF-free
            </Typography>
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.25, color, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Alert severity dot ───────────────────────────────────────────────────────

const severityColor: Record<'critical' | 'warning' | 'info', string> = {
  critical: '#dc2626',
  warning:  '#d97706',
  info:     '#0284c7',
}

// ─── Lot detail dialog ────────────────────────────────────────────────────────

function LotDetailDialog({ lot, suppliers, onClose }: {
  lot: Lot
  suppliers: Supplier[]
  onClose: () => void
}) {
  const supplier = suppliers.find((s) => s.id === lot.supplierId)
  const isDetected = lot.deforestationDetected
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isDetected
          ? <BlockIcon color="error" fontSize="small" />
          : <WarningAmberIcon color="warning" fontSize="small" />}
        {lot.id} — {nonComplianceLabel(lot)}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Alert severity={isDetected ? 'error' : 'warning'} variant="outlined" sx={{ py: 0.5 }}>
            {isDetected
              ? 'Il monitoraggio satellitare ha rilevato deforestazione in questo lotto. Il lotto è escluso dalla valutazione del rischio.'
              : 'Nessun documento comprovante l\'assenza di deforestazione è stato fornito. Il lotto è escluso dalla valutazione del rischio.'}
          </Alert>
          <Divider />
          {([
            ['Commodity',       COMMODITY_IT[lot.commodity]],
            ['Fornitore',       supplier?.name ?? lot.supplierId],
            ['Paese fornitore', supplier?.country ?? '—'],
            ['Data raccolta',   format(parseISO(lot.harvestDate), 'dd/MM/yyyy')],
            ['Quantità',        `${lot.quantity.toLocaleString('it-IT')} kg`],
            ['Superficie',      `${lot.geolocation.hectares} ha`],
            ['Creato il',       format(parseISO(lot.createdAt), 'dd/MM/yyyy')],
            ['Prova DF-free',   lot.deforestationFreeProof ?? 'Non disponibile'],
          ] as [string, string][]).map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}
                sx={{ wordBreak: 'break-all', color: label === 'Prova DF-free' && !lot.deforestationFreeProof ? 'error.main' : 'inherit' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const lots      = useLotStore((s) => s.lots)
  const suppliers = useSupplierStore((s) => s.suppliers)
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)

  // Deforestation-free compliance split
  const nonCompliantLots = lots.filter((l) => !l.deforestationFreeProof || l.deforestationDetected)
  const dfFreeLots       = lots.filter((l) => l.deforestationFreeProof && !l.deforestationDetected)

  // Risk computed only on DF-free lots
  const lowRiskLots    = dfFreeLots.filter((l) => l.riskLevel === 'green')
  const medRiskLots    = dfFreeLots.filter((l) => l.riskLevel === 'amber')
  const highRiskLots   = dfFreeLots.filter((l) => l.riskLevel === 'red')
  const blockedLots    = lots.filter((l) => l.riskLevel === 'red' && l.blockchainTxHash)

  const suspendedSuppliers = suppliers.filter((s) => s.suspended)
  const pendingReports     = mockReports.filter((r) => r.status !== 'submitted')

  const chartData = [
    { name: 'Basso rischio', value: lowRiskLots.length },
    { name: 'Medio rischio', value: medRiskLots.length },
    { name: 'Alto rischio',  value: highRiskLots.length },
  ]

  const selectedLot = selectedLotId ? lots.find((l) => l.id === selectedLotId) ?? null : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 4, xl: 2 }}>
          <KpiCard title="Lotti totali" value={lots.length} subtitle={`${nonCompliantLots.length} non conformi`} accent="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 4, xl: 2 }}>
          <ComplianceKpiCard title="Basso rischio" value={lowRiskLots.length} subtitle="lotti conformi" accent="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 4, xl: 2 }}>
          <ComplianceKpiCard title="Medio rischio" value={medRiskLots.length} subtitle="da verificare" accent="warning" />
        </Grid>
        <Grid size={{ xs: 6, md: 4, xl: 2 }}>
          <ComplianceKpiCard title="Alto rischio" value={highRiskLots.length} subtitle={`${blockedLots.length} bloccati`} accent="error" />
        </Grid>
        <Grid size={{ xs: 6, md: 4, xl: 2 }}>
          <KpiCard title="Fornitori" value={suppliers.length} subtitle={`${suspendedSuppliers.length} sospesi`} accent="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 4, xl: 2 }}>
          <KpiCard title="DD in sospeso" value={pendingReports.length} subtitle="da completare" accent="secondary" />
        </Grid>
      </Grid>

      {/* ── Deforestation-Free Compliance ── */}
      {nonCompliantLots.length > 0 && (
        <Card sx={{ borderLeft: '4px solid #dc2626' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600} color="error.main">
                Deforestation Free — Lotti Non Conformi ({nonCompliantLots.length})
              </Typography>
            </Box>
            <Alert severity="error" variant="outlined" sx={{ mb: 1.5, py: 0.5 }}>
              I seguenti lotti sono esclusi dalla valutazione del rischio. Sono richiesti interventi correttivi per il rispetto del regolamento EUDR.
            </Alert>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID Lotto</TableCell>
                  <TableCell>Commodity</TableCell>
                  <TableCell>Fornitore</TableCell>
                  <TableCell>Raccolto</TableCell>
                  <TableCell>Non conformità</TableCell>
                  <TableCell align="center">Dettagli</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nonCompliantLots.map((lot) => {
                  const supplier = suppliers.find((s) => s.id === lot.supplierId)
                  return (
                    <TableRow key={lot.id} hover sx={{ bgcolor: '#fef2f2' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{lot.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{COMMODITY_IT[lot.commodity]}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{supplier?.name ?? lot.supplierId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{format(parseISO(lot.harvestDate), 'dd/MM/yyyy')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={lot.deforestationDetected ? <BlockIcon /> : <WarningAmberIcon />}
                          label={nonComplianceLabel(lot)}
                          color={nonComplianceColor(lot)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => setSelectedLotId(lot.id)}>
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Chart + Alerts ── */}
      <Grid container spacing={3}>

        {/* Donut chart — risk only on DF-free lots */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Distribuzione del Rischio
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Calcolato su {dfFreeLots.length} lotti DF-free
                {nonCompliantLots.length > 0 && ` · ${nonCompliantLots.length} non conformi esclusi`}
              </Typography>

              {/* Donut */}
              <Box sx={{ position: 'relative', flex: 1, minHeight: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={78} outerRadius={118}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={CHART_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [`${value} lotti`, '']}
                      contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center label */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.03em', color: '#059669' }}>
                      {dfFreeLots.length}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      lotti conformi
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Custom legend */}
              <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 1.5 }}>
                {chartData.map((entry) => (
                  <Stack key={entry.name} direction="row" alignItems="center" spacing={0.6}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: CHART_COLORS[entry.name], flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {entry.name} <strong style={{ color: '#0f172a' }}>({entry.value})</strong>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts panel */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Avvisi e Notifiche
              </Typography>

              {blockedLots.length === 0 && suspendedSuppliers.length === 0 && pendingReports.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">Nessun avviso attivo</Typography>
                </Box>
              ) : (
                <List dense disablePadding sx={{ flex: 1 }}>
                  {blockedLots.map((lot) => (
                    <ListItem key={lot.id} disablePadding sx={{ py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 10, color: severityColor.critical }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Lotto bloccato: ${lot.id}`}
                        secondary={`${COMMODITY_IT[lot.commodity]} — bloccato il ${lot.blockedAt ? format(parseISO(lot.blockedAt), 'dd/MM/yyyy') : '—'}`}
                        slotProps={{ primary: { variant: 'body2', fontWeight: 500 }, secondary: { variant: 'caption' } }}
                      />
                    </ListItem>
                  ))}

                  {suspendedSuppliers.map((sup) => (
                    <ListItem key={sup.id} disablePadding sx={{ py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 10, color: severityColor.warning }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Fornitore sospeso: ${sup.name}`}
                        secondary={`${sup.country} — sospeso il ${sup.suspendedAt ? format(parseISO(sup.suspendedAt), 'dd/MM/yyyy') : '—'}`}
                        slotProps={{ primary: { variant: 'body2', fontWeight: 500 }, secondary: { variant: 'caption' } }}
                      />
                    </ListItem>
                  ))}

                  {pendingReports.map((rep) => {
                    const supplier = suppliers.find((s) => s.id === rep.supplierId)
                    return (
                      <ListItem key={rep.id} disablePadding sx={{ py: 0.75 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 10, color: severityColor.info }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`DD ${rep.year}: ${supplier?.name ?? rep.supplierId}`}
                          secondary={`Stato: ${rep.status === 'draft' ? 'Bozza' : 'Firmato'} — ${rep.lots.length} lotti`}
                          slotProps={{ primary: { variant: 'body2', fontWeight: 500 }, secondary: { variant: 'caption' } }}
                        />
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Supplier summary table ── */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Riepilogo Fornitori
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fornitore</TableCell>
                <TableCell>Paese</TableCell>
                <TableCell>Rischio Paese</TableCell>
                <TableCell>Conformità</TableCell>
                <TableCell>Stato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{s.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{s.country}</Typography>
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={s.countryRiskLevel} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={s.complianceScore}
                        color={s.complianceScore >= 66 ? 'success' : s.complianceScore >= 33 ? 'warning' : 'error'}
                        sx={{ flex: 1, height: 6, borderRadius: 3, minWidth: 80 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                        {s.complianceScore}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.suspended ? 'Sospeso' : 'Attivo'}
                      color={s.suspended ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Map overview ── */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Mappa dei Lotti
          </Typography>
          <LotMap lots={lots} height={420} />
        </CardContent>
      </Card>

      {/* ── Lot detail dialog ── */}
      {selectedLot && (
        <LotDetailDialog
          lot={selectedLot}
          suppliers={suppliers}
          onClose={() => setSelectedLotId(null)}
        />
      )}

    </Box>
  )
}
