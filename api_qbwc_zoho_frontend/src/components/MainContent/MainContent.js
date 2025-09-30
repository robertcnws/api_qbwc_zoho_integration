import React, { useEffect, useState } from 'react';
import { alpha, lighten } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { AlertLoading } from '../Utils/components/AlertLoading/AlertLoading';
import { AlertError } from '../Utils/components/AlertError/AlertError';
import { fetchWithToken } from '../../utils';

import PieChartComponent from '../DataCharts/components/PieChartComponent/PieChartComponent';
import BarChartComponent from '../DataCharts/components/BarChartComponent/BarChartComponent';
import LineChartComponent from '../DataCharts/components/LineChartComponent/LineChartComponent';

// import './MainContent.css'; // Evita estilos que rompan tamaños/espaciados

const SAFE_COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];

const apiUrl =
  process.env.REACT_APP_ENVIRONMENT === 'DEV'
    ? process.env.REACT_APP_BACKEND_URL_DEV
    : process.env.REACT_APP_BACKEND_URL_PROD;

const Card = ({ children, onClick, sx }) => (
  <Box
    onClick={onClick}
    sx={[
      {
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 1,
        bgcolor: 'background.paper',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? { transform: 'translateY(-2px)', boxShadow: 3 }
          : undefined,
      },
      sx,
    ]}
  >
    {children}
  </Box>
);

const Panel = ({ title, children, sx }) => (
  <Card
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      minHeight: 280,
      ...sx,
    }}
  >
    <Typography variant="subtitle2">{title}</Typography>
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</Box>
  </Card>
);

const StatCard = ({ title, iconUp, valueNode, onClick, color = 'default' }) => (
  <Card
    onClick={onClick}
    sx={(theme) => {
      const isDefault = color === 'default';
      const colorKey = SAFE_COLORS.includes(color) ? color : 'primary';
      const slot = theme.palette[colorKey];
      const lightBase = slot.light ?? lighten(slot.main, 0.05);
      const lighter = alpha(lightBase, 0.2);

      console.log('isDefault:', isDefault, 'colorKey:', colorKey, 'slot:', slot, 'lightBase:', lightBase, 'lighter:', lighter);

      return {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 60,
        gap: 1,
        bgcolor: isDefault ? theme.palette.background.paper : lighter,
        border: '1px solid',
        borderColor: isDefault ? theme.palette.divider : alpha(slot.main, 0.12),
      };
    }}
  >
    <Typography variant="subtitle2">{title}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      {iconUp}
      {valueNode}
    </Box>
  </Card>
);

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
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const fetchStats = async (element, model, module, setLoadingFn, setData) => {
    try {
      const response = await fetchWithToken(
        `${apiUrl}/api_zoho_statistics/data/data_${model}_${module}_statistics/`,
        'GET',
        null,
        {},
        apiUrl
      );
      if (response.status !== 200) {
        throw new Error(`Failed to fetch: ${element}`);
      }
      const data = response.data;
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingFn(false);
    }
  };

  const handleZohoOauth = async () => {
    setLoading(true);
    try {
      const response = await fetchWithToken(
        `${apiUrl}/generate_auth_url/`,
        'GET',
        null,
        {},
        apiUrl
      );
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
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetchWithToken(
          `${apiUrl}/zoho_api_settings/`,
          'GET',
          null,
          {},
          apiUrl
        );
        if (response.status !== 200) {
          throw new Error('Failed to fetch configuration');
        }
        const data = response.data;
        setConfig(data);
        localStorage.setItem('zohoConnectionConfigured', data.zoho_connection_configured);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    fetchAllStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <AlertLoading isSmallScreen={isSmallScreen} />;
  if (error) return <AlertError isSmallScreen={isSmallScreen} error={error} />;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        bgcolor: '#F9F9FB',
        p: 0,
        gap: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ px: 0.5, pt: 0.5 }}>
        <Typography variant="h6">Zoho - QBWC Integration</Typography>
      </Box>

      {/* Alerts + Connect */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {config.connected ? (
          <Alert severity="success" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <AlertTitle>Zoho Connection</AlertTitle>
            Zoho Connection: <strong>Connected</strong>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <AlertTitle>Warning</AlertTitle>
            You are currently not connected to Zoho.
          </Alert>
        )}

        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {!config.connected && (
            <Button
              variant="contained"
              color="success"
              component={Link}
              disabled={!config.zoho_connection_configured}
              onClick={() => handleZohoOauth()}
              size="small"
            >
              Connect to Zoho
            </Button>
          )}
          {!config.zoho_connection_configured && (
            <Alert severity="warning" sx={{ width: '100%' }}>
              <AlertTitle>Warning</AlertTitle>
              You need to configure the application settings before connecting to Zoho (Go to SETTINGS button).
            </Alert>
          )}
        </Box>
      </Box>

      {/* Stats Cards Row */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(6, 1fr)',
          },
        }}
      >
        {invoicesTrendStats && (
          <StatCard
            title={`Trending Matched (Total: ${invoicesTrendStats.total})`}
            onClick={() => navigate('/integration/list_invoices')}
            iconUp={
              invoicesTrendStats.trend.direction === 'up' ? (
                <ArrowUpwardIcon color="success" />
              ) : (
                <ArrowDownwardIcon color="error" />
              )
            }
            valueNode={
              <Typography
                variant="body2"
                sx={{
                  color:
                    invoicesTrendStats.trend.direction === 'up'
                      ? 'success.main'
                      : 'error.main',
                }}
              >
                <b>{invoicesTrendStats.trend.change}</b> (Last Week: {invoicesTrendStats.trend.previous_week})
              </Typography>
            }
            color='success'
          />
        )}

        {customersTrendStats && (
          <StatCard
            title="Trending New Zoho Customers"
            onClick={() => navigate('/integration/list_customers')}
            iconUp={
              customersTrendStats.trend.direction === 'up' ? (
                <ArrowUpwardIcon color="success" />
              ) : (
                <ArrowDownwardIcon color="error" />
              )
            }
            valueNode={
              <Typography
                variant="body2"
                sx={{
                  color:
                    customersTrendStats.trend.direction === 'up'
                      ? 'success.main'
                      : 'error.main',
                }}
              >
                <b>{customersTrendStats.trend.change}</b> (Last Week: {customersTrendStats.trend.previous_week})
              </Typography>
            }
            color='secondary'
          />
        )}

        {itemsTrendStats && (
          <StatCard
            title="Trending New Zoho Items"
            onClick={() => navigate('/integration/list_items')}
            iconUp={
              itemsTrendStats.trend.direction === 'up' ? (
                <ArrowUpwardIcon color="success" />
              ) : (
                <ArrowDownwardIcon color="error" />
              )
            }
            valueNode={
              <Typography
                variant="body2"
                sx={{
                  color:
                    itemsTrendStats.trend.direction === 'up'
                      ? 'success.main'
                      : 'error.main',
                }}
              >
                <b>{itemsTrendStats.trend.change}</b> (Last Week: {itemsTrendStats.trend.previous_week})
              </Typography>
            }
            color='info'
          />
        )}

        {customersMatchedStats && (
          <StatCard
            title="Statistics Matched Customers"
            onClick={() => navigate('/integration/list_customers')}
            iconUp={
              parseInt(customersMatchedStats.trend.per_cent_matched, 10) > 50 ? (
                <ArrowUpwardIcon color="success" />
              ) : (
                <ArrowDownwardIcon color="error" />
              )
            }
            valueNode={
              <Typography
                variant="body2"
                sx={{
                  color:
                    parseInt(customersMatchedStats.trend.per_cent_matched, 10) > 50
                      ? 'success.main'
                      : 'error.main',
                }}
              >
                <b>{customersMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {customersMatchedStats.trend.per_cent_not_matched} %)
              </Typography>
            }
            color='warning'
          />
        )}

        {itemsMatchedStats && (
          <StatCard
            title="Statistics Matched Items"
            onClick={() => navigate('/integration/list_items')}
            iconUp={
              parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50 ? (
                <ArrowUpwardIcon color="success" />
              ) : (
                <ArrowDownwardIcon color="error" />
              )
            }
            valueNode={
              <Typography
                variant="body2"
                sx={{
                  color:
                    parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50
                      ? 'success.main'
                      : 'error.main',
                }}
              >
                <b>{itemsMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {itemsMatchedStats.trend.per_cent_not_matched} %)
              </Typography>
            }
            color='error'
          />
        )}

        {itemsMatchedStats && (
          <StatCard
            title="QBWC General Info"
            onClick={() => navigate('/integration/qbwc')}
            iconUp={
              parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50 ? (
                <ArrowUpwardIcon color="success" />
              ) : (
                <ArrowDownwardIcon color="error" />
              )
            }
            valueNode={
              <Typography
                variant="body2"
                sx={{
                  color:
                    parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50
                      ? 'success.main'
                      : 'error.main',
                }}
              >
                <b>{itemsMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {itemsMatchedStats.trend.per_cent_not_matched} %)
              </Typography>
            }
            color='primary'
          />
        )}
      </Box>

      {/* Charts Row (5/3/4 columnas en md+, apilado en xs) */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: '5fr 3fr 4fr',
          },
          alignItems: 'stretch',
        }}
      >
        <Panel title="Invoices Last 7 Days Statistics" sx={{ minHeight: 320 }}>
          <LineChartComponent data={invoicesDailyStats} />
        </Panel>

        <Panel title="Invoices Historic Statistics" sx={{ minHeight: 320 }}>
          <PieChartComponent data={invoicesHistoricStats} />
        </Panel>

        <Panel title="Invoices Last 5 Months Statistics" sx={{ minHeight: 320 }}>
          <BarChartComponent data={invoicesMonthlyStats} />
        </Panel>
      </Box>
    </Box>
  );
};

export default MainContent;
