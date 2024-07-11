import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, AlertTitle, List, ListItemButton, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';

const MainContent = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api_qbwc_zoho/zoho_api_settings/');
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
    <Box sx={{ marginLeft: 250, padding: 2, width: '100%' }}>
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
            to={config.auth_url}  // Use the auth_url from the configuration
            sx={{ mb: 2 }}
          >
            Connect to Zoho
          </Button>
        )}
        <List>
          <ListItemButton component={Link} to="/customers">
            <ListItemText primary="View Customers" />
          </ListItemButton>
          <ListItemButton component={Link} to="/items">
            <ListItemText primary="View Items" />
          </ListItemButton>
          <ListItemButton component={Link} to="/invoices">
            <ListItemText primary="View Invoices" />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );
};

export default MainContent;
