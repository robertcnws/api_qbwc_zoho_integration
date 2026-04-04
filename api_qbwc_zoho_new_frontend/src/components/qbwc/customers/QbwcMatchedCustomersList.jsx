import React, { useState } from 'react'
import { fetchWithToken, apiUrl, stableSort, getComparatorUndefined } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
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

const QbwcMatchedCustomersList = ({ matchedCustomers, onSyncComplete }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')

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

  const handleUnMatchCustomer = (customer) => {
    const confirmed = window.confirm('Do you want to unmatch this customer?')
    if (!confirmed) return
    const unmatchOneCustomerAjax = async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/match_one_customer_ajax/`
        const data = {
          contact_id: customer.zoho_customer_id,
          qb_customer_list_id: customer.qb_customer_list_id,
          action: 'unmatch',
          username: localStorage.getItem('username'),
        }
        const response = await fetchWithToken(url, 'POST', data, {}, apiUrl)
        if (response.data.status === 'success') {
          toast.success(response.data.message)
          onSyncComplete()
        } else {
          toast.error(response.data.message)
        }
      } catch (error) {
        console.error('Error unmatching customer:', error)
        toast.error(`Error unmatching customer: ${error}`)
      }
    }
    unmatchOneCustomerAjax()
  }

  const filteredCustomers = matchedCustomers.filter(customer =>
    customer.qb_customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.zoho_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.zoho_customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.zoho_customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.zoho_customer_company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedCustomers = stableSort(filteredCustomers, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'qb_customer', label: 'QB Customer' },
    { id: 'zoho_customer', label: 'Zoho Customer' },
    { id: 'actions', label: 'Actions' }
  ]

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-bold uppercase text-blue-600">
          QB Matched Customers List
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
      <div className="mb-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
        There are {filteredCustomers.length} matched customers found.
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
                <TableRow key={index}>
                  <TableCell>{customer.qb_customer_name}</TableCell>
                  <TableCell>
                    {customer.zoho_customer}<br />
                    (Email: {customer.zoho_customer_email && customer.zoho_customer_email.length > 0 ? customer.zoho_customer_email : '---'})<br />
                    (Phone: {customer.zoho_customer_phone && customer.zoho_customer_phone.length > 0 ? customer.zoho_customer_phone : '---'})<br />
                    (Company: {customer.zoho_customer_company && customer.zoho_customer_company.length > 0 ? customer.zoho_customer_company : '---'})
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      onClick={() => handleUnMatchCustomer(customer)}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                    >
                      UnMatch
                    </Button>
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

export default QbwcMatchedCustomersList
