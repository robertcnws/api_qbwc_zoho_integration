import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import { useWebSocket } from '@/lib/useWebSocket'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import QbwcCustomersList from './QbwcCustomersList'

const QbwcCustomersListPage = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCustomers = async () => {
    try {
      const isNeverMatch = 'false'
      const url = `${apiUrl}/api_quickbook_soap/qbwc_customers/${isNeverMatch}`
      const response = await fetchWithToken(url, 'GET', null, {}, apiUrl)
      const jsonData = JSON.parse(response.data)
      setCustomers(jsonData)
    } catch (err) {
      console.error('Error fetching qb customers:', err)
      setError(`Failed to fetch qn customers: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  // Initial HTTP fetch
  useEffect(() => {
    fetchCustomers()
  }, [])

  // WebSocket for live updates — silent refresh, no spinner
  useWebSocket({
    path: '/ws/qbwc_customers/',
    onMessage: (data) => {
      if (data && typeof data === 'string') {
        try {
          setCustomers(JSON.parse(data))
        } catch {
          // ignore malformed data
        }
      }
    },
  })

  if (loading) {
    return <AlertLoading message="QBWC Customers List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <QbwcCustomersList customers={customers} onSyncComplete={fetchCustomers} />
    </div>
  )
}

export default QbwcCustomersListPage
