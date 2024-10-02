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
import { useNavigate, Link } from 'react-router-dom';
import { AlertLoading } from '../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../Utils/components/AlertError/AlertError';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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
  const [invoicesTrendStats, setInvoicesTrendStats] = useState(null);
  const [customersTrendStats, setCustomersTrendStats] = useState(null);
  const [itemsTrendStats, setItemsTrendStats] = useState(null);
  const [customersMatchedStats, setCustomersMatchedStats] = useState(null);
  const [itemsMatchedStats, setItemsMatchedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchStats = async (element, model, module, setLoading, setData) => {
    try {
      const response = await fetchWithToken(`${apiUrl}/api_zoho_statistics/data/data_${model}_${module}_statistics/`, 'GET', null, {}, apiUrl);
      if (response.status !== 200) {
        throw new Error(`Failed to fetch: ${element}`);
      }
      const data = response.data;
      console.log(module, data)
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

  const fetchAllStats = () => {
    fetchStats('Invoices Historic Statistics', 'invoice', 'historic', setLoading, setInvoicesHistoricStats);
    fetchStats('Invoices Monthly Statistics', 'invoice', 'monthly', setLoading, setInvoicesMonthlyStats);
    fetchStats('Invoices Daily Statistics', 'invoice', 'daily', setLoading, setInvoicesDailyStats);
    fetchStats('Invoices Trend Statistics', 'invoice', 'trend', setLoading, setInvoicesTrendStats);
    fetchStats('Customers Trend Statistics', 'customer', 'trend', setLoading, setCustomersTrendStats);
    fetchStats('Items Trend Statistics', 'item', 'trend', setLoading, setItemsTrendStats);
    fetchStats('Customers Matched Statistics', 'customer', 'matched', setLoading, setCustomersMatchedStats);
    fetchStats('Items Matched Statistics', 'item', 'matched', setLoading, setItemsMatchedStats);
  }


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
    fetchAllStats();

  }, []);



  if (loading) {
    return (<AlertLoading isSmallScreen={isSmallScreen} />);
  }
  if (error) {
    return (<AlertError isSmallScreen={isSmallScreen} error={error} />);
  }

  return (
    <Box className="main-content" sx={{ display: 'flex-column' }}>

      <Box className="form-header">
        <Typography variant="h6" sx={{ paddingTop: '10px', paddingLeft: '10px' }}>Zoho - QBWC Integration</Typography>
      </Box>

      <Box sx={{
        paddingTop: '10px',
        backgroundColor: '#F9F9FB',
        minWidth: '100%',
        maxWidth: '100%',
        // maxHeight: '70vh',
        borderRight: '1px solid #ddd',
      }}>
        <Grid container spacing={2}>

          <Grid item xs={12}>
            {config.connected ? (
              <Alert severity="success" sx={{ border: '1px solid #ddd' }}>
                <AlertTitle>Zoho Connection</AlertTitle>
                Zoho Connection: <strong>Connected</strong>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ border: '1px solid #ddd' }}>
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


        <Grid container spacing={2} sx={{ marginTop: '-65px', paddingTop: 0 }}>
          {invoicesTrendStats && (
            <Grid item xs={12} sm={2} md={2}>
              <Paper elevation={3} style={{ padding: 5, height: '100%', cursor: 'pointer' }} onClick={() => navigate('/integration/list_invoices')}>
                <Typography variant="h7">Trending Matched: (Total: <b>{invoicesTrendStats.total}</b>)</Typography>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  {invoicesTrendStats.trend.direction === 'up' ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  <Typography variant="body1" sx={{ color: invoicesTrendStats.trend.direction === 'up' ? 'success.main' : 'error.main' }}>
                    <b>{invoicesTrendStats.trend.change}</b> (Last Week: {invoicesTrendStats.trend.previous_week})
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {customersTrendStats && (
            <Grid item xs={12} sm={2} md={2}>
              <Paper elevation={3} style={{ padding: 5, height: '100%', cursor: 'pointer' }} onClick={() => navigate('/integration/list_customers')}>
                <Typography variant="h7">Trending New Zoho Customers</Typography>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  {customersTrendStats.trend.direction === 'up' ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  <Typography variant="body1" sx={{ color: customersTrendStats.trend.direction === 'up' ? 'success.main' : 'error.main' }}>
                    <b>{customersTrendStats.trend.change}</b> (Last Week: {customersTrendStats.trend.previous_week})
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {itemsTrendStats && (
            <Grid item xs={12} sm={2} md={2}>
              <Paper elevation={3} style={{ padding: 5, height: '100%', cursor: 'pointer' }} onClick={() => navigate('/integration/list_items')}>
                <Typography variant="h7">Trending New Zoho Items</Typography>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  {itemsTrendStats.trend.direction === 'up' ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  <Typography variant="body1" sx={{ color: itemsTrendStats.trend.direction === 'up' ? 'success.main' : 'error.main' }}>
                    <b>{itemsTrendStats.trend.change}</b> (Last Week: {itemsTrendStats.trend.previous_week})
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {customersMatchedStats && (
            <Grid item xs={12} sm={2} md={2}>
              <Paper elevation={3} style={{ padding: 5, height: '100%', cursor: 'pointer' }} onClick={() => navigate('/integration/list_customers')}>
                <Typography variant="h7">Statistics Matched Customers</Typography>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  {parseInt(customersMatchedStats.trend.per_cent_matched) > 50 ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  <Typography variant="body1" sx={{ color: parseInt(customersMatchedStats.trend.per_cent_matched) > 50 ? 'success.main' : 'error.main' }}>
                    <b>{customersMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {customersMatchedStats.trend.per_cent_not_matched} %)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {itemsMatchedStats && (
            <Grid item xs={12} sm={2} md={2}>
              <Paper elevation={3} style={{ padding: 5, height: '100%', cursor: 'pointer' }} onClick={() => navigate('/integration/list_items')}>
                <Typography variant="h7">Statistics Matched Items</Typography>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  {parseInt(itemsMatchedStats.trend.per_cent_matched) > 50 ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  <Typography variant="body1" sx={{ color: parseInt(itemsMatchedStats.trend.per_cent_matched) > 50 ? 'success.main' : 'error.main' }}>
                    <b>{itemsMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {itemsMatchedStats.trend.per_cent_not_matched} %)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {itemsMatchedStats && (
            <Grid item xs={12} sm={2} md={2}>
              <Paper elevation={3} style={{ padding: 5, height: '100%', cursor: 'pointer' }} onClick={() => navigate('/integration/qbwc')}>
                <Typography variant="h7">QBWC General Info</Typography>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                  {parseInt(itemsMatchedStats.trend.per_cent_matched) > 50 ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  <Typography variant="body1" sx={{ color: parseInt(itemsMatchedStats.trend.per_cent_matched) > 50 ? 'success.main' : 'error.main' }}>
                    <b>{itemsMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {itemsMatchedStats.trend.per_cent_not_matched} %)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

        </Grid>


        <Grid container spacing={1} style={{ height: '590px' }} sx={{ marginTop: '15px', paddingTop: 0 }}>
          <Grid item xs={12} md={5}>
            <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
              <Typography variant="h7">Invoices Last 7 Days Statistics</Typography>
              <LineChartComponent data={invoicesDailyStats} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
              <Typography variant="h7">Invoices Historic Statistics</Typography>
              <PieChartComponent data={invoicesHistoricStats} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} style={{ padding: 5, height: '65%' }}>
              <Typography variant="h7">Invoices Last 5 Months Statistics</Typography>
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
      </Box>
    </Box>
  );
};

export default MainContent;
