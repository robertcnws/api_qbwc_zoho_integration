import React, { useEffect, useState } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import AlertLoading from '@/components/shared/AlertLoading'
import AlertError from '@/components/shared/AlertError'
import UsersList from './UsersList'

const UsersListPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = async () => {
    try {
      const response = await fetchWithToken(`${apiUrl}/list_users/`, 'GET', null, {}, apiUrl)
      setUsers(response.data)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(`Failed to fetch users: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return <AlertLoading message="Users List" />
  }

  if (error) {
    return <AlertError error={error} />
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-3 md:p-4 gap-4">
      <UsersList users={users} onSyncComplete={fetchUsers} />
    </div>
  )
}

export default UsersListPage
