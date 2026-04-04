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

const QbwcMatchedItemsList = ({ matchedItems, onSyncComplete }) => {
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

  const handleUnMatchItem = (item) => {
    const confirmed = window.confirm('Do you want to unmatch this item?')
    if (!confirmed) return
    const unmatchOneItemAjax = async () => {
      try {
        const url = `${apiUrl}/api_zoho_items/match_one_item_ajax/`
        const data = {
          item_id: item.zoho_item_id,
          qb_item_list_id: item.qb_item_list_id,
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
        console.error('Error unmatching item:', error)
        toast.error(`Error unmatching item: ${error}`)
      }
    }
    unmatchOneItemAjax()
  }

  const filteredItems = matchedItems.filter(item =>
    item.qb_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zoho_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zoho_item_sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'qb_item', label: 'QB Item' },
    { id: 'zoho_item', label: 'Zoho Item' },
    { id: 'actions', label: 'Actions' }
  ]

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-bold uppercase text-blue-600">
          QB Matched Items List
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
        There are {filteredItems.length} matched items found.
      </div>
      <div className="overflow-auto">
        <Table id="myTable" aria-label="items table">
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
              <EmptyRecordsCell columns={columns} />
            ) : (
              (rowsPerPage > 0
                ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : sortedItems
              ).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.qb_item_name}</TableCell>
                  <TableCell>
                    {item.zoho_item}<br />
                    (SKU: {item.zoho_item_sku && item.zoho_item_sku.length > 0 ? item.zoho_item_sku : '---'})
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      onClick={() => handleUnMatchItem(item)}
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
              data={filteredItems}
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

export default QbwcMatchedItemsList
