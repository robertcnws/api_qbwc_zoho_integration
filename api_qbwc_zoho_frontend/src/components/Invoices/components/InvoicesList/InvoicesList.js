import React, { useState } from 'react';
import { Grid, Typography, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom'; 

const InvoicesList = ({ invoices }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = event => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const filteredInvoices = invoices.filter(customer =>
        customer.fields.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fields.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fields.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fields.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewCustomer = (customer) => {
        navigate('/integration/customer_details', { state: { customer } })
    };

    return (
        <Grid container spacing={2} alignItems="center" sx={{ marginLeft: '-3%', marginTop: '-5%'}}>
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
                Invoices List
            </Typography>
            </Grid>
            <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                <Grid item>
                    <Button variant="contained" color="primary" size="small" href="{% url 'api_quickbook_soap:matching_invoices' %}">
                        Similar Invoices
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="success" size="small" href="{% url 'api_quickbook_soap:matched_invoices' %}">
                        Matched Invoices
                    </Button>
                </Grid>
            </Grid>
            <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                <Grid item xs={8}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        There are {filteredInvoices.length} invoices found.
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
                    <Table id="myTable" aria-label="invoices table" sx={{ minWidth: 650 }}>
                        <TableHead sx={{ backgroundColor: '#e0e0e0' }}> 
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Company Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Matched</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(rowsPerPage > 0
                                ? filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : filteredInvoices
                            ).map((customer, index) => (
                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{customer.fields.contact_name}</TableCell>
                                    <TableCell>{customer.fields.email}</TableCell>
                                    <TableCell>{customer.fields.phone}</TableCell>
                                    <TableCell>{customer.fields.company_name}</TableCell>
                                    <TableCell style={{ width: '100px' }}>
                                        <Alert severity={!customer.fields.qb_list_id || customer.fields.qb_list_id === "" ? "error" : "success"} 
                                                style={{ 
                                                    fontSize: '0.80rem',  
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px',
                                                    maxHeight: '30px'
                                                }}>
                                            <b>{!customer.fields.qb_list_id || customer.fields.qb_list_id === "" ? "NO" : "YES"}</b>
                                        </Alert>
                                    </TableCell>
                                    <TableCell className="text-center align-middle">
                                        <Button 
                                            onClick={() => handleViewCustomer(customer)} 
                                            variant="contained" 
                                            color="info" 
                                            size="small">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredInvoices.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ mt: 2 }}
                />
            </Grid>
        </Grid>
    );
};

export default InvoicesList;
