import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, MinusCircle, Trash2, RefreshCw, FilterX, Home, ArrowUp, ArrowDown, ArrowUpDown, Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/shared/ConfirmDialog';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CustomFilter } from '@/components/shared/CustomFilter';
import { EmptyRecordsCell } from '@/components/shared/EmptyRecordsCell';
import { TableCustomPagination } from '@/components/shared/TableCustomPagination';
import { NavigationRightButton } from '@/components/shared/NavigationRightButton';
import { apiUrl, fetchWithToken } from '@/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_ROWS = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10;

function stableSort(arr, comparator) {
  return [...arr].sort(comparator);
}
function getComparator(order, orderBy) {
  return (a, b) => {
    const aVal = a.fields?.[orderBy] ?? '';
    const bVal = b.fields?.[orderBy] ?? '';
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

const SalesOrdersList = ({ data, configData, onSyncComplete, filterDate, setFilterDate }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [selectedForSync, setSelectedForSync] = useState([]);
  const [selectedForUnsync, setSelectedForUnsync] = useState([]);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('all');
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [syncSelectMode, setSyncSelectMode] = useState('clear');
  const [unsyncSelectMode, setUnsyncSelectMode] = useState('clear');

  const today = dayjs();
  const oneYearAgo = today.subtract(1, 'year');

  useEffect(() => {
    const handleStorageChange = () => setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
    window.addEventListener('storage', handleStorageChange);
    const savedPage = localStorage.getItem('salesOrdersListPage');
    if (savedPage !== null) setPage(Number(savedPage));
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleFilterChange = useCallback((e) => { setFilter(e.target.value); setPage(0); }, []);
  const handleSortChange = useCallback((col) => {
    setOrder((o) => (orderBy === col && o === 'asc' ? 'desc' : 'asc'));
    setOrderBy(col);
  }, [orderBy]);

  const handleChangePage = useCallback((newPage) => {
    setPage(newPage);
    localStorage.setItem('salesOrdersListPage', newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((rows) => {
    setRowsPerPage(rows);
    setPage(0);
    localStorage.setItem('salesOrdersListRowsPerPage', rows);
  }, []);

  const handleChangeDate = useCallback((e) => {
    const val = e.target.value;
    if (val) {
      const d = dayjs(val);
      if (d.isValid()) {
        setFilterDate(d);
        localStorage.setItem('salesOrdersListFilterDate', d.format('YYYY-MM-DD'));
      }
    } else {
      setFilterDate(null);
      localStorage.setItem('salesOrdersListFilterDate', '');
    }
    setPage(0);
  }, [setFilterDate]);

  const clearFilters = () => {
    const t = dayjs();
    setFilterDate(t);
    localStorage.setItem('salesOrdersListFilterDate', t.format('YYYY-MM-DD'));
  };

  const handleViewSalesOrder = useCallback((salesOrder) => {
    const salesOrders = data.salesOrders;
    localStorage.setItem('salesOrdersListPage', page);
    localStorage.setItem('salesOrdersListRowsPerPage', rowsPerPage);
    localStorage.setItem('salesOrdersListFilterDate', filterDate ? filterDate.format('YYYY-MM-DD') : '');
    localStorage.setItem('salesOrder', JSON.stringify(salesOrder));
    localStorage.setItem('salesOrders', JSON.stringify(salesOrders));
    localStorage.setItem('filteredSalesOrders', JSON.stringify(filteredSalesOrders));
    localStorage.setItem('filterSalesOrders', JSON.stringify(filter));
    localStorage.setItem('backNavigation', 'sales_order_details');
    navigate('/integration/sales_order_details', { state: { salesOrder, salesOrders, filteredSalesOrders, filter } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filterDate, data.salesOrders, filter, navigate]);

  const handleDeleteSalesOrder = useCallback(async (salesOrder) => {
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: 'Do you want to delete this sales Order? This action cannot be undone.',
      icon: 'warning',
      confirmText: 'Yes, delete it!',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_zoho_salesOrders/delete_sales_order/${salesOrder.fields.salesOrder_id}/`;
      const response = await fetchWithToken(url, 'POST', { username: localStorage.getItem('username') }, {});
      if (response.data.status === 'success') {
        toast.success('Sales Order has been deleted successfully.');
        onSyncComplete?.();
      } else {
        toast.error(`Error deleting sales Order: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error deleting sales Order: ${err}`);
    }
  }, [confirm, onSyncComplete]);

  const handleForceToSync = useCallback(async (listSelected = null, message = null) => {
    const toSync = listSelected || selectedForSync;
    const isUnforce = message && message.toLowerCase().includes('unforce');
    if (!listSelected && selectedForSync.length === 0) {
      toast.error('Please select at least one sales order to force sync.');
      return;
    }
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: message || 'Do you want to force sync selected sales orders?',
      icon: 'warning',
      confirmText: isUnforce ? 'Yes, unforce it!' : 'Yes, force sync!',
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_quickbook_soap/force_to_sync_ajax/sales_orders/`;
      const response = await fetchWithToken(url, 'POST', { elements: toSync, username: localStorage.getItem('username') }, {});
      if (response.data.status === 'success') {
        if (isUnforce) {
          toast.warning('Selected sales orders have been unforced from sync.');
        } else {
          toast.success('Selected sales orders have been forced to sync.');
        }
        setSelectedForSync([]);
        onSyncComplete?.();
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err}`);
    }
  }, [confirm, selectedForSync, onSyncComplete]);

  const handleUnsync = useCallback(async () => {
    if (selectedForUnsync.length === 0) {
      toast.error('Please select at least one sales order to unsync.');
      return;
    }
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: 'Do you want to unsync selected sales orders?',
      icon: 'warning',
      confirmText: 'Yes, unsync!',
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_quickbook_soap/unsync_ajax/sales_orders/`;
      const response = await fetchWithToken(url, 'POST', { elements: selectedForUnsync, username: localStorage.getItem('username') }, {});
      if (response.data.status === 'success') {
        toast.warning('Selected sales orders have been unsynced.');
        setSelectedForUnsync([]);
        onSyncComplete?.();
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err}`);
    }
  }, [confirm, selectedForUnsync, onSyncComplete]);

  const filterByDate = (so) => {
    if (!filterDate) return true;
    const d = dayjs(so.fields.date);
    return d.isValid() && d.isSame(filterDate, 'day');
  };

  const filterBySearchTerm = (so) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const f = so.fields;
    return (
      (f.salesorder_number || '').toLowerCase().includes(q) ||
      (f.customer_name || '').toLowerCase().includes(q) ||
      (f.date || '').toLowerCase().includes(q) ||
      String(f.total || '').toLowerCase().includes(q)
    );
  };

  const filteredSalesOrders = useMemo(() => {
    return data.salesOrders.filter((so) => {
      const matchesSearchTerm = filterBySearchTerm(so) && filterByDate(so);
      const notProcessed = !so.fields.inserted_in_qb && !(so.fields.customer_unmatched.length > 0) && !(so.fields.items_unmatched.length > 0);
      const notSynced = so.fields.customer_unmatched.length > 0 || so.fields.items_unmatched.length > 0;
      const synced = so.fields.inserted_in_qb;
      const forcedSync = so.fields.force_to_sync;
      const matched = so.fields.all_items_matched && so.fields.all_customer_matched;
      if (filter === 'all') return matchesSearchTerm;
      if (filter === 'synced') return matchesSearchTerm && synced;
      if (filter === 'not_synced') return matchesSearchTerm && notSynced;
      if (filter === 'forced_sync') return matchesSearchTerm && forcedSync;
      if (filter === 'not_forced_sync') return matchesSearchTerm && !forcedSync;
      if (filter === 'matched') return matchesSearchTerm && matched;
      if (filter === 'not_matched') return matchesSearchTerm && !matched;
      return matchesSearchTerm && notProcessed;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.salesOrders, filter, searchTerm, filterDate]);

  const sortedSalesOrders = useMemo(
    () => stableSort(filteredSalesOrders, getComparator(order, orderBy)),
    [filteredSalesOrders, order, orderBy]
  );

  const isSyncSelected = (id) => selectedForSync.includes(id);
  const isUnsyncSelected = (id) => selectedForUnsync.includes(id);
  const toggleSyncCheckbox = (id) => {
    setSelectedForSync((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const toggleUnsyncCheckbox = (id) => {
    setSelectedForUnsync((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSelectPageSync = (type) => {
    const start = page * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredSalesOrders.length);
    const ids = [];
    for (let i = start; i < end; i++) {
      const so = filteredSalesOrders[i];
      if (type === 'force_sync' && !so.fields.inserted_in_qb) ids.push(so.fields.salesorder_id);
      if (type === 'unsync' && so.fields.inserted_in_qb) ids.push(so.fields.salesorder_id);
    }
    if (type === 'force_sync') setSelectedForSync(ids);
    else setSelectedForUnsync(ids);
  };

  const handleSelectAllSync = (type) => {
    if (type === 'force_sync') {
      setSelectedForSync(filteredSalesOrders.filter((i) => !i.fields.inserted_in_qb).map((i) => i.fields.salesorder_id));
    } else {
      setSelectedForUnsync(filteredSalesOrders.filter((i) => i.fields.inserted_in_qb).map((i) => i.fields.salesorder_id));
    }
  };

  const renderSyncStatus = (so) => {
    const hasErrors = so.fields.customer_unmatched.length > 0 || so.fields.items_unmatched.length > 0;
    if (hasErrors) return <TooltipProvider><Tooltip><TooltipTrigger><XCircle size={18} className="text-red-500" /></TooltipTrigger><TooltipContent>Error</TooltipContent></Tooltip></TooltipProvider>;
    if (!so.fields.inserted_in_qb) return <TooltipProvider><Tooltip><TooltipTrigger><MinusCircle size={18} className="text-amber-500" /></TooltipTrigger><TooltipContent>Not Processed</TooltipContent></Tooltip></TooltipProvider>;
    return <TooltipProvider><Tooltip><TooltipTrigger><CheckCircle size={18} className="text-green-600" /></TooltipTrigger><TooltipContent>Success</TooltipContent></Tooltip></TooltipProvider>;
  };

  const renderMatchStatus = (so) => {
    const matched = so.fields.all_items_matched && so.fields.all_customer_matched;
    return matched
      ? <TooltipProvider><Tooltip><TooltipTrigger><CheckCircle size={18} className="text-green-600" /></TooltipTrigger><TooltipContent>Matched</TooltipContent></Tooltip></TooltipProvider>
      : <TooltipProvider><Tooltip><TooltipTrigger><XCircle size={18} className="text-red-500" /></TooltipTrigger><TooltipContent>Not Matched</TooltipContent></Tooltip></TooltipProvider>;
  };

  const filterConfig = {
    filter, handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Sales Orders' },
      { value: 'synced', label: 'Synced Sales Orders' },
      { value: 'not_synced', label: 'Not Synced Sales Orders' },
      { value: 'not_processed', label: 'Not Processed Sales Orders' },
      { value: 'forced_sync', label: 'Forced to Sync Sales Orders' },
      { value: 'not_forced_sync', label: 'Not Forced to Sync Sales Orders' },
      { value: 'matched', label: 'Matched Sales Orders' },
      { value: 'not_matched', label: 'Not Matched Sales Orders' },
    ],
    hasSearch: false,
  };

  const navItems = [
    { label: 'Clear Filters', icon: <FilterX size={16} className="mr-1" />, onClick: clearFilters, visible: Boolean(filterDate || searchTerm) },
    { label: 'Sync Selected', icon: <CheckCircle size={16} className="mr-1" />, onClick: handleForceToSync, visible: selectedForSync.length > 0 },
    { label: 'Back to Integration', icon: <Home size={16} className="mr-1" />, route: '/integration', visible: true },
  ];

  const hasSyncCheckboxes = filteredSalesOrders.some((so) => {
    const hasErrors = so.fields.customer_unmatched.length > 0 || so.fields.items_unmatched.length > 0;
    return !so.fields.force_to_sync && !(so.fields.inserted_in_qb && !hasErrors);
  });
  const hasUnsyncCheckboxes = filteredSalesOrders.some((so) => so.fields.inserted_in_qb);

  const safePage = Number.isFinite(page) && page >= 0
    ? Math.min(page, Math.max(0, Math.ceil(filteredSalesOrders.length / rowsPerPage) - 1))
    : 0;

  const pagedRows = rowsPerPage > 0
    ? sortedSalesOrders.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage)
    : sortedSalesOrders;

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start mb-4">
        <div className="max-w-[420px]">
          <CustomFilter config={filterConfig} />
        </div>
        <div className="flex gap-2 justify-end items-center flex-wrap mr-1">
          <input
            type="date"
            className="border border-border rounded px-2 py-1.5 text-sm"
            value={filterDate ? filterDate.format('YYYY-MM-DD') : ''}
            min={oneYearAgo.format('YYYY-MM-DD')}
            max={today.format('YYYY-MM-DD')}
            onChange={handleChangeDate}
          />
          <NavigationRightButton items={navItems} />
        </div>
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9F9FB]">
              <SortableHeader column="salesorder_number" label="SO#" orderBy={orderBy} order={order} onSort={handleSortChange} />
              <SortableHeader column="customer_name" label="Customer" orderBy={orderBy} order={order} onSort={handleSortChange} />
              <SortableHeader column="date" label="Date" orderBy={orderBy} order={order} onSort={handleSortChange} />
              <SortableHeader column="total" label="Total" orderBy={orderBy} order={order} onSort={handleSortChange} />
              <TableHead className="bg-[#F9F9FB] font-bold text-muted-foreground text-xs uppercase py-2 text-center">SYNC</TableHead>
              <TableHead className="bg-[#F9F9FB] font-bold text-muted-foreground text-xs uppercase py-2 text-center">MATCHED?</TableHead>
              <TableHead className="bg-[#F9F9FB] text-xs uppercase py-2">
                {hasSyncCheckboxes ? (
                  <Select value={syncSelectMode} onValueChange={(v) => {
                    if (v === 'unselect') {
                      setSelectedForSync([]);
                      setSyncSelectMode('clear');
                      return;
                    }
                    setSyncSelectMode(v);
                    setSelectedForSync([]);
                    if (v === 'page') handleSelectPageSync('force_sync');
                    else if (v === 'all') handleSelectAllSync('force_sync');
                  }}>
                    <SelectTrigger className="h-7 text-xs min-w-[160px]"><SelectValue placeholder="Force Sync?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Force Sync?</SelectItem>
                      {selectedForSync.length > 0 ? (
                        <SelectItem value="unselect">Unselect All</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="page">Select Page</SelectItem>
                          <SelectItem value="all">Select All</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground px-2">FORCE SYNC?</span>
                )}
              </TableHead>
              <TableHead className="bg-[#F9F9FB] text-xs uppercase py-2">
                {hasUnsyncCheckboxes ? (
                  <Select value={unsyncSelectMode} onValueChange={(v) => {
                    if (v === 'unselect') {
                      setSelectedForUnsync([]);
                      setUnsyncSelectMode('clear');
                      return;
                    }
                    setUnsyncSelectMode(v);
                    setSelectedForUnsync([]);
                    if (v === 'page') handleSelectPageSync('unsync');
                    else if (v === 'all') handleSelectAllSync('unsync');
                    else if (v === 'do_unsync') handleUnsync();
                  }}>
                    <SelectTrigger className="h-7 text-xs min-w-[140px]"><SelectValue placeholder="Unsync?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Unsync?</SelectItem>
                      {selectedForUnsync.length > 0 ? (
                        <>
                          <SelectItem value="unselect">Unselect All</SelectItem>
                          <SelectItem value="do_unsync"><Undo2 size={12} className="inline mr-1" /><b>Unsync Selected</b></SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="page">Select Page</SelectItem>
                          <SelectItem value="all">Select All</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground px-2">UNSYNC?</span>
                )}
              </TableHead>
              <TableHead className="bg-[#F9F9FB] font-bold text-muted-foreground text-xs uppercase py-2 text-center">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSalesOrders.length === 0 ? (
              <EmptyRecordsCell colSpan={9} />
            ) : (
              pagedRows.map((so, index) => {
                const hasErrors = so.fields.customer_unmatched.length > 0 || so.fields.items_unmatched.length > 0;
                return (
                  <TableRow
                    key={so.fields.salesorder_id || index}
                    className={`cursor-pointer transition-colors ${hoveredRowIndex === index ? 'bg-[#F6F6FA]' : 'bg-white'}`}
                    onMouseEnter={() => setHoveredRowIndex(index)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                  >
                    <TableCell onClick={() => handleViewSalesOrder(so)}>{so.fields.salesorder_number}</TableCell>
                    <TableCell onClick={() => handleViewSalesOrder(so)}>{so.fields.customer_name}</TableCell>
                    <TableCell onClick={() => handleViewSalesOrder(so)}>{so.fields.date}</TableCell>
                    <TableCell onClick={() => handleViewSalesOrder(so)}>${so.fields.total}</TableCell>
                    <TableCell className="text-center" onClick={() => handleViewSalesOrder(so)}>{renderSyncStatus(so)}</TableCell>
                    <TableCell className="text-center" onClick={() => handleViewSalesOrder(so)}>{renderMatchStatus(so)}</TableCell>

                    <TableCell className="text-center"
                      onClick={() => (so.fields.force_to_sync || so.fields.inserted_in_qb) &&
                        handleForceToSync([so.fields.salesorder_id], `Unforce sync sales order ${so.fields.salesorder_number}?`)}>
                      {!so.fields.force_to_sync ? (
                        !(so.fields.inserted_in_qb && !hasErrors) ? (
                          <label className="flex items-center justify-center gap-1 cursor-pointer select-none">
                            <Checkbox checked={isSyncSelected(so.fields.salesorder_id)} onCheckedChange={() => toggleSyncCheckbox(so.fields.salesorder_id)} onClick={(e) => e.stopPropagation()} />
                            <span className="text-xs">Force to sync?</span>
                          </label>
                        ) : (
                          <TooltipProvider><Tooltip><TooltipTrigger><CheckCircle size={18} className="text-green-600" /></TooltipTrigger><TooltipContent>Synced</TooltipContent></Tooltip></TooltipProvider>
                        )
                      ) : (
                        <div className="flex gap-1 items-center justify-center">
                          <RefreshCw size={16} className="text-amber-500" />
                          <span className="text-xs font-bold text-amber-600">Forced to sync</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {so.fields.inserted_in_qb ? (
                        <label className="flex items-center justify-center gap-1 cursor-pointer select-none">
                          <Checkbox checked={isUnsyncSelected(so.fields.salesorder_id)} onCheckedChange={() => toggleUnsyncCheckbox(so.fields.salesorder_id)} />
                          <span className="text-xs">Unsync?</span>
                        </label>
                      ) : (
                        <TooltipProvider><Tooltip><TooltipTrigger><MinusCircle size={18} className="text-amber-400" /></TooltipTrigger><TooltipContent>Not synced yet</TooltipContent></Tooltip></TooltipProvider>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteSalesOrder(so)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            <TableCustomPagination
              colSpan={9}
              data={filteredSalesOrders}
              page={safePage}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SalesOrdersList;
