import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import QbwcSimilarItemsList from '../QbwcSimilarItemsList/QbwcSimilarItemsList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const QbwcSimilarItemsListPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchItems = async () => {
        try {
            const url = `${apiUrl}/api_quickbook_soap/matching_items/`;
            const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
            if (response.status === 200) {
                setItems(response.data);
            } else {
                setError(`Failed to fetch items: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            setError(`Failed to fetch items: ${error}`);
        }  finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
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
                <QbwcSimilarItemsList similarItems={items} onSyncComplete={fetchItems}/>
            )}
        </Container>
    );
};

export default QbwcSimilarItemsListPage;
