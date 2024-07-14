import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, Button, Alert, AlertTitle, Container } from '@mui/material';
import { Link } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_BACKEND_URL;
// const ZOHO_SCOPE_INVOICES = process.env.REACT_APP_ZOHO_SCOPE_INVOICES;
// const ZOHO_SCOPE_CUSTOMERS = process.env.REACT_APP_ZOHO_SCOPE_CUSTOMERS;
// const ZOHO_SCOPE_ITEMS = process.env.REACT_APP_ZOHO_SCOPE_ITEMS;

const MainContent = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleZohoOauth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/generate_auth_url/`, {
        method: 'GET',
        credentials: 'include',  // Asegúrate de incluir las credenciales
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch authentication URL');
      }
      const data = await response.json();
      window.location.href = data.auth_url; 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${apiUrl}/zoho_api_settings/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 5, p: 2, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 2 }}>
      <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                    borderBottom: '2px solid #2196F3',
                    paddingBottom: '8px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    color: '#2196F3',
                    fontWeight: 'bold',
                }}
      >
        Zoho - QBWC Integration
      </Typography>
      {config.connected ? (
        <Alert severity="success">
          <AlertTitle>Zoho Connection</AlertTitle>
          Zoho Connection: <strong>Connected</strong>
        </Alert>
      ) : (
        <Alert severity="warning">
          <AlertTitle>Warning</AlertTitle>
          You are currently not connected to Zoho.
        </Alert>
      )}
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!config.connected && (
          <Button
            variant="contained"
            color="success"
            component={Link}
            onClick={() => handleZohoOauth()}
            // to={`${apiUrl}/generate_auth_url`}
            sx={{ mb: 2 }}
            size='small'
          >
            Connect to Zoho
          </Button>
        )}
      </Box>

      <Grid>
          <Typography
                  sx={{
                      borderBottom: '2px solid #2196F3',
                      paddingBottom: '8px',
                      marginBottom: '20px',
                      color: '#2196F3',
                      fontWeight: 'bold',
                  }}
              ></Typography>
          <Grid item xs={6} container>
            <Grid item>
              <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/integration/application_settings" 
                  size='small'
                  sx={{ mb: 2 }}
                >
                  Settings
              </Button>
            </Grid>
          </Grid>
        </Grid>
      
    </Container>
  );
};

export default MainContent;
