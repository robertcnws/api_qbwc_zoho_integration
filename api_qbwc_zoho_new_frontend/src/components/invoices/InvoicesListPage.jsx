import React, { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import AlertLoading from '@/components/shared/AlertLoading';
import AlertError from '@/components/shared/AlertError';
import { apiUrl, fetchWithToken } from '@/lib/utils';
import InvoicesList from './InvoicesList';

const InvoicesListPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [configData, setConfigData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(() => {
    const saved = localStorage.getItem('invoicesListFilterDate');
    if (saved) {
      const d = dayjs(saved);
      if (d.isValid()) return d;
    }
    return dayjs().subtract(1, 'day');
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetchWithToken(
        `${apiUrl}/api_quickbook_soap/matched/invoices/stock/`,
        'GET',
        { date: filterDate.format('YYYY-MM-DD') },
        {}
      );
      const data = response.data;
      setInvoices(data.elements ? JSON.parse(data.elements) : []);
      setConfigData({
        matchedNumber: data.matched_number,
        unmatchedNumber: data.unmatched_number,
        unprocessedNumber: data.unprocessed_number,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchInvoices();
    const intervalId = setInterval(fetchInvoices, 5000);
    return () => clearInterval(intervalId);
  }, [fetchInvoices]);

  if (loading) return <AlertLoading message="Invoices List" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] gap-4">
      <InvoicesList
        data={{ invoices }}
        configData={configData}
        onSyncComplete={fetchInvoices}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
      />
    </div>
  );
};

export default InvoicesListPage;
