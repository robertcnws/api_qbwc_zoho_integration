import React, { useEffect, useCallback, useRef } from 'react'
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/components/auth/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import LoginForm from '@/components/login/LoginForm'
import Dashboard from '@/components/layout/Dashboard'
import MainContent from '@/components/dashboard/MainContent'
import ApplicationSettingsContainer from '@/components/settings/ApplicationSettingsContainer'
import ZohoLoading from '@/components/zoho/ZohoLoading'
import ItemsListPage from '@/components/items/ItemsListPage'
import ItemsDetails from '@/components/items/ItemsDetails'
import CustomersListPage from '@/components/customers/CustomersListPage'
import CustomersDetails from '@/components/customers/CustomersDetails'
import InvoicesListPage from '@/components/invoices/InvoicesListPage'
import InvoicesDetails from '@/components/invoices/InvoicesDetails'
import SalesOrdersListPage from '@/components/sales-orders/SalesOrdersListPage'
import SalesOrdersDetails from '@/components/sales-orders/SalesOrdersDetails'
import QbwcGetting from '@/components/qbwc/QbwcGetting'
import QbwcItemsListPage from '@/components/qbwc/items/QbwcItemsListPage'
import QbwcItemDetails from '@/components/qbwc/items/QbwcItemDetails'
import QbwcCustomersListPage from '@/components/qbwc/customers/QbwcCustomersListPage'
import QbwcCustomerDetails from '@/components/qbwc/customers/QbwcCustomerDetails'
import QbwcSimilarItemsListPage from '@/components/qbwc/items/QbwcSimilarItemsListPage'
import QbwcSimilarCustomersListPage from '@/components/qbwc/customers/QbwcSimilarCustomersListPage'
import QbwcMatchedItemsListPage from '@/components/qbwc/items/QbwcMatchedItemsListPage'
import QbwcMatchedCustomersListPage from '@/components/qbwc/customers/QbwcMatchedCustomersListPage'
import QbwcNeverMatchedItemsListPage from '@/components/qbwc/items/QbwcNeverMatchedItemsListPage'
import QbwcNeverMatchedCustomersListPage from '@/components/qbwc/customers/QbwcNeverMatchedCustomersListPage'
import DownloadBackupList from '@/components/backup/DownloadBackupList'
import UsersListPage from '@/components/users/UsersListPage'
import UsersFormContainer from '@/components/users/UsersFormContainer'
import LoggingListPage from '@/components/logging/LoggingListPage'

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    const redirectPath = localStorage.getItem('redirectPath') || '/integration'
    localStorage.removeItem('redirectPath')
    return <Navigate to={redirectPath} replace />
  }
  return <LoginForm />
}

const useIdleTimer = (navigate, timeout = 1800000) => {
  const { logout } = useAuth()
  const timer = useRef(null)

  const resetTimer = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      logout()
      navigate('/')
    }, timeout)
  }, [logout, navigate, timeout])

  useEffect(() => {
    const handleActivity = () => resetTimer()
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    resetTimer()
    return () => {
      clearTimeout(timer.current)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [resetTimer])

  return null
}

const App = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  useIdleTimer(navigate, 1800000)

  return (
    <>
      {isAuthenticated && <Toaster position="top-center" richColors />}
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/integration/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route path="" element={<MainContent />} />
          <Route path="application_settings" element={<ApplicationSettingsContainer />} />
          <Route path="zoho" element={<ZohoLoading />} />
          <Route path="list_items" element={<ItemsListPage />} />
          <Route path="item_details" element={<ItemsDetails />} />
          <Route path="list_customers" element={<CustomersListPage />} />
          <Route path="customer_details" element={<CustomersDetails />} />
          <Route path="list_invoices" element={<InvoicesListPage />} />
          <Route path="invoice_details" element={<InvoicesDetails />} />
          <Route path="list_sales_orders" element={<SalesOrdersListPage />} />
          <Route path="sales_order_details" element={<SalesOrdersDetails />} />
          <Route path="qbwc" element={<QbwcGetting />} />
          <Route path="qbwc/items/list" element={<QbwcItemsListPage />} />
          <Route path="qbwc/item_details" element={<QbwcItemDetails />} />
          <Route path="qbwc/customers/list" element={<QbwcCustomersListPage />} />
          <Route path="qbwc/customer_details" element={<QbwcCustomerDetails />} />
          <Route path="qbwc/items/similar" element={<QbwcSimilarItemsListPage />} />
          <Route path="qbwc/customers/similar" element={<QbwcSimilarCustomersListPage />} />
          <Route path="qbwc/items/matched" element={<QbwcMatchedItemsListPage />} />
          <Route path="qbwc/customers/matched" element={<QbwcMatchedCustomersListPage />} />
          <Route path="qbwc/items/never_match" element={<QbwcNeverMatchedItemsListPage />} />
          <Route path="qbwc/customers/never_match" element={<QbwcNeverMatchedCustomersListPage />} />
          <Route path="download_backup_db" element={<DownloadBackupList />} />
          <Route path="list_users" element={<UsersListPage />} />
          <Route path="view_user" element={<UsersFormContainer />} />
          <Route path="list_logs" element={<LoggingListPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
