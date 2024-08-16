import React, { useState, useEffect, useCallback } from 'react';
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
    IconButton,
    Tooltip,
} from '@mui/material';
import { Sync } from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { grey } from '@mui/material/colors';
import { fetchWithToken } from '../../../../utils'
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';
import Swal from 'sweetalert2';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import NavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);

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
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [searchSelectTerm, setSearchSelectTerm] = useState('');
    const [hovered, setHovered] = useState(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));


    const handleDeleteInvoice = useCallback((invoice) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this invoice? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const fetchData = async () => {
                    try {
                        const url = `${apiUrl}/api_zoho_invoices/delete_invoice/${invoice.invoice_id}/`
                        const data = { username: localStorage.getItem('username') };
                        const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                title: 'Success!',
                                text: 'Invoice has been deleted successfully.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                navigate('/integration/list_invoices');
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: `An error occurred while deleting invoice: ${response.data.message}`,
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    } catch (error) {
                        console.error('An error occurred while deleting invoice:', error);
                        Swal.fire({
                            title: 'Error!',
                            text: `An error occurred while deleting invoice: ${error}`,
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                };
                fetchData();
            }
        });
    }, [apiUrl]);


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
                            : filter === 'forced_sync'
                                ? invoice.fields.force_to_sync
                                : filter === 'not_forced_sync'
                                    ? !invoice.fields.force_to_sync
                                    : filter === 'matched'
                                        ? invoice.fields.all_items_matched && invoice.fields.all_customer_matched
                                        : filter === 'not_matched'
                                            ? !invoice.fields.all_items_matched || !invoice.fields.all_customer_matched
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
                if (item.zoho_item_id) {
                    item['item_id'] = item.zoho_item_id;
                }
                const state = {
                    item: item,
                    items: jsonData,
                    filteredItems: jsonData,
                    filter: 'all'
                };
                localStorage.setItem('backNavigation', 'invoice_details')
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
                if (customer.zoho_customer_id) {
                    customer = customer.zoho_customer_id;
                }
                const state = {
                    customer: customer,
                    customers: jsonData,
                    filteredCustomers: jsonData,
                    filter: 'all'
                };
                localStorage.setItem('backNavigation', 'invoice_details')
                navigate('/integration/customer_details', { state: state });
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
                localStorage.setItem('invoice', JSON.stringify(response.data.invoice));
                localStorage.setItem('invoices', JSON.stringify(location.state.invoices));
                localStorage.setItem('filteredInvoices', JSON.stringify(filteredInvoices));
                localStorage.setItem('filterInvoices', JSON.stringify(filter));
                localStorage.setItem('backNavigation', 'invoice_details')
            } catch (error) {
                console.error('Error fetching invoice details:', error);
                setError(`Error fetching invoice details: ${error}`);
            }
        };
        fetchInvoiceDetails();
    }

    const childrenNavigationRightButton = [
        {
            label: 'Resync Invoice',
            icon: <Sync sx={{ marginRight: 1 }} />,
            visibility: true,
            noBorder: true,
        },
        {
            label: 'Delete Invoice',
            icon: <DeleteIcon sx={{ marginRight: 1 }} />,
            onClick: handleDeleteInvoice,
            visibility: true,
            noBorder: true,
        }
    ];

    const configCustomFilter = {
        filter: filter,
        handleFilterChange: handleFilterChange,
        listValues: [
            { value: 'all', label: 'All Invoices' },
            { value: 'synced', label: 'Synced Invoices' },
            { value: 'not_synced', label: 'Not Synced Invoices' },
            { value: 'not_processed', label: 'Not Processed Invoices' },
            { value: 'forced_sync', label: 'Forced to Sync Invoices' },
            { value: 'not_forced_sync', label: 'Not Forced to Sync Invoices' },
            { value: 'matched', label: 'Matched Invoices' },
            { value: 'not_matched', label: 'Not Matched Invoices' },
        ],
        hasSearch: true,
        searchSelectTerm: searchSelectTerm,
        searchPlaceholder: 'Search Invoice',
        handleSearchSelectChange: handleSearchSelectChange,
        marginBottomInDetails: '10px'
    }

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Invoice Details' />
        );
    }

    if (error) {
        return (
            <AlertError isSmallScreen={isSmallScreen} error={error} />
        );
    }

    return (
        <Container maxWidth="lg" sx={{
            marginLeft: '-22%',
            marginRight: '-200%',
            marginTop: '3%',
            marginBottom: '-5%',
            transition: 'margin-left 0.3s ease',
            minWidth: '87.5vw',
            minHeigth: '100vh',
            maxHeigth: '100vh',
        }}>
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
                <Grid container spacing={2} sx={{ marginTop: '-35px', marginLeft: '-25px' }}>
                    <Grid item container xs={3} sx={{ borderRight: '1px solid #ddd' }}>
                        <Grid item container xs={12} spacing={1}>
                            <CustomFilter configCustomFilter={configCustomFilter} />
                            <TableContainer sx={{ maxHeight: 776, minHeight: 776, borderTop: '1px solid #ddd' }}>
                                <Table aria-label="filtered invoices table">
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
                                                        <b>{filteredInvoice.fields.invoice_number}</b><br />
                                                        Date: <b>{filteredInvoice.fields.date ? filteredInvoice.fields.date : '--'}</b><br />
                                                        Client: <b>{filteredInvoice.fields.customer_name}</b>

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
                                            data={filteredInvoices}
                                            page={page}
                                            rowsPerPage={rowsPerPage}
                                            handleChangePage={handleChangePage}
                                            handleChangeRowsPerPage={handleChangeRowsPerPage}
                                        />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>

                    <Grid item container xs={9}>
                        <Grid item container xs={12} spacing={1} style={{ marginBottom: '15px', minWidth: '100%' }}>
                            <Grid item xs={6}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        textTransform: 'uppercase',
                                        color: '#212529',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {invoice.invoice_number}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} container justifyContent="flex-end" spacing={1} sx={{ marginTop: '-1px' }}>
                                <Grid item>
                                    <Tooltip
                                        title="Back to List Invoices"
                                        arrow
                                        sx={{
                                            '& .MuiTooltip-tooltip': {
                                                backgroundColor: '#000000',
                                                color: 'white',
                                                fontSize: '0.875rem'
                                            }
                                        }}
                                    >
                                        <IconButton onClick={() => navigate("/integration/list_invoices")} sx={{ alignSelf: 'flex-end', mt: '-8px', color: '#000000' }}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item container xs={12} spacing={1} sx={{ minHeight: 778, maxHeight: 778, mt: 0, marginLeft: '-1.4%' }}>
                            <TableContainer
                                sx={{
                                    minHeight: 778,
                                    maxHeight: 778,
                                    minWidth: '103.5%',
                                    maxWidth: '103.5%',
                                    borderLeft: '1px solid #ddd',
                                    borderRight: '1px solid #ddd'
                                }}>
                                <Table aria-label="invoice details table" stickyHeader>
                                    <TableHead>
                                        <TableRow
                                            sx={{
                                                maxHeight: 40,
                                                border: '1px solid #ddd',
                                                backgroundColor: '#F9F9FB',
                                            }}
                                        >
                                            <TableCell colSpan={2} align="left" component="th"
                                                sx={{
                                                    maxHeight: 40,
                                                    borderBottom: '1px solid #ddd',
                                                    borderTop: '1px solid #ddd',
                                                    backgroundColor: '#F9F9FB',
                                                    padding: '0px 0px',
                                                }}
                                            >
                                                <NavigationRightButton children={childrenNavigationRightButton} />
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Customer</TableCell>
                                            <TableCell sx={{ border: 'none' }}>
                                                <Table>
                                                    <TableBody>
                                                        <TableRow style={{
                                                            backgroundColor: invoice.qb_customer_list_id ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 167, 38, 0.1',
                                                            cursor: !invoice.qb_customer_list_id ? 'pointer' : 'default',
                                                        }}
                                                            onClick={() => !invoice.qb_customer_list_id ? handleViewCustomer(invoice.customer_id) : null}
                                                            onMouseOver={() => !invoice.qb_customer_list_id ? setHovered(true) : null}
                                                            onMouseOut={() => setHovered(false)}
                                                        >
                                                            <TableCell sx={{
                                                                border: 'none',
                                                                fontWeight: hovered && !invoice.qb_customer_list_id ? 'bold' : 'normal',
                                                                color: hovered && !invoice.qb_customer_list_id ? 'error.main' : 'default'
                                                            }}>
                                                                <b>{invoice.customer_name}</b>
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                display: 'flex',
                                                                justifyContent: 'flex-end',
                                                                border: 'none'
                                                            }}>
                                                                {!invoice.qb_customer_list_id ? (
                                                                    // <Button variant="contained" color="info" size="small" onClick={() => handleViewCustomer(invoice.customer_id)} >
                                                                    //     View
                                                                    // </Button>
                                                                    // <IconButton onClick={() => handleViewCustomer(invoice.customer_id)} color="warning" aria-label="view" size='xx-large'>
                                                                    //     <LinkIcon />
                                                                    // </IconButton>
                                                                    <SmallAlert severity='warning' message='NOT MATCHED' />
                                                                ) : (
                                                                    <SmallAlert severity='success' message='MATCHED' />
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>

                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Date</TableCell>
                                            <TableCell sx={{ border: 'none' }}><b>{invoice.date}</b></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Amount</TableCell>
                                            <TableCell sx={{ border: 'none' }}><b>$ {invoice.total}</b></TableCell>
                                        </TableRow>
                                        {invoice.last_sync_date && (
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Last Sync Date</TableCell>
                                                <TableCell sx={{ border: 'none' }}><b>{invoice.last_sync_date}</b></TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Number of attemps to sync</TableCell>
                                            <TableCell sx={{ border: 'none' }}><b>{invoice.number_of_times_synced}</b></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Items</TableCell>
                                            <TableCell sx={{ border: 'none' }}>
                                                {invoice.line_items.length > 0 ? (
                                                    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '400px' }}>
                                                        <Table aria-label="coincidences table" size="small" stickyHeader>
                                                            <TableHead>
                                                                <TableRow sx={{ border: '1px solid #ddd' }}>
                                                                    <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Item Name</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Item SKU</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Quantity</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Rate</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Amount</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#f9f9fb' }}>Status</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {invoice.line_items.map((item, index) => (
                                                                    <TableRow key={index}
                                                                        style={{
                                                                            backgroundColor: item.qb_list_id ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                                                            cursor: !item.qb_list_id ? 'pointer' : 'default',
                                                                            // fontWeight: hovered && !item.qb_list_id ? 'bold' : 'normal'
                                                                        }}
                                                                        onClick={() => !item.qb_list_id ? handleViewItem(item) : null}
                                                                        onMouseOver={() => !item.qb_list_id ? setHovered(true) : null}
                                                                        onMouseOut={() => setHovered(false)}
                                                                    >
                                                                        <TableCell sx={{
                                                                            width: '30%',
                                                                            maxWidth: '40%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            fontWeight: hovered && !item.qb_list_id ? 'bold' : 'normal',
                                                                            color: hovered && !item.qb_list_id ? 'error.main' : 'default'
                                                                        }}>
                                                                            {item.name ? item.name : '---'}
                                                                        </TableCell>
                                                                        <TableCell sx={{
                                                                            width: '30%',
                                                                            maxWidth: '20%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            fontWeight: hovered && !item.qb_list_id ? 'bold' : 'normal',
                                                                            color: hovered && !item.qb_list_id ? 'error.main' : 'default'
                                                                        }}>
                                                                            {item.sku ? item.sku : '---'}
                                                                        </TableCell>
                                                                        <TableCell sx={{
                                                                            width: '5%',
                                                                            maxWidth: '10%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            fontWeight: hovered && !item.qb_list_id ? 'bold' : 'normal',
                                                                            color: hovered && !item.qb_list_id ? 'error.main' : 'default'
                                                                        }}>
                                                                            {item.quantity ? item.quantity : '---'}
                                                                        </TableCell>
                                                                        <TableCell sx={{
                                                                            width: '15%',
                                                                            maxWidth: '10%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            fontWeight: hovered && !item.qb_list_id ? 'bold' : 'normal',
                                                                            color: hovered && !item.qb_list_id ? 'error.main' : 'default'
                                                                        }}>
                                                                            {item.rate ? '$ ' + item.rate : '---'}
                                                                        </TableCell>
                                                                        <TableCell sx={{
                                                                            width: '20%',
                                                                            maxWidth: '10%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            fontWeight: hovered && !item.qb_list_id ? 'bold' : 'normal',
                                                                            color: hovered && !item.qb_list_id ? 'error.main' : 'default'
                                                                        }}>
                                                                            <b>$ {item.item_total}</b>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {!item.qb_list_id ? (
                                                                                // <IconButton onClick={() => handleViewItem(item)} color="warning" aria-label="view" size='xx-large'>
                                                                                //     <VisibilityIcon />
                                                                                // </IconButton>
                                                                                <SmallAlert severity='warning' message='NOT MATCHED' />
                                                                            ) : (
                                                                                <SmallAlert severity='success' message='MATCHED' />
                                                                            )}
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
                                        {invoice.inserted_in_qb || invoice.items_unmatched.length > 0 ? (
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <b>{!invoice.inserted_in_qb ? 'ERRORS' : ''}</b> Sync Items
                                                </TableCell>
                                                <TableCell sx={{ border: 'none' }}>
                                                    {invoice.items_unmatched.length > 0 ? (
                                                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '400px' }}>
                                                            <Table aria-label="coincidences table" size="small" stickyHeader>
                                                                <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                                    <TableRow>
                                                                        <TableCell sx={{
                                                                            width: '40%',
                                                                            maxWidth: '40%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            backgroundColor: '#f9f9fb'
                                                                        }}>
                                                                            Item from Zoho</TableCell>
                                                                        <TableCell sx={{
                                                                            width: '50%',
                                                                            maxWidth: '50%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            backgroundColor: '#f9f9fb'
                                                                        }}>Reason</TableCell>
                                                                        <TableCell sx={{
                                                                            backgroundColor: '#f9f9fb'
                                                                        }}>Action</TableCell>
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
                                                                                    {item.qb_list_id ?
                                                                                        (<>
                                                                                            <br />You can run QBWC Invoices again to update this item.
                                                                                        </>) : null
                                                                                    }
                                                                                </Alert>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {!item.qb_list_id ? (
                                                                                    <Tooltip
                                                                                        title="Do Match"
                                                                                        arrow
                                                                                        sx={{
                                                                                            '& .MuiTooltip-tooltip': {
                                                                                                backgroundColor: '#000000',
                                                                                                color: 'white',
                                                                                                fontSize: '0.875rem'
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <IconButton onClick={() => handleViewItem(item)} color="warning" aria-label="view" size='xx-large'>
                                                                                            <LinkIcon />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                ) : (
                                                                                    <SmallAlert severity='success' message='MATCHED' />
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    ) : (
                                                        invoice.inserted_in_qb ? (
                                                            <Alert severity="success"
                                                                style={{
                                                                    fontSize: '0.80rem',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                }}>
                                                                <b>Processed successfully</b>
                                                            </Alert>
                                                        ) : (
                                                            null
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ) : (null)
                                        }
                                        {invoice.inserted_in_qb || invoice.customer_unmatched.length > 0 ? (
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <b>{!invoice.inserted_in_qb ? 'ERRORS' : ''}</b> Sync Customer
                                                </TableCell>
                                                <TableCell sx={{ border: 'none' }}>
                                                    {invoice.customer_unmatched.length > 0 ? (
                                                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '400px' }}>
                                                            <Table aria-label="coincidences table" size="small" stickyHeader>
                                                                <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                                    <TableRow>
                                                                        <TableCell sx={{
                                                                            width: '40%',
                                                                            maxWidth: '40%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            backgroundColor: '#f9f9fb'
                                                                        }}>Customer from Zoho</TableCell>
                                                                        <TableCell sx={{
                                                                            width: '50%',
                                                                            maxWidth: '50%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            backgroundColor: '#f9f9fb'
                                                                        }}>Reason</TableCell>
                                                                        <TableCell sx={{
                                                                            backgroundColor: '#f9f9fb'
                                                                        }}>Action</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {invoice.customer_unmatched.map((customer, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{customer.zoho_customer_unmatched}</TableCell>
                                                                            <TableCell>
                                                                                <Alert severity="error"
                                                                                    style={{
                                                                                        fontSize: '0.80rem',
                                                                                        padding: '4px 8px',
                                                                                        borderRadius: '4px',
                                                                                    }}>
                                                                                    <b>{customer.reason}</b>
                                                                                    {customer.qb_list_id ?
                                                                                        (<>
                                                                                            <br />You can run QBWC Invoices again to update this customer.
                                                                                        </>) : null
                                                                                    }
                                                                                </Alert>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {!customer.qb_list_id ? (
                                                                                    <Tooltip
                                                                                        title="Do Match"
                                                                                        arrow
                                                                                        sx={{
                                                                                            '& .MuiTooltip-tooltip': {
                                                                                                backgroundColor: '#000000',
                                                                                                color: 'white',
                                                                                                fontSize: '0.875rem'
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <IconButton onClick={() => handleViewCustomer(customer)} color="warning" aria-label="view" size='xx-large'>
                                                                                            <LinkIcon />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                ) : (
                                                                                    <SmallAlert severity='success' message='MATCHED' />
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    ) : (
                                                        invoice.inserted_in_qb ? (
                                                            <Alert severity="success"
                                                                style={{
                                                                    fontSize: '0.80rem',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                }}>
                                                                <b>Processed successfully</b>
                                                            </Alert>
                                                        ) : (
                                                            null
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ) : (null)
                                        }
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
