import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const UsersForm = ({ formData, onSubmit, error, success, isNew }) => {
  const [data, setData] = useState(formData)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formChanged, setFormChanged] = useState(false)

  useEffect(() => {
    if (!isNew) {
      setData({
        ...formData,
        role: formData.is_staff ? 'admin' : 'user',
      })
    }
    setFormChanged(false)
  }, [formData])

  useEffect(() => {
    const role = data.role === 'admin' ? true : false
    const isFormChanged =
      data.username !== formData.username ||
      data.first_name !== formData.first_name ||
      data.last_name !== formData.last_name ||
      role !== formData.is_staff ||
      data.email !== formData.email ||
      data.password !== formData.password ||
      data.confirm_password !== formData.comfirm_password
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

  const handleSelectChange = (name, value) => {
    const updatedData = { ...data, [name]: value }
    setData(updatedData)
    const isFormChanged = Object.keys(updatedData).some((key) => updatedData[key] !== formData[key])
    setFormChanged(isFormChanged)
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }))
  }

  const handleBlur = (event) => {
    const { name, value } = event.target
    const newErrors = { ...errors }

    if (!value) {
      newErrors[name] = `${name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} is required`
    } else {
      if (name === 'confirm_password') {
        if (value !== data.password) {
          newErrors[name] = 'Passwords do not match'
        } else {
          newErrors[name] = ''
        }
      } else if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors[name] = 'Invalid email address'
        } else {
          newErrors[name] = ''
        }
      } else {
        newErrors[name] = ''
      }
    }
    setErrors(newErrors)
  }

  const validateForm = () => {
    const newErrors = {}
    if (isNew && !data.username) newErrors.username = 'Username is required'
    if (!data.first_name) newErrors.first_name = 'First Name is required'
    if (!data.last_name) newErrors.last_name = 'Last Name is required'
    if (!data.email) {
      newErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        newErrors.email = 'Invalid email address'
      }
    }
    if (!data.password) newErrors.password = 'Password is required'
    if (!data.confirm_password) {
      newErrors.confirm_password = 'Password Confirm is required'
    } else if (data.password !== data.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }
    if (!data.role) newErrors.role = 'Role is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (validateForm()) {
      setData({ ...data, is_new: isNew })
      onSubmit(data)
      setFormChanged(false)
    }
  }

  return (
    <div>
      {/* Form Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h6 className="text-base font-semibold">{isNew ? 'Create' : 'Update'} User</h6>
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
          {/* Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">Username*</Label>
              <div className="flex-1">
                <Input
                  name="username"
                  value={data.username || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!isNew}
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>
            </div>
          </div>

          {/* First Name + Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">First Name*</Label>
              <div className="flex-1">
                <Input
                  name="first_name"
                  value={data.first_name || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">Last Name*</Label>
              <div className="flex-1">
                <Input
                  name="last_name"
                  value={data.last_name || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Email + Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">Email*</Label>
              <div className="flex-1">
                <Input
                  name="email"
                  value={data.email || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">Role*</Label>
              <div className="flex-1">
                <select
                  name="role"
                  value={data.role || ''}
                  onChange={(e) => handleSelectChange('role', e.target.value)}
                  onBlur={handleBlur}
                  className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring ${errors.role ? 'border-red-500' : 'border-input'}`}
                >
                  <option value="">Select role...</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password + Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">Password*</Label>
              <div className="flex-1">
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Label className="text-red-600 text-sm min-w-[90px] pt-2 shrink-0">
                Confirm Password*
              </Label>
              <div className="flex-1">
                <div className="relative">
                  <Input
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={data.confirm_password || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.confirm_password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
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
              {isNew ? 'Create' : 'Update'}
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 bg-gray-100"
            >
              <Link to="/integration/list_users">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsersForm
