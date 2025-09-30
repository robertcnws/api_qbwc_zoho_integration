import React, { useState, useEffect, useCallback } from 'react';
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

const SalesOrdersDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [salesOrder, setSalesOrder] = useState(null);
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [filteredSalesOrders, setFilteredSalesOrders] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(numberRows);
  const [searchSelectTerm, setSearchSelectTerm] = useState('');
  const [hovered, setHovered] = useState(false);

  const handleDeleteSalesOrder = useCallback((inv) => {
    if (!inv) return;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this sales order? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (!result.isConfirmed) return;
      (async () => {
        try {
          const url = `${apiUrl}/api_zoho_sales_orders/delete_sales_order/${inv.salesorder_id}/`;
          const data = { username: localStorage.getItem('username') };
          const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
          if (response.data.status === 'success') {
            Swal.fire('Success!', 'Sales order has been deleted successfully.', 'success').then(() => {
              navigate('/integration/list_sales_orders');
            });
          } else {
            Swal.fire('Error!', `Error deleting sales order: ${response.data.message}`, 'error');
          }
        } catch (err) {
          Swal.fire('Error!', `Error deleting sales order: ${err}`, 'error');
        }
      })();
    });
  }, [navigate]);

  const filterSalesOrders = (flt, searchTerm) => {
    const allSalesOrders = location.state.salesOrders || [];
    return allSalesOrders.filter((inv) => {
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
        (f.salesorder_number || '').toLowerCase().includes(q) ||
        (f.date || '').toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    setFilteredSalesOrders(filterSalesOrders(newFilter, searchSelectTerm));
    setPage(0);
  };

  const handleSearchSelectChange = (e) => {
    const val = e.target.value;
    setSearchSelectTerm(val);
    setFilteredSalesOrders(filterSalesOrders(filter, val));
    setPage(0);
  };

  useEffect(() => {
    setFilteredSalesOrders(filterSalesOrders(filter, searchSelectTerm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const st = location.state || {};
    setFilteredSalesOrders(st.filteredSalesOrders || null);
    setFilter(st.filter || 'all');

    const invId = st.salesOrder?.fields?.salesorder_id;

    if (invId) {
      (async () => {
        try {
          const url = `${apiUrl}/api_zoho_sales_orders/view_sales_order/${invId}/`;
          const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
          setSalesOrder(response.data.sales_order);
        } catch (err) {
          setError(`Error fetching sales order details: ${err}`);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      navigate('/integration/list_sales_orders');
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
        localStorage.setItem('backNavigation', 'sales_order_details');
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
        localStorage.setItem('backNavigation', 'sales_order_details');
        navigate('/integration/customer_details', { state });
      } catch (err) {
        setError(`Failed to fetch customers: ${err}`);
      } finally {
        setLoading(false);
      }
    })();
  };

  const getBackgroundColor = (fi) =>
    salesOrder && fi.fields.salesorder_id === salesOrder.salesorder_id ? grey[300] : '';

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    const rows = parseInt(e.target.value, 10);
    setRowsPerPage(rows);
    setPage(0);
  };

  const handleViewSalesOrder = (salesorder_id) => {
    (async () => {
      try {
        const url = `${apiUrl}/api_zoho_sales_orders/view_sales_order/${salesorder_id}/`;
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        setSalesOrder(response.data.sales_order);
        localStorage.setItem('salesOrder', JSON.stringify(response.data.sales_order));
        localStorage.setItem('salesOrders', JSON.stringify(location.state.salesOrders || []));
        localStorage.setItem('filteredSalesOrders', JSON.stringify(filteredSalesOrders || []));
        localStorage.setItem('filterSalesOrders', JSON.stringify(filter));
        localStorage.setItem('backNavigation', 'sales_order_details');
      } catch (err) {
        setError(`Error fetching sales order details: ${err}`);
      }
    })();
  };

  const childrenNavigationRightButton = [
    {
      label: 'Resync Sales Order',
      icon: <Sync sx={{ mr: 1 }} />,
      visibility: true,
      noBorder: true,
    },
    {
      label: 'Delete Sales Order',
      icon: <DeleteIcon sx={{ mr: 1 }} />,
      onClick: () => handleDeleteSalesOrder(salesOrder),
      visibility: true,
      noBorder: true,
    },
  ];

  const configCustomFilter = {
    filter,
    handleFilterChange,
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
    hasSearch: true,
    searchSelectTerm,
    searchPlaceholder: 'Search Sales Order',
    handleSearchSelectChange,
    marginBottomInDetails: '10px',
  };

  const [currentIndexInList, setCurrentIndexInList] = useState(-1);

  useEffect(() => {
    const index = filteredSalesOrders?.findIndex((i) => (salesOrder ? i?.fields?.salesorder_id === salesOrder?.salesorder_id : false));
    setCurrentIndexInList(index);
  }, [salesOrder, filteredSalesOrders]);


  if (loading) return <AlertLoading isSmallScreen={false} message="Sales Order Details" />;
  if (error) return <AlertError isSmallScreen={false} error={error} />;
  
  return (
    <Box sx={{ width: '100%', px: 0, py: 1 }}>
      {!salesOrder ? (
        <Box>
          <Alert severity="warning">No sales order found.</Alert>
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
              <CustomFilter configCustomFilter={configCustomFilter} date={salesOrder.date} />
            </Box>

            <TableContainer sx={{ flex: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Table size="small" aria-label="filtered sales orders table" stickyHeader>
                <TableBody>
                  {filteredSalesOrders && filteredSalesOrders.length > 0 ? (
                    (rowsPerPage > 0
                      ? filteredSalesOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : filteredSalesOrders
                    ).map((fi, idx) => (
                      <TableRow
                        key={fi.fields.salesorder_id || idx}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: getBackgroundColor(fi),
                        }}
                        onClick={() => handleViewSalesOrder(fi.fields.salesorder_id)}
                      >
                        <TableCell sx={{ py: 1.25 }}>
                          <b>{fi.fields.salesorder_number}</b>
                          <br />
                          Date: <b>{fi.fields.date || '--'}</b>
                          <br />
                          Client: <b>{fi.fields.customer_name}</b>
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
                    data={filteredSalesOrders || []}
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
                {salesOrder.salesorder_number}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip
                  title="Previous in List Sales Orders"
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
                      const prevItem = filteredSalesOrders[currentIndexInList - 1] || filteredSalesOrders[filteredSalesOrders.length - 1];
                      if (prevItem) {
                        handleViewSalesOrder(prevItem.fields.salesorder_id);
                      }
                    }} sx={{ color: '#000' }}>
                    <ArrowBackIos />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Next in List Sales Orders"
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
                      const nextItem = filteredSalesOrders[currentIndexInList + 1] || filteredSalesOrders[0];
                      if (nextItem) {
                        handleViewSalesOrder(nextItem.fields.salesorder_id);
                      }
                    }} sx={{ color: '#000' }}>
                    <ArrowForwardIos />
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title="Back to List Sales Orders"
                  arrow
                  sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}
                >
                  <IconButton onClick={() => navigate('/integration/list_sales_orders')} sx={{ color: '#000' }}>
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
              <Table aria-label="sales order details table" stickyHeader size="small">
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
                            sx={{
                              backgroundColor: salesOrder.qb_customer_list_id
                                ? 'rgba(102, 187, 106, 0.1)'
                                : 'rgba(255, 167, 38, 0.1)',
                              cursor: !salesOrder.qb_customer_list_id ? 'pointer' : 'default',
                            }}
                            onClick={() => !salesOrder.qb_customer_list_id && handleViewCustomer(salesOrder.customer_id)}
                            onMouseOver={() => !salesOrder.qb_customer_list_id && setHovered(true)}
                            onMouseOut={() => setHovered(false)}
                          >
                            <TableCell
                              sx={{
                                border: 'none',
                                fontWeight: hovered && !salesOrder.qb_customer_list_id ? 'bold' : 'normal',
                                color: hovered && !salesOrder.qb_customer_list_id ? 'error.main' : 'inherit',
                              }}
                            >
                              <b>{salesOrder.customer_name}</b>
                            </TableCell>
                            <TableCell sx={{ border: 'none', display: 'flex', justifyContent: 'flex-end' }}>
                              {!salesOrder.qb_customer_list_id ? (
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
                      <b>{salesOrder.date}</b>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Total Amount
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <b>$ {salesOrder.total}</b>
                    </TableCell>
                  </TableRow>

                  {salesOrder.last_sync_date && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                        Last Sync Date
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <b>{salesOrder.last_sync_date}</b>
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Number of attempts to sync
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      <b>{salesOrder.number_of_times_synced}</b>
                    </TableCell>
                  </TableRow>

                  {/* Items */}
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                      Items
                    </TableCell>
                    <TableCell sx={{ border: 'none' }}>
                      {salesOrder.line_items.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400 }}>
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
                              {salesOrder.line_items.map((it, idx) => (
                                <TableRow
                                  key={idx}
                                  sx={{
                                    backgroundColor: it.qb_list_id ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                    cursor: !it.qb_list_id ? 'pointer' : 'default',
                                  }}
                                  onClick={() => !it.qb_list_id && handleViewItem(it)}
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
                  {(salesOrder.inserted_in_qb || salesOrder.items_unmatched.length > 0) && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                        <b>{!salesOrder.inserted_in_qb ? 'ERRORS' : ''}</b> Sync Items
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        {salesOrder.items_unmatched.length > 0 ? (
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
                                {salesOrder.items_unmatched.map((it, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{it.zoho_item_unmatched}</TableCell>
                                    <TableCell>
                                      <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        <b>{it.reason}</b>
                                        {it.qb_list_id && (
                                          <>
                                            <br />
                                            You can run QBWC Sales Orders again to update this item.
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
                          salesOrder.inserted_in_qb && (
                            <Alert severity="success" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                              <b>Processed successfully</b>
                            </Alert>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Sync Customer (errores o éxito) */}
                  {(salesOrder.inserted_in_qb || salesOrder.customer_unmatched.length > 0) && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ border: 'none', width: 150, maxWidth: 150 }}>
                        <b>{!salesOrder.inserted_in_qb ? 'ERRORS' : ''}</b> Sync Customer
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        {salesOrder.customer_unmatched.length > 0 ? (
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
                                {salesOrder.customer_unmatched.map((cu, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{cu.zoho_customer_unmatched}</TableCell>
                                    <TableCell>
                                      <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                        <b>{cu.reason}</b>
                                        {cu.qb_list_id && (
                                          <>
                                            <br />
                                            You can run QBWC Sales Orders again to update this customer.
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
                          salesOrder.inserted_in_qb && (
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

export default SalesOrdersDetails;
