import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TableCustomPagination = ({
  colSpan, columnsLength,
  data = [], page,
  rowsPerPage = 10,
  onPageChange, handleChangePage,
  onRowsPerPageChange, handleChangeRowsPerPage
}) => {
  const span = colSpan ?? columnsLength ?? 5
  const changePage = onPageChange ?? handleChangePage
  const changeRowsPerPage = onRowsPerPageChange ?? handleChangeRowsPerPage
  const total = data.length
  const totalPages = Math.ceil(total / rowsPerPage)
  const start = total > 0 ? page * rowsPerPage + 1 : 0
  const end = Math.min((page + 1) * rowsPerPage, total)

  return (
    <TableRow>
      <TableCell colSpan={span} className="py-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => changeRowsPerPage(parseInt(v, 10))}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{total > 0 ? `${start}–${end} of ${total}` : '0 records'}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page === 0}
              onClick={() => changePage(page - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => changePage(page + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

export { TableCustomPagination }
export default TableCustomPagination
