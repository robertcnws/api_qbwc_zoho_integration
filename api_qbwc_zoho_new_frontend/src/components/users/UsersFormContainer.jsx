import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import UsersForm from './UsersForm'

const UsersFormContainer = () => {
  const [formData, setFormData] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isNew, setIsNew] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const user = location.state?.user
    if (user && Object.keys(user).length > 0) {
      setFormData(user)
      setIsNew(false)
    }
  }, [])

  const handleSubmit = async (data) => {
    try {
      data = { ...data, logged_username: localStorage.getItem('username') }
      let isStaff = null
      if (data.username === localStorage.getItem('username')) {
        isStaff = data.is_staff
      }
      data = JSON.stringify(data)
      console.log(data)
      const response = await fetchWithToken(`${apiUrl}/manage_user/`, 'POST', data, {}, apiUrl)
      setSuccess(response.data.message)
      if (response.status === 200) {
        setError(null)
        toast.success(response.data.message)
        if (isStaff !== null) {
          localStorage.setItem('isStaff', isStaff)
        }
        navigate('/integration/list_users')
      }
    } catch (err) {
      console.error('Error updating user:', err)
      setError(`Error updating user: ${err}`)
      setSuccess(null)
    }
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      <UsersForm
        formData={formData}
        onSubmit={handleSubmit}
        error={error}
        success={success}
        isNew={isNew}
      />
    </div>
  )
}

export default UsersFormContainer
