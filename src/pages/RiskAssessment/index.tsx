import { useState, useMemo } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete,
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, LinearProgress, MenuItem, Select, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material'
import {
  AddCircleOutline, AssessmentOutlined, BuildOutlined, Cancel, CheckCircle,
  CompareArrowsOutlined, EditOutlined, ExpandMore, QueryStatsOutlined,
  RemoveCircleOutline, TravelExplore, TrendingDown, TrendingFlat, TrendingUp,
} from '@mui/icons-material'
import {
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useLotStore } from '../../stores/lotStore'
import { useSupplierStore } from '../../stores/supplierStore'
import { mockRiskAssessments } from '../../mocks'
import {
  generateAssessmentForLot,
  generateForecasts,
} from '../../services/riskEngine'
import RiskBadge from '../../components/ui/RiskBadge'
import type { Lot } from '../../types/lot'
import type { Supplier } from '../../types/supplier'
import type { RiskAssessment, RiskForecast } from '../../types/risk'

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMODITY_IT: Record<string, string> = {
  wood: 'Legno', cattle: 'Bestiame', soy: 'Soia',
  cocoa: 'Cacao', coffee: 'Caffè', palm_oil: 'Olio di palma', rubber: 'Gomma',
}

const CRITERION_SHORT: Record<string, string> = {
  c01: 'Deforest.', c02: 'Rischio paese', c03: 'Uso suolo',
  c04: 'Compliance', c05: 'Geodati', c06: 'Foreste',
  c07: 'Aree protette', c08: 'Terre indigene',
}

const COMPARE_COLORS = ['#7c3aed', '#d97706', '#0ea5e9']

const isDfFree = (l: Lot) => !!l.deforestationFreeProof && !l.deforestationDetected

// ─── External Lot (coordinate-based prediction) ───────────────────────────────

interface ExternalLot {
  lot: Lot
  supplier: Supplier
  assessment: RiskAssessment
  forecasts: RiskForecast[]
}

const EXTERNAL_SUPPLIER: Supplier = {
  id: '__ext__',
  name: 'Lotto esterno (simulato)',
  country: '—',
  countryRiskLevel: 'amber',
  commodities: [],
  activeLots: 0,
  complianceScore: 50,
  suspended: false,
}

function extCentroid(ring: number[][]): [number, number] {
  const last = ring[ring.length - 1]
  const eff = (last[0] === ring[0][0] && last[1] === ring[0][1]) ? ring.length - 1 : ring.length
  const lon = ring.slice(0, eff).reduce((s, c) => s + c[0], 0) / eff
  const lat = ring.slice(0, eff).reduce((s, c) => s + c[1], 0) / eff
  return [+lon.toFixed(4), +lat.toFixed(4)]
}

function extHectares(ring: number[][]): number {
  // Shoelace formula → deg² → approx ha (1° ≈ 111 km)
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.max(1, Math.round(Math.abs(a) / 2 * 111 * 111 * 100))
}

/** Mock ML prediction: geography + commodity → risk score 0-100 */
function predictRiskScore(lon: number, lat: number, commodity: CommodityType): number {
  // Amazon Arc of Deforestation approximate zones
  const inPara      = lat > -9  && lat < -1  && lon > -56 && lon < -44 // highest risk
  const inRondonia  = lat > -14 && lat < -8  && lon > -66 && lon < -59
  const inMatoGrosso= lat > -17 && lat < -8  && lon > -61 && lon < -49
  const inBrazil    = lat > -34 && lat < 5   && lon > -74 && lon < -34 // general Brazil

  let base = inPara ? 72 : inRondonia ? 64 : inMatoGrosso ? 54 : inBrazil ? 40 : 28

  const commodityMod: Partial<Record<CommodityType, number>> = {
    palm_oil: +14, cattle: +9, wood: +7, soy: +4, cocoa: +2, rubber: 0, coffee: -5,
  }
  base += commodityMod[commodity] ?? 0

  // Deterministic noise: coordinate hash
  const seed = Math.abs((lat * 1000 + lon * 1000) | 0)
  const noise = (seed % 17) - 8

  return Math.round(Math.max(5, Math.min(95, base + noise)))
}

function buildExternalLot(id: string, commodity: CommodityType, ring: number[][]): ExternalLot {
  const [lon, lat] = extCentroid(ring)
  const riskScore = predictRiskScore(lon, lat, commodity)
  const riskLevel = riskScore < 33 ? 'green' : riskScore < 66 ? 'amber' : 'red'

  const lot: Lot = {
    id,
    commodity,
    supplierId: '__ext__',
    quantity: 0,
    harvestDate: new Date().toISOString().slice(0, 10),
    geolocation: { type: 'Polygon', coordinates: [ring], hectares: extHectares(ring) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geoJsonCoordinates: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} } as any,
    deforestationFreeProof: 'simulated',
    riskLevel,
    riskScore,
    createdAt: new Date().toISOString(),
  }

  const assessment = generateAssessmentForLot(lot, EXTERNAL_SUPPLIER)
  return { lot, supplier: EXTERNAL_SUPPLIER, assessment, forecasts: generateForecasts(assessment) }
}

// ─── Polygon Analysis Dialog ──────────────────────────────────────────────────

const ALL_COMMODITIES: { value: CommodityType; label: string }[] = [
  { value: 'wood',     label: 'Legno' },
  { value: 'cattle',   label: 'Bestiame' },
  { value: 'soy',      label: 'Soia' },
  { value: 'cocoa',    label: 'Cacao' },
  { value: 'coffee',   label: 'Caffè' },
  { value: 'palm_oil', label: 'Olio di palma' },
  { value: 'rubber',   label: 'Gomma' },
]

let extCounter = 0

function PolygonAnalysisDialog({
  open,
  onClose,
  onUsePrimary,
  onAddCompare,
}: {
  open: boolean
  onClose: () => void
  onUsePrimary: (ext: ExternalLot) => void
  onAddCompare: (ext: ExternalLot) => void
}) {
  const [label, setLabel] = useState('')
  const [commodity, setCommodity] = useState<CommodityType>('soy')
  const [coordsText, setCoordsText] = useState('')
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<ExternalLot | null>(null)

  const reset = () => {
    setLabel(''); setCommodity('soy'); setCoordsText('')
    setParseError(''); setResult(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleAnalyze = () => {
    setParseError('')
    let ring: number[][]
    try {
      ring = JSON.parse(coordsText.trim())
      if (!Array.isArray(ring) || ring.length < 3) throw new Error('min 3 vertici')
      ring.forEach((p, i) => {
        if (!Array.isArray(p) || p.length < 2 || isNaN(p[0]) || isNaN(p[1]))
          throw new Error(`vertice ${i} non valido`)
        if (p[0] < -180 || p[0] > 180) throw new Error(`longitudine fuori range al vertice ${i}`)
        if (p[1] < -90  || p[1] > 90)  throw new Error(`latitudine fuori range al vertice ${i}`)
      })
    } catch (e) {
      setParseError(`Formato non valido: ${(e as Error).message}`)
      return
    }
    // close the ring if not already closed
    const last = ring[ring.length - 1]
    if (last[0] !== ring[0][0] || last[1] !== ring[0][1]) ring = [...ring, ring[0]]

    extCounter++
    const id = label.trim() || `ext-${extCounter}`
    setResult(buildExternalLot(id, commodity, ring))
  }

  const [clon, clat] = result ? extCentroid(result.lot.geolocation.coordinates[0] as number[][]) : [0, 0]

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <TravelExplore color="primary" />
        <Box>
          <Typography variant="h6" fontWeight={700}>Analisi Predittiva Esterna</Typography>
          <Typography variant="caption" color="text.secondary">
            Inserisci le coordinate di un poligono per stimare il rischio EUDR
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {!result ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption">
                <strong>Formato coordinate:</strong> array JSON di vertici <code>[[lon, lat], ...]</code> — almeno 3 punti, coordinate WGS-84.
                &nbsp;Esempio Mato Grosso: <code>[[-55.2,-12.8],[-55.1,-12.8],[-55.1,-12.7],[-55.2,-12.7]]</code>
              </Typography>
            </Alert>

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Etichetta lotto"
                value={label}
                onChange={e => setLabel(e.target.value)}
                size="small"
                placeholder="es. Lotto Pará 01"
                sx={{ flex: 1 }}
              />
              <Select
                value={commodity}
                onChange={e => setCommodity(e.target.value as CommodityType)}
                size="small"
                sx={{ minWidth: 160 }}
              >
                {ALL_COMMODITIES.map(c => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </Stack>

            <TextField
              label="Coordinate vertici (JSON)"
              value={coordsText}
              onChange={e => setCoordsText(e.target.value)}
              multiline
              rows={5}
              size="small"
              placeholder={'[[-55.2, -12.8],\n [-55.1, -12.8],\n [-55.1, -12.7],\n [-55.2, -12.7]]'}
              error={!!parseError}
              helperText={parseError || 'Array JSON di coppie [longitudine, latitudine]'}
              sx={{ fontFamily: 'monospace' }}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 12 } } }}
            />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning" sx={{ py: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>Stima simulata — modello ML</Typography>
              <Typography variant="caption" display="block">
                In produzione i dati sono verificati su satellite (Sentinel-2, Global Forest Watch) e processati da un modello predittivo calibrato su dati EUDR reali.
              </Typography>
            </Alert>

            <Card variant="outlined" sx={{ borderLeft: '4px solid', borderLeftColor: riskColor(result.assessment.overallScore) }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size="auto">
                    <ScoreGauge score={result.assessment.overallScore} size={80} />
                  </Grid>
                  <Grid size="grow">
                    <Typography variant="subtitle2" fontWeight={700}>{result.lot.id}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <RiskBadge level={result.assessment.level} />
                      <Chip size="small" label={ALL_COMMODITIES.find(c => c.value === result.lot.commodity)?.label} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Centroide: {clat.toFixed(4)}°, {clon.toFixed(4)}° · {result.lot.geolocation.hectares.toLocaleString('it-IT')} ha stimati
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Stack direction="row" spacing={2}>
                      {result.forecasts.map(f => (
                        <Box key={f.horizon} sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">+{f.horizon}gg</Typography>
                          <Box sx={{ mt: 0.25 }}><ScoreGauge score={f.projectedScore} size={44} /></Box>
                          <RiskBadge level={f.projectedLevel} />
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              La previsione utilizza {result.assessment.criteria.length} criteri EUDR ponderati. I criteri ad alto peso (deforestazione adiacente, rischio paese, cambio d'uso del suolo) influenzano maggiormente il punteggio.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">Chiudi</Button>
        {!result ? (
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={!coordsText.trim()}
            startIcon={<TravelExplore />}
          >
            Analizza e Predici
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={reset}>Nuova analisi</Button>
            <Button
              variant="outlined"
              onClick={() => { onAddCompare(result); handleClose() }}
            >
              + Aggiungi al confronto
            </Button>
            <Button
              variant="contained"
              onClick={() => { onUsePrimary(result); handleClose() }}
            >
              Usa come principale
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  )
}

function riskColor(score: number): string {
  if (score < 33) return '#16a34a'
  if (score < 66) return '#d97706'
  return '#dc2626'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 88 }: { score: number; size?: number }) {
  const color = riskColor(score)
  const radius = size / 2 - 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" fontWeight={700} color={color}>{score}</Typography>
      </Box>
    </Box>
  )
}

function DeltaChip({ delta }: { delta: number }) {
  if (delta < -0.5) return <Chip size="small" icon={<TrendingDown />} label={`${delta}`} color="success" />
  if (delta > 0.5) return <Chip size="small" icon={<TrendingUp />} label={`+${delta}`} color="error" />
  return <Chip size="small" icon={<TrendingFlat />} label="stabile" color="default" />
}

function ScoreBar({ score, maxScore = 10 }: { score: number; maxScore?: number }) {
  const pct = (score / maxScore) * 100
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 6, borderRadius: 3,
            bgcolor: '#e5e7eb',
            '& .MuiLinearProgress-bar': { bgcolor: riskColor(pct) },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'right' }}>{score}</Typography>
    </Box>
  )
}

// ─── Criteria Radar Chart ──────────────────────────────────────────────────────

function CriteriaRadar({
  primary,
  compareData,
}: {
  primary: { assessment: RiskAssessment; label: string; color: string }
  compareData: { assessment: RiskAssessment; label: string; color: string }[]
}) {
  const data = primary.assessment.criteria.map(c => {
    const point: Record<string, string | number> = {
      criterion: CRITERION_SHORT[c.id] ?? c.id,
      [primary.label]: c.score,
    }
    compareData.forEach(cd => {
      const match = cd.assessment.criteria.find(cc => cc.id === c.id)
      point[cd.label] = match?.score ?? 0
    })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 10]} tick={false} />
        <Radar name={primary.label} dataKey={primary.label} stroke={primary.color} fill={primary.color} fillOpacity={0.2} />
        {compareData.map(cd => (
          <Radar key={cd.label} name={cd.label} dataKey={cd.label} stroke={cd.color} fill={cd.color} fillOpacity={0.15} />
        ))}
        <RechartsTooltip />
        {compareData.length > 0 && <Legend />}
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ─── Forecast Line Chart ───────────────────────────────────────────────────────

function ForecastChart({
  primary,
  compareData,
}: {
  primary: { label: string; forecasts: RiskForecast[]; color: string; currentScore: number }
  compareData: { label: string; forecasts: RiskForecast[]; color: string; currentScore: number }[]
}) {
  const chartData = [
    { day: 'Oggi', [primary.label]: primary.currentScore, ...Object.fromEntries(compareData.map(c => [c.label, c.currentScore])) },
    ...([30, 60, 90] as const).map(h => {
      const pf = primary.forecasts.find(f => f.horizon === h)
      const point: Record<string, string | number> = { day: `+${h}gg`, [primary.label]: pf?.projectedScore ?? primary.currentScore }
      compareData.forEach(c => {
        const cf = c.forecasts.find(f => f.horizon === h)
        point[c.label] = cf?.projectedScore ?? c.currentScore
      })
      return point
    }),
  ]

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 8, right: 40, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <RechartsTooltip />
        {compareData.length > 0 && <Legend />}
        <ReferenceLine y={33} stroke="#16a34a" strokeDasharray="4 4"
          label={{ value: 'Soglia basso', position: 'right', fill: '#16a34a', fontSize: 10 }} />
        <ReferenceLine y={66} stroke="#d97706" strokeDasharray="4 4"
          label={{ value: 'Soglia alto', position: 'right', fill: '#d97706', fontSize: 10 }} />
        <Line type="monotone" dataKey={primary.label} stroke={primary.color} strokeWidth={2.5} dot={{ r: 5 }} />
        {compareData.map(c => (
          <Line key={c.label} type="monotone" dataKey={c.label} stroke={c.color} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Horizon Forecast Panel ───────────────────────────────────────────────────

function HorizonPanel({ forecast, defaultOpen }: { forecast: RiskForecast; defaultOpen?: boolean }) {
  const scoreDelta = forecast.projectedScore - forecast.currentScore
  const improved = forecast.criteriaProjections.filter(p => p.delta < -0.5).length
  const worsened = forecast.criteriaProjections.filter(p => p.delta > 0.5).length

  return (
    <Accordion defaultExpanded={defaultOpen}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 80 }}>
            +{forecast.horizon} giorni
          </Typography>
          <ScoreGauge score={forecast.projectedScore} size={48} />
          <Box>
            <RiskBadge level={forecast.projectedLevel} />
          </Box>
          <Chip
            size="small"
            label={scoreDelta > 0 ? `+${scoreDelta} pts` : `${scoreDelta} pts`}
            color={scoreDelta < 0 ? 'success' : scoreDelta > 0 ? 'error' : 'default'}
            icon={scoreDelta < 0 ? <TrendingDown /> : scoreDelta > 0 ? <TrendingUp /> : <TrendingFlat />}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {improved > 0 && <span style={{ color: '#16a34a' }}>↓ {improved} migliorati &nbsp;</span>}
            {worsened > 0 && <span style={{ color: '#dc2626' }}>↑ {worsened} peggiorati</span>}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Alert severity={scoreDelta < -3 ? 'success' : scoreDelta > 3 ? 'warning' : 'info'} sx={{ mb: 2 }}>
          {forecast.summaryExplanation}
        </Alert>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell><Typography variant="caption" fontWeight={600}>Criterio</Typography></TableCell>
                <TableCell align="center"><Typography variant="caption" fontWeight={600}>Peso</Typography></TableCell>
                <TableCell align="center"><Typography variant="caption" fontWeight={600}>Attuale</Typography></TableCell>
                <TableCell align="center"><Typography variant="caption" fontWeight={600}>Previsto</Typography></TableCell>
                <TableCell align="center">
                  <Tooltip title="Impatto sul punteggio finale (0-100): Δ criterio × peso × 10, arrotondato all'intero. La somma di questa colonna è uguale al delta totale.">
                    <Typography variant="caption" fontWeight={600} sx={{ textDecoration: 'underline dotted', cursor: 'help' }}>
                      Δ pts
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Motivazione</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecast.criteriaProjections.map(proj => {
                const ptColor = proj.contribution < 0 ? '#16a34a' : proj.contribution > 0 ? '#dc2626' : '#9ca3af'
                return (
                  <TableRow
                    key={proj.criterionId}
                    sx={{
                      bgcolor: proj.contribution < 0 ? '#f0fdf4' : proj.contribution > 0 ? '#fff8f0' : 'transparent',
                      '&:hover': { bgcolor: '#f9fafb' },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                          {proj.criterionId.toUpperCase()}
                        </Typography>
                        <Typography variant="caption">{proj.label}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(proj.weight * 100)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">{proj.currentScore}/10</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" fontWeight={600} color={riskColor(proj.projectedScore * 10)}>
                        {proj.projectedScore}/10
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" fontWeight={700} color={ptColor}>
                        {proj.contribution === 0
                          ? '—'
                          : (proj.contribution > 0 ? '+' : '') + proj.contribution}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="caption" color="text.secondary">{proj.rationale}</Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
              {/* Riga totale — per costruzione: Σ "Δ pts" = scoreDelta = projectedScore - currentScore */}
              <TableRow sx={{ borderTop: '2px solid #e5e7eb', bgcolor: '#f9fafb' }}>
                <TableCell colSpan={4}>
                  <Typography variant="caption" fontWeight={700}>
                    Score totale &nbsp;
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={scoreDelta < 0 ? '#16a34a' : scoreDelta > 0 ? '#dc2626' : '#6b7280'}
                  >
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  )
}

// ─── Mitigation Tab ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: 'In attesa',
  in_progress: 'In corso',
  done: 'Completata',
}
const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success'> = {
  pending: 'default',
  in_progress: 'warning',
  done: 'success',
}

type ActionDraft = { description: string; dueDate: string; status: string }

function MitigationTab({ assessment }: { assessment: RiskAssessment }) {
  // Edit existing action
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<ActionDraft>({ description: '', dueDate: '', status: 'pending' })
  const [savedEdits, setSavedEdits] = useState<Record<string, ActionDraft>>({})

  // Add new action
  const [addingCriterionId, setAddingCriterionId] = useState<string | null>(null)
  const [newDraft, setNewDraft] = useState<ActionDraft>({ description: '', dueDate: '', status: 'pending' })
  const [addedActions, setAddedActions] = useState<{ id: string; criterionId: string; description: string; dueDate: string; status: string }[]>([])

  const effectiveAction = (a: { id: string; description: string; dueDate: string; status: string }) =>
    savedEdits[a.id] ? { ...a, ...savedEdits[a.id] } : a

  const startEdit = (a: ReturnType<typeof effectiveAction>) => {
    setEditingId(a.id)
    setAddingCriterionId(null)
    setEditDraft({ description: a.description, dueDate: a.dueDate, status: a.status })
  }

  const saveEdit = (id: string) => {
    setSavedEdits(prev => ({ ...prev, [id]: editDraft }))
    setEditingId(null)
  }

  const startAdd = (criterionId: string) => {
    setAddingCriterionId(criterionId)
    setEditingId(null)
    setNewDraft({ description: '', dueDate: '', status: 'pending' })
  }

  const saveNew = (criterionId: string) => {
    if (!newDraft.description.trim()) return
    setAddedActions(prev => [...prev, {
      id: `new-${criterionId}-${Date.now()}`,
      criterionId,
      ...newDraft,
    }])
    setAddingCriterionId(null)
  }

  // Summary counts
  const allActions = [
    ...assessment.mitigationActions.map(a => effectiveAction(a)),
    ...addedActions,
  ]
  const counts = {
    total: allActions.length,
    inProgress: allActions.filter(a => a.status === 'in_progress').length,
    done: allActions.filter(a => a.status === 'done').length,
    pending: allActions.filter(a => a.status === 'pending').length,
  }

  return (
    <Stack spacing={2}>
      {/* Summary bar */}
      <Stack direction="row" spacing={2} sx={{ px: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>{counts.total}</strong> azioni totali
        </Typography>
        {counts.inProgress > 0 && (
          <Chip size="small" label={`${counts.inProgress} in corso`} color="warning" />
        )}
        {counts.done > 0 && (
          <Chip size="small" label={`${counts.done} completate`} color="success" />
        )}
        {counts.pending > 0 && (
          <Chip size="small" label={`${counts.pending} in attesa`} />
        )}
      </Stack>

      {/* One card per criterion */}
      {assessment.criteria.map(criterion => {
        const existingActions = assessment.mitigationActions.filter(a => a.criterionId === criterion.id)
        const newActions = addedActions.filter(a => a.criterionId === criterion.id)
        const allCriterionActions = [...existingActions, ...newActions]
        const isAdding = addingCriterionId === criterion.id

        return (
          <Card
            key={criterion.id}
            variant="outlined"
            sx={{ opacity: criterion.score <= 3 ? 0.75 : 1 }}
          >
            <CardContent sx={{ pb: '12px !important' }}>
              {/* Header */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: allCriterionActions.length > 0 || isAdding ? 1.5 : 0 }}>
                <Chip
                  label={criterion.id.toUpperCase()}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                />
                <Typography variant="subtitle2" sx={{ flex: 1 }}>{criterion.label}</Typography>
                <Chip
                  label={`${criterion.score}/10`}
                  size="small"
                  sx={{ bgcolor: riskColor(criterion.score * 10), color: '#fff', fontWeight: 600, minWidth: 48 }}
                />
                <Tooltip title="Aggiungi azione di mitigazione">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => isAdding ? setAddingCriterionId(null) : startAdd(criterion.id)}
                  >
                    <AddCircleOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Actions table (shown only if there are actions or user is adding) */}
              {(allCriterionActions.length > 0 || isAdding) && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f9fafb' }}>
                        <TableCell><Typography variant="caption" fontWeight={600}>Azione</Typography></TableCell>
                        <TableCell sx={{ width: 128 }}><Typography variant="caption" fontWeight={600}>Scadenza</Typography></TableCell>
                        <TableCell sx={{ width: 140 }}><Typography variant="caption" fontWeight={600}>Stato</Typography></TableCell>
                        <TableCell sx={{ width: 72 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allCriterionActions.map(rawAction => {
                        const action = effectiveAction(rawAction)
                        const isEditing = editingId === action.id

                        if (isEditing) {
                          return (
                            <TableRow key={action.id} sx={{ bgcolor: '#fffbeb' }}>
                              <TableCell>
                                <TextField
                                  value={editDraft.description}
                                  onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))}
                                  size="small" fullWidth multiline maxRows={3} autoFocus
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="date"
                                  value={editDraft.dueDate}
                                  onChange={e => setEditDraft(d => ({ ...d, dueDate: e.target.value }))}
                                  size="small" sx={{ minWidth: 128 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editDraft.status}
                                  onChange={e => setEditDraft(d => ({ ...d, status: e.target.value }))}
                                  size="small" fullWidth
                                >
                                  <MenuItem value="pending">In attesa</MenuItem>
                                  <MenuItem value="in_progress">In corso</MenuItem>
                                  <MenuItem value="done">Completata</MenuItem>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton size="small" color="success" onClick={() => saveEdit(action.id)}>
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => setEditingId(null)}>
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          )
                        }

                        return (
                          <TableRow key={action.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                            <TableCell>
                              <Typography variant="caption">{action.description}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{action.dueDate}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={STATUS_LABEL[action.status] ?? action.status}
                                color={STATUS_COLOR[action.status] ?? 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Modifica">
                                <IconButton size="small" onClick={() => startEdit(action)}>
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )
                      })}

                      {/* New action form row */}
                      {isAdding && (
                        <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                          <TableCell>
                            <TextField
                              value={newDraft.description}
                              onChange={e => setNewDraft(d => ({ ...d, description: e.target.value }))}
                              size="small" fullWidth multiline maxRows={3} autoFocus
                              placeholder="Descrizione dell'azione…"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              value={newDraft.dueDate}
                              onChange={e => setNewDraft(d => ({ ...d, dueDate: e.target.value }))}
                              size="small" sx={{ minWidth: 128 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={newDraft.status}
                              onChange={e => setNewDraft(d => ({ ...d, status: e.target.value }))}
                              size="small" fullWidth
                            >
                              <MenuItem value="pending">In attesa</MenuItem>
                              <MenuItem value="in_progress">In corso</MenuItem>
                              <MenuItem value="done">Completata</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton size="small" color="success" onClick={() => saveNew(criterion.id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => setAddingCriterionId(null)}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}

// ─── Comparison Criteria Table ─────────────────────────────────────────────────

function ComparisonTable({
  primary,
  compareItems,
}: {
  primary: { assessment: RiskAssessment; label: string }
  compareItems: { assessment: RiskAssessment; label: string; color: string }[]
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f9fafb' }}>
            <TableCell><Typography variant="caption" fontWeight={600}>Criterio</Typography></TableCell>
            <TableCell align="center"><Typography variant="caption" fontWeight={600}>Peso</Typography></TableCell>
            <TableCell align="center">
              <Typography variant="caption" fontWeight={600} color="#059669">{primary.label}</Typography>
            </TableCell>
            {compareItems.map(c => (
              <TableCell key={c.label} align="center">
                <Typography variant="caption" fontWeight={600} color={c.color}>{c.label}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {primary.assessment.criteria.map(criterion => (
            <TableRow key={criterion.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell>
                <Typography variant="caption">{criterion.label}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" color="text.secondary">{Math.round(criterion.weight * 100)}%</Typography>
              </TableCell>
              <TableCell align="center">
                <Chip size="small" label={`${criterion.score}/10`}
                  sx={{ bgcolor: riskColor(criterion.score * 10), color: '#fff', fontWeight: 600, minWidth: 52 }} />
              </TableCell>
              {compareItems.map(c => {
                const match = c.assessment.criteria.find(cc => cc.id === criterion.id)
                const s = match?.score ?? 0
                return (
                  <TableCell key={c.label} align="center">
                    <Chip size="small" label={`${s}/10`}
                      sx={{ bgcolor: riskColor(s * 10), color: '#fff', fontWeight: 600, minWidth: 52 }} />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {/* Overall row */}
          <TableRow sx={{ bgcolor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
            <TableCell colSpan={2}>
              <Typography variant="caption" fontWeight={700}>Punteggio complessivo</Typography>
            </TableCell>
            <TableCell align="center">
              <Chip label={`${primary.assessment.overallScore}/100`}
                sx={{ bgcolor: riskColor(primary.assessment.overallScore), color: '#fff', fontWeight: 700 }} />
            </TableCell>
            {compareItems.map(c => (
              <TableCell key={c.label} align="center">
                <Chip label={`${c.assessment.overallScore}/100`}
                  sx={{ bgcolor: riskColor(c.assessment.overallScore), color: '#fff', fontWeight: 700 }} />
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ─── Helper: get or generate assessment ──────────────────────────────────────

function getAssessment(lot: Lot, supplier: Supplier): RiskAssessment {
  return mockRiskAssessments.find(a => a.lotId === lot.id) ?? generateAssessmentForLot(lot, supplier)
}

function lotLabel(lot: Lot): string {
  return `${lot.id} — ${COMMODITY_IT[lot.commodity] ?? lot.commodity}`
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RiskAssessment() {
  const lots = useLotStore(s => s.lots)
  const suppliers = useSupplierStore(s => s.suppliers)

  const dfFreeLots = useMemo(() => lots.filter(isDfFree), [lots])

  const [selectedLotId, setSelectedLotId] = useState<string>(dfFreeLots[0]?.id ?? '')
  const [compareLotIds, setCompareLotIds] = useState<string[]>([])
  const [tab, setTab] = useState(0)
  const [externalLots, setExternalLots] = useState<ExternalLot[]>([])
  const [analysisOpen, setAnalysisOpen] = useState(false)

  // Look up lot + supplier from both real lots and external lots
  const findEntry = (id: string): { lot: Lot; supplier: Supplier } | null => {
    const ext = externalLots.find(e => e.lot.id === id)
    if (ext) return { lot: ext.lot, supplier: ext.supplier }
    const lot = dfFreeLots.find(l => l.id === id)
    const supplier = suppliers.find(s => s.id === lot?.supplierId)
    if (lot && supplier) return { lot, supplier }
    return null
  }

  const selectedEntry = findEntry(selectedLotId)
  const selectedLot = selectedEntry?.lot ?? null
  const selectedSupplier = selectedEntry?.supplier ?? null

  const assessment = useMemo<RiskAssessment | null>(() => {
    if (!selectedLot || !selectedSupplier) return null
    const ext = externalLots.find(e => e.lot.id === selectedLot.id)
    if (ext) return ext.assessment
    return getAssessment(selectedLot, selectedSupplier)
  }, [selectedLot, selectedSupplier, externalLots])

  const forecasts = useMemo<RiskForecast[]>(() => {
    if (!selectedLot) return []
    const ext = externalLots.find(e => e.lot.id === selectedLot.id)
    if (ext) return ext.forecasts
    if (!assessment) return []
    return generateForecasts(assessment)
  }, [selectedLot, externalLots, assessment])

  const compareItems = useMemo(() => compareLotIds.map((id, idx) => {
    const ext = externalLots.find(e => e.lot.id === id)
    if (ext) return {
      lot: ext.lot, supplier: ext.supplier,
      assessment: ext.assessment, forecasts: ext.forecasts,
      label: ext.lot.id, color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
      isExternal: true,
    }
    const lot = dfFreeLots.find(l => l.id === id)!
    const supplier = suppliers.find(s => s.id === lot?.supplierId)!
    const ass = getAssessment(lot, supplier)
    return {
      lot, supplier, assessment: ass, forecasts: generateForecasts(ass),
      label: lot.id, color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
      isExternal: false,
    }
  }), [compareLotIds, dfFreeLots, suppliers, externalLots])

  const availableForCompare = [
    ...dfFreeLots.filter(l => l.id !== selectedLotId && !compareLotIds.includes(l.id)),
    ...externalLots.filter(e => e.lot.id !== selectedLotId && !compareLotIds.includes(e.lot.id)).map(e => e.lot),
  ]

  const addCompare = (lot: Lot) => {
    if (compareLotIds.length >= 3) return
    setCompareLotIds(prev => [...prev, lot.id])
  }

  const addExternalLot = (ext: ExternalLot) => {
    setExternalLots(prev => {
      const exists = prev.find(e => e.lot.id === ext.lot.id)
      return exists ? prev : [...prev, ext]
    })
  }

  const handleUsePrimary = (ext: ExternalLot) => {
    addExternalLot(ext)
    setSelectedLotId(ext.lot.id)
    setTab(0)
  }

  const handleAddCompare = (ext: ExternalLot) => {
    if (compareLotIds.length >= 3) return
    addExternalLot(ext)
    setCompareLotIds(prev => [...prev, ext.lot.id])
  }

  const removeCompare = (id: string) => setCompareLotIds(prev => prev.filter(x => x !== id))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Page header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Valutazione del Rischio</Typography>
          <Typography variant="body2" color="text.secondary">
            Analisi dei 14 criteri EUDR, previsioni a 30/60/90 giorni e confronto tra lotti DF-free
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<TravelExplore />}
          onClick={() => setAnalysisOpen(true)}
          sx={{ whiteSpace: 'nowrap', ml: 2 }}
        >
          Analisi esterna
        </Button>
      </Stack>

      <PolygonAnalysisDialog
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        onUsePrimary={handleUsePrimary}
        onAddCompare={handleAddCompare}
      />

      {/* Lot selector + compare bar */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5 }}>
              <Autocomplete
                options={[...dfFreeLots, ...externalLots.map(e => e.lot)]}
                getOptionLabel={lotLabel}
                value={selectedLot ?? null}
                onChange={(_, val) => { if (val) { setSelectedLotId(val.id); setTab(0) } }}
                renderInput={params => (
                  <TextField {...params} label="Lotto principale" size="small"
                    helperText={`${dfFreeLots.length} lotti DF-free · ${externalLots.length} lotti esterni`} />
                )}
                renderOption={(props, lot) => {
                  const isExt = lot.supplierId === '__ext__'
                  return (
                    <Box component="li" {...props} key={lot.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {isExt && <Chip size="small" label="EXT" sx={{ bgcolor: '#7c3aed', color: '#fff', fontSize: '0.6rem', height: 18 }} />}
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 120 }}>{lot.id}</Typography>
                        <Chip size="small" label={COMMODITY_IT[lot.commodity]} />
                        <RiskBadge level={lot.riskLevel} />
                      </Stack>
                    </Box>
                  )
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Aggiungi al confronto (max 3)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {compareItems.map(ci => (
                  <Chip
                    key={ci.lot.id}
                    label={ci.lot.id}
                    onDelete={() => removeCompare(ci.lot.id)}
                    sx={{ bgcolor: ci.color, color: '#fff', '& .MuiChip-deleteIcon': { color: '#fff' } }}
                    size="small"
                  />
                ))}
                {compareLotIds.length < 3 && availableForCompare.length > 0 && (
                  <Autocomplete
                    options={availableForCompare}
                    getOptionLabel={l => l.id}
                    value={null}
                    onChange={(_, val) => { if (val) addCompare(val) }}
                    size="small"
                    sx={{ minWidth: 200 }}
                    renderInput={params => (
                      <TextField {...params} placeholder="+ Aggiungi lotto..." size="small"
                        InputProps={{ ...params.InputProps, startAdornment: <AddCircleOutline sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} /> }}
                      />
                    )}
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!assessment || !selectedLot || !selectedSupplier ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.disabled">Seleziona un lotto DF-free per visualizzare la valutazione del rischio.</Typography>
        </Box>
      ) : (
        <>
          {/* Hero */}
          <Card variant="outlined" sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: riskColor(assessment.overallScore) }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size="auto">
                  <ScoreGauge score={assessment.overallScore} size={104} />
                </Grid>
                <Grid size="grow">
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6" fontWeight={700}>{selectedLot.id}</Typography>
                      <RiskBadge level={assessment.level} />
                      {selectedLot.supplierId === '__ext__' && (
                        <Chip size="small" label="Lotto esterno simulato" sx={{ bgcolor: '#7c3aed', color: '#fff' }} />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label={COMMODITY_IT[selectedLot.commodity]} />
                      {selectedLot.supplierId !== '__ext__' && (
                        <Chip size="small" label={selectedSupplier.name} variant="outlined" />
                      )}
                      <Chip size="small" label={`${selectedLot.geolocation.hectares} ha`} variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {selectedLot.supplierId === '__ext__'
                        ? 'Previsione simulata basata su coordinate e commodity · modello ML mock'
                        : `Valutato il ${new Date(assessment.assessedAt).toLocaleDateString('it-IT')} · ${assessment.mitigationActions.length} azioni di mitigazione`
                      }
                    </Typography>
                  </Stack>
                </Grid>

                {/* Mini forecast preview */}
                <Grid size={{ xs: 12, md: 'auto' }}>
                  <Stack direction="row" spacing={2}>
                    {forecasts.map(f => (
                      <Box key={f.horizon} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">+{f.horizon}gg</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <ScoreGauge score={f.projectedScore} size={52} />
                        </Box>
                        <RiskBadge level={f.projectedLevel} />
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tab} onChange={(_, v: number) => setTab(v)}>
              <Tab icon={<AssessmentOutlined />} iconPosition="start" label="Valutazione Attuale" />
              <Tab icon={<QueryStatsOutlined />} iconPosition="start" label="Previsioni 30/60/90 gg" />
              <Tab icon={<BuildOutlined />} iconPosition="start"
                label={`Mitigazione (${assessment.mitigationActions.length})`} />
              <Tab icon={<CompareArrowsOutlined />} iconPosition="start"
                label={`Confronto${compareLotIds.length > 0 ? ` (${compareLotIds.length})` : ''}`} />
            </Tabs>
          </Box>

          {/* ── Tab 0: Valutazione Attuale ──────────────────────────────────── */}
          {tab === 0 && (
            <Grid container spacing={3}>
              {/* Radar */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Profilo 8 Criteri EUDR
                    </Typography>
                    <CriteriaRadar
                      primary={{ assessment, label: selectedLot.id, color: '#059669' }}
                      compareData={compareItems.map(ci => ({ assessment: ci.assessment, label: ci.label, color: ci.color }))}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Criteria table */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: '12px !important' }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Breakdown Criteri
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f9fafb' }}>
                            <TableCell><Typography variant="caption" fontWeight={600}>Criterio</Typography></TableCell>
                            <TableCell align="center"><Typography variant="caption" fontWeight={600}>Peso</Typography></TableCell>
                            <TableCell sx={{ minWidth: 140 }}><Typography variant="caption" fontWeight={600}>Score</Typography></TableCell>
                            <TableCell align="right"><Typography variant="caption" fontWeight={600}>Contributo</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...assessment.criteria]
                            .sort((a, b) => b.score * b.weight - a.score * a.weight)
                            .map(criterion => {
                              const contribution = Math.round(criterion.score * criterion.weight * 10)
                              return (
                                <Tooltip
                                  key={criterion.id}
                                  title={criterion.description}
                                  placement="left"
                                  arrow
                                >
                                  <TableRow sx={{ '&:hover': { bgcolor: '#f9fafb', cursor: 'default' } }}>
                                    <TableCell>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Chip label={criterion.id.toUpperCase()} size="small"
                                          sx={{ fontFamily: 'monospace', fontSize: 10, height: 18 }} />
                                        <Typography variant="caption">{criterion.label}</Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography variant="caption" color="text.secondary">
                                        {Math.round(criterion.weight * 100)}%
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <ScoreBar score={criterion.score} />
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="caption" fontWeight={600}
                                        color={riskColor(contribution * 3.33)}>
                                        {contribution}/30
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </Tooltip>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* ── Tab 1: Previsioni ────────────────────────────────────────────── */}
          {tab === 1 && (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Andamento previsto del punteggio di rischio
                  </Typography>
                  <ForecastChart
                    primary={{ label: selectedLot.id, forecasts, color: '#059669', currentScore: assessment.overallScore }}
                    compareData={compareItems.map(ci => ({
                      label: ci.label, forecasts: ci.forecasts, color: ci.color, currentScore: ci.assessment.overallScore,
                    }))}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Le soglie tratteggiate indicano i confini tra le classi di rischio EUDR (basso &lt;33, medio 33–65, alto ≥66).
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" fontWeight={700}>Previsioni dettagliate per orizzonte</Typography>

              {forecasts.map(f => (
                <HorizonPanel
                  key={f.horizon}
                  forecast={f}
                  defaultOpen={f.horizon === 30}
                />
              ))}
            </Stack>
          )}

          {/* ── Tab 2: Mitigazione ───────────────────────────────────────────── */}
          {tab === 2 && <MitigationTab assessment={assessment} />}

          {/* ── Tab 3: Confronto ────────────────────────────────────────────── */}
          {tab === 3 && (
            compareItems.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CompareArrowsOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>Nessun lotto selezionato per il confronto</Typography>
                <Typography variant="body2" color="text.disabled">
                  Usa il selettore "Aggiungi al confronto" in cima per selezionare fino a 3 lotti da confrontare.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* KPI row */}
                <Grid container spacing={2}>
                  {[
                    { lot: selectedLot, assessment, color: '#059669', isExternal: selectedLot.supplierId === '__ext__' },
                    ...compareItems.map(ci => ({ lot: ci.lot, assessment: ci.assessment, color: ci.color, isExternal: ci.isExternal })),
                  ].map(item => (
                    <Grid key={item.lot.id} size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card variant="outlined" sx={{ borderLeft: '4px solid', borderLeftColor: item.color }}>
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                  {item.lot.id}
                                </Typography>
                                {item.isExternal && (
                                  <Chip size="small" label="EXT" sx={{ bgcolor: '#7c3aed', color: '#fff', fontSize: '0.58rem', height: 16 }} />
                                )}
                              </Stack>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {COMMODITY_IT[item.lot.commodity]}
                              </Typography>
                            </Box>
                            <ScoreGauge score={item.assessment.overallScore} size={52} />
                          </Stack>
                          <RiskBadge level={item.assessment.level} />
                          {item.lot.id !== selectedLot.id && (
                            <Box sx={{ mt: 1 }}>
                              <IconButton size="small" onClick={() => removeCompare(item.lot.id)}>
                                <RemoveCircleOutline fontSize="small" />
                              </IconButton>
                              <Typography variant="caption" color="text.secondary">Rimuovi</Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Radar comparison */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Confronto profilo criteri
                        </Typography>
                        <CriteriaRadar
                          primary={{ assessment, label: selectedLot.id, color: '#059669' }}
                          compareData={compareItems.map(ci => ({ assessment: ci.assessment, label: ci.label, color: ci.color }))}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 7 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Previsioni a confronto
                        </Typography>
                        <ForecastChart
                          primary={{ label: selectedLot.id, forecasts, color: '#059669', currentScore: assessment.overallScore }}
                          compareData={compareItems.map(ci => ({
                            label: ci.label, forecasts: ci.forecasts, color: ci.color, currentScore: ci.assessment.overallScore,
                          }))}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Criteria comparison table */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Confronto dettagliato per criterio
                    </Typography>
                    <ComparisonTable
                      primary={{ assessment, label: selectedLot.id }}
                      compareItems={compareItems.map(ci => ({ assessment: ci.assessment, label: ci.label, color: ci.color }))}
                    />
                  </CardContent>
                </Card>
              </Stack>
            )
          )}
        </>
      )}
    </Box>
  )
}
