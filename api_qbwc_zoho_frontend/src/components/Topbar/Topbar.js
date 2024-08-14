import React, { useEffect, useState } from 'react';
import {
    Toolbar,
    IconButton,
    TextField,
    Box,
    InputAdornment,
    MenuItem,
    Menu,
    ListItemIcon,
    Divider,
    Drawer,
    Typography,
    Grid,
    Tooltip,
    Tab,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Icon
} from '@mui/material';
import Badge from '@mui/material/Badge';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckIcon from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchWithToken } from '../../utils';
import CustomFilter from '../Utils/components/CustomFilter/CustomFilter';
import TableCustomPagination from '../Utils/components/TableCustomPagination/TableCustomPagination';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const Topbar = ({ handleLogout }) => {

    const username = localStorage.getItem('username') || 'Guest';

    const location = useLocation();

    const navigate = useNavigate();

    const [labelSearch, setLabelSearch] = useState('');
    const [visibleSearch, setVisibleSearch] = useState(false);
    const [searchTermGlobal, setSearchTermGlobal] = useState(localStorage.getItem('searchTermGlobal') || '');
    const [selectedOption, setSelectedOption] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [quantityUnreadNotifications, setQuantityUnreadNotifications] = useState(0);
    const [isDrawingUser, setIsDrawingUser] = useState(false);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleClose = () => {
        setDrawerOpen(false)
    };

    const toggleDrawer = (open, drawingUser) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsDrawingUser(drawingUser);
        setDrawerOpen(open);
    };

    const fetchNotifications = async () => {
        const request = {
            'username': localStorage.getItem('username')
        };
        const response = await fetchWithToken(`${apiUrl}/list_notifications/`, 'GET', request, {}, apiUrl);
        const data = response.data.data;
        const quantityUnread = response.data.quantity_unread;
        setNotifications(data);
        setQuantityUnreadNotifications(quantityUnread);
        console.log(data);
    };

    useEffect(() => {
        const currentPath = location.pathname;
        if (currentPath.includes('list_customers')) {
            setLabelSearch('Search Customers (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('list_items')) {
            setLabelSearch('Search Items (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('list_invoices')) {
            setLabelSearch('Search Invoices (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('qbwc/customers/list')) {
            setLabelSearch('Search QB Customers (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('qbwc/items/list')) {
            setLabelSearch('Search QB Items (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('qbwc/customers/never_match')) {
            setLabelSearch('Search QB Never Match Customers (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('qbwc/items/never_match')) {
            setLabelSearch('Search QB Never Match Items (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('list_users')) {
            setLabelSearch('Search Users (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('download_backup_db')) {
            setLabelSearch('Search Back Up (/)');
            setVisibleSearch(true);
        } else if (currentPath.includes('list_logs')) {
            setLabelSearch('Search Logs (/)');
            setVisibleSearch(true);
        } else {
            setLabelSearch('Search');
            setVisibleSearch(false);
        }
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 5000);
        return () => clearInterval(intervalId);
    }, [location]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (option) => {
        setSelectedOption(option);
        handleMenuClose();
        if (option === 'Customers') {
            navigate('/integration/list_customers');
        } else if (option === 'Items') {
            navigate('/integration/list_items');
        } else if (option === 'Invoices') {
            navigate('/integration/list_invoices');
        } else if (option === 'QB Customers') {
            navigate('/integration/qbwc/customers/list');
        } else if (option === 'QB Items') {
            navigate('/integration/qbwc/items/list');
        } else if (option === 'QB Never Match Customers') {
            navigate('/integration/qbwc/customers/never_match');
        } else if (option === 'QB Never Match Items') {
            navigate('/integration/qbwc/items/never_match');
        } else if (option === 'Users') {
            navigate('/integration/list_users');
        } else if (option === 'Back Ups') {
            navigate('/integration/download_backup_db');
        }
    };

    const handleSearchChange = (event) => {
        setSearchTermGlobal(event.target.value);
        localStorage.setItem('searchTermGlobal', event.target.value);
        window.dispatchEvent(new Event('storage'));
    };

    const logout = () => {
        handleClose();
        handleLogout();
    }

    const hangleCheckNotification = async (notification) => {
        const data = {
            'username': localStorage.getItem('username')
        };
        const response = await fetchWithToken(`${apiUrl}/check_read_notification/${notification.notification_id}`, 'POST', data, {}, apiUrl);
        if (response.status === 200) {
            handleClose();
            if (notification.notification_module !== 'backup') {
                navigate(`/integration/list_${notification.notification_module}`);
            } else {
                navigate(`/integration/download_backup_db`);
            }
        }
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = event => {
        setFilter(event.target.value);
        setPage(0);
    };

    const filteredNotifications = notifications.filter(item => {
        if (filter === 'all') return item;
        if (filter === 'unread') return !item.notification_is_read;
        if (filter === 'read') return item.notification_is_read;
        return item;
    });

    const configCustomFilter = {
        filter: filter,
        handleFilterChange: handleFilterChange,
        listValues: [
            { value: 'all', label: 'All Notifications' },
            { value: 'unread', label: 'Unread Notifications' },
            { value: 'read', label: 'Read Notifications' }
        ],
        hasSearch: false
    };

    return (
        <>
            <Toolbar sx={{ bgcolor: '#f7f7fe', position: 'relative', border: '1px solid #ddd', marginLeft: '225px' }}>
                <Box sx={{ flexGrow: 1 }}>
                    {visibleSearch && (
                        <TextField
                            label={labelSearch}
                            variant="outlined"
                            size="small"
                            sx={{ width: '30%' }}
                            onChange={handleSearchChange}
                            value={searchTermGlobal}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment
                                        position="start"
                                        onClick={handleMenuOpen}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        sx={{
                                            borderRadius: '5px 0 0 5px',
                                            padding: '0 8px',
                                            maxWidth: '40px'
                                        }}
                                    >
                                        <SearchIcon />
                                        <IconButton size="small">
                                            <ArrowDropDownIcon />
                                        </IconButton>
                                        <Divider
                                            orientation="vertical"
                                            flexItem
                                            sx={{ margin: '0 8px', color: 'black' }}
                                        />
                                    </InputAdornment>
                                ),
                                // endAdornment: (

                                // )
                            }}
                        />
                    )}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                        sx={{
                            mt: '20px',
                            ml: '-15px',
                        }}
                        style={{
                            width: '100%',
                            borderRadius: '5px 5px 5px 5px',
                        }}
                    >
                        {[
                            'Customers',
                            'Items',
                            'Invoices',
                            'QB Customers',
                            'QB Items',
                            'QB Never Match Customers',
                            'QB Never Match Items',
                            'Users',
                            'Back Ups'
                        ].map((option) => (
                            <MenuItem
                                key={option}
                                onClick={() => handleMenuItemClick(option)}
                                selected={selectedOption === option}
                                value={option.toLowerCase()}
                                sx={{
                                    backgroundColor: selectedOption === option ? 'lightgray' : 'inherit',
                                    '&.Mui-selected': {
                                        backgroundColor: 'lightgray',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: 'gray',
                                    },
                                }}
                            >
                                {option}
                                {selectedOption === option && (
                                    <ListItemIcon>
                                        <CheckIcon />
                                    </ListItemIcon>
                                )}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip
                        title="Tasks"
                        arrow
                        sx={{
                            '& .MuiTooltip-tooltip': {
                                backgroundColor: '#000000',
                                color: 'white',
                                fontSize: '0.875rem'
                            }
                        }}
                    >
                        <IconButton style={{ color: '#000000' }}>
                            <BarChartIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title="Notifications"
                        arrow
                        sx={{
                            '& .MuiTooltip-tooltip': {
                                backgroundColor: '#000000',
                                color: 'white',
                                fontSize: '0.875rem'
                            }
                        }}
                    >
                        <IconButton
                            style={{ color: '#000000' }}
                            onClick={toggleDrawer(true, false)}
                        >
                            <Badge badgeContent={quantityUnreadNotifications} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title="Configuration"
                        arrow
                        sx={{
                            '& .MuiTooltip-tooltip': {
                                backgroundColor: '#000000',
                                color: 'white',
                                fontSize: '0.875rem'
                            }
                        }}
                    >
                        <IconButton style={{ color: '#000000' }} component={Link} to='/integration/application_settings' size='small'>
                            <BuildIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title="Account"
                        arrow
                        sx={{
                            '& .MuiTooltip-tooltip': {
                                backgroundColor: '#000000',
                                color: 'white',
                                fontSize: '0.875rem'
                            }
                        }}
                    >
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={toggleDrawer(true, true)}
                            sx={{ borderRadius: '50%', padding: '6px', color: '#000000' }}
                        >
                            <AccountCircleIcon />
                            {/* {drawerOpen && isDrawingUser ? <ExpandLessIcon /> : ( isDrawingUser ? <ExpandMoreIcon /> : null)} */}
                            {isDrawingUser ? (drawerOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />) : null}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                sx={{
                    width: 400,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 400,
                        boxSizing: 'border-box',
                        paddingTop: '16px',
                        marginTop: '64px',
                        backgroundColor: '#f7f7fe',
                    }
                }}
            >
                <Box
                    sx={{
                        width: 350,
                        padding: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        backgroundColor: '#f7f7fe',
                    }}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={11}>
                            {isDrawingUser ? (
                                <Typography variant="H7">
                                    USER INFO
                                </Typography>
                            ) : (
                                <CustomFilter configCustomFilter={configCustomFilter} fontSize='18px' />
                            )}
                        </Grid>
                        <Grid item xs={1} sx={{ alignSelf: 'flex-end' }}>
                            <IconButton onClick={handleClose}
                                sx={{
                                    alignSelf: 'flex-end',
                                    mt: isDrawingUser ? '-15px' : '-45px',
                                    color: 'error.main'
                                }}>
                                <CloseIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    <Divider sx={{ marginY: 2, minWidth: '110%' }} />
                    {isDrawingUser ? (
                        <>
                            <Grid container spacing={1}>
                                <Grid item container xs={12}>
                                    <Grid item container spacing={1}>
                                        <Grid item xs={2}>
                                            <AccountCircleIcon />
                                        </Grid>
                                        <Grid item xs={10}>
                                            <Typography>
                                                User: <b>{username}</b>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Divider sx={{ marginY: 2, minWidth: '110%' }} />
                            <Grid container>
                                <Grid item container xs={12} justifyContent="flex-end">
                                    <Grid item justifyContent="flex-end" sx={{ mr: '-33px' }}>
                                        <IconButton onClick={() => logout()} sx={{ color: 'error.main' }}>
                                            <LogoutIcon />
                                            <Typography variant="caption">
                                                Sign out
                                            </Typography>
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <>
                            <TableContainer
                                sx={{
                                    minWidth: '115%',
                                    marginTop: '-16px',
                                    marginLeft: '-20px',
                                    marginRight: '-55px',
                                    maxHeight: '700px',
                                }}>
                                <Table aria-label="simple table">
                                    <TableBody>
                                        {filteredNotifications.map((notification, index) => (
                                            <TableRow key={index}
                                                sx={{
                                                    cursor: 'pointer',
                                                    backgroundColor: notification.notification_is_read ? 'inherit' : '#f0f0f0'
                                                }}
                                                onClick={() => hangleCheckNotification(notification)}
                                            >
                                                <TableCell>
                                                    <IconButton size='small'>
                                                        <NotificationsIcon />
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    <b>{notification.notification_message}</b><br />{notification.notification_modified}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableCustomPagination
                                            columnsLength={2}
                                            data={filteredNotifications}
                                            page={page}
                                            rowsPerPage={rowsPerPage}
                                            handleChangePage={handleChangePage}
                                            handleChangeRowsPerPage={handleChangeRowsPerPage}
                                        />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                </Box>
            </Drawer>
        </>
    );
};

export default Topbar;
