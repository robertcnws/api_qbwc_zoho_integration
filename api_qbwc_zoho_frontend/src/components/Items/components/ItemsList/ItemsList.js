import React, { useState } from 'react';
import { Grid, Typography, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom'; 

const ItemsList = ({ items }) => {
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

    const filteredItems = items.filter(item =>
        item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fields.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewItem = (item) => {
        navigate('/integration/item_details', { state: { item } })
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
                Items List
            </Typography>
            </Grid>
            <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                <Grid item>
                    <Button variant="contained" color="primary" size="small" href="{% url 'api_quickbook_soap:matching_items' %}">
                        Similar Items
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="success" size="small" href="{% url 'api_quickbook_soap:matched_items' %}">
                        Matched Items
                    </Button>
                </Grid>
            </Grid>
            <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                <Grid item xs={8}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        There are {filteredItems.length} items found.
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
                    <Table id="myTable" aria-label="items table" sx={{ minWidth: 650 }}>
                        <TableHead sx={{ backgroundColor: '#e0e0e0' }}> 
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Rate</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>SKU</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Matched</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '1px solid #ccc' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(rowsPerPage > 0
                                ? filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : filteredItems
                            ).map((item, index) => (
                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{item.fields.name}</TableCell>
                                    <TableCell>{item.fields.status}</TableCell>
                                    <TableCell>{item.fields.rate}</TableCell>
                                    <TableCell>{item.fields.sku}</TableCell>
                                    <TableCell style={{ width: '100px' }}>
                                        <Alert severity={!item.fields.qb_list_id || item.fields.qb_list_id === "" ? "error" : "success"} 
                                                style={{ 
                                                    fontSize: '0.80rem',  
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px',
                                                    maxHeight: '30px'
                                                }}>
                                            <b>{!item.fields.qb_list_id || item.fields.qb_list_id === "" ? "NO" : "YES"}</b>
                                        </Alert>
                                    </TableCell>
                                    <TableCell className="text-center align-middle">
                                        <Button 
                                            onClick={() => handleViewItem(item)} 
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
                    count={filteredItems.length}
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

export default ItemsList;
