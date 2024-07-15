import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert } from '@mui/material';
import Swal from 'sweetalert2';
import { getCsrfToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const ItemsDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [coincidences, setCoincidences] = useState([]);
  const [item, setItem] = useState(null); 

  useEffect(() => {
      if (location.state.item && location.state.item.fields && location.state.item.fields.item_id) {
          const itemId = location.state.item.fields.item_id;
          const fetchItemDetails = async () => {
              try {
                  const response = await axios.get(`${apiUrl}/api_zoho_items/view_item/${itemId}/`);
                  setItem(response.data);
                  setCoincidences(response.data.coincidences);
              } catch (error) {
                  console.error('Error fetching item details:', error);
              }
          };
          fetchItemDetails();
      } else {
          console.error('Invalid item data in location state:', location.state);
          navigate('/integration/api_qbwc_zoho/list_items'); 
      }
  }, [location.state, navigate]);

    const handleMatchItem = (item_id, qb_item_list_id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to match this item?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, match it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const csrftoken = getCsrfToken(); // Obtener el token CSRF según tu implementación
                axios.post(`${apiUrl}/api_zoho_items/match_one_item_ajax/`, {
                    csrfmiddlewaretoken: csrftoken,
                    item_id: item_id,
                    qb_item_list_id: qb_item_list_id,
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
                    console.error('Error matching item:', error);
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
          {!item ? (
              <Grid container spacing={1}>
                  <Grid item xs={12}>
                      <Alert severity="warning">No item found.</Alert>
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
                    Item Details
                  </Typography>
                  </Grid>
                  <Grid item xs={12}>
                      <TableContainer component={Paper}>
                          <Table aria-label="item details table">
                              <TableBody>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Item ID</TableCell>
                                      <TableCell><b>{item.item_id}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Item Name</TableCell>
                                      <TableCell><b>{item.name}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Item SKU</TableCell>
                                      <TableCell><b>{item.sku ? item.sku : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Item Rate</TableCell>
                                      <TableCell><b>{item.rate}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho Item Status</TableCell>
                                      <TableCell><b>{item.status}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Zoho QB List ID</TableCell>
                                      <TableCell><b>{item.qb_list_id ? item.qb_list_id : '--'}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Coincidences by Order</TableCell>
                                      <TableCell>
                                          {coincidences.length > 0 ? (
                                              <TableContainer component={Paper} elevation={0}>
                                                  <Table aria-label="coincidences table" size="small">
                                                      <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                          <TableRow>
                                                              <TableCell>QB Item Name</TableCell>
                                                              <TableCell>Coincidence Name</TableCell>
                                                              <TableCell>Action</TableCell>
                                                          </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                          {coincidences.map((coincidence, index) => (
                                                              <TableRow key={index}>
                                                                  <TableCell>{coincidence.qb_item_name}</TableCell>
                                                                  <TableCell>{coincidence.coincidence_name}</TableCell>
                                                                  <TableCell>
                                                                      <Button 
                                                                          variant="contained" 
                                                                          color="info" 
                                                                          size="small"
                                                                          onClick={() => handleMatchItem(item.item_id, coincidence.qb_item_list_id)}>
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

export default ItemsDetails;
