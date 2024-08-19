import React, { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    FormControl,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Swal from 'sweetalert2';
import { stableSort, getComparator, fetchWithToken } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import NavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);

const QbwcNeverMatchedCustomersList = ({ customers, onSyncComplete }) => {

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
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

    // const handleSearchChange = (event) => {
    //     setSearchTerm(event.target.value);
    //     setPage(0);
    // };


    const isSelected = (customerId) => selectedCustomers.indexOf(customerId) !== -1;

    const handleCheckboxClick = (event, customerId) => {
        const selectedIndex = selectedCustomers.indexOf(customerId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedCustomers, customerId];
        } else {
            newSelected = selectedCustomers.filter((id) => id !== customerId);
        }
        setSelectedCustomers(newSelected);
    };

    const renderForceSyncCheckbox = (customer, isSelected) => {
        return (
            <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel sx={{ color: 'success.main' }}
                    control={
                        <Checkbox sx={{ color: 'success.main' }}
                            checked={isSelected}
                            onChange={(e) => handleCheckboxClick(e, customer.fields.list_id)}
                        />
                    }
                    label="Undo never match?"
                />
            </FormControl>
        );
    };

    const handleNeverMatchCustomers = () => {
        if (selectedCustomers.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select at least one customer.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to recover selected customers?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, never match them!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const url = `${apiUrl}/api_quickbook_soap/never_match_customers_ajax/`
                    const body = {
                        customers: selectedCustomers,
                        to_match: true,
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
                            'Selected customers have been marked as never match.',
                            'success'
                        ).then(() => {
                            setSelectedCustomers([]);
                            onSyncComplete();
                        });
                    }
                } catch (error) {
                    Swal.fire(
                        'Error!',
                        'There was an error marking customers as never match.',
                        'error'
                    );
                }
            }
        });
    };

    const filteredCustomers = customers.filter(customer =>
        customer.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fields.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fields.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fields.list_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCustomers = stableSort(filteredCustomers, getComparator(order, orderBy));

    const columns = [
        { id: 'qb_customer', label: 'QB Customer', colspan: 1, textAlign: 'left' },
        { id: 'qb_email', label: 'QB Email', colspan: 1, textAlign: 'left' },
        { id: 'qb_phone', label: 'QB Phone', colspan: 1, textAlign: 'left' },
        { id: 'qb_list_id', label: 'QB List ID', colspan: 1, textAlign: 'left' },
        { id: 'actions', label: 'Actions', colspan: 1, textAlign: 'center' }
    ];

    const childrenNavigationRightButton = [
        {
            label: 'Undo Never Match',
            icon: <UndoIcon sx={{ marginRight: 1 }} />,
            onClick: handleNeverMatchCustomers,
            visibility: selectedCustomers.length > 0
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
                <Grid item xs={6}>
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                            textTransform: 'uppercase',
                            color: '#212529',
                            fontWeight: 'bold',
                            marginLeft: '1%',
                        }}
                    >
                        QB Never Matched Customers List
                    </Typography>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <NavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            There are {filteredCustomers.length} never matched customers found.
                        </Alert>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: '-1%' }}>
                    <TableContainer style={{ maxHeight: '760px', minWidth: 690 }}>
                        <Table id="myTable" aria-label="customers table" stickyHeader>
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
                                {filteredCustomers.length === 0 ? (
                                    <EmptyRecordsCell columns={columns} />
                                ) : (
                                    (rowsPerPage > 0
                                        ? sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        : sortedCustomers
                                    ).map((customer, index) => (
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
                                            <TableCell>{customer.fields.name}</TableCell>
                                            <TableCell>{customer.fields.email}</TableCell>
                                            <TableCell>{customer.fields.phone}</TableCell>
                                            <TableCell>{customer.fields.list_id}</TableCell>
                                            <TableCell align="center">
                                                {renderForceSyncCheckbox(customer, isSelected(customer.fields.list_id))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                <TableCustomPagination
                                    columnsLength={columns.length}
                                    data={filteredCustomers}
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

export default QbwcNeverMatchedCustomersList;
