import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import CustomersList from '../CustomersList/CustomersList';
import axios from 'axios';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';

const apiUrl = process.env.REACT_APP_BACKEND_URL

const CustomersListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        axios.get(`${apiUrl}/api_zoho_customers/list_customers/`)
            .then(response => {
                const jsonData = JSON.parse(response.data); 
                console.log(jsonData);
                setCustomers(jsonData);  
            })
            .catch(error => {
                console.error('Error fetching customers:', error);
                setError(`Failed to fetch customers: ${error}`);
            })
            .finally(() => {
                setLoading(false);
            })
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
                <CustomersList customers={customers} />
            )}
        </Container>
    );
};

export default CustomersListPage;
