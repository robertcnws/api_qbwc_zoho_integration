import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
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

const ItemsDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();

  const [coincidences, setCoincidences] = useState([]);
  const [item, setItem] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingQbItems, setLoadingQbItems] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [qbItems, setQbItems] = useState([]);
  const [qbSelectedItem, setQbSelectedItem] = useState(null);
  const [filteredQbItems, setFilteredQbItems] = useState([]);
  const [searchTermQbItems, setSearchTermQbItems] = useState('');
  const [showListQbItems, setShowListQbItems] = useState(false);
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [currentIndexInList, setCurrentIndexInList] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);

  const containerRef = useRef(null);
  const selectedRowRef = useRef(null);

  useEffect(() => {
    const idx = filteredItems.findIndex((i) => (item ? i.fields.item_id === item.item_id : false));
    setCurrentIndexInList(idx);
  }, [item, filteredItems]);

  const filterItems = (flt, term) => {
    const allItems = location.state?.items || [];
    return allItems.filter((i) => {
      const matchesFilter =
        flt === 'all'
          ? true
          : flt === 'matched'
          ? i.fields.qb_list_id !== null && i.fields.qb_list_id !== ''
          : flt === 'custom'
          ? i.fields.is_custom === true
          : !i.fields.qb_list_id || i.fields.qb_list_id === '';
      const t = (term || '').toLowerCase();
      const f = i.fields || {};
      const matchesTerm =
        !t ||
        (f.item_name || '').toLowerCase().includes(t) ||
        (f.sku || '').toLowerCase().includes(t) ||
        (f.name || '').toLowerCase().includes(t) ||
        (f.description || '').toLowerCase().includes(t) ||
        String(f.rate || '').toLowerCase().includes(t);
      return matchesFilter && matchesTerm;
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    setFilteredItems(filterItems(newFilter, searchSelectTerm));
    setPage(0);
  };

  const handleSearchSelectChange = (e) => {
    const newTerm = e.target.value;
    setSearchSelectTerm(newTerm);
    setFilteredItems(filterItems(filter, newTerm));
    setPage(0);
  };

  useEffect(() => {
    setFilteredItems(location.state?.filteredItems || []);
    setFilter(location.state?.filter || 'all');

    const locItem = location.state?.item;
    if (!locItem) {
      navigate('/integration/list_items');
      return;
    }
    const itemId = locItem.fields ? locItem.fields.item_id : locItem.item_id;

    const fetchItemDetails = async () => {
      try {
        const url = `${apiUrl}/api_zoho_items/view_item/${itemId}/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        setItem(response.data);
        setCoincidences(response.data.coincidences);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) setError('Error fetching item details: Item not found.');
        else if (status === 500) setError('Error fetching item details: Internal Server Error.');
        else if (status === 401) setError('Error fetching item details: Unauthorized.');
        else setError(`Error fetching item details: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    const qbFetchItems = async () => {
      try {
        const url = `${apiUrl}/api_quickbook_soap/qbwc_items/not_matched`;
        const response = await fetchWithToken(url, 'GET', null, {});
        const jsonData = JSON.parse(response.data);
        setQbItems(jsonData);
      } catch (err) {
        setError(`Failed to fetch qb items: ${err}`);
      } finally {
        setLoadingQbItems(false);
      }
    };
    qbFetchItems();
    const intervalId = setInterval(qbFetchItems, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const t = (searchTermQbItems || '').toLowerCase();
    const filtered = qbItems.filter((q) => (q.fields?.name || '').toLowerCase().includes(t));
    setFilteredQbItems(filtered);
    setShowListQbItems(filtered.length > 0 && searchTermQbItems.length > 0);
  }, [searchTermQbItems, qbItems]);

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
    } else if (backNav === 'qbwc_items') {
      navigate('/integration/qbwc/items/list');
    } else {
      navigate(-1);
    }
  };

  const handleSetCustom = useCallback(async (itemData) => {
    const typeSet = itemData.is_custom ? 'unset custom' : 'set custom';
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: `Do you want to ${typeSet} for this item: ${itemData.name}?`,
      icon: 'warning',
      confirmText: `Yes, ${typeSet}!`,
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_zoho_items/set_custom_item/${itemData.item_id}/`;
      const response = await fetchWithToken(url, 'POST', {}, {});
      if (response.data.status === 'success') {
        toast.success('Item custom status updated.');
        setItem((prev) => ({ ...prev, is_custom: !prev.is_custom }));
      } else {
        toast.error(`Error: ${response.data.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err}`);
    }
  }, [confirm]);

  const handleMatchItem = async (item_id, qb_item_list_id, action) => {
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: `Do you want to ${action} this item?`,
      icon: 'warning',
      confirmText: `Yes, ${action} it!`,
      variant: 'default',
    });
    if (!confirmed) return;
    try {
      const url = `${apiUrl}/api_zoho_items/match_one_item_ajax/`;
      const data = { item_id, qb_item_list_id, action, username: localStorage.getItem('username') };
      const response = await fetchWithToken(url, 'POST', data, {});
      if (response.data.status === 'success') {
        toast.success(response.data.message);
        try {
          const refreshUrl = `${apiUrl}/api_zoho_items/list_items/`;
          const res = await fetchWithToken(refreshUrl, 'GET', null, {});
          const jsonData = JSON.parse(res.data);
          let filteredList = jsonData;
          if (filter === 'matched') filteredList = jsonData.filter((i) => i.fields.qb_list_id !== null && i.fields.qb_list_id !== '');
          else if (filter === 'unmatched') filteredList = jsonData.filter((i) => !i.fields.qb_list_id || i.fields.qb_list_id === '');
          else if (filter === 'custom') filteredList = jsonData.filter((i) => i.fields.is_custom);
          setFilteredItems(filteredList);
          navigate('/integration/item_details', {
            state: { item: { fields: item }, items: jsonData, filteredItems: filteredList, filter },
          });
        } catch (err) {
          setError(`Failed to fetch items: ${err}`);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(`Error matching item: ${err}`);
    }
  };

  const getBackgroundColor = (row) => {
    if (!item) return '';
    return row.fields.item_id === item.item_id ? 'bg-gray-200' : '';
  };

  const handleChangePage = (newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (rows) => { setRowsPerPage(rows); setPage(0); };

  useEffect(() => { setSelectedId(item?.item_id ?? null); }, [item]);

  useLayoutEffect(() => {
    if (!filteredItems || selectedId == null || rowsPerPage <= 0) return;
    const idx = filteredItems.findIndex((r) => r.fields.item_id === selectedId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / rowsPerPage);
    if (targetPage !== page) setPage(targetPage);
  }, [selectedId, filteredItems, rowsPerPage]);

  useLayoutEffect(() => {
    const rowEl = selectedRowRef.current;
    if (!rowEl) return;
    rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId, page]);

  const fetchItemDetails = async (itemId) => {
    try {
      const url = `${apiUrl}/api_zoho_items/view_item/${itemId}/`;
      const response = await fetchWithToken(url, 'GET', null, {});
      setItem(response.data);
      setCoincidences(response.data.coincidences);
    } catch {}
  };

  const backNav = localStorage.getItem('backNavigation');
  const filterConfig = {
    filter,
    handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Items' },
      { value: 'matched', label: 'Matched Items' },
      { value: 'unmatched', label: 'Unmatched Items' },
      { value: 'custom', label: 'Custom Items' },
    ],
    hasSearch: true,
    searchSelectTerm,
    searchPlaceholder: 'Search Item',
    handleSearchSelectChange,
  };

  if (loading) return <AlertLoading message="Item Details" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="w-full py-0 flex flex-col gap-4">
      {!item ? (
        <div className="flex flex-col gap-2">
          <Alert variant="warning"><AlertDescription>No item found.</AlertDescription></Alert>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><X size={18} className="text-red-500" /></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-4 items-stretch">
          {/* Left column */}
          <div className="border border-border rounded-xl p-3 bg-background flex flex-col md:min-h-[640px]">
            <div className="mb-2"><CustomFilter config={filterConfig} /></div>
            <div ref={containerRef} className="flex-1 overflow-auto max-h-[280px] md:max-h-[640px]">
              <Table>
                <TableBody>
                  {filteredItems && filteredItems.length > 0 ? (
                    (rowsPerPage > 0
                      ? filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : filteredItems
                    ).map((row, idx) => {
                      const isSelected = row.fields.item_id === selectedId;
                      return (
                        <TableRow
                          key={`${row.fields.item_id}-${idx}`}
                          ref={isSelected ? selectedRowRef : null}
                          className={`cursor-pointer hover:bg-gray-100 ${getBackgroundColor(row)}`}
                          onClick={() => fetchItemDetails(row.fields.item_id)}
                        >
                          <TableCell className="py-3">
                            <b>{row.fields.item_name}</b>
                            {row.fields.sku && <><br /><span className="text-xs text-muted-foreground">SKU: {row.fields.sku}</span></>}
                            {row.fields.rate && <><br /><span className="text-xs text-muted-foreground">Rate: $ {row.fields.rate}</span></>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell>No items found.</TableCell></TableRow>
                  )}
                  <TableCustomPagination
                    colSpan={1}
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

          {/* Right column */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <h2 className="text-lg font-bold uppercase">{item.name || '--'}</h2>
              <div className="flex gap-1">
                {(backNav === 'invoice_details' || backNav === 'qbwc_items' || backNav === 'sales_order_details') && (
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
                        const prev = filteredItems[currentIndexInList - 1] || filteredItems[filteredItems.length - 1];
                        if (prev) fetchItemDetails(prev.fields.item_id);
                      }}><ArrowLeft size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const next = filteredItems[currentIndexInList + 1] || filteredItems[0];
                        if (next) fetchItemDetails(next.fields.item_id);
                      }}><ArrowRight size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Next</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate('/integration/list_items')}><X size={18} /></Button>
                    </TooltipTrigger>
                    <TooltipContent>Back to List</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-background flex-1">
              <div className="overflow-auto h-full">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="w-[160px] border-none font-medium">Zoho Item ID</TableCell>
                      <TableCell className="border-none"><b>{item.item_id}</b></TableCell>
                    </TableRow>
                    {item.sku && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Item SKU</TableCell>
                        <TableCell className="border-none"><b>{item.sku}</b></TableCell>
                      </TableRow>
                    )}
                    {item.rate && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Item Rate</TableCell>
                        <TableCell className="border-none"><b>$ {item.rate}</b></TableCell>
                      </TableRow>
                    )}
                    {item.status && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Item Status</TableCell>
                        <TableCell className="border-none"><b>{item.status}</b></TableCell>
                      </TableRow>
                    )}
                    {item.description && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Zoho Item Description</TableCell>
                        <TableCell className="border-none"><b>{item.description}</b></TableCell>
                      </TableRow>
                    )}
                    {item.qb_list_id && (
                      <TableRow>
                        <TableCell className="border-none font-medium">QB Item Info</TableCell>
                        <TableCell className="border-none">
                          <div className="flex flex-col gap-1">
                            <span>QB List ID: <b>{item.qb_list_id}</b></span>
                            {item.qb_item?.name && <span>Matched QB Item: <b>{item.qb_item.name}</b></span>}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-fit mt-1"
                              onClick={() => {
                                localStorage.setItem('backNavigation', 'item_details');
                                navigate('/integration/qbwc/item_details', {
                                  state: {
                                    item: { fields: { list_id: item.qb_list_id, name: item.qb_item?.name || '', matched: true } },
                                    items: [],
                                    zohoItems: filteredItems.map(i => i.fields ? i : { fields: i }),
                                    filter: 'all',
                                  },
                                });
                              }}
                            >
                              View QB Item Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="border-none font-medium">Custom Item?</TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Alert className={`${item.is_custom ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'} text-xs py-1 px-2 w-fit`}>
                            <AlertDescription><b>{item.is_custom ? 'Custom Item' : 'Stock Item'}</b></AlertDescription>
                          </Alert>
                          <Button
                            size="sm"
                            variant={item.is_custom ? 'destructive' : 'default'}
                            onClick={() => handleSetCustom(item)}
                          >
                            {item.is_custom ? 'Quit Custom' : 'Set Custom'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Coincidences */}
                    <TableRow>
                      <TableCell className="border-none font-medium">Coincidences by Order</TableCell>
                      <TableCell className="border-none">
                        {coincidences.length > 0 && !item.matched ? (
                          <div className="border border-border rounded overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-[#f2f3f5]">
                                  <TableHead>QB Item Name</TableHead>
                                  <TableHead>Coincidence Name</TableHead>
                                  <TableHead>Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {coincidences.map((c, i) => (
                                  <TableRow key={`${c.qb_item_list_id}-${i}`}>
                                    <TableCell>{c.qb_item_name}</TableCell>
                                    <TableCell>{c.coincidence_name}</TableCell>
                                    <TableCell>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-blue-500"
                                              onClick={() => handleMatchItem(item.item_id, c.qb_item_list_id, 'match')}>
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
                        ) : item.matched ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <Alert className="bg-green-50 border-green-300 text-xs py-1 px-2 w-fit">
                              <AlertDescription><b>Item already matched.</b></AlertDescription>
                            </Alert>
                            <Button size="sm" variant="destructive"
                              onClick={() => handleMatchItem(item.item_id, item.qb_list_id, 'unmatch')}>
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
                    {!item.matched && (
                      <TableRow>
                        <TableCell className="border-none font-medium">Force Matching</TableCell>
                        <TableCell className="border-none">
                          {!loadingQbItems ? (
                            <div className="w-full flex flex-col gap-2">
                              <div className="relative">
                                <input
                                  type="text"
                                  className="w-full border border-border rounded px-3 py-1.5 text-sm pr-8"
                                  placeholder={`Search QB Items (${filteredQbItems.length})`}
                                  value={searchTermQbItems}
                                  onChange={(e) => { setQbSelectedItem(null); setSearchTermQbItems(e.target.value); }}
                                />
                                {searchTermQbItems && (
                                  <button className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => { setQbSelectedItem(null); setSearchTermQbItems(''); setShowListQbItems(false); }}>
                                    <XCircle size={14} className="text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                              {showListQbItems && (
                                <div className="border border-border rounded overflow-auto max-h-[200px]">
                                  {filteredQbItems.map((it) => (
                                    <div
                                      key={it.fields.list_id}
                                      className="px-4 py-2 text-sm cursor-pointer bg-[#f7f7f8] hover:bg-[#ececf1] border-b border-border last:border-0"
                                      onClick={() => {
                                        setSearchTermQbItems(`${it.fields.name} (ID: ${it.fields.list_id})`);
                                        setQbSelectedItem(it);
                                        setShowListQbItems(false);
                                      }}
                                    >
                                      {it.fields.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button size="sm" className="self-start" disabled={qbSelectedItem === null}
                                onClick={() => handleMatchItem(item.item_id, qbSelectedItem?.fields.list_id || '', 'match')}>
                                Match
                              </Button>
                            </div>
                          ) : (
                            <Alert className="bg-blue-50 border-blue-300 text-xs py-1 px-2">
                              <AlertDescription><b>Loading QB Items...</b></AlertDescription>
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

export default ItemsDetails;
