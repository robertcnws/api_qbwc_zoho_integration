import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import SalesOrdersList from '../SalesOrdersList/SalesOrdersList';
import dayjs from 'dayjs';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const SalesOrdersListPage = () => {
    const [salesOrders, setSalesOrders] = useState([]);
    const [configData, setConfigData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState(dayjs()); // Establece la fecha inicial en el estado
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchSalesOrders = useCallback(async () => {
        try {
            const url = `${apiUrl}/api_quickbook_soap/matched/sales_orders/custom/`;
            const params = {
                date: filterDate.format('YYYY-MM-DD')
            };
            const response = await fetchWithToken(url, 'GET', params, {}, apiUrl);
            const data = response.data;
            const config = {
                matchedNumber: data.matched_number,
                unmatchedNumber: data.unmatched_number,
                unprocessedNumber: data.unprocessed_number,
            };
            const sales_orders = JSON.parse(data.elements);
            setSalesOrders(sales_orders);
            setConfigData(config);
        } catch (error) {
            console.error('Error fetching sales orders:', error);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [filterDate]);

    useEffect(() => {
        fetchSalesOrders();
        const intervalId = setInterval(fetchSalesOrders, 5000);
        return () => clearInterval(intervalId);
    }, [fetchSalesOrders]);

    if (loading) return <AlertLoading isSmallScreen={isSmallScreen} message='Sales Orders List' />;
    if (error) return <AlertError isSmallScreen={isSmallScreen} error={error} />;

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
            <SalesOrdersList
                data={{ salesOrders }}
                configData={configData}
                onSyncComplete={fetchSalesOrders}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
            />
        </Box>
    );
};

export default SalesOrdersListPage;
