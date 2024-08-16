import React, { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { stableSort, getComparatorUndefined, fetchWithToken, formatDate } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import NavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;
const numberRows = parseInt(process.env.REACT_APP_DEFAULT_ROWS_PER_PAGE);

const UsersList = ({ users, onSyncComplete }) => {

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(numberRows);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [searchTerm]);

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

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const viewUser = (user) => {
        const state = { user: user };
        navigate('/integration/view_user', { state: state });
    };

    const setUserStatus = (user) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete user ${user.username}. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const data = JSON.stringify({ logged_username: localStorage.getItem('username') });
                const response = await fetchWithToken(`${apiUrl}/set_user_status/${user.username}/`, 'POST', data, {}, apiUrl);
                if (response.status === 200) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.data.message
                    }).then(() => {
                        onSyncComplete();
                    });
                }
            }
        });
    };

    const sortedUsers = stableSort(filteredUsers, getComparatorUndefined(order, orderBy));

    const columns = [
        { id: 'username', label: 'Username' },
        { id: 'role', label: 'Role' },
        { id: 'first_name', label: 'First Name' },
        { id: 'last_name', label: 'Last Name' },
        { id: 'email', label: 'Email' },
        { id: 'last_login', label: 'Last Login' },
        { id: 'actions', label: 'Actions' }
    ];

    const childrenNavigationRightButton = [
        {
            label: 'Add New User',
            icon: <AddIcon sx={{ marginRight: 1 }} />,
            onClick: viewUser,
            visibility: true
        },
        {
            label: 'Back to Integration',
            icon: <HomeIcon sx={{ marginRight: 1 }} />,
            route: '/integration',
            visibility: true
        }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-29.4%',
                minWidth: '88.3vw',
            }}
        >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3} sx={{ mt: '-3%' }}>
                <Grid item xs={6}>
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                            textTransform: 'uppercase',
                            color: '#212529',
                            fontWeight: 'bold',
                            marginLeft: '1%',
                        }}
                    >
                        Users List
                    </Typography>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    <NavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            There are {filteredUsers.length} users found.
                        </Alert>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: '-1%' }}>
                    <TableContainer style={{ maxHeight: '700px', minHeight: '700px', minWidth: 690 }}>
                        <Table id="myTable" aria-label="items table" stickyHeader>
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
                                {filteredUsers.length === 0 ? (
                                    <EmptyRecordsCell columns={columns} />
                                ) : (
                                    (rowsPerPage > 0
                                        ? sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        : sortedUsers
                                    ).map((user, index) => (
                                        user.username !== localStorage.getItem('username') && (
                                            <TableRow key={index}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s ease',
                                                    backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF'
                                                }}
                                                onMouseEnter={() => setHoveredRowIndex(index)}
                                                onMouseLeave={() => setHoveredRowIndex(null)}
                                            >
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                <TableCell>{user.first_name ? user.first_name : user.username}</TableCell>
                                                <TableCell>{user.last_name ? user.last_name : user.username}</TableCell>
                                                <TableCell>{user.email ? user.email : '---'}</TableCell>
                                                <TableCell>{user.last_login ? formatDate(user.last_login) : '---'}</TableCell>
                                                <TableCell className="text-center align-middle">
                                                    <IconButton color="info" aria-label="view" size='xx-large' onClick={() => viewUser(user)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="error" aria-label="view" size='xx-large' onClick={() => setUserStatus(user)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    ))
                                )}
                                <TableCustomPagination
                                    columnsLength={columns.length}
                                    data={filteredUsers}
                                    page={page}
                                    rowsPerPage={rowsPerPage}
                                    handleChangePage={handleChangePage}
                                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                                />
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Container>
    );

}

export default UsersList;
