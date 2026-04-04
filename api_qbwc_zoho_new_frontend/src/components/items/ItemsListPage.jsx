import React, { useEffect, useState } from 'react';
import AlertLoading from '@/components/shared/AlertLoading';
import AlertError from '@/components/shared/AlertError';
import { apiUrl, fetchWithToken } from '@/lib/utils';
import { useWebSocket } from '@/lib/useWebSocket';
import ItemsList from './ItemsList';

const ItemsListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial HTTP fetch — shows loading spinner on first load
  useEffect(() => {
    setLoading(true);

    const doFetch = async () => {
      try {
        const response = await fetchWithToken(
          `${apiUrl}/api_zoho_items/list_items/`,
          'GET',
          null,
          {}
        );
        setItems(response.data ? JSON.parse(response.data) : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    doFetch();
  }, []);

  // WebSocket for live updates — silent refresh, no spinner
  useWebSocket({
    path: '/ws/items/',
    onMessage: (data) => {
      if (Array.isArray(data)) {
        setItems(data);
      }
    },
  });

  if (loading) return <AlertLoading message="Items List" />;
  if (error) return <AlertError error={error} />;

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] gap-4">
      <ItemsList items={items} />
    </div>
  );
};

export default ItemsListPage;
