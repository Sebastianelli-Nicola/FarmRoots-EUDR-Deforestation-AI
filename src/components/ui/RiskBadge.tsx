import { Box, Typography } from '@mui/material'
import type { RiskLevel } from '../../types/lot'

const CONFIG: Record<RiskLevel, { label: string; bg: string; color: string; dot: string; border: string }> = {
  green: {
    label:  'Basso rischio',
    bg:     'rgba(5,150,105,0.08)',
    color:  '#065f46',
    dot:    '#059669',
    border: 'rgba(5,150,105,0.22)',
  },
  amber: {
    label:  'Medio rischio',
    bg:     'rgba(217,119,6,0.08)',
    color:  '#92400e',
    dot:    '#d97706',
    border: 'rgba(217,119,6,0.25)',
  },
  red: {
    label:  'Alto rischio',
    bg:     'rgba(225,29,72,0.07)',
    color:  '#9f1239',
    dot:    '#e11d48',
    border: 'rgba(225,29,72,0.22)',
  },
}

interface RiskBadgeProps {
  level: RiskLevel
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const c = CONFIG[level]
  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.6,
      px: 1,
      py: 0.3,
      borderRadius: 99,
      bgcolor: c.bg,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot, flexShrink: 0 }} />
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color: c.color, lineHeight: 1.4, fontSize: '0.7rem', letterSpacing: '0.01em' }}
      >
        {c.label}
      </Typography>
    </Box>
  )
}
