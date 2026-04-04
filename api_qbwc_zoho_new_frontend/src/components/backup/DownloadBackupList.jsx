import React, { useState, useEffect } from 'react'
import { Home, Download, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import axios from 'axios'
import { stableSort, getComparatorUndefined, fetchWithToken, apiUrl } from '@/lib/utils'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import NavigationRightButton from '@/components/shared/NavigationRightButton'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
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

const DownloadBackupList = () => {
  const [backups, setBackups] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(numberRows)
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)

  useEffect(() => {
    const handleStorageChange = () => {
      setSearchTerm(localStorage.getItem('searchTermGlobal') || '')
    }
    window.addEventListener('storage', handleStorageChange)

    const fetchData = async () => {
      try {
        const response = await fetchWithToken(`${apiUrl}/download_backup_db/`, 'GET', null, {}, apiUrl)
        setBackups(response.data.backups)
      } catch (err) {
        console.error('Error fetching backups:', err)
      }
    }
    fetchData()

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [searchTerm])

  const downloadBackup = (item) => {
    const filename = item.file_name
    axios({
      url: `${apiUrl}/backup/${filename}`,
      method: 'GET',
      responseType: 'blob',
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
    })
  }

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

  const filteredItems = backups.filter(
    (item) =>
      item.date_time.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'date_time', label: 'Date & Time' },
    { id: 'type', label: 'Type' },
    { id: 'size', label: 'Size' },
    { id: 'actions', label: 'Actions' },
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
        <h6 className="text-base font-bold uppercase text-[#212529] ml-1">DB BackUps</h6>
        <NavigationRightButton items={navItems} />
      </div>
      <div className="w-full mb-2">
        <Alert>
          <AlertDescription>There are {filteredItems.length} items found.</AlertDescription>
        </Alert>
      </div>

      <div className="overflow-x-auto w-full">
        <Table id="myTable" aria-label="backups table">
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
            {filteredItems.length === 0 ? (
              <EmptyRecordsCell colSpan={columns.length} />
            ) : (
              (rowsPerPage > 0
                ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : sortedItems
              ).map((item, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF',
                  }}
                  onMouseEnter={() => setHoveredRowIndex(index)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                >
                  <TableCell className="w-[40%] max-w-[30%] overflow-hidden text-ellipsis">
                    {item.date_time}
                  </TableCell>
                  <TableCell className="w-[30%] max-w-[30%] overflow-hidden text-ellipsis">
                    {item.file_type}
                  </TableCell>
                  <TableCell className="w-[20%] max-w-[20%] overflow-hidden text-ellipsis">
                    {item.size}
                  </TableCell>
                  <TableCell className="w-[10%] max-w-[10%] overflow-hidden text-ellipsis">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadBackup(item)}
                      title={`DOWNLOAD BACKUP: ${item.date_time}`}
                      aria-label={`Download backup ${item.date_time}`}
                    >
                      <Download size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableCustomPagination
              colSpan={columns.length}
              data={filteredItems}
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

export default DownloadBackupList
