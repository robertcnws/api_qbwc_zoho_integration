import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import QbwcCustomersList from '../QbwcCustomersList/QbwcCustomersList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const QbwcCustomersListPage = () => {
    const [customers, setCustomers] = useState([]);
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



    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} />
        );
    }

    if (error) {
        return (
            <AlertError isSmallScreen={isSmallScreen} error={error}/>
        );
    }

    

    return (
        <Container maxWidth="lg"
            sx={{
                mt: 5,
                p: 2,
                marginLeft: isSmallScreen ? '0' : '3%',
                transition: 'margin-left 0.3s ease', 
            }}
        >
            {loading ? (
                <CircularProgress />
            ) : (
                <QbwcCustomersList customers={customers} onSyncComplete={fetchCustomers}/>
            )}
        </Container>
    );
};

export default QbwcCustomersListPage;
