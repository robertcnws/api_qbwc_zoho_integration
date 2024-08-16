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
} from '@mui/material';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { stableSort, getComparatorUndefined, fetchWithToken } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);

const QbwcMatchedItemsList = ({ matchedItems, onSyncComplete }) => {

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');

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

    const handleUnMatchItem = (item) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to unmatch this item?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Unmatch it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const unmatchOneItemAjax = async () => {
                    try {
                        const url = `${apiUrl}/api_zoho_items/match_one_item_ajax/`
                        const data = {
                            item_id: item.zoho_item_id,
                            qb_item_list_id: item.qb_item_list_id,
                            action: 'unmatch',
                            username: localStorage.getItem('username'),
                        }
                        const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                icon: 'success',
                                title: 'Success',
                                text: response.data.message,
                                willClose: () => {
                                    // navigate(-1);
                                    onSyncComplete();
                                }
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: response.data.message
                            });
                        }
                    } catch (error) {
                        console.error('Error unmatching item:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: `Error unmatching item: ${error}`
                        });
                    }
                };
                unmatchOneItemAjax();
            }
        });
    };

    const filteredItems = matchedItems.filter(item =>
        item.qb_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.zoho_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.zoho_item_sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy));

    const columns = [
        { id: 'qb_item', label: 'QB Item' },
        { id: 'zoho_item', label: 'Zoho Item' },
        { id: 'actions', label: 'Actions' }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-10%',
                marginTop: '-6%',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
                minWidth: '88vw',
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
                        QB Matched Items List
                    </Typography>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Button variant="contained" color="success" size="small" component={Link} to="/integration/qbwc">
                            Back to QBWC
                        </Button>
                    </Grid>
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={8}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            There are {filteredItems.length} matched items found.
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
                                            <TableCell>{item.qb_item_name}</TableCell>
                                            <TableCell>
                                                {item.zoho_item}<br />
                                                (SKU: {item.zoho_item_sku && item.zoho_item_sku.length > 0 ? item.zoho_item_sku : '---'})
                                            </TableCell>
                                            <TableCell className="text-center align-middle">
                                                <Button
                                                    onClick={() => handleUnMatchItem(item)}
                                                    variant="contained"
                                                    color="warning"
                                                    size="small"
                                                >
                                                    UnMatch
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

}

export default QbwcMatchedItemsList;
