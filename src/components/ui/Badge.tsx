import { Chip } from '@mui/material'

type BadgeVariant = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'indigo'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
}

const colorMap: Record<BadgeVariant, 'success' | 'warning' | 'error' | 'default' | 'info' | 'primary'> = {
  green:  'success',
  amber:  'warning',
  red:    'error',
  gray:   'default',
  blue:   'info',
  indigo: 'primary',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <Chip
      label={children}
      color={colorMap[variant]}
      size="small"
    />
  )
}
