import { TableRow, TableCell, Skeleton } from '@mui/material'

interface SkeletonRowProps {
  cols?: number
}

export default function SkeletonRow({ cols = 4 }: SkeletonRowProps) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton animation="wave" />
        </TableCell>
      ))}
    </TableRow>
  )
}
