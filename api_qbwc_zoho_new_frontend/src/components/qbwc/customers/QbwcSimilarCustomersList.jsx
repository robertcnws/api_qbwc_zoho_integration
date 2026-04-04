import React, { useState } from 'react'
import { fetchWithToken, apiUrl, stableSort, getComparatorUndefined } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import NavigationRightButton from '@/components/shared/NavigationRightButton'
import { ArrowUp, ArrowDown, ArrowUpDown, Wallet, Users } from 'lucide-react'
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

const QbwcSimilarCustomersList = ({ similarCustomers, onSyncComplete }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('qb_customer_name')
  const [order, setOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)

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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const matchRow = (qb_customer_list_id, zoho_customer_id) => {
    const confirmed = window.confirm('Do you want to match this customer?')
    if (!confirmed) return
    const matchOneCustomerAjax = async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/match_one_customer_ajax/`
        const body = {
          qb_customer_list_id: qb_customer_list_id,
          contact_id: zoho_customer_id,
          action: 'match',
          username: localStorage.getItem('username')
        }
        const response = await fetchWithToken(url, 'POST', body, {}, apiUrl)
        if (response.status === 200) {
          toast.success('Customer has been matched.')
          onSyncComplete()
        } else {
          toast.error(`Error matching customers for the customer: ${response.message}`)
        }
      } catch (error) {
        toast.error(`Error matching customers for the customer: ${error}`)
      }
    }
    matchOneCustomerAjax()
  }

  const columns = [
    { id: 'qb_customer_name', label: 'QB Customer' },
    { id: 'qb_email', label: 'QB Email' },
    { id: 'qb_phone', label: 'QB Phone' },
    { id: 'zoho_customers', label: 'Zoho Customers' },
    { id: 'zoho_email_match', label: 'Zoho Email Match' },
    { id: 'zoho_phone_match', label: 'Zoho Phone Match' },
    { id: 'actions', label: 'Actions' }
  ]

  const filteredCustomers = similarCustomers.filter(customer =>
    customer.qb_customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.qb_customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.qb_customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.coincidences_by_order.some(coincidence =>
      coincidence.zoho_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coincidence.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coincidence.phone.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const renderTableRows = (customers) => {
    return customers.map((customer, index) => (
      customer.coincidences_by_order ? customer.coincidences_by_order.map((coincidence, subIndex) => (
        <TableRow
          key={`${index}-${subIndex}`}
          className="cursor-pointer transition-colors"
          style={{
            backgroundColor: hoveredRowIndex === `${index}-${subIndex}` ? '#f8d7da' : '#FFFFFF'
          }}
          onMouseEnter={() => setHoveredRowIndex(`${index}-${subIndex}`)}
          onMouseLeave={() => setHoveredRowIndex(null)}
        >
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }}>
            {customer.qb_customer_name}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }}>
            {customer.qb_customer_email}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }}>
            {customer.qb_customer_phone}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }}>
            Name: <b>{coincidence.zoho_customer}</b><br />
            Company Name: <b>{coincidence.zoho_company_name ? `${coincidence.zoho_company_name}` : '---'}</b><br />
            (ID: <b>{coincidence.zoho_customer_id}</b>)
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }}>
            {coincidence.email ? (
              <>
                {coincidence.email} <br /> (Match: {coincidence.coincidence_email})
              </>
            ) : (
              '---'
            )}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }}>
            {coincidence.phone ? (
              <>
                {coincidence.phone} <br /> (Match: {coincidence.coincidence_phone})
              </>
            ) : (
              '---'
            )}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '#FFFFFF' }} className="text-center">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={() => matchRow(customer.qb_customer_list_id, coincidence.zoho_customer_id)}
            >
              Match
            </Button>
          </TableCell>
        </TableRow>
      )) : null
    ))
  }

  const sortedCustomers = stableSort(filteredCustomers, getComparatorUndefined(order, orderBy))
  const paginatedCustomers = sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const childrenNavigationRightButton = [
    {
      label: 'Matched Customers',
      icon: <Users size={16} className="mr-1" />,
      route: '/integration/qbwc/customers/matched',
      visibility: true
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-bold uppercase text-blue-600">
          QB Similar Customers
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <NavigationRightButton children={childrenNavigationRightButton} />
        </div>
      </div>
      <div className="mb-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
        There are {filteredCustomers.length} customers found.
      </div>
      <div className="overflow-x-auto w-full">
        <Table id="myTable" aria-label="similar customers table">
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
              renderTableRows(paginatedCustomers)
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

export default QbwcSimilarCustomersList
