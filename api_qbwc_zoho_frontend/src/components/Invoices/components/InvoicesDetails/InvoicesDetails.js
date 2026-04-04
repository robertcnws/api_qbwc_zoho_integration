import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos, Sync } from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { grey } from '@mui/material/colors';
import Swal from 'sweetalert2';

import { fetchWithToken } from '../../../../utils';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import NavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

const apiUrl =
  process.env.REACT_APP_ENVIRONMENT === 'DEV'
    ? process.env.REACT_APP_BACKEND_URL_DEV
    : process.env.REACT_APP_BACKEND_URL_PROD;

const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE, 10) || 10;

const LEFT_COL_WIDTH = 400; // ancho fijo de la columna izquierda

const InvoicesDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(numberRows);
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [hovered, setHovered] = useState(false);
  const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  const containerRef = useRef(null);
  const selectedRowRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleDeleteInvoice = useCallback((inv) => {
    if (!inv) return;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this invoice? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (!result.isConfirmed) return;
      (async () => {
        try {
          const url = `${apiUrl}/api_zoho_invoices/delete_invoice/${inv.invoice_id}/`;
          const data = { username: localStorage.getItem('username') };
          const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
          if (response.data.status === 'success') {
            Swal.fire('Success!', 'Invoice has been deleted successfully.', 'success').then(() => {
              navigate('/integration/list_invoices');
            });
          } else {
            Swal.fire('Error!', `Error deleting invoice: ${response.data.message}`, 'error');
          }
        } catch (err) {
          Swal.fire('Error!', `Error deleting invoice: ${err}`, 'error');
        }
      })();
    });
  }, [navigate]);

  const filterInvoices = (flt, searchTerm) => {
    const allInvoices = location.state.invoices || [];
    return allInvoices.filter((inv) => {
      const f = inv.fields;
      const matchesFilter =
        flt === 'all'
          ? true
          : flt === 'not_processed'
            ? !f.inserted_in_qb && !(f.customer_unmatched.length > 0) && !(f.items_unmatched.length > 0)
            : flt === 'not_synced'
              ? f.customer_unmatched.length > 0 || f.items_unmatched.length > 0
              : flt === 'synced'
                ? f.inserted_in_qb
                : flt === 'forced_sync'
                  ? f.force_to_sync
                  : flt === 'not_forced_sync'
                    ? !f.force_to_sync
                    : flt === 'matched'
                      ? f.all_items_matched && f.all_customer_matched
                      : flt === 'not_matched'
                        ? !f.all_items_matched || !f.all_customer_matched
                        : true;

      const q = (searchTerm || '').toLowerCase();
      const matchesSearch =
        !q ||
        (f.invoice_number || '').toLowerCase().includes(q) ||
        (f.date || '').toLowerCase().includes(q);

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
          const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
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

  const handleViewItem = (item) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_items/list_items/`;
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        const jsonData = JSON.parse(response.data);
        setItems(jsonData);

        const normalized = { ...item };
        if (normalized.zoho_item_id) normalized.item_id = normalized.zoho_item_id;

        const state = {
          item: normalized,
          items: jsonData,
          filteredItems: jsonData,
          filter: 'all',
        };
        localStorage.setItem('backNavigation', 'invoice_details');
        navigate('/integration/item_details', { state });
      } catch (err) {
        setError(`Failed to fetch items: ${err}`);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleViewCustomer = (customer) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/list_customers/`;
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        const jsonData = JSON.parse(response.data);
        setCustomers(jsonData);

        let normalized = customer;
        if (normalized?.zoho_customer_id) normalized = normalized.zoho_customer_id;

        const state = {
          customer: normalized,
          customers: jsonData,
          filteredCustomers: jsonData,
          filter: 'all',
        };
        localStorage.setItem('backNavigation', 'invoice_details');
        navigate('/integration/customer_details', { state });
      } catch (err) {
        setError(`Failed to fetch customers: ${err}`);
      } finally {
        setLoading(false);
      }
    })();
  };

  const getBackgroundColor = (fi) =>
    invoice && fi.fields.invoice_id === invoice.invoice_id ? grey[300] : '';

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    const rows = parseInt(e.target.value, 10);
    setRowsPerPage(rows);
    setPage(0);
  };

  const handleViewInvoice = (invoice_id) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_invoices/view_invoice/${invoice_id}/`;
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        setInvoice(response.data.invoice);
        localStorage.setItem('invoice', JSON.stringify(response.data.invoice));
        localStorage.setItem('invoices', JSON.stringify(location.state.invoices || []));
        localStorage.setItem('filteredInvoices', JSON.stringify(filteredInvoices || []));
        localStorage.setItem('filterInvoices', JSON.stringify(filter));
        localStorage.setItem('backNavigation', 'invoice_details');
      } catch (err) {
        setError(`Error fetching invoice details: ${err}`);
      }
    })();
  };

  const childrenNavigationRightButton = [
    {
      label: 'Resync Invoice',
      icon: <Sync sx={{ mr: 1 }} />,
      visibility: true,
      noBorder: true,
    },
    {
      label: 'Delete Invoice',
      icon: <DeleteIcon sx={{ mr: 1 }} />,
      onClick: () => handleDeleteInvoice(invoice),
      visibility: true,
      noBorder: true,
    },
  ];

  const configCustomFilter = {
    filter,
    handleFilterChange,
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
    hasSearch: true,
    searchSelectTerm,
    searchPlaceholder: 'Search Invoice',
    handleSearchSelectChange,
    marginBottomInDetails: '10px',
  };

  const [currentIndexInList, setCurrentIndexInList] = useState(-1);

  useEffect(() => {
    const index = filteredInvoices?.findIndex((i) => (invoice ? i?.fields?.invoice_id === invoice?.invoice_id : false));
    setCurrentIndexInList(index);
  }, [invoice, filteredInvoices]);

  useEffect(() => {
    setSelectedId(invoice?.invoice_id ?? null);
  }, [invoice]);

  useLayoutEffect(() => {
    if (!filteredInvoices || selectedId == null || rowsPerPage <= 0) return;
    const idx = filteredInvoices.findIndex(r => r.fields.invoice_id === selectedId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / rowsPerPage);
    if (targetPage !== page) setPage(targetPage);
  }, [selectedId, filteredInvoices, rowsPerPage]);

  useLayoutEffect(() => {
    const rowEl = selectedRowRef.current;
    if (!rowEl) return;
    rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId, page]);

  if (loading) return <AlertLoading isSmallScreen={false} message="Invoice Details" />;
  if (error) return <AlertError isSmallScreen={false} error={error} />;

  return (
    <Box sx={{ width: '100%', px: 0, py: 1 }}>
      {!invoice ? (
        <Box>
          <Alert severity="warning">No invoice found.</Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
              Back to list
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
          {/* Columna izquierda - Fija 400px */}
          <Box
            sx={{
              flex: '0 0 auto',
              width: LEFT_COL_WIDTH,
              minWidth: LEFT_COL_WIDTH,
              maxWidth: LEFT_COL_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
            }}
          >
            <Box sx={{ p: 1.5 }}>
              <CustomFilter configCustomFilter={configCustomFilter} date={invoice.date} />
            </Box>

            <TableContainer ref={containerRef} sx={{ flex: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Table size="small" aria-label="filtered invoices table" stickyHeader>
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
                          hover
                          ref={isSelected ? selectedRowRef : null}
                          data-row-id={fi.fields.invoice_id}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: getBackgroundColor(fi),
                          }}
                          onClick={() => handleViewInvoice(fi.fields.invoice_id)}
                        >
                          <TableCell sx={{ py: 1.25 }}>
                            <b>{fi.fields.invoice_number}</b>
                            <br />
                            Date: <b>{fi.fields.date || '--'}</b>
                            <br />
                            Client: <b>{fi.fields.customer_name}</b>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell>No items found.</TableCell>
                    </TableRow>
                  )}

                  <TableCustomPagination
                    columnsLength={1}
                    data={filteredInvoices || []}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Columna derecha - Flexible */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Header detalle */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="h6" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#212529', ml: 1 }}>
                {invoice.invoice_number}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip
                  title="Previous in List Invoices"
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
                      const prevItem = filteredInvoices[currentIndexInList - 1] || filteredInvoices[filteredInvoices.length - 1];
                      if (prevItem) {
                        handleViewInvoice(prevItem.fields.invoice_id);
                      }
                    }} sx={{ color: '#000' }}>
                    <ArrowBackIos />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Next in List Invoices"
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
                      const nextItem = filteredInvoices[currentIndexInList + 1] || filteredInvoices[0];
                      if (nextItem) {
                        handleViewInvoice(nextItem.fields.invoice_id);
                      }
                    }} sx={{ color: '#000' }}>
                    <ArrowForwardIos />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title="Back to List Invoices"
                  arrow
                  sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}
                >
                  <IconButton onClick={() => navigate('/integration/list_invoices')} sx={{ color: '#000' }}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>

            </Box>

            {/* Tabla de detalle */}
            <TableContainer
              sx={{
                flex: 1,
                borderLeft: '1px solid',
                borderRight: '1px solid',
                borderColor: 'divider',
                mt: -0.2,
              }}
            >
              <Table aria-label="invoice details table" stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9F9FB', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TableCell colSpan={2} sx={{ p: 0 }}>
                      <NavigationRightButton children={childrenNavigationRightButton} />
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ border: 'none', width: 150, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      Customer
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow
                            // sx={{
                            //   backgroundColor: invoice.qb_customer_list_id
                            //     ? 'rgba(102, 187, 106, 0.1)'
                            //     : 'rgba(255, 167, 38, 0.1)',
                            //   cursor: !invoice.qb_customer_list_id ? 'pointer' : 'default',
                            // }}
                            // onClick={() => !invoice.qb_customer_list_id && handleViewCustomer(invoice.customer_id)}
                            // onMouseOver={() => !invoice.qb_customer_list_id && setHovered(true)}
                            // onMouseOut={() => setHovered(false)}
                            sx={{
                              backgroundColor: invoice.qb_customer_list_id
                                ? 'rgba(102, 187, 106, 0.1)'
                                : 'rgba(255, 167, 38, 0.1)',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleViewCustomer(invoice.customer_id)}
                            onMouseOver={() => !invoice.qb_customer_list_id && setHovered(true)}
                            onMouseOut={() => setHovered(false)}
                          >
                            <TableCell
                              sx={{
                                border: 'none',
                                fontWeight: hovered && !invoice.qb_customer_list_id ? 'bold' : 'normal',
                                color: hovered && !invoice.qb_customer_list_id ? 'error.main' : 'inherit',
                              }}
                            >
                              <b>{invoice.customer_name}</b>
                            </TableCell>
                            <TableCell sx={{ border: 'none', display: 'flex', justifyContent: 'flex-end' }}>
                              {!invoice.qb_customer_list_id ? (
                                <SmallAlert severity="warning" message="NOT MATCHED" />
                              ) : (
                                <SmallAlert severity="success" message="MATCHED" />
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <b>{invoice.date}</b>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Total Amount
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <b>$ {invoice.total}</b>
                    </TableCell>
                  </TableRow>

                  {invoice.last_sync_date && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                        Last Sync Date
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <b>{invoice.last_sync_date}</b>
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Number of attempts to sync
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <b>{invoice.number_of_times_synced}</b>
                    </TableCell>
                  </TableRow>

                  {/* Items */}
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Items
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      {invoice.line_items.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                                <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Item Name</TableCell>
                                <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Item SKU</TableCell>
                                <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Quantity</TableCell>
                                <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Rate</TableCell>
                                <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Amount</TableCell>
                                <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {invoice.line_items.sort((a, b) => {
                                const A = a.qb_list_id;
                                const B = b.qb_list_id;
                                const aIsNil = A == null || A === '';
                                const bIsNil = B == null || B === '';
                                if (aIsNil && bIsNil) return 0;
                                if (aIsNil) return -1;
                                if (bIsNil) return 1;
                                return coll.compare(String(A), String(B));
                              }).map((it, idx) => (
                                <TableRow
                                  key={idx}
                                  // sx={{
                                  //   backgroundColor: it.qb_list_id ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                  //   cursor: !it.qb_list_id ? 'pointer' : 'default',
                                  // }}
                                  // onClick={() => !it.qb_list_id && handleViewItem(it)}
                                  // onMouseOver={() => !it.qb_list_id && setHovered(true)}
                                  // onMouseOut={() => setHovered(false)}
                                  sx={{
                                    backgroundColor: it.qb_list_id ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleViewItem(it)}
                                  onMouseOver={() => !it.qb_list_id && setHovered(true)}
                                  onMouseOut={() => setHovered(false)}
                                >
                                  <TableCell
                                    sx={{
                                      width: '30%',
                                      maxWidth: '40%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontWeight: hovered && !it.qb_list_id ? 'bold' : 'normal',
                                      color: hovered && !it.qb_list_id ? 'error.main' : 'inherit',
                                    }}
                                  >
                                    {it.name || '---'}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      width: '30%',
                                      maxWidth: '20%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontWeight: hovered && !it.qb_list_id ? 'bold' : 'normal',
                                      color: hovered && !it.qb_list_id ? 'error.main' : 'inherit',
                                    }}
                                  >
                                    {it.sku || '---'}
                                  </TableCell>
                                  <TableCell sx={{ width: '5%', maxWidth: '10%' }}>
                                    {it.quantity || '---'}
                                  </TableCell>
                                  <TableCell sx={{ width: '15%', maxWidth: '10%' }}>
                                    {it.rate ? `$ ${it.rate}` : '---'}
                                  </TableCell>
                                  <TableCell sx={{ width: '20%', maxWidth: '10%' }}>
                                    <b>$ {it.item_total}</b>
                                  </TableCell>
                                  <TableCell>
                                    {!it.qb_list_id ? (
                                      <SmallAlert severity="warning" message="NOT MATCHED" />
                                    ) : (
                                      <SmallAlert severity="success" message="MATCHED" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="warning" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                          <b>No items found.</b>
                        </Alert>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Sync Items (errores o éxito) */}
                  {(invoice.inserted_in_qb || invoice.items_unmatched.length > 0) && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                        <b>{!invoice.inserted_in_qb ? 'ERRORS' : ''}</b> Sync Items
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        {invoice.items_unmatched.length > 0 ? (
                          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ backgroundColor: '#f9f9fb', width: '40%' }}>Item from Zoho</TableCell>
                                  <TableCell sx={{ backgroundColor: '#f9f9fb', width: '50%' }}>Reason</TableCell>
                                  <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {invoice.items_unmatched.map((it, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{it.zoho_item_unmatched}</TableCell>
                                    <TableCell>
                                      <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        <b>{it.reason}</b>
                                        {it.qb_list_id && (
                                          <>
                                            <br />
                                            You can run QBWC Invoices again to update this item.
                                          </>
                                        )}
                                      </Alert>
                                    </TableCell>
                                    <TableCell>
                                      {!it.qb_list_id ? (
                                        <Tooltip
                                          title="Do Match"
                                          arrow
                                          sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}
                                        >
                                          <IconButton onClick={() => handleViewItem(it)} color="warning">
                                            <LinkIcon />
                                          </IconButton>
                                        </Tooltip>
                                      ) : (
                                        <SmallAlert severity="success" message="MATCHED" />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          invoice.inserted_in_qb && (
                            <Alert severity="success" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                              <b>Processed successfully</b>
                            </Alert>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Sync Customer (errores o éxito) */}
                  {(invoice.inserted_in_qb || invoice.customer_unmatched.length > 0) && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                        <b>{!invoice.inserted_in_qb ? 'ERRORS' : ''}</b> Sync Customer
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        {invoice.customer_unmatched.length > 0 ? (
                          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ backgroundColor: '#f9f9fb', width: '40%' }}>
                                    Customer from Zoho
                                  </TableCell>
                                  <TableCell sx={{ backgroundColor: '#f9f9fb', width: '50%' }}>Reason</TableCell>
                                  <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {invoice.customer_unmatched.map((cu, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{cu.zoho_customer_unmatched}</TableCell>
                                    <TableCell>
                                      <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        <b>{cu.reason}</b>
                                        {cu.qb_list_id && (
                                          <>
                                            <br />
                                            You can run QBWC Invoices again to update this customer.
                                          </>
                                        )}
                                      </Alert>
                                    </TableCell>
                                    <TableCell>
                                      {!cu.qb_list_id ? (
                                        <Tooltip
                                          title="Do Match"
                                          arrow
                                          sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}
                                        >
                                          <IconButton onClick={() => handleViewCustomer(cu)} color="warning">
                                            <LinkIcon />
                                          </IconButton>
                                        </Tooltip>
                                      ) : (
                                        <SmallAlert severity="success" message="MATCHED" />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          invoice.inserted_in_qb && (
                            <Alert severity="success" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                              <b>Processed successfully</b>
                            </Alert>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default InvoicesDetails;
