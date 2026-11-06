import { createTheme, alpha } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#059669',
      dark: '#047857',
      light: '#34d399',
      contrastText: '#ffffff',
    },
    error:   { main: '#e11d48', light: '#fda4af', dark: '#9f1239' },
    warning: { main: '#d97706', light: '#fcd34d', dark: '#92400e' },
    success: { main: '#059669', light: '#6ee7b7', dark: '#065f46' },
    background: {
      default: '#f1f5f9',
      paper:   '#ffffff',
    },
    text: {
      primary:   '#0f172a',
      secondary: '#64748b',
      disabled:  '#94a3b8',
    },
    divider: 'rgba(226,232,240,0.8)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: '0.005em' },
    caption: { letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 99 },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          '&:not(.MuiDrawer-paper):not(.MuiDialog-paper):not(.MuiPopover-paper):not(.MuiMenu-paper)': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(241,245,249,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#0f172a',
          borderBottom: '1px solid rgba(226,232,240,0.9)',
          boxShadow: 'none',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { borderRadius: 0 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            fontSize: '0.67rem',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: '#94a3b8',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { transition: 'background-color 0.12s ease' },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:last-child .MuiTableCell-root': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, letterSpacing: '0.01em' },
        sizeSmall: { height: 22, fontSize: '0.7rem' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: '#f1f5f9' },
        bar:  { borderRadius: 99 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
        standardSuccess: { backgroundColor: alpha('#059669', 0.06), border: `1px solid ${alpha('#059669', 0.2)}` },
        standardError:   { backgroundColor: alpha('#e11d48', 0.05), border: `1px solid ${alpha('#e11d48', 0.2)}` },
        standardWarning: { backgroundColor: alpha('#d97706', 0.05), border: `1px solid ${alpha('#d97706', 0.2)}` },
        standardInfo:    { backgroundColor: alpha('#0284c7', 0.05), border: `1px solid ${alpha('#0284c7', 0.2)}` },
        outlinedError:   { borderColor: alpha('#e11d48', 0.4) },
        outlinedWarning: { borderColor: alpha('#d97706', 0.4) },
      },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          '& + &': { marginTop: 8 },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
          fontSize: '0.875rem',
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: '3px 3px 0 0' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          fontSize: '0.72rem',
          fontWeight: 500,
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
          padding: '5px 9px',
        },
        arrow: { color: '#0f172a' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid rgba(226,232,240,0.6)',
          boxShadow: '0 25px 50px rgba(15,23,42,0.15)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(226,232,240,0.8)' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
})

export default theme
