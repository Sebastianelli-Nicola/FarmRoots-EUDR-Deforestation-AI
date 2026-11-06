import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, LinearProgress, Table, TableHead, TableBody, TableRow, TableCell,
  Alert, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BlockIcon from '@mui/icons-material/Block'
import LinkIcon from '@mui/icons-material/Link'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ForestOutlinedIcon from '@mui/icons-material/ForestOutlined'
import { useSupplierStore } from '../../stores/supplierStore'
import { useLotStore } from '../../stores/lotStore'
import type { Lot } from '../../types/lot'
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDfFree(lot: Lot): boolean {
  return Boolean(lot.deforestationFreeProof) && !lot.deforestationDetected
}

// ─── DF-free status chip ──────────────────────────────────────────────────────

function DfChip({ lot }: { lot: Lot }) {
  if (lot.deforestationDetected) {
    return (
      <Chip icon={<BlockIcon />} label="Deforestazione rilevata"
        color="error" size="small" variant="outlined" />
    )
  }
  if (!lot.deforestationFreeProof) {
    return (
      <Chip icon={<WarningAmberIcon />} label="Prova mancante"
        color="warning" size="small" variant="outlined" />
    )
  }
  return (
    <Chip icon={<CheckCircleOutlineIcon />} label="Conforme"
      color="success" size="small" variant="outlined" />
  )
}

// ─── Blockchain status chip ───────────────────────────────────────────────────

function BlockchainChip({ lot }: { lot: Lot }) {
  if (!lot.blockchainTxHash) {
    return <Chip label="In attesa" size="small" variant="outlined" />
  }
  const short = `${lot.blockchainTxHash.slice(0, 6)}…${lot.blockchainTxHash.slice(-4)}`
  if (lot.blockedAt) {
    return <Chip icon={<BlockIcon />} label={`Bloccato ${short}`} color="error" size="small" />
  }
  return <Chip icon={<LinkIcon />} label={`Cert. ${short}`} color="success" size="small" />
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, color = 'text.primary' }: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <Box sx={{
      px: 2, py: 1, borderRadius: 2, bgcolor: 'background.default',
      border: '1px solid #e5e7eb', textAlign: 'center', minWidth: 96,
    }}>
      <Typography variant="h6" fontWeight={700} sx={{ color }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  )
}

// ─── Mock segmentation data per lot ──────────────────────────────────────────

interface SegmentationData {
  forestBefore: number   // % copertura forestale prima
  forestAfter: number    // % copertura forestale dopo
  deforestedHa: number
  analysisDate: string
  model: string
}

function mockSegmentation(lot: Lot): SegmentationData {
  // deterministic from lot id hash so values are stable
  const seed = lot.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const forestBefore = 60 + (seed % 35)
  const delta = lot.deforestationDetected ? 15 + (seed % 20) : 2 + (seed % 6)
  return {
    forestBefore,
    forestAfter: Math.max(forestBefore - delta, 5),
    deforestedHa: parseFloat((lot.geolocation.hectares * (delta / 100) * 3.2).toFixed(1)),
    analysisDate: '2024-11-15',
    model: 'ForestScan AI v2.1 (Sentinel-2)',
  }
}

// ─── Segmentation image with fallback ────────────────────────────────────────

function SegImage({ src, alt, borderColor, bgColor, placeholderLabel, iconColor }: {
  src: string
  alt: string
  borderColor: string
  bgColor: string
  placeholderLabel: string
  iconColor: string
}) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <Box
        component="img"
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        sx={{
          width: '100%', height: 220, objectFit: 'cover',
          borderRadius: 2, border: '1px solid #e5e7eb', display: 'block',
        }}
      />
    )
  }
  return (
    <Box sx={{
      width: '100%', height: 220, borderRadius: 2,
      border: `2px dashed ${borderColor}`, bgcolor: bgColor,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 1,
    }}>
      <ForestOutlinedIcon sx={{ fontSize: 48, color: iconColor }} />
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {placeholderLabel}<br />
        <em>({src.replace('/images/', 'carica in /public/images/')})</em>
      </Typography>
    </Box>
  )
}

// ─── Real segmentation data for lot-wood-04 ──────────────────────────────────

const WOOD04_STATS = {
  forestT1:       100.00,
  forestT2:       54.06,
  deforestation:  45.94,
  deforestPx:     30106,
  reforestation:  0.00,
  reforestPx:     0,
  netChange:      -45.94,
  analysisDate:   '2024-11-15',
  model:          'ForestScan AI v2.1 (Sentinel-2)',
}

// ─── Segmentation dialog ──────────────────────────────────────────────────────

function SegmentationDialog({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  const hasIssue = lot.deforestationDetected
  const isWood04 = lot.id === 'lot-wood-04'

  const seg = isWood04 ? null : mockSegmentation(lot)

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ForestOutlinedIcon color={hasIssue ? 'error' : 'success'} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Analisi di segmentazione satellitare
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Lotto {lot.id} · {COMMODITY_IT[lot.commodity]} · {lot.geolocation.hectares} ha
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* ── Images ── */}
        {isWood04 ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                T1 — Segmentata prima
              </Typography>
              <SegImage
                src="/images/segmentata_prima.png"
                alt="Segmentazione prima"
                borderColor="#16a34a" bgColor="#f0fdf4" iconColor="#16a34a"
                placeholderLabel="Segmentata prima"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                T2 — Segmentata dopo
              </Typography>
              <SegImage
                src="/images/segmentata_dopo.jpeg"
                alt="Segmentazione dopo"
                borderColor="#dc2626" bgColor="#fef2f2" iconColor="#dc2626"
                placeholderLabel="Segmentata dopo"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Intersezione T1 / T2
              </Typography>
              <SegImage
                src="/images/intersezione.png"
                alt="Intersezione"
                borderColor="#d97706" bgColor="#fef9f0" iconColor="#d97706"
                placeholderLabel="Mappa intersezione"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Prima — Dicembre 2020
              </Typography>
              <SegImage
                src="/images/segmentation-before.jpg"
                alt="Segmentazione prima"
                borderColor="#16a34a" bgColor="#f0fdf4" iconColor="#16a34a"
                placeholderLabel="Immagine pre-deforestazione"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Dopo — Novembre 2024
              </Typography>
              <SegImage
                src="/images/segmentation-after.jpg"
                alt="Segmentazione dopo"
                borderColor={hasIssue ? '#dc2626' : '#d97706'}
                bgColor={hasIssue ? '#fef2f2' : '#fef9f0'}
                iconColor={hasIssue ? '#dc2626' : '#d97706'}
                placeholderLabel="Immagine post-deforestazione"
              />
            </Grid>
          </Grid>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ── Stats ── */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Metriche di segmentazione
        </Typography>

        {isWood04 ? (
          <Grid container spacing={1.5}>
            {[
              { label: 'Foresta T1',     value: `${WOOD04_STATS.forestT1.toFixed(2)}%`,      color: '#16a34a' },
              { label: 'Foresta T2',     value: `${WOOD04_STATS.forestT2.toFixed(2)}%`,      color: '#dc2626' },
              { label: 'Deforestazione', value: `${WOOD04_STATS.deforestation.toFixed(2)}%`, color: '#dc2626',
                sub: `${WOOD04_STATS.deforestPx.toLocaleString('it-IT')} px` },
            ].map((s) => (
              <Grid size={{ xs: 6, sm: 4 }} key={s.label}>
                <Box sx={{
                  p: 1.5, borderRadius: 2, bgcolor: 'background.default',
                  border: '1px solid #e5e7eb', textAlign: 'center',
                }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>
                    {s.value}
                  </Typography>
                  {'sub' in s && (
                    <Typography variant="caption" sx={{ color: s.color, display: 'block', lineHeight: 1.2 }}>
                      {s.sub}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={1.5}>
            {(() => {
              const s = seg!
              const delta = s.forestBefore - s.forestAfter
              return [
                { label: 'Copertura forestale T1', value: `${s.forestBefore}%`,   color: '#16a34a' },
                { label: 'Copertura forestale T2', value: `${s.forestAfter}%`,     color: hasIssue ? '#dc2626' : '#d97706' },
                { label: 'Variazione',             value: `-${delta.toFixed(1)}%`, color: delta > 10 ? '#dc2626' : '#d97706' },
                { label: 'Superficie deforestata', value: `${s.deforestedHa} ha`,  color: hasIssue ? '#dc2626' : 'text.primary' },
              ].map((item) => (
                <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
                  <Box sx={{
                    p: 1.5, borderRadius: 2, bgcolor: 'background.default',
                    border: '1px solid #e5e7eb', textAlign: 'center',
                  }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: item.color }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  </Box>
                </Grid>
              ))
            })()}
          </Grid>
        )}

        {/* ── Legend ── */}
        <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {[
            { color: '#16a34a', label: 'Foresta intatta (copertura arborea stabile)' },
            { color: '#dc2626', label: 'Area deforestata (perdita di copertura arborea)' },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: item.color, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {hasIssue && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Deforestazione confermata dall'analisi satellitare — variazione superiore alla soglia EUDR.
            Il lotto è stato segnalato per revisione obbligatoria.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Suppliers page ───────────────────────────────────────────────────────────

export default function Suppliers() {
  const suppliers = useSupplierStore((s) => s.suppliers)
  const lots      = useLotStore((s) => s.lots)
  const [expanded, setExpanded] = useState<string | false>(false)
  const [segLotId, setSegLotId] = useState<string | null>(null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <Box>
        <Typography variant="h6" fontWeight={700}>Fornitori</Typography>
        <Typography variant="body2" color="text.secondary">
          {suppliers.length} fornitori monitorati · {lots.length} lotti totali
        </Typography>
      </Box>

      {suppliers.map((supplier) => {
        const supplierLots = lots.filter((l) => l.supplierId === supplier.id)
        const dfFreeLots   = supplierLots.filter(isDfFree)
        const nonCompliant = supplierLots.filter((l) => !isDfFree(l))
        const blockedLots  = supplierLots.filter((l) => l.blockchainTxHash && l.blockedAt)
        const isOpen       = expanded === supplier.id

        return (
          <Accordion
            key={supplier.id}
            expanded={isOpen}
            onChange={(_e, isExp) => setExpanded(isExp ? supplier.id : false)}
            sx={{
              border: '1px solid',
              borderColor: supplier.suspended ? 'error.light' : '#e5e7eb',
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              boxShadow: 'none',
            }}
          >
            {/* ── Summary bar ── */}
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5, minHeight: 72 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 1, flexWrap: 'wrap' }}>

                {/* Icon */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                  bgcolor: supplier.suspended ? '#fee2e2' : '#f0fdf4',
                }}>
                  <BusinessOutlinedIcon
                    fontSize="small"
                    sx={{ color: supplier.suspended ? 'error.main' : 'success.main' }}
                  />
                </Box>

                {/* Name + commodities */}
                <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {supplier.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {supplier.country} · {supplier.commodities.map((c) => COMMODITY_IT[c]).join(', ')}
                  </Typography>
                </Box>

                {/* Compliance bar */}
                <Box sx={{ flex: '1 1 160px', minWidth: 120 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Conformità</Typography>
                    <Typography variant="caption" fontWeight={600}>{supplier.complianceScore}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={supplier.complianceScore}
                    color={supplier.complianceScore >= 66 ? 'success' : supplier.complianceScore >= 33 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                {/* Badges */}
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  <RiskBadge level={supplier.countryRiskLevel} />
                  <Chip
                    label={supplier.suspended ? 'Sospeso' : 'Attivo'}
                    color={supplier.suspended ? 'error' : 'success'}
                    size="small"
                  />
                </Box>
              </Box>
            </AccordionSummary>

            {/* ── Details ── */}
            <AccordionDetails sx={{ px: 2.5, pb: 3, pt: 0 }}>

              {supplier.suspended && supplier.suspendedAt && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Fornitore sospeso il {format(parseISO(supplier.suspendedAt), 'dd/MM/yyyy')} —
                  tutti i lotti attivi sono bloccati in attesa di revisione.
                </Alert>
              )}

              {/* Stats row */}
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                <Grid size="auto">
                  <StatPill label="Lotti totali" value={supplierLots.length} />
                </Grid>
                <Grid size="auto">
                  <StatPill
                    label="DF-free"
                    value={dfFreeLots.length}
                    color={dfFreeLots.length === supplierLots.length ? '#16a34a' : '#d97706'}
                  />
                </Grid>
                <Grid size="auto">
                  <StatPill
                    label="Non conformi"
                    value={nonCompliant.length}
                    color={nonCompliant.length > 0 ? '#dc2626' : '#16a34a'}
                  />
                </Grid>
                <Grid size="auto">
                  <StatPill
                    label="Bloccati"
                    value={blockedLots.length}
                    color={blockedLots.length > 0 ? '#dc2626' : 'text.primary'}
                  />
                </Grid>
              </Grid>

              {/* Lots table */}
              {supplierLots.length === 0 ? (
                <Typography variant="body2" color="text.disabled">Nessun lotto associato.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f9fafb' } }}>
                      <TableCell>ID Lotto</TableCell>
                      <TableCell>Commodity</TableCell>
                      <TableCell>Raccolta</TableCell>
                      <TableCell align="right">Quantità</TableCell>
                      <TableCell align="right">Superficie</TableCell>
                      <TableCell>Rischio</TableCell>
                      <TableCell>Stato DF-free</TableCell>
                      <TableCell>Blockchain</TableCell>
                      <TableCell align="center">Dettagli</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supplierLots.map((lot) => {
                      const compliant = isDfFree(lot)
                      return (
                        <TableRow
                          key={lot.id}
                          hover
                          sx={{ bgcolor: compliant ? 'inherit' : '#fef9f0' }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}
                              sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {lot.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{COMMODITY_IT[lot.commodity]}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(parseISO(lot.harvestDate), 'dd/MM/yyyy')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {lot.quantity.toLocaleString('it-IT')} kg
                            </Typography>
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
                            <DfChip lot={lot} />
                          </TableCell>
                          <TableCell>
                            <BlockchainChip lot={lot} />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setSegLotId(lot.id) }}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                              title="Analisi di segmentazione"
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </AccordionDetails>
          </Accordion>
        )
      })}

      {/* Segmentation dialog */}
      {segLotId && (() => {
        const lot = lots.find((l) => l.id === segLotId)
        return lot ? <SegmentationDialog lot={lot} onClose={() => setSegLotId(null)} /> : null
      })()}
    </Box>
  )
}
