import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';
import LoggingList from '../LoggingList/LoggingList';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const LoggingListPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchData = async () => {
        try {
            const response = await fetchWithToken(`${apiUrl}/list_loggings/`, 'GET', null, {}, apiUrl);
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching loggings:', error);
            setError(`Failed to fetch loggings: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
      fetchData();
    }, []);

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='Users List'/>
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
                <LoggingList logs={logs} onSyncComplete={fetchData}/>
            )}
        </Container>
    );
};

export default LoggingListPage;
