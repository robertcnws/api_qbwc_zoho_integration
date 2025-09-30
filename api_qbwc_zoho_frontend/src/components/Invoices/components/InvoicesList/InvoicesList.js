import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
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
import { RadioButtonCheckedOutlined, UndoRounded } from '@mui/icons-material';

import { stableSort, fetchWithToken, getComparatorUndefined } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import HomeNavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

dayjs.extend(utc);
dayjs.extend(timezone);

const apiUrl =
    process.env.REACT_APP_ENVIRONMENT === 'DEV'
        ? process.env.REACT_APP_BACKEND_URL_DEV
        : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE, 10) || 10;

const InvoicesList = ({ data, configData, onSyncComplete, filterDate, setFilterDate }) => {
    const navigate = useNavigate();

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

    const today = dayjs();
    const oneYearAgo = today.subtract(1, 'year');

    

    // Restaurar estado inicial
    useEffect(() => {
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        window.addEventListener('storage', handleStorageChange);

        const savedPage = localStorage.getItem('invoicesListPage');
        const savedRowsPerPage = localStorage.getItem('invoicesListRowsPerPage');
        const savedFilterDate = localStorage.getItem('invoicesListFilterDate');

        const initialPage = savedPage !== null ? Number(savedPage) : 0;
        const initialRowsPerPage = savedRowsPerPage !== null ? Number(savedRowsPerPage) : 10;
        setPage(Number.isInteger(initialPage) && initialPage >= 0 ? initialPage : 0);
        setRowsPerPage([5, 10, 25].includes(initialRowsPerPage) ? initialRowsPerPage : 10);

        if (savedFilterDate) {
            const parsedDate = dayjs(savedFilterDate);
            setFilterDate(parsedDate.isValid() ? parsedDate : today);
        } else {
            setFilterDate(today);
        }

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [setFilterDate]);

    // Sincronizar querystring con fecha
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
        }
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [filterDate]);

    const handleFilterChange = useCallback((event) => {
        setFilter(event.target.value);
        setPage(0);
    }, []);

    const handleViewInvoice = useCallback(
        (invoice) => {
            const invoices = data.invoices;
            localStorage.setItem('invoicesListPage', page);
            localStorage.setItem('invoicesListRowsPerPage', rowsPerPage);
            localStorage.setItem('invoicesListFilterDate', filterDate ? filterDate.format('YYYY-MM-DD') : '');
            localStorage.setItem('invoice', JSON.stringify(invoice));
            localStorage.setItem('invoices', JSON.stringify(invoices));
            localStorage.setItem('filteredInvoices', JSON.stringify(filteredInvoices));
            localStorage.setItem('filterInvoices', JSON.stringify(filter));
            localStorage.setItem('backNavigation', 'invoice_details');
            setFilterDate(filterDate);
            navigate('/integration/invoice_details', { state: { invoice, invoices, filteredInvoices, filter } });
        },
        [page, rowsPerPage, filterDate, data.invoices, filter, navigate, setFilterDate]
    );

    const handleChangePage = useCallback(
        (_event, newPage) => {
            const maxPage = Math.max(0, Math.ceil(data.invoices.length / rowsPerPage) - 1);
            const bounded = Math.min(newPage, maxPage);
            setPage(bounded);
            localStorage.setItem('invoicesListPage', bounded);
        },
        [data.invoices.length, rowsPerPage]
    );

    const handleChangeRowsPerPage = useCallback((event) => {
        const rows = parseInt(event.target.value, 10);
        const next = [5, 10, 25].includes(rows) ? rows : 10;
        setRowsPerPage(next);
        setPage(0);
        localStorage.setItem('invoicesListRowsPerPage', next);
        localStorage.setItem('invoicesListPage', 0);
    }, []);

    const handleDeleteInvoice = useCallback(
        (invoice) => {
            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to delete this invoice? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
            }).then((result) => {
                if (!result.isConfirmed) return;

                (async () => {
                    try {
                        const url = `${apiUrl}/api_zoho_invoices/delete_invoice/${invoice.fields.invoice_id}/`;
                        const body = { username: localStorage.getItem('username') };
                        const response = await fetchWithToken(url, 'POST', body, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire('Success!', 'Invoice has been deleted successfully.', 'success').then(() => {
                                onSyncComplete?.();
                            });
                        } else {
                            Swal.fire('Error!', `Error deleting invoice: ${response.data.message}`, 'error');
                        }
                    } catch (err) {
                        Swal.fire('Error!', `Error deleting invoice: ${err}`, 'error');
                    }
                })();
            });
        },
        [onSyncComplete]
    );

    const handleForceToSync = useCallback(() => {
        if (selectedInvoices.length === 0) {
            Swal.fire('Error!', 'Please select at least one invoice to force sync.', 'error');
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to force sync selected invoices?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, force to sync!',
        }).then((result) => {
            if (!result.isConfirmed) return;
            (async () => {
                try {
                    const url = `${apiUrl}/api_quickbook_soap/force_to_sync_invoices_ajax/`;
                    const params = { invoices: selectedInvoices, username: localStorage.getItem('username') };
                    const response = await fetchWithToken(url, 'POST', params, {}, apiUrl);
                    if (response.data.status === 'success') {
                        Swal.fire('Success!', 'Selected invoices have been forced to sync.', 'success').then(() => {
                            setSelectedInvoices([]);
                            onSyncComplete?.();
                        });
                    } else {
                        Swal.fire('Error!', `Error syncing invoices: ${response.data.message}`, 'error');
                    }
                } catch (err) {
                    Swal.fire('Error!', `Error syncing invoices: ${err}`, 'error');
                }
            })();
        });
    }, [selectedInvoices, onSyncComplete]);

    const handleUnsync = useCallback(() => {
        if (selectedInvoices.length === 0) {
            Swal.fire('Error!', 'Please select at least one invoice to unsync.', 'error');
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to unsync selected invoices?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, unsync!',
        }).then((result) => {
            if (!result.isConfirmed) return;
            (async () => {
                try {
                    const url = `${apiUrl}/api_quickbook_soap/unsync_invoices_ajax/`;
                    const params = { invoices: selectedInvoices, username: localStorage.getItem('username') };
                    const response = await fetchWithToken(url, 'POST', params, {}, apiUrl);
                    if (response.data.status === 'success') {
                        Swal.fire('Success!', 'Selected invoices have been unsynced.', 'success').then(() => {
                            setSelectedInvoices([]);
                            onSyncComplete?.();
                        });
                    } else {
                        Swal.fire('Error!', `Error unsyncing invoices: ${response.data.message}`, 'error');
                    }
                } catch (err) {
                    Swal.fire('Error!', `Error unsyncing invoices: ${err}`, 'error');
                }
            })();
        });
    }, [selectedInvoices, onSyncComplete]);

    const isSelected = (invoiceId) => selectedInvoices.includes(invoiceId);

    const handleCheckboxClick = (_event, invoiceId) => {
        setSelectedInvoices((prev) =>
            prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
        );
    };

    // --- Selección masiva (corregida para no meter undefined)
    const handleSelectAllSyncPage = (rpp, currentPage, type) => {
        const startIndex = currentPage * rpp;
        const endIndex = Math.min(startIndex + rpp, filteredInvoices.length);
        const ids = [];
        for (let i = startIndex; i < endIndex; i++) {
            const inv = filteredInvoices[i];
            if (type === 'force_sync' && !inv.fields.inserted_in_qb) ids.push(inv.fields.invoice_id);
            if (type === 'unsync' && inv.fields.inserted_in_qb) ids.push(inv.fields.invoice_id);
        }
        setSelectedInvoices(ids);
    };

    const handleSelectAllSyncAll = (type) => {
        const ids =
            type === 'force_sync'
                ? filteredInvoices.filter((inv) => !inv.fields.inserted_in_qb).map((inv) => inv.fields.invoice_id)
                : filteredInvoices.filter((inv) => inv.fields.inserted_in_qb).map((inv) => inv.fields.invoice_id);
        setSelectedInvoices(ids);
    };

    const handleSelectSyncChange = (event) => {
        const v = event.target.value;
        setSelectedOptionForceSync(v);
        setSelectedInvoices([]);
        if (v === 'select_page') {
            setTitleSelectForceSync('Unselect?');
            handleSelectAllSyncPage(rowsPerPage, page, 'force_sync');
        } else if (v === 'select_all') {
            setTitleSelectForceSync('Unselect?');
            handleSelectAllSyncAll('force_sync');
        } else {
            setTitleSelectForceSync('Force Sync?');
        }
    };

    const handleSelectUnsyncChange = (event) => {
        const v = event.target.value;
        setSelectedOptionUnsync(v);
        setSelectedInvoices([]);
        if (v === 'select_page_unsync') {
            setTitleSelectUnsync('Unselect?');
            handleSelectAllSyncPage(rowsPerPage, page, 'unsync');
        } else if (v === 'select_all_unsync') {
            setTitleSelectUnsync('Unselect?');
            handleSelectAllSyncAll('unsync');
        } else {
            setTitleSelectUnsync('Unsync?');
        }
    };

    // --- Filtros
    const filterByDate = (invoice) => {
        if (!filterDate) return true;
        const invDate = dayjs(invoice.fields.date);
        return invDate.isValid() && invDate.isSame(filterDate, 'day');
    };

    const filterBySearchTerm = (invoice) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase().trim();
        const f = invoice.fields;
        return (
            (f.invoice_number || '').toLowerCase().includes(q) ||
            (f.customer_name || '').toLowerCase().includes(q) ||
            (f.date || '').toLowerCase().includes(q) ||
            String(f.total || '').toLowerCase().includes(q)
        );
    };

    const clearFilters = () => {
        const t = dayjs();
        setFilterDate(t);
        localStorage.setItem('invoicesListFilterDate', t.format('YYYY-MM-DD'));
        setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('date');
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
    };

    const getRowBg = (invoice, isMouseOver) => {
        // Unificamos hover a #f6f6fa
        return !isMouseOver ? '#FFFFFF' : '#F6F6FA';
    };

    const renderSyncStatus = (invoice) => {
        const hasErrors = invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0;
        if (hasErrors)
            return (
                <Tooltip title="ERROR" arrow sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}>
                    <ErrorIcon sx={{ color: 'error.main' }} />
                </Tooltip>
            );
        if (!invoice.fields.inserted_in_qb)
            return (
                <Tooltip
                    title="NOT PROCESSED"
                    arrow
                    sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}
                >
                    <RemoveCircleIcon sx={{ color: 'warning.main' }} />
                </Tooltip>
            );
        return (
            <Tooltip title="SUCCESS" arrow sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
            </Tooltip>
        );
    };

    const renderMatchStatus = (invoice) => {
        const matched = invoice.fields.all_items_matched && invoice.fields.all_customer_matched;
        return matched ? (
            <Tooltip title="MATCHED" arrow sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
            </Tooltip>
        ) : (
            <Tooltip title="NOT MATCHED" arrow sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}>
                <ErrorIcon sx={{ color: 'error.main' }} />
            </Tooltip>
        );
    };

    const renderForceSyncCheckbox = (invoice, isSel) => {
        const hasErrors = invoice.fields.customer_unmatched.length > 0 || invoice.fields.items_unmatched.length > 0;
        if (!(invoice.fields.inserted_in_qb && !hasErrors)) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSel}
                                value={invoice.fields.invoice_id}
                                onChange={(e) => handleCheckboxClick(e, invoice.fields.invoice_id)}
                            />
                        }
                        label="Force to sync?"
                    />
                </FormControl>
            );
        }
        return (
            <Tooltip title="SYNCED" arrow sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
            </Tooltip>
        );
    };

    const renderUnsyncCheckbox = (invoice, isSel) => {
        if (invoice.fields.inserted_in_qb) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSel}
                                value={invoice.fields.invoice_id}
                                onChange={(e) => handleCheckboxClick(e, invoice.fields.invoice_id)}
                            />
                        }
                        label="Unsync?"
                    />
                </FormControl>
            );
        }
        return (
            <Tooltip
                title="Not synced yet"
                arrow
                sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}
            >
                <RadioButtonCheckedOutlined sx={{ color: 'warning.main' }} />
            </Tooltip>
        );
    };

    const handleChangeDate = useCallback(
        (date) => {
            if (date && date.isValid()) {
                setFilterDate(date);
                localStorage.setItem('invoicesListFilterDate', date.format('YYYY-MM-DD'));
            } else {
                setFilterDate(null);
                localStorage.setItem('invoicesListFilterDate', '');
            }
            setPage(0);
        },
        [setFilterDate]
    );

    const handleSortChange = useCallback(
        (columnId) => {
            const isAsc = orderBy === columnId && order === 'asc';
            setOrder(isAsc ? 'desc' : 'asc');
            setOrderBy(columnId);
        },
        [orderBy, order]
    );

    // ---- Derivados
    const filteredInvoices = useMemo(() => {
        return data.invoices.filter((invoice) => {
            const matchesSearchTerm = filterBySearchTerm(invoice) && filterByDate(invoice);
            const notProcessed =
                !invoice.fields.inserted_in_qb &&
                !(invoice.fields.customer_unmatched.length > 0) &&
                !(invoice.fields.items_unmatched.length > 0);
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
            // not_processed
            return matchesSearchTerm && notProcessed;
        });
    }, [data.invoices, filter, searchTerm, filterDate]);

    const sortedInvoices = useMemo(
        () => stableSort(filteredInvoices, getComparatorUndefined(order, orderBy)),
        [filteredInvoices, order, orderBy]
    );

    const columns = [
        { id: 'invoice_number', label: 'Invoice#', colspan: 1, textAlign: 'left' },
        { id: 'customer_name', label: 'Customer', colspan: 1, textAlign: 'left' },
        { id: 'date', label: 'Date', colspan: 1, textAlign: 'left' },
        { id: 'total', label: 'Amount', colspan: 1, textAlign: 'left' },
        { id: 'status', label: 'Sync & Matched?', colspan: 2, textAlign: 'right' },
        { id: 'force_sync', label: titleSelectForceSync, colspan: 1, textAlign: 'center' },
        { id: 'unsync', label: titleSelectUnsync, colspan: 1, textAlign: 'center' },
        { id: 'actions', label: 'Actions', colspan: 1, textAlign: 'center' },
    ];

    const childrenNavigationRightButton = [
        {
            label: 'Clear Filters',
            icon: <FilterAltOffIcon sx={{ mr: 1 }} />,
            onClick: clearFilters,
            visibility: Boolean(filterDate || searchTerm),
        },
        {
            label: 'Sync Selected',
            icon: <CheckCircleIcon sx={{ mr: 1 }} />,
            onClick: handleForceToSync,
            visibility: selectedInvoices.length > 0,
        },
        {
            label: 'Back to Integration',
            icon: <HomeIcon sx={{ mr: 1 }} />,
            route: '/integration',
            visibility: true,
        },
    ];

    const configCustomFilter = {
        filter,
        handleFilterChange,
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
        hasSearch: false,
    };

    return (
        <Box sx={{ width: '100%', px: 0, py: 1, overflowX: 'hidden' }}>
            {/* Header de filtros */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
                    gap: 2,
                    alignItems: 'start',
                    mb: 2,
                }}
            >
                <Box sx={{ maxWidth: 420 }}>
                    <CustomFilter configCustomFilter={configCustomFilter} />
                </Box>

                <Box sx={{
                    display: 'flex',
                    gap: 1.5,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    mr: 1
                }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Filter by date"
                            value={filterDate}
                            onChange={handleChangeDate}
                            minDate={oneYearAgo}
                            maxDate={today}
                            format="YYYY-MM-DD"
                            slotProps={{ textField: { size: 'small' } }}
                        />
                    </LocalizationProvider>

                    <HomeNavigationRightButton children={childrenNavigationRightButton} />
                </Box>
            </Box>

            {/* Tabla */}
            <TableContainer sx={{ maxHeight: 700, minHeight: 700 }}>
                <Table stickyHeader aria-label="invoices table" size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9f9fb' }}>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    colSpan={column.colspan}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: '#6c7184',
                                        borderBottom: '1px solid #ddd',
                                        borderTop: '1px solid #ddd',
                                        backgroundColor: '#f9f9fb',
                                        py: 0.75,
                                        textAlign: { xs: 'center', sm: column.textAlign },
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
                                        <Select
                                            value={column.id === 'force_sync' ? selectedOptionForceSync : selectedOptionUnsync}
                                            onChange={(e) =>
                                                column.id === 'force_sync' ? handleSelectSyncChange(e) : handleSelectUnsyncChange(e)
                                            }
                                            displayEmpty
                                            size="small"
                                            sx={{ minWidth: 180 }}
                                        >
                                            <MenuItem value={column.id === 'force_sync' ? 'select_clear' : 'select_clear_unsync'}>
                                                <em>{column.label.toUpperCase()}</em>
                                            </MenuItem>
                                            <MenuItem
                                                value={column.id === 'force_sync' ? 'select_page' : 'select_page_unsync'}
                                                onClick={() =>
                                                    handleSelectAllSyncPage(rowsPerPage, page, column.id === 'force_sync' ? 'force_sync' : 'unsync')
                                                }
                                            >
                                                Select All in Page
                                            </MenuItem>
                                            <MenuItem
                                                value={column.id === 'force_sync' ? 'select_all' : 'select_all_unsync'}
                                                onClick={() => handleSelectAllSyncAll(column.id === 'force_sync' ? 'force_sync' : 'unsync')}
                                            >
                                                Select All in Table
                                            </MenuItem>

                                            {/* Acción directa para UNSYNC si hay selección */}
                                            {column.id === 'unsync' && selectedInvoices.length > 0 && (
                                                <MenuItem value="unsync_invoices" onClick={handleUnsync}>
                                                    <UndoRounded sx={{ mr: 1 }} /> <b>Unsync Selected Invoices</b>
                                                </MenuItem>
                                            )}
                                        </Select>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <EmptyRecordsCell columns={columns} isColspanTable />
                        ) : (
                            (rowsPerPage > 0
                                ? sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : sortedInvoices
                            ).map((invoice, index) => {
                                const isItemSelected = isSelected(invoice.fields.invoice_id);
                                const bg = index === hoveredRowIndex ? getRowBg(invoice, true) : getRowBg(invoice, false);
                                return (
                                    <TableRow
                                        key={invoice.fields.invoice_id || index}
                                        hover
                                        sx={{ cursor: 'pointer', backgroundColor: bg, transition: 'background-color 0.2s ease' }}
                                        onMouseEnter={() => setHoveredRowIndex(index)}
                                        onMouseLeave={() => setHoveredRowIndex(null)}
                                    >
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.fields.invoice_number}</TableCell>
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.fields.customer_name}</TableCell>
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>{invoice.fields.date}</TableCell>
                                        <TableCell onClick={() => handleViewInvoice(invoice)}>${invoice.fields.total}</TableCell>

                                        <TableCell align="center" onClick={() => handleViewInvoice(invoice)}>
                                            {renderSyncStatus(invoice)}
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                            sx={(theme) => ({
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #ccc',
                                                width: 20,
                                                maxWidth: 20,
                                                color:
                                                    invoice.fields.all_items_matched && invoice.fields.all_customer_matched
                                                        ? theme.palette.success.main
                                                        : theme.palette.error.main,
                                            })}
                                            onClick={() => handleViewInvoice(invoice)}
                                        >
                                            {renderMatchStatus(invoice)}
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                            onClick={() => (invoice.fields.force_to_sync || invoice.fields.inserted_in_qb) && handleViewInvoice(invoice)}
                                        >
                                            {!invoice.fields.force_to_sync ? (
                                                renderForceSyncCheckbox(invoice, isItemSelected)
                                            ) : (
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                    <SyncIcon color="warning" />
                                                    <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700 }}>
                                                        Forced to sync
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>

                                        <TableCell align="center" onClick={() => !invoice.fields.inserted_in_qb && handleViewInvoice(invoice)}>
                                            {renderUnsyncCheckbox(invoice, isItemSelected)}
                                        </TableCell>

                                        <TableCell align="center">
                                            <IconButton onClick={() => handleDeleteInvoice(invoice)} color="error">
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
                            page={
                                Number.isFinite(page) && page >= 0
                                    ? Math.min(page, Math.max(0, Math.ceil(filteredInvoices.length / rowsPerPage) - 1))
                                    : 0
                            }
                            rowsPerPage={rowsPerPage}
                            handleChangePage={handleChangePage}
                            handleChangeRowsPerPage={handleChangeRowsPerPage}
                        />
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InvoicesList;
