import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, CircularProgress, ListItem, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import People from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';

const QbwcGetting = () => {

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const navigate = useNavigate();

    const gettingData = async (module, objects, setLoading) => {
        setLoading(true);
        navigate(`/integration/qbwc/${objects}/${module}`);
    }

    const handleListCustomers = () => gettingData('list', 'customers', setLoadingCustomers);
    const handleListItems = () => gettingData('list', 'items', setLoadingItems);
    //   const handleSimilarCustomers = () => gettingData('similar', 'customers', setLoadingCustomers);
    //   const handleSimilarItems = () => gettingData('similar', 'items', setLoadingItems);
    //   const handleMatchedCustomers = () => gettingData('matched', 'customers', setLoadingCustomers);
    //   const handleMatchedItems = () => gettingData('matched', 'items', setLoadingItems);
    const handleNeverMatchCustomers = () => gettingData('never_match', 'customers', setLoadingCustomers);
    const handleNeverMatchItems = () => gettingData('never_match', 'items', setLoadingItems);

    return (
        <Container
            component="main"
            maxWidth="md"
            sx={{
                mt: '0%',
                bgcolor: '#f0f0f9',
                boxShadow: 1,
                borderRadius: 1,
                minWidth: '87.5vw',
                minHeight: '90vh',
                marginLeft: '-22%',
            }}
        >
            {/* <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                    borderBottom: '2px solid #2196F3',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    color: '#212529',
                    fontWeight: 'bold',
                }}
            >
                Reading Data from QuickBooks
            </Typography> */}

            <Grid container alignItems="center" justifyContent="center">
                <Grid item xs={11} sx={{ textAlign: 'center' }}>
                    <Container sx={{
                        bgcolor: 'white',
                        boxShadow: 0,
                        borderRadius: 1,
                        minWidth: '87.5vw',
                        minHeight: '8vh',
                        marginLeft: '-1.5%',
                    }}>
                        <Typography variant="h6" align="center" gutterBottom>
                            <div style={{
                                paddingTop: '1.3%',
                            }}>
                                <b>Reading Data from QuickBooks</b>
                            </div>
                        </Typography>
                    </Container>
                </Grid>
                <Grid item xs={1} justifyContent="right">
                    <Tooltip
                        title="Back to Integration"
                        arrow
                        sx={{
                            '& .MuiTooltip-tooltip': {
                                backgroundColor: '#000000',
                                color: 'white',
                                fontSize: '0.875rem'
                            }
                        }}
                    >
                        <IconButton component={Link} to='/integration' sx={{ marginLeft: '70%' }}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3} mt={2}>
                <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Container sx={{
                        mt: '1%',
                        bgcolor: 'white',
                        boxShadow: 1,
                        borderRadius: 1,
                        minHeight: '25vh',
                    }}>
                        <IconButton size='small' sx={{ paddingTop: '8%', cursor: 'none' }}>
                            <People
                                sx={{
                                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                    color: 'primary.main',
                                    boxShadow: 0,
                                    borderRadius: 1,
                                    marginRight: '5%',
                                }} /> <b style={{ color: 'black' }}>Customers</b>
                        </IconButton>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3} sx={{ marginTop: '1%' }}>
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                <ListItem
                                    onClick={handleListCustomers}
                                    variant="contained"
                                    size="small"
                                    startIcon={loadingCustomers ? <CircularProgress size={24} /> : null}
                                    sx={{ backgroundColor: 'rgba(33, 150, 243, 0.2)', color: 'primary.main', cursor: 'pointer' }}
                                >
                                    {loadingCustomers ? 'Loading Customers...' : 'All Customers'}
                                </ListItem>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                <ListItem
                                    onClick={handleNeverMatchCustomers}
                                    variant="contained"
                                    size="small"
                                    color="warning"
                                    sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: 'warning.main', cursor: 'pointer' }}
                                    startIcon={loadingCustomers ? <CircularProgress size={24} /> : null}
                                >
                                    {loadingCustomers ? 'Loading Customers...' : 'Never Matched Customers'}
                                </ListItem>
                            </Grid>
                        </Grid>
                    </Container>
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <Container sx={{
                        mt: '1%',
                        bgcolor: 'white',
                        boxShadow: 1,
                        borderRadius: 1,
                        minHeight: '25vh',
                    }}>
                        <IconButton size='small' sx={{ paddingTop: '8%', cursor: 'none' }}>
                            <InventoryIcon
                                sx={{
                                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                    color: 'primary.main',
                                    boxShadow: 0,
                                    borderRadius: 1,
                                    marginRight: '5%',
                                }} /> <b style={{ color: 'black' }}>Items</b>
                        </IconButton>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3} sx={{ marginTop: '1%' }}>
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                <ListItem
                                    onClick={handleListItems}
                                    variant="contained"
                                    size="small"
                                    startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                                    sx={{ backgroundColor: 'rgba(33, 150, 243, 0.2)', color: 'primary.main', cursor: 'pointer' }}
                                >
                                    {loadingItems ? 'Loading Items...' : 'All Items'}
                                </ListItem>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                <ListItem
                                    onClick={handleNeverMatchItems}
                                    variant="contained"
                                    size="small"
                                    color="warning"
                                    sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: 'warning.main', cursor: 'pointer' }}
                                    startIcon={loadingItems ? <CircularProgress size={24} /> : null}
                                >
                                    {loadingItems ? 'Loading Items...' : 'Never Matched Items'}
                                </ListItem>
                            </Grid>
                        </Grid>
                    </Container>
                </Grid>
            </Grid>

        </Container>
    );
};

export default QbwcGetting;
