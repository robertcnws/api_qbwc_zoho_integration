import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'

const ConfirmContext = createContext(null)

const iconMap = {
  warning: <AlertTriangle className="text-amber-500" size={22} />,
  error:   <XCircle className="text-red-500" size={22} />,
  success: <CheckCircle2 className="text-green-600" size={22} />,
  info:    <Info className="text-blue-500" size={22} />,
}

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({
    open: false, title: '', description: '', confirmText: 'Confirm', cancelText: 'Cancel',
    icon: 'warning', variant: 'destructive',
  })
  const resolveRef = useRef(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ open: true, confirmText: 'Confirm', cancelText: 'Cancel', icon: 'warning', variant: 'destructive', ...options })
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = () => {
    setState(s => ({ ...s, open: false }))
    resolveRef.current?.(true)
  }

  const handleCancel = () => {
    setState(s => ({ ...s, open: false }))
    resolveRef.current?.(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {iconMap[state.icon]}
              {state.title}
            </DialogTitle>
            {state.description && (
              <DialogDescription className="pt-1 text-sm text-muted-foreground">
                {state.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>{state.cancelText}</Button>
            <Button variant={state.variant} onClick={handleConfirm}>{state.confirmText}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)

export default ConfirmProvider
