import React, { useState } from 'react';
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
    Checkbox
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Swal from 'sweetalert2';
import ClearIcon from '@mui/icons-material/Clear';
import dayjs from 'dayjs';
import axios from 'axios';
import { stableSort, getComparator } from '../../../../utils';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const InvoicesList = ({ data }) => {
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [page, setPage] = useState(0);
    const [filterDate, setFilterDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const navigate = useNavigate();
    
    const today = dayjs();
    const oneYearAgo = today.subtract(1, 'year');

    const handleViewInvoice = (invoice) => {
        navigate('/integration/invoice_details', { state: { invoice } });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleForceToSync = () => {
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
                axios.post(`${apiUrl}/api_quickbook_soap/force_to_sync_invoices_ajax/`, { 
                    invoices: selectedInvoices
                }).then((response) => {
                    if (response.data.status === 'success') {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Selected invoices have been forced to sync.',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });
                        navigate('/integration/list_invoices');
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: `An error occurred while syncing invoices: ${response.data.message}`,
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                }).catch((error) => {
                    Swal.fire({
                        title: 'Error!',
                        text: 'An error occurred while syncing invoices.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                });
            }
        });
    };

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
        return invoiceDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0];
    };

    const filterBySearchTerm = (invoice) => {
        if (!searchTerm) return true;
        const normalizedSearch = searchTerm.toLowerCase().trim();
        return (
            invoice.fields.invoice_number.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.customer_name.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.date.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.total.toLowerCase().includes(normalizedSearch) ||
            invoice.fields.force_to_sync.toLowerCase().includes(normalizedSearch)
        );
    };

    const clearFilters = () => {
        setFilterDate(null);
        setSearchTerm('');
    };

    const getBackgroundColor = (invoice) => {
        if (invoice.customer_unmatched || invoice.items_unmatched) {
            return 'rgba(255, 0, 0, 0.1)';
        } else if (invoice.inserted_in_qb) {
            return 'rgba(0, 255, 0, 0.1)';
        } else {
            return 'rgba(255, 255, 0, 0.1)';
        }
    };

    const renderSyncStatus = (invoice) => {
        if (invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0) {
            return <Typography sx={{ color: 'error.main'}}><b>ERROR</b></Typography>;
        } else if (!invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0) {
            return <Typography sx={{ color: 'warning.main'}}><b>Not Synced</b></Typography>;
        } else {
            return <Typography sx={{ color: 'success.main'}}><b>SUCCESS</b></Typography>;
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

    const handleSortChange = (columnId) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    };

    // Ensure that filteredInvoices and sortedItems are updated correctly
    const filteredInvoices = data.invoices.filter(invoice =>
        filterBySearchTerm(invoice) && filterByDate(invoice)
    );

    const sortedItems = stableSort(filteredInvoices, getComparator(order, orderBy));

    const columns = [
        { id: 'invoice_number', label: 'Nr.' },
        { id: 'customer_name', label: 'Customer' },
        { id: 'date', label: 'Date' },
        { id: 'total', label: 'Amount' },
        { id: 'sync_status', label: 'Sync?' },
        { id: 'force_sync', label: 'Force Sync?' },
        { id: 'actions', label: 'Actions' }
    ];

    return (
        <Container sx={{ marginLeft: '-3%', marginTop: '-5%', minWidth: '130%' }}>
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
                    >Invoices List</Typography>
                </Grid>
                <Grid item xs={8} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={3}>
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
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Filter by date"
                                inputFormat="yyyy-MM-dd"
                                value={filterDate}
                                onChange={(date) => setFilterDate(date)}
                                minDate={oneYearAgo}
                                maxDate={today}
                                textField={(params) => (
                                    <TextField
                                        {...params}
                                        sx={{ '& .MuiInputBase-root': { height: 20 } }} // Ajusta la altura del TextField
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
                    <Grid item xs={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleForceToSync}
                        >
                            Sync Selected
                        </Button>
                    </Grid>
                </Grid>
            </Grid>

            <Grid container spacing={2} mb={3}>
                <Grid item xs={3}>
                    <Alert severity="info" sx={{ fontSize: 'small' }}>
                        <b>{data.invoices.length}</b> found
                    </Alert>
                </Grid>
                <Grid item xs={3}>
                    <Alert severity="warning" sx={{ fontSize: 'small' }}>
                        <b>{data.unprocessedNumber}</b> not processed
                    </Alert>
                </Grid>
                <Grid item xs={3}>
                    <Alert severity="success" sx={{ fontSize: 'small' }}>
                        <b>{data.matchedNumber}</b> matched
                    </Alert>
                </Grid>
                <Grid item xs={3}>
                    <Alert severity="error" sx={{ fontSize: 'small' }}>
                        <b>{data.unmatchedNumber}</b> unmatched
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
                        {(rowsPerPage > 0
                            ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            : sortedItems
                        ).map((invoice, index) => {
                            const isItemSelected = isSelected(invoice.fields.invoice_id);
                            return (
                                <TableRow key={index} style={{ backgroundColor: getBackgroundColor(invoice) }}>
                                    <TableCell>{invoice.fields.invoice_number}</TableCell>
                                    <TableCell>{invoice.fields.customer_name}</TableCell>
                                    <TableCell>{invoice.fields.date}</TableCell>
                                    <TableCell>{invoice.fields.total}</TableCell>
                                    <TableCell align="center">
                                        {renderSyncStatus(invoice)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {
                                            !invoice.fields.force_to_sync ? 
                                            renderForceSyncCheckbox(invoice, isItemSelected) : 
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <CheckCircleIcon color="success" />
                                                <Typography sx={{ color: 'success.main' }}><b>Forced to sync</b></Typography>
                                            </Box>
                                        }
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button variant="contained" color="info" size="small" onClick={() => handleViewInvoice(invoice)} >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.invoices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Container>
    );
};

export default InvoicesList;
