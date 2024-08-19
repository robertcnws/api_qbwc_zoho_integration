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
import './MainContent.css';

const apiUrl = process.env.REACT_APP_ENVIRONMENT === 'DEV' ? process.env.REACT_APP_BACKEND_URL_DEV : process.env.REACT_APP_BACKEND_URL_PROD;;

const MainContent = () => {
  const [config, setConfig] = useState({});
  const [invoicesHistoricStats, setInvoicesHistoricStats] = useState({});
  const [invoicesMonthlyStats, setInvoicesMonthlyStats] = useState([]);
  const [invoicesDailyStats, setInvoicesDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchInvoicesStats = async (element, module, setLoading, setData) => {
    try {
      const response = await fetchWithToken(`${apiUrl}/data/data_invoice_${module}_statistics/`, 'GET', null, {}, apiUrl);
      if (response.status !== 200) {
        throw new Error(`Failed to fetch: ${element}`);
      }
      const data = response.data;
      // console.log(data)
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    fetchInvoicesStats('Invoices Historic Statistics', 'historic', setLoading, setInvoicesHistoricStats);
    fetchInvoicesStats('Invoices Monthly Statistics', 'monthly', setLoading, setInvoicesMonthlyStats);
    fetchInvoicesStats('Invoices Daily Statistics', 'daily', setLoading, setInvoicesDailyStats);

  }, []);

  if (loading) {
    return (<AlertLoading isSmallScreen={isSmallScreen} />);
  }
  if (error) {
    return (<AlertError isSmallScreen={isSmallScreen} error={error} />);
  }

  return (
    // <Container
    //   component="main"
    //   maxWidth="lg"
    //   sx={{
    //     mt: '1%',

    //     bgcolor: 'white',
    //     minWidth: '87vw',
    //     minHeight: '45vh',
    //     maxHeight: '60vh',
    //     marginLeft: '-21%',
    //   }}
    // >
    //   <Grid container spacing={2}>
    //     <Grid item xs={12}>
    //       <Typography
    //         variant="h6"
    //         align="center"
    //         gutterBottom
    //         sx={{
    //           borderBottom: '2px solid #2196F3',
    //           paddingBottom: '8px',
    //           marginBottom: '20px',
    //           textTransform: 'uppercase',
    //           color: '#212529',
    //           fontWeight: 'bold',
    //         }}
    //       >
    //         Zoho - QBWC Integration
    //       </Typography>
    //     </Grid>
    //     <Grid item xs={12}>
    //       {config.connected ? (
    //         <Alert severity="success">
    //           <AlertTitle>Zoho Connection</AlertTitle>
    //           Zoho Connection: <strong>Connected</strong>
    //         </Alert>
    //       ) : (
    //         <Alert severity="warning">
    //           <AlertTitle>Warning</AlertTitle>
    //           You are currently not connected to Zoho.
    //         </Alert>
    //       )}
    //       <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    //         {!config.connected && (
    //           <Button
    //             variant="contained"
    //             color="success"
    //             component={Link}
    //             disabled={!config.zoho_connection_configured}
    //             onClick={() => handleZohoOauth()}
    //             // to={`${apiUrl}/generate_auth_url`}
    //             sx={{ mb: 2 }}
    //             size='small'
    //           >
    //             Connect to Zoho
    //           </Button>
    //         )}
    //         {!config.zoho_connection_configured && (
    //           <Alert severity="warning">
    //             <AlertTitle>Warning</AlertTitle>
    //             You need to configure the application settings before connecting to Zoho (Go to SETTINGS button).
    //           </Alert>
    //         )}
    //       </Box>
    //     </Grid>
    //     <Grid item container>
    //       <Grid item>
    //         <Typography
    //           sx={{
    //             borderBottom: '2px solid #2196F3',
    //             paddingBottom: '8px',
    //             marginBottom: '20px',
    //             color: '#2196F3',
    //             fontWeight: 'bold',
    //           }}
    //         ></Typography>
    //       </Grid>
    //     </Grid>
    //   </Grid>
    //   <Grid container spacing={1} style={{ height: '100%' }}>
    //     <Grid item xs={12} md={5}>
    //       <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
    //         <Typography variant="h6">Invoices Last 7 Days Statistics</Typography>
    //         <LineChartComponent data={invoicesDailyStats} />
    //       </Paper>
    //     </Grid>
    //     <Grid item xs={12} md={3}>
    //       <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
    //         <Typography variant="h6">Invoices Historic Statistics</Typography>
    //         <PieChartComponent data={invoicesHistoricStats} />
    //       </Paper>
    //     </Grid>
    //     <Grid item xs={12} md={4}>
    //       <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
    //         <Typography variant="h6">Invoices Last 5 Months Statistics</Typography>
    //         <BarChartComponent data={invoicesMonthlyStats} />
    //       </Paper>
    //     </Grid>
    //   </Grid>
    //   <Typography
    //     sx={{
    //       borderBottom: '2px solid #2196F3',
    //       paddingBottom: '8px',
    //       marginBottom: '20px',
    //       color: '#2196F3',
    //       fontWeight: 'bold',
    //     }}
    //   ></Typography>
    // </Container>
    <Box className="main-content">

      <Box className="form-header">
        <Typography variant="h6" sx={{ paddingTop: '10px', paddingLeft: '10px' }}>Zoho - QBWC Integration</Typography>
      </Box>

      <Container sx={{
        paddingTop: '20px',
        backgroundColor: '#F9F9FB',
        minWidth: '85.7vw',
        borderRight: '1px solid #ddd',
      }}>
        <Grid container spacing={2}>
          
          <Grid item xs={12}>
            {config.connected ? (
              <Alert severity="success" sx={{ border: '1px solid #ddd'}}>
                <AlertTitle>Zoho Connection</AlertTitle>
                Zoho Connection: <strong>Connected</strong>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ border: '1px solid #ddd'}}>
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
          </Grid>
        </Grid>
        <Grid container spacing={1} style={{ height: '625px' }}>
          <Grid item xs={12} md={5}>
            <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
              <Typography variant="h6">Invoices Last 7 Days Statistics</Typography>
              <LineChartComponent data={invoicesDailyStats} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
              <Typography variant="h6">Invoices Historic Statistics</Typography>
              <PieChartComponent data={invoicesHistoricStats} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
              <Typography variant="h6">Invoices Last 5 Months Statistics</Typography>
              <BarChartComponent data={invoicesMonthlyStats} />
            </Paper>
          </Grid>
        </Grid>
        <Typography
          sx={{
            paddingBottom: '8px',
            marginBottom: '20px',
          }}
        ></Typography>
      </Container>
    </Box>
  );
};

export default MainContent;
