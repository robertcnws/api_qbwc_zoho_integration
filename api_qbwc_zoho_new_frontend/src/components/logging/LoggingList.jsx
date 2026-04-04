import React, { useEffect, useState } from 'react'
import { Home, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { stableSort, getComparatorUndefined } from '@/lib/utils'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import NavigationRightButton from '@/components/shared/NavigationRightButton'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

const numberRows = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10

const SortableHeader = ({ col, label, orderBy, order, onSort }) => (
  <TableHead
    className="cursor-pointer select-none bg-[#F9F9FB] text-xs font-bold text-muted-foreground uppercase"
    onClick={() => onSort(col)}
  >
    <div className="flex items-center gap-1">
      {label}
      {orderBy === col ? (
        order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ArrowUpDown size={12} className="opacity-30" />
      )}
    </div>
  </TableHead>
)

const LoggingList = ({ logs }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(numberRows)
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '')
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)

  useEffect(() => {
    const handleStorageChange = () => {
      setSearchTerm(localStorage.getItem('searchTermGlobal') || '')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [searchTerm])

  const handleSortChange = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(columnId)
  }

  const handleChangePage = (newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (value) => {
    setRowsPerPage(parseInt(value, 10))
    setPage(0)
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.log_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.log_action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.log_pc_ip.includes(searchTerm.toLowerCase()) ||
      log.log_message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedLogs = stableSort(filteredLogs, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'user', label: 'User' },
    { id: 'action', label: 'Action' },
    { id: 'pc_ip', label: 'IP PC' },
    { id: 'message', label: 'Message' },
    { id: 'last_date_modified', label: 'Last Date Action' },
  ]

  const navItems = [
    {
      label: 'Back to Integration',
      icon: <Home size={16} className="mr-1" />,
      route: '/integration',
      visible: true,
    },
  ]

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h6 className="text-base font-bold uppercase text-[#212529] ml-1">Logs List</h6>
        <NavigationRightButton items={navItems} />
      </div>
      <div className="w-full mb-2">
        <Alert>
          <AlertDescription>There are {filteredLogs.length} logs found.</AlertDescription>
        </Alert>
      </div>

      <div className="overflow-x-auto w-full">
        <Table id="myTable" aria-label="logs table">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <SortableHeader
                  key={column.id}
                  col={column.id}
                  label={column.label}
                  orderBy={orderBy}
                  order={order}
                  onSort={handleSortChange}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <EmptyRecordsCell colSpan={columns.length} />
            ) : (
              (rowsPerPage > 0
                ? sortedLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : sortedLogs
              ).map((log, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF',
                  }}
                  onMouseEnter={() => setHoveredRowIndex(index)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                >
                  <TableCell>{log.log_user}</TableCell>
                  <TableCell>{log.log_action}</TableCell>
                  <TableCell>{log.log_pc_ip}</TableCell>
                  <TableCell>{log.log_message}</TableCell>
                  <TableCell>{log.log_modified}</TableCell>
                </TableRow>
              ))
            )}
            <TableCustomPagination
              colSpan={columns.length}
              data={filteredLogs}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LoggingList
