import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme, Box } from '@mui/material';
import CustomersList from '../CustomersList/CustomersList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const CustomersListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = `${apiUrl}/api_zoho_customers/list_customers/`
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                const jsonData = JSON.parse(response.data);
                setCustomers(jsonData);
            } catch (error) {
                console.error('Error fetching customers:', error);
                setError(`Failed to fetch customers: ${error}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Customers List' />
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
                <CustomersList customers={customers} />
            )}
        </Box>
    );
};

export default CustomersListPage;
