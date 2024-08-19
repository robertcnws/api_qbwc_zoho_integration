import React, { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    FormControl,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Swal from 'sweetalert2';
import { stableSort, getComparator, fetchWithToken } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import NavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);

const QbwcItemsList = ({ items, onSyncComplete }) => {

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [selectedItems, setSelectedItems] = useState([]);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);

    useEffect(() => {
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [searchTerm]);

    const handleFilterChange = event => {
        setFilter(event.target.value);
        setPage(0);
    };

    const handleSortChange = (columnId) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    //   const handleSearchChange = (event) => {
    //       setSearchTerm(event.target.value);
    //       setPage(0);
    //   };

    const isSelected = (itemId) => selectedItems.indexOf(itemId) !== -1;

    const handleCheckboxClick = (event, itemId) => {
        const selectedIndex = selectedItems.indexOf(itemId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedItems, itemId];
        } else {
            newSelected = selectedItems.filter((id) => id !== itemId);
        }
        setSelectedItems(newSelected);
    };

    const configCustomFilter = {
        filter: filter,
        handleFilterChange: handleFilterChange,
        listValues: [
            { value: 'all', label: 'All Items' },
            { value: 'matched', label: 'Matched Items' },
            { value: 'not_matched', label: 'Unmatched Items' }
        ],
        hasSearch: false
    }

    const renderForceSyncCheckbox = (item, isSelected) => {
        if (filter !== 'matched') {
            return (
                <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel sx={{ color: 'warning.main' }}
                        control={
                            <Checkbox sx={{ color: 'warning.main' }}
                                checked={isSelected}
                                onChange={(e) => handleCheckboxClick(e, item.fields.list_id)}
                            />
                        }
                        label="Never match?"
                    />
                </FormControl>
            );
        }
        else {
            return (
                <Typography sx={{ color: 'success.main' }}>
                    Matched
                </Typography>
            )
        }
    };

    const handleNeverMatchItems = () => {
        if (selectedItems.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select at least one item.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to never match selected items?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, never match them!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const url = `${apiUrl}/api_quickbook_soap/never_match_items_ajax/`
                    const body = {
                        items: selectedItems,
                        username: localStorage.getItem('username')
                    };
                    const response = await fetchWithToken(url, 'POST', body, {}, apiUrl);
                    if (response.data.message === 'error') {
                        Swal.fire(
                            'Error!',
                            response.data.error,
                            'error'
                        );
                        return;
                    }
                    else if (response.data.message === 'success') {
                        Swal.fire(
                            'Success!',
                            'Selected items have been marked as never match.',
                            'success'
                        ).then(() => {
                            setSelectedItems([]);
                            onSyncComplete();
                        });
                    }
                } catch (error) {
                    Swal.fire(
                        'Error!',
                        'There was an error marking items as never match.',
                        'error'
                    );
                }
            }
        });
    };

    const filteredItems = items.filter(item => {
        const search = item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.fields.list_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.fields.item_type.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'all') return search;
        if (filter === 'matched') return search && item.fields.matched;
        if (filter === 'not_matched') return search && !item.fields.matched;
        return false;
    });

    const sortedItems = stableSort(filteredItems, getComparator(order, orderBy));

    const columns = [
        { id: 'qb_item', label: 'QB Item', colspan: 1, textAlign: 'left' },
        { id: 'qb_list_id', label: 'QB List ID', colspan: 1, textAlign: 'left' },
        { id: 'qb_item_type', label: 'QB Item Type', colspan: 1, textAlign: 'left' },
        { id: 'actions', label: 'Actions', colspan: 1, textAlign: 'center' }
    ];

    const childrenNavigationRightButton = [
        {
            label: 'Never Match Selected',
            icon: <DoNotDisturbIcon sx={{ marginRight: 1 }} />,
            onClick: handleNeverMatchItems,
            visibility: filter !== 'matched' && selectedItems.length > 0
        },
        {
            label: 'Back to QBWC',
            icon: <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />,
            route: '/integration/qbwc',
            visibility: true
        }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-29.4%',
                minWidth: '88.3vw',
            }}
        >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3} sx={{ mt: '-3%' }}>
                <Grid item container xs={5} justifyContent="flex-start">
                    <Grid item xs={4}>
                        <CustomFilter configCustomFilter={configCustomFilter} />
                    </Grid>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <NavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    {/* <Grid item xs={8}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        There are {filteredItems.length} items found.
                    </Alert>
                </Grid> */}

                </Grid>
                <Grid item xs={12} sx={{ mt: '-1%' }}>
                    <TableContainer style={{ maxHeight: '755px', minWidth: 690 }}>
                        <Table id="myTable" aria-label="items table" stickyHeader>
                            <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell key={column.id} colSpan={column.colspan}
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#6c7184',
                                                borderBottom: '1px solid #ddd',
                                                borderTop: '1px solid #ddd',
                                                backgroundColor: '#f9f9fb',
                                                padding: '5px 16px',
                                                textAlign: column.textAlign
                                            }}>
                                            <TableSortLabel
                                                active={orderBy === column.id}
                                                direction={orderBy === column.id ? order : 'asc'}
                                                onClick={() => handleSortChange(column.id)}
                                            >
                                                {column.label.toUpperCase()}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <EmptyRecordsCell columns={columns} />
                                ) : (
                                    (rowsPerPage > 0
                                        ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        : sortedItems
                                    ).map((item, index) => (
                                        <TableRow key={index}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s ease',
                                                backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF'
                                            }}
                                            onMouseEnter={() => setHoveredRowIndex(index)}
                                            onMouseLeave={() => setHoveredRowIndex(null)}
                                        >
                                            <TableCell>{item.fields.name}</TableCell>
                                            <TableCell>{item.fields.list_id}</TableCell>
                                            <TableCell>
                                                {
                                                    item.fields.item_type && typeof item.fields.item_type === 'string'
                                                        ? item.fields.item_type.substring(4)
                                                        : ''
                                                }
                                            </TableCell>
                                            <TableCell align="center">
                                                {renderForceSyncCheckbox(item, isSelected(item.fields.list_id))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                <TableCustomPagination
                                    columnsLength={columns.length}
                                    data={filteredItems}
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
        </Container>
    );

}

export default QbwcItemsList;
