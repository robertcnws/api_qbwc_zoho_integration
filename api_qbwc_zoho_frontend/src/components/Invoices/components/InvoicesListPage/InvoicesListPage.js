import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import InvoicesList from '../InvoicesList/InvoicesList';
import dayjs from 'dayjs';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const InvoicesListPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [configData, setConfigData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState(dayjs()); // Establece la fecha inicial en el estado
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchInvoices = useCallback(async () => {
        try {
            const url = `${apiUrl}/api_quickbook_soap/matched/invoices/stock/`;
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
            const invoices = JSON.parse(data.elements);
            setInvoices(invoices);
            setConfigData(config);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [filterDate]);

    useEffect(() => {
        fetchInvoices();
        const intervalId = setInterval(fetchInvoices, 5000);
        return () => clearInterval(intervalId);
    }, [fetchInvoices]);

    if (loading) return <AlertLoading isSmallScreen={isSmallScreen} message='Invoices List' />;
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
            <InvoicesList
                data={{ invoices }}
                configData={configData}
                onSyncComplete={fetchInvoices}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
            />
        </Box>
    );
};

export default InvoicesListPage;
