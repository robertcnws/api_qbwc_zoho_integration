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
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { stableSort, getComparatorUndefined, fetchWithToken } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const QbwcSimilarCustomersList = ({ similarCustomers, onSyncComplete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('qb_customer_name'); // Default orderBy column
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

  const matchRow = (qb_customer_list_id, zoho_customer_id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to match this customer?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, match it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const matchOneCustomerAjax = async () => {
          try {
            const url = `${apiUrl}/api_zoho_customers/match_one_customer_ajax/`;
            const body = {
              qb_customer_list_id: qb_customer_list_id,
              contact_id: zoho_customer_id,
              action: 'match',
              username: localStorage.getItem('username')
            }
            const response = await fetchWithToken(url, 'POST', body, {}, apiUrl);
            if (response.status === 200) {
              Swal.fire('Matched!', 'Customer has been matched.', 'success').then(() => {
                onSyncComplete();
              });
            }
            else {
              Swal.fire('Error!', `Error matching customers for the customer: ${response.message}`, 'error');
            }
          } catch (error) {
            Swal.fire('Error!', `Error matching customers for the customer: ${error}`, 'error');
          }
        }
        matchOneCustomerAjax();
      }
    });
  };

  const columns = [
    { id: 'qb_customer_name', label: 'QB Customer' },
    { id: 'qb_email', label: 'QB Email' },
    { id: 'qb_phone', label: 'QB Phone' },
    { id: 'zoho_customers', label: 'Zoho Customers' },
    { id: 'zoho_email_match', label: 'Zoho Email Match' },
    { id: 'zoho_phone_match', label: 'Zoho Phone Match' },
    { id: 'actions', label: 'Actions' }
  ];

  const filteredCustomers = similarCustomers.filter(customer =>
    customer.qb_customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.qb_customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.qb_customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.coincidences_by_order.some(coincidence => 
      coincidence.zoho_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coincidence.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      coincidence.phone.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderTableRows = (customers) => {
    return customers.map((customer, index) => (
      customer.coincidences_by_order ? customer.coincidences_by_order.map((coincidence, subIndex) => (
        <TableRow key={`${index}-${subIndex}`}>
            <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
                {customer.qb_customer_name}
            </TableCell>
            <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
                {customer.qb_customer_email}
            </TableCell>
            <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
                {customer.qb_customer_phone}
            </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            Name: <b>{coincidence.zoho_customer}</b><br /> 
            Company Name: <b>{coincidence.zoho_company_name ? `${coincidence.zoho_company_name}` : '---'}</b><br />
            (ID: <b>{coincidence.zoho_customer_id}</b>)
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            {coincidence.email ? (
                <>
                {coincidence.email} <br /> (Match: {coincidence.coincidence_email})
                </>
            ) : (
                '---'
            )}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }}>
            {coincidence.phone ? (
                <>
                {coincidence.phone} <br /> (Match: {coincidence.coincidence_phone})
                </>
            ) : (
                '---'
            )}
          </TableCell>
          <TableCell style={{ backgroundColor: subIndex === 0 ? '#f8d7da' : '' }} align="center">
            <Button
              variant="contained"
              color="info"
              size="small"
              onClick={() => matchRow(customer.qb_customer_list_id, coincidence.zoho_customer_id)}
            >
              Match
            </Button>
          </TableCell>
        </TableRow>
    )) : null
    ));
  };
  

  const sortedCustomers = stableSort(filteredCustomers, getComparatorUndefined(order, orderBy));
  const paginatedCustomers = sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
              fontWeight: 'bold'
            }}
          >
            QB Similar Customers
          </Typography>
        </Grid>
        <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
          <Grid item>
            <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
              Back to List
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="success" size="small" component={Link} to="/integration/qbwc/customers/matched">
              Matched Customers
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item xs={8}>
          <Alert severity="info">
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
      <TableContainer component={Paper}>
        <Table id="myTable" aria-label="similar customers table">
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
                renderTableRows(paginatedCustomers)
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
    </Container>
  );
};

export default QbwcSimilarCustomersList;