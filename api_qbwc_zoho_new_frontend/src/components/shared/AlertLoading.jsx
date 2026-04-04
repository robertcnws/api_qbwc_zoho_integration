import React from 'react'
import { Loader2 } from 'lucide-react'

const AlertLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading {message}...</p>
    </div>
  )
}

export { AlertLoading }
export default AlertLoading
