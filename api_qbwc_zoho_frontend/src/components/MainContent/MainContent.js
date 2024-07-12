import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { Link } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const MainContent = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${apiUrl}/zoho_api_settings/`);
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
    <Box>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>Zoho - QBWC Integration</Typography>
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
            to={config.auth_url} 
            sx={{ mb: 2 }}
            size='small'
          >
            Connect to Zoho
          </Button>
        )}
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
      </Box>
      
    </Box>
  );
};

export default MainContent;
