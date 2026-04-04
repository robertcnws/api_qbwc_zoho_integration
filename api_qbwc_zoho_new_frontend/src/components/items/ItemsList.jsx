import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowUp, ArrowDown, ArrowUpDown, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/shared/ConfirmDialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CustomFilter } from '@/components/shared/CustomFilter';
import { EmptyRecordsCell } from '@/components/shared/EmptyRecordsCell';
import { TableCustomPagination } from '@/components/shared/TableCustomPagination';
import { NavigationRightButton } from '@/components/shared/NavigationRightButton';
import { apiUrl, fetchWithToken } from '@/lib/utils';

const DEFAULT_ROWS = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10;

function stableSort(arr, comparator) {
  return [...arr].sort(comparator);
}

function getComparator(order, orderBy) {
  return (a, b) => {
    const aVal = a.fields?.[orderBy] ?? a[orderBy] ?? '';
    const bVal = b.fields?.[orderBy] ?? b[orderBy] ?? '';
    if (bVal < aVal) return order === 'asc' ? 1 : -1;
    if (bVal > aVal) return order === 'asc' ? -1 : 1;
    return 0;
  };
}

const SortableHeader = ({ column, label, orderBy, order, onSort }) => (
  <TableHead
    className="cursor-pointer select-none bg-[#F9F9FB] font-bold text-muted-foreground text-xs uppercase py-2"
    onClick={() => onSort(column)}
  >
    <div className="flex items-center gap-1">
      {label}
      {orderBy === column ? (
        order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ArrowUpDown size={12} className="opacity-40" />
      )}
    </div>
  </TableHead>
);

const ItemsList = ({ items }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const confirm = useConfirm();

  useEffect(() => {
    const handleStorageChange = () => setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
    const savedPage = localStorage.getItem('itemListPage');
    window.addEventListener('storage', handleStorageChange);
    if (savedPage !== null) setPage(Number(savedPage));
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [searchTerm]);

  const handleSortChange = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
    localStorage.setItem('itemListPage', newPage);
  };

  const handleChangeRowsPerPage = (rows) => {
    setRowsPerPage(rows);
    localStorage.setItem('itemListRowsPerPage', rows);
    setPage(0);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(0);
  };

  const handleViewItem = (item) => {
    localStorage.setItem('itemListPage', page);
    localStorage.setItem('itemListRowsPerPage', rowsPerPage);
    localStorage.setItem('backNavigation', 'list_items');
    navigate('/integration/item_details', { state: { item, items, filteredItems, filter } });
  };

  const handleSetCustom = useCallback(async (item) => {
    const typeSet = item.fields.is_custom ? 'unset custom' : 'set custom';
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: `Do you want to ${typeSet} for this item: ${item.fields.name}?`,
      icon: 'warning',
      confirmText: `Yes, ${typeSet}!`,
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_zoho_items/set_custom_item/${item.fields.item_id}/`;
      const response = await fetchWithToken(url, 'POST', {}, {});
      if (response.data.status === 'success') {
        toast.success('Selected invoices have been unsynced.');
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err}`);
    }
  }, [confirm]);

  const filteredItems = (items || []).filter((item) => {
    const f = item?.fields || {};
    const matchesSearchTerm =
      (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(f.rate || '').includes(searchTerm.toLowerCase()) ||
      (f.qb_list_id || '').toString().includes(searchTerm.toLowerCase()) ||
      (f.item_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearchTerm;
    if (filter === 'matched') return matchesSearchTerm && f.qb_list_id && f.qb_list_id !== '';
    if (filter === 'unmatched') return matchesSearchTerm && (!f.qb_list_id || f.qb_list_id === '');
    if (filter === 'custom') return matchesSearchTerm && f.is_custom === true;
    return matchesSearchTerm;
  });

  const sortedItems = stableSort(filteredItems, getComparator(order, orderBy));

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'rate', label: 'Rate' },
    { id: 'sku', label: 'SKU' },
    { id: 'is_custom', label: 'Custom?' },
    { id: 'status', label: 'Status' },
    { id: 'matched', label: 'Matched?' },
  ];

  const navItems = [
    { label: 'Back to Integration', icon: <Home size={16} className="mr-1" />, route: '/integration', visible: true },
  ];

  const filterConfig = {
    filter,
    handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Items' },
      { value: 'matched', label: 'Matched Items' },
      { value: 'unmatched', label: 'Unmatched Items' },
      { value: 'custom', label: 'Custom Items' },
    ],
    hasSearch: false,
  };

  const pagedRows =
    rowsPerPage > 0
      ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : sortedItems;

  return (
    <div className="w-full py-2 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4">
        <div className="max-w-[380px]">
          <CustomFilter config={filterConfig} />
        </div>
        <div className="flex justify-end mr-1">
          <NavigationRightButton items={navItems} />
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <SortableHeader
                    key={col.id}
                    column={col.id}
                    label={col.label}
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
                pagedRows.map((item, index) => {
                  const f = item.fields || {};
                  const matched = !!(f.qb_list_id && f.qb_list_id !== '');
                  return (
                    <TableRow
                      key={index}
                      className="cursor-pointer hover:bg-[#F6F6FA] transition-colors"
                    >
                      <TableCell onClick={() => handleViewItem(item)}>{f.name}</TableCell>
                      <TableCell onClick={() => handleViewItem(item)}>$ {f.rate}</TableCell>
                      <TableCell onClick={() => handleViewItem(item)}>{f.sku}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className={f.is_custom ? 'bg-green-200 text-green-800 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}
                            onClick={() => handleSetCustom(item)}
                          >
                            {f.is_custom ? 'Quit Custom' : 'Set Custom'}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewItem(item)}>
                        <TooltipProvider>
                          {f.status === 'active' ? (
                            <Tooltip>
                              <TooltipTrigger><ToggleRight size={24} className="text-green-600" /></TooltipTrigger>
                              <TooltipContent>Active</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger><ToggleLeft size={24} className="text-red-500" /></TooltipTrigger>
                              <TooltipContent>Inactive</TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </TableCell>
                      <TableCell onClick={() => handleViewItem(item)} className="w-16 max-w-[64px]">
                        <TooltipProvider>
                          {matched ? (
                            <Tooltip>
                              <TooltipTrigger><CheckCircle size={18} className="text-green-600" /></TooltipTrigger>
                              <TooltipContent>Matched</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger><XCircle size={18} className="text-red-500" /></TooltipTrigger>
                              <TooltipContent>Not Matched</TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })
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
    </div>
  );
};

export default ItemsList;
