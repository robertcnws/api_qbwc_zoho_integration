import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    CircularProgress,
    TextField,
    styled,
    InputAdornment,
    IconButton,
    ListSubheader,
    Box,
    Tooltip,
} from '@mui/material';
import { List, AutoSizer } from 'react-virtualized';
import { grey } from '@mui/material/colors';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from 'sweetalert2';
import { fetchWithToken } from '../../../../utils';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import TableCustomPagination from '../../../Utils/components/TableCustomPagination/TableCustomPagination';
import CustomFilter from '../../../Utils/components/CustomFilter/CustomFilter';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const StyledMenuItem = styled(MenuItem)({
    // Estilos personalizados
    backgroundColor: '#f0f0f0',
    '&:hover': {
        backgroundColor: '#d0d0d0',
    },
    padding: '10px 20px',
    borderBottom: '1px solid #e0e0e0',
});

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
    const [qbItems, setQbItems] = useState([]);
    const [loadingQbItems, setLoadingQbItems] = useState(true);
    const [qbSelectedItem, setQbSelectedItem] = useState(null);
    const [filteredQbItems, setFilteredQbItems] = useState([]);
    const [searchTermQbItems, setSearchTermQbItems] = useState('');
    const [showListQbItems, setShowListQbItems] = useState(true);
    const [searchSelectTerm, setSearchSelectTerm] = useState('');
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const filterItems = (filter, searchTerm) => {
        const allItems = location.state.items;
        return allItems.filter(item => {
            const matchesFilter = filter === 'all'
                ? true
                : filter === 'matched'
                    ? item.fields.qb_list_id !== null && item.fields.qb_list_id !== ''
                    : !item.fields.qb_list_id || item.fields.qb_list_id === '';

            const matchesSearchTerm = searchTerm === ''
                ? true
                : (item.fields.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.fields.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.fields.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.fields.rate.toLowerCase().includes(searchTerm.toLowerCase()));

            return matchesFilter && matchesSearchTerm;
        });
    };

    const handleFilterChange = (e) => {
        const newFilter = e.target.value;
        setFilter(newFilter);
        const filteredList = filterItems(newFilter, searchSelectTerm);
        setFilteredItems(filteredList);
    }

    const handleSearchSelectChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchSelectTerm(newSearchTerm);
        const filteredList = filterItems(filter, newSearchTerm);
        setFilteredItems(filteredList);
    };

    useEffect(() => {
        const filteredList = filterItems(filter, searchSelectTerm);
        setFilteredItems(filteredList);
    }, [filter, searchSelectTerm]);

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

    useEffect(() => {
        const qbFetchItems = async () => {
            try {
                const isNeverMatch = 'not_matched';
                const url = `${apiUrl}/api_quickbook_soap/qbwc_items/${isNeverMatch}`;
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                const jsonData = JSON.parse(response.data);
                setQbItems(jsonData);
            } catch (error) {
                console.error('Error fetching qb items:', error);
                setError(`Failed to fetch qn items: ${error}`);
            } finally {
                setLoadingQbItems(false);
            }
        };
        qbFetchItems();
    }, []);

    useEffect(() => {
        const filtered = qbItems.filter(qbItem => qbItem.fields.name.toLowerCase().includes(searchTermQbItems.toLowerCase()));
        setFilteredQbItems(filtered);
        if (filtered.length === 0) {
            setShowListQbItems(false);
        }
        else {
            setShowListQbItems(true);
        }
    }, [searchTermQbItems, qbItems]);

    const handleSelectQbItem = (qbItem) => {
        setSearchTermQbItems(`${qbItem.fields.name} (ID: ${qbItem.fields.list_id})`);
        setQbSelectedItem(qbItem);
    };

    const handleSearchQbItem = (e) => {
        setQbSelectedItem(null);
        setSearchTermQbItems(e.target.value);
    };

    const handleClearSearch = () => {
        setQbSelectedItem(null);
        setSearchTermQbItems("");
    };

    const rowRenderer = ({ key, index, style }) => {
        const item = filteredQbItems[index];
        return (
            <StyledMenuItem key={key} style={style} value={item.fields.list_id} onClick={() => handleSelectQbItem(item)}>
                {item.fields.name}
            </StyledMenuItem>
        );
    };

    const handleBackNavigation = () => {
        if (localStorage.getItem('backNavigation') === 'invoice_details') {
            const invoice = JSON.parse(localStorage.getItem('invoice'));
            if (invoice) {
                if (!('fields' in invoice)) {
                    invoice['fields'] = invoice;
                }
            }
            const state = {
                invoice: invoice,
                invoices: JSON.parse(localStorage.getItem('invoices')),
                filteredInvoices: JSON.parse(localStorage.getItem('filteredInvoices')),
                filter: JSON.parse(localStorage.getItem('filterInvoices'))
            }
            navigate(`/integration/${localStorage.getItem('backNavigation')}`, { state: state });
        }
        else {
            navigate(-1);
        }
    };

    const handleMatchItem = (item_id, qb_item_list_id, action) => {
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
                            action: action,
                            username: localStorage.getItem('username')
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
                                            let filteredList = jsonData;
                                            if (filter === 'matched') {
                                                filteredList = jsonData.filter(i => i.fields.qb_list_id !== null && i.fields.qb_list_id !== '');
                                            }
                                            else if (filter === 'unmatched') {
                                                filteredList = jsonData.filter(i => !i.fields.qb_list_id || i.fields.qb_list_id === '');
                                            }
                                            const state = {
                                                item: values,
                                                items: jsonData,
                                                filteredItems: filteredList,
                                                filter: filter
                                            }
                                            setFilteredItems(filteredList);
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

    const configCustomFilter = {
        filter: filter,
        handleFilterChange: handleFilterChange,
        searchSelectTerm: searchSelectTerm,
        handleSearchSelectChange: handleSearchSelectChange,
        listValues: [
            { value: 'all', label: 'All Items' },
            { value: 'matched', label: 'Matched Items' },
            { value: 'unmatched', label: 'Unmatched Items' },
        ],
        hasSearch: true,
        searchPlaceholder: 'Search Item',
        marginBottomInDetails: '11px',
    };


    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Item Details' />
        );
    }

    if (error) {
        return (
            <AlertError isSmallScreen={isSmallScreen} error={error} />
        );
    }

    return (
        <Container maxWidth="lg"
            sx={{
                marginLeft: '-22%',
                marginRight: '-200%',
                marginTop: '3%',
                marginBottom: '-5%',
                transition: 'margin-left 0.3s ease',
                minWidth: '88vw',
                minHeigth: '100vh',
            }}>
            {/* <Container component="main" maxWidth="md" sx={{ mt: 5, p: 3, bgcolor: '#FFFFFF', boxShadow: 3, borderRadius: 2 }}> */}
            {!item ? (
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <Alert severity="warning">No item found.</Alert>
                    </Grid>
                    <Grid item xs={6} container>
                        <IconButton onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-end', mt: '-8px', color: 'error.main' }}>
                            <CloseIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            ) : (
                <Grid container spacing={2} sx={{ marginTop: '-35px', marginLeft: '-25px' }}>
                    <Grid item container xs={3} sx={{ borderRight: '1px solid #ddd' }}>
                        <Grid item container xs={12} spacing={1}>
                            <CustomFilter configCustomFilter={configCustomFilter} />
                            <TableContainer sx={{ maxHeight: 777, minHeight: 777, borderTop: '1px solid #ddd' }}>
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
                                                        <b>{filteredItem.fields.item_name}</b>
                                                        {filteredItem.fields.sku && (
                                                            <>
                                                                <br />
                                                                SKU: {filteredItem.fields.sku}
                                                            </>
                                                        )}
                                                        {filteredItem.fields.rate && (
                                                            <>
                                                                <br />
                                                                Rate: $ {filteredItem.fields.rate}
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell>No items found.</TableCell>
                                            </TableRow>
                                        )}
                                        <TableCustomPagination
                                            columnsLength={1}
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
                    <Grid item container xs={9}>
                        <Grid item container xs={12} spacing={1} style={{ marginBottom: '15px', minWidth: '100%' }}>
                            <Grid item xs={10}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        textTransform: 'uppercase',
                                        color: '#212529',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {item.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={2} container justifyContent="flex-end" spacing={1} sx={{ marginTop: '-1px' }}>
                                {localStorage.getItem('backNavigation') === 'invoice_details' && (
                                    <Grid item>
                                        <Tooltip
                                            title="Back to Invoice Details"
                                            arrow
                                            sx={{
                                                '& .MuiTooltip-tooltip': {
                                                    backgroundColor: '#000000',
                                                    color: 'white',
                                                    fontSize: '0.875rem'
                                                }
                                            }}
                                        >
                                            <IconButton onClick={() => handleBackNavigation()} sx={{ alignSelf: 'flex-end', mt: '-8px', color: '#000000' }}>
                                                <ArrowBackIcon />
                                            </IconButton>
                                        </Tooltip>

                                    </Grid>
                                )}
                                <Grid item>
                                    <Tooltip
                                        title="Back to List Items"
                                        arrow
                                        sx={{
                                            '& .MuiTooltip-tooltip': {
                                                backgroundColor: '#000000',
                                                color: 'white',
                                                fontSize: '0.875rem'
                                            }
                                        }}
                                    >
                                        <IconButton onClick={() => navigate("/integration/list_items")} sx={{ alignSelf: 'flex-end', mt: '-8px', color: '#000000' }}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                            <Grid item container xs={12} spacing={1} sx={{ maxHeight: 780, minHeight: 780, mt: 2, marginLeft: '-1.4%' }}>
                                <TableContainer
                                    sx={{
                                        maxHeight: 780,
                                        minHeight: 780,
                                        minWidth: '103.5%',
                                        maxWidth: '103.5%',
                                        borderTop: '1px solid #ddd',
                                        borderBottom: '1px solid #ddd',
                                        borderLeft: '1px solid #ddd',
                                        borderRight: '1px solid #ddd'
                                    }}
                                >
                                    <Table aria-label="item details table">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item ID</TableCell>
                                                <TableCell sx={{ border: 'none' }}><b>{item.item_id}</b></TableCell>
                                            </TableRow>
                                            {item.sku && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item SKU</TableCell>
                                                    <TableCell sx={{ border: 'none' }}><b>{item.sku}</b></TableCell>
                                                </TableRow>
                                            )}
                                            {item.rate && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item Rate</TableCell>
                                                    <TableCell sx={{ border: 'none' }}><b>$ {item.rate}</b></TableCell>
                                                </TableRow>
                                            )}
                                            {item.status && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item Status</TableCell>
                                                    <TableCell sx={{ border: 'none' }}><b>{item.status}</b></TableCell>
                                                </TableRow>
                                            )}
                                            {item.description && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Zoho Item Description</TableCell>
                                                    <TableCell sx={{ border: 'none' }}><b>{item.description}</b></TableCell>
                                                </TableRow>
                                            )}
                                            {item.qb_list_id && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>QB Item Info</TableCell>
                                                    <TableCell sx={{ border: 'none' }}>
                                                        QB List ID: <b>{item.qb_list_id}</b>
                                                        {item.qb_item && item.qb_item.name && (
                                                            <>
                                                                <br />
                                                                Matched QB Item: <b>{item.qb_item.name}</b>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ border: 'none', width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Coincidences by Order</TableCell>
                                                <TableCell sx={{ border: 'none' }}>
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
                                                                                    onClick={() => handleMatchItem(item.item_id, coincidence.qb_item_list_id, 'match')}>
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
                                                                onClick={() => handleMatchItem(item.item_id, item.qb_list_id, 'unmatch')}>
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
                                            {!item.matched ? (
                                                !loadingQbItems ? (
                                                    <TableRow>
                                                        <TableCell
                                                            component="th"
                                                            scope="row"
                                                            sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                        >
                                                            Force Matching
                                                        </TableCell>

                                                        <TableCell>
                                                            <FormControl variant="outlined" size="small" style={{ width: '100%' }}>
                                                                <TextField
                                                                    label={"Search QB Items (" + filteredQbItems.length + ")"}
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={searchTermQbItems}
                                                                    onChange={handleSearchQbItem}
                                                                    InputProps={{
                                                                        endAdornment: (
                                                                            <>
                                                                                {loading && <CircularProgress size={20} />}
                                                                                <InputAdornment position="end">
                                                                                    <IconButton
                                                                                        onClick={handleClearSearch}
                                                                                        edge="end"
                                                                                    >
                                                                                        <ClearIcon />
                                                                                    </IconButton>
                                                                                </InputAdornment>
                                                                            </>
                                                                        ),
                                                                        placeholder: undefined
                                                                    }}
                                                                    placeholder=''
                                                                />
                                                                {showListQbItems && (
                                                                    <div style={{ height: 200, width: '100%' }}>
                                                                        <AutoSizer>
                                                                            {({ height, width }) => (
                                                                                <List
                                                                                    width={width}
                                                                                    height={height}
                                                                                    rowCount={filteredQbItems.length}
                                                                                    rowHeight={50}
                                                                                    rowRenderer={rowRenderer}
                                                                                />
                                                                            )}
                                                                        </AutoSizer>
                                                                    </div>
                                                                )}
                                                                <Grid item>
                                                                    <br />
                                                                    <Button
                                                                        variant="contained"
                                                                        color="info"
                                                                        size="small"
                                                                        onClick={() => handleMatchItem(item.item_id, qbSelectedItem ? qbSelectedItem.fields.list_id : '', 'match')}
                                                                        disabled={qbSelectedItem === null}
                                                                    >
                                                                        Match
                                                                    </Button>
                                                                </Grid>
                                                            </FormControl>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    <TableRow>
                                                        <TableCell
                                                            component="th"
                                                            scope="row"
                                                            sx={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                        ></TableCell>
                                                        <TableCell>
                                                            <Alert severity="info"
                                                                style={{
                                                                    fontSize: '0.80rem',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                }}>
                                                                <b>Loading QB Items...</b>
                                                            </Alert>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            ) : null}
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
