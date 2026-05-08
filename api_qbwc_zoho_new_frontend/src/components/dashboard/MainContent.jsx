import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertLoading } from '@/components/shared/AlertLoading';
import { AlertError } from '@/components/shared/AlertError';
import { apiUrl, fetchWithToken } from '@/lib/utils';

import PieChartComponent from '@/components/charts/PieChartComponent';
import BarChartComponent from '@/components/charts/BarChartComponent';
import LineChartComponent from '@/components/charts/LineChartComponent';
import RadialMatchChart from '@/components/charts/RadialMatchChart';
import AreaChartComponent from '@/components/charts/AreaChartComponent';
import ComposedChartComponent from '@/components/charts/ComposedChartComponent';

// ── Internal primitives ─────────────────────────────────────────────────────

const Card = ({ children, onClick, className = '' }) => (
  <div
    onClick={onClick}
    className={[
      'p-3 rounded-xl border border-border shadow-sm bg-background',
      'transition-transform duration-100',
      onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : '',
      className,
    ].join(' ')}
  >
    {children}
  </div>
);

const Panel = ({ title, children }) => (
  <Card className="flex flex-col gap-2 min-h-[280px]">
    <p className="text-sm font-semibold">{title}</p>
    <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
  </Card>
);

const colorMap = {
  success: 'bg-green-50 border-green-200',
  secondary: 'bg-purple-50 border-purple-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
  error: 'bg-red-50 border-red-200',
  primary: 'bg-indigo-50 border-indigo-200',
  default: 'bg-background border-border',
};

const trendColorMap = {
  up: 'text-green-600',
  down: 'text-red-600',
};

const StatCard = ({ title, direction, valueNode, onClick, color = 'default' }) => {
  const bgClass = colorMap[color] ?? colorMap.default;
  const arrowColor = direction === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <Card
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center min-h-[60px] gap-2 border ${bgClass}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {direction === 'up'
          ? <ArrowUp size={16} className={arrowColor} />
          : <ArrowDown size={16} className={arrowColor} />
        }
        {valueNode}
      </div>
    </Card>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

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
  const [customersMonthlyStats, setCustomersMonthlyStats] = useState([]);
  const [itemsMonthlyStats, setItemsMonthlyStats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchStats = async (element, model, module, setData) => {
    try {
      // Send the client's local date so server-side filters are not affected
      // by container/host clock or timezone drift.
      const now = new Date();
      const clientToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const response = await fetchWithToken(
        `${apiUrl}/api_zoho_statistics/data/data_${model}_${module}_statistics/?today=${clientToday}`,
        'GET',
        null,
        {}
      );
      if (response.status !== 200) throw new Error(`Failed to fetch: ${element}`);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleZohoOauth = async () => {
    setLoading(true);
    try {
      const response = await fetchWithToken(`${apiUrl}/generate_auth_url/`, 'GET', null, {});
      if (response.status !== 200) throw new Error('Failed to fetch authentication URL');
      window.location.href = response.data.auth_url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStats = () => {
    fetchStats('Invoices Historic Statistics', 'invoice', 'historic', setInvoicesHistoricStats);
    fetchStats('Invoices Monthly Statistics', 'invoice', 'monthly', setInvoicesMonthlyStats);
    fetchStats('Invoices Daily Statistics', 'invoice', 'daily', setInvoicesDailyStats);
    fetchStats('Invoices Trend Statistics', 'invoice', 'trend', setInvoicesTrendStats);
    fetchStats('Customers Trend Statistics', 'customer', 'trend', setCustomersTrendStats);
    fetchStats('Items Trend Statistics', 'item', 'trend', setItemsTrendStats);
    fetchStats('Customers Matched Statistics', 'customer', 'matched', setCustomersMatchedStats);
    fetchStats('Items Matched Statistics', 'item', 'matched', setItemsMatchedStats);
    fetchStats('Customers Monthly Statistics', 'customer', 'monthly', setCustomersMonthlyStats);
    fetchStats('Items Monthly Statistics', 'item', 'monthly', setItemsMonthlyStats);
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetchWithToken(`${apiUrl}/zoho_api_settings/`, 'GET', null, {});
        if (response.status !== 200) throw new Error('Failed to fetch configuration');
        setConfig(response.data);
        localStorage.setItem('zohoConnectionConfigured', response.data.zoho_connection_configured);
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

  if (loading) return <AlertLoading message="Dashboard" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] gap-4">
      {/* Header */}
      <div className="px-0.5 pt-0.5">
        <h2 className="text-lg font-semibold">Zoho - QBWC Integration</h2>
      </div>

      {/* Connection alerts */}
      <div className="flex flex-col gap-2 w-full">
        {config.connected ? (
          <Alert className="border border-border bg-green-50">
            <AlertTitle>Zoho Connection</AlertTitle>
            <AlertDescription>
              Zoho Connection: <strong>Connected</strong>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border border-border bg-amber-50">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>You are currently not connected to Zoho.</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-2 mt-0.5">
          {!config.connected && (
            <Button
              variant="default"
              size="sm"
              disabled={!config.zoho_connection_configured}
              onClick={handleZohoOauth}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Connect to Zoho
            </Button>
          )}
          {!config.zoho_connection_configured && (
            <Alert className="w-full bg-amber-50 border border-amber-200">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                You need to configure the application settings before connecting to Zoho (Go to SETTINGS button).
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {invoicesTrendStats && (
          <StatCard
            title={`Trending Matched (Total: ${invoicesTrendStats.total})`}
            direction={invoicesTrendStats.trend.direction}
            onClick={() => navigate('/integration/list_invoices')}
            valueNode={
              <span className={`text-sm ${trendColorMap[invoicesTrendStats.trend.direction]}`}>
                <b>{invoicesTrendStats.trend.change}</b> (Last Week: {invoicesTrendStats.trend.previous_week})
              </span>
            }
            color="success"
          />
        )}

        {customersTrendStats && (
          <StatCard
            title="Trending New Zoho Customers"
            direction={customersTrendStats.trend.direction}
            onClick={() => navigate('/integration/list_customers')}
            valueNode={
              <span className={`text-sm ${trendColorMap[customersTrendStats.trend.direction]}`}>
                <b>{customersTrendStats.trend.change}</b> (Last Week: {customersTrendStats.trend.previous_week})
              </span>
            }
            color="secondary"
          />
        )}

        {itemsTrendStats && (
          <StatCard
            title="Trending New Zoho Items"
            direction={itemsTrendStats.trend.direction}
            onClick={() => navigate('/integration/list_items')}
            valueNode={
              <span className={`text-sm ${trendColorMap[itemsTrendStats.trend.direction]}`}>
                <b>{itemsTrendStats.trend.change}</b> (Last Week: {itemsTrendStats.trend.previous_week})
              </span>
            }
            color="info"
          />
        )}

        {customersMatchedStats && (
          <StatCard
            title="Statistics Matched Customers"
            direction={parseInt(customersMatchedStats.trend.per_cent_matched, 10) > 50 ? 'up' : 'down'}
            onClick={() => navigate('/integration/list_customers')}
            valueNode={
              <span className={`text-sm ${parseInt(customersMatchedStats.trend.per_cent_matched, 10) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                <b>{customersMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {customersMatchedStats.trend.per_cent_not_matched} %)
              </span>
            }
            color="warning"
          />
        )}

        {itemsMatchedStats && (
          <StatCard
            title="Statistics Matched Items"
            direction={parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50 ? 'up' : 'down'}
            onClick={() => navigate('/integration/list_items')}
            valueNode={
              <span className={`text-sm ${parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                <b>{itemsMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {itemsMatchedStats.trend.per_cent_not_matched} %)
              </span>
            }
            color="error"
          />
        )}

        {itemsMatchedStats && (
          <StatCard
            title="QBWC General Info"
            direction={parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50 ? 'up' : 'down'}
            onClick={() => navigate('/integration/qbwc')}
            valueNode={
              <span className={`text-sm ${parseInt(itemsMatchedStats.trend.per_cent_matched, 10) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                <b>{itemsMatchedStats.trend.per_cent_matched} %</b> (Unmatched: {itemsMatchedStats.trend.per_cent_not_matched} %)
              </span>
            }
            color="primary"
          />
        )}
      </div>

      {/* Charts row 1 — Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-[5fr_3fr_4fr] gap-4 items-stretch">
        <Panel title="Invoices Last 7 Days Statistics">
          <LineChartComponent data={invoicesDailyStats} />
        </Panel>

        <Panel title="Invoices Historic Statistics">
          <PieChartComponent data={invoicesHistoricStats} />
        </Panel>

        <Panel title="Invoices Last 5 Months Statistics">
          <BarChartComponent data={invoicesMonthlyStats} showLabels />
        </Panel>
      </div>

      {/* Charts row 2 — Customers & Items */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_5fr_4fr] gap-4 items-stretch">
        <Panel title="Match Rate Overview">
          <RadialMatchChart
            customersStats={customersMatchedStats}
            itemsStats={itemsMatchedStats}
          />
        </Panel>

        <Panel title="Customers Last 5 Months">
          <AreaChartComponent data={customersMonthlyStats} xKey="month" />
        </Panel>

        <Panel title="Items Last 5 Months">
          <ComposedChartComponent data={itemsMonthlyStats} xKey="month" />
        </Panel>
      </div>
    </div>
  );
};

export default MainContent;
