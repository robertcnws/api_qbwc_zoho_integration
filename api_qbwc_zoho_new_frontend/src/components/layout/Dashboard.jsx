import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthContext'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import Footer from '@/components/layout/Footer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ConfirmProvider from '@/components/shared/ConfirmDialog'

const SIDEBAR_WIDTH = 240

const Dashboard = () => {
  const [expanded, setExpanded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
  const { logout } = useAuth()
  const navigate = useNavigate()

  const toggleSidebar = () => setSidebarOpen((v) => !v)

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm })
  }

  const handleDoBackup = () => {
    showConfirm('Are you sure?', 'Want to do this DB BackUp?', async () => {
      try {
        const url = `${apiUrl}/do_backup_db/`
        const data = { username: localStorage.getItem('username') }
        const response = await fetchWithToken(url, 'GET', data, {})
        if (response.status === 200) {
          navigate('/integration/download_backup_db')
        } else {
          navigate('/integration')
        }
      } catch (error) {
        console.error('Error doing Backup:', error)
        navigate('/integration')
      }
    })
  }

  const handleLogout = () => {
    showConfirm('Are you sure?', 'Want to logout?', async () => {
      try {
        const data = { username: localStorage.getItem('username') }
        await fetchWithToken(`${apiUrl}/logout/`, 'GET', data, {})
        logout()
        navigate('/')
      } catch (error) {
        console.error('Error logging out:', error)
        logout()
        navigate('/')
      }
    })
  }

  const toggleSubmenu = () => setExpanded((v) => !v)

  return (
    <ConfirmProvider>
      <div className="h-screen overflow-hidden bg-background">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          width={SIDEBAR_WIDTH}
          expanded={expanded}
          toggleSubmenu={toggleSubmenu}
          handleLogout={handleLogout}
          handleDoBackup={handleDoBackup}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area offset by sidebar on desktop */}
        <div
          className="flex flex-col h-full md:pl-[240px]"
        >
          {/* Sticky topbar */}
          <div className="sticky top-0 z-40 bg-background border-b border-border">
            <Topbar
              handleLogout={handleLogout}
              handleDoBackup={handleDoBackup}
              toggleSidebar={toggleSidebar}
            />
          </div>

          {/* Scrollable content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>

          <Footer />
        </div>

        {/* Confirm Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(d => ({ ...d, open: false }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(d => ({ ...d, open: false }))}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmDialog(d => ({ ...d, open: false }))
                  confirmDialog.onConfirm?.()
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ConfirmProvider>
  )
}

export default Dashboard
