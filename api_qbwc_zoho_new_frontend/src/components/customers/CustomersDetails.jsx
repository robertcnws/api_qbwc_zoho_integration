import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Link as LinkIcon, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/shared/ConfirmDialog';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { AlertLoading } from '@/components/shared/AlertLoading';
import { AlertError } from '@/components/shared/AlertError';
import { CustomFilter } from '@/components/shared/CustomFilter';
import { TableCustomPagination } from '@/components/shared/TableCustomPagination';
import { apiUrl, fetchWithToken } from '@/lib/utils';

const DEFAULT_ROWS = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10;

const CustomersDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();

  const [coincidences, setCoincidences] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingQbCustomers, setLoadingQbCustomers] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [qbCustomers, setQbCustomers] = useState([]);
  const [filteredQbCustomers, setFilteredQbCustomers] = useState([]);
  const [qbSelectedCustomer, setQbSelectedCustomer] = useState(null);
  const [searchTermQbCustomers, setSearchTermQbCustomers] = useState('');
  const [showListQbCustomers, setShowListQbCustomers] = useState(false);
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [currentIndexInList, setCurrentIndexInList] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);

  const containerRef = useRef(null);
  const selectedRowRef = useRef(null);

  useEffect(() => {
    const idx = filteredCustomers.findIndex((i) =>
      customer ? i.fields.contact_id === customer.contact_id : false
    );
    setCurrentIndexInList(idx);
  }, [customer, filteredCustomers]);

  const filterCustomers = (flt, term) => {
    const allCustomers = location.state?.customers || [];
    return allCustomers.filter((c) => {
      const matchesFilter =
        flt === 'all'
          ? true
          : flt === 'matched'
          ? c.fields.qb_list_id !== null && c.fields.qb_list_id !== ''
          : !c.fields.qb_list_id || c.fields.qb_list_id === '';
      const t = (term || '').toLowerCase();
      const f = c.fields || {};
      const matchesTerm =
        !t ||
        (f.customer_name || '').toLowerCase().includes(t) ||
        (f.company_name || '').toLowerCase().includes(t) ||
        (f.contact_name || '').toLowerCase().includes(t);
      return matchesFilter && matchesTerm;
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    setFilteredCustomers(filterCustomers(newFilter, searchSelectTerm));
    setPage(0);
  };

  const handleSearchSelectChange = (e) => {
    const newTerm = e.target.value;
    setSearchSelectTerm(newTerm);
    setFilteredCustomers(filterCustomers(filter, newTerm));
    setPage(0);
  };

  useEffect(() => {
    setFilteredCustomers(location.state?.filteredCustomers || []);
    setFilter(location.state?.filter || 'all');
    setPage(location.state?.page || 0);

    const locCustomer = location.state?.customer;
    if (!locCustomer) {
      navigate('/integration/list_customers');
      return;
    }

    const customerId = locCustomer.fields ? locCustomer.fields.contact_id : locCustomer;
    const fetchCustomerDetails = async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/view_customer/${customerId}/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        setCustomer(response.data);
        setCoincidences(response.data.coincidences);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) setError('Error fetching customer details: Customer not found.');
        else if (status === 500) setError('Error fetching customer details: Internal Server Error.');
        else if (status === 401) setError('Error fetching customer details: Unauthorized.');
        else setError(`Error fetching customer details: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    const fetchQbCustomers = async () => {
      try {
        const url = `${apiUrl}/api_quickbook_soap/qbwc_customers/not_matched`;
        const response = await fetchWithToken(url, 'GET', null, {});
        const jsonData = JSON.parse(response.data);
        setQbCustomers(jsonData);
      } catch (err) {
        setError(`Failed to fetch qb customers: ${err}`);
      } finally {
        setLoadingQbCustomers(false);
      }
    };
    fetchQbCustomers();
    const intervalId = setInterval(fetchQbCustomers, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const term = (searchTermQbCustomers || '').toLowerCase();
    const filtered = qbCustomers.filter((q) => {
      const f = q.fields || {};
      return (
        (f.name || '').toLowerCase().includes(term) ||
        (f.list_id || '').toLowerCase().includes(term) ||
        (f.email || '').toLowerCase().includes(term) ||
        (f.phone || '').toLowerCase().includes(term)
      );
    });
    setFilteredQbCustomers(filtered);
    setShowListQbCustomers(filtered.length > 0 && searchTermQbCustomers.length > 0);
  }, [searchTermQbCustomers, qbCustomers]);

  const handleSelectQbCustomer = (qbCustomer) => {
    setSearchTermQbCustomers(`${qbCustomer.fields.name} (ID: ${qbCustomer.fields.list_id})`);
    setQbSelectedCustomer(qbCustomer);
    setShowListQbCustomers(false);
  };

  const handleClearSearch = () => {
    setQbSelectedCustomer(null);
    setSearchTermQbCustomers('');
    setShowListQbCustomers(false);
  };

  const handleMatchCustomer = async (contact_id, qb_customer_list_id, action) => {
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: `Do you want to ${action} this customer?`,
      icon: 'warning',
      confirmText: `Yes, ${action} it!`,
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_zoho_customers/match_one_customer_ajax/`;
      const data = { contact_id, qb_customer_list_id, action, username: localStorage.getItem('username') };
      const response = await fetchWithToken(url, 'POST', data, {});
      if (response.data.status === 'success') {
        toast.success(response.data.message);
        try {
          const refreshUrl = `${apiUrl}/api_zoho_customers/list_customers/`;
          const res = await fetchWithToken(refreshUrl, 'GET', null, {});
          const jsonData = JSON.parse(res.data);
          let filteredList = jsonData;
          if (filter === 'matched') filteredList = jsonData.filter((c) => c.fields.qb_list_id !== null && c.fields.qb_list_id !== '');
          else if (filter === 'unmatched') filteredList = jsonData.filter((c) => !c.fields.qb_list_id || c.fields.qb_list_id === '');
          setFilteredCustomers(filteredList);
          navigate('/integration/customer_details', {
            state: { customer: { fields: customer }, customers: jsonData, filteredCustomers: filteredList, filter, page },
          });
        } catch (err) {
          setError(`Failed to fetch customers: ${err}`);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(`Error matching customer: ${err}`);
    }
  };

  const handleViewCustomer = async (customer_id) => {
    try {
      const url = `${apiUrl}/api_zoho_customers/view_customer/${customer_id}/`;
      const response = await fetchWithToken(url, 'GET', null, {});
      setCustomer(response.data);
      setCoincidences(response.data.coincidences);
    } catch {}
  };

  const handleBackNavigation = () => {
    const backNav = localStorage.getItem('backNavigation');
    if (backNav === 'invoice_details') {
      const invoice = JSON.parse(localStorage.getItem('invoice'));
      if (invoice && !('fields' in invoice)) invoice.fields = invoice;
      navigate(`/integration/${backNav}`, {
        state: {
          invoice,
          invoices: JSON.parse(localStorage.getItem('invoices')),
          filteredInvoices: JSON.parse(localStorage.getItem('filteredInvoices')),
          filter: JSON.parse(localStorage.getItem('filterInvoices')),
        },
      });
    } else if (backNav === 'sales_order_details') {
      const salesOrder = JSON.parse(localStorage.getItem('salesOrder'));
      if (salesOrder && !('fields' in salesOrder)) salesOrder.fields = salesOrder;
      navigate(`/integration/${backNav}`, {
        state: {
          salesOrder,
          salesOrders: JSON.parse(localStorage.getItem('salesOrders')),
          filteredSalesOrders: JSON.parse(localStorage.getItem('filteredSalesOrders')),
          filter: JSON.parse(localStorage.getItem('filterSalesOrders')),
        },
      });
    } else if (backNav === 'qbwc_customers') {
      navigate('/integration/qbwc/customers/list');
    } else {
      navigate(-1);
    }
  };

  const getBackgroundColor = (row) => {
    if (!customer) return '';
    return row.fields.contact_id === customer.contact_id ? 'bg-gray-200' : '';
  };

  const handleChangePage = (newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (rows) => { setRowsPerPage(rows); setPage(0); };

  useEffect(() => { setSelectedId(customer?.contact_id ?? null); }, [customer]);

  useLayoutEffect(() => {
    if (!filteredCustomers || selectedId == null || rowsPerPage <= 0) return;
    const idx = filteredCustomers.findIndex((r) => r.fields.contact_id === selectedId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / rowsPerPage);
    if (targetPage !== page) setPage(targetPage);
  }, [selectedId, filteredCustomers, rowsPerPage]);

  useLayoutEffect(() => {
    const rowEl = selectedRowRef.current;
    if (!rowEl) return;
    rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId, page]);

  const backNav = localStorage.getItem('backNavigation');
  const filterConfig = {
    filter,
    handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Customers' },
      { value: 'matched', label: 'Matched Customers' },
      { value: 'unmatched', label: 'Unmatched Customers' },
    ],
    hasSearch: true,
    searchSelectTerm,
    searchPlaceholder: 'Search Customer',
    handleSearchSelectChange,
  };

  if (loading) return <AlertLoading message="Customer Details" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="w-full py-2 flex flex-col gap-4">
      {!customer ? (
        <div className="flex flex-col gap-2">
          <Alert variant="warning"><AlertDescription>No customer found.</AlertDescription></Alert>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-fit" onClick={handleBackNavigation}>
            Back to list
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-4 items-stretch">
          {/* Left column */}
          <div className="border border-border rounded-xl p-3 bg-background flex flex-col md:min-h-[640px]">
            <div className="mb-2">
              <CustomFilter config={filterConfig} />
            </div>
            <div ref={containerRef} className="flex-1 overflow-auto max-h-[280px] md:max-h-[640px]">
              <Table>
                <TableBody>
                  {filteredCustomers && filteredCustomers.length > 0 ? (
                    (rowsPerPage > 0
                      ? filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : filteredCustomers
                    ).map((row, idx) => {
                      const isSelected = row.fields.contact_id === selectedId;
                      return (
                        <TableRow
                          key={`${row.fields.contact_id}-${idx}`}
                          ref={isSelected ? selectedRowRef : null}
                          className={`cursor-pointer hover:bg-gray-100 ${getBackgroundColor(row)}`}
                          onClick={() => handleViewCustomer(row.fields.contact_id)}
                        >
                          <TableCell className="py-3">
                            <b>{row.fields.contact_name}</b>
                            {row.fields.email && (
                              <><br /><span className="text-xs text-muted-foreground">Email: {row.fields.email}</span></>
                            )}
                            {row.fields.company_name && (
                              <><br /><span className="text-xs text-muted-foreground">Company: {row.fields.company_name}</span></>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell>No customers found.</TableCell></TableRow>
                  )}
                  <TableCustomPagination
                    colSpan={1}
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

          {/* Right column */}
          <div className="flex flex-col gap-3 md:min-h-[640px]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <h2 className="text-lg font-bold uppercase">{customer.customer_name || '--'}</h2>
              <div className="flex gap-1">
                {(backNav === 'invoice_details' || backNav === 'qbwc_customers' || backNav === 'sales_order_details') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleBackNavigation}><ArrowLeft size={18} /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Go Back</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const prev = filteredCustomers[currentIndexInList - 1] || filteredCustomers[filteredCustomers.length - 1];
                        if (prev) handleViewCustomer(prev.fields.contact_id);
                      }}><ArrowLeft size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const next = filteredCustomers[currentIndexInList + 1] || filteredCustomers[0];
                        if (next) handleViewCustomer(next.fields.contact_id);
                      }}><ArrowRight size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Next</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate('/integration/list_customers')}><X size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Back to List</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Details table */}
            <div className="border border-border rounded-xl overflow-hidden bg-background flex-1 min-h-[360px]">
              <div className="overflow-auto max-h-[640px]">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="w-[200px] border-none font-medium">Zoho Customer ID</TableCell>
                      <TableCell className="border-none"><b>{customer.contact_id}</b></TableCell>
                    </TableRow>
                    {customer.contact_name && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Contact Name</TableCell>
                        <TableCell className="border-none"><b>{customer.contact_name}</b></TableCell>
                      </TableRow>
                    )}
                    {customer.email && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Customer Email</TableCell>
                        <TableCell className="border-none"><b>{customer.email}</b></TableCell>
                      </TableRow>
                    )}
                    {customer.phone && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Customer Phone</TableCell>
                        <TableCell className="border-none"><b>{customer.phone}</b></TableCell>
                      </TableRow>
                    )}
                    {customer.mobile && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Customer Mobile</TableCell>
                        <TableCell className="border-none"><b>{customer.mobile}</b></TableCell>
                      </TableRow>
                    )}
                    {customer.company_name && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Customer Company Name</TableCell>
                        <TableCell className="border-none"><b>{customer.company_name}</b></TableCell>
                      </TableRow>
                    )}
                    {customer.qb_list_id && (
                      <TableRow>
                        <TableCell className="border-none font-medium">QB Customer Info</TableCell>
                        <TableCell className="border-none">
                          QB List ID: <b>{customer.qb_list_id}</b>
                          {customer.qb_customer?.name && (
                            <><br />Matched QB Customer: <b>{customer.qb_customer.name}</b></>
                          )}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Coincidences */}
                    <TableRow>
                      <TableCell className="border-none font-medium">Coincidences by Order</TableCell>
                      <TableCell className="border-none">
                        {coincidences.length > 0 && !customer.matched ? (
                          <div className="border border-border rounded overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-[#f2f3f5]">
                                  <TableHead>QB Customer Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Coincidence Email</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Coincidence Phone</TableHead>
                                  <TableHead>Company Name</TableHead>
                                  <TableHead>Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {coincidences.map((c, i) => (
                                  <TableRow key={`${c.qb_customer_list_id}-${i}`}>
                                    <TableCell>{c.qb_customer_name}</TableCell>
                                    <TableCell>{c.email}</TableCell>
                                    <TableCell>{c.coincidence_email}</TableCell>
                                    <TableCell>{c.phone}</TableCell>
                                    <TableCell>{c.coincidence_phone}</TableCell>
                                    <TableCell>{c.company_name}</TableCell>
                                    <TableCell>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-blue-500"
                                              onClick={() => handleMatchCustomer(customer.contact_id, c.qb_customer_list_id, 'match')}>
                                              <LinkIcon size={16} />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Do Match</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : customer.matched ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <Alert className="bg-green-50 border-green-300 text-xs py-1 px-2 w-fit">
                              <AlertDescription><b>Customer already matched.</b></AlertDescription>
                            </Alert>
                            <Button size="sm" variant="destructive"
                              onClick={() => handleMatchCustomer(customer.contact_id, customer.qb_list_id, 'unmatch')}>
                              UnMatch
                            </Button>
                          </div>
                        ) : (
                          <Alert className="bg-amber-50 border-amber-300 text-xs py-1 px-2">
                            <AlertDescription><b>No coincidences found.</b></AlertDescription>
                          </Alert>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Force Matching */}
                    {!customer.matched && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Force Matching</TableCell>
                        <TableCell className="border-none">
                          {!loadingQbCustomers ? (
                            <div className="w-full flex flex-col gap-2">
                              <div className="relative">
                                <input
                                  type="text"
                                  className="w-full border border-border rounded px-3 py-1.5 text-sm pr-8"
                                  placeholder={`Search QB Customers (${filteredQbCustomers.length})`}
                                  value={searchTermQbCustomers}
                                  onChange={(e) => { setQbSelectedCustomer(null); setSearchTermQbCustomers(e.target.value); }}
                                />
                                {searchTermQbCustomers && (
                                  <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={handleClearSearch}>
                                    <XCircle size={14} className="text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                              {showListQbCustomers && (
                                <div className="border border-border rounded overflow-auto max-h-[220px]">
                                  {filteredQbCustomers.map((q) => (
                                    <div
                                      key={q.fields.list_id}
                                      className="px-4 py-2 text-sm cursor-pointer bg-[#f7f7f8] hover:bg-[#ececf1] border-b border-border last:border-0"
                                      onClick={() => handleSelectQbCustomer(q)}
                                    >
                                      {q.fields.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button size="sm" disabled={qbSelectedCustomer === null}
                                onClick={() => handleMatchCustomer(customer.contact_id, qbSelectedCustomer?.fields.list_id || '', 'match')}>
                                Match
                              </Button>
                            </div>
                          ) : (
                            <Alert className="bg-blue-50 border-blue-300 text-xs py-1 px-2">
                              <AlertDescription><b>Loading QB Customers...</b></AlertDescription>
                            </Alert>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersDetails;
