import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  ListOrdered,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const Sidebar = ({ width = 240, expanded, toggleSubmenu, handleLogout, handleDoBackup, isOpen = false, onClose }) => {
  const location = useLocation()
  const currentPath = location.pathname
  const isAdmin = localStorage.getItem('isStaff') === 'admin'

  const isActive = (path) => {
    if (currentPath === path) return true
    if (currentPath.startsWith(`${path}/`)) {
      return path.includes('qbwc') ? true : false
    }
    if (currentPath.includes('item_details') && path.includes('list_items')) return true
    if (currentPath.includes('invoice_details') && path.includes('list_invoices')) return true
    if (currentPath.includes('customer_details') && path.includes('list_customers')) return true
    return false
  }

  const isSettingsActive = () =>
    ['/integration/zoho', '/integration/qbwc', '/integration/application_settings',
     '/integration/download_backup_db', '/integration/list_users', '/integration/list_logs',
     '/integration/view_user'].some(p => isActive(p))

  const navItemClass = (active) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-normal text-white transition-colors cursor-pointer w-full',
      active ? 'bg-[#00796b]' : 'hover:bg-white/10'
    )

  const subNavItemClass = (active) =>
    cn(
      'flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-[13px] text-white transition-colors cursor-pointer w-full',
      active ? 'bg-[#00796b]' : 'hover:bg-white/10'
    )

  return (
    <div
      className={cn(
        'fixed top-0 left-0 h-screen bg-[#21263c] text-white flex flex-col border-r border-white/10 overflow-y-auto z-50',
        'transition-transform duration-300 ease-in-out',
        // Mobile: hidden by default, slide in when open
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: always visible
        'md:translate-x-0',
      )}
      style={{ width }}
    >
      {/* Logo + mobile close button */}
      <div className="p-3 text-center relative">
        <img
          src="/logo_qbwc_zoho_mini.png"
          alt="QBWC Zoho"
          className="max-w-full h-auto rounded"
          style={{ marginTop: '-2px' }}
        />
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:hidden text-white/70 hover:text-white p-1 rounded"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 flex-1" onClick={onClose}>
        <Link to="/integration" className={navItemClass(isActive('/integration') && currentPath === '/integration')}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        <Link to="/integration/list_customers" className={navItemClass(isActive('/integration/list_customers'))}>
          <Users size={18} />
          <span>Customers</span>
        </Link>

        <Link to="/integration/list_items" className={navItemClass(isActive('/integration/list_items'))}>
          <Package size={18} />
          <span>Items</span>
        </Link>

        <Link to="/integration/list_invoices" className={navItemClass(isActive('/integration/list_invoices'))}>
          <Receipt size={18} />
          <span>Stock Invoices</span>
        </Link>

        <Link to="/integration/list_sales_orders" className={navItemClass(isActive('/integration/list_sales_orders'))}>
          <ListOrdered size={18} />
          <span>Custom Sales Orders</span>
        </Link>

        {/* Settings collapsible */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleSubmenu() }}
          className={navItemClass(isSettingsActive())}
        >
          <Settings size={18} />
          <span className="flex-1 text-left">Settings</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded && (
          <div className="mt-1">
            <div className="border-t border-white/10 my-1" />
            <Link to="/integration/zoho" className={subNavItemClass(isActive('/integration/zoho'))}>
              <span>Zoho</span>
            </Link>
            <Link to="/integration/qbwc" className={subNavItemClass(isActive('/integration/qbwc'))}>
              <span>Quickbooks</span>
            </Link>
            <Link to="/integration/application_settings" className={subNavItemClass(isActive('/integration/application_settings'))}>
              <span>Configuration</span>
            </Link>
            <button onClick={(e) => { e.stopPropagation(); handleDoBackup() }} className={subNavItemClass(false)}>
              <span>Do BackUp</span>
            </button>
            <Link to="/integration/download_backup_db" className={subNavItemClass(isActive('/integration/download_backup_db'))}>
              <span>BackUps</span>
            </Link>
            {isAdmin && (
              <>
                <Link to="/integration/list_users" className={subNavItemClass(isActive('/integration/list_users') || isActive('/integration/view_user'))}>
                  <span>Users</span>
                </Link>
                <Link to="/integration/list_logs" className={subNavItemClass(isActive('/integration/list_logs'))}>
                  <span>Logs</span>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  )
}

export default Sidebar
