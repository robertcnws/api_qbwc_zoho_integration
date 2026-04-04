import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, CheckCircle, XCircle, Wallet } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CustomFilter } from '@/components/shared/CustomFilter';
import { TableCustomPagination } from '@/components/shared/TableCustomPagination';
import { NavigationRightButton } from '@/components/shared/NavigationRightButton';
import { AlertLoading } from '@/components/shared/AlertLoading';
import { apiUrl, fetchWithToken } from '@/lib/utils';

const DEFAULT_ROWS = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10;

const QbwcCustomerDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [customer, setCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [zohoCustomers, setZohoCustomers] = useState([]);
  const [loadingZoho, setLoadingZoho] = useState(true);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [selectedId, setSelectedId] = useState(null);
  const [currentIndexInList, setCurrentIndexInList] = useState(-1);

  const selectedRowRef = useRef(null);

  useEffect(() => {
    const fetchZohoCustomers = async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/list_customers/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        setZohoCustomers(JSON.parse(response.data));
      } catch (err) {
        console.error('Failed to fetch zoho customers:', err);
      } finally {
        setLoadingZoho(false);
      }
    };
    fetchZohoCustomers();
  }, []);

  useEffect(() => {
    const locCustomer = location.state?.customer;
    const locCustomers = location.state?.customers || [];
    const locFilter = location.state?.filter || 'all';

    if (!locCustomer) {
      navigate('/integration/qbwc/customers/list');
      return;
    }

    setCustomer(locCustomer);
    setAllCustomers(locCustomers);
    setFilter(locFilter);
    setFilteredCustomers(applyFilter(locCustomers, locFilter, ''));
    setSelectedId(locCustomer.fields.list_id);
  }, [location.state]);

  useEffect(() => {
    if (!customer) return;
    const idx = filteredCustomers.findIndex(c => c.fields.list_id === customer.fields.list_id);
    setCurrentIndexInList(idx);
  }, [customer, filteredCustomers]);

  useLayoutEffect(() => {
    if (!filteredCustomers.length || selectedId == null || rowsPerPage <= 0) return;
    const idx = filteredCustomers.findIndex(r => r.fields.list_id === selectedId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / rowsPerPage);
    if (targetPage !== page) setPage(targetPage);
  }, [selectedId, filteredCustomers, rowsPerPage]);

  useLayoutEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId, page]);

  const applyFilter = (customers, flt, term) => {
    return customers.filter(c => {
      const matchesFilter =
        flt === 'all' ? true
        : flt === 'matched' ? c.fields.matched
        : !c.fields.matched;
      const t = term.toLowerCase();
      const matchesTerm = !t ||
        (c.fields.name || '').toLowerCase().includes(t) ||
        (c.fields.email || '').toLowerCase().includes(t) ||
        (c.fields.phone || '').toLowerCase().includes(t) ||
        (c.fields.list_id || '').toLowerCase().includes(t);
      return matchesFilter && matchesTerm;
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    setFilteredCustomers(applyFilter(allCustomers, newFilter, searchSelectTerm));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchSelectTerm(term);
    setFilteredCustomers(applyFilter(allCustomers, filter, term));
    setPage(0);
  };

  const selectCustomer = (selected) => {
    setCustomer(selected);
    setSelectedId(selected.fields.list_id);
  };

  const handlePrev = () => {
    const prev = filteredCustomers[currentIndexInList - 1] || filteredCustomers[filteredCustomers.length - 1];
    if (prev) selectCustomer(prev);
  };

  const handleNext = () => {
    const next = filteredCustomers[currentIndexInList + 1] || filteredCustomers[0];
    if (next) selectCustomer(next);
  };

  const getMatchedZohoCustomer = (listId) =>
    zohoCustomers.find(z => z.fields.qb_list_id === listId) || null;

  const filterConfig = {
    filter,
    handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Customers' },
      { value: 'matched', label: 'Matched Customers' },
      { value: 'not_matched', label: 'Unmatched Customers' },
    ],
  };

  const navItems = [
    {
      label: 'Back to QB Customers',
      icon: <Wallet size={16} className="mr-1" />,
      route: '/integration/qbwc/customers/list',
      visible: true,
    },
  ];

  const pagedRows = rowsPerPage > 0
    ? filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredCustomers;

  if (!customer) return null;

  const matchedZohoCustomer = getMatchedZohoCustomer(customer.fields.list_id);

  return (
    <div className="w-full py-0 flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 items-stretch">

        {/* Left panel — list */}
        <div className="border border-border rounded-xl p-3 bg-background flex flex-col gap-2">
          <div className="mb-1">
            <CustomFilter config={filterConfig} />
          </div>
          <div className="mb-1">
            <input
              type="text"
              className="w-full border border-border rounded px-2 py-1.5 text-sm"
              placeholder="Search QB customers..."
              value={searchSelectTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableBody>
                {pagedRows.length === 0 ? (
                  <TableRow><TableCell className="text-muted-foreground text-sm">No customers found.</TableCell></TableRow>
                ) : (
                  pagedRows.map((row) => {
                    const isSelected = row.fields.list_id === selectedId;
                    return (
                      <TableRow
                        key={row.fields.list_id}
                        ref={isSelected ? selectedRowRef : null}
                        className={`cursor-pointer hover:bg-gray-100 transition-colors ${isSelected ? 'bg-gray-200' : ''}`}
                        onClick={() => selectCustomer(row)}
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">{row.fields.name}</p>
                              {row.fields.email && (
                                <p className="text-xs text-muted-foreground">{row.fields.email}</p>
                              )}
                              <p className="text-xs text-muted-foreground">{row.fields.list_id}</p>
                            </div>
                            {row.fields.matched
                              ? <CheckCircle size={14} className="text-green-600 shrink-0" />
                              : <XCircle size={14} className="text-red-400 shrink-0" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                <TableCustomPagination
                  colSpan={1}
                  data={filteredCustomers}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setPage}
                  onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
                />
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
            <h2 className="text-lg font-bold uppercase truncate">{customer.fields.name}</h2>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handlePrev}><ArrowLeft size={18} /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleNext}><ArrowRight size={18} /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Next</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/integration/qbwc/customers/list')}>
                      <X size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to List</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <NavigationRightButton items={navItems} />
            {customer.fields.matched
              ? <Badge className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-100">Matched</Badge>
              : <Badge className="bg-red-100 text-red-600 border border-red-300 hover:bg-red-100">Not Matched</Badge>}
          </div>

          {/* Detail table */}
          <div className="border border-border rounded-xl overflow-hidden bg-background">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-[180px] font-medium text-muted-foreground">QB Customer Name</TableCell>
                  <TableCell><b>{customer.fields.name}</b></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">QB List ID</TableCell>
                  <TableCell><b>{customer.fields.list_id}</b></TableCell>
                </TableRow>
                {customer.fields.email && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground">Email</TableCell>
                    <TableCell><b>{customer.fields.email}</b></TableCell>
                  </TableRow>
                )}
                {customer.fields.phone && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground">Phone</TableCell>
                    <TableCell><b>{customer.fields.phone}</b></TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Match Status</TableCell>
                  <TableCell>
                    {customer.fields.matched
                      ? <span className="flex items-center gap-1 text-green-700 font-medium"><CheckCircle size={15} /> Matched</span>
                      : <span className="flex items-center gap-1 text-red-500 font-medium"><XCircle size={15} /> Not Matched</span>}
                  </TableCell>
                </TableRow>

                {/* Matched Zoho customer */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Matched Zoho Customer</TableCell>
                  <TableCell>
                    {loadingZoho ? (
                      <AlertLoading message="Zoho Customers" />
                    ) : matchedZohoCustomer ? (
                      <div className="flex flex-col gap-1">
                        <p><b>{matchedZohoCustomer.fields.contact_name}</b></p>
                        {matchedZohoCustomer.fields.company_name && (
                          <p className="text-xs text-muted-foreground">Company: {matchedZohoCustomer.fields.company_name}</p>
                        )}
                        {matchedZohoCustomer.fields.email && (
                          <p className="text-xs text-muted-foreground">Email: {matchedZohoCustomer.fields.email}</p>
                        )}
                        {matchedZohoCustomer.fields.phone && (
                          <p className="text-xs text-muted-foreground">Phone: {matchedZohoCustomer.fields.phone}</p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-fit mt-1"
                          onClick={() => {
                            localStorage.setItem('backNavigation', 'qbwc_customers');
                            navigate('/integration/customer_details', {
                              state: {
                                customer: matchedZohoCustomer,
                                customers: zohoCustomers,
                                filteredCustomers: zohoCustomers,
                                filter: 'all',
                              },
                            });
                          }}
                        >
                          View Zoho Customer Details
                        </Button>
                      </div>
                    ) : (
                      <Alert className="bg-amber-50 border-amber-300 text-xs py-1 px-2 w-fit">
                        <AlertDescription><b>No Zoho customer matched yet.</b></AlertDescription>
                      </Alert>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QbwcCustomerDetails;
