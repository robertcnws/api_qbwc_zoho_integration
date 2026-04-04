import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    localStorage.setItem('redirectPath', window.location.pathname)
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
