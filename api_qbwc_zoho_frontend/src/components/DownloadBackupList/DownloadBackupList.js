import React, { useState, useEffect } from 'react';
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
    TextField,
    IconButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';
import { EmptyRecordsCell } from '../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import { Download } from '@mui/icons-material';
import axios from 'axios';
import { stableSort, getComparatorUndefined, fetchWithToken } from '../../utils';
import NavigationRightButton from '../Utils/components/NavigationRightButton/NavigationRightButton';
import TableCustomPagination from '../Utils/components/TableCustomPagination/TableCustomPagination';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const DownloadBackupList = () => {

    const [backups, setBackups] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);

    useEffect(() => {

        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        window.addEventListener('storage', handleStorageChange);

        const fetchData = async () => {
            try {
                const response = await fetchWithToken(`${apiUrl}/download_backup_db/`, 'GET', null, {}, apiUrl);
                setBackups(response.data.backups);
            } catch (error) {
                console.error('Error fetching backups:', error);
            }
        };
        fetchData();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, [searchTerm]);

    const downloadBackup = (item) => {
        const filename = item.file_name;
        axios({
            url: `${apiUrl}/backup/${filename}`,
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
        });
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

    // const handleSearchChange = (event) => {
    //     setSearchTerm(event.target.value);
    //     setPage(0);
    // };

    const filteredItems = backups.filter(item =>
        item.date_time.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedItems = stableSort(filteredItems, getComparatorUndefined(order, orderBy));

    const columns = [
        { id: 'date_time', label: 'Date & Time' },
        { id: 'type', label: 'Type' },
        { id: 'size', label: 'Size' },
        { id: 'actions', label: 'Actions' }
    ];

    const childrenNavigationRightButton = [
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
                marginLeft: '-23.2%',
                minWidth: '88.4vw',
            }}

        >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3} sx={{ mt: '0.5%' }}>
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
                        DB BackUps
                    </Typography>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1}>
                    {/* <Grid item xs={4}>
                        <TextField
                            label="Search"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            sx={{ width: '100%', mb: 2 }}
                        />
                    </Grid> */}
                    <NavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
                <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            There are {filteredItems.length} items found.
                        </Alert>
                    </Grid>
                </Grid>
                <Grid item xs={12} sx={{ mt: '-1%' }}>
                    <TableContainer style={{ maxHeight: '705px', minHeight: '705px', minWidth: 690 }}>
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
                                {filteredItems.length === 0 ? (
                                    <EmptyRecordsCell columns={columns} />
                                ) : (
                                    (rowsPerPage > 0
                                        ? sortedItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        : sortedItems
                                    ).map((item, index) => (
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
                                            <TableCell>{item.date_time}</TableCell>
                                            <TableCell>{item.file_type}</TableCell>
                                            <TableCell>{item.size}</TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => downloadBackup(item)} size='small'>
                                                    <Download />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                <TableCustomPagination
                                    columnsLength={columns.length}
                                    data={filteredItems}
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

export default DownloadBackupList;
