import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWithToken, apiUrl, stableSort, getComparatorUndefined } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

const QbwcItemsList = ({ items, zohoItems, onSyncComplete }) => {
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '')
  const [selectedItems, setSelectedItems] = useState([])
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

  const isSelected = (itemId) => selectedItems.indexOf(itemId) !== -1

  const handleCheckboxClick = (itemId) => {
    const selectedIndex = selectedItems.indexOf(itemId)
    let newSelected = []
    if (selectedIndex === -1) {
      newSelected = [...selectedItems, itemId]
    } else {
      newSelected = selectedItems.filter((id) => id !== itemId)
    }
    setSelectedItems(newSelected)
  }

  const configCustomFilter = {
    filter: filter,
    handleFilterChange: handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Items' },
      { value: 'matched', label: 'Matched Items' },
      { value: 'not_matched', label: 'Unmatched Items' }
    ],
    hasSearch: false
  }

  const renderForceSyncCheckbox = (item, selected) => {
    if (filter !== 'matched') {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            className="border-yellow-500 data-[state=checked]:bg-yellow-500"
            checked={selected}
            onCheckedChange={() => handleCheckboxClick(item.fields.list_id)}
          />
          <span className="text-yellow-600 text-sm">Never match?</span>
        </div>
      )
    } else {
      return <span className="text-green-600 text-sm font-medium">Matched</span>
    }
  }

  const handleNeverMatchItems = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item.')
      return
    }
    const confirmed = window.confirm('Do you want to never match selected items?')
    if (!confirmed) return
    try {
      const url = `${apiUrl}/api_quickbook_soap/never_match_items_ajax/`
      const body = {
        items: selectedItems,
        username: localStorage.getItem('username')
      }
      const response = await fetchWithToken(url, 'POST', body, {}, apiUrl)
      if (response.data.message === 'error') {
        toast.error(response.data.error)
        return
      } else if (response.data.message === 'success') {
        toast.success('Selected items have been marked as never match.')
        setSelectedItems([])
        onSyncComplete()
      }
    } catch (error) {
      toast.error('There was an error marking items as never match.')
    }
  }

  const filteredItems = items.filter(item => {
    const zItem = zohoItems.find(zohoItem => zohoItem.fields.qb_list_id === item.fields.list_id)
    const search = item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fields.list_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fields.item_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zItem?.fields?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zItem?.fields?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'all') return search
    if (filter === 'matched') return search && item.fields.matched
    if (filter === 'not_matched') return search && !item.fields.matched
    return false
  })

  const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'qb_item', label: 'QB Item', colspan: 1, textAlign: 'left' },
    { id: 'qb_list_id', label: 'QB List ID', colspan: 1, textAlign: 'left' },
    { id: 'qb_item_type', label: 'QB Item Type', colspan: 1, textAlign: 'left' },
    { id: 'zoho_item', label: 'Zoho Item', colspan: 1, textAlign: 'left' },
    { id: 'actions', label: 'Actions', colspan: 1, textAlign: 'center' }
  ]

  const childrenNavigationRightButton = [
    {
      label: 'Never Match Selected',
      icon: <Ban size={16} className="mr-1" />,
      onClick: handleNeverMatchItems,
      visibility: filter !== 'matched' && selectedItems.length > 0
    },
    {
      label: 'Back to QBWC',
      icon: <Wallet size={16} className="mr-1" />,
      route: '/integration/qbwc',
      visibility: true
    }
  ]

  const handleViewItem = (item) => {
    try {
      const state = {
        item,
        items: zohoItems,
        filteredItems: zohoItems,
        filter: 'all',
      }
      localStorage.setItem('backNavigation', 'qbwc_items')
      navigate('/integration/item_details', { state })
    } catch (err) {
      console.log(`Failed to fetch items: ${err}`)
    }
  }

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
                <TableRow
                  key={index}
                  className="cursor-pointer transition-colors"
                  style={{ backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF' }}
                  onMouseEnter={() => setHoveredRowIndex(index)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                  onClick={() => navigate('/integration/qbwc/item_details', {
                    state: { item, items: sortedItems, zohoItems, filter }
                  })}
                >
                  <TableCell>{item.fields.name}</TableCell>
                  <TableCell>{item.fields.list_id}</TableCell>
                  <TableCell>
                    {item.fields.item_type && typeof item.fields.item_type === 'string'
                      ? item.fields.item_type.substring(4)
                      : ''}
                  </TableCell>
                  {(() => {
                    const matchedZohoItem = zohoItems.find(zohoItem => zohoItem.fields.qb_list_id === item.fields.list_id)
                    const cellColor = item.fields.list_id
                      ? (matchedZohoItem ? 'text-green-600' : 'text-red-500')
                      : 'text-red-500'
                    return (
                      <TableCell
                        className={cellColor}
                        onClick={matchedZohoItem ? () => handleViewItem(matchedZohoItem) : undefined}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                {item.fields.list_id
                                  ? (matchedZohoItem?.fields?.name || 'N/A')
                                  : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            {matchedZohoItem && (
                              <TooltipContent>Go to Zoho Item Details</TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    )
                  })()}
                  <TableCell className="text-center">
                    {renderForceSyncCheckbox(item, isSelected(item.fields.list_id))}
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

export default QbwcItemsList
