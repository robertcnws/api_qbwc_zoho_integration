import React, { useState, useEffect } from 'react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import ApplicationSettingsForm from './ApplicationSettingsForm'

const ApplicationSettingsContainer = () => {
  const [formData, setFormData] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWithToken(`${apiUrl}/application_settings/`, 'GET', null, {}, apiUrl)
        setFormData(response.data)
      } catch (err) {
        console.error('Error fetching application settings:', err)
        setError('Error fetching application settings.')
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (data) => {
    try {
      data = JSON.stringify(data)
      const response = await fetchWithToken(`${apiUrl}/application_settings/`, 'POST', data, {}, apiUrl)
      setSuccess(response.data.message)
      setError(null)
    } catch (err) {
      console.error('Error updating application settings:', err)
      setError(`Error updating application settings: ${err}`)
      setSuccess(null)
    }
  }

  return (
    <ApplicationSettingsForm
      formData={formData}
      onSubmit={handleSubmit}
      error={error}
      success={success}
    />
  )
}

export default ApplicationSettingsContainer
