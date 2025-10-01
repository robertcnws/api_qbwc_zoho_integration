import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme, Box } from '@mui/material';
import QbwcCustomersList from '../QbwcCustomersList/QbwcCustomersList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const QbwcCustomersListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [zohoCustomers, setZohoCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchCustomers = async () => {
        try {
            const isNeverMatch = 'false';
            const url = `${apiUrl}/api_quickbook_soap/qbwc_customers/${isNeverMatch}`;
            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
            const jsonData = JSON.parse(response.data);
            setCustomers(jsonData);
        } catch (error) {
            console.error('Error fetching qb customers:', error);
            setError(`Failed to fetch qn customers: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        const fetchZohoCustomers = async () => {
            try {
                const url = `${apiUrl}/api_zoho_customers/list_customers/`;
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                const jsonData = JSON.parse(response.data);
                setZohoCustomers(jsonData);
            } catch (error) {
                console.error('Error fetching Zoho customers:', error);
                setError(`Failed to fetch Zoho customers: ${error}`);
            }
        };
        fetchZohoCustomers();
    }, []);

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='QBWC Customers List' />
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
                p: 0,
                gap: 2,
                overflowX: 'hidden',
            }}
        >
            {loading ? (
                <CircularProgress />
            ) : (
                <QbwcCustomersList
                    customers={customers}
                    zohoCustomers={zohoCustomers}
                    onSyncComplete={fetchCustomers}
                />
            )}
        </Box>
    );
};

export default QbwcCustomersListPage;
