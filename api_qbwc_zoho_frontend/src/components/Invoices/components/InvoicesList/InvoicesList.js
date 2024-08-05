import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Grid,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Paper,
    Alert,
    IconButton,
    TablePagination,
    FormControl,
    FormControlLabel,
    Checkbox,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Swal from 'sweetalert2';
import ClearIcon from '@mui/icons-material/Clear';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { stableSort, fetchWithToken, getComparatorUndefined } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';

dayjs.extend(utc);
dayjs.extend(timezone);

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const InvoicesList = ({ data, configData, onSyncComplete, filterDate, setFilterDate }) => {

    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();
    
    const today = dayjs();
    const oneYearAgo = today.subtract(1, 'year');


    useEffect(() => {
        // Restaurar el estado desde localStorage
        const savedPage = localStorage.getItem('invoicesListPage');
        const savedRowsPerPage = localStorage.getItem('invoicesListRowsPerPage');
        const savedFilterDate = localStorage.getItem('invoicesListFilterDate');

        const initialPage = savedPage !== null ? Number(savedPage) : 0;
        const initialRowsPerPage = savedRowsPerPage !== null ? Number(savedRowsPerPage) : 10;

        setPage(Number.isInteger(initialPage) ? initialPage : 0);
        setRowsPerPage([5, 10, 25].includes(initialRowsPerPage) ? initialRowsPerPage : 10);

        if (savedFilterDate) {
            const parsedDate = dayjs(savedFilterDate);
            setFilterDate(parsedDate.isValid() ? parsedDate : today);
        } else {
            setFilterDate(today);
        }
    }, [setFilterDate]);


    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (filterDate && filterDate.isValid()) {
            queryParams.set('date', filterDate.format('YYYY-MM-DD'));
        } else {
            queryParams.delete('date');
            // queryParams.set('date', today.format('YYYY-MM-DD'));
        }
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
    }, [filterDate]);


    const handleFilterChange = useCallback((event) => {
        setFilter(event.target.value);
        setPage(0);
    }, []);
    

    const handleViewInvoice = useCallback((invoice) => {
        const invoices = data.invoices;
        localStorage.setItem('invoicesListPage', page);
        localStorage.setItem('invoicesListRowsPerPage', rowsPerPage);
        localStorage.setItem('invoicesListFilterDate', filterDate ? filterDate.format('YYYY-MM-DD') : '');
        localStorage.setItem('invoice', JSON.stringify(invoice));
        localStorage.setItem('invoices', JSON.stringify(invoices));
        localStorage.setItem('filteredInvoices', JSON.stringify(filteredInvoices));
        localStorage.setItem('filterInvoices', JSON.stringify(filter));
        localStorage.setItem('backNavigation', 'invoice_details')
        setFilterDate(filterDate);
        navigate('/integration/invoice_details', { state: { invoice, invoices, filteredInvoices, filter } });
    }, [page, rowsPerPage, filterDate, data.invoices, filter, navigate, setFilterDate]);

    const handleChangePage = useCallback((event, newPage) => {
        const maxPage = Math.max(0, Math.ceil(data.invoices.length / rowsPerPage) - 1);
        setPage(Math.min(newPage, maxPage));
        localStorage.setItem('invoicesListPage', Math.min(newPage, maxPage));
    }, [data.invoices.length, rowsPerPage]);

    const handleChangeRowsPerPage = useCallback((event) => {
        const rows = parseInt(event.target.value, 10);
        if ([5, 10, 25].includes(rows)) {
            setRowsPerPage(rows);
            setPage(0);
            localStorage.setItem('invoicesListRowsPerPage', rows);
            localStorage.setItem('invoicesListPage', 0);
        } else {
            setRowsPerPage(10);
            setPage(0);
        }
    }, []);

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
                        const url = `${apiUrl}/api_zoho_invoices/delete_invoice/${invoice.fields.invoice_id}/`
                        const response = await fetchWithToken(url, 'POST', null, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                title: 'Success!',
                                text: 'Invoice has been deleted successfully.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                onSyncComplete();
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
    }, [apiUrl, onSyncComplete]);

    const handleForceToSync = useCallback(() => {
        if (selectedInvoices.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select at least one invoice to force sync.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to force sync selected invoices?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, force to sync!'
        }).then((result) => {
            if (result.isConfirmed) {
                const fetchData = async () => {
                    try {
                        const url = `${apiUrl}/api_quickbook_soap/force_to_sync_invoices_ajax/`
                        const params = {
                            invoices: selectedInvoices,
                            username: localStorage.getItem('username'),
                        }
                        const response = await fetchWithToken(url, 'POST', params, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                title: 'Success!',
                                text: 'Selected invoices have been forced to sync.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                setSelectedInvoices([]);
                                onSyncComplete(); // Notify parent component to update data
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: `An error occurred while syncing invoices: ${response.data.message}`,
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    } catch (error) {
                        console.error('An error occurred while syncing invoices:', error);
                        Swal.fire({
                            title: 'Error!',
                            text: `An error occurred while syncing invoices: ${error}`,
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                };
                fetchData();
            }
        });
    }, [selectedInvoices, apiUrl, onSyncComplete]);

    const isSelected = (invoiceId) => selectedInvoices.indexOf(invoiceId) !== -1;

    const handleCheckboxClick = (event, invoiceId) => {
        const selectedIndex = selectedInvoices.indexOf(invoiceId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedInvoices, invoiceId];
        } else {
            newSelected = selectedInvoices.filter((id) => id !== invoiceId);
        }

        setSelectedInvoices(newSelected);
    };

    const filterByDate = (invoice) => {
        if (!filterDate) return true;
        
        const invoiceDate = new Date(invoice.fields.date);
        const filterDateFormatted = filterDate.isValid() ? filterDate.toISOString().split('T')[0] : null;
    
        if (!invoiceDate || !filterDateFormatted) return false;
    
        return invoiceDate.toISOString().split('T')[0] === filterDateFormatted;
    };

    const filterBySearchTerm = (invoice) => {
        if (!searchTerm) return true;
        const normalizedSearch = searchTerm.toLowerCase().trim();
        return (
            invoice.fields.invoice_number.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.customer_name.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.date.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.total.toLowerCase().includes(normalizedSearch)
        );
    };

    const clearFilters = () => {
        const today = dayjs();
        setFilterDate(today);
        localStorage.setItem('invoicesListFilterDate', today.format('YYYY-MM-DD'));
        setSearchTerm('');
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('date');
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
    };

    const getBackgroundColor = (invoice) => {
        if (invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0) {
            return 'rgba(255, 0, 0, 0.1)';
        } else if (invoice.fields.inserted_in_qb) {
            return 'rgba(0, 255, 0, 0.1)';
        } else {
            return 'rgba(255, 255, 0, 0.1)';
        }
    };

    const renderSyncStatus = (invoice) => {
        if (invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0) {
            return <Typography sx={{ color: 'error.main'}}><b>ERROR</b></Typography>;
        } else if (!invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0) {
            return <Typography sx={{ color: 'warning.main'}}><b>Not Processed</b></Typography>;
        } else {
            return <Typography sx={{ color: 'success.main'}}><b>SUCCESS</b></Typography>;
        }
    };

    const renderMatchStatus = (invoice) => {
        if (invoice.fields.all_items_matched && invoice.fields.all_customer_matched) {
            return <SmallAlert severity='success' message='YES'/>
        } else {
            return <SmallAlert severity='error' message='NO'/>
        }
    };

    const renderForceSyncCheckbox = (invoice, isSelected) => {
        if (!(invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0)) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSelected}
                                onChange={(e) => handleCheckboxClick(e, invoice.fields.invoice_id)}
                            />
                        }
                        label="Force to sync?"
                    />
                </FormControl>
            );
        } else {
            return <b>Synced</b>;
        }
    };

    const handleChangeDate = useCallback((date) => {
        if (date && date.isValid()) {
            setFilterDate(date);
            localStorage.setItem('invoicesListFilterDate', date.format('YYYY-MM-DD'));
        } else {
            setFilterDate(null);
            localStorage.setItem('invoicesListFilterDate', '');
        }
        setPage(0);
    }, [setFilterDate]);

    const handleSortChange = useCallback((columnId) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    }, [orderBy, order]);

    const filteredInvoices = useMemo(() => {
        return data.invoices.filter(invoice => {
            const matchesSearchTerm = filterBySearchTerm(invoice) && filterByDate(invoice);
            const notProcessed = !invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0;
            const notSynced = invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0;
            const synced = invoice.fields.inserted_in_qb;
            const forcedSync = invoice.fields.force_to_sync;
            const matched = invoice.fields.all_items_matched && invoice.fields.all_customer_matched;

            if (filter === 'all') return matchesSearchTerm;
            if (filter === 'synced') return matchesSearchTerm && synced;
            if (filter === 'not_synced') return matchesSearchTerm && notSynced;
            if (filter === 'forced_sync') return matchesSearchTerm && forcedSync;
            if (filter === 'not_forced_sync') return matchesSearchTerm && !forcedSync;
            if (filter === 'matched') return matchesSearchTerm && matched;
            if (filter === 'not_matched') return matchesSearchTerm && !matched;
            return matchesSearchTerm && notProcessed;
        });
    }, [data.invoices, filter, filterBySearchTerm, filterByDate]);

    const sortedInvoices = useMemo(() => {
        return stableSort(filteredInvoices, getComparatorUndefined(order, orderBy));
    }, [filteredInvoices, order, orderBy]);

    const columns = [
        { id: 'invoice_number', label: 'Nr.' },
        { id: 'customer_name', label: 'Customer' },
        { id: 'date', label: 'Date' },
        { id: 'total', label: 'Amount' },
        { id: 'sync_status', label: 'Sync?' },
        { id: 'matched', label: 'Matched' },
        { id: 'force_sync', label: 'Force Sync?' },
        { id: 'actions', label: 'Actions' }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-10%',
                marginTop: '-6%',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
                minWidth: '88vw',
                padding: 1,
            }}
            >
            <Grid container spacing={1} mb={3}>
                <Grid item xs={4}>
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                            textTransform: 'uppercase',
                            color: 'info.main',
                            fontWeight: 'bold',
                        }}
                    >
                        Invoices List
                    </Typography>
                    <FormControl variant="outlined" size="small">
                        <InputLabel>Filter</InputLabel>
                        <Select
                            value={filter}
                            onChange={handleFilterChange}
                            label="Filter"
                        >
                            <MenuItem value="all">All Invoices</MenuItem>
                            <MenuItem value="synced">Synced Invoices</MenuItem>
                            <MenuItem value="not_synced">Not Synced Invoices</MenuItem>
                            <MenuItem value="not_processed">Not Processed Invoices</MenuItem>
                            <MenuItem value="forced_sync">Forced to Sync Invoices</MenuItem>
                            <MenuItem value="not_forced_sync">Not Forced to Sync Invoices</MenuItem>
                            <MenuItem value="matched">Matched Invoices</MenuItem>
                            <MenuItem value="not_matched">Not Matched Invoices</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={8} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <TextField
                            label="Search"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={() => setSearchTerm('')} size="small">
                                        <ClearIcon />
                                    </IconButton>
                                )
                            }}
                            sx={{
                                height: '75%', 
                                '& .MuiInputBase-root': {
                                    height: '75%'
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Filter by date"
                                inputFormat="yyyy-MM-dd"
                                value={filterDate}
                                onChange={(date) => handleChangeDate(date)}
                                minDate={oneYearAgo}
                                maxDate={today}
                                textField={(params) => (
                                    <TextField
                                        {...params}
                                        sx={{
                                            height: '80%', 
                                            '& .MuiInputBase-root': {
                                                height: '80%' 
                                            }
                                        }}
                                    />
                                )}
                            />
                        </LocalizationProvider>
                        {(filterDate || searchTerm) && (
                            <Button variant="outlined" color="primary" size="small" onClick={clearFilters} sx={{ mt: 1 }}>
                                Clear Filters
                            </Button>
                        )}
                    </Grid>
                    <Grid item xs={2} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Button
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={handleForceToSync}
                            disabled={filteredInvoices.length === 0}
                        >
                            Sync Selected
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

            <Grid container spacing={2} mb={3}>
            <Grid item xs={12}>
                <Alert severity={filter === 'all' ? 
                    'info' : (filter === 'not_processed' ? 
                    'warning' : (filter === 'synced' ? 
                    'success' : (filter === 'forced_sync' || filter === 'not_forced_sync' ? 
                    'info':  (filter === 'matched' ? 
                    'success' : (filter === 'not_matched' ? 
                    'warning' : 'error')))))
                } sx={{ fontSize: 'small' }}>
                    <b>{filteredInvoices.length}</b> {filter === 'all' ? 
                    'Total' : (filter === 'not_processed' ? 
                    'Not Processed' : (filter === 'synced' ? 
                    'Synced' : (filter === 'forced_sync' ? 
                    'Forced to Sync' : (filter === 'not_forced_sync' ? 
                    'Not Forced to Sync' : (filter === 'matched' ? 
                    'Matched': (filter === 'not_matched' ? 
                    'Not Matched':'Not Synced'))))))
                } invoices found
                </Alert>
            </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                            {columns.map((column) => (
                                <TableCell key={column.id} sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>
                                    <TableSortLabel
                                        active={orderBy === column.id}
                                        direction={orderBy === column.id ? order : 'asc'}
                                        onClick={() => handleSortChange(column.id)}
                                    >
                                        {column.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                                <EmptyRecordsCell columns={columns} />
                            ) : (
                                    (rowsPerPage > 0
                                ? sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : sortedInvoices
                            ).map((invoice, index) => {
                                const isItemSelected = isSelected(invoice.fields.invoice_id);
                                return (
                                    <TableRow key={index} style={{ backgroundColor: getBackgroundColor(invoice) }}>
                                        <TableCell>{invoice.fields.invoice_number}</TableCell>
                                        <TableCell>{invoice.fields.customer_name}</TableCell>
                                        <TableCell>{invoice.fields.date}</TableCell>
                                        <TableCell>$ {invoice.fields.total}</TableCell>
                                        <TableCell align="center">
                                            {renderSyncStatus(invoice)}
                                        </TableCell>
                                        <TableCell align="center" sx={() => ({
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #ccc',
                                                width: '50px', 
                                                maxWidth: '50px'
                                            })}>
                                            {renderMatchStatus(invoice)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {
                                                !invoice.fields.force_to_sync ? 
                                                renderForceSyncCheckbox(invoice, isItemSelected) : 
                                                (<Box sx={{ display: 'flex', gap: 1 }}>
                                                    <CheckCircleIcon color="success" />
                                                    <Typography sx={{ color: 'success.main' }}><b>Forced to sync</b></Typography>
                                                </Box>)
                                            }
                                        </TableCell>
                                        <TableCell align="center">
                                            {/* <Button variant="contained" color="info" size="small" onClick={() => handleViewInvoice(invoice)} >
                                                View
                                            </Button> */}
                                            <IconButton onClick={() => handleViewInvoice(invoice)} color="info" aria-label="view" size='xx-large'>
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteInvoice(invoice)} color="error" aria-label="view" size='xx-large'>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.invoices.length}
                rowsPerPage={rowsPerPage}
                page={Number.isFinite(page) && page >= 0 ? Math.min(page, Math.ceil(data.invoices.length / rowsPerPage) - 1) : 0}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Container>
    );
};

export default InvoicesList;
