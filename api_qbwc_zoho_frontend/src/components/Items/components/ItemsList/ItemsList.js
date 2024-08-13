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
    TextField,
    TableSortLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Menu
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HomeIcon from '@mui/icons-material/Home';
import { Link, useNavigate } from 'react-router-dom';
import { stableSort, getComparator } from '../../../../utils';
import { EmptyRecordsCell } from '../../../Utils/components/EmptyRecordsCell/EmptyRecordsCell';
import HomeNavigationRightButton from '../../../Utils/components/NavigationRightButton/NavigationRightButton';
import SmallAlert from '../../../Utils/components/SmallAlert/SmallAlert';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

const ItemsList = ({ items }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [orderBy, setOrderBy] = useState('');
    const [order, setOrder] = useState('asc');
    const [filter, setFilter] = useState('all');
    const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorageChange = () => {
            setSearchTerm(localStorage.getItem('searchTermGlobal') || '');
        };
        const savedPage = localStorage.getItem('itemListPage');
        const savedRowsPerPage = localStorage.getItem('itemListRowsPerPage');
        window.addEventListener('storage', handleStorageChange);
        if (savedPage !== null) {
            setPage(Number(savedPage));
        }
        if (savedRowsPerPage !== null) {
            setRowsPerPage(Number(savedRowsPerPage));
        }
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
        localStorage.setItem('itemListPage', newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const rows = parseInt(event.target.value, 10);
        setRowsPerPage(rows);
        localStorage.setItem('itemListRowsPerPage', rows);
        setPage(0);
    };

    // const handleSearchChange = (event) => {
    //     setSearchTerm(event.target.value);
    //     setPage(0);
    // };

    const handleViewItem = (item) => {
        localStorage.setItem('itemListPage', page);
        localStorage.setItem('itemListRowsPerPage', rowsPerPage);
        localStorage.setItem('backNavigation', 'list_items')
        navigate('/integration/item_details', { state: { item, items, filteredItems, filter } });

    };

    const handleFilterChange = event => {
        setFilter(event.target.value);
        setPage(0);
    };

    const filteredItems = items.filter(item => {

        const matchesSearchTerm = item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.fields.sku.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearchTerm;
        if (filter === 'matched') return matchesSearchTerm && item.fields.qb_list_id && item.fields.qb_list_id !== "";
        if (filter === 'unmatched') return matchesSearchTerm && (!item.fields.qb_list_id || item.fields.qb_list_id === "");

        return matchesSearchTerm;
    });

    const sortedItems = stableSort(filteredItems, getComparator(order, orderBy));

    const columns = [
        { id: 'name', label: 'Name' },
        { id: 'status', label: 'Status' },
        { id: 'rate', label: 'Rate' },
        { id: 'sku', label: 'SKU' },
        { id: 'matched', label: 'Matched' },
        // { id: 'actions', label: 'Actions' }
    ];

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const childrenNavigationRightButton = [
        {
            label: 'Back to Integration',
            icon: <HomeIcon sx={{ marginRight: 1 }} />,
            route: '/integration',
            visibility: true
        }
    ];

    const configCustomFilter = {
        filter: filter,
        handleFilterChange: handleFilterChange,
        listValues: [
            { value: 'all', label: 'All Items' },
            { value: 'matched', label: 'Matched Items' },
            { value: 'unmatched', label: 'Unmatched Items' }
        ],
        hasSearch: false
    };

    return (
        <Container
            maxWidth="xl"
            sx={{
                marginLeft: '-29.4%',
                minWidth: '88.3vw',
            }}
        >
            <Grid container spacing={2} alignItems="center" mb={3} justifyContent="space-between" sx={{ mt: '-3%' }}>
                <Grid item container xs={6} justifyContent="flex-start" sx={{ marginTop: '-1%'}}>
                    <Grid item xs={3}>
                        <CustomFilter configCustomFilter={configCustomFilter} />
                    </Grid>
                </Grid>
                <Grid item xs={6} container justifyContent="flex-end" spacing={1} sx={{ marginTop: '-2%'}}>
                    <HomeNavigationRightButton children={childrenNavigationRightButton} />
                </Grid>
                <Grid item xs={12} sx={{ mt: '-1%' }}>
                    <TableContainer style={{ maxHeight: '780px', minHeight: '780px', minWidth: 690 }}>
                        <Table id="myTable" aria-label="items table" stickyHeader>
                            <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell key={column.id}
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#6C7184',
                                                borderBottom: '1px solid #ddd',
                                                borderTop: '1px solid #ddd',
                                                backgroundColor: '#F9F9FB'
                                            }}
                                        >
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
                                                backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF',
                                                maxHeight: '20px'
                                            }}
                                            onMouseEnter={() => setHoveredRowIndex(index)}
                                            onMouseLeave={() => setHoveredRowIndex(null)}
                                            onClick={() => handleViewItem(item)}
                                        >
                                            <TableCell>{item.fields.name}</TableCell>
                                            <TableCell>{item.fields.status}</TableCell>
                                            <TableCell>$ {item.fields.rate}</TableCell>
                                            <TableCell>{item.fields.sku}</TableCell>
                                            <TableCell sx={(theme) => ({
                                                color: !item.fields.qb_list_id || item.fields.qb_list_id === "" ? theme.palette.error.main : theme.palette.success.main,
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #ccc',
                                                width: '50px',
                                                maxWidth: '50px'
                                            })}>
                                                {/* <b>{!item.fields.qb_list_id || item.fields.qb_list_id === "" ? "NO" : "YES"}</b> */}
                                                {!item.fields.qb_list_id || item.fields.qb_list_id === "" ?
                                                    'NO' : 'YES'
                                                }
                                            </TableCell>
                                            {/* <TableCell className="text-center align-middle">
                                                <IconButton onClick={() => handleViewItem(item)} color="info" aria-label="view" size='xx-large'>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </TableCell> */}
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
};

export default ItemsList;


