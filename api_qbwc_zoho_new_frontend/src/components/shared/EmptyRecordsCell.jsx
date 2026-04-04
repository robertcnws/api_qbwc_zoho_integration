import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'

const EmptyRecordsCell = ({ colSpan = 5 }) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">
        No records found
      </TableCell>
    </TableRow>
  )
}

export { EmptyRecordsCell }
export default EmptyRecordsCell
