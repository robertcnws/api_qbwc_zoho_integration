import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import QbwcNeverMatchedItemsList from '../QbwcNeverMatchedItemsList/QbwcNeverMatchedItemsList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const QbwcNeverMatchedItemsListPage = () => {
    const [neverMatchedItems, setNeverMatchedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchNeverMatchedItems = async () => {
        try {
            const isNeverMatch = 'true';
            const response = await fetchWithToken(`${apiUrl}/api_quickbook_soap/qbwc_items/${isNeverMatch}`, 'GET', null, {}, apiUrl);
            const jsonData = JSON.parse(response.data);
            setNeverMatchedItems(jsonData);
        } catch (error) {
            console.error('Error fetching Never Matched Items:', error);
            setError(`Failed to fetch Never Matched Items: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNeverMatchedItems();
    }, []);

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='QBWC Never Matched Items List' />
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
                mt: 5,
                p: 2,
                marginLeft: isSmallScreen ? '0' : '3%',
                transition: 'margin-left 0.3s ease',
            }}
        >
            {loading ? (
                <CircularProgress />
            ) : (
                <QbwcNeverMatchedItemsList neverMatchedItems={neverMatchedItems} onSyncComplete={fetchNeverMatchedItems} />
            )}
        </Container>
    );
};

export default QbwcNeverMatchedItemsListPage;
