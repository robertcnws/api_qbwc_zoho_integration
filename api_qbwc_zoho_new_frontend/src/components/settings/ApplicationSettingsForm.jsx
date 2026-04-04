import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ApplicationSettingsForm = ({ formData, onSubmit, error, success }) => {
  const [data, setData] = useState(formData)
  const [showZohoSecret, setShowZohoSecret] = useState(false)
  const [showQBPassword, setShowQBPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formChanged, setFormChanged] = useState(false)

  useEffect(() => {
    setData(formData)
    setFormChanged(false)
  }, [formData])

  useEffect(() => {
    const isFormChanged =
      data.zoho_client_id !== formData.zoho_client_id ||
      data.zoho_client_secret !== formData.zoho_client_secret ||
      data.zoho_org_id !== formData.zoho_org_id ||
      data.zoho_redirect_uri !== formData.zoho_redirect_uri ||
      data.qb_username !== formData.qb_username ||
      data.qb_password !== formData.qb_password
    setFormChanged(isFormChanged)
  }, [data, formData])

  const handleChange = (event) => {
    const { name, value } = event.target
    const updatedData = { ...data, [name]: value }
    setData(updatedData)
    const isFormChanged = Object.keys(updatedData).some((key) => updatedData[key] !== formData[key])
    setFormChanged(isFormChanged)
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: value ? '' : prevErrors[name],
    }))
  }

  const handleBlur = (event) => {
    const { name, value } = event.target
    const newErrors = { ...errors }
    if (!value) {
      newErrors[name] = `${name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} is required`
    } else {
      newErrors[name] = ''
    }
    setErrors(newErrors)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!data.zoho_client_id) newErrors.zoho_client_id = 'Zoho Client ID is required'
    if (!data.zoho_client_secret) newErrors.zoho_client_secret = 'Zoho Client Secret is required'
    if (!data.zoho_org_id) newErrors.zoho_org_id = 'Zoho Organization ID is required'
    if (!data.zoho_redirect_uri) newErrors.zoho_redirect_uri = 'Zoho Redirect URI is required'
    if (!data.qb_username) newErrors.qb_username = 'QB Username is required'
    if (!data.qb_password) newErrors.qb_password = 'QB Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (validateForm()) {
      onSubmit(data)
      setFormChanged(false)
    }
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      {/* Form Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h6 className="text-base font-semibold">App Configuration</h6>
      </div>

      {/* Form Body */}
      <div className="pt-5 bg-[#F9F9FB] w-full border-r border-gray-200 px-4 pb-4">
        {success && (
          <Alert className="mb-3 border-green-500 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Zoho Section */}
          <div className="mb-6 mt-2">
            <h6 className="text-base font-semibold text-gray-500 border-b border-gray-200 pb-2">
              Zoho Section
            </h6>
          </div>

          {/* Zoho Client ID + Client Secret */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[130px] pt-2 shrink-0">
                Zoho Client ID*
              </Label>
              <div className="flex-1">
                <Input
                  name="zoho_client_id"
                  value={data.zoho_client_id || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.zoho_client_id ? 'border-red-500' : ''}
                />
                {errors.zoho_client_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.zoho_client_id}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[130px] pt-2 shrink-0">
                Zoho Client Secret*
              </Label>
              <div className="flex-1">
                <div className="relative">
                  <Input
                    name="zoho_client_secret"
                    type={showZohoSecret ? 'text' : 'password'}
                    value={data.zoho_client_secret || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.zoho_client_secret ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowZohoSecret((v) => !v)}
                  >
                    {showZohoSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.zoho_client_secret && (
                  <p className="text-red-500 text-xs mt-1">{errors.zoho_client_secret}</p>
                )}
              </div>
            </div>
          </div>

          {/* Zoho Org ID + Redirect URI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[130px] pt-2 shrink-0">
                Zoho Organization ID*
              </Label>
              <div className="flex-1">
                <Input
                  name="zoho_org_id"
                  value={data.zoho_org_id || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.zoho_org_id ? 'border-red-500' : ''}
                />
                {errors.zoho_org_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.zoho_org_id}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[130px] pt-2 shrink-0">
                Zoho Redirect URI*
              </Label>
              <div className="flex-1">
                <Input
                  name="zoho_redirect_uri"
                  value={data.zoho_redirect_uri || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.zoho_redirect_uri ? 'border-red-500' : ''}
                />
                {errors.zoho_redirect_uri && (
                  <p className="text-red-500 text-xs mt-1">{errors.zoho_redirect_uri}</p>
                )}
              </div>
            </div>
          </div>

          {/* QBWC Section */}
          <div className="mb-6 mt-6">
            <h6 className="text-base font-semibold text-gray-500 border-b border-gray-200 pb-2">
              QBWC Section
            </h6>
          </div>

          {/* QB Username + QB Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[130px] pt-2 shrink-0">
                QBWC Username*
              </Label>
              <div className="flex-1">
                <Input
                  name="qb_username"
                  value={data.qb_username || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.qb_username ? 'border-red-500' : ''}
                />
                {errors.qb_username && (
                  <p className="text-red-500 text-xs mt-1">{errors.qb_username}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[130px] pt-2 shrink-0">
                QBWC Password*
              </Label>
              <div className="flex-1">
                <div className="relative">
                  <Input
                    name="qb_password"
                    type={showQBPassword ? 'text' : 'password'}
                    value={data.qb_password || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.qb_password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowQBPassword((v) => !v)}
                  >
                    {showQBPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.qb_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.qb_password}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pb-2 mb-5" />

          {/* Form Footer */}
          <div className="flex justify-start gap-2 border border-gray-200 p-3 rounded">
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!formChanged}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Update
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 bg-gray-100"
            >
              <Link to="/integration">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplicationSettingsForm
