import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme, Box } from '@mui/material';
import ItemsList from '../ItemsList/ItemsList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const ItemsListPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = `${apiUrl}/api_zoho_items/list_items/`;
                const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
                const jsonData = JSON.parse(response.data);
                setItems(jsonData);
            } catch (error) {
                console.error('Error fetching items:', error);
                setError(`Failed to fetch items: ${error}`);
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
            <AlertLoading isSmallScreen={isSmallScreen} message='Items List' />
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
            }}
        >
            {loading ? (
                <CircularProgress />
            ) : (
                <ItemsList items={items} />
            )}
        </Box>
    );
};

export default ItemsListPage;
