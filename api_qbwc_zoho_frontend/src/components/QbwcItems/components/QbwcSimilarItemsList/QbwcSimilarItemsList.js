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
  TableSortLabel,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { stableSort, getComparatorUndefined } from '../../../../utils';

const QbwcSimilarItemsList = ({ similarItems }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('qb_item_name'); // Default orderBy column
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
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

  const matchRow = (qb_item_list_id, zoho_item_id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to match this item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, match it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      // if (result.isConfirmed) {
      //   const csrftoken = getCookie('csrftoken');
      //   fetch('/api_quickbook_soap/match_one_item_ajax/', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'X-CSRFToken': csrftoken
      //     },
      //     body: JSON.stringify({
      //       qb_item_list_id: qb_item_list_id,
      //       zoho_item_id: zoho_item_id,
      //       action: 'match'
      //     })
      //   })
      //     .then(response => response.json())
      //     .then(data => {
      //       Swal.fire('Matched!', 'Item has been matched.', 'success').then(() => {
      //         window.location.reload();
      //       });
      //     })
      //     .catch(error => {
      //       Swal.fire('Error!', 'Error matching items for the item.', 'error');
      //     });
      // }
    });
  };

  const columns = [
    { id: 'qb_item_name', label: 'Quick Book Item' },
    { id: 'zoho_items', label: 'Zoho Items' },
    { id: 'coincidence', label: 'Coincidence' },
    { id: 'actions', label: 'Actions' }
  ];

  const filteredItems = similarItems.filter(item =>
    item.qb_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.coincidences_by_order.some(coincidence => 
      coincidence.zoho_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coincidence.zoho_item_sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderTableRows = (items) => {
    return items.map((item, index) => (
      item.coincidences_by_order ? item.coincidences_by_order.map((coincidence, subIndex) => (
        <TableRow key={`${index}-${subIndex}`}>
          {subIndex === 0 && (
            <TableCell rowSpan={item.coincidences_by_order.length}>
              {item.qb_item_name}
            </TableCell>
          )}
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            {coincidence.zoho_item} <br /> (SKU: {coincidence.zoho_item_sku})
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            {coincidence.coincidence}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }} align="center">
            <Button
              variant="contained"
              color="info"
              size="small"
              onClick={() => matchRow(item.qb_item_list_id, coincidence.zoho_item_id)}
            >
              Match
            </Button>
          </TableCell>
        </TableRow>
      )) : (
        <TableRow key={index}>
          <TableCell>{item.qb_item_name}</TableCell>
          <TableCell>No coincidences</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
        </TableRow>
      )
    ));
  };

  const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy));
  const paginatedItems = sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="lg" sx={{ marginLeft: '-3%', marginTop: '-5%', transition: 'margin-left 0.3s ease', minWidth:'97%' }}>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item xs={6}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              textTransform: 'uppercase',
              color: 'info.main',
              fontWeight: 'bold'
            }}
          >
            Similar Items
          </Typography>
        </Grid>
        <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
          <Grid item>
            <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
              Back to List
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="success" size="small" href="{% url 'api_quickbook_soap:matched_items' %}">
              Matched Items
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item xs={8}>
          <Alert severity="info">
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
      <TableContainer component={Paper}>
        <Table id="myTable" aria-label="similar items table">
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
            {renderTableRows(paginatedItems)}
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
    </Container>
  );
};

export default QbwcSimilarItemsList;
