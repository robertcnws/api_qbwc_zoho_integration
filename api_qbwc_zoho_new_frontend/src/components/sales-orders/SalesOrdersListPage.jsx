import React, { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import AlertLoading from '@/components/shared/AlertLoading';
import AlertError from '@/components/shared/AlertError';
import { apiUrl, fetchWithToken } from '@/lib/utils';
import SalesOrdersList from './SalesOrdersList';

const SalesOrdersListPage = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [configData, setConfigData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(() => {
    const saved = localStorage.getItem('salesOrdersListFilterDate');
    if (saved) {
      const d = dayjs(saved);
      if (d.isValid()) return d;
    }
    return dayjs().subtract(1, 'day');
  });

  const fetchSalesOrders = useCallback(async () => {
    try {
      const response = await fetchWithToken(
        `${apiUrl}/api_quickbook_soap/matched/sales_orders/custom/`,
        'GET',
        { date: filterDate.format('YYYY-MM-DD') },
        {}
      );
      const data = response.data;
      setSalesOrders(data.elements ? JSON.parse(data.elements) : []);
      setConfigData({
        matchedNumber: data.matched_number,
        unmatchedNumber: data.unmatched_number,
        unprocessedNumber: data.unprocessed_number,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchSalesOrders();
    const intervalId = setInterval(fetchSalesOrders, 5000);
    return () => clearInterval(intervalId);
  }, [fetchSalesOrders]);

  if (loading) return <AlertLoading message="Sales Orders List" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] gap-4">
      <SalesOrdersList
        data={{ salesOrders }}
        configData={configData}
        onSyncComplete={fetchSalesOrders}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
      />
    </div>
  );
};

export default SalesOrdersListPage;
