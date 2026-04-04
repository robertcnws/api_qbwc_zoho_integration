import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWithToken, apiUrl, stableSort, getComparatorUndefined } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import CustomFilter from '@/components/shared/CustomFilter'
import NavigationRightButton from '@/components/shared/NavigationRightButton'
import { ArrowUp, ArrowDown, ArrowUpDown, Ban, Wallet } from 'lucide-react'
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

const QbwcCustomersList = ({ customers, onSyncComplete }) => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '')
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')
  const [filter, setFilter] = useState('all')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)

  useEffect(() => {
    const handleStorage = () => setSearchTerm(localStorage.getItem('searchTermGlobal') || '')
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleFilterChange = event => {
    setFilter(event.target.value)
    setPage(0)
  }

  const handleSortChange = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(columnId)
  }

  const handleChangePage = (newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (rows) => {
    setRowsPerPage(rows)
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

  const configCustomFilter = {
    filter: filter,
    handleFilterChange: handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Customers' },
      { value: 'matched', label: 'Matched Customers' },
      { value: 'not_matched', label: 'Unmatched Customers' }
    ],
    hasSearch: false
  }

  const renderForceSyncCheckbox = (customer, selected) => {
    if (filter !== 'matched') {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            className="border-yellow-500 data-[state=checked]:bg-yellow-500"
            checked={selected}
            onCheckedChange={() => handleCheckboxClick(customer.fields.list_id)}
          />
          <span className="text-yellow-600 text-sm">Never match?</span>
        </div>
      )
    } else {
      return <span className="text-green-600 text-sm font-medium">Matched</span>
    }
  }

  const handleNeverMatchCustomers = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer.')
      return
    }
    const confirmed = window.confirm('Do you want to never match selected customers?')
    if (!confirmed) return
    try {
      const url = `${apiUrl}/api_quickbook_soap/never_match_customers_ajax/`
      const body = {
        customers: selectedCustomers,
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

  const filteredCustomers = customers.filter(customer => {
    const search = customer.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.fields.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.fields.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.fields.list_id.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'all') return search
    if (filter === 'matched') return search && customer.fields.matched
    if (filter === 'not_matched') return search && !customer.fields.matched
    return false
  })

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
      label: 'Never Match Selected',
      icon: <Ban size={16} className="mr-1" />,
      onClick: handleNeverMatchCustomers,
      visibility: filter !== 'matched' && selectedCustomers.length > 0
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center mb-3">
        <div className="w-full max-w-[280px]">
          <CustomFilter config={configCustomFilter} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <NavigationRightButton children={childrenNavigationRightButton} />
        </div>
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
                  onClick={() => navigate('/integration/qbwc/customer_details', {
                    state: { customer, customers: sortedCustomers, filter }
                  })}
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

export default QbwcCustomersList
