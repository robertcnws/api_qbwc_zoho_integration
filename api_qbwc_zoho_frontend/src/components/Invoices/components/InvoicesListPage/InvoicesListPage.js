import React, { useEffect, useState, useCallback } from 'react';
import { Container, useMediaQuery, useTheme } from '@mui/material';
import InvoicesList from '../InvoicesList/InvoicesList';
import axios from 'axios';
import dayjs from 'dayjs';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const InvoicesListPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDate, setFilterDate] = useState(dayjs()); // Establece la fecha inicial en el estado
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchInvoices = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/api_quickbook_soap/matched_invoices/`, {
                params: { date: filterDate.format('YYYY-MM-DD') }
            });
            const data = response.data;
            const invoices = JSON.parse(data.invoices);
            setInvoices(invoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError(error); // Actualiza el estado de error
        } finally {
            setLoading(false);
        }
    }, [filterDate]);  {/* Añade filterDate como dependencia */}

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);  {/* Solo `fetchInvoices` en el array de dependencias */}

    if (loading) return <AlertLoading isSmallScreen={isSmallScreen} />;
    if (error) return <AlertError isSmallScreen={isSmallScreen} error={error} />;

    return (
        <Container maxWidth="lg"
            sx={{
                mt: 5,
                p: 2,
                marginLeft: isSmallScreen ? '0' : '3%',
                transition: 'margin-left 0.3s ease',
            }}
        >
            <InvoicesList
                data={{ invoices }}
                onSyncComplete={fetchInvoices}
                filterDate={filterDate} // Pasa filterDate al componente hijo
                setFilterDate={setFilterDate} // Pasa setFilterDate al componente hijo
            />
        </Container>
    );
};

export default InvoicesListPage;
