import React from 'react';
import { Grid, Typography, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Link } from 'react-router-dom'; // Asumiendo que estás usando React Router para las URL

const ItemsList = ({ items }) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={6}>
                <Typography variant="h5">Items List</Typography>
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
            <Grid item xs={12}>
                <Alert severity="info" xs={12}>
                    There are {items.length} items found.
                </Alert>
            </Grid>
            <Grid item xs={12}>
                <TableContainer component={Paper}>
                    <Table id="myTable" aria-label="items table" sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Rate</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell>Matched</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.status}</TableCell>
                                    <TableCell>{item.rate}</TableCell>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell className="text-center align-middle">
                                        {item.matched ? (
                                            <span className="alert-success">YES</span>
                                        ) : (
                                            <span className="alert-danger">NO</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center align-middle">
                                        <Button component={Link} to={`/view_item/${item.id}`} variant="contained" color="info" size="small">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
    );
};

export default ItemsList;
