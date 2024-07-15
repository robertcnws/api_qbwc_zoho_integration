import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert } from '@mui/material';
import Swal from 'sweetalert2';
import { getCsrfToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const CustomersDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [coincidences, setCoincidences] = useState([]);
  const [customer, setCustomer] = useState(null); 

  useEffect(() => {
      if (location.state.customer && location.state.customer.fields && location.state.customer.fields.contact_id) {
          const customerId = location.state.customer.fields.contact_id;
          const fetchCustomerDetails = async () => {
              try {
                  const response = await axios.get(`${apiUrl}/api_zoho_customers/view_customer/${customerId}/`);
                  setCustomer(response.data);
                  setCoincidences(response.data.coincidences);
              } catch (error) {
                  console.error('Error fetching customer details:', error);
              }
          };
          fetchCustomerDetails();
      } else {
          console.error('Invalid customer data in location state:', location.state);
          navigate('/integration/api_qbwc_zoho/list_customers'); 
      }
  }, [location.state, navigate]);

    const handleMatchCustomer = (contact_id, qb_customer_list_id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to match this customer?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, match it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const csrftoken = getCsrfToken(); // Obtener el token CSRF según tu implementación
                axios.post(`${apiUrl}/api_zoho_customers/match_one_customer_ajax/`, {
                    csrfmiddlewaretoken: csrftoken,
                    contact_id: contact_id,
                    qb_customer_list_id: qb_customer_list_id,
                    action: 'match'
                })
                .then(response => {
                    if (response.data.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: response.data.message,
                            willClose: () => {
                                navigate(-1); // Redirigir a la página anterior al cerrar el mensaje
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: response.data.message
                        });
                    }
                })
                .catch(error => {
                    console.error('Error matching customer:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Something went wrong.'
                    });
                });
            }
        });
    };
    return (
      <Container maxWidth="lg" sx={{ marginLeft: '1%', marginTop: '1%', transition: 'margin-left 0.3s ease', minWidth:'97%' }}>
      {/* <Container component="main" maxWidth="md" sx={{ mt: 5, p: 3, bgcolor: '#FFFFFF', boxShadow: 3, borderRadius: 2 }}> */}
          {!customer ? (
              <Grid container spacing={1}>
                  <Grid item xs={12}>
                      <Alert severity="warning">No customer found.</Alert>
                  </Grid>
                  <Grid item xs={6} container>
                      <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
                          Back to list
                      </Button>
                  </Grid>
              </Grid>
          ) : (
              <Grid container spacing={2}>
                  <Grid item xs={12}>
                  <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                          textTransform: 'uppercase',
                          color: 'info.main',
                          fontWeight: 'bold',
                      }}
                  >
                    Customer Details
                  </Typography>
                  </Grid>
                  <Grid item xs={12}>
                      <TableContainer component={Paper}>
                          <Table aria-label="customer details table">
                              <TableBody>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Customer ID</TableCell>
                                      <TableCell><b>{customer.contact_id}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Customer Name</TableCell>
                                      <TableCell><b>{customer.contact_name}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Customer Email</TableCell>
                                      <TableCell><b>{customer.email ? customer.email : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Customer Phone</TableCell>
                                      <TableCell><b>{customer.phone ? customer.phone : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Customer Company Name</TableCell>
                                      <TableCell><b>{customer.company_name ? customer.company_name : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho QB List ID</TableCell>
                                      <TableCell><b>{customer.qb_list_id ? customer.qb_list_id : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Coincidences by Order</TableCell>
                                      <TableCell>
                                          {coincidences.length > 0 ? (
                                              <TableContainer component={Paper} elevation={0}>
                                                  <Table aria-label="coincidences table" size="small">
                                                      <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                          <TableRow>
                                                              <TableCell>QB Customer Name</TableCell>
                                                              <TableCell>Email</TableCell>
                                                              <TableCell>Coincidence Email</TableCell>
                                                              <TableCell>Phone</TableCell>
                                                              <TableCell>Coincidence Phone</TableCell>
                                                              <TableCell>Company Name</TableCell>
                                                              <TableCell>Action</TableCell>
                                                          </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                          {coincidences.map((coincidence, index) => (
                                                              <TableRow key={index}>
                                                                  <TableCell>{coincidence.qb_customer_name}</TableCell>
                                                                  <TableCell>{coincidence.email}</TableCell>
                                                                  <TableCell>{coincidence.coincidence_email}</TableCell>
                                                                  <TableCell>{coincidence.phone}</TableCell>
                                                                  <TableCell>{coincidence.coincidence_phone}</TableCell>
                                                                  <TableCell>{coincidence.company_name}</TableCell>
                                                                  <TableCell>
                                                                      <Button 
                                                                          variant="contained" 
                                                                          color="info" 
                                                                          size="small"
                                                                          onClick={() => handleMatchCustomer(customer.contact_id, coincidence.qb_customer_list_id)}>
                                                                          Match
                                                                      </Button>
                                                                  </TableCell>
                                                              </TableRow>
                                                          ))}
                                                      </TableBody>
                                                  </Table>
                                              </TableContainer>
                                          ) : (
                                              <Alert severity="warning"
                                                  style={{ 
                                                      fontSize: '0.80rem',  
                                                      padding: '4px 8px', 
                                                      borderRadius: '4px',
                                                  }}>
                                                  <b>No coincidences found.</b>
                                              </Alert>
                                          )}
                                      </TableCell>
                                  </TableRow>
                              </TableBody>
                          </Table>
                      </TableContainer>
                  </Grid>
                  <Grid item xs={12}>
                    <Grid item xs={6}>
                        <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
                            Back to list
                        </Button>
                    </Grid>
                  </Grid>
              </Grid>
          )}
      </Container>
  );
};

export default CustomersDetails;
