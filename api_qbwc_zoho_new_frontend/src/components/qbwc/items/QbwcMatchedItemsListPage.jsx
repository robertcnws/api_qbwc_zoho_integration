import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import QbwcMatchedItemsList from './QbwcMatchedItemsList'

const QbwcMatchedItemsListPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchItems = async () => {
    try {
      const url = `${apiUrl}/api_quickbook_soap/matched_items/`
      const response = await fetchWithToken(url, 'GET', null, {}, apiUrl)
      if (response.status === 200) {
        setItems(response.data)
      } else {
        setError(`Failed to fetch items: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(`Failed to fetch items: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  if (loading) {
    return <AlertLoading message="QBWC Matched Items List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <QbwcMatchedItemsList matchedItems={items} onSyncComplete={fetchItems} />
    </div>
  )
}

export default QbwcMatchedItemsListPage
