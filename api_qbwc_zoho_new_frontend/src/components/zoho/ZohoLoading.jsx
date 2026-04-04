import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Package, Receipt, List, ChevronDown, TriangleAlert, X, CalendarIcon } from 'lucide-react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { apiUrl, fetchWithToken } from '@/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const ZohoLoading = () => {
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(false);
  const [lastDateLoadedCustomers, setLastDateLoadedCustomers] = useState(null);
  const [lastDateLoadedItems, setLastDateLoadedItems] = useState(null);
  const [lastDateLoadedInvoices, setLastDateLoadedInvoices] = useState(null);
  const [lastDateLoadedSalesOrders, setLastDateLoadedSalesOrders] = useState(null);
  const [error, setError] = useState(null);
  const [optionInvoices, setOptionInvoices] = useState(null);
  const [optionSalesOrders, setOptionSalesOrders] = useState(null);
  const [calendarOpenInvoices, setCalendarOpenInvoices] = useState(false);
  const [calendarOpenSalesOrders, setCalendarOpenSalesOrders] = useState(false);
  const navigate = useNavigate();

  const isAnyLoading = loadingCustomers || loadingItems || loadingInvoices || loadingSalesOrders;
  const zohoConnectionConfigured = localStorage.getItem('zohoConnectionConfigured');

  const today = dayjs();
  const oneYearAgo = today.subtract(1, 'year');

  const loadData = async (element, module, endpoint, setLoading) => {
    setLoading(true);
    try {
      const option = element === 'invoices' ? optionInvoices : optionSalesOrders;
      const data =
        element === 'invoices' || element === 'sales_orders'
          ? { option, username: localStorage.getItem('username') }
          : { username: localStorage.getItem('username') };
      const response = await fetchWithToken(`${apiUrl}/${module}/${endpoint}/`, 'POST', data, {});
      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Failed to load data: ${module}`);
      }
      navigate(`/integration/list_${element}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCustomers = () => loadData('customers', 'api_zoho_customers', 'load_customers', setLoadingCustomers);
  const handleLoadItems = () => loadData('items', 'api_zoho_items', 'load_items', setLoadingItems);
  const handleLoadInvoices = () => loadData('invoices', 'api_zoho_invoices', 'load_invoices', setLoadingInvoices);
  const handleLoadSalesOrders = () => loadData('sales_orders', 'api_zoho_sales_orders', 'load_sales_orders', setLoadingSalesOrders);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/zoho_loading/`);
        setLastDateLoadedCustomers(response.data.zoho_loading_customers.zoho_record_updated);
        setLastDateLoadedItems(response.data.zoho_loading_items.zoho_record_updated);
        setLastDateLoadedInvoices(response.data.zoho_loading_invoices.zoho_record_updated);
        setLastDateLoadedSalesOrders(response.data.zoho_loading_sales_orders.zoho_record_updated || null);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(`Failed to fetch items: ${err}`);
      }
    };
    fetchData();
  }, []);

  const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY') : null);
  const formatTime = (date) => (date ? dayjs(date).format('hh:mm a') : null);

  const LoadCard = ({ icon: Icon, title, loading, onLoad, disabled, lastDate, optionLabel, onOption, optionItems, calendarOpen, setCalendarOpen }) => (
    <div className="bg-white shadow-sm rounded border flex flex-col min-h-[200px] p-4 items-center gap-3">
      <div className="flex items-center gap-2 pt-2">
        <div className="bg-blue-100 rounded p-1">
          <Icon size={18} className="text-blue-600" />
        </div>
        <span className="font-bold text-sm">{title}</span>
      </div>

      <div className="flex items-center gap-1">
        {optionItems ? (
          <>
            <Button
              size="sm"
              disabled={disabled || !optionLabel}
              onClick={onLoad}
            >
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Load {optionLabel || '...'}
            </Button>
            {!loading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="px-1">
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {optionItems.map((opt) => (
                    <DropdownMenuItem key={opt.value} onClick={() => onOption(opt.value)}>
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => setCalendarOpen(true)}>
                    <CalendarIcon size={14} className="mr-2" />
                    Select Date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <span />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={(date) => {
                    if (date) {
                      onOption(dayjs(date).format('YYYY-MM-DD'));
                      setCalendarOpen(false);
                    }
                  }}
                  fromDate={oneYearAgo.toDate()}
                  toDate={today.toDate()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        ) : (
          <Button size="sm" disabled={disabled} onClick={onLoad}>
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {loading ? `Loading ${title}...` : `Load ${title}`}
          </Button>
        )}
      </div>

      {lastDate && (
        <Alert className="text-xs py-1 px-2 bg-amber-50 border-amber-300">
          <TriangleAlert size={12} className="inline mr-1 text-amber-600" />
          <AlertDescription>
            Last loaded:<br />
            Date: <b>{formatDate(lastDate)}</b><br />
            Time: <b>{formatTime(lastDate)}</b>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const invoiceOptions = [
    { value: 'Yesterday', label: 'Yesterday' },
    { value: 'Today', label: 'Today' },
  ];

  const salesOrderOptions = [
    { value: 'Yesterday', label: 'Yesterday' },
    { value: 'Today', label: 'Today' },
  ];

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded px-4 py-3">
        <h2 className="text-lg font-bold text-center flex-1">Load data from Zoho</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/integration')}
          title="Back to Integration"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Load cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-2 pb-4">
        <LoadCard
          icon={Users}
          title="Customers"
          loading={loadingCustomers}
          onLoad={handleLoadCustomers}
          disabled={isAnyLoading || !zohoConnectionConfigured}
          lastDate={lastDateLoadedCustomers}
        />
        <LoadCard
          icon={Package}
          title="Items"
          loading={loadingItems}
          onLoad={handleLoadItems}
          disabled={isAnyLoading || !zohoConnectionConfigured}
          lastDate={lastDateLoadedItems}
        />
        <LoadCard
          icon={Receipt}
          title="Invoices"
          loading={loadingInvoices}
          onLoad={handleLoadInvoices}
          disabled={isAnyLoading || !zohoConnectionConfigured || optionInvoices === null}
          lastDate={lastDateLoadedInvoices}
          optionLabel={optionInvoices}
          onOption={setOptionInvoices}
          optionItems={invoiceOptions}
          calendarOpen={calendarOpenInvoices}
          setCalendarOpen={setCalendarOpenInvoices}
        />
        <LoadCard
          icon={List}
          title="Orders"
          loading={loadingSalesOrders}
          onLoad={handleLoadSalesOrders}
          disabled={isAnyLoading || !zohoConnectionConfigured || optionSalesOrders === null}
          lastDate={lastDateLoadedSalesOrders}
          optionLabel={optionSalesOrders}
          onOption={setOptionSalesOrders}
          optionItems={salesOrderOptions}
          calendarOpen={calendarOpenSalesOrders}
          setCalendarOpen={setCalendarOpenSalesOrders}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ZohoLoading;
