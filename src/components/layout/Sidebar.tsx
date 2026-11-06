import { useLocation, Link } from 'react-router-dom'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Chip,
} from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import { useUiStore } from '../../stores/uiStore'

const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  path: string
  end?: boolean
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',           path: '/',              end: true, icon: <DashboardOutlinedIcon /> },
  { label: 'Fornitori',           path: '/suppliers',               icon: <BusinessOutlinedIcon /> },
  { label: 'Valutazione Rischio', path: '/risk',                    icon: <AssessmentOutlinedIcon /> },
  { label: 'Due Diligence',       path: '/due-diligence',           icon: <DescriptionOutlinedIcon /> },
  { label: 'Blockchain',          path: '/blockchain',              icon: <LinkOutlinedIcon /> },
]

const PAPER_SX = {
  width: DRAWER_WIDTH,
  background: 'linear-gradient(180deg, #080e1a 0%, #0f172a 50%, #0c1522 100%)',
  color: 'common.white',
  borderRight: 'none',
  overflowX: 'hidden',
}

function DrawerContent() {
  const { pathname } = useLocation()

  const deadline = new Date('2026-12-30')
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86_400_000))
  const isUrgent = daysLeft < 365

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 2, flexShrink: 0,
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            boxShadow: '0 0 20px rgba(5,150,105,0.5), 0 2px 8px rgba(0,0,0,0.4)',
          }}>
            <AgricultureIcon fontSize="small" sx={{ color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              fontWeight={800} color="common.white" lineHeight={1.1}
              sx={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}
            >
              Farm Roots
            </Typography>
            <Typography sx={{ color: '#475569', fontSize: '0.67rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              EUDR Platform
            </Typography>
          </Box>
        </Box>

        {/* Deadline counter */}
        <Box sx={{
          mt: 2, px: 1.5, py: 1, borderRadius: 2,
          background: isUrgent
            ? 'linear-gradient(135deg, rgba(217,119,6,0.16) 0%, rgba(217,119,6,0.04) 100%)'
            : 'rgba(15,23,42,0.6)',
          border: isUrgent ? '1px solid rgba(217,119,6,0.3)' : '1px solid rgba(30,41,59,0.9)',
        }}>
          <Typography sx={{ color: '#475569', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>
            Scadenza EUDR
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.25 }}>
            <Typography fontWeight={800} sx={{
              color: isUrgent ? '#fbbf24' : '#94a3b8',
              fontSize: '1.5rem', lineHeight: 1, letterSpacing: '-0.03em',
            }}>
              {daysLeft}
            </Typography>
            <Typography sx={{ color: isUrgent ? '#d97706' : '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
              giorni
            </Typography>
          </Box>
          <Typography sx={{ color: '#334155', fontSize: '0.62rem' }}>
            30 Dic 2026
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(30,41,59,0.9)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ flex: 1, px: 1.5, py: 1.5 }} disablePadding>
        {NAV_ITEMS.map((item) => {
          const active = item.end ? pathname === item.path : pathname.startsWith(item.path)
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={active}
              sx={{
                borderRadius: 2,
                mb: 0.5, px: 1.5, py: 0.875,
                color: active ? '#ffffff' : '#64748b',
                background: active
                  ? 'linear-gradient(135deg, rgba(5,150,105,0.85) 0%, rgba(13,148,136,0.8) 100%)'
                  : 'transparent',
                boxShadow: active
                  ? '0 2px 12px rgba(5,150,105,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : 'none',
                border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid transparent',
                '&:hover': {
                  background: active
                    ? 'linear-gradient(135deg, rgba(5,150,105,0.92) 0%, rgba(13,148,136,0.88) 100%)'
                    : 'rgba(30,41,59,0.8)',
                  color: '#e2e8f0',
                },
                '&.Mui-selected': { bgcolor: 'transparent' },
                '&.Mui-selected:hover': { bgcolor: 'transparent' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: 'inherit', opacity: active ? 1 : 0.55 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    variant: 'body2',
                    fontWeight: active ? 700 : 400,
                    sx: { fontSize: '0.81rem', letterSpacing: active ? '-0.005em' : 0 },
                  },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(30,41,59,0.9)', mx: 2 }} />

      {/* Footer */}
      <Box sx={{ px: 2, py: 2 }}>
        <Chip
          label="Reg. (EU) 2023/1115"
          size="small"
          sx={{
            bgcolor: 'transparent',
            color: '#334155',
            border: '1px solid rgba(30,41,59,0.9)',
            fontSize: '0.6rem',
            height: 20,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        />
      </Box>
    </Box>
  )
}

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore()

  return (
    <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={toggleSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': PAPER_SX }}
      >
        <DrawerContent />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', lg: 'block' }, '& .MuiDrawer-paper': PAPER_SX }}
        open
      >
        <DrawerContent />
      </Drawer>
    </Box>
  )
}
