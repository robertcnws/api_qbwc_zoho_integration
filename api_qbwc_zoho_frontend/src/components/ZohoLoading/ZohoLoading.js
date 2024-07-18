// src/components/ZohoLoading.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Grid, Typography, Alert, CircularProgress } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { fetchWithToken } from '../../utils';
import axios from 'axios'
import moment from 'moment'

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const ZohoLoading = () => {
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [lastDateLoadedCustomers, setLastDateLoadedCustomers] = useState(null);
  const [lastDateLoadedItems, setlastDateLoadedItems] = useState(null);
  const [lastDateLoadedInvoices, setlastDateLoadedInvoices] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadData = async (element, module, endpoint, setLoading) => {
    setLoading(true);
    try {
      const response = await fetchWithToken(`${apiUrl}/${module}/${endpoint}/`, 'POST', null, {}, apiUrl);
      if (response.status !== 200) {
        throw new Error(`Failed to load data: ${module}`);
      }  
      navigate(`/integration/list_${element}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCustomers = () => loadData('customers', 'api_zoho_customers', 'load_customers', setLoadingCustomers);
  const handleLoadItems = () => loadData('items', 'api_zoho_items', 'load_items', setLoadingItems);
  const handleLoadInvoices = () => loadData('invoices', 'api_zoho_invoices', 'load_invoices', setLoadingInvoices);

  useEffect(() => {
    axios.get(`${apiUrl}/zoho_loading/`)
            .then(response => {
                setLastDateLoadedCustomers(response.data.zoho_loading_customers.zoho_record_updated)
                setlastDateLoadedItems(response.data.zoho_loading_items.zoho_record_updated)
                setlastDateLoadedInvoices(response.data.zoho_loading_invoices.zoho_record_updated)
            })
            .catch(error => {
                console.error('Error fetching items:', error);
                setError(`Failed to fetch items: ${error}`);
            })
  }, []);

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 5, p: 3, bgcolor: '#FFFFFF', boxShadow: 3, borderRadius: 2 }}>
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
                        disabled={loadingCustomers}
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
                        disabled={loadingItems}
                        startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                    >
                        {loadingItems ? 'Loading Items...' : 'Load Items'}
                    </Button>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleLoadInvoices}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={loadingInvoices}
                        startIcon={loadingInvoices ? <CircularProgress size={24} /> : null}
                    >
                        {loadingInvoices ? 'Loading Invoices...' : 'Load Invoices'}
                    </Button>
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
