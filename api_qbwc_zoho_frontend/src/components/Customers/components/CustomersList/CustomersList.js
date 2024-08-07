import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Grid, 
    Typography, 
    Alert, 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TableSortLabel,
    Paper, 
    TablePagination, 
    TextField, 
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HomeIcon from '@mui/icons-material/Home';
import { Link, useNavigate } from 'react-router-dom'; 
import { stableSort, getComparatorUndefined } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';
import HomeNavigationRightButton  from '../../../Utils/components/NavigationRightButton/NavigationRightButton';

const CustomersList = ({ customers }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedPage = localStorage.getItem('customerListPage');
        const savedRowsPerPage = localStorage.getItem('customerListRowsPerPage');
    
        if (savedPage !== null) {
          setPage(Number(savedPage));
        }
    
        if (savedRowsPerPage !== null) {
          setRowsPerPage(Number(savedRowsPerPage));
        }
      }, []);


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

    const handleSearchChange = event => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

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
        { id: 'matched', label: 'Matched' },
        // { id: 'actions', label: 'Actions' }
    ];

    const childrenNavigationRightButton = [
        { 
            label: 'Back to Integration', 
            icon: <HomeIcon sx={{ marginRight: 1 }}/>, 
            route: '/integration',
            visibility: true 
        }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-9%',
                marginTop: '-6%',
                transition: 'margin-left 0.3s ease',
                // minHeight: '100vh',
                minWidth: '87vw',
                padding: 1,
            }}
            >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
            <Grid item container xs={6} justifyContent="flex-start">
                <Grid item xs={4}>
                    <FormControl size="small">
                        <InputLabel>{filteredCustomers.length}</InputLabel>
                        <Select
                            value={filter}
                            onChange={handleFilterChange}
                            label="Filter"
                            sx={{
                                fontSize: '22px',
                                border: 'none',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                                '& .MuiSelect-select': {
                                  padding: '10px',
                                },
                                '& .MuiInputLabel-root': {
                                  top: '-6px',
                                },
                                color: '#212529',
                              }}
                        >
                            <MenuItem value="all">All Customers</MenuItem>
                            <MenuItem value="matched">Matched Customers</MenuItem>
                            <MenuItem value="unmatched">Unmatched Customers</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={4}>
                        <TextField
                            label="Search"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            sx={{ width: '100%', mb: 2 }}
                        />
                    </Grid>
                    <HomeNavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    {/* <Grid item xs={8}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            There are {filteredCustomers.length} customers found.
                        </Alert>
                    </Grid> */}
                </Grid>
                <Grid item xs={12}>
                    <TableContainer component={Paper} style={{ maxHeight: '605px' }}>
                        <Table id="myTable" aria-label="customers table" sx={{ minWidth: 650 }} stickyHeader>
                            <TableHead sx={{ backgroundColor: '#F9F9FB' }}> 
                                <TableRow>
                                {columns.map((column) => (
                                        <TableCell key={column.id} 
                                        sx={{ 
                                            fontWeight: 'bold', 
                                            color: '#6C7184', 
                                            borderBottom: '1px solid #ddd', 
                                            borderTop: '1px solid #ddd',
                                            backgroundColor: '#F9F9FB' }}
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
                                        ).map((customer, index) => (
                                            <TableRow key={index} 
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                style = {{ 
                                                    cursor: 'pointer', 
                                                    transition: 'background-color 0.3s ease',  
                                                    backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF'
                                                }}
                                                onMouseEnter={() => setHoveredRowIndex(index)}
                                                onMouseLeave={() => setHoveredRowIndex(null)}
                                                onClick={() => handleViewCustomer(customer)}
                                            >
                                                <TableCell>{customer.fields.contact_name}</TableCell>
                                                <TableCell>{customer.fields.email}</TableCell>
                                                <TableCell>{customer.fields.phone}</TableCell>
                                                <TableCell>{customer.fields.company_name}</TableCell>
                                                <TableCell sx={(theme) => ({
                                                            color: !customer.fields.qb_list_id || customer.fields.qb_list_id === "" ? theme.palette.error.main : theme.palette.success.main,
                                                            fontWeight: 'bold',
                                                            borderBottom: '1px solid #ccc',
                                                            width: '20px', 
                                                            maxWidth: '20px'
                                                        })}>
                                                        <b>{!customer.fields.qb_list_id || customer.fields.qb_list_id === "" ? 
                                                            'NO' : 'YES'
                                                        }</b>
                                                </TableCell>
                                                {/* <TableCell className="text-center align-middle">
                                                        <IconButton onClick={() => handleViewCustomer(customer)} color="info" aria-label="view" size='large'>
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                </TableCell> */}
                                            </TableRow>
                                        ))
                                    )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredCustomers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{ mt: 2 }}
                    />
                </Grid>
            </Grid>
        </Container>
    );
};

export default CustomersList;
