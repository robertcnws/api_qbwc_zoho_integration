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
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { stableSort, getComparatorUndefined, fetchWithToken, formatDate } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const UsersList = ({ users, onSyncComplete }) => {

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
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

  const filteredUsers = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewUser = (user) => {
     const state = { user: user };
     navigate('/integration/view_user', { state: state });      
};

  const sortedUsers = stableSort(filteredUsers, getComparatorUndefined(order, orderBy));

  const columns = [
      { id: 'username', label: 'Username' },
      { id: 'first_name', label: 'First Name' },
      { id: 'last_name', label: 'Last Name' },
      { id: 'email', label: 'Email' },
      { id: 'role', label: 'Role' },
      { id: 'last_login', label: 'Last Login' },
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
                    Users List
                </Typography>
            </Grid>
            <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
            <Grid item>
                    <Button variant="contained" color="info" size="small" onClick={() => viewUser(null)}>
                        Create User
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="success" size="small" component={Link} to="/integration">
                        Back to Integration
                    </Button>
                </Grid>
            </Grid>
            <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                <Grid item xs={8}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        There are {filteredUsers.length} users found.
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
                            {filteredUsers.length === 0 ? (
                                <EmptyRecordsCell columns={columns} />
                                ) : (
                                    (rowsPerPage > 0
                                    ? sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : sortedUsers
                                ).map((user, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.first_name ? user.first_name : user.username}</TableCell>
                                        <TableCell>{user.last_name ? user.last_name : user.username}</TableCell>
                                        <TableCell>{user.email ? user.email : '---'}</TableCell>
                                        <TableCell>{user.last_login ? formatDate(user.last_login) : '---'}</TableCell>
                                        <TableCell className="text-center align-middle">
                                            <IconButton color="info" aria-label="view" size='xx-large' onClick={() => viewUser(user)}>
                                                <EditIcon/>
                                            </IconButton>
                                            <IconButton color="error" aria-label="view" size='xx-large'>
                                                <DeleteIcon />
                                            </IconButton>
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
                    count={filteredUsers.length}
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

export default UsersList;