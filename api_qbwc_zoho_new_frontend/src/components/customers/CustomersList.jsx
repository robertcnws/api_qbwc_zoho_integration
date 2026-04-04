import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowUp, ArrowDown, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const CustomersList = ({ customers }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
    const savedPage = localStorage.getItem('customerListPage');
    window.addEventListener('storage', handleStorageChange);
    if (savedPage !== null) setPage(Number(savedPage));
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [searchTerm]);

  const handleChangePage = (newPage) => {
    setPage(newPage);
    localStorage.setItem('customerListPage', newPage);
  };

  const handleChangeRowsPerPage = (rows) => {
    setRowsPerPage(rows);
    localStorage.setItem('customerListRowsPerPage', rows);
    setPage(0);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(0);
  };

  const handleSortChange = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleViewCustomer = (customer) => {
    localStorage.setItem('customerListPage', page);
    localStorage.setItem('customerListRowsPerPage', rowsPerPage);
    localStorage.setItem('backNavigation', 'list_customers');
    navigate('/integration/customer_details', {
      state: { customer, customers, filteredCustomers, filter, page },
    });
  };

  const filteredCustomers = customers.filter((customer) => {
    const f = customer.fields || {};
    const matchesSearchTerm =
      (f.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearchTerm;
    if (filter === 'matched') return matchesSearchTerm && f.qb_list_id && f.qb_list_id !== '';
    if (filter === 'unmatched') return matchesSearchTerm && (!f.qb_list_id || f.qb_list_id === '');
    return matchesSearchTerm;
  });

  const sortedCustomers = stableSort(filteredCustomers, getComparator(order, orderBy));

  const columns = [
    { id: 'contact_name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'company_name', label: 'Company Name' },
    { id: 'status', label: 'Status' },
  ];

  const navItems = [
    { label: 'Back to Integration', icon: <Home size={16} className="mr-1" />, route: '/integration', visible: true },
  ];

  const filterConfig = {
    filter,
    handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Customers' },
      { value: 'matched', label: 'Matched Customers' },
      { value: 'unmatched', label: 'Unmatched Customers' },
    ],
    hasSearch: false,
  };

  const pagedRows =
    rowsPerPage > 0
      ? sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : sortedCustomers;

  return (
    <div className="w-full py-2 flex flex-col gap-4">
      {/* Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4">
        <div className="max-w-[380px]">
          <CustomFilter config={filterConfig} />
        </div>
        <div className="flex justify-end mr-1">
          <NavigationRightButton items={navItems} />
        </div>
      </div>

      {/* Table */}
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
              {filteredCustomers.length === 0 ? (
                <EmptyRecordsCell colSpan={columns.length} />
              ) : (
                pagedRows.map((customer, index) => {
                  const f = customer.fields || {};
                  const matched = !!(f.qb_list_id && f.qb_list_id !== '');
                  return (
                    <TableRow
                      key={`${f.contact_name || 'row'}-${index}`}
                      className="cursor-pointer hover:bg-[#F6F6FA] transition-colors"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <TableCell>{f.contact_name}</TableCell>
                      <TableCell>{f.email}</TableCell>
                      <TableCell>{f.phone}</TableCell>
                      <TableCell>{f.company_name}</TableCell>
                      <TableCell className="w-16 max-w-[64px]">
                        <TooltipProvider>
                          {matched ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <CheckCircle size={18} className="text-green-600" />
                              </TooltipTrigger>
                              <TooltipContent>Matched</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger>
                                <XCircle size={18} className="text-red-500" />
                              </TooltipTrigger>
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
                data={filteredCustomers}
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

export default CustomersList;
