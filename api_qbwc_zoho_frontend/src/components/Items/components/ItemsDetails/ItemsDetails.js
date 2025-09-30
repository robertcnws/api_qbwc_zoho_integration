import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  FormControl,
  MenuItem,
  CircularProgress,
  TextField,
  styled,
  InputAdornment,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { List, AutoSizer } from 'react-virtualized';
import { grey } from '@mui/material/colors';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from 'sweetalert2';

import { fetchWithToken } from '../../../../utils';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';
import { ArrowBackIos, ArrowForward, ArrowForwardIos, ArrowForwardOutlined } from '@mui/icons-material';

const apiUrl =
  process.env.REACT_APP_ENVIRONMENT === 'DEV'
    ? process.env.REACT_APP_BACKEND_URL_DEV
    : process.env.REACT_APP_BACKEND_URL_PROD;

const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE, 10) || 10;

const LEFT_COL_WIDTH = 400;    // <- columna izquierda fija
const LIST_MIN_HEIGHT = 640;
const DETAILS_MIN_HEIGHT = 640;

const StyledMenuItem = styled(MenuItem)({
  backgroundColor: '#f7f7f8',
  '&:hover': { backgroundColor: '#ececf1' },
  padding: '10px 16px',
  borderBottom: '1px solid #eee',
});

const ItemsDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [coincidences, setCoincidences] = useState([]);
  const [item, setItem] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [loadingQbItems, setLoadingQbItems] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(numberRows);

  const [qbItems, setQbItems] = useState([]);
  const [qbSelectedItem, setQbSelectedItem] = useState(null);
  const [filteredQbItems, setFilteredQbItems] = useState([]);
  const [searchTermQbItems, setSearchTermQbItems] = useState('');
  const [showListQbItems, setShowListQbItems] = useState(true);

  const [searchSelectTerm, setSearchSelectTerm] = useState('');

  const [currentIndexInList, setCurrentIndexInList] = useState(-1);

  useEffect(() => {
    const index = filteredItems.findIndex((i) => (item ? i.fields.item_id === item.item_id : false));
    setCurrentIndexInList(index);
  }, [item, filteredItems]);

  // --- Helpers
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

  // --- Initial load from location.state
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
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        setItem(response.data);
        setCoincidences(response.data.coincidences);
      } catch (err) {
        // map algunos status si vienen
        const status = err?.response?.status;
        if (status === 404) setError('Error fetching item details: Item not found (Go Zoho option and reload Items).');
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

  // --- QB items (not matched) + poll
  useEffect(() => {
    const qbFetchItems = async () => {
      try {
        const url = `${apiUrl}/api_quickbook_soap/qbwc_items/not_matched`;
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        const jsonData = JSON.parse(response.data);
        setQbItems(jsonData);
      } catch (err) {
        setError(`Failed to fetch qn items: ${err}`);
      } finally {
        setLoadingQbItems(false);
      }
    };
    qbFetchItems();
    const intervalId = setInterval(qbFetchItems, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Filter QB items by search term
  useEffect(() => {
    const t = (searchTermQbItems || '').toLowerCase();
    const filtered = qbItems.filter((q) => (q.fields?.name || '').toLowerCase().includes(t));
    setFilteredQbItems(filtered);
    setShowListQbItems(filtered.length > 0);
  }, [searchTermQbItems, qbItems]);

  const handleSelectQbItem = (qbItem) => {
    setSearchTermQbItems(`${qbItem.fields.name} (ID: ${qbItem.fields.list_id})`);
    setQbSelectedItem(qbItem);
  };

  const handleSearchQbItem = (e) => {
    setQbSelectedItem(null);
    setSearchTermQbItems(e.target.value);
  };

  const handleClearSearch = () => {
    setQbSelectedItem(null);
    setSearchTermQbItems('');
  };

  const rowRenderer = ({ key, index, style }) => {
    const it = filteredQbItems[index];
    return (
      <StyledMenuItem key={key} style={style} value={it.fields.list_id} onClick={() => handleSelectQbItem(it)}>
        {it.fields.name}
      </StyledMenuItem>
    );
  };

  const handleBackNavigation = () => {
    if (localStorage.getItem('backNavigation') === 'invoice_details') {
      const invoice = JSON.parse(localStorage.getItem('invoice'));
      if (invoice && !('fields' in invoice)) invoice.fields = invoice;
      const state = {
        invoice,
        invoices: JSON.parse(localStorage.getItem('invoices')),
        filteredInvoices: JSON.parse(localStorage.getItem('filteredInvoices')),
        filter: JSON.parse(localStorage.getItem('filterInvoices')),
      };
      navigate(`/integration/${localStorage.getItem('backNavigation')}`, { state });
    } else if (localStorage.getItem('backNavigation') === 'sales_order_details') {
      const salesOrder = JSON.parse(localStorage.getItem('salesOrder'));
      if (salesOrder && !('fields' in salesOrder)) salesOrder.fields = salesOrder;
      const state = {
        salesOrder,
        salesOrders: JSON.parse(localStorage.getItem('salesOrders')),
        filteredSalesOrders: JSON.parse(localStorage.getItem('filteredSalesOrders')),
        filter: JSON.parse(localStorage.getItem('filterSalesOrders')),
      };
      navigate(`/integration/${localStorage.getItem('backNavigation')}`, { state });
    } else {
      navigate(-1);
    }
  };

  const handleSetCustom = useCallback((item) => {
    const typeSet = item.is_custom ? 'unset custom' : 'set custom';
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${typeSet} for this item: ${item.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${typeSet}!`,
    }).then((result) => {
      if (!result.isConfirmed) return;
      (async () => {
        try {
          const url = `${apiUrl}/api_zoho_items/set_custom_item/${item.item_id}/`;
          const response = await fetchWithToken(url, 'POST', {}, {}, apiUrl);
          if (response.data.status === 'success') {
            Swal.fire('Success!', 'Selected invoices have been unsynced.', 'success').then(() => {
              setItem((prev) => ({ ...prev, is_custom: !prev.is_custom }));
            });
          } else {
            Swal.fire('Error!', `Error: ${response.data.message}`, 'error');
          }
        } catch (err) {
          Swal.fire('Error!', `Error: ${err}`, 'error');
        }
      })();
    });
  }, []);

  const handleMatchItem = (item_id, qb_item_list_id, action) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${action} this item?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action} it!`,
    }).then((result) => {
      if (!result.isConfirmed) return;

      const matchOneItemAjax = async () => {
        try {
          const url = `${apiUrl}/api_zoho_items/match_one_item_ajax/`;
          const data = {
            item_id,
            qb_item_list_id,
            action,
            username: localStorage.getItem('username'),
          };
          const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
          if (response.data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: response.data.message,
              willClose: () => {
                const fetchData = async () => {
                  try {
                    const url = `${apiUrl}/api_zoho_items/list_items/`;
                    const res = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                    const jsonData = JSON.parse(res.data);
                    let filteredList = jsonData;
                    if (filter === 'matched') {
                      filteredList = jsonData.filter((i) => i.fields.qb_list_id !== null && i.fields.qb_list_id !== '');
                    } else if (filter === 'unmatched') {
                      filteredList = jsonData.filter((i) => !i.fields.qb_list_id || i.fields.qb_list_id === '');
                    } else if (filter === 'custom') {
                      filteredList = jsonData.filter((i) => i.fields.is_custom);
                    }
                    const state = {
                      item: { fields: item },
                      items: jsonData,
                      filteredItems: filteredList,
                      filter,
                    };
                    setFilteredItems(filteredList);
                    navigate('/integration/item_details', { state });
                  } catch (err) {
                    setError(`Failed to fetch items: ${err}`);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchData();
              },
            });
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: response.data.message });
          }
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: `Error matching item: ${err}` });
        }
      };

      matchOneItemAjax();
    });
  };

  const getBackgroundColor = (row) => {
    if (!item) return 'transparent';
    return row.fields.item_id === item.item_id ? grey[200] : 'transparent';
  };

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    const rows = parseInt(e.target.value, 10);
    setRowsPerPage(rows);
    setPage(0);
  };

  const configCustomFilter = {
    filter,
    handleFilterChange,
    searchSelectTerm,
    handleSearchSelectChange,
    listValues: [
      { value: 'all', label: 'All Items' },
      { value: 'matched', label: 'Matched Items' },
      { value: 'unmatched', label: 'Unmatched Items' },
      { value: 'custom', label: 'Custom Items' }
    ],
    hasSearch: true,
    searchPlaceholder: 'Search Item',
    marginBottomInDetails: '11px',
  };

  if (loading) return <AlertLoading isSmallScreen={isSmallScreen} message="Item Details" />;
  if (error) return <AlertError isSmallScreen={isSmallScreen} error={error} redirect={handleBackNavigation} />;

  return (
    <Box
      sx={{
        width: '100%',
        px: 0,
        py: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {!item ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Alert severity="warning">No item found.</Alert>
          <Box>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'error.main' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: `${LEFT_COL_WIDTH}px 1fr` }, // izquierda = 400px
            gap: 2,
            alignItems: 'stretch',
            minHeight: { md: DETAILS_MIN_HEIGHT },
          }}
        >
          {/* Columna izquierda: filtro + lista */}
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 1.5,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { md: LIST_MIN_HEIGHT },
            }}
          >
            <Box sx={{ mb: 1 }}>
              <CustomFilter configCustomFilter={configCustomFilter} />
            </Box>

            <TableContainer sx={{ flex: 1, minHeight: 300, maxHeight: LIST_MIN_HEIGHT }}>
              <Table size="small" aria-label="filtered items table">
                <TableBody>
                  {filteredItems && filteredItems.length > 0 ? (
                    (rowsPerPage > 0
                      ? filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : filteredItems
                    ).map((row, idx) => (
                      <TableRow
                        key={`${row.fields.item_id}-${idx}`}
                        hover
                        onClick={() => {
                          const fetchItemsDetails = async () => {
                            try {
                              const url = `${apiUrl}/api_zoho_items/view_item/${row.fields.item_id}/`;
                              const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                              setItem(response.data);
                              setCoincidences(response.data.coincidences);
                            } catch { }
                          };
                          fetchItemsDetails();
                        }}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: getBackgroundColor(row),
                        }}
                      >
                        <TableCell sx={{ py: 1.25 }}>
                          <b>{row.fields.item_name}</b>
                          {row.fields.sku && (
                            <>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                SKU: {row.fields.sku}
                              </Typography>
                            </>
                          )}
                          {row.fields.rate && (
                            <>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Rate: $ {row.fields.rate}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell>No items found.</TableCell>
                    </TableRow>
                  )}

                  <TableCustomPagination
                    columnsLength={1}
                    data={filteredItems}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Columna derecha (400px): header + detalles */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              minHeight: { md: DETAILS_MIN_HEIGHT },
            }}
          >
            {/* Header del detalle */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="h6" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                {item.name || '--'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {(localStorage.getItem('backNavigation') === 'invoice_details' ||
                  localStorage.getItem('backNavigation') === 'sales_order_details') && (
                    <Tooltip
                      title={`Go Back to ${localStorage.getItem('backNavigation') === 'invoice_details' ? 'Invoice' : 'Sales Order'} Details`}
                      arrow
                      sx={{
                        '& .MuiTooltip-tooltip': {
                          backgroundColor: '#000',
                          color: '#fff',
                          fontSize: '0.875rem',
                        },
                      }}
                    >
                      <IconButton onClick={handleBackNavigation} sx={{ color: '#000' }}>
                        <ArrowBackIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Tooltip
                  title="Previous in List Items"
                  arrow
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#000',
                      color: '#fff',
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  <IconButton 
                  onClick={() => {
                    const prevItem = filteredItems[currentIndexInList - 1] || filteredItems[filteredItems.length - 1];
                    if (prevItem) {
                      const fetchItemsDetails = async () => {
                        try {
                          const url = `${apiUrl}/api_zoho_items/view_item/${prevItem.fields.item_id}/`;
                          const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                          setItem(response.data);
                          setCoincidences(response.data.coincidences);
                        } catch { }
                      };
                      fetchItemsDetails();
                    }
                  }} sx={{ color: '#000' }}>
                    <ArrowBackIos />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title="Next in List Items"
                  arrow
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#000',
                      color: '#fff',
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  <IconButton 
                  onClick={() => {
                    const nextItem = filteredItems[currentIndexInList + 1] || filteredItems[0];
                    if (nextItem) {
                      const fetchItemsDetails = async () => {
                        try {
                          const url = `${apiUrl}/api_zoho_items/view_item/${nextItem.fields.item_id}/`;
                          const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                          setItem(response.data);
                          setCoincidences(response.data.coincidences);
                        } catch { }
                      };
                      fetchItemsDetails();
                    }
                  }} sx={{ color: '#000' }}>
                    <ArrowForwardIos />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Back to List Items"
                  arrow
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#000',
                      color: '#fff',
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  <IconButton onClick={() => navigate('/integration/list_items')} sx={{ color: '#000' }}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Card de detalles */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                flex: 1,
                minHeight: 360,
              }}
            >
              <TableContainer sx={{ maxHeight: { xs: 520, md: DETAILS_MIN_HEIGHT } }}>
                <Table aria-label="item details table" size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ width: 160, border: 'none' }}>Zoho Item ID</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <b>{item.item_id}</b>
                      </TableCell>
                    </TableRow>

                    {item.sku && (
                      <TableRow>
                        <TableCell sx={{ width: 160, border: 'none' }}>Zoho Item SKU</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{item.sku}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {item.rate && (
                      <TableRow>
                        <TableCell sx={{ width: 160, border: 'none' }}>Zoho Item Rate</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>$ {item.rate}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {item.status && (
                      <TableRow>
                        <TableCell sx={{ width: 160, border: 'none' }}>Zoho Item Status</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{item.status}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {item.description && (
                      <TableRow>
                        <TableCell sx={{ width: 160, border: 'none' }}>Zoho Item Description</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{item.description}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {item.qb_list_id && (
                      <TableRow>
                        <TableCell sx={{ width: 160, border: 'none' }}>QB Item Info</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          QB List ID: <b>{item.qb_list_id}</b>
                          {item.qb_item?.name && (
                            <>
                              <br />
                              Matched QB Item: <b>{item.qb_item.name}</b>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow>
                      <TableCell sx={{ width: 160, border: 'none' }}>Custom Item?</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Alert
                            severity={`${item.is_custom ? 'success' : 'info'}`}
                            sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                            <b>{item.is_custom ? 'Custom Item' : 'Stock Item'}</b>
                          </Alert>
                          <Button
                            variant="contained"
                            color={item.is_custom ? 'error' : 'primary'}
                            size="small"
                            onClick={() => handleSetCustom(item)}
                          >
                            {item.is_custom ? 'Quit Custom' : 'Set Custom'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Coincidences */}
                    <TableRow>
                      <TableCell sx={{ width: 160, border: 'none' }}>Coincidences by Order</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        {coincidences.length > 0 && !item.matched ? (
                          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                            <Table size="small" aria-label="coincidences table">
                              <TableHead sx={{ bgcolor: '#f2f3f5' }}>
                                <TableRow>
                                  <TableCell>QB Item Name</TableCell>
                                  <TableCell>Coincidence Name</TableCell>
                                  <TableCell>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {coincidences.map((c, i) => (
                                  <TableRow key={`${c.qb_item_list_id}-${i}`}>
                                    <TableCell>{c.qb_item_name}</TableCell>
                                    <TableCell>{c.coincidence_name}</TableCell>
                                    <TableCell>
                                      <Tooltip
                                        title="Do Match"
                                        arrow
                                        sx={{
                                          '& .MuiTooltip-tooltip': {
                                            backgroundColor: '#000',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                          },
                                        }}
                                      >
                                        <IconButton
                                          onClick={() => handleMatchItem(item.item_id, c.qb_item_list_id, 'match')}
                                          color="info"
                                          size="small"
                                        >
                                          <LinkIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        ) : item.matched ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Alert severity="success" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                              <b>Item already matched.</b>
                            </Alert>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleMatchItem(item.item_id, item.qb_list_id, 'unmatch')}
                            >
                              UnMatch
                            </Button>
                          </Box>
                        ) : (
                          <Alert severity="warning" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                            <b>No coincidences found.</b>
                          </Alert>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Force Matching */}
                    {!item.matched && (
                      <TableRow>
                        <TableCell sx={{ width: 160, border: 'none' }}>Force Matching</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          {!loadingQbItems ? (
                            <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
                              <TextField
                                label={`Search QB Items (${filteredQbItems.length})`}
                                variant="outlined"
                                fullWidth
                                value={searchTermQbItems}
                                onChange={(e) => {
                                  setQbSelectedItem(null);
                                  setSearchTermQbItems(e.target.value);
                                }}
                                InputProps={{
                                  endAdornment: (
                                    <>
                                      {loading && <CircularProgress size={20} />}
                                      <InputAdornment position="end">
                                        <Tooltip
                                          title="Clear Search"
                                          arrow
                                          sx={{
                                            '& .MuiTooltip-tooltip': {
                                              backgroundColor: '#000',
                                              color: '#fff',
                                              fontSize: '0.875rem',
                                            },
                                          }}
                                        >
                                          <IconButton onClick={() => { setQbSelectedItem(null); setSearchTermQbItems(''); }} edge="end">
                                            <ClearIcon />
                                          </IconButton>
                                        </Tooltip>
                                      </InputAdornment>
                                    </>
                                  ),
                                }}
                              />

                              {showListQbItems && (
                                <Box
                                  sx={{
                                    height: 200,
                                    width: '100%',
                                    mt: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                  }}
                                >
                                  <AutoSizer>
                                    {({ height, width }) => (
                                      <List
                                        width={width}
                                        height={height}
                                        rowCount={filteredQbItems.length}
                                        rowHeight={48}
                                        rowRenderer={({ key, index, style }) => {
                                          const it = filteredQbItems[index];
                                          return (
                                            <StyledMenuItem
                                              key={key}
                                              style={style}
                                              value={it.fields.list_id}
                                              onClick={() => {
                                                setSearchTermQbItems(`${it.fields.name} (ID: ${it.fields.list_id})`);
                                                setQbSelectedItem(it);
                                              }}
                                            >
                                              {it.fields.name}
                                            </StyledMenuItem>
                                          );
                                        }}
                                      />
                                    )}
                                  </AutoSizer>
                                </Box>
                              )}

                              <Box sx={{ mt: 1 }}>
                                <Button
                                  variant="contained"
                                  color="info"
                                  size="small"
                                  onClick={() =>
                                    handleMatchItem(
                                      item.item_id,
                                      qbSelectedItem ? qbSelectedItem.fields.list_id : '',
                                      'match'
                                    )
                                  }
                                  disabled={qbSelectedItem === null}
                                >
                                  Match
                                </Button>
                              </Box>
                            </FormControl>
                          ) : (
                            <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                              <b>Loading QB Items...</b>
                            </Alert>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ItemsDetails;
