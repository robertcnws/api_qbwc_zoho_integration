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
    MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom'; 
import { stableSort, getComparatorUndefined } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';

const CustomersList = ({ customers }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
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
        { id: 'actions', label: 'Actions' }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-3%',
                marginTop: '-5%',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
                minWidth: '82vw',
                padding: 1,
            }}
            >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
                <Grid item xs={6}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        textTransform: 'uppercase',
                        color: 'info.main',
                        fontWeight: 'bold',
                    }}
                >
                    Customers List
                </Typography>
                <FormControl variant="outlined" size="small">
                    <InputLabel>Filter</InputLabel>
                    <Select
                        value={filter}
                        onChange={handleFilterChange}
                        label="Filter"
                    >
                        <MenuItem value="all">All Customers</MenuItem>
                        <MenuItem value="matched">Matched Customers</MenuItem>
                        <MenuItem value="unmatched">Unmatched Customers</MenuItem>
                    </Select>
                </FormControl>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Button variant="contained" color="success" size="small" component={Link}  to="/integration">
                            Back to Integration
                        </Button>
                    </Grid>
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={8}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            There are {filteredCustomers.length} customers found.
                        </Alert>
                    </Grid>
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
                </Grid>
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table id="myTable" aria-label="customers table" sx={{ minWidth: 650 }}>
                            <TableHead sx={{ backgroundColor: '#e0e0e0' }}> 
                                <TableRow>
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
                                {filteredCustomers.length === 0 ? (
                                    <EmptyRecordsCell columns={columns} />
                                ) : (
                                        (rowsPerPage > 0
                                            ? sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            : sortedCustomers
                                        ).map((customer, index) => (
                                            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell>{customer.fields.contact_name}</TableCell>
                                                <TableCell>{customer.fields.email}</TableCell>
                                                <TableCell>{customer.fields.phone}</TableCell>
                                                <TableCell>{customer.fields.company_name}</TableCell>
                                                <TableCell sx={(theme) => ({
                                                            color: !customer.fields.qb_list_id || customer.fields.qb_list_id === "" ? theme.palette.error.main : theme.palette.success.main,
                                                            fontWeight: 'bold',
                                                            borderBottom: '1px solid #ccc',
                                                            width: '50px', 
                                                            maxWidth: '50px'
                                                        })}>
                                                        <b>{!customer.fields.qb_list_id || customer.fields.qb_list_id === "" ? 
                                                            <SmallAlert severity='error' message='NO'/> : <SmallAlert severity='success' message='YES'/>
                                                        }</b>
                                                </TableCell>
                                                <TableCell className="text-center align-middle">
                                                    <Button 
                                                        onClick={() => handleViewCustomer(customer)} 
                                                        variant="contained" 
                                                        color="info" 
                                                        size="small">View</Button>
                                                </TableCell>
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
