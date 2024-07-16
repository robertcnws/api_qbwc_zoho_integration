import React, { useState } from 'react';
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
  Paper, 
  TablePagination, 
  TextField, 
  TableSortLabel,
  FormControl,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { stableSort, getComparator } from '../../../../utils';

const QbwcCustomersList = ({ customers }) => {

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const navigate = useNavigate();

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

  const handleSearchChange = (event) => {
      setSearchTerm(event.target.value);
      setPage(0);
  };

  const handleNeverMatch = (customer) => {
      navigate('/integration/customer_details', { state: { customer } });
  };

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
            <FormControl sx={{ display: 'flex', alignCustomers: 'center', gap: 1 }}>
                <FormControlLabel sx={{ color: 'warning.main' }}
                    control={
                        <Checkbox sx={{ color: 'warning.main' }}
                            checked={isSelected}
                            onChange={(e) => handleCheckboxClick(e, customer.fields.list_id)}
                        />
                    }
                    label="Never match?"
                />
            </FormControl>
        );
  };


  const filteredCustomers = customers.filter(customer =>
      customer.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.fields.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = stableSort(filteredCustomers, getComparator(order, orderBy));

  const columns = [
      { id: 'qb_customer', label: 'QB Customer' },
      { id: 'qb_email', label: 'QB Email' },
      { id: 'qb_phone', label: 'QB Phone' },
      { id: 'qb_list_id', label: 'QB List ID' },
      { id: 'actions', label: 'Actions' }
  ];

  return (
    <Container maxWidth="lg" sx={{ marginLeft: '-3%', marginTop: '-5%', transition: 'margin-left 0.3s ease', minWidth:'97%' }}>
        <Grid container spacing={2} alignCustomers="center" justifyContent="space-between" mb={3}>
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
                    QB Customers List
                </Typography>
            </Grid>
            <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                <Grid item>
                    <Button variant="contained" color="success" size="small" component={Link} to="/integration/qbwc">
                        Back to QBWC
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="primary" size="small">
                        Never match selected
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
                            {(rowsPerPage > 0
                                ? sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : sortedCustomers
                            ).map((customer, index) => (
                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{customer.fields.name}</TableCell>
                                    <TableCell>{customer.fields.email}</TableCell>
                                    <TableCell>{customer.fields.phone}</TableCell>
                                    <TableCell>{customer.fields.list_id}</TableCell>
                                    <TableCell align="center">
                                        {renderForceSyncCheckbox(customer, isSelected(customer.fields.list_id))}
                                    </TableCell>
                                </TableRow>
                            ))}
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

}

export default QbwcCustomersList;
