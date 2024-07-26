import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import QbwcMatchedCustomersList from '../QbwcMatchedCustomersList/QbwcMatchedCustomersList';
import { AlertLoading } from '../../../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../../../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../../../utils';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;

const QbwcMatchedCustomersListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchCustomers = async () => {
      try {
          const url = `${apiUrl}/api_quickbook_soap/matched_customers/`;
          const response = await fetchWithToken(url, 'GET', null, {}, apiUrl);
          if (response.status === 200) {
              setCustomers(response.data);
          } else {
              setError(`Failed to fetch customers: ${response.statusText}`);
          }
      } catch (error) {
          console.error('Error fetching customers:', error);
          setError(`Failed to fetch customers: ${error}`);
      }  finally {
          setLoading(false);
      }
  };

    useEffect(() => {
        fetchCustomers();
    }, []);

    if (loading) {
        return (
            <AlertLoading isSmallScreen={isSmallScreen} message='QBWC Matched Customers List'/>
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
                <QbwcMatchedCustomersList matchedCustomers={customers} onSyncComplete={fetchCustomers} />
            )}
        </Container>
    );
};

export default QbwcMatchedCustomersListPage;
