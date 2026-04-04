import React, { useEffect, useState } from 'react';
import { AlertLoading } from '@/components/shared/AlertLoading';
import { AlertError } from '@/components/shared/AlertError';
import { apiUrl, fetchWithToken } from '@/lib/utils';
import { useWebSocket } from '@/lib/useWebSocket';
import CustomersList from './CustomersList';

const CustomersListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial HTTP fetch — shows loading spinner on first load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${apiUrl}/api_zoho_customers/list_customers/`;
        const response = await fetchWithToken(url, 'GET', null, {});
        const jsonData = JSON.parse(response.data);
        setCustomers(jsonData);
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(`Failed to fetch customers: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // WebSocket for live updates — silent refresh, no spinner
  useWebSocket({
    path: '/ws/customers/',
    onMessage: (data) => {
      if (data && typeof data === 'string') {
        try {
          setCustomers(JSON.parse(data));
        } catch {
          // ignore malformed data
        }
      }
    },
  });

  if (loading) return <AlertLoading message="Customers List" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] gap-4">
      <CustomersList customers={customers} />
    </div>
  );
};

export default CustomersListPage;
