import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, json } from 'react-router-dom';
import { 
    Container, 
    Grid, 
    Typography, 
    Button, 
    Table, 
    TableBody, 
    TableCell,
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Alert,
    useTheme,
    useMediaQuery, 
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination,
    Box
} from '@mui/material';
import { grey } from '@mui/material/colors';
import Swal from 'sweetalert2';
import { fetchWithToken } from '../../../../utils';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const ItemsDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [coincidences, setCoincidences] = useState([]);
  const [item, setItem] = useState(null); 
  const [filteredItems, setFilteredItems] = useState(null); 
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFilterChange = (event) => {
    const selectedFilter = event.target.value;
    setFilter(selectedFilter);
    const filteredList = location.state.items.filter(item => {
        if (selectedFilter === 'all') return item;
        if (selectedFilter === 'matched') return item.fields.qb_list_id !== null && item.fields.qb_list_id !== '';
        if (selectedFilter === 'unmatched') return !item.fields.qb_list_id || item.fields.qb_list_id === '';
        return false;
    });
    setFilteredItems(filteredList);
  }

  useEffect(() => {
      setFilteredItems(location.state.filteredItems ? location.state.filteredItems : null);
      setFilter(location.state.filter ? location.state.filter : 'all');
      if (location.state.item) {
          const itemId = location.state.item.fields ? location.state.item.fields.item_id : location.state.item.item_id;
          const fetchItemDetails = async () => {
              try {
                  const url = `${apiUrl}/api_zoho_items/view_item/${itemId}/`
                  const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                  setItem(response.data);
                  setCoincidences(response.data.coincidences);
              } catch (error) {
                  console.error('Error fetching item details:', error);
                  setError(`Error fetching item details: ${error}`);
              } finally {
                  setLoading(false);
              }
          };
          fetchItemDetails();
      } else {
          console.error('Invalid item data in location state:', location.state);
          navigate('/integration/api_qbwc_zoho/list_items'); 
      }
  }, [location.state, navigate]);

    const handleMatchItem = (item_id, qb_item_list_id) => {
        const action = qb_item_list_id !== 'UNMATCH' ? 'match' : 'unmatch';
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${action} this item?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: `Yes, ${action} it!`
        }).then((result) => {
            if (result.isConfirmed) {
                const matchOneCustomerAjax = async () => {
                    try {
                        const url = `${apiUrl}/api_zoho_items/match_one_item_ajax/`
                        const data = {
                            item_id: item_id,
                            qb_item_list_id: qb_item_list_id,
                            action: action
                        }
                        const response = await fetchWithToken(url, 'POST', data, {}, apiUrl);
                        if (response.data.status === 'success') {
                            Swal.fire({
                                icon: 'success',
                                title: 'Success',
                                text: response.data.message,
                                willClose: () => {
                                    const values = {}
                                    values['fields'] = item;
                                    const fetchData = async () => {
                                        try {
                                            const url = `${apiUrl}/api_zoho_items/list_items/`
                                            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                                            const jsonData = JSON.parse(response.data); 
                                            const state = {
                                                item: values,
                                                items: jsonData,
                                                filteredItems: jsonData,
                                                filter: filter
                                            }
                                            navigate('/integration/item_details', { state: state });
                                        } catch (error) {
                                            console.error('Error fetching items:', error);
                                            setError(`Failed to fetch items: ${error}`);
                                        } finally {
                                            setLoading(false);
                                        }
                                    };
                                    fetchData();
                                    
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
                        console.error('Error matching item:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: `Error matching item: ${error}`
                        });
                    }
                };
                matchOneCustomerAjax();
            }
        });
    };


    const getBackgroundColor = (filteredItem) => {
        if (filteredItem.fields.item_id === item.item_id) {
            return grey[300];
        } else {
            return '';
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        const rows = parseInt(event.target.value, 10);
        setRowsPerPage(rows);
        setPage(0);
    };

    const handleViewItem = (item_id) => {
        const fetchItemsDetails = async () => {
            try {
                const url = `${apiUrl}/api_zoho_items/view_item/${item_id}/`
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                setItem(response.data);
                setCoincidences(response.data.coincidences);
            } catch (error) {
                console.error('Error fetching invoice details:', error);
            }
        };
        fetchItemsDetails();
    }

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Item Details'/>
        );
    }

    if (error) {
        return (
            <AlertError isSmallScreen={isSmallScreen} error={error}/>
        );
    }

    return (
      <Container maxWidth="lg" sx={{ marginLeft: '-1%', marginTop: '0%', transition: 'margin-left 0.3s ease', minWidth:'100%' }}>
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
                <Grid item container xs={3}>
                    <Grid item container xs={12} spacing={1}>
                        <FormControl variant="outlined" size="small" style={{ marginBottom: '10px'}}>
                            <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <b>({filteredItems.length})</b>
                            </InputLabel>
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
                        <TableContainer component={Paper} sx={{ maxHeight: 640, minHeight: 640 }}>
                            <Table aria-label="filtered customers table">
                                <TableBody>
                                    {filteredItems && filteredItems.length > 0 ? (
                                        (rowsPerPage > 0
                                            ? filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            : filteredItems
                                        ).map((filteredItem, index) => (
                                            <TableRow 
                                                key={index} 
                                                onClick={() => handleViewItem(filteredItem.fields.item_id)}
                                                sx={{ cursor: 'pointer' }}
                                                style={{ backgroundColor: getBackgroundColor(filteredItem) }}
                                            >
                                                <TableCell>
                                                    <b>{filteredItem.fields.item_name}</b><br/>
                                                    SKU: {filteredItem.fields.sku ? filteredItem.fields.sku : '--'}<br/>
                                                    Rate: $ {filteredItem.fields.rate ? filteredItem.fields.rate : '--'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell>No items found.</TableCell>
                                        </TableRow>
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
                        />
                    </Grid>
                </Grid>
                <Grid item container xs={9}>
                  <Grid item container xs={12} spacing={1} style={{ marginBottom: '15px'}}>
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
                            Item Details
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" color="success" size="small" onClick={() => navigate(-1)}>
                                Back to list
                            </Button>
                        </Box>
                    </Grid>
                    <Grid item container xs={12} spacing={1} sx={{ minHeight: 700, maxHeight: 700 }}>
                        <TableContainer component={Paper} sx={{ minHeight: 700, maxHeight: 700 }}>
                            <Table aria-label="item details table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item ID</TableCell>
                                        <TableCell><b>{item.item_id}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item Name</TableCell>
                                        <TableCell><b>{item.name}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item SKU</TableCell>
                                        <TableCell><b>{item.sku ? item.sku : '--'}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item Rate</TableCell>
                                        <TableCell><b>$ {item.rate}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item Status</TableCell>
                                        <TableCell><b>{item.status}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho QB List ID</TableCell>
                                        <TableCell><b>{item.qb_list_id ? item.qb_list_id : '--'}</b></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Coincidences by Order</TableCell>
                                        <TableCell>
                                            {coincidences.length > 0 && !item.matched ? (
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
                                            ) : item.matched ? (
                                                <Grid item xs={12}>
                                                    <Alert severity="success"
                                                        style={{ 
                                                            fontSize: '0.80rem',  
                                                            padding: '4px 8px', 
                                                            borderRadius: '4px',
                                                        }}>
                                                        <b>Item already matched.</b>
                                                    </Alert>
                                                    <br />
                                                    <Button 
                                                        variant="contained" 
                                                        color="error" 
                                                        size="small"
                                                        onClick={() => handleMatchItem(item.item_id, 'UNMATCH')}>
                                                        UnMatch
                                                    </Button>
                                                </Grid>
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
                    </Grid>
                  </Grid>
              </Grid>
          )}
      </Container>
  );
};

export default ItemsDetails;
