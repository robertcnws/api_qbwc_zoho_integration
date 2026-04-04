import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import LoggingList from './LoggingList'

const LoggingListPage = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      const response = await fetchWithToken(`${apiUrl}/list_loggings/`, 'GET', null, {}, apiUrl)
      setLogs(response.data)
    } catch (err) {
      console.error('Error fetching loggings:', err)
      setError(`Failed to fetch loggings: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <AlertLoading message="Logs List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <LoggingList logs={logs} onSyncComplete={fetchData} />
    </div>
  )
}

export default LoggingListPage
