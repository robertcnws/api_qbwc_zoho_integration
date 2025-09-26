import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { stableSort, getComparatorUndefined } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import HomeNavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);
const TABLE_MIN_HEIGHT = 520;
const TABLE_MAX_HEIGHT = 'calc(100vh - 260px)';

const CustomersList = ({ customers }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        const savedPage = localStorage.getItem('customerListPage');
        const savedRowsPerPage = localStorage.getItem('customerListRowsPerPage');
        window.addEventListener('storage', handleStorageChange);
        if (savedPage !== null) {
            setPage(Number(savedPage));
        }
        if (savedRowsPerPage !== null) {
            setRowsPerPage(Number(savedRowsPerPage));
        }
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [searchTerm]);


    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        localStorage.setItem('customerListPage', newPage);
    };

    const handleChangeRowsPerPage = event => {
        const rows = parseInt(event.target.value, 10);
        setRowsPerPage(rows);
        localStorage.setItem('customerListRowsPerPage', rows);
        setPage(0);
    };

    // const handleSearchChange = event => {
    //     setSearchTerm(event.target.value);
    //     setPage(0);
    // };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearchTerm = customer.fields.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.fields.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.fields.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.fields.phone.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearchTerm;
        if (filter === 'matched') return matchesSearchTerm && customer.fields.qb_list_id && customer.fields.qb_list_id !== "";
        if (filter === 'unmatched') return matchesSearchTerm && (!customer.fields.qb_list_id || customer.fields.qb_list_id === "");

        return matchesSearchTerm;
    });

    const handleViewCustomer = (customer) => {
        localStorage.setItem('customerListPage', page);
        localStorage.setItem('customerListRowsPerPage', rowsPerPage);
        localStorage.setItem('backNavigation', 'list_customers')
        navigate('/integration/customer_details', { state: { customer, customers, filteredCustomers, filter, page } })
    }

    const handleSortChange = (columnId) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    };

    const handleFilterChange = event => {
        setFilter(event.target.value);
        setPage(0);
    };

    const sortedCustomers = stableSort(filteredCustomers, getComparatorUndefined(order, orderBy));

    const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' },
        { id: 'phone', label: 'Phone' },
        { id: 'company_name', label: 'Company Name' },
        { id: 'status', label: 'Status' },
        // { id: 'actions', label: 'Actions' }
    ];

    const childrenNavigationRightButton = [
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
            { value: 'all', label: 'All Customers' },
            { value: 'matched', label: 'Matched Customers' },
            { value: 'unmatched', label: 'Unmatched Customers' }
        ],
        hasSearch: false
    };

    return (
        <Box
            sx={{
                width: '100%',
                px: 0,
                py: 1,
                bgcolor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            {/* Header: filtro (izq) + acción (der) */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box sx={{ maxWidth: 380 }}>
                    <CustomFilter configCustomFilter={configCustomFilter} />
                </Box>

                <Box sx={{
                    display: 'flex',
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                    mr: 1
                }}>
                    <HomeNavigationRightButton children={childrenNavigationRightButton} />
                </Box>
            </Box>

            {/* Tabla */}
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                }}
            >
                <TableContainer
                    sx={{
                        maxHeight: TABLE_MAX_HEIGHT,
                        minHeight: TABLE_MIN_HEIGHT,
                    }}
                >
                    <Table stickyHeader aria-label="customers table" id="myTable">
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        sx={{
                                            fontWeight: 700,
                                            color: 'text.secondary',
                                            borderBottom: '1px solid',
                                            borderTop: '1px solid',
                                            borderColor: 'divider',
                                            backgroundColor: '#F9F9FB',
                                            py: 0.75,
                                        }}
                                    >
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
                                ).map((customer, index) => {
                                    const f = customer.fields || {};
                                    const matched = !!(f.qb_list_id && f.qb_list_id !== '');
                                    return (
                                        <TableRow
                                            key={`${f.contact_name || 'row'}-${index}`}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s ease',
                                                backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : 'background.paper',
                                                '&:last-child td, &:last-child th': { border: 0 },
                                            }}
                                            onMouseEnter={() => setHoveredRowIndex(index)}
                                            onMouseLeave={() => setHoveredRowIndex(null)}
                                            onClick={() => handleViewCustomer(customer)}
                                        >
                                            <TableCell>{f.contact_name}</TableCell>
                                            <TableCell>{f.email}</TableCell>
                                            <TableCell>{f.phone}</TableCell>
                                            <TableCell>{f.company_name}</TableCell>
                                            <TableCell
                                                sx={(theme) => ({
                                                    color: matched ? theme.palette.success.main : theme.palette.error.main,
                                                    fontWeight: 700,
                                                    borderBottom: '1px solid',
                                                    borderColor: 'divider',
                                                    width: 64,
                                                    maxWidth: 64,
                                                })}
                                            >
                                                {matched ? (
                                                    <Tooltip
                                                        title="MATCHED"
                                                        arrow
                                                        sx={{
                                                            '& .MuiTooltip-tooltip': {
                                                                backgroundColor: '#000',
                                                                color: '#fff',
                                                                fontSize: '0.875rem',
                                                            },
                                                        }}
                                                    >
                                                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip
                                                        title="NOT MATCHED"
                                                        arrow
                                                        sx={{
                                                            '& .MuiTooltip-tooltip': {
                                                                backgroundColor: '#000',
                                                                color: '#fff',
                                                                fontSize: '0.875rem',
                                                            },
                                                        }}
                                                    >
                                                        <ErrorIcon sx={{ color: 'error.main', fontSize: 22 }} />
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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
            </Box>
        </Box>
    );
};

export default CustomersList;
