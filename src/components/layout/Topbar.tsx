import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import {
  AppBar, Toolbar, Typography, Box, IconButton, Stack,
} from '@mui/material'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import { useUiStore } from '../../stores/uiStore'

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/':              { title: 'Dashboard',              sub: 'Panoramica compliance EUDR' },
  '/suppliers':     { title: 'Fornitori',              sub: 'Gestione e monitoraggio supply chain' },
  '/risk':          { title: 'Valutazione del Rischio', sub: 'Analisi 14 criteri EUDR + previsioni' },
  '/due-diligence': { title: 'Due Diligence',          sub: 'Dichiarazioni Art. 4 Reg. (EU) 2023/1115' },
  '/blockchain':    { title: 'Registro Blockchain',    sub: 'Certificazioni immutabili su Polygon' },
}

export default function Topbar() {
  const { pathname } = useLocation()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  const page = PAGE_TITLES[pathname] ?? { title: 'EUDR Platform', sub: '' }
  const today = format(new Date(), 'dd/MM/yyyy')

  return (
    <AppBar position="static">
      <Toolbar sx={{ minHeight: '56px !important', px: { xs: 2, lg: 3 } }}>
        <IconButton
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 1.5, display: { lg: 'none' }, color: 'text.secondary' }}
          aria-label="Apri menu"
        >
          <MenuOutlinedIcon />
        </IconButton>

        {/* Page title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            color="text.primary"
            lineHeight={1.15}
            sx={{ letterSpacing: '-0.01em' }}
          >
            {page.title}
          </Typography>
          {page.sub && (
            <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' }, letterSpacing: '0.01em' }}>
              {page.sub}
            </Typography>
          )}
        </Box>

        {/* Right side */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Live status dot */}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%', bgcolor: '#059669',
              boxShadow: '0 0 0 2px rgba(5,150,105,0.25)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 2px rgba(5,150,105,0.25)' },
                '50%': { boxShadow: '0 0 0 4px rgba(5,150,105,0.1)' },
                '100%': { boxShadow: '0 0 0 2px rgba(5,150,105,0.25)' },
              },
            }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#059669', fontSize: '0.72rem' }}>
              Live
            </Typography>
          </Stack>

          {/* Divider */}
          <Box sx={{ width: 1, height: 20, bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />

          {/* Date */}
          <Typography
            variant="caption"
            fontWeight={500}
            color="text.disabled"
            sx={{ fontFamily: 'monospace', fontSize: '0.75rem', display: { xs: 'none', sm: 'block' } }}
          >
            {today}
          </Typography>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
