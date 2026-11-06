import { useState, useMemo } from 'react'
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, Collapse,
  Grid, IconButton, Link, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tooltip, Typography,
} from '@mui/material'
import {
  CheckCircleOutlined, ContentCopy, ErrorOutlined,
  HourglassEmptyOutlined, LaunchOutlined, LockOutlined,
  OpenInNewOutlined, VerifiedOutlined, WarningAmberOutlined,
} from '@mui/icons-material'
import { useLotStore } from '../../stores/lotStore'
import { useSupplierStore } from '../../stores/supplierStore'
import { mockTransactions } from '../../mocks'
import { submitToBlockchain } from '../../services/blockchain'
import type { BlockchainPackage } from '../../services/blockchain'
import type { Lot } from '../../types/lot'
import type { Supplier } from '../../types/supplier'
import RiskBadge from '../../components/ui/RiskBadge'

// ─── Constants ─────────────────────────────────────────────────────────────────

const COMMODITY_IT: Record<string, string> = {
  wood: 'Legno', cattle: 'Bestiame', soy: 'Soia',
  cocoa: 'Cacao', coffee: 'Caffè', palm_oil: 'Olio di palma', rubber: 'Gomma',
}

const POLYGONSCAN = 'https://polygonscan.com/tx'

const isDfFree = (l: Lot) => !!l.deforestationFreeProof && !l.deforestationDetected

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: BlockchainPackage['status'] }) {
  if (status === 'certified') return (
    <Chip size="small" icon={<CheckCircleOutlined />} label="Certificato" color="success" />
  )
  if (status === 'blocked') return (
    <Chip size="small" icon={<LockOutlined />} label="Bloccato" color="error" />
  )
  return (
    <Chip size="small" icon={<HourglassEmptyOutlined />} label="In attesa" color="warning" />
  )
}

function HashCell({ hash, full = false }: { hash: string; full?: boolean }) {
  const [copied, setCopied] = useState(false)
  const display = full ? hash : `${hash.slice(0, 10)}…${hash.slice(-6)}`

  const copy = () => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography
        variant="caption"
        sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#374151' }}
      >
        {display}
      </Typography>
      <Tooltip title={copied ? 'Copiato!' : 'Copia hash'}>
        <IconButton size="small" onClick={copy} sx={{ p: 0.25 }}>
          <ContentCopy sx={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Apri su PolygonScan">
        <Link href={`${POLYGONSCAN}/${hash}`} target="_blank" rel="noopener">
          <LaunchOutlined sx={{ fontSize: 13, color: '#6366f1' }} />
        </Link>
      </Tooltip>
    </Stack>
  )
}

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; color: string
}) {
  return (
    <Card variant="outlined" sx={{ borderLeft: '4px solid', borderLeftColor: color }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
          </Box>
          <Box sx={{ color, opacity: 0.4, fontSize: 36 }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Transaction Detail Panel ──────────────────────────────────────────────────

function TxDetail({ tx, lot, supplier }: { tx: BlockchainPackage; lot?: Lot; supplier?: Supplier }) {
  const [showRaw, setShowRaw] = useState(false)
  const coords = (() => {
    try { return JSON.parse(tx.coordinates) } catch { return null }
  })()

  return (
    <Box sx={{ bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb', p: 3 }}>
      <Grid container spacing={3}>
        {/* Data package */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Data package
          </Typography>
          <Stack spacing={1}>
            {[
              { label: 'Lot ID', value: tx.lotId },
              { label: 'Commodity', value: lot ? COMMODITY_IT[lot.commodity] : '—' },
              { label: 'Fornitore', value: supplier?.name ?? '—' },
              { label: 'Data raccolta', value: tx.date },
              { label: 'Coordinata centroide', value: coords ? `${coords.coordinates[1].toFixed(4)}°, ${coords.coordinates[0].toFixed(4)}°` : tx.coordinates },
              { label: 'Risk score', value: `${tx.riskScore}/100` },
              { label: 'Risk level', value: <RiskBadge level={tx.riskLevel} /> },
              { label: 'Network', value: <Chip size="small" label="Polygon" sx={{ bgcolor: '#7c3aed', color: '#fff', fontWeight: 700 }} /> },
              { label: 'Inviato il', value: new Date(tx.submittedAt).toLocaleString('it-IT') },
            ].map(row => (
              <Stack key={row.label} direction="row" spacing={1}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>
                  {row.label}
                </Typography>
                {typeof row.value === 'string'
                  ? <Typography variant="caption" fontWeight={500}>{row.value}</Typography>
                  : row.value}
              </Stack>
            ))}
          </Stack>
        </Grid>

        {/* Firma e hash */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Firma crittografica
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">Firma SHA-256</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all', fontSize: 11, mt: 0.25 }}>
                {tx.signature}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Transaction Hash (Polygon)</Typography>
              <Box sx={{ mt: 0.25 }}>
                <HashCell hash={tx.txHash} full />
              </Box>
            </Box>
            <Box>
              <Link
                href={`${POLYGONSCAN}/${tx.txHash}`}
                target="_blank"
                rel="noopener"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}
              >
                <OpenInNewOutlined sx={{ fontSize: 14 }} />
                Visualizza su PolygonScan
              </Link>
            </Box>
          </Stack>

          {tx.status === 'blocked' && (
            <Alert severity="error" sx={{ mt: 2 }} icon={<LockOutlined />}>
              <Typography variant="caption" fontWeight={600} display="block">Lotto bloccato dalla rete</Typography>
              <Typography variant="caption">
                Il punteggio di rischio ({tx.riskScore}/100 — Alto rischio) ha superato la soglia EUDR.
                Il lotto è stato segnalato e il fornitore {supplier ? `"${supplier.name}"` : ''} sospeso automaticamente.
              </Typography>
            </Alert>
          )}

          {tx.status === 'certified' && (
            <Alert severity="success" sx={{ mt: 2 }} icon={<VerifiedOutlined />}>
              <Typography variant="caption" fontWeight={600} display="block">Certificato di conformità emesso</Typography>
              <Typography variant="caption">
                Il lotto ha superato la valutazione EUDR (score {tx.riskScore}/100). Il certificato è registrato immutabilmente su Polygon.
              </Typography>
            </Alert>
          )}
        </Grid>

        {/* Raw JSON toggle */}
        <Grid size={12}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="caption"
              sx={{ cursor: 'pointer', textDecoration: 'underline dotted', color: '#6366f1' }}
              onClick={() => setShowRaw(v => !v)}
            >
              {showRaw ? 'Nascondi' : 'Mostra'} raw data package (JSON)
            </Typography>
          </Stack>
          <Collapse in={showRaw}>
            <Box
              component="pre"
              sx={{
                mt: 1, p: 2, bgcolor: '#1e1e2e', color: '#cdd6f4',
                borderRadius: 1, fontSize: 11, overflowX: 'auto',
                fontFamily: 'monospace', lineHeight: 1.6,
              }}
            >
              {JSON.stringify({ lotId: tx.lotId, coordinates: tx.coordinates, date: tx.date, riskScore: tx.riskScore, riskLevel: tx.riskLevel, signature: tx.signature, txHash: tx.txHash, network: tx.network, submittedAt: tx.submittedAt, status: tx.status }, null, 2)}
            </Box>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Blockchain() {
  const lots = useLotStore(s => s.lots)
  const suppliers = useSupplierStore(s => s.suppliers)

  const [tab, setTab] = useState(0)
  const [filter, setFilter] = useState<'all' | 'certified' | 'blocked'>('all')
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null)
  const [localTxs, setLocalTxs] = useState<BlockchainPackage[]>([])
  const [submitting, setSubmitting] = useState<string | null>(null)

  const allTxs = useMemo(() => [...mockTransactions, ...localTxs], [localTxs])
  const submittedLotIds = useMemo(() => new Set(allTxs.map(t => t.lotId)), [allTxs])

  const pendingLots = useMemo(
    () => lots.filter(l => !submittedLotIds.has(l.id)),
    [lots, submittedLotIds],
  )

  const certified = allTxs.filter(t => t.status === 'certified').length
  const blocked = allTxs.filter(t => t.status === 'blocked').length

  const filteredTxs = useMemo(() => {
    if (filter === 'certified') return allTxs.filter(t => t.status === 'certified')
    if (filter === 'blocked') return allTxs.filter(t => t.status === 'blocked')
    return allTxs
  }, [allTxs, filter])

  const lotById = useMemo(() => new Map(lots.map(l => [l.id, l])), [lots])
  const supplierById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers])

  const handleSubmit = async (lot: Lot, status: 'certified' | 'blocked') => {
    setSubmitting(lot.id)
    try {
      const centroid = (() => {
        const ring = lot.geolocation.coordinates[0] as number[][]
        const n = ring.length - 1 // exclude closing point
        const lng = ring.slice(0, n).reduce((s, c) => s + c[0], 0) / n
        const lat = ring.slice(0, n).reduce((s, c) => s + c[1], 0) / n
        return JSON.stringify({ type: 'Point', coordinates: [+lng.toFixed(4), +lat.toFixed(4)] })
      })()
      const tx = await submitToBlockchain(lot.id, centroid, lot.harvestDate, lot.riskScore, lot.riskLevel, status)
      setLocalTxs(prev => [...prev, tx])
    } finally {
      setSubmitting(null)
    }
  }

  const blockedTxs = allTxs.filter(t => t.status === 'blocked')

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Registro Blockchain</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Chip size="small" label="Polygon" sx={{ bgcolor: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 11 }} />
            <Typography variant="caption" color="text.secondary">
              Ogni lotto valutato viene firmato con SHA-256 e registrato immutabilmente su Polygon Mainnet.
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard icon={<VerifiedOutlined fontSize="inherit" />} label="Transazioni totali" value={allTxs.length} color="#059669" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard icon={<CheckCircleOutlined fontSize="inherit" />} label="Certificati" value={certified} sub="Conformi EUDR" color="#16a34a" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard icon={<LockOutlined fontSize="inherit" />} label="Bloccati" value={blocked} sub="Alto rischio" color="#dc2626" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard icon={<HourglassEmptyOutlined fontSize="inherit" />} label="In attesa" value={pendingLots.length} sub="Lotti da certificare" color="#d97706" />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)}>
          <Tab label={`Transazioni (${allTxs.length})`} />
          <Tab
            label={`Lotti pendenti (${pendingLots.length})`}
            icon={pendingLots.length > 0 ? <WarningAmberOutlined sx={{ fontSize: 16 }} /> : undefined}
            iconPosition="end"
          />
          <Tab
            label={`Alert blocchi (${blockedTxs.length})`}
            icon={blockedTxs.length > 0 ? <ErrorOutlined sx={{ fontSize: 16, color: '#dc2626' }} /> : undefined}
            iconPosition="end"
          />
        </Tabs>
      </Box>

      {/* ── Tab 0: Transazioni ──────────────────────────────────────────────── */}
      {tab === 0 && (
        <Box>
          {/* Filter chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {(['all', 'certified', 'blocked'] as const).map(f => (
              <Chip
                key={f}
                label={f === 'all' ? 'Tutti' : f === 'certified' ? 'Certificati' : 'Bloccati'}
                onClick={() => setFilter(f)}
                variant={filter === f ? 'filled' : 'outlined'}
                color={f === 'certified' ? 'success' : f === 'blocked' ? 'error' : 'default'}
                size="small"
              />
            ))}
          </Stack>

          <Card variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell><Typography variant="caption" fontWeight={600}>Lotto</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Fornitore</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>Rischio</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>Score</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Data</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Tx Hash</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>Stato</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTxs.map(tx => {
                    const lot = lotById.get(tx.lotId)
                    const supplier = lot ? supplierById.get(lot.supplierId) : undefined
                    const isExpanded = expandedTxId === tx.txHash

                    return (
                      <>
                        <TableRow
                          key={tx.txHash}
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.txHash)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: tx.status === 'blocked' ? '#fff5f5' : tx.status === 'certified' ? '#f0fdf4' : 'transparent',
                            '&:hover': { bgcolor: '#f1f5f9' },
                            borderLeft: '3px solid',
                            borderLeftColor: tx.status === 'certified' ? '#16a34a' : tx.status === 'blocked' ? '#dc2626' : '#d97706',
                          }}
                        >
                          <TableCell>
                            <Stack>
                              <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                                {tx.lotId}
                              </Typography>
                              {lot && (
                                <Typography variant="caption" color="text.secondary">
                                  {COMMODITY_IT[lot.commodity]}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{supplier?.name ?? '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <RiskBadge level={tx.riskLevel} />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" fontWeight={700}>
                              {tx.riskScore}/100
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{tx.date}</Typography>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <HashCell hash={tx.txHash} />
                          </TableCell>
                          <TableCell align="center">
                            <StatusChip status={tx.status} />
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <TableRow key={`${tx.txHash}-detail`}>
                            <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                              <TxDetail tx={tx} lot={lot} supplier={supplier} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}

                  {filteredTxs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.disabled">Nessuna transazione trovata.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ── Tab 1: Lotti pendenti ───────────────────────────────────────────── */}
      {tab === 1 && (
        pendingLots.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <VerifiedOutlined sx={{ fontSize: 48, color: '#16a34a', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Tutti i lotti sono stati registrati su blockchain.</Typography>
          </Box>
        ) : (
          <Card variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell><Typography variant="caption" fontWeight={600}>Lotto</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Fornitore</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>DF-free</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>Rischio</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>Score</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Data raccolta</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={600}>Azione</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingLots.map(lot => {
                    const supplier = supplierById.get(lot.supplierId)
                    const isSubmitting = submitting === lot.id
                    const dfFree = isDfFree(lot)
                    const nonCompliantReason = !lot.deforestationFreeProof
                      ? 'Prova mancante'
                      : lot.deforestationDetected
                        ? 'Deforestazione rilevata'
                        : null

                    return (
                      <TableRow
                        key={lot.id}
                        sx={{
                          '&:hover': { bgcolor: '#f9fafb' },
                          bgcolor: !dfFree ? '#fff5f5' : 'transparent',
                        }}
                      >
                        <TableCell>
                          <Stack>
                            <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                              {lot.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {COMMODITY_IT[lot.commodity]}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{supplier?.name ?? '—'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {dfFree
                            ? <Chip size="small" label="Conforme" color="success" icon={<CheckCircleOutlined />} />
                            : (
                              <Tooltip title={nonCompliantReason ?? ''}>
                                <Chip size="small" label="Non conforme" color="error" icon={<LockOutlined />} />
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="center">
                          {dfFree ? <RiskBadge level={lot.riskLevel} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell align="center">
                          {dfFree
                            ? <Typography variant="caption" fontWeight={700}>{lot.riskScore}/100</Typography>
                            : <Typography variant="caption" color="text.disabled">—</Typography>
                          }
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{lot.harvestDate}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {isSubmitting ? (
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                              <CircularProgress size={14} />
                              <Typography variant="caption" color="text.secondary">Invio…</Typography>
                            </Stack>
                          ) : !dfFree ? (
                            <Tooltip title={`Lotto non DF-free (${nonCompliantReason}): verrà bloccato automaticamente`}>
                              <span>
                                <Chip
                                  size="small"
                                  label="Registra — bloccato"
                                  icon={<LockOutlined />}
                                  color="error"
                                  variant="outlined"
                                  onClick={() => handleSubmit(lot, 'blocked')}
                                  sx={{ cursor: 'pointer' }}
                                />
                              </span>
                            </Tooltip>
                          ) : (
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Chip
                                size="small"
                                label="Certifica"
                                icon={<VerifiedOutlined />}
                                color="success"
                                onClick={() => handleSubmit(lot, 'certified')}
                                sx={{ cursor: 'pointer' }}
                              />
                              <Chip
                                size="small"
                                label="Blocca"
                                icon={<LockOutlined />}
                                color="error"
                                variant="outlined"
                                onClick={() => handleSubmit(lot, 'blocked')}
                                sx={{ cursor: 'pointer' }}
                              />
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )
      )}

      {/* ── Tab 2: Alert blocchi ────────────────────────────────────────────── */}
      {tab === 2 && (
        blockedTxs.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CheckCircleOutlined sx={{ fontSize: 48, color: '#16a34a', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Nessun lotto bloccato registrato.</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            <Alert severity="error" icon={<ErrorOutlined />}>
              <Typography variant="body2" fontWeight={600}>
                {blockedTxs.length} lott{blockedTxs.length === 1 ? 'o' : 'i'} bloccati dalla rete Polygon.
              </Typography>
              <Typography variant="caption">
                I fornitori associati sono stati sospesi automaticamente. Le transazioni di blocco sono immutabili e visibili su PolygonScan.
              </Typography>
            </Alert>

            {blockedTxs.map(tx => {
              const lot = lotById.get(tx.lotId)
              const supplier = lot ? supplierById.get(lot.supplierId) : undefined

              return (
                <Card
                  key={tx.txHash}
                  variant="outlined"
                  sx={{ borderLeft: '4px solid #dc2626' }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LockOutlined sx={{ color: '#dc2626', fontSize: 18 }} />
                            <Typography variant="subtitle2" fontWeight={700}>{tx.lotId}</Typography>
                            <Chip size="small" label={lot ? COMMODITY_IT[lot.commodity] : '—'} />
                          </Stack>
                          <Stack spacing={0.5}>
                            {[
                              { label: 'Fornitore', value: supplier?.name ?? '—' },
                              { label: 'Score rischio', value: `${tx.riskScore}/100 — Alto rischio` },
                              { label: 'Data valutazione', value: tx.date },
                              { label: 'Bloccato il', value: new Date(tx.submittedAt).toLocaleString('it-IT') },
                              { label: 'Fornitore sospeso', value: supplier?.suspended ? 'Sì' : 'No' },
                            ].map(r => (
                              <Stack key={r.label} direction="row" spacing={1}>
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130 }}>{r.label}</Typography>
                                <Typography variant="caption" fontWeight={500}>{r.value}</Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Stack>
                      </Grid>

                      <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                          Transaction Hash
                        </Typography>
                        <HashCell hash={tx.txHash} full />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                          Firma SHA-256
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 11, color: '#374151' }}
                        >
                          {tx.signature}
                        </Typography>
                        <Box sx={{ mt: 1.5 }}>
                          <Link
                            href={`${POLYGONSCAN}/${tx.txHash}`}
                            target="_blank"
                            rel="noopener"
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}
                          >
                            <OpenInNewOutlined sx={{ fontSize: 14 }} />
                            Verifica su PolygonScan
                          </Link>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )
      )}
    </Box>
  )
}
