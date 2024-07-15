// src/components/ZohoLoading.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Grid, Typography, CircularProgress } from '@mui/material';

const QbwcGetting = () => {

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const navigate = useNavigate();

  const gettingData = async (module, objects, setLoading) => {
    setLoading(true);
    navigate(`/integration/qbwc_${module}_${objects}`);
  }

  const handleListCustomers = () => gettingData('list', 'customers', setLoadingCustomers);
  const handleListItems = () => gettingData('list', 'items', setLoadingItems);
  const handleSimilarCustomers = () => gettingData('similar', 'customers', setLoadingCustomers);
  const handleSimilarItems = () => gettingData('similar', 'items', setLoadingItems);
  const handleMatchedCustomers = () => gettingData('matched', 'customers', setLoadingCustomers);
  const handleMatchedItems = () => gettingData('matched', 'items', setLoadingItems);

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
                Reading Data from QuickBooks
            </Typography>
            <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleListCustomers}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={loadingCustomers}
                        startIcon={loadingCustomers ? <CircularProgress size={24} /> : null}
                    >
                        {loadingCustomers ? 'Loading Customers...' : 'List Customers'}
                    </Button>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleListItems}
                        variant="contained"
                        color="info"
                        size="small"
                        disabled={loadingItems}
                        startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                    >
                        {loadingItems ? 'Loading Items...' : 'List Items'}
                    </Button>
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleSimilarCustomers}
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={loadingCustomers}
                        startIcon={loadingCustomers ? <CircularProgress size={24} /> : null}
                    >
                        {loadingCustomers ? 'Loading Customers...' : 'Similar Customers'}
                    </Button>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleSimilarItems}
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={loadingItems}
                        startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                    >
                        {loadingItems ? 'Loading Items...' : 'Similar Items'}
                    </Button>
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleMatchedCustomers}
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={loadingCustomers}
                        startIcon={loadingCustomers ? <CircularProgress size={24} /> : null}
                    >
                        {loadingCustomers ? 'Loading Customers...' : 'Matched Customers'}
                    </Button>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'center' }}>
                    <Button
                        onClick={handleMatchedItems}
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={loadingItems}
                        startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                    >
                        {loadingItems ? 'Loading Items...' : 'Matched Items'}
                    </Button>
                </Grid>
            </Grid>
            
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

export default QbwcGetting;
