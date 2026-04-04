import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const QbwcSimilarItemsList = ({ similarItems, onSyncComplete }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('qb_item_name')
  const [order, setOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

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

  const matchRow = (qb_item_list_id, zoho_item_id) => {
    const confirmed = window.confirm('Do you want to match this item?')
    if (!confirmed) return
    const matchOneItemAjax = async () => {
      try {
        const url = `${apiUrl}/api_zoho_items/match_one_item_ajax/`
        const body = {
          qb_item_list_id: qb_item_list_id,
          item_id: zoho_item_id,
          action: 'match',
          username: localStorage.getItem('username')
        }
        const response = await fetchWithToken(url, 'POST', body, {}, apiUrl)
        if (response.status === 200) {
          toast.success('Item has been matched.')
          onSyncComplete()
        } else {
          toast.error(`Error matching items for the item: ${response.message}`)
        }
      } catch (error) {
        toast.error(`Error matching items for the item: ${error}`)
      }
    }
    matchOneItemAjax()
  }

  const columns = [
    { id: 'qb_item_name', label: 'Quick Book Item' },
    { id: 'zoho_items', label: 'Zoho Items' },
    { id: 'coincidence', label: 'Coincidence' },
    { id: 'actions', label: 'Actions' }
  ]

  const filteredItems = similarItems.filter(item =>
    item.qb_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.coincidences_by_order.some(coincidence =>
      coincidence.zoho_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coincidence.zoho_item_sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const renderTableRows = (items) => {
    return items.map((item, index) => (
      item.coincidences_by_order ? item.coincidences_by_order.map((coincidence, subIndex) => (
        <TableRow
          key={`${index}-${subIndex}`}
          className="cursor-pointer transition-colors"
        >
          {subIndex === 0 && (
            <TableCell rowSpan={item.coincidences_by_order.length}>
              {item.qb_item_name}
            </TableCell>
          )}
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            {coincidence.zoho_item} <br /> (SKU: {coincidence.zoho_item_sku})
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            {coincidence.coincidence}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }} className="text-center">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={() => matchRow(item.qb_item_list_id, coincidence.zoho_item_id)}
            >
              Match
            </Button>
          </TableCell>
        </TableRow>
      )) : (
        <TableRow key={index}>
          <TableCell>{item.qb_item_name}</TableCell>
          <TableCell>No coincidences</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
        </TableRow>
      )
    ))
  }

  const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy))
  const paginatedItems = sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-bold uppercase text-blue-600">
          QB Similar Items
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <Button variant="outline" size="sm" className="border-green-500 text-green-700 hover:bg-green-50" onClick={() => navigate(-1)}>
            Back to QBWC
          </Button>
          <Button variant="outline" size="sm" className="border-green-500 text-green-700 hover:bg-green-50" onClick={() => navigate('/integration/qbwc/items/matched')}>
            Matched Items
          </Button>
        </div>
      </div>
      <div className="mb-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
        There are {filteredItems.length} items found.
      </div>
      <div className="overflow-x-auto w-full">
        <Table id="myTable" aria-label="similar items table">
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
              renderTableRows(paginatedItems)
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

export default QbwcSimilarItemsList
