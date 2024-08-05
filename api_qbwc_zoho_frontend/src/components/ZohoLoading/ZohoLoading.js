import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Grid, Typography, Alert, CircularProgress, MenuItem, Menu, IconButton, Box, TextField } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { fetchWithToken } from '../../utils';
import axios from 'axios'
import moment from 'moment'
import { ArrowDropDownIcon, DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const ZohoLoading = () => {
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [lastDateLoadedCustomers, setLastDateLoadedCustomers] = useState(null);
  const [lastDateLoadedItems, setlastDateLoadedItems] = useState(null);
  const [lastDateLoadedInvoices, setlastDateLoadedInvoices] = useState(null);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [option, setOption] = useState(null);
  const navigate = useNavigate();

  const isAnyLoading = loadingCustomers || loadingItems || loadingInvoices;

  const zohoConnectionConfigured = localStorage.getItem('zohoConnectionConfigured')

  const today = dayjs();
  const oneYearAgo = today.subtract(1, 'year');

  const loadData = async (element, module, endpoint, setLoading) => {
    setLoading(true);
    try {
      const data = element === 'invoices' ? { option: option, username: localStorage.getItem('username') } : { username: localStorage.getItem('username')};  
      
      const response = await fetchWithToken(`${apiUrl}/${module}/${endpoint}/`, 'POST', data, {}, apiUrl);
      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Failed to load data: ${module}`);
      }
      navigate(`/integration/list_${element}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAnchorEl(null);
    setOption(date.format('YYYY-MM-DD'));
    console.log(date);
};

  const handleLoadCustomers = () => loadData('customers', 'api_zoho_customers', 'load_customers', setLoadingCustomers);
  const handleLoadItems = () => loadData('items', 'api_zoho_items', 'load_items', setLoadingItems);
  const handleLoadInvoices = () => loadData('invoices', 'api_zoho_invoices', 'load_invoices', setLoadingInvoices);

  useEffect(() => {

    const fetchData = async () => {
        try {
            const response = await axios.get(`${apiUrl}/zoho_loading/`);
            setLastDateLoadedCustomers(response.data.zoho_loading_customers.zoho_record_updated)
            setlastDateLoadedItems(response.data.zoho_loading_items.zoho_record_updated)
            setlastDateLoadedInvoices(response.data.zoho_loading_invoices.zoho_record_updated)
        } catch (error) {
            console.error('Error fetching items:', error);
            setError(`Failed to fetch items: ${error}`);
        }
    };
    fetchData();
    
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (opt) => {
    setAnchorEl(null);
    setOption(opt);   
  };

  return (
    <Container 
        component="main" 
        maxWidth="md" 
        sx={{ 
            mt: 0, 
            p: 1, 
            bgcolor: 'background.paper', 
            boxShadow: 3, 
            borderRadius: 2, 
            minWidth:'60%', 
            minHeight: '40%',
            ml: 0,
          }}
    >
            <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                    borderBottom: '2px solid #2196F3',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    color: '#2196F3',
                    fontWeight: 'bold',
                }}
            >
                Load Data from Zoho
            </Typography>
            <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleLoadCustomers}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={isAnyLoading || !zohoConnectionConfigured}
                        startIcon={loadingCustomers ? <CircularProgress size={24} /> : null}
                    >
                        {loadingCustomers ? 'Loading Customers...' : 'Load Customers'}
                    </Button>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleLoadItems}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={isAnyLoading || !zohoConnectionConfigured}
                        startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                    >
                        {loadingItems ? 'Loading Items...' : 'Load Items'}
                    </Button>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    {/* <Button
                        onClick={handleLoadInvoices}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={isAnyLoading || !zohoConnectionConfigured}
                        startIcon={loadingInvoices ? <CircularProgress size={24} /> : null}
                    >
                        {loadingInvoices ? 'Loading Invoices...' : 'Load Invoices'}
                    </Button> */}
                    <Button
                        onClick={handleLoadInvoices}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={isAnyLoading || !zohoConnectionConfigured || option === null}
                        startIcon={loadingInvoices ? <CircularProgress size={24} /> : null}
                        sx={{ flexGrow: 1, textAlign: 'left' }}
                    >
                        Load Invoices {option}
                    </Button>
                    {!loadingInvoices && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick(e);
                            }}
                        >
                            <ArrowDropDownIcon />
                        </IconButton>
                    )}
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem value="yesterday" onClick={() => handleMenuItemClick('Yesterday')}>Yesterday</MenuItem>
                        <MenuItem value="today" onClick={() => handleMenuItemClick('Today')}>Today</MenuItem>
                        <MenuItem value={selectedDate}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Select Date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    minDate={oneYearAgo}
                                    maxDate={today}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                        </MenuItem>
                    </Menu>
                    
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <Grid item xs={4}>
                    {lastDateLoadedCustomers ? (
                        <Alert severity="warning" icon={<Warning />}>
                            Last loaded: <br/>
                            Date: <b>{moment(lastDateLoadedCustomers).format('DD/MM/YYYY')}</b><br/>
                            Time: <b>{moment(lastDateLoadedCustomers).format('hh:mm a')}</b><br/>
                        </Alert>
                    ) : null}
                </Grid>
                <Grid item xs={4}>
                    {lastDateLoadedItems ? (
                        <Alert severity="warning" icon={<Warning />}>
                            Last loaded: <br/>
                            Date: <b>{moment(lastDateLoadedItems).format('DD/MM/YYYY')}</b><br/>
                            Time: <b>{moment(lastDateLoadedItems).format('hh:mm a')}</b><br/>
                        </Alert>
                    ) : null}
                </Grid>
                <Grid item xs={4}>
                    {lastDateLoadedInvoices ? (
                        <Alert severity="warning" icon={<Warning />}>
                            Last loaded: <br/>
                            Date: <b>{moment(lastDateLoadedInvoices).format('DD/MM/YYYY')}</b><br/>
                            Time: <b>{moment(lastDateLoadedInvoices).format('hh:mm a')}</b><br/>
                        </Alert>
                    ) : null}
                </Grid>
            </Grid>
            {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    {error}
                </Alert>
            )}
            <Typography
                sx={{
                    borderBottom: '2px solid #2196F3',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    color: '#2196F3',
                    fontWeight: 'bold',
                }}
            ></Typography>
                <Grid item xs={6} container>
                        <Grid item>
                            <Button
                                component={Link}
                                to="/integration"
                                variant="contained"
                                color="success"
                                size="small"
                            >
                                Back to Integration
                            </Button>
                        </Grid>
                </Grid>
        </Container>
  );
};

export default ZohoLoading;
