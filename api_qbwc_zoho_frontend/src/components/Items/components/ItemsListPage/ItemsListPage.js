import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, Alert, useMediaQuery, useTheme } from '@mui/material';
import ItemsList from '../ItemsList/ItemsList'; // Importa el componente ItemsList
// import { getCsrfToken } from '../../../../utils';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_BACKEND_URL

const ItemsListPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        axios.get(`${apiUrl}/api_zoho_items/list_items/`)
            .then(response => {
                setItems(response.data);
            })
            .catch(error => {
                console.error('Error fetching items:', error);
                setError(`Failed to fetch items: ${error}`);
            })
            .finally(() => {
                setLoading(false);
            })
    }, []);

    if (loading) {
        return (
            <Alert severity="info" xs={12}>
                Loading...
            </Alert>
        );
    }

    if (error) {
        return (
            <Alert severity="danger" xs={12}>
                {error}
            </Alert>
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
                <ItemsList items={items} />
            )}
        </Container>
    );
};

export default ItemsListPage;
