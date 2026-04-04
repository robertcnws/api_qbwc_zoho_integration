import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import QbwcNeverMatchedItemsList from './QbwcNeverMatchedItemsList'

const QbwcNeverMatchedItemsListPage = () => {
  const [neverMatchedItems, setNeverMatchedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNeverMatchedItems = async () => {
    try {
      const isNeverMatch = 'true'
      const response = await fetchWithToken(
        `${apiUrl}/api_quickbook_soap/qbwc_items/${isNeverMatch}`,
        'GET',
        null,
        {},
        apiUrl
      )
      const jsonData = JSON.parse(response.data)
      setNeverMatchedItems(jsonData)
    } catch (err) {
      console.error('Error fetching Never Matched Items:', err)
      setError(`Failed to fetch Never Matched Items: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNeverMatchedItems()
  }, [])

  if (loading) {
    return <AlertLoading message="QBWC Never Matched Items List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <QbwcNeverMatchedItemsList
        neverMatchedItems={neverMatchedItems}
        onSyncComplete={fetchNeverMatchedItems}
      />
    </div>
  )
}

export default QbwcNeverMatchedItemsListPage
