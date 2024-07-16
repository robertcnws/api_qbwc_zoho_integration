import React, { useState } from 'react';
import { Container, Grid, Typography, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TextField, TableSortLabel } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { stableSort, getComparator } from '../../../../utils';

const ItemsList = ({ items }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
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

    const handleViewItem = (item) => {
        navigate('/integration/item_details', { state: { item } });
    };

    const filteredItems = items.filter(item =>
        item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fields.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedItems = stableSort(filteredItems, getComparator(order, orderBy));

    const columns = [
        { id: 'name', label: 'Name' },
        { id: 'status', label: 'Status' },
        { id: 'rate', label: 'Rate' },
        { id: 'sku', label: 'SKU' },
        { id: 'matched', label: 'Matched' },
        { id: 'actions', label: 'Actions' }
    ];

    return (
        // <Container sx={{
        //     marginLeft: { xs: '-3%' },
        //     marginTop: { xs: '-5%' },
        //     minWidth: { xs: '100%', sm: '100%', md: '100%' }
        //   }}>
        <Container maxWidth="lg" sx={{ marginLeft: '-3%', marginTop: '-5%', transition: 'margin-left 0.3s ease', minWidth:'97%' }}>
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
                        Items List
                    </Typography>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Button variant="contained" color="primary" size="small" component={Link} to='/integration/qbwc_similar_items'>
                            Similar Items
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" color="success" size="small" component={Link} to='/integration/qbwc_matched_items'>
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
                                    ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : sortedItems
                                ).map((item, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{item.fields.name}</TableCell>
                                        <TableCell>{item.fields.status}</TableCell>
                                        <TableCell>{item.fields.rate}</TableCell>
                                        <TableCell>{item.fields.sku}</TableCell>
                                        <TableCell sx={(theme) => ({
                                            color: !item.fields.qb_list_id || item.fields.qb_list_id === "" ? theme.palette.error.main : theme.palette.success.main,
                                            fontWeight: 'bold',
                                            borderBottom: '1px solid #ccc'
                                        })}>
                                            <b>{!item.fields.qb_list_id || item.fields.qb_list_id === "" ? "NO" : "YES"}</b>
                                        </TableCell>
                                        <TableCell className="text-center align-middle">
                                            <Button 
                                                onClick={() => handleViewItem(item)} 
                                                variant="contained" 
                                                color="info" 
                                                size="small"
                                            >
                                                View
                                            </Button>
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
        </Container>
    );
};

export default ItemsList;


