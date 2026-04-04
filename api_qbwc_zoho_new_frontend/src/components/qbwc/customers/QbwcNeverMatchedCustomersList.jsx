import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl, stableSort, getComparatorUndefined } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import NavigationRightButton from '@/components/shared/NavigationRightButton'
import { ArrowUp, ArrowDown, ArrowUpDown, Undo2, Wallet } from 'lucide-react'
import { toast } from 'sonner'

const SortableHeader = ({ col, label, orderBy, order, onSort }) => (
  <TableHead
    className="cursor-pointer select-none bg-[#F9F9FB] text-xs font-bold uppercase text-muted-foreground"
    onClick={() => onSort(col)}
  >
    <div className="flex items-center gap-1">
      {label}
      {orderBy === col ? (order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
    </div>
  </TableHead>
)

const QbwcNeverMatchedCustomersList = ({ customers, onSyncComplete }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '')
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)

  useEffect(() => {
    const handleStorage = () => setSearchTerm(localStorage.getItem('searchTermGlobal') || '')
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleSortChange = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(columnId)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const isSelected = (customerId) => selectedCustomers.indexOf(customerId) !== -1

  const handleCheckboxClick = (customerId) => {
    const selectedIndex = selectedCustomers.indexOf(customerId)
    let newSelected = []
    if (selectedIndex === -1) {
      newSelected = [...selectedCustomers, customerId]
    } else {
      newSelected = selectedCustomers.filter((id) => id !== customerId)
    }
    setSelectedCustomers(newSelected)
  }

  const renderForceSyncCheckbox = (customer, selected) => {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          className="border-green-500 data-[state=checked]:bg-green-500"
          checked={selected}
          onCheckedChange={() => handleCheckboxClick(customer.fields.list_id)}
        />
        <span className="text-green-600 text-sm">Undo never match?</span>
      </div>
    )
  }

  const handleNeverMatchCustomers = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer.')
      return
    }
    const confirmed = window.confirm('Do you want to recover selected customers?')
    if (!confirmed) return
    try {
      const url = `${apiUrl}/api_quickbook_soap/never_match_customers_ajax/`
      const body = {
        customers: selectedCustomers,
        to_match: true,
        username: localStorage.getItem('username')
      }
      const response = await fetchWithToken(url, 'POST', body, {}, apiUrl)
      if (response.data.message === 'error') {
        toast.error(response.data.error)
        return
      } else if (response.data.message === 'success') {
        toast.success('Selected customers have been marked as never match.')
        setSelectedCustomers([])
        onSyncComplete()
      }
    } catch (error) {
      toast.error('There was an error marking customers as never match.')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.fields.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.fields.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.fields.list_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedCustomers = stableSort(filteredCustomers, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'qb_customer', label: 'QB Customer', colspan: 1, textAlign: 'left' },
    { id: 'qb_email', label: 'QB Email', colspan: 1, textAlign: 'left' },
    { id: 'qb_phone', label: 'QB Phone', colspan: 1, textAlign: 'left' },
    { id: 'qb_list_id', label: 'QB List ID', colspan: 1, textAlign: 'left' },
    { id: 'actions', label: 'Actions', colspan: 1, textAlign: 'center' }
  ]

  const childrenNavigationRightButton = [
    {
      label: 'Undo Never Match',
      icon: <Undo2 size={16} className="mr-1" />,
      onClick: handleNeverMatchCustomers,
      visibility: selectedCustomers.length > 0
    },
    {
      label: 'Back to QBWC',
      icon: <Wallet size={16} className="mr-1" />,
      route: '/integration/qbwc',
      visibility: true
    }
  ]

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-base font-bold uppercase text-gray-800">
          QB Never Matched Customers List
        </h2>
        <div className="flex items-center justify-end gap-2">
          <NavigationRightButton children={childrenNavigationRightButton} />
        </div>
      </div>
      <div className="mb-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
        There are {filteredCustomers.length} never matched customers found.
      </div>
      <div className="overflow-x-auto w-full">
        <Table id="myTable" aria-label="customers table">
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
            {filteredCustomers.length === 0 ? (
              <EmptyRecordsCell columns={columns} />
            ) : (
              (rowsPerPage > 0
                ? sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : sortedCustomers
              ).map((customer, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer transition-colors"
                  style={{ backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF' }}
                  onMouseEnter={() => setHoveredRowIndex(index)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                >
                  <TableCell>{customer.fields.name}</TableCell>
                  <TableCell>{customer.fields.email}</TableCell>
                  <TableCell>{customer.fields.phone}</TableCell>
                  <TableCell>{customer.fields.list_id}</TableCell>
                  <TableCell className="text-center">
                    {renderForceSyncCheckbox(customer, isSelected(customer.fields.list_id))}
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableCustomPagination
              columnsLength={columns.length}
              data={filteredCustomers}
              page={page}
              rowsPerPage={rowsPerPage}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default QbwcNeverMatchedCustomersList
