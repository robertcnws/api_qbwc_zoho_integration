import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, CheckCircle, XCircle, Wallet } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CustomFilter } from '@/components/shared/CustomFilter';
import { TableCustomPagination } from '@/components/shared/TableCustomPagination';
import { NavigationRightButton } from '@/components/shared/NavigationRightButton';

const DEFAULT_ROWS = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10;

const QbwcItemDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [zohoItems, setZohoItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [selectedId, setSelectedId] = useState(null);
  const [currentIndexInList, setCurrentIndexInList] = useState(-1);

  const selectedRowRef = useRef(null);

  useEffect(() => {
    const locItem = location.state?.item;
    const locItems = location.state?.items || [];
    const locZohoItems = location.state?.zohoItems || [];
    const locFilter = location.state?.filter || 'all';

    if (!locItem) {
      navigate('/integration/qbwc/items/list');
      return;
    }

    setItem(locItem);
    setAllItems(locItems);
    setZohoItems(locZohoItems);
    setFilter(locFilter);
    setFilteredItems(applyFilter(locItems, locFilter, ''));
    setSelectedId(locItem.fields.list_id);
  }, [location.state]);

  useEffect(() => {
    if (!item) return;
    const idx = filteredItems.findIndex(i => i.fields.list_id === item.fields.list_id);
    setCurrentIndexInList(idx);
  }, [item, filteredItems]);

  useLayoutEffect(() => {
    if (!filteredItems || selectedId == null || rowsPerPage <= 0) return;
    const idx = filteredItems.findIndex(r => r.fields.list_id === selectedId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / rowsPerPage);
    if (targetPage !== page) setPage(targetPage);
  }, [selectedId, filteredItems, rowsPerPage]);

  useLayoutEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId, page]);

  const applyFilter = (items, flt, term) => {
    return items.filter(i => {
      const matchesFilter =
        flt === 'all' ? true
        : flt === 'matched' ? i.fields.matched
        : !i.fields.matched;
      const t = term.toLowerCase();
      const matchesTerm = !t ||
        (i.fields.name || '').toLowerCase().includes(t) ||
        (i.fields.list_id || '').toLowerCase().includes(t) ||
        (i.fields.item_type || '').toLowerCase().includes(t);
      return matchesFilter && matchesTerm;
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    setFilteredItems(applyFilter(allItems, newFilter, searchSelectTerm));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchSelectTerm(term);
    setFilteredItems(applyFilter(allItems, filter, term));
    setPage(0);
  };

  const selectItem = (selected) => {
    setItem(selected);
    setSelectedId(selected.fields.list_id);
  };

  const handlePrev = () => {
    const prev = filteredItems[currentIndexInList - 1] || filteredItems[filteredItems.length - 1];
    if (prev) selectItem(prev);
  };

  const handleNext = () => {
    const next = filteredItems[currentIndexInList + 1] || filteredItems[0];
    if (next) selectItem(next);
  };

  const getMatchedZohoItem = (listId) =>
    zohoItems.find(z => z.fields.qb_list_id === listId) || null;

  const filterConfig = {
    filter,
    handleFilterChange,
    listValues: [
      { value: 'all', label: 'All Items' },
      { value: 'matched', label: 'Matched Items' },
      { value: 'not_matched', label: 'Unmatched Items' },
    ],
  };

  const navItems = [
    {
      label: 'Back to QB Items',
      icon: <Wallet size={16} className="mr-1" />,
      route: '/integration/qbwc/items/list',
      visible: true,
    },
  ];

  const pagedRows = rowsPerPage > 0
    ? filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredItems;

  if (!item) return null;

  const matchedZohoItem = getMatchedZohoItem(item.fields.list_id);
  const itemTypePretty = item.fields.item_type
    ? item.fields.item_type.replace(/^Zoho_/, '').replace(/ItemType$/, '')
    : '—';

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
              placeholder="Search QB items..."
              value={searchSelectTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableBody>
                {pagedRows.length === 0 ? (
                  <TableRow><TableCell className="text-muted-foreground text-sm">No items found.</TableCell></TableRow>
                ) : (
                  pagedRows.map((row) => {
                    const isSelected = row.fields.list_id === selectedId;
                    return (
                      <TableRow
                        key={row.fields.list_id}
                        ref={isSelected ? selectedRowRef : null}
                        className={`cursor-pointer hover:bg-gray-100 transition-colors ${isSelected ? 'bg-gray-200' : ''}`}
                        onClick={() => selectItem(row)}
                      >
                        <TableCell className="py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">{row.fields.name}</p>
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
                  data={filteredItems}
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
            <h2 className="text-lg font-bold uppercase truncate">{item.fields.name}</h2>
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
                    <Button variant="ghost" size="icon" onClick={() => navigate('/integration/qbwc/items/list')}>
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
            {item.fields.matched
              ? <Badge className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-100">Matched</Badge>
              : <Badge className="bg-red-100 text-red-600 border border-red-300 hover:bg-red-100">Not Matched</Badge>}
          </div>

          {/* Detail table */}
          <div className="border border-border rounded-xl overflow-hidden bg-background">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-[180px] font-medium text-muted-foreground">QB Item Name</TableCell>
                  <TableCell><b>{item.fields.name}</b></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">QB List ID</TableCell>
                  <TableCell><b>{item.fields.list_id}</b></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Item Type</TableCell>
                  <TableCell><b>{itemTypePretty}</b></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Match Status</TableCell>
                  <TableCell>
                    {item.fields.matched
                      ? <span className="flex items-center gap-1 text-green-700 font-medium"><CheckCircle size={15} /> Matched</span>
                      : <span className="flex items-center gap-1 text-red-500 font-medium"><XCircle size={15} /> Not Matched</span>}
                  </TableCell>
                </TableRow>

                {/* Matched Zoho item */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Matched Zoho Item</TableCell>
                  <TableCell>
                    {matchedZohoItem ? (
                      <div className="flex flex-col gap-1">
                        <p><b>{matchedZohoItem.fields.name || matchedZohoItem.fields.item_name}</b></p>
                        {matchedZohoItem.fields.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {matchedZohoItem.fields.sku}</p>
                        )}
                        {matchedZohoItem.fields.rate && (
                          <p className="text-xs text-muted-foreground">Rate: $ {matchedZohoItem.fields.rate}</p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-fit mt-1"
                          onClick={() => {
                            localStorage.setItem('backNavigation', 'qbwc_items');
                            navigate('/integration/item_details', {
                              state: {
                                item: matchedZohoItem,
                                items: zohoItems,
                                filteredItems: zohoItems,
                                filter: 'all',
                              },
                            });
                          }}
                        >
                          View Zoho Item Details
                        </Button>
                      </div>
                    ) : (
                      <Alert className="bg-amber-50 border-amber-300 text-xs py-1 px-2 w-fit">
                        <AlertDescription><b>No Zoho item matched yet.</b></AlertDescription>
                      </Alert>
                    )}
                  </TableCell>
                </TableRow>

                {/* Raw item type */}
                {item.fields.item_type && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground">Raw Type</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.fields.item_type}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QbwcItemDetails;
