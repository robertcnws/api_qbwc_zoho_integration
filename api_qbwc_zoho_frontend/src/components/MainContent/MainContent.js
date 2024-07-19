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
import { clearLocalStorage, fetchWithToken } from '../../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

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

  const lineData = [
    { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
  ];
  
  const barData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 5000 },
    { name: 'Apr', sales: 4000 },
    { name: 'May', sales: 6000 },
  ];

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 5, p: 2, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 2, minWidth:'100%', minHeight: '100%' }}>
      <Grid container xs={6}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 20 }}>
            <Typography variant="h6">Line Chart</Typography>
            <LineChart width={500} height={300} data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="uv" stroke="#8884d8" />
              <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
            </LineChart>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 20 }}>
            <Typography variant="h6">Bar Chart</Typography>
            <BarChart width={500} height={300} data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </Paper>
        </Grid>
      </Grid>
      </Grid>
      <Grid container xs={6}>
        <Grid item>
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
        <Grid item container>
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
      </Grid>
      
    </Container>
  );
};

export default MainContent;
