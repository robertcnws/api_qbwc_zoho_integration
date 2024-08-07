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
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { stableSort, getComparator, fetchWithToken } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import NavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const QbwcItemsList = ({ items, onSyncComplete }) => {

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('all');
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);

  const handleFilterChange = event => {
      setFilter(event.target.value);
      setPage(0);
  };

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

  const isSelected = (itemId) => selectedItems.indexOf(itemId) !== -1;

  const handleCheckboxClick = (event, itemId) => {
        const selectedIndex = selectedItems.indexOf(itemId);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedItems, itemId];
        } else {
            newSelected = selectedItems.filter((id) => id !== itemId);
        }
        setSelectedItems(newSelected);
  };

  const renderForceSyncCheckbox = (item, isSelected) => {
    if (filter !== 'matched'){
        return (
            <FormControl sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel sx={{ color: 'warning.main' }}
                    control={
                        <Checkbox sx={{ color: 'warning.main' }}
                            checked={isSelected}
                            onChange={(e) => handleCheckboxClick(e, item.fields.list_id)}
                        />
                    }
                    label="Never match?"
                />
            </FormControl>
        );
    }
    else {
        return (
            <Alert severity="success" sx={{ mb: 2 }}>
                Matched
            </Alert>
        )
    }
  };

  const handleNeverMatchItems = () => {
    if (selectedItems.length === 0) {
        Swal.fire({
            title: 'Error!',
            text: 'Please select at least one item.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to never match selected items?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, never match them!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const url = `${apiUrl}/api_quickbook_soap/never_match_items_ajax/`
                const body = {
                    items: selectedItems,
                    username: localStorage.getItem('username')
                };
                const response = await fetchWithToken(url, 'POST', body, {}, apiUrl);
                if (response.data.message === 'error') {
                    Swal.fire(
                        'Error!',
                        response.data.error,
                        'error'
                    );
                    return;
                }   
                else if (response.data.message === 'success') {
                    Swal.fire(
                        'Success!',
                        'Selected items have been marked as never match.',
                        'success'
                    ).then(() => {
                        setSelectedItems([]);
                        onSyncComplete();
                    });
                }
            } catch (error) {
                Swal.fire(
                    'Error!',
                    'There was an error marking items as never match.',
                    'error'
                );
            }
        }
    });
};


  const filteredItems = items.filter(item => {
      const search = item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     item.fields.list_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     item.fields.item_type.toLowerCase().includes(searchTerm.toLowerCase());
      if (filter === 'all') return search;
      if (filter === 'matched') return search && item.fields.matched; 
      if (filter === 'not_matched') return search && !item.fields.matched; 
      return false;  
    });

  const sortedItems = stableSort(filteredItems, getComparator(order, orderBy));

  const columns = [
      { id: 'qb_item', label: 'QB Item' },
      { id: 'qb_list_id', label: 'QB List ID' },
      { id: 'qb_item_type', label: 'QB Item Type' },
      { id: 'actions', label: 'Actions' }
  ];

  const childrenNavigationRightButton = [ 
    { 
        label: 'Never Match Selected', 
        icon: <DoNotDisturbIcon sx={{ marginRight: 1 }} />, 
        onClick: handleNeverMatchItems,
        visibility: filter !== 'matched' && selectedItems.length > 0 
    },
    { 
        label: 'Back to QBWC', 
        icon: <AccountBalanceWalletIcon sx={{ marginRight: 1 }} />, 
        route: '/integration/qbwc', 
        visibility: true
    }
 ];

  return (
    <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-9%',
                marginTop: '-6%',
                transition: 'margin-left 0.3s ease',
                // minHeight: '100vh',
                minWidth: '87vw',
                padding: 1,
            }}
        >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
            <Grid item container xs={5} justifyContent="flex-start">
                <Grid item xs={4}>
                    <FormControl variant="outlined" size="small">
                        <InputLabel>{filteredItems.length}</InputLabel>
                        <Select
                            value={filter}
                            onChange={handleFilterChange}
                            label="Filter"
                            sx={{
                                fontSize: '22px',
                                border: 'none',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                                '& .MuiSelect-select': {
                                  padding: '10px',
                                },
                                '& .MuiInputLabel-root': {
                                  top: '-6px',
                                },
                                color: '#212529',
                              }}
                        >
                            <MenuItem value="all">All Items</MenuItem>
                            <MenuItem value="matched">Matched Items</MenuItem>
                            <MenuItem value="not_matched">Not Matched Items</MenuItem>

                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
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
                <NavigationRightButton children={childrenNavigationRightButton} />
            </Grid>
            <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                {/* <Grid item xs={8}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        There are {filteredItems.length} items found.
                    </Alert>
                </Grid> */}
                
            </Grid>
            <Grid item xs={12}>
                <TableContainer component={Paper} style={{ maxHeight: '605px' }}>
                    <Table id="myTable" aria-label="items table" sx={{ minWidth: 650 }} stickyHeader>
                        <TableHead sx={{ backgroundColor: '#e0e0e0' }}> 
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell key={column.id} 
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        color: '#6c7184', 
                                        borderBottom: '1px solid #ddd', 
                                        borderTop: '1px solid #ddd',
                                        backgroundColor: '#f9f9fb' 
                                        }}>
                                        <TableSortLabel
                                            active={orderBy === column.id}
                                            direction={orderBy === column.id ? order : 'asc'}
                                            onClick={() => handleSortChange(column.id)}
                                        >
                                            {column.label.toUpperCase()}
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
                                            <TableRow key={index} 
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            style = {{ 
                                                cursor: 'pointer', 
                                                transition: 'background-color 0.3s ease',  
                                                backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF'
                                            }}
                                            onMouseEnter={() => setHoveredRowIndex(index)}
                                            onMouseLeave={() => setHoveredRowIndex(null)}
                                            >
                                                <TableCell>{item.fields.name}</TableCell>
                                                <TableCell>{item.fields.list_id}</TableCell>
                                                <TableCell>
                                                {
                                                    item.fields.item_type && typeof item.fields.item_type === 'string' 
                                                    ? item.fields.item_type.substring(4) 
                                                    : ''
                                                }
                                                </TableCell>
                                                <TableCell align="center">
                                                    {renderForceSyncCheckbox(item, isSelected(item.fields.list_id))}
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

export default QbwcItemsList;
