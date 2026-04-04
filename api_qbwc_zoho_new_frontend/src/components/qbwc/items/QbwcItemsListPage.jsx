import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import { useWebSocket } from '@/lib/useWebSocket'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import QbwcItemsList from './QbwcItemsList'

const QbwcItemsListPage = () => {
  const [items, setItems] = useState([])
  const [zohoItems, setZohoItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchItems = async () => {
    try {
      const isNeverMatch = 'false'
      const response = await fetchWithToken(
        `${apiUrl}/api_quickbook_soap/qbwc_items/${isNeverMatch}`,
        'GET',
        null,
        {},
        apiUrl
      )
      const jsonData = JSON.parse(response.data)
      setItems(jsonData)
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(`Failed to fetch items: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  // Initial HTTP fetch
  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    const fetchZohoItems = async () => {
      try {
        const url = `${apiUrl}/api_zoho_items/list_items/`
        const response = await fetchWithToken(url, 'GET', null, {}, apiUrl)
        const jsonData = JSON.parse(response.data)
        setZohoItems(jsonData)
      } catch (err) {
        console.error('Error fetching zoho items:', err)
        setError(`Failed to fetch items: ${err}`)
      }
    }
    fetchZohoItems()
  }, [])

  // WebSocket for live updates — silent refresh, no spinner
  useWebSocket({
    path: '/ws/qbwc_items/',
    onMessage: (data) => {
      if (data && typeof data === 'string') {
        try {
          setItems(JSON.parse(data))
        } catch {
          // ignore malformed data
        }
      }
    },
  })

  if (loading) {
    return <AlertLoading message="QBWC Items List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <QbwcItemsList items={items} zohoItems={zohoItems} onSyncComplete={fetchItems} />
    </div>
  )
}

export default QbwcItemsListPage
