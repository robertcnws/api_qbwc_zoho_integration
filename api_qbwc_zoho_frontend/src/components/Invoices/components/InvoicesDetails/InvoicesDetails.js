import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Container, 
    Grid, 
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
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination,
    Box,
    ListSubheader,
    TextField, 
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { fetchWithToken } from '../../../../utils'
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const InvoicesDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [invoice, setInvoice] = useState(null); 
    const [items, setItems] = useState(null); 
    const [customers, setCustomers] = useState(null); 
    const [filteredInvoices, setFilteredInvoices] = useState(null); 
    const [filter, setFilter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchSelectTerm, setSearchSelectTerm] = useState('');
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const filterInvoices = (filter, searchTerm) => {
        const allInvoices = location.state.invoices;
        return allInvoices.filter(invoice => {
            const matchesFilter = filter === 'all' 
                ? true 
                : filter === 'not_processed' 
                ? !invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0
                : filter === 'not_synced' 
                ? invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0
                : filter === 'synced'
                ? invoice.fields.inserted_in_qb
                : false;
            
            const matchesSearchTerm = searchTerm === '' 
                ? true 
                : (invoice.fields.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                invoice.fields.date.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesFilter && matchesSearchTerm;
        });
    };


    const handleFilterChange = (e) => {
        const newFilter = e.target.value;
        setFilter(newFilter);
        const filteredList = filterInvoices(newFilter, searchSelectTerm);
        setFilteredInvoices(filteredList);
    }

    const handleSearchSelectChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchSelectTerm(newSearchTerm);
        const filteredList = filterInvoices(filter, newSearchTerm);
        setFilteredInvoices(filteredList);
    };

    useEffect(() => {
        const filteredList = filterInvoices(filter, searchSelectTerm);
        setFilteredInvoices(filteredList);
    }, [filter, searchSelectTerm]);

  useEffect(() => {
      setFilteredInvoices(location.state.filteredInvoices ? location.state.filteredInvoices : null);
      setFilter(location.state.filter ? location.state.filter : 'all');  
      if (location.state.invoice && location.state.invoice.fields && location.state.invoice.fields.invoice_id) {
          const invoiceId = location.state.invoice.fields.invoice_id;
          const fetchInvoiceDetails = async () => {
              try {
                  const url = `${apiUrl}/api_zoho_invoices/view_invoice/${invoiceId}/`
                  const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                  setInvoice(response.data.invoice);
              } catch (error) {
                  console.error('Error fetching invoice details:', error);
                  setError(`Error fetching invoice details: ${error}`);
              } finally {
                  setLoading(false);
              }
          };
          fetchInvoiceDetails();
      } else {
          console.error('Invalid invoice data in location state:', location.state);
          navigate('/integration/list_invoices'); 
      }
  }, [location.state, navigate]);

  const handleViewItem = (item) => {
    const fetchItems = async () => {
        try {
            const url = `${apiUrl}/api_zoho_items/list_items/`
            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
            const jsonData = JSON.parse(response.data); 
            setItems(jsonData);
            const state = { 
                item: item, 
                items: jsonData, 
                filteredItems: jsonData,
                filter: 'all' 
            };
            navigate('/integration/item_details', { state: state });
        } catch (error) {
            console.error('Error fetching items:', error);
            setError(`Failed to fetch items: ${error}`);
        } finally {
            setLoading(false);
        }
    };
    fetchItems();
    
    
  };

  const handleViewCustomer = (customer) => {
    const fetchCustomers = async () => {
        try {
            const url = `${apiUrl}/api_zoho_customers/list_customers/`
            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
            const jsonData = JSON.parse(response.data); 
            setCustomers(jsonData);
            const state = { 
                customer: customer, 
                customers: jsonData, 
                filteredCustomers: jsonData,
                filter: 'all' 
            };
            navigate('/integration/customer_details', { state: state});
        } catch (error) {
            console.error('Error fetching customers:', error);
            setError(`Failed to fetch customers: ${error}`);
        } finally {
            setLoading(false);
        }
    };
    fetchCustomers();
  };

  const getBackgroundColor = (filteredInvoice) => {
    if (filteredInvoice.fields.invoice_id === invoice.invoice_id) {
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

const handleViewInvoice = (invoice_id) => {
    const fetchInvoiceDetails = async () => {
        try {
            const url = `${apiUrl}/api_zoho_invoices/view_invoice/${invoice_id}/`
            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
            setInvoice(response.data.invoice);
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            setError(`Error fetching invoice details: ${error}`);
        }
    };
    fetchInvoiceDetails();
}

if (loading) {
    return (
        <AlertLoading isSmallScreen={isSmallScreen} message='Invoice Details'/>
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
          {!invoice ? (
              <Grid container spacing={1}>
                  <Grid item xs={12}>
                      <Alert severity="warning">No invoice found.</Alert>
                  </Grid>
                  <Grid item xs={6} container>
                      <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
                          Back to list
                      </Button>
                  </Grid>
              </Grid>
          ) : (
              <Grid container spacing={2}>
                  <Grid item container xs={3}>
                    <Grid item container xs={12} spacing={1}>
                        <FormControl variant="outlined" size="small" style={{ marginBottom: '10px'}}>
                            <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <b>({filteredInvoices.length})</b>
                            </InputLabel>
                            <Select
                                value={filter}
                                onChange={handleFilterChange}
                                label="Filter"
                            >
                                <MenuItem value="all">All Invoices</MenuItem>
                                <MenuItem value="synced">Synced Invoices</MenuItem>
                                <MenuItem value="not_synced">Not Synced Invoices</MenuItem>
                                <MenuItem value="not_processed">Not Processed Invoices</MenuItem>
                                <ListSubheader>
                                    <Box>
                                        <TextField
                                            label="Search Item"
                                            variant="outlined"
                                            size="small"
                                            value={searchSelectTerm}
                                            onChange={handleSearchSelectChange}
                                            onFocus={(e) => {e.target.select();}}
                                            sx={{ width: '100%' }}
                                        />
                                    </Box>
                                </ListSubheader>
                            </Select>
                        </FormControl>
                        <TableContainer component={Paper} sx={{ maxHeight: 640, minHeight: 640 }}>
                            <Table aria-label="filtered customers table">
                                <TableBody>
                                    {filteredInvoices && filteredInvoices.length > 0 ? (
                                        (rowsPerPage > 0
                                            ? filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            : filteredInvoices
                                        ).map((filteredInvoice, index) => (
                                            <TableRow 
                                                key={index} 
                                                onClick={() => handleViewInvoice(filteredInvoice.fields.invoice_id)}
                                                sx={{ cursor: 'pointer' }}
                                                style={{ backgroundColor: getBackgroundColor(filteredInvoice) }}
                                            >
                                                <TableCell>
                                                    <b>{filteredInvoice.fields.invoice_number}</b><br/>
                                                    Date: {filteredInvoice.fields.date ? filteredInvoice.fields.date : '--'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell>No items found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredInvoices.length}
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
                                gutterBottom
                                sx={{
                                    textTransform: 'uppercase',
                                    color: 'info.main',
                                    fontWeight: 'bold',
                                }}
                            >
                                Invoice Details
                            </Typography>
                        </Grid>
                        <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                            <Grid item>
                                <Button variant="contained" color="primary" size="small" onClick={() => navigate(-1)}>
                                    Back
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button variant="contained" color="success" size="small" onClick={() => navigate("/integration/list_invoices")}>
                                    Return to list
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item container xs={12} spacing={1} sx={{ minHeight: 700, maxHeight: 700 }}>
                        <TableContainer component={Paper} sx={{ minHeight: 700, maxHeight: 700 }}>
                            <Table aria-label="invoice details table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Invoice Number</TableCell>
                                        <TableCell><b>{invoice.invoice_number}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Customer</TableCell>
                                        <TableCell>
                                            <Table>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell>
                                                            <b>{invoice.customer_name}</b>
                                                        </TableCell>
                                                        <TableCell sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                            <Button variant="contained" color="info" size="small" onClick={() => handleViewCustomer(invoice.customer_id)} >
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                                
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Date</TableCell>
                                        <TableCell><b>{invoice.date}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Amount</TableCell>
                                        <TableCell><b>$ {invoice.total}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Last Sync Date</TableCell>
                                        <TableCell><b>{invoice.last_sync_date ? invoice.last_sync_date : "---"}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Number of attemps to sync</TableCell>
                                        <TableCell><b>{invoice.number_of_times_synced}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Items</TableCell>
                                        <TableCell>
                                            {invoice.line_items.length > 0 ? (
                                                <TableContainer component={Paper} elevation={0}>
                                                    <Table aria-label="coincidences table" size="small">
                                                        <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                            <TableRow>
                                                                <TableCell>Item Name</TableCell>
                                                                <TableCell>Item SKU</TableCell>
                                                                <TableCell>Amount</TableCell>
                                                                <TableCell>Actions</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {invoice.line_items.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell sx={{ width: '40%', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name ? item.name : '---'}</TableCell>
                                                                    <TableCell sx={{ width: '30%', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sku ? item.sku : '---'}</TableCell>
                                                                    <TableCell sx={{ width: '20%', maxWidth: '20%', overflow: 'hidden', textOverflow: 'ellipsis' }}>$ {item.item_total}</TableCell>
                                                                    <TableCell>
                                                                        <Button 
                                                                            onClick={() => handleViewItem(item)} 
                                                                            variant="contained" 
                                                                            color="info" 
                                                                            size="small"
                                                                        >
                                                                            View
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Alert severity="warning"
                                                    style={{ 
                                                        fontSize: '0.80rem',  
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px',
                                                    }}>
                                                    <b>No items found.</b>
                                                </Alert>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Errors sync Items</TableCell>
                                        <TableCell>
                                            {invoice.items_unmatched.length > 0 ? (
                                                <TableContainer component={Paper} elevation={0}>
                                                    <Table aria-label="coincidences table" size="small">
                                                        <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                            <TableRow>
                                                                <TableCell>Item from Zoho</TableCell>
                                                                <TableCell>Reason</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {invoice.items_unmatched.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.zoho_item_unmatched}</TableCell>
                                                                    <TableCell>
                                                                        <Alert severity="error"
                                                                            style={{ 
                                                                                fontSize: '0.80rem',  
                                                                                padding: '4px 8px', 
                                                                                borderRadius: '4px',
                                                                            }}>
                                                                            <b>{item.reason}</b>
                                                                        </Alert>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Alert severity="warning"
                                                    style={{ 
                                                        fontSize: '0.80rem',  
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px',
                                                    }}>
                                                    <b>No Errors in matched items detected.</b>
                                                </Alert>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Errors sync Customer</TableCell>
                                        <TableCell>
                                            {invoice.customer_unmatched.length > 0 ? (
                                                <TableContainer component={Paper} elevation={0}>
                                                    <Table aria-label="coincidences table" size="small">
                                                        <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                            <TableRow>
                                                                <TableCell>Customer from Zoho</TableCell>
                                                                <TableCell>Reason</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {invoice.customer_unmatched.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{item.zoho_customer_unmatched}</TableCell>
                                                                    <TableCell>
                                                                        <Alert severity="error"
                                                                            style={{ 
                                                                                fontSize: '0.80rem',  
                                                                                padding: '4px 8px', 
                                                                                borderRadius: '4px',
                                                                            }}>
                                                                            <b>{item.reason}</b>
                                                                        </Alert>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Alert severity="warning"
                                                    style={{ 
                                                        fontSize: '0.80rem',  
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px',
                                                    }}>
                                                    <b>No Errors in matched customer detected.</b>
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

export default InvoicesDetails;
