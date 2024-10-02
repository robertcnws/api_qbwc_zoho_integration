import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Grid,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    IconButton,
    FormControl,
    FormControlLabel,
    Checkbox,
    Tooltip,
    MenuItem,
    Select,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import HomeIcon from '@mui/icons-material/Home';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { stableSort, fetchWithToken, getComparatorUndefined } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import HomeNavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';
import './InvoicesList.css';
import { RadioButtonCheckedOutlined, RadioButtonUncheckedOutlined, UndoRounded } from '@mui/icons-material';
dayjs.extend(utc);
dayjs.extend(timezone);

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);

document.addEventListener('DOMContentLoaded', () => {
    const page = '1'; // Asegúrate de que este valor coincide con los checkboxes
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-page="${page}"]`);
    console.log(checkboxes);
});

const InvoicesList = ({ data, configData, onSyncComplete, filterDate, setFilterDate }) => {

    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
    const [selectedOptionForceSync, setSelectedOptionForceSync] = useState('select_clear');
    const [titleSelectForceSync, setTitleSelectForceSync] = useState('Force Sync?');
    const [selectedOptionUnsync, setSelectedOptionUnsync] = useState('select_clear_unsync');
    const [titleSelectUnsync, setTitleSelectUnsync] = useState('Unsync?');
    const navigate = useNavigate();

    const today = dayjs();
    const oneYearAgo = today.subtract(1, 'year');


    useEffect(() => {
        // Restaurar el estado desde localStorage
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        const savedPage = localStorage.getItem('invoicesListPage');
        const savedRowsPerPage = localStorage.getItem('invoicesListRowsPerPage');
        const savedFilterDate = localStorage.getItem('invoicesListFilterDate');

        const initialPage = savedPage !== null ? Number(savedPage) : 0;
        const initialRowsPerPage = savedRowsPerPage !== null ? Number(savedRowsPerPage) : 10;

        const absInitialPage = initialPage >= 0 ? initialPage : 0;

        setPage(Number.isInteger(absInitialPage) ? absInitialPage : 0);
        setRowsPerPage([5, 10, 25].includes(initialRowsPerPage) ? initialRowsPerPage : 10);

        if (savedFilterDate) {
            const parsedDate = dayjs(savedFilterDate);
            setFilterDate(parsedDate.isValid() ? parsedDate : today);
        } else {
            setFilterDate(today);
        }
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [setFilterDate, searchTerm]);


    useEffect(() => {
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        const queryParams = new URLSearchParams(window.location.search);
        if (filterDate && filterDate.isValid()) {
            queryParams.set('date', filterDate.format('YYYY-MM-DD'));
        } else {
            queryParams.delete('date');
            // queryParams.set('date', today.format('YYYY-MM-DD'));
        }
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [filterDate, searchTerm]);


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
        // setSelectedOptionForceSync('select_clear');
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
                        const data = { username: localStorage.getItem('username') };
                        const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
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

    const handleUnsync = useCallback(() => {
        if (selectedInvoices.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select at least one invoice to unsync.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to unsync selected invoices?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, unsync!'
        }).then((result) => {
            if (result.isConfirmed) {
                const fetchData = async () => {
                    try {
                        const url = `${apiUrl}/api_quickbook_soap/unsync_invoices_ajax/`
                        const params = {
                            invoices: selectedInvoices,
                            username: localStorage.getItem('username'),
                        }
                        const response = await fetchWithToken(url, 'POST', params, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                title: 'Success!',
                                text: 'Selected invoices have been unsynced.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                setSelectedInvoices([]);
                                onSyncComplete(); 
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: `An error occurred while unsyncing invoices: ${response.data.message}`,
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

    const handleSelectSyncChange = (event) => {
        setSelectedOptionForceSync(event.target.value);
        setSelectedInvoices([]);
        if (event.target.value === 'select_page') {
            setTitleSelectForceSync('Unselect?');
            handleSelectAllSyncPage(rowsPerPage, page, 'force_sync');
        }
        else if (event.target.value === 'select_all') {
            setTitleSelectForceSync('Unselect?');
            handleSelectAllSyncAll('force_sync');
        } else {
            setTitleSelectForceSync('Force Sync?');
            setSelectedInvoices([]);
        }
    };

    const handleSelectUnsyncChange = (event) => {
        setSelectedInvoices([]);
        setSelectedOptionUnsync(event.target.value);
        if (event.target.value === 'select_page_unsync') {
            setTitleSelectUnsync('Unselect?');
            handleSelectAllSyncPage(rowsPerPage, page, 'unsync');
        }
        else if (event.target.value === 'select_all_unsync') {
            setTitleSelectUnsync('Unselect?');
            handleSelectAllSyncAll('unsync');
        } else {
            setTitleSelectUnsync('Unsync?');
            setSelectedInvoices([]);
        }
    };

    const handleSelectAllSyncPage = (rowsPerPage, page, type) => {
        setSelectedInvoices([]);
        const startIndex = page * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredInvoices.length);
        const newSelected = [...selectedInvoices];
        let invoiceId = '';
        if (type) {
            for (let i = startIndex; i < endIndex; i++) {
                if (type === 'force_sync') {
                    if (!filteredInvoices[i].fields.inserted_in_qb) {
                        invoiceId = filteredInvoices[i].fields.invoice_id;
                    }
                }
                else if (type === 'unsync') {
                    if (filteredInvoices[i].fields.inserted_in_qb) {
                        invoiceId = filteredInvoices[i].fields.invoice_id;
                    }
                }
                if (!newSelected.includes(invoiceId)) {
                    newSelected.push(invoiceId);
                }
            }
        }
        setSelectedInvoices(newSelected);
    };

    const handleSelectAllSyncAll = (type) => {
        setSelectedInvoices([]);
        setSelectedInvoices([...filteredInvoices.map(
            (invoice) => {
                if (type) {
                    if (type === 'force_sync') {
                        if (!invoice.fields.inserted_in_qb) {
                            return invoice.fields.invoice_id;
                        }
                    }
                    else if (type === 'unsync') {
                        if (invoice.fields.inserted_in_qb) {
                            return invoice.fields.invoice_id;
                        }
                    }
                }
            })
        ]);
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
        setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('date');
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
    };

    const getBackgroundColor = (invoice, isMouseOver) => {
        if (invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0) {
            // return !isMouseOver ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 0, 0, 0.1)';
            return !isMouseOver ? '#FFFFFF' : '#f6f6fa';
        } else if (invoice.fields.inserted_in_qb) {
            // return !isMouseOver ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 255, 0, 0.1)';
            return !isMouseOver ? '#FFFFFF' : '#f6f6fa';
        } else {
            // return !isMouseOver ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 0, 0.1)';
            return !isMouseOver ? '#FFFFFF' : '#f6f6fa';
        }
    };

    const renderSyncStatus = (invoice) => {
        if (invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0) {
            return (
                <Tooltip
                    title="ERROR"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 'large' }} />
                </Tooltip>
            );
        } else if (!invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0) {
            return (
                <Tooltip
                    title="NOT PROCESSED"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    <RemoveCircleIcon sx={{ color: 'warning.main', fontSize: 'large' }} />
                </Tooltip>
            );
        } else {
            return (
                <Tooltip
                    title="SUCCESS"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 'large' }} />
                </Tooltip>
            );
        }
    };

    const renderMatchStatus = (invoice) => {
        if (invoice.fields.all_items_matched && invoice.fields.all_customer_matched) {
            return (
                <Tooltip
                    title="MATCHED"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 'large' }} />
                </Tooltip>
            );
        } else {
            return (
                <Tooltip
                    title="NOT MATCHED"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 'large' }} />
                </Tooltip>
            );
        }
    };

    const renderForceSyncCheckbox = (invoice, isSelected, page) => {
        if (!(invoice.fields.inserted_in_qb && !invoice.fields.customer_unmatched.length > 0 && !invoice.fields.items_unmatched.length > 0)) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSelected}
                                value={invoice.fields.invoice_id}
                                onChange={(e) => handleCheckboxClick(e, invoice.fields.invoice_id)}
                                data-page={page}
                            />
                        }
                        label="Force to sync?"
                    />
                </FormControl>
            );
        } else {
            return (
                <Tooltip
                    title="SYNCED"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem',
                        }
                    }}
                >
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 'large' }} />
                </Tooltip>

            );
        }

    };


    const renderUnsyncCheckbox = (invoice, isSelected, page) => {
        if (invoice.fields.inserted_in_qb) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSelected}
                                value={invoice.fields.invoice_id}
                                onChange={(e) => handleCheckboxClick(e, invoice.fields.invoice_id)}
                                data-page={page}
                            />
                        }
                        label="Unsync?"
                    />
                </FormControl>
            );
        } else {
            return (
                <Tooltip
                    title="Not synced yet"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            backgroundColor: '#000000',
                            color: 'white',
                            fontSize: '0.875rem',
                        }
                    }}
                >
                    <RadioButtonCheckedOutlined sx={{ color: 'warning.main', fontSize: 'large' }} />
                </Tooltip>

            );
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
        { id: 'invoice_number', label: 'Invoice#', colspan: 1, textAlign: 'left' },
        { id: 'customer_name', label: 'Customer', colspan: 1, textAlign: 'left' },
        { id: 'date', label: 'Date', colspan: 1, textAlign: 'left' },
        { id: 'total', label: 'Amount', colspan: 1, textAlign: 'left' },
        { id: 'status', label: 'Sync & Matched?', colspan: 2, textAlign: 'right' },
        { id: 'force_sync', label: titleSelectForceSync, colspan: 1, textAlign: 'center' },
        { id: 'unsync', label: titleSelectUnsync, colspan: 1, textAlign: 'center' },
        { id: 'actions', label: 'Actions', colspan: 1, textAlign: 'center' }
    ];

    const childrenNavigationRightButton = [
        {
            label: 'Clear Filters',
            icon: <FilterAltOffIcon sx={{ marginRight: 1 }} />,
            onClick: clearFilters,
            visibility: filterDate || searchTerm
        },
        {
            label: 'Sync Selected',
            icon: <CheckCircleIcon sx={{ marginRight: 1 }} />,
            onClick: handleForceToSync,
            visibility: selectedInvoices.length > 0
        },
        {
            label: 'Back to Integration',
            icon: <HomeIcon sx={{ marginRight: 1 }} />,
            route: '/integration',
            visibility: true
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
            { value: 'not_matched', label: 'Not Matched Invoices' }
        ],
        hasSearch: false
    };

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-29.4%',
                minWidth: '88.3vw',
            }}
        >
            <Grid container spacing={1} mb={3} sx={{ mt: '-3%' }}>
                <Grid item container xs={4} justifyContent="flex-start">
                    <Grid item xs={5}>
                        <CustomFilter configCustomFilter={configCustomFilter} />
                    </Grid>
                </Grid>
                <Grid item xs={8} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Filter by date"
                                inputFormat="yyyy-MM-dd"
                                value={filterDate}
                                onChange={(date) => handleChangeDate(date)}
                                minDate={oneYearAgo}
                                maxDate={today}
                                slotProps={{ textField: { size: 'small' } }}
                                textField={(params) => (
                                    <TextField
                                        variant="outlined"
                                        {...params}
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <HomeNavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
            </Grid>

            <TableContainer style={{ maxHeight: '773px', mixHeight: '773px', minWidth: 690 }} sx={{ mt: '-1%' }}>
                <Table id="myTable" aria-label="items table" stickyHeader>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9f9fb' }}>
                            {columns.map((column) => (
                                <TableCell key={column.id} colSpan={column.colspan}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: '#6c7184',
                                        borderBottom: '1px solid #ddd',
                                        borderTop: '1px solid #ddd',
                                        backgroundColor: '#f9f9fb',
                                        padding: '5px 16px',
                                        textAlign: { xs: 'center', sm: column.textAlign }
                                    }}
                                >
                                    {column.id !== 'force_sync' && column.id !== 'unsync' ? (
                                        <TableSortLabel
                                            active={orderBy === column.id}
                                            direction={orderBy === column.id ? order : 'asc'}
                                            onClick={() => handleSortChange(column.id)}
                                        >
                                            {column.label.toUpperCase()}
                                        </TableSortLabel>
                                    ) : (
                                        <>
                                            <Select
                                                value={column.id === 'force_sync' ? selectedOptionForceSync : selectedOptionUnsync}
                                                onChange={
                                                    (e) => column.id === 'force_sync' ?
                                                        handleSelectSyncChange(e) :
                                                        handleSelectUnsyncChange(e)
                                                }
                                                displayEmpty
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    padding: '0px 0px',
                                                    minWidth: '160px',
                                                    maxHeight: '30px',
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            marginLeft: '130px',  // Ajusta el valor según lo que necesites
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value={column.id === 'force_sync' ? 'select_clear' : 'select_clear_unsync'}>
                                                    <em>{column.label.toUpperCase()}</em>
                                                </MenuItem>
                                                <MenuItem value={column.id === 'force_sync' ? 'select_page' : 'select_page_unsync'} onClick={
                                                    () => handleSelectAllSyncPage(rowsPerPage, page, column.id)}
                                                >
                                                    Select All in Page
                                                </MenuItem>
                                                <MenuItem value={column.id === 'force_sync' ? 'select_all' : 'select_all_unsync'} onClick={
                                                    () => handleSelectAllSyncAll(column?.id)}
                                                >
                                                    Select All in Table
                                                </MenuItem>
                                                {((column.id === 'unsync' && selectedOptionUnsync !== 'select_clear_unsync') || 
                                                 (column.id === 'unsync' && selectedInvoices.length > 0)) && (
                                                    <MenuItem value='unsync_invoices' onClick={() => handleUnsync()}>
                                                        <UndoRounded sx={{ marginRight: 1 }} /> <b>Unsync Selected Invoices</b>
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <EmptyRecordsCell columns={columns} isColspanTable={true} />
                        ) : (
                            (rowsPerPage > 0
                                ? sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : sortedInvoices
                            ).map((invoice, index) => {
                                const isItemSelected = isSelected(invoice.fields.invoice_id);
                                const backgroundColor =
                                    index === hoveredRowIndex
                                        ? getBackgroundColor(invoice, true)
                                        : getBackgroundColor(invoice, false);
                                return (
                                    <TableRow key={index}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'background-color 0.3s ease',
                                            backgroundColor: backgroundColor
                                        }}
                                        data-page={page}
                                        onMouseEnter={() => setHoveredRowIndex(index)}
                                        onMouseLeave={() => setHoveredRowIndex(null)}
                                    >
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.fields.invoice_number}</TableCell>
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.fields.customer_name}</TableCell>
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.fields.date}</TableCell>
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>$ {invoice.fields.total}</TableCell>
                                        <TableCell align="center" onClick={() => handleViewInvoice(invoice)}>
                                            {renderSyncStatus(invoice)}
                                        </TableCell>
                                        <TableCell align="center" sx={(theme) => ({
                                            fontWeight: 'bold',
                                            borderBottom: '1px solid #ccc',
                                            width: '20px',
                                            maxWidth: '20px',
                                            color: invoice.fields.all_items_matched && invoice.fields.all_customer_matched ? theme.palette.success.main : theme.palette.error.main,
                                        })} onClick={() => handleViewInvoice(invoice)}>
                                            {renderMatchStatus(invoice)}
                                        </TableCell>
                                        <TableCell align="center"
                                            onClick={() => (invoice.fields.force_to_sync || invoice.fields.inserted_in_qb) && handleViewInvoice(invoice)}
                                        >
                                            {
                                                !invoice.fields.force_to_sync ?
                                                    renderForceSyncCheckbox(invoice, isItemSelected, page) :
                                                    (<Box sx={{ display: 'flex', gap: 1, marginLeft: '20%' }}>
                                                        <SyncIcon color="warning" />
                                                        <Typography sx={{ color: 'warning.main' }}><b>Forced to sync</b></Typography>
                                                    </Box>)
                                            }
                                        </TableCell>
                                        <TableCell align="center" onClick={() => (!invoice.fields.inserted_in_qb) && handleViewInvoice(invoice)}>
                                            {renderUnsyncCheckbox(invoice, isItemSelected, page)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={() => handleDeleteInvoice(invoice)} color="error" aria-label="view" size='xx-large'>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                        <TableCustomPagination
                            columnsLength={columns.length + 1}
                            data={filteredInvoices}
                            page={Number.isFinite(page) && page >= 0 ? Math.min(page, Math.ceil(filteredInvoices.length / rowsPerPage) - 1) : 0}
                            rowsPerPage={rowsPerPage}
                            handleChangePage={handleChangePage}
                            handleChangeRowsPerPage={handleChangeRowsPerPage}
                        />
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default InvoicesList;
