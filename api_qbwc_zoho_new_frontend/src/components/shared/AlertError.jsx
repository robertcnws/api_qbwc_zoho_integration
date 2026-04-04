import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const AlertError = ({ error, redirectTo }) => {
  const navigate = useNavigate()
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      {redirectTo && (
        <Button className="mt-4" variant="outline" onClick={() => navigate(redirectTo)}>
          Go Back
        </Button>
      )}
    </div>
  )
}

export { AlertError }
export default AlertError
