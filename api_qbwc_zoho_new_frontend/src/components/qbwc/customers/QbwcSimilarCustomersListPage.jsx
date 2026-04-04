import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import QbwcSimilarCustomersList from './QbwcSimilarCustomersList'

const QbwcSimilarCustomersListPage = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCustomers = async () => {
    try {
      const url = `${apiUrl}/api_quickbook_soap/matching_customers/`
      const response = await fetchWithToken(url, 'GET', null, {}, apiUrl)
      if (response.status === 200) {
        setCustomers(response.data)
      } else {
        setError(`Failed to fetch customers: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(`Failed to fetch customers: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return <AlertLoading message="QBWC Similar Customers List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <QbwcSimilarCustomersList similarCustomers={customers} onSyncComplete={fetchCustomers} />
    </div>
  )
}

export default QbwcSimilarCustomersListPage
