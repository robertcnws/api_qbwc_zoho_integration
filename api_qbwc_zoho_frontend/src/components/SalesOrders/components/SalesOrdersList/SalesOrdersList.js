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

const SalesOrdersList = ({ data, configData, onSyncComplete, filterDate, setFilterDate }) => {
    const navigate = useNavigate();

    const [selectedSalesOrders, setSelectedSalesOrders] = useState([]);
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

        const savedPage = localStorage.getItem('salesOrdersListPage');
        const savedRowsPerPage = localStorage.getItem('salesOrdersListRowsPerPage');
        const savedFilterDate = localStorage.getItem('salesOrdersListFilterDate');

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

    const handleViewSalesOrder = useCallback(
        (salesOrder) => {
            const salesOrders = data.salesOrders;
            localStorage.setItem('salesOrdersListPage', page);
            localStorage.setItem('salesOrdersListRowsPerPage', rowsPerPage);
            localStorage.setItem('salesOrdersListFilterDate', filterDate ? filterDate.format('YYYY-MM-DD') : '');
            localStorage.setItem('salesOrder', JSON.stringify(salesOrder));
            localStorage.setItem('salesOrders', JSON.stringify(salesOrders));
            localStorage.setItem('filteredSalesOrders', JSON.stringify(filteredSalesOrders));
            localStorage.setItem('filterSalesOrders', JSON.stringify(filter));
            localStorage.setItem('backNavigation', 'sales_order_details');
            setFilterDate(filterDate);
            navigate('/integration/sales_order_details', { state: { salesOrder, salesOrders, filteredSalesOrders, filter } });
        },
        [page, rowsPerPage, filterDate, data.salesOrders, filter, navigate, setFilterDate]
    );

    const handleChangePage = useCallback(
        (_event, newPage) => {
            const maxPage = Math.max(0, Math.ceil(data.salesOrders.length / rowsPerPage) - 1);
            const bounded = Math.min(newPage, maxPage);
            setPage(bounded);
            localStorage.setItem('salesOrdersListPage', bounded);
        },
        [data.salesOrders.length, rowsPerPage]
    );

    const handleChangeRowsPerPage = useCallback((event) => {
        const rows = parseInt(event.target.value, 10);
        const next = [5, 10, 25].includes(rows) ? rows : 10;
        setRowsPerPage(next);
        setPage(0);
        localStorage.setItem('salesOrdersListRowsPerPage', next);
        localStorage.setItem('salesOrdersListPage', 0);
    }, []);

    const handleDeleteSalesOrder = useCallback(
        (salesOrder) => {
            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to delete this sales Order? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
            }).then((result) => {
                if (!result.isConfirmed) return;

                (async () => {
                    try {
                        const url = `${apiUrl}/api_zoho_salesOrders/delete_sales_order/${salesOrder.fields.salesOrder_id}/`;
                        const body = { username: localStorage.getItem('username') };
                        const response = await fetchWithToken(url, 'POST', body, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire('Success!', 'Sales Order has been deleted successfully.', 'success').then(() => {
                                onSyncComplete?.();
                            });
                        } else {
                            Swal.fire('Error!', `Error deleting sales Order: ${response.data.message}`, 'error');
                        }
                    } catch (err) {
                        Swal.fire('Error!', `Error deleting sales Order: ${err}`, 'error');
                    }
                })();
            });
        },
        [onSyncComplete]
    );

    const handleForceToSync = useCallback(() => {
        if (selectedSalesOrders.length === 0) {
            Swal.fire('Error!', 'Please select at least one sales Order to force sync.', 'error');
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to force sync selected sales Orders?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, force to sync!',
        }).then((result) => {
            if (!result.isConfirmed) return;
            (async () => {
                try {
                    const url = `${apiUrl}/api_quickbook_soap/force_to_sync_ajax/salesOrders/`;
                    const params = { salesOrders: selectedSalesOrders, username: localStorage.getItem('username') };
                    const response = await fetchWithToken(url, 'POST', params, {}, apiUrl);
                    if (response.data.status === 'success') {
                        Swal.fire('Success!', 'Selected sales Orders have been forced to sync.', 'success').then(() => {
                            setSelectedSalesOrders([]);
                            onSyncComplete?.();
                        });
                    } else {
                        Swal.fire('Error!', `Error syncing sales Orders: ${response.data.message}`, 'error');
                    }
                } catch (err) {
                    Swal.fire('Error!', `Error syncing sales Orders: ${err}`, 'error');
                }
            })();
        });
    }, [selectedSalesOrders, onSyncComplete]);

    const handleUnsync = useCallback(() => {
        if (selectedSalesOrders.length === 0) {
            Swal.fire('Error!', 'Please select at least one sales Order to unsync.', 'error');
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to unsync selected sales Orders?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, unsync!',
        }).then((result) => {
            if (!result.isConfirmed) return;
            (async () => {
                try {
                    const url = `${apiUrl}/api_quickbook_soap/unsync_ajax/salesOrders/`;
                    const params = { salesOrders: selectedSalesOrders, username: localStorage.getItem('username') };
                    const response = await fetchWithToken(url, 'POST', params, {}, apiUrl);
                    if (response.data.status === 'success') {
                        Swal.fire('Success!', 'Selected sales Orders have been unsynced.', 'success').then(() => {
                            setSelectedSalesOrders([]);
                            onSyncComplete?.();
                        });
                    } else {
                        Swal.fire('Error!', `Error unsyncing sales Orders: ${response.data.message}`, 'error');
                    }
                } catch (err) {
                    Swal.fire('Error!', `Error unsyncing sales Orders: ${err}`, 'error');
                }
            })();
        });
    }, [selectedSalesOrders, onSyncComplete]);

    const isSelected = (salesOrderId) => selectedSalesOrders.includes(salesOrderId);

    const handleCheckboxClick = (_event, salesOrderId) => {
        setSelectedSalesOrders((prev) =>
            prev.includes(salesOrderId) ? prev.filter((id) => id !== salesOrderId) : [...prev, salesOrderId]
        );
    };

    // --- Selección masiva (corregida para no meter undefined)
    const handleSelectAllSyncPage = (rpp, currentPage, type) => {
        const startIndex = currentPage * rpp;
        const endIndex = Math.min(startIndex + rpp, filteredSalesOrders.length);
        const ids = [];
        for (let i = startIndex; i < endIndex; i++) {
            const inv = filteredSalesOrders[i];
            if (type === 'force_sync' && !inv.fields.inserted_in_qb) ids.push(inv.fields.salesorder_id);
            if (type === 'unsync' && inv.fields.inserted_in_qb) ids.push(inv.fields.salesorder_id);
        }
        setSelectedSalesOrders(ids);
    };

    const handleSelectAllSyncAll = (type) => {
        const ids =
            type === 'force_sync'
                ? filteredSalesOrders.filter((inv) => !inv.fields.inserted_in_qb).map((inv) => inv.fields.salesorder_id)
                : filteredSalesOrders.filter((inv) => inv.fields.inserted_in_qb).map((inv) => inv.fields.salesorder_id);
        setSelectedSalesOrders(ids);
    };

    const handleSelectSyncChange = (event) => {
        const v = event.target.value;
        setSelectedOptionForceSync(v);
        setSelectedSalesOrders([]);
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
        setSelectedSalesOrders([]);
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
    const filterByDate = (salesOrder) => {
        if (!filterDate) return true;
        const invDate = dayjs(salesOrder.fields.date);
        return invDate.isValid() && invDate.isSame(filterDate, 'day');
    };

    const filterBySearchTerm = (salesOrder) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase().trim();
        const f = salesOrder.fields;
        return (
            (f.salesorder_number || '').toLowerCase().includes(q) ||
            (f.customer_name || '').toLowerCase().includes(q) ||
            (f.date || '').toLowerCase().includes(q) ||
            String(f.total || '').toLowerCase().includes(q)
        );
    };

    const clearFilters = () => {
        const t = dayjs();
        setFilterDate(t);
        localStorage.setItem('salesOrdersListFilterDate', t.format('YYYY-MM-DD'));
        setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.delete('date');
        window.history.replaceState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
    };

    const getRowBg = (salesOrder, isMouseOver) => {
        // Unificamos hover a #f6f6fa
        return !isMouseOver ? '#FFFFFF' : '#F6F6FA';
    };

    const renderSyncStatus = (salesOrder) => {
        const hasErrors = salesOrder.fields.customer_unmatched.length > 0 || salesOrder.fields.items_unmatched.length > 0;
        if (hasErrors)
            return (
                <Tooltip title="ERROR" arrow sx={{ '& .MuiTooltip-tooltip': { backgroundColor: '#000', color: '#fff' } }}>
                    <ErrorIcon sx={{ color: 'error.main' }} />
                </Tooltip>
            );
        if (!salesOrder.fields.inserted_in_qb)
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

    const renderMatchStatus = (salesOrder) => {
        const matched = salesOrder.fields.all_items_matched && salesOrder.fields.all_customer_matched;
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

    const renderForceSyncCheckbox = (salesOrder, isSel) => {
        const hasErrors = salesOrder.fields.customer_unmatched.length > 0 || salesOrder.fields.items_unmatched.length > 0;
        if (!(salesOrder.fields.inserted_in_qb && !hasErrors)) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSel}
                                value={salesOrder.fields.salesorder_id}
                                onChange={(e) => handleCheckboxClick(e, salesOrder.fields.salesorder_id)}
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

    const renderUnsyncCheckbox = (salesOrder, isSel) => {
        if (salesOrder.fields.inserted_in_qb) {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSel}
                                value={salesOrder.fields.salesorder_id}
                                onChange={(e) => handleCheckboxClick(e, salesOrder.fields.salesorder_id)}
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
                localStorage.setItem('salesOrdersListFilterDate', date.format('YYYY-MM-DD'));
            } else {
                setFilterDate(null);
                localStorage.setItem('salesOrdersListFilterDate', '');
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
    const filteredSalesOrders = useMemo(() => {
        return data.salesOrders.filter((salesOrder) => {
            const matchesSearchTerm = filterBySearchTerm(salesOrder) && filterByDate(salesOrder);
            const notProcessed =
                !salesOrder.fields.inserted_in_qb &&
                !(salesOrder.fields.customer_unmatched.length > 0) &&
                !(salesOrder.fields.items_unmatched.length > 0);
            const notSynced = salesOrder.fields.customer_unmatched.length > 0 || salesOrder.fields.items_unmatched.length > 0;
            const synced = salesOrder.fields.inserted_in_qb;
            const forcedSync = salesOrder.fields.force_to_sync;
            const matched = salesOrder.fields.all_items_matched && salesOrder.fields.all_customer_matched;

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
    }, [data.salesOrders, filter, searchTerm, filterDate]);

    const sortedSalesOrders = useMemo(
        () => stableSort(filteredSalesOrders, getComparatorUndefined(order, orderBy)),
        [filteredSalesOrders, order, orderBy]
    );

    const columns = [
        { id: 'salesorder_number', label: 'SO#', colspan: 1, textAlign: 'left' },
        { id: 'customer_name', label: 'Customer', colspan: 1, textAlign: 'left' },
        { id: 'date', label: 'Date', colspan: 1, textAlign: 'left' },
        { id: 'total', label: 'Total', colspan: 1, textAlign: 'left' },
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
            visibility: selectedSalesOrders.length > 0,
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
            { value: 'all', label: 'All Sales Orders' },
            { value: 'synced', label: 'Synced Sales Orders' },
            { value: 'not_synced', label: 'Not Synced Sales Orders' },
            { value: 'not_processed', label: 'Not Processed Sales Orders' },
            { value: 'forced_sync', label: 'Forced to Sync Sales Orders' },
            { value: 'not_forced_sync', label: 'Not Forced to Sync Sales Orders' },
            { value: 'matched', label: 'Matched Sales Orders' },
            { value: 'not_matched', label: 'Not Matched Sales Orders' },
        ],
        hasSearch: false,
    };

    return (
        <Box sx={{ width: '100%', px: 0, py: 1 }}>
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
                <Table stickyHeader aria-label="sales orders table" size="small">
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
                                            {column.id === 'unsync' && selectedSalesOrders.length > 0 && (
                                                <MenuItem value="unsync_salesOrders" onClick={handleUnsync}>
                                                    <UndoRounded sx={{ mr: 1 }} /> <b>Unsync Selected Sales Orders</b>
                                                </MenuItem>
                                            )}
                                        </Select>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredSalesOrders.length === 0 ? (
                            <EmptyRecordsCell columns={columns} isColspanTable />
                        ) : (
                            (rowsPerPage > 0
                                ? sortedSalesOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : sortedSalesOrders
                            ).map((salesOrder, index) => {
                                const isItemSelected = isSelected(salesOrder.fields.salesorder_id);
                                const bg = index === hoveredRowIndex ? getRowBg(salesOrder, true) : getRowBg(salesOrder, false);
                                return (
                                    <TableRow
                                        key={salesOrder.fields.salesorder_id || index}
                                        hover
                                        sx={{ cursor: 'pointer', backgroundColor: bg, transition: 'background-color 0.2s ease' }}
                                        onMouseEnter={() => setHoveredRowIndex(index)}
                                        onMouseLeave={() => setHoveredRowIndex(null)}
                                    >
                                        <TableCell onClick={() => handleViewSalesOrder(salesOrder)}>{salesOrder.fields.salesorder_number}</TableCell>
                                        <TableCell onClick={() => handleViewSalesOrder(salesOrder)}>{salesOrder.fields.customer_name}</TableCell>
                                        <TableCell onClick={() => handleViewSalesOrder(salesOrder)}>{salesOrder.fields.date}</TableCell>
                                        <TableCell onClick={() => handleViewSalesOrder(salesOrder)}>${salesOrder.fields.total}</TableCell>

                                        <TableCell align="center" onClick={() => handleViewSalesOrder(salesOrder)}>
                                            {renderSyncStatus(salesOrder)}
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                            sx={(theme) => ({
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #ccc',
                                                width: 20,
                                                maxWidth: 20,
                                                color:
                                                    salesOrder.fields.all_items_matched && salesOrder.fields.all_customer_matched
                                                        ? theme.palette.success.main
                                                        : theme.palette.error.main,
                                            })}
                                            onClick={() => handleViewSalesOrder(salesOrder)}
                                        >
                                            {renderMatchStatus(salesOrder)}
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                            onClick={() => (salesOrder.fields.force_to_sync || salesOrder.fields.inserted_in_qb) && handleViewSalesOrder(salesOrder)}
                                        >
                                            {!salesOrder.fields.force_to_sync ? (
                                                renderForceSyncCheckbox(salesOrder, isItemSelected)
                                            ) : (
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                    <SyncIcon color="warning" />
                                                    <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700 }}>
                                                        Forced to sync
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>

                                        <TableCell align="center" onClick={() => !salesOrder.fields.inserted_in_qb && handleViewSalesOrder(salesOrder)}>
                                            {renderUnsyncCheckbox(salesOrder, isItemSelected)}
                                        </TableCell>

                                        <TableCell align="center">
                                            <IconButton onClick={() => handleDeleteSalesOrder(salesOrder)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}

                        <TableCustomPagination
                            columnsLength={columns.length + 1}
                            data={filteredSalesOrders}
                            page={
                                Number.isFinite(page) && page >= 0
                                    ? Math.min(page, Math.max(0, Math.ceil(filteredSalesOrders.length / rowsPerPage) - 1))
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

export default SalesOrdersList;
