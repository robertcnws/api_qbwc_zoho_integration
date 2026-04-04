import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import QbwcNeverMatchedCustomersList from './QbwcNeverMatchedCustomersList'

const QbwcNeverMatchedCustomersListPage = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCustomers = async () => {
    try {
      const isNeverMatch = 'true'
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

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return <AlertLoading message="QBWC Never Matched Customers List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <QbwcNeverMatchedCustomersList customers={customers} onSyncComplete={fetchCustomers} />
    </div>
  )
}

export default QbwcNeverMatchedCustomersListPage
