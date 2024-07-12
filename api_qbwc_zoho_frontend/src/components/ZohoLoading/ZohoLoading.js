// src/components/ZohoLoading.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Grid, Typography, Alert, CircularProgress } from '@mui/material';
import { Warning } from '@mui/icons-material';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const ZohoLoading = () => {
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (module, endpoint, setLoading) => {
    setLoading(true);
    try {
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
      const response = await fetch(`${apiUrl}/${module}/${endpoint}/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCustomers = () => loadData('api_zoho_customers', 'load_customers', setLoadingCustomers);
  const handleLoadItems = () => loadData('api_zoho_items', 'load_items', setLoadingItems);
  const handleLoadInvoices = () => loadData('api_zoho_invoices', 'load_invoices', setLoadingInvoices);

  useEffect(() => {
    // Puedes implementar la lógica para obtener las últimas fechas de carga si tienes endpoints disponibles
  }, []);

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 5, p: 3, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        Load Data from Zoho
      </Typography>
      <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
        <Grid item>
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
        <Grid item>
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
        <Grid item>
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
      <Grid container spacing={2} mt={3}>
        <Grid item xs={4}>
          {/* Aquí puedes reemplazar con datos reales si los tienes */}
          {false && (
            <Alert severity="warning" icon={<Warning />}>
              Last Time loaded: <br />{new Date().toLocaleString()}
            </Alert>
          )}
        </Grid>
        <Grid item xs={4}>
          {/* Aquí puedes reemplazar con datos reales si los tienes */}
          {false && (
            <Alert severity="warning" icon={<Warning />}>
              Last Time loaded: <br />{new Date().toLocaleString()}
            </Alert>
          )}
        </Grid>
        <Grid item xs={4}>
          {/* Aquí puedes reemplazar con datos reales si los tienes */}
          {false && (
            <Alert severity="warning" icon={<Warning />}>
              Last Time loaded: <br />{new Date().toLocaleString()}
            </Alert>
          )}
        </Grid>
      </Grid>
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
      <Container sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          component={Link}
          to="/integration"
          variant="contained"
          color="success"
          size="small"
        >
          Back to Integration
        </Button>
      </Container>
    </Container>
  );
};

export default ZohoLoading;
