import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TextField, TableSortLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { stableSort, getComparator } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';

const ItemsList = ({ items }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const savedPage = localStorage.getItem('itemListPage');
        const savedRowsPerPage = localStorage.getItem('itemListRowsPerPage');
    
        if (savedPage !== null) {
          setPage(Number(savedPage));
        }
    
        if (savedRowsPerPage !== null) {
          setRowsPerPage(Number(savedRowsPerPage));
        }
      }, []);

    const handleSortChange = (columnId) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        localStorage.setItem('itemListPage', newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const rows = parseInt(event.target.value, 10);
        setRowsPerPage(rows);
        localStorage.setItem('itemListRowsPerPage', rows);
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handleViewItem = (item) => {
        localStorage.setItem('itemListPage', page);
        localStorage.setItem('itemListRowsPerPage', rowsPerPage);
        navigate('/integration/item_details', { state: { item, items, filteredItems, filter } });
        
    };

    const handleFilterChange = event => {
        setFilter(event.target.value);
        setPage(0);
    };

    const filteredItems = items.filter(item => {

        const matchesSearchTerm = item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.fields.sku.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'all') return matchesSearchTerm;
        if (filter === 'matched') return matchesSearchTerm && item.fields.qb_list_id && item.fields.qb_list_id !== "";
        if (filter === 'unmatched') return matchesSearchTerm && (!item.fields.qb_list_id || item.fields.qb_list_id === "");
        
        return matchesSearchTerm;
    });

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
                        Items List
                    </Typography>
                    <FormControl variant="outlined" size="small">
                        <InputLabel>Filter</InputLabel>
                        <Select
                            value={filter}
                            onChange={handleFilterChange}
                            label="Filter"
                        >
                            <MenuItem value="all">All Items</MenuItem>
                            <MenuItem value="matched">Matched Items</MenuItem>
                            <MenuItem value="unmatched">Unmatched Items</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Button variant="contained" color="success" size="small" component={Link} to='/integration'>
                            Back to Integration
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
                                {filteredItems.length === 0 ? (
                                    <EmptyRecordsCell columns={columns} />
                                    ) : (
                                    (rowsPerPage > 0
                                        ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        : sortedItems
                                    ).map((item, index) => (
                                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>{item.fields.name}</TableCell>
                                            <TableCell>{item.fields.status}</TableCell>
                                            <TableCell>$ {item.fields.rate}</TableCell>
                                            <TableCell>{item.fields.sku}</TableCell>
                                            <TableCell sx={(theme) => ({
                                                color: !item.fields.qb_list_id || item.fields.qb_list_id === "" ? theme.palette.error.main : theme.palette.success.main,
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #ccc',
                                                width: '50px', 
                                                maxWidth: '50px'
                                            })}>
                                                {/* <b>{!item.fields.qb_list_id || item.fields.qb_list_id === "" ? "NO" : "YES"}</b> */}
                                                {!item.fields.qb_list_id || item.fields.qb_list_id === "" ? 
                                                    <SmallAlert severity='error' message='NO'/> : <SmallAlert severity='success' message='YES'/>
                                                }
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
                                    ))
                                )}
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


