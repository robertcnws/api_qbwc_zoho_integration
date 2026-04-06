import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Link as LinkIcon, RefreshCw, CircleOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/shared/ConfirmDialog';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertLoading } from '@/components/shared/AlertLoading';
import { AlertError } from '@/components/shared/AlertError';
import { CustomFilter } from '@/components/shared/CustomFilter';
import { TableCustomPagination } from '@/components/shared/TableCustomPagination';
import { NavigationRightButton } from '@/components/shared/NavigationRightButton';
import { apiUrl, fetchWithToken } from '@/lib/utils';

const DEFAULT_ROWS = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10;
const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const SmallBadge = ({ matched }) => matched ? (
  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-300">MATCHED</span>
) : (
  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">NOT MATCHED</span>
);

const InvoicesDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();

  const [invoice, setInvoice] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [hovered, setHovered] = useState(false);
  const [currentIndexInList, setCurrentIndexInList] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);

  const containerRef = useRef(null);
  const selectedRowRef = useRef(null);

  const filterInvoices = (flt, searchTerm) => {
    const allInvoices = location.state?.invoices || [];
    return allInvoices.filter((inv) => {
      const f = inv.fields;
      const matchesFilter =
        flt === 'all' ? true
        : flt === 'not_processed' ? !f.inserted_in_qb && !(f.customer_unmatched.length > 0) && !(f.items_unmatched.length > 0)
        : flt === 'not_synced' ? f.customer_unmatched.length > 0 || f.items_unmatched.length > 0
        : flt === 'synced' ? f.inserted_in_qb
        : flt === 'forced_sync' ? f.force_to_sync
        : flt === 'not_forced_sync' ? !f.force_to_sync
        : flt === 'matched' ? f.all_items_matched && f.all_customer_matched
        : flt === 'not_matched' ? !f.all_items_matched || !f.all_customer_matched
        : true;
      const q = (searchTerm || '').toLowerCase();
      const matchesSearch = !q || (f.invoice_number || '').toLowerCase().includes(q) || (f.date || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    setFilteredInvoices(filterInvoices(newFilter, searchSelectTerm));
    setPage(0);
  };

  const handleSearchSelectChange = (e) => {
    const val = e.target.value;
    setSearchSelectTerm(val);
    setFilteredInvoices(filterInvoices(filter, val));
    setPage(0);
  };

  useEffect(() => {
    setFilteredInvoices(filterInvoices(filter, searchSelectTerm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const st = location.state || {};
    setFilteredInvoices(st.filteredInvoices || null);
    setFilter(st.filter || 'all');

    const invId = st.invoice?.fields?.invoice_id;
    if (invId) {
      (async () => {
        try {
          const url = `${apiUrl}/api_zoho_invoices/view_invoice/${invId}/`;
          const response = await fetchWithToken(url, 'GET', null, {});
          setInvoice(response.data.invoice);
        } catch (err) {
          setError(`Error fetching invoice details: ${err}`);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      navigate('/integration/list_invoices');
    }
  }, [location.state, navigate]);

  const handleViewInvoice = (invoice_id) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_invoices/view_invoice/${invoice_id}/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        setInvoice(response.data.invoice);
        localStorage.setItem('invoice', JSON.stringify(response.data.invoice));
        localStorage.setItem('invoices', JSON.stringify(location.state?.invoices || []));
        localStorage.setItem('filteredInvoices', JSON.stringify(filteredInvoices || []));
        localStorage.setItem('filterInvoices', JSON.stringify(filter));
        localStorage.setItem('backNavigation', 'invoice_details');
      } catch (err) {
        setError(`Error fetching invoice details: ${err}`);
      }
    })();
  };

  const handleViewItem = (item) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_items/list_items/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        const jsonData = JSON.parse(response.data);
        const normalized = { ...item };
        if (normalized.zoho_item_id) normalized.item_id = normalized.zoho_item_id;
        localStorage.setItem('backNavigation', 'invoice_details');
        navigate('/integration/item_details', { state: { item: normalized, items: jsonData, filteredItems: jsonData, filter: 'all' } });
      } catch (err) {
        setError(`Failed to fetch items: ${err}`);
      }
    })();
  };

  const handleViewCustomer = (customer) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/list_customers/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        const jsonData = JSON.parse(response.data);
        let normalized = customer;
        if (normalized?.zoho_customer_id) normalized = normalized.zoho_customer_id;
        localStorage.setItem('backNavigation', 'invoice_details');
        navigate('/integration/customer_details', { state: { customer: normalized, customers: jsonData, filteredCustomers: jsonData, filter: 'all' } });
      } catch (err) {
        setError(`Failed to fetch customers: ${err}`);
      }
    })();
  };

  const handleDeleteInvoice = useCallback(async (inv) => {
    if (!inv) return;
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: 'Do you want to delete this invoice? This action cannot be undone.',
      icon: 'warning',
      confirmText: 'Yes, delete it!',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_zoho_invoices/delete_invoice/${inv.invoice_id}/`;
      const data = { username: localStorage.getItem('username') };
      const response = await fetchWithToken(url, 'POST', data, {});
      if (response.data.status === 'success') {
        toast.success('Invoice has been deleted successfully.');
        navigate('/integration/list_invoices');
      } else {
        toast.error(`Error deleting invoice: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error deleting invoice: ${err}`);
    }
  }, [confirm, navigate]);

  const handleForceToSync = useCallback(async (inv) => {
    if (!inv) return;
    const action = inv.force_to_sync ? 'unsync' : 'resync';
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: `Do you want to ${action} this invoice?`,
      icon: 'warning',
      confirmText: `Yes, ${action} it!`,
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_quickbook_soap/force_to_sync_ajax/invoices/`;
      const data = { elements: [inv.invoice_id], username: localStorage.getItem('username') };
      const response = await fetchWithToken(url, 'POST', data, {});
      if (response.data.status === 'success') {
        toast.success(`Invoice has been ${action === 'resync' ? 'forced to sync' : 'unsynced'}.`);
        setInvoice((prev) => ({ ...prev, force_to_sync: !prev.force_to_sync }));
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err}`);
    }
  }, [confirm]);

  const getBackgroundColor = (fi) =>
    invoice && fi.fields.invoice_id === invoice.invoice_id ? 'bg-gray-300' : '';

  const handleChangePage = (newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (rows) => { setRowsPerPage(rows); setPage(0); };

  useEffect(() => {
    const idx = filteredInvoices?.findIndex((i) => invoice ? i?.fields?.invoice_id === invoice?.invoice_id : false);
    setCurrentIndexInList(idx ?? -1);
  }, [invoice, filteredInvoices]);

  useEffect(() => { setSelectedId(invoice?.invoice_id ?? null); }, [invoice]);

  useLayoutEffect(() => {
    if (!filteredInvoices || selectedId == null || rowsPerPage <= 0) return;
    const idx = filteredInvoices.findIndex((r) => r.fields.invoice_id === selectedId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / rowsPerPage);
    if (targetPage !== page) setPage(targetPage);
  }, [selectedId, filteredInvoices, rowsPerPage]);

  useLayoutEffect(() => {
    const rowEl = selectedRowRef.current;
    if (!rowEl) return;
    rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId, page]);

  const filterConfig = {
    filter, handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Invoices' },
      { value: 'synced', label: 'Synced Invoices' },
      { value: 'not_synced', label: 'Not Synced Invoices' },
      { value: 'not_processed', label: 'Not Processed Invoices' },
      { value: 'forced_sync', label: 'Forced to Sync Invoices' },
      { value: 'not_forced_sync', label: 'Not Forced to Sync Invoices' },
      { value: 'matched', label: 'Matched Invoices' },
      { value: 'not_matched', label: 'Not Matched Invoices' },
    ],
    hasSearch: true, searchSelectTerm,
    searchPlaceholder: 'Search Invoice', handleSearchSelectChange,
  };

  if (loading) return <AlertLoading message="Invoice Details" />;
  if (error) return <AlertError error={error} />;

  const navItems = [
    { label: invoice?.force_to_sync ? 'Unsync Invoice' : 'Resync Invoice', icon: invoice?.force_to_sync ? <CircleOff size={16} className="mr-1" /> : <RefreshCw size={16} className="mr-1" />, onClick: () => handleForceToSync(invoice), visible: true },
    { label: 'Delete Invoice', icon: <Trash2 size={16} className="mr-1" />, onClick: () => handleDeleteInvoice(invoice), visible: true },
  ];

  return (
    <div className="w-full py-2">
      {!invoice ? (
        <div>
          <Alert><AlertDescription>No invoice found.</AlertDescription></Alert>
          <div className="mt-3">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate(-1)}>Back to list</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-0 items-stretch">
          {/* Left col — full width on mobile, fixed 400px on md+ */}
          <div className="w-full md:flex-none md:w-[400px] md:min-w-[400px] md:max-w-[400px] border-b md:border-b-0 md:border-r border-border flex flex-col max-h-[280px] md:max-h-[85vh]">
            <div className="p-3">
              <CustomFilter config={filterConfig} />
            </div>
            <div ref={containerRef} className="flex-1 overflow-auto border-t border-border">
              <Table>
                <TableBody>
                  {filteredInvoices && filteredInvoices.length > 0 ? (
                    (rowsPerPage > 0
                      ? filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : filteredInvoices
                    ).map((fi, idx) => {
                      const isSelected = fi.fields.invoice_id === selectedId;
                      return (
                        <TableRow
                          key={fi.fields.invoice_id || idx}
                          ref={isSelected ? selectedRowRef : null}
                          className={`cursor-pointer hover:bg-gray-100 ${getBackgroundColor(fi)}`}
                          onClick={() => handleViewInvoice(fi.fields.invoice_id)}
                        >
                          <TableCell className="py-3">
                            <b>{fi.fields.invoice_number}</b><br />
                            Date: <b>{fi.fields.date || '--'}</b><br />
                            Client: <b>{fi.fields.customer_name}</b>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell>No invoices found.</TableCell></TableRow>
                  )}
                  <TableCustomPagination
                    colSpan={1}
                    data={filteredInvoices || []}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right col flexible */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 ml-1">
              <h2 className="text-lg font-bold uppercase text-[#212529]">{invoice.invoice_number}</h2>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const prev = filteredInvoices[currentIndexInList - 1] || filteredInvoices[filteredInvoices.length - 1];
                        if (prev) handleViewInvoice(prev.fields.invoice_id);
                      }}><ArrowLeft size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const next = filteredInvoices[currentIndexInList + 1] || filteredInvoices[0];
                        if (next) handleViewInvoice(next.fields.invoice_id);
                      }}><ArrowRight size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Next</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate('/integration/list_invoices')}><X size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Back to List</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Detail table */}
            <div className="flex-1 border-l border-r border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F9F9FB] border-b border-border">
                    <TableCell colSpan={2} className="p-0">
                      <NavigationRightButton items={navItems} />
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Customer */}
                  <TableRow>
                    <TableCell className="border-none w-[150px] max-w-[150px] font-medium">Customer</TableCell>
                    <TableCell className="border-none">
                      <div
                        className={`flex items-center justify-between rounded px-2 py-1 cursor-pointer ${invoice.qb_customer_list_id ? 'bg-green-50' : 'bg-amber-50'}`}
                        onClick={() => handleViewCustomer(invoice.customer_id)}
                        onMouseOver={() => !invoice.qb_customer_list_id && setHovered(true)}
                        onMouseOut={() => setHovered(false)}
                      >
                        <b className={hovered && !invoice.qb_customer_list_id ? 'font-bold text-red-600' : ''}>{invoice.customer_name}</b>
                        <SmallBadge matched={!!invoice.qb_customer_list_id} />
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="border-none font-medium">Date</TableCell>
                    <TableCell className="border-none"><b>{invoice.date}</b></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="border-none font-medium">Total Amount</TableCell>
                    <TableCell className="border-none"><b>$ {invoice.total}</b></TableCell>
                  </TableRow>
                  {invoice.last_sync_date && (
                    <TableRow>
                      <TableCell className="border-none font-medium">Last Sync Date</TableCell>
                      <TableCell className="border-none"><b>{invoice.last_sync_date}</b></TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="border-none font-medium">Number of attempts to sync</TableCell>
                    <TableCell className="border-none"><b>{invoice.number_of_times_synced}</b></TableCell>
                  </TableRow>

                  {/* Line items */}
                  <TableRow>
                    <TableCell className="border-none font-medium">Items</TableCell>
                    <TableCell className="border-none">
                      {invoice.line_items.length > 0 ? (
                        <div className="border border-border rounded overflow-auto max-h-[50vh]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#f9f9fb]">
                                <TableHead>Item Name</TableHead>
                                <TableHead>Item SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...invoice.line_items].sort((a, b) => {
                                const aIsNil = a.qb_list_id == null || a.qb_list_id === '';
                                const bIsNil = b.qb_list_id == null || b.qb_list_id === '';
                                if (aIsNil && bIsNil) return 0;
                                if (aIsNil) return -1;
                                if (bIsNil) return 1;
                                return coll.compare(String(a.qb_list_id), String(b.qb_list_id));
                              }).map((it, idx) => (
                                <TableRow
                                  key={idx}
                                  className={`cursor-pointer ${it.qb_list_id ? 'bg-green-50' : 'bg-amber-50'}`}
                                  onClick={() => handleViewItem(it)}
                                  onMouseOver={() => !it.qb_list_id && setHovered(true)}
                                  onMouseOut={() => setHovered(false)}
                                >
                                  <TableCell className={hovered && !it.qb_list_id ? 'font-bold text-red-600' : ''}>{it.name || '---'}</TableCell>
                                  <TableCell className={hovered && !it.qb_list_id ? 'font-bold text-red-600' : ''}>{it.sku || '---'}</TableCell>
                                  <TableCell>{it.quantity || '---'}</TableCell>
                                  <TableCell>{it.rate ? `$ ${it.rate}` : '---'}</TableCell>
                                  <TableCell><b>$ {it.item_total}</b></TableCell>
                                  <TableCell><SmallBadge matched={!!it.qb_list_id} /></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <Alert className="bg-amber-50 border-amber-300 text-xs py-1"><AlertDescription><b>No items found.</b></AlertDescription></Alert>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Sync items errors */}
                  {(invoice.inserted_in_qb || invoice.items_unmatched.length > 0) && (
                    <TableRow>
                      <TableCell className="border-none font-medium"><b>{!invoice.inserted_in_qb ? 'ERRORS ' : ''}</b>Sync Items</TableCell>
                      <TableCell className="border-none">
                        {invoice.items_unmatched.length > 0 ? (
                          <div className="border border-border rounded overflow-hidden max-h-[400px] overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow><TableHead className="bg-[#f9f9fb] w-[40%]">Item from Zoho</TableHead><TableHead className="bg-[#f9f9fb] w-[50%]">Reason</TableHead><TableHead className="bg-[#f9f9fb]">Action</TableHead></TableRow>
                              </TableHeader>
                              <TableBody>
                                {invoice.items_unmatched.map((it, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{it.zoho_item_unmatched}</TableCell>
                                    <TableCell>
                                      <Alert variant="destructive" className="text-xs py-1">
                                        <AlertDescription><b>{it.reason}</b>{it.qb_list_id && <><br />You can run QBWC Invoices again to update this item.</>}</AlertDescription>
                                      </Alert>
                                    </TableCell>
                                    <TableCell>
                                      {!it.qb_list_id ? (
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-amber-500" onClick={() => handleViewItem(it)}><LinkIcon size={16} /></Button>
                                        </TooltipTrigger><TooltipContent>Do Match</TooltipContent></Tooltip></TooltipProvider>
                                      ) : (
                                        <SmallBadge matched={true} />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : invoice.inserted_in_qb && (
                          <Alert className="bg-green-50 border-green-300 text-xs py-1"><AlertDescription><b>Processed successfully</b></AlertDescription></Alert>
                        )}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Sync customer errors */}
                  {(invoice.inserted_in_qb || invoice.customer_unmatched.length > 0) && (
                    <TableRow>
                      <TableCell className="border-none font-medium"><b>{!invoice.inserted_in_qb ? 'ERRORS ' : ''}</b>Sync Customer</TableCell>
                      <TableCell className="border-none">
                        {invoice.customer_unmatched.length > 0 ? (
                          <div className="border border-border rounded overflow-hidden max-h-[400px] overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow><TableHead className="bg-[#f9f9fb] w-[40%]">Customer from Zoho</TableHead><TableHead className="bg-[#f9f9fb] w-[50%]">Reason</TableHead><TableHead className="bg-[#f9f9fb]">Action</TableHead></TableRow>
                              </TableHeader>
                              <TableBody>
                                {invoice.customer_unmatched.map((cu, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{cu.zoho_customer_unmatched}</TableCell>
                                    <TableCell>
                                      <Alert variant="destructive" className="text-xs py-1">
                                        <AlertDescription><b>{cu.reason}</b>{cu.qb_list_id && <><br />You can run QBWC Invoices again to update this customer.</>}</AlertDescription>
                                      </Alert>
                                    </TableCell>
                                    <TableCell>
                                      {!cu.qb_list_id ? (
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-amber-500" onClick={() => handleViewCustomer(cu)}><LinkIcon size={16} /></Button>
                                        </TooltipTrigger><TooltipContent>Do Match</TooltipContent></Tooltip></TooltipProvider>
                                      ) : (
                                        <SmallBadge matched={true} />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : invoice.inserted_in_qb && (
                          <Alert className="bg-green-50 border-green-300 text-xs py-1"><AlertDescription><b>Processed successfully</b></AlertDescription></Alert>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesDetails;
