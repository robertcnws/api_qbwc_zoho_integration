import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/components/auth/AuthContext'
import { getCookie, apiUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const LoginForm = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      setLoading(false)
      return
    }

    try {
      const jwtResponse = await axios.post(
        `${apiUrl}/api/token/`,
        JSON.stringify({ username, password }),
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
      )

      if (jwtResponse.status !== 200) {
        setError('Invalid Credentials: No active account found with the given credentials')
        return
      }

      localStorage.setItem('accessToken', jwtResponse.data.access)
      localStorage.setItem('refreshToken', jwtResponse.data.refresh)

      const loginResponse = await axios.post(
        `${apiUrl}/login/`,
        JSON.stringify({ username, password }),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
        }
      )

      if (loginResponse.status === 200) {
        setSuccess('Login successful')
        localStorage.setItem('isStaff', loginResponse.data.is_staff)
        localStorage.setItem('username', loginResponse.data.username)
        localStorage.setItem('firstName', loginResponse.data.first_name)
        localStorage.setItem('lastName', loginResponse.data.last_name)
        login(jwtResponse.data.access)
        navigate('/integration')
      } else {
        setError(`${loginResponse.data.error}: ${loginResponse.data.description}`)
      }
    } catch (err) {
      setError('Invalid Credentials: No active account found with the given credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-lg shadow-md border border-border">
        <div className="flex justify-center">
          <img
            src="/logo_qbwc_zoho.png"
            alt="QBWC Zoho"
            className="max-w-full h-auto"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              className={error && !username.trim() ? 'border-destructive' : ''}
            />
            {error && !username.trim() && (
              <p className="text-xs text-destructive">Username is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              className={error && !password.trim() ? 'border-destructive' : ''}
            />
            {error && !password.trim() && (
              <p className="text-xs text-destructive">Password is required</p>
            )}
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginForm
