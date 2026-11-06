import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'

type Status = 'ok' | 'warning' | 'error'

interface StatusIconProps {
  status: Status
  fontSize?: 'small' | 'medium' | 'large'
}

export default function StatusIcon({ status, fontSize = 'medium' }: StatusIconProps) {
  if (status === 'ok')      return <CheckCircleOutlinedIcon color="success" fontSize={fontSize} />
  if (status === 'warning') return <ReportProblemOutlinedIcon color="warning" fontSize={fontSize} />
  return <ErrorOutlinedIcon color="error" fontSize={fontSize} />
}
