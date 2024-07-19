import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Button, 
  Alert, 
  AlertTitle, 
  Container, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AlertLoading } from '../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../Utils/components/AlertError/AlertError';
import { clearLocalStorage, fetchWithToken } from '../../utils';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

const MainContent = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleZohoOauth = async () => {
    setLoading(true);
    try {
      const response = await fetchWithToken(`${apiUrl}/generate_auth_url/`, 'GET', null, {}, apiUrl);
      if (response.status !== 200) {
        throw new Error('Failed to fetch authentication URL');
      }
      const data = await response.data;
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
        const response = await fetchWithToken(`${apiUrl}/zoho_api_settings/`, 'GET', null, {}, apiUrl);
        if (response.status !== 200) {
          throw new Error('Failed to fetch configuration');
        }
        const data = response.data;
        setConfig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading){
    return (<AlertLoading isSmallScreen={isSmallScreen} />);
  } 
  if (error) {
    return (<AlertError isSmallScreen={isSmallScreen} error={error} />);
  }

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
