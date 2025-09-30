import React, { useState, useEffect } from 'react';
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
  TextField,
  CircularProgress,
  styled,
  InputAdornment,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  MenuItem,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import ClearIcon from '@mui/icons-material/Clear';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List, AutoSizer } from 'react-virtualized';
import Swal from 'sweetalert2';

import { fetchWithToken } from '../../../../utils';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';
import { ArrowBackIos, ArrowForward, ArrowForwardIos } from '@mui/icons-material';

const apiUrl =
  process.env.REACT_APP_ENVIRONMENT === 'DEV'
    ? process.env.REACT_APP_BACKEND_URL_DEV
    : process.env.REACT_APP_BACKEND_URL_PROD;

const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE, 10) || 10;

const LEFT_COL_WIDTH = 400; // ancho panel izquierdo (lista)
const DETAILS_MIN_HEIGHT = 640; // altura mínima del panel derecho
const LIST_MIN_HEIGHT = 640;

const StyledMenuItem = styled(MenuItem)({
  backgroundColor: '#f7f7f8',
  '&:hover': { backgroundColor: '#ececf1' },
  padding: '10px 16px',
  borderBottom: '1px solid #eee',
});

const CustomersDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [coincidences, setCoincidences] = useState([]);
  const [customer, setCustomer] = useState(null);

  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filter, setFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [loadingQbCustomers, setLoadingQbCustomers] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(numberRows);

  const [qbCustomers, setQbCustomers] = useState([]);
  const [filteredQbCustomers, setFilteredQbCustomers] = useState([]);
  const [qbSelectedCustomer, setQbSelectedCustomer] = useState(null);
  const [searchTermQbCustomers, setSearchTermQbCustomers] = useState('');
  const [showListQbCustomers, setShowListQbCustomers] = useState(true);

  const [searchSelectTerm, setSearchSelectTerm] = useState('');

  const [currentIndexInList, setCurrentIndexInList] = useState(-1);

  useEffect(() => {
    const index = filteredCustomers.findIndex((i) => (customer ? i.fields.contact_id === customer.contact_id : false));
    setCurrentIndexInList(index);
  }, [customer, filteredCustomers]);

  // Helpers
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

  // Initial load from location.state
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
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
        setCustomer(response.data);
        setCoincidences(response.data.coincidences);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) setError('Error fetching customer details: Customer not found (Go Zoho option and reload Customers).');
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

  // Load QB customers (never matched) + poll
  useEffect(() => {
    const fetchQbCustomers = async () => {
      try {
        const isNeverMatch = 'not_matched';
        const url = `${apiUrl}/api_quickbook_soap/qbwc_customers/${isNeverMatch}`;
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter QB customers by search term
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
    setShowListQbCustomers(filtered.length > 0);
  }, [searchTermQbCustomers, qbCustomers]);

  const handleSelectQbCustomer = (qbCustomer) => {
    setSearchTermQbCustomers(`${qbCustomer.fields.name} (ID: ${qbCustomer.fields.list_id})`);
    setQbSelectedCustomer(qbCustomer);
  };

  const handleSearchQbCustomer = (e) => {
    setQbSelectedCustomer(null);
    setSearchTermQbCustomers(e.target.value);
  };

  const handleClearSearch = () => {
    setQbSelectedCustomer(null);
    setSearchTermQbCustomers('');
  };

  const rowRenderer = ({ key, index, style }) => {
    const c = filteredQbCustomers[index];
    return (
      <StyledMenuItem key={key} style={style} value={c.fields.list_id} onClick={() => handleSelectQbCustomer(c)}>
        {c.fields.name}
      </StyledMenuItem>
    );
  };

  const handleMatchCustomer = (contact_id, qb_customer_list_id, action) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${action} this customer?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action} it!`,
    }).then((result) => {
      if (!result.isConfirmed) return;

      const matchOneCustomerAjax = async () => {
        try {
          const url = `${apiUrl}/api_zoho_customers/match_one_customer_ajax/`;
          const data = {
            contact_id,
            qb_customer_list_id,
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
                const refresh = async () => {
                  try {
                    const url = `${apiUrl}/api_zoho_customers/list_customers/`;
                    const res = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                    const jsonData = JSON.parse(res.data);

                    let filteredList = jsonData;
                    if (filter === 'matched') {
                      filteredList = jsonData.filter((c) => c.fields.qb_list_id !== null && c.fields.qb_list_id !== '');
                    } else if (filter === 'unmatched') {
                      filteredList = jsonData.filter((c) => !c.fields.qb_list_id || c.fields.qb_list_id === '');
                    }
                    if (filteredList.length <= page * rowsPerPage - rowsPerPage) {
                      setPage(0);
                    }
                    const state = {
                      customer: { fields: customer },
                      customers: jsonData,
                      filteredCustomers: filteredList,
                      filter,
                      page,
                    };
                    setFilteredCustomers(filteredList);
                    navigate('/integration/customer_details', { state });
                  } catch (err) {
                    setError(`Failed to fetch customers: ${err}`);
                  } finally {
                    setLoading(false);
                  }
                };
                refresh();
              },
            });
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: response.data.message });
          }
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: `Error matching customer: ${err}` });
        }
      };
      matchOneCustomerAjax();
    });
  };

  const handleViewCustomer = async (customer_id) => {
    try {
      const url = `${apiUrl}/api_zoho_customers/view_customer/${customer_id}/`;
      const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
      setCustomer(response.data);
      setCoincidences(response.data.coincidences);
    } catch (err) {
      // no-op
    }
  };

  const getBackgroundColor = (row) => {
    if (!customer) return 'transparent';
    return row.fields.contact_id === customer.contact_id ? grey[200] : 'transparent';
  };

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    const rows = parseInt(e.target.value, 10);
    setRowsPerPage(rows);
    setPage(0);
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

  const configCustomFilter = {
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
    marginBottomInDetails: '0',
  };

  if (loading) return <AlertLoading isSmallScreen={isSmallScreen} message="Customer Details" />;
  if (error) return <AlertError isSmallScreen={isSmallScreen} error={error} />;

  return (
    <Box
      sx={{
        width: '100%',
        px: 0,
        py: { xs: 1.5, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {!customer ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Alert severity="warning">No customer found.</Alert>
          <Box>
            <Button variant="contained" color="success" size="small" onClick={handleBackNavigation}>
              Back to list
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: `${LEFT_COL_WIDTH}px 1fr` },
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
              <Table size="small" aria-label="filtered customers table">
                <TableBody>
                  {filteredCustomers && filteredCustomers.length > 0 ? (
                    (rowsPerPage > 0
                      ? filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : filteredCustomers
                    ).map((row, idx) => (
                      <TableRow
                        key={`${row.fields.contact_id}-${idx}`}
                        hover
                        onClick={() => handleViewCustomer(row.fields.contact_id)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: getBackgroundColor(row),
                        }}
                      >
                        <TableCell sx={{ py: 1.25 }}>
                          <b>{row.fields.contact_name}</b>
                          {row.fields.email && (
                            <>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Email: {row.fields.email}
                              </Typography>
                            </>
                          )}
                          {row.fields.company_name && (
                            <>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Company: {row.fields.company_name}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell>No customers found.</TableCell>
                    </TableRow>
                  )}

                  <TableCustomPagination
                    columnsLength={1}
                    data={filteredCustomers}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Columna derecha: header + detalles */}
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
                {customer.customer_name || '--'}
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
                  title="Previous in List Customers"
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
                    onClick={async () => {
                      const prevItem = filteredCustomers[currentIndexInList - 1] || filteredCustomers[filteredCustomers.length - 1];
                      if (prevItem) {
                        await handleViewCustomer(prevItem.fields.contact_id);
                      }
                    }} sx={{ color: '#000' }}>
                    <ArrowBackIos />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Next in List Customers"
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
                    onClick={async () => {
                      const nextItem = filteredCustomers[currentIndexInList + 1] || filteredCustomers[0];
                      if (nextItem) {
                        await handleViewCustomer(nextItem.fields.contact_id);
                      }
                    }} sx={{ color: '#000' }}>
                    <ArrowForwardIos />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Back to List Customers"
                  arrow
                  sx={{
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#000',
                      color: '#fff',
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  <IconButton onClick={() => navigate('/integration/list_customers')} sx={{ color: '#000' }}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Tabla de detalles */}
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
              <TableContainer
                sx={{
                  maxHeight: { xs: 520, md: DETAILS_MIN_HEIGHT },
                }}
              >
                <Table aria-label="customer details table" size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ width: 200, border: 'none' }}>Zoho Customer ID</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <b>{customer.contact_id}</b>
                      </TableCell>
                    </TableRow>

                    {customer.contact_name && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>Zoho Contact Name</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{customer.contact_name}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {customer.email && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>Zoho Customer Email</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{customer.email}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {customer.phone && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>Zoho Customer Phone</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{customer.phone}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {customer.mobile && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>Zoho Customer Mobile</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{customer.mobile}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {customer.company_name && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>Zoho Customer Company Name</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <b>{customer.company_name}</b>
                        </TableCell>
                      </TableRow>
                    )}

                    {customer.qb_list_id && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>QB Customer Info</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          {customer.qb_list_id && (
                            <>
                              QB List ID: <b>{customer.qb_list_id}</b>
                            </>
                          )}
                          {customer.qb_customer?.name && (
                            <>
                              <br />
                              Matched QB Customer: <b>{customer.qb_customer.name}</b>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Coincidences */}
                    <TableRow>
                      <TableCell sx={{ width: 200, border: 'none' }}>Coincidences by Order</TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        {coincidences.length > 0 && !customer.matched ? (
                          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                            <Table size="small" aria-label="coincidences table">
                              <TableHead sx={{ bgcolor: '#f2f3f5' }}>
                                <TableRow>
                                  <TableCell>QB Customer Name</TableCell>
                                  <TableCell>Email</TableCell>
                                  <TableCell>Coincidence Email</TableCell>
                                  <TableCell>Phone</TableCell>
                                  <TableCell>Coincidence Phone</TableCell>
                                  <TableCell>Company Name</TableCell>
                                  <TableCell>Action</TableCell>
                                </TableRow>
                              </TableHead>
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
                                          onClick={() =>
                                            handleMatchCustomer(customer.contact_id, c.qb_customer_list_id, 'match')
                                          }
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
                        ) : customer.matched ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Alert severity="success" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                              <b>Customer already matched.</b>
                            </Alert>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleMatchCustomer(customer.contact_id, customer.qb_list_id, 'unmatch')}
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
                    {!customer.matched && (
                      <TableRow>
                        <TableCell sx={{ width: 200, border: 'none' }}>Force Matching</TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          {!loadingQbCustomers ? (
                            <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
                              <TextField
                                label={`Search QB Customers (${filteredQbCustomers.length})`}
                                variant="outlined"
                                fullWidth
                                value={searchTermQbCustomers}
                                onChange={handleSearchQbCustomer}
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
                                          <IconButton onClick={handleClearSearch} edge="end">
                                            <ClearIcon />
                                          </IconButton>
                                        </Tooltip>
                                      </InputAdornment>
                                    </>
                                  ),
                                }}
                              />

                              {showListQbCustomers && (
                                <Box sx={{ height: 220, width: '100%', mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                  <AutoSizer>
                                    {({ height, width }) => (
                                      <List
                                        width={width}
                                        height={height}
                                        rowCount={filteredQbCustomers.length}
                                        rowHeight={48}
                                        rowRenderer={rowRenderer}
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
                                    handleMatchCustomer(
                                      customer.contact_id,
                                      qbSelectedCustomer ? qbSelectedCustomer.fields.list_id : '',
                                      'match'
                                    )
                                  }
                                  disabled={qbSelectedCustomer === null}
                                >
                                  Match
                                </Button>
                              </Box>
                            </FormControl>
                          ) : (
                            <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                              <b>Loading QB Customers...</b>
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

export default CustomersDetails;
