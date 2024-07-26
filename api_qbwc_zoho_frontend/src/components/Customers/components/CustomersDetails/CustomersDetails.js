import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    Container, 
    Grid, 
    Typography, 
    Button, 
    Table, 
    TableBody, 
    TableCell,
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Alert, 
    FormControl, 
    InputLabel, 
    Select,
    MenuItem,
    Box,
    useMediaQuery, 
    useTheme, 
    TablePagination
} from '@mui/material';
import { grey } from '@mui/material/colors';
import Swal from 'sweetalert2';
import { fetchWithToken } from '../../../../utils';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import '../CustomersDetails/css/customScrollbar.css';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const CustomersDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [coincidences, setCoincidences] = useState([]);
  const [customer, setCustomer] = useState(null); 
  const [filteredCustomers, setFilteredCustomers] = useState(null); 
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFilterChange = (event) => {
    const selectedFilter = event.target.value;
    setFilter(selectedFilter);
    const filteredList = location.state.customers.filter(customer => {
        if (selectedFilter === 'all') return customer;
        if (selectedFilter === 'matched') return customer.fields.qb_list_id !== null && customer.fields.qb_list_id !== '';
        if (selectedFilter === 'unmatched') return !customer.fields.qb_list_id || customer.fields.qb_list_id === '';
        return false;
    });
    setFilteredCustomers(filteredList);
  }

  useEffect(() => {
      setFilteredCustomers(location.state.filteredCustomers ? location.state.filteredCustomers : null);
      setFilter(location.state.filter ? location.state.filter : 'all');
      if (location.state.customer) {
        const customerId = location.state.customer.fields ? location.state.customer.fields.contact_id : location.state.customer;
        const fetchCustomerDetails = async () => {
            try {
                const url = `${apiUrl}/api_zoho_customers/view_customer/${customerId}/`
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                setCustomer(response.data);
                setCoincidences(response.data.coincidences);
            } catch (error) {
                console.error('Error fetching customer details:', error);
                setError(`Error fetching customer details: ${error}`);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerDetails();
      } else {
          console.error('Invalid customer data in location state:', location.state);
          navigate('/integration/api_qbwc_zoho/list_customers'); 
      }
  }, [location.state, navigate]);

    const handleMatchCustomer = (contact_id, qb_customer_list_id) => {
        const action = qb_customer_list_id !== 'UNMATCH' ? 'match' : 'unmatch';
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${action} this customer?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: `Yes, ${action} it!`
        }).then((result) => {
            if (result.isConfirmed) {
                const matchOneCustomerAjax = async () => {
                    try {
                        const url = `${apiUrl}/api_zoho_customers/match_one_customer_ajax/`
                        const data = {
                            contact_id: contact_id,
                            qb_customer_list_id: qb_customer_list_id,
                            action: action
                        }
                        const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                icon: 'success',
                                title: 'Success',
                                text: response.data.message,
                                willClose: () => {
                                    const values = {}
                                    values['fields'] = customer;
                                    const fetchData = async () => {
                                        try {
                                            const url = `${apiUrl}/api_zoho_customers/list_customers/`
                                            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                                            const jsonData = JSON.parse(response.data); 
                                            const state = {
                                                customer: values,
                                                customers: jsonData,
                                                filteredCustomers: jsonData,
                                                filter: filter
                                            }
                                            navigate('/integration/customer_details', { state: state });
                                        } catch (error) {
                                            console.error('Error fetching customers:', error);
                                            setError(`Failed to fetch customers: ${error}`);
                                        } finally {
                                            setLoading(false);
                                        }
                                    };
                                    fetchData();
                                }
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: response.data.message
                            });
                        }
                    } catch (error) {
                        console.error('Error matching customer:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: `Error matching customer: ${error}`
                        });
                    }
                };
                matchOneCustomerAjax();
            }
        });
    };

    const handleViewCustomer = (customer_id) => {
        const fetchCustomerDetails = async () => {
            try {
                const url = `${apiUrl}/api_zoho_customers/view_customer/${customer_id}/`
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                setCustomer(response.data);
                setCoincidences(response.data.coincidences);
            } catch (error) {
                console.error('Error fetching customer details:', error);
            }
        };
        fetchCustomerDetails();
    }

    const getBackgroundColor = (filteredCustomer) => {
        if (filteredCustomer.fields.contact_id === customer.contact_id) {
            return grey[300];
        } else {
            return '';
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        const rows = parseInt(event.target.value, 10);
        setRowsPerPage(rows);
        setPage(0);
    };

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Customer Details'/>
        );
    }

    if (error) {
        return (
            <AlertError isSmallScreen={isSmallScreen} error={error}/>
        );
    }
    
    return (
      <Container maxWidth="lg" sx={{ marginLeft: '-1%', marginTop: '0%', transition: 'margin-left 0.3s ease', minWidth:'100%' }}>
      {/* <Container component="main" maxWidth="md" sx={{ mt: 5, p: 3, bgcolor: '#FFFFFF', boxShadow: 3, borderRadius: 2 }}> */}
          {!customer ? (
              <Grid container spacing={1}>
                  <Grid item xs={12}>
                      <Alert severity="warning">No customer found.</Alert>
                  </Grid>
                  <Grid item xs={6}>
                      <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
                          Back to list
                      </Button>
                  </Grid>
              </Grid>
          ) : (
              <Grid container spacing={1}>
                <Grid item container xs={3}>
                    <Grid item container xs={12} spacing={1}>
                        <FormControl variant="outlined" size="small" style={{ marginBottom: '10px'}}>
                            <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <b>({filteredCustomers.length})</b>
                            </InputLabel>
                            <Select
                                value={filter}
                                onChange={handleFilterChange}
                                label="Filter"
                            >
                                <MenuItem value="all">All Customers</MenuItem>
                                <MenuItem value="matched">Matched Customers</MenuItem>
                                <MenuItem value="unmatched">Unmatched Customers</MenuItem>
                            </Select>
                        </FormControl>
                        <TableContainer component={Paper} sx={{ maxHeight: 640, minHeight: 640 }} className='custom-scrollbar'>
                            <Table aria-label="filtered customers table">
                                <TableBody>
                                    {filteredCustomers && filteredCustomers.length > 0 ? (
                                        (rowsPerPage > 0
                                            ? filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            : filteredCustomers
                                        ).map((filteredCustomer, index) => (
                                            <TableRow 
                                                key={index} 
                                                onClick={() => handleViewCustomer(filteredCustomer.fields.contact_id)}
                                                sx={{ cursor: 'pointer' }}
                                                style={{ backgroundColor: getBackgroundColor(filteredCustomer) }}
                                            >
                                                <TableCell>
                                                    <b>{filteredCustomer.fields.contact_name}</b><br/>
                                                    Email: {filteredCustomer.fields.email ? filteredCustomer.fields.email : '--'}<br/>
                                                    Company: {filteredCustomer.fields.company_name ? filteredCustomer.fields.company_name : '--'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell>No customers found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredCustomers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Grid>
                </Grid>
                <Grid item container xs={9}>
                  <Grid item container xs={12} spacing={1} style={{ marginBottom: '15px'}}>
                    <Grid item xs={6}>
                        <Typography
                            variant="h6"
                            sx={{
                                textTransform: 'uppercase',
                                color: 'info.main',
                                fontWeight: 'bold',
                            }}
                        >
                            Customer Details
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
                                Back to list
                            </Button>
                        </Box>
                    </Grid>
                  </Grid>
                  <Grid item container xs={12} spacing={1} sx={{ minHeight: 700, maxHeight: 700 }}>
                      <TableContainer component={Paper} sx={{ maxHeight: 670 }}>
                          <Table aria-label="customer details table">
                              <TableBody>
                                  <TableRow>
                                      <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Customer ID
                                      </TableCell>
                                      <TableCell><b>{customer.contact_id}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Customer Name
                                      </TableCell>
                                      <TableCell><b>{customer.customer_name ? customer.customer_name : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Contact Name
                                      </TableCell>
                                      <TableCell><b>{customer.contact_name ? customer.contact_name : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Customer Email
                                      </TableCell>
                                      <TableCell><b>{customer.email ? customer.email : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Customer Phone
                                      </TableCell>
                                      <TableCell><b>{customer.phone ? customer.phone : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Customer Mobile
                                      </TableCell>
                                      <TableCell><b>{customer.mobile ? customer.mobile : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho Customer Company Name
                                      </TableCell>
                                      <TableCell><b>{customer.company_name ? customer.company_name : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Zoho QB List ID
                                      </TableCell>
                                      <TableCell><b>{customer.qb_list_id ? customer.qb_list_id : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell 
                                      component="th" 
                                      scope="row" 
                                      sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        Coincidences by Order
                                      </TableCell>
                                      <TableCell>
                                      {coincidences.length > 0 && !customer.matched ? (
                                        <TableContainer component={Paper} elevation={0}>
                                            <Table aria-label="coincidences table" size="small">
                                                <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
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
                                                    {coincidences.map((coincidence, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{coincidence.qb_customer_name}</TableCell>
                                                            <TableCell>{coincidence.email}</TableCell>
                                                            <TableCell>{coincidence.coincidence_email}</TableCell>
                                                            <TableCell>{coincidence.phone}</TableCell>
                                                            <TableCell>{coincidence.coincidence_phone}</TableCell>
                                                            <TableCell>{coincidence.company_name}</TableCell>
                                                            <TableCell>
                                                                <Button 
                                                                    variant="contained" 
                                                                    color="info" 
                                                                    size="small"
                                                                    onClick={() => handleMatchCustomer(customer.contact_id, coincidence.qb_customer_list_id)}>
                                                                    Match
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : customer.matched ? (
                                        <Grid item xs={12}>
                                            <Alert severity="success"
                                                style={{ 
                                                    fontSize: '0.80rem',  
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px',
                                                }}>
                                                <b>Customer already matched.</b>
                                            </Alert>
                                            <br />
                                            <Button 
                                                variant="contained" 
                                                color="error" 
                                                size="small"
                                                onClick={() => handleMatchCustomer(customer.contact_id, 'UNMATCH')}>
                                                UnMatch
                                            </Button>
                                        </Grid>
                                    ) : (
                                        <Alert severity="warning"
                                            style={{ 
                                                fontSize: '0.80rem',  
                                                padding: '4px 8px', 
                                                borderRadius: '4px',
                                            }}>
                                            <b>No coincidences found.</b>
                                        </Alert>
                                    )}
                                      </TableCell>
                                  </TableRow>
                              </TableBody>
                          </Table>
                      </TableContainer>
                  </Grid>
                  
                </Grid>
              </Grid> 
              
          )}
      </Container>
  );
};

export default CustomersDetails;
