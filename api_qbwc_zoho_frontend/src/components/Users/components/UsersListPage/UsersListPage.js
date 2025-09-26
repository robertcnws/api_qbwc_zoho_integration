import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme, Box } from '@mui/material';
import UsersList from '../UsersList/UsersList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const UsersListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchUsers = async () => {
        try {
            const response = await fetchWithToken(`${apiUrl}/list_users`, 'GET', null, {}, apiUrl);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(`Failed to fetch users: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Users List' />
        );
    }

    if (error) {
        return (
            <AlertError isSmallScreen={isSmallScreen} error={error} />
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                bgcolor: '#F9F9FB',
                p: { xs: 1.5, md: 2 },
                gap: 2,
            }}
        >
            {loading ? (
                <CircularProgress />
            ) : (
                <UsersList users={users} onSyncComplete={fetchUsers} />
            )}
        </Box>
    );
};

export default UsersListPage;
