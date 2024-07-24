import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Button, 
  Alert, 
  AlertTitle, 
  Container,
  Paper,
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AlertLoading } from '../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../utils';
import PieChartComponent from '../DataCharts/components/PieChartComponent/PieChartComponent';
import BarChartComponent from '../DataCharts/components/BarChartComponent/BarChartComponent';
import LineChartComponent from '../DataCharts/components/LineChartComponent/LineChartComponent';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

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
        localStorage.setItem('zohoConnectionConfigured', data.zoho_connection_configured)
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

  const lineData = {
    labels: ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F', 'Page G'],
    datasets: [
      {
        label: 'UV',
        data: [4000, 3000, 2000, 2780, 1890, 2390, 3490],
        borderColor: '#8884d8',
        backgroundColor: 'rgba(136, 132, 216, 0.2)',
      },
      {
        label: 'PV',
        data: [2400, 1398, 9800, 3908, 4800, 3800, 4300],
        borderColor: '#82ca9d',
        backgroundColor: 'rgba(130, 202, 157, 0.2)',
      },
    ],
  };

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [4000, 3000, 5000, 4000, 6000, 4700],
        backgroundColor: '#8884d8',
      },
    ],
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 5, p: 2, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 2, minWidth:'100%', minHeight: '100%' }}>
      <Grid container spacing={2}>
          <Grid item xs={12}>
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
          </Grid>
          <Grid item xs={12}>
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
                  disabled={!config.zoho_connection_configured}
                  onClick={() => handleZohoOauth()}
                  // to={`${apiUrl}/generate_auth_url`}
                  sx={{ mb: 2 }}
                  size='small'
                >
                  Connect to Zoho
                </Button>
              )}
              {!config.zoho_connection_configured && (
                <Alert severity="warning">
                  <AlertTitle>Warning</AlertTitle>
                  You need to configure the application settings before connecting to Zoho (Go to SETTINGS button).
                </Alert>
              )}
            </Box>        
          </Grid>
          <Grid item container> 
            <Grid item>
              <Typography
                    sx={{
                        borderBottom: '2px solid #2196F3',
                        paddingBottom: '8px',
                        marginBottom: '20px',
                        color: '#2196F3',
                        fontWeight: 'bold',
                    }}
                ></Typography>
              </Grid>
              <Grid item container>
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
        </Grid>
        <Grid container spacing={1} style={{ height: '100%' }}>
          <Grid item xs={12} md={5}>
            <Paper elevation={3} style={{ padding: 5, minHeight: '100mv' }}>
              <Typography variant="h6">Line Chart</Typography>
              <LineChartComponent data={lineData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper elevation={3} style={{ padding: 5, minHeight: '50mv' }}>
              <Typography variant="h6">Pie Chart</Typography>
              <PieChartComponent />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} style={{ padding: 5, minHeight: '100mv' }}>
              <Typography variant="h6">Bar Chart</Typography>
              <BarChartComponent data={barData} />
            </Paper>
          </Grid>
        </Grid>
        <Typography
                    sx={{
                        borderBottom: '2px solid #2196F3',
                        paddingBottom: '8px',
                        marginBottom: '20px',
                        color: '#2196F3',
                        fontWeight: 'bold',
                    }}
                ></Typography>
    </Container>
  );
};

export default MainContent;
