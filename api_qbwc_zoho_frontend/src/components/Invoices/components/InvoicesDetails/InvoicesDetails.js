import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Grid, Typography, Button, Table, TableHead, TableBody, TableCell, TableContainer, TableRow, Paper, Alert } from '@mui/material';
import { fetchWithToken } from '../../../../utils'

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const InvoicesDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null); 

  useEffect(() => {
      if (location.state.invoice && location.state.invoice.fields && location.state.invoice.fields.invoice_id) {
          const invoiceId = location.state.invoice.fields.invoice_id;
          const fetchInvoiceDetails = async () => {
              try {
                  const url = `${apiUrl}/api_zoho_invoices/view_invoice/${invoiceId}/`
                  const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                  setInvoice(response.data.invoice);
              } catch (error) {
                  console.error('Error fetching invoice details:', error);
              }
          };
          fetchInvoiceDetails();
      } else {
          console.error('Invalid invoice data in location state:', location.state);
          navigate('/integration/list_invoices'); 
      }
  }, [location.state, navigate]);

    return (
      <Container maxWidth="lg" sx={{ marginLeft: '1%', marginTop: '1%', transition: 'margin-left 0.3s ease', minWidth:'97%' }}>
      {/* <Container component="main" maxWidth="md" sx={{ mt: 5, p: 3, bgcolor: '#FFFFFF', boxShadow: 3, borderRadius: 2 }}> */}
          {!invoice ? (
              <Grid container spacing={1}>
                  <Grid item xs={12}>
                      <Alert severity="warning">No invoice found.</Alert>
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
                    Invoice Details
                  </Typography>
                  </Grid>
                  <Grid item xs={12}>
                      <TableContainer component={Paper}>
                          <Table aria-label="invoice details table">
                              <TableBody>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Invoice Number</TableCell>
                                      <TableCell><b>{invoice.invoice_number}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Customer</TableCell>
                                      <TableCell><b>{invoice.customer_name}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Date</TableCell>
                                      <TableCell><b>{invoice.date}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Total Amount</TableCell>
                                      <TableCell><b>{invoice.total}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Last Sync Date</TableCell>
                                      <TableCell><b>{invoice.last_sync_date ? invoice.last_sync_date : "---"}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Number of attemps to sync</TableCell>
                                      <TableCell><b>{invoice.number_of_times_synced}</b></TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Items</TableCell>
                                      <TableCell>
                                          {invoice.line_items.length > 0 ? (
                                              <TableContainer component={Paper} elevation={0}>
                                                  <Table aria-label="coincidences table" size="small">
                                                      <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                          <TableRow>
                                                              <TableCell>Item Desc</TableCell>
                                                              <TableCell>Amount</TableCell>
                                                          </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                          {invoice.line_items.map((item, index) => (
                                                              <TableRow key={index}>
                                                                  <TableCell>{item.description}</TableCell>
                                                                  <TableCell>{item.item_total}</TableCell>
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
                                                  <b>No items found.</b>
                                              </Alert>
                                          )}
                                      </TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Errors sync Items</TableCell>
                                      <TableCell>
                                          {invoice.items_unmatched.length > 0 ? (
                                              <TableContainer component={Paper} elevation={0}>
                                                  <Table aria-label="coincidences table" size="small">
                                                      <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                          <TableRow>
                                                              <TableCell>Item from Zoho</TableCell>
                                                              <TableCell>Reason</TableCell>
                                                          </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                          {invoice.items_unmatched.map((item, index) => (
                                                              <TableRow key={index}>
                                                                  <TableCell>{item.zoho_item_unmatched}</TableCell>
                                                                  <TableCell>
                                                                      <Alert severity="error"
                                                                          style={{ 
                                                                              fontSize: '0.80rem',  
                                                                              padding: '4px 8px', 
                                                                              borderRadius: '4px',
                                                                          }}>
                                                                          <b>{item.reason}</b>
                                                                      </Alert>
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
                                                  <b>No Errors in matched items detected.</b>
                                              </Alert>
                                          )}
                                      </TableCell>
                                  </TableRow>
                                  <TableRow>
                                      <TableCell component="th" scope="row">Errors sync Customer</TableCell>
                                      <TableCell>
                                          {invoice.customer_unmatched.length > 0 ? (
                                              <TableContainer component={Paper} elevation={0}>
                                                  <Table aria-label="coincidences table" size="small">
                                                      <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                                          <TableRow>
                                                              <TableCell>Customer from Zoho</TableCell>
                                                              <TableCell>Reason</TableCell>
                                                          </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                          {invoice.customer_unmatched.map((item, index) => (
                                                              <TableRow key={index}>
                                                                  <TableCell>{item.zoho_customer_unmatched}</TableCell>
                                                                  <TableCell>
                                                                      <Alert severity="error"
                                                                          style={{ 
                                                                              fontSize: '0.80rem',  
                                                                              padding: '4px 8px', 
                                                                              borderRadius: '4px',
                                                                          }}>
                                                                          <b>{item.reason}</b>
                                                                      </Alert>
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
                                                  <b>No Errors in matched customer detected.</b>
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

export default InvoicesDetails;
