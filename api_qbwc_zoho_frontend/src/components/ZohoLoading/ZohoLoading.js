import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Button,
    Container,
    Grid,
    Typography,
    Alert,
    CircularProgress,
    MenuItem,
    Menu,
    IconButton,
    TextField,
    Tooltip,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import People from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ListAlt from '@mui/icons-material/ListAlt';
import { Warning } from '@mui/icons-material';
import { fetchWithToken } from '../../utils';
import axios from 'axios';
import moment from 'moment';
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
    const [loadingSalesOrders, setLoadingSalesOrders] = useState(false);
    const [lastDateLoadedCustomers, setLastDateLoadedCustomers] = useState(null);
    const [lastDateLoadedItems, setlastDateLoadedItems] = useState(null);
    const [lastDateLoadedInvoices, setlastDateLoadedInvoices] = useState(null);
    const [lastDateLoadedSalesOrders, setlastDateLoadedSalesOrders] = useState(null);
    const [error, setError] = useState(null);
    const [anchorInvoices, setAnchorInvoices] = useState(null);
    const [anchorSalesOrders, setAnchorSalesOrders] = useState(null);
    const [selectedDateInvoices, setSelectedDateInvoices] = useState(dayjs());
    const [selectedDateSalesOrders, setSelectedDateSalesOrders] = useState(dayjs());
    const [optionInvoices, setOptionInvoices] = useState(null);
    const [optionSalesOrders, setOptionSalesOrders] = useState(null);
    const navigate = useNavigate();

    const isAnyLoading = loadingCustomers || loadingItems || loadingInvoices || loadingSalesOrders;

    const zohoConnectionConfigured = localStorage.getItem('zohoConnectionConfigured');

    const today = dayjs();
    const oneYearAgo = today.subtract(1, 'year');

    const loadData = async (element, module, endpoint, setLoading) => {
        setLoading(true);
        try {
            const option = (element === 'invoices') ? optionInvoices : optionSalesOrders;
            const data = (element === 'invoices' || element === 'sales_orders') ?
                { option: option, username: localStorage.getItem('username') } :
                { username: localStorage.getItem('username') };

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

    const handleDateChange = (element, date) => {
        if (element === 'invoices') {
            setSelectedDateInvoices(date);
            setOptionInvoices(date.format('YYYY-MM-DD'));
            setAnchorInvoices(null);
        } else if (element === 'sales_orders') {
            setSelectedDateSalesOrders(date);
            setOptionSalesOrders(date.format('YYYY-MM-DD'));
            setAnchorSalesOrders(null);
        }
    };

    const handleLoadCustomers = () => loadData('customers', 'api_zoho_customers', 'load_customers', setLoadingCustomers);
    const handleLoadItems = () => loadData('items', 'api_zoho_items', 'load_items', setLoadingItems);
    const handleLoadInvoices = () => loadData('invoices', 'api_zoho_invoices', 'load_invoices', setLoadingInvoices);
    const handleLoadSalesOrders = () => loadData('sales_orders', 'api_zoho_sales_orders', 'load_sales_orders', setLoadingSalesOrders);

    useEffect(() => {

        const fetchData = async () => {
            try {
                const response = await axios.get(`${apiUrl}/zoho_loading/`);
                setLastDateLoadedCustomers(response.data.zoho_loading_customers.zoho_record_updated);
                setlastDateLoadedItems(response.data.zoho_loading_items.zoho_record_updated);
                setlastDateLoadedInvoices(response.data.zoho_loading_invoices.zoho_record_updated);
                setlastDateLoadedSalesOrders(response.data.zoho_loading_sales_orders.zoho_record_updated || null);
            } catch (error) {
                console.error('Error fetching items:', error);
                setError(`Failed to fetch items: ${error}`);
            }
        };
        fetchData();
    }, []);

    const handleClick = (event, element) => {
        if (element === 'invoices') {
            setAnchorInvoices(event.currentTarget);
        } else if (element === 'sales_orders') {
            setAnchorSalesOrders(event.currentTarget);
        }
    };

    const handleClose = (element) => {
        if (element === 'invoices') {
            setAnchorInvoices(null);
        } else if (element === 'sales_orders') {
            setAnchorSalesOrders(null);
        }
    };

    const handleMenuItemClick = (element, opt) => {
        if (element === 'invoices') {
            setOptionInvoices(opt);
            setAnchorInvoices(null);
        }
        if (element === 'sales_orders') {
            setOptionSalesOrders(opt);
            setAnchorSalesOrders(null);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                bgcolor: '#F9F9FB',
                p: 0,
                gap: 2,
                overflowX: 'hidden',
            }}
        >
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
                                <b>Load data from Zoho</b>
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
                        </Grid>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                            <Grid item xs={12}>
                                {lastDateLoadedCustomers ? (
                                    <Alert severity="warning" icon={<Warning />}>
                                        Last loaded: <br />
                                        Date: <b>{moment(lastDateLoadedCustomers).format('DD/MM/YYYY')}</b><br />
                                        Time: <b>{moment(lastDateLoadedCustomers).format('hh:mm a')}</b><br />
                                    </Alert>
                                ) : null}
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
                        </Grid>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3}>
                            <Grid item xs={12}>
                                {lastDateLoadedItems ? (
                                    <Alert severity="warning" icon={<Warning />}>
                                        Last loaded: <br />
                                        Date: <b>{moment(lastDateLoadedItems).format('DD/MM/YYYY')}</b><br />
                                        Time: <b>{moment(lastDateLoadedItems).format('hh:mm a')}</b><br />
                                    </Alert>
                                ) : null}
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
                            <ReceiptIcon
                                sx={{
                                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                    color: 'primary.main',
                                    boxShadow: 0,
                                    borderRadius: 1,
                                    marginRight: '5%',
                                }} /> <b style={{ color: 'black' }}>Invoices</b>
                        </IconButton>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3} sx={{ marginTop: '1%' }}>
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                <Button
                                    onClick={handleLoadInvoices}
                                    variant="contained"
                                    color="info"
                                    size="small"
                                    disabled={isAnyLoading || !zohoConnectionConfigured || optionInvoices === null}
                                    startIcon={loadingInvoices ? <CircularProgress size={24} /> : null}
                                    sx={{ flexGrow: 1, textAlign: 'left' }}
                                >
                                    Load {optionInvoices}
                                </Button>
                                {!loadingInvoices && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClick(e, 'invoices');
                                        }}
                                    >
                                        <ArrowDropDownIcon />
                                    </IconButton>
                                )}
                                <Menu
                                    id="simple-menu"
                                    anchorEl={anchorInvoices}
                                    keepMounted
                                    open={Boolean(anchorInvoices)}
                                    onClose={() => handleClose('invoices')}
                                >
                                    <MenuItem
                                        value="yesterday"
                                        onClick={() => handleMenuItemClick('invoices', 'Yesterday')}
                                    >
                                        Yesterday
                                    </MenuItem>
                                    <MenuItem
                                        value="today"
                                        onClick={() => handleMenuItemClick('invoices', 'Today')}
                                    >
                                        Today
                                    </MenuItem>
                                    <MenuItem value={selectedDateInvoices}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                label="Select Date"
                                                value={selectedDateInvoices}
                                                onChange={(date) => handleDateChange('invoices', date)}
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
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                {lastDateLoadedInvoices ? (
                                    <Alert severity="warning" icon={<Warning />}>
                                        Last loaded: <br />
                                        Date: <b>{moment(lastDateLoadedInvoices).format('DD/MM/YYYY')}</b><br />
                                        Time: <b>{moment(lastDateLoadedInvoices).format('hh:mm a')}</b><br />
                                    </Alert>
                                ) : null}
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
                            <ListAlt
                                sx={{
                                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                    color: 'primary.main',
                                    boxShadow: 0,
                                    borderRadius: 1,
                                    marginRight: '5%',
                                }} /> <b style={{ color: 'black' }}>Orders</b>
                        </IconButton>
                        <Grid container spacing={2} alignItems="center" justifyContent="center" mb={3} sx={{ marginTop: '1%' }}>
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                <Button
                                    onClick={handleLoadSalesOrders}
                                    variant="contained"
                                    color="info"
                                    size="small"
                                    disabled={isAnyLoading || !zohoConnectionConfigured || optionSalesOrders === null}
                                    startIcon={loadingSalesOrders ? <CircularProgress size={24} /> : null}
                                    sx={{ flexGrow: 1, textAlign: 'left' }}
                                >
                                    Load {optionSalesOrders}
                                </Button>
                                {!loadingSalesOrders && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClick(e, 'sales_orders');
                                        }}
                                    >
                                        <ArrowDropDownIcon />
                                    </IconButton>
                                )}
                                <Menu
                                    id="simple-menu"
                                    anchorEl={anchorSalesOrders}
                                    keepMounted
                                    open={Boolean(anchorSalesOrders)}
                                    onClose={() => handleClose('sales_orders')}
                                >
                                    <MenuItem
                                        value="yesterday"
                                        onClick={() => handleMenuItemClick('sales_orders', 'Yesterday')}
                                    >
                                        Yesterday
                                    </MenuItem>
                                    <MenuItem
                                        value="today"
                                        onClick={() => handleMenuItemClick('sales_orders', 'Today')}
                                    >
                                        Today
                                    </MenuItem>
                                    <MenuItem value={selectedDateSalesOrders}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                label="Select Date"
                                                value={selectedDateSalesOrders}
                                                onChange={(date) => handleDateChange('sales_orders', date)}
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
                            <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                {lastDateLoadedSalesOrders ? (
                                    <Alert severity="warning" icon={<Warning />}>
                                        Last loaded: <br />
                                        Date: <b>{moment(lastDateLoadedSalesOrders).format('DD/MM/YYYY')}</b><br />
                                        Time: <b>{moment(lastDateLoadedSalesOrders).format('hh:mm a')}</b><br />
                                    </Alert>
                                ) : null}
                            </Grid>
                        </Grid>
                    </Container>
                </Grid>
            </Grid>
            {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    {error}
                </Alert>
            )}

        </Box>
    );
};

export default ZohoLoading;
