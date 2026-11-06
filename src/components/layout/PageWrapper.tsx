import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface PageWrapperProps {
  children: React.ReactNode
}

const DRAWER_WIDTH = 240

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      {/* Content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Topbar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 3,
            background: 'linear-gradient(160deg, #f1f5f9 0%, #f8fafc 60%, #f0f4f8 100%)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
