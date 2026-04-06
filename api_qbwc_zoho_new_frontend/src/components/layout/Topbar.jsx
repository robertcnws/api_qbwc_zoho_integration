import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BarChart2, Bell, Settings, UserCircle, ChevronDown, ChevronUp,
  Search, X, LogOut, Building2, Users, Package, Receipt, Check, Menu
} from 'lucide-react'
import { fetchWithToken, apiUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SEARCH_OPTIONS = [
  { label: 'Customers', path: '/integration/list_customers' },
  { label: 'Items', path: '/integration/list_items' },
  { label: 'Invoices', path: '/integration/list_invoices' },
  { label: 'Sales Orders', path: '/integration/list_sales_orders' },
  { label: 'QB Customers', path: '/integration/qbwc/customers/list' },
  { label: 'QB Items', path: '/integration/qbwc/items/list' },
  { label: 'QB Never Match Customers', path: '/integration/qbwc/customers/never_match' },
  { label: 'QB Never Match Items', path: '/integration/qbwc/items/never_match' },
  { label: 'Users', path: '/integration/list_users' },
  { label: 'Back Ups', path: '/integration/download_backup_db' },
  { label: 'Logs', path: '/integration/list_logs' },
]

const MODULE_ICON = {
  backup: <Building2 size={16} />,
  customers: <Users size={16} />,
  items: <Package size={16} />,
  invoices: <Receipt size={16} />,
}

const getSearchLabel = (path) => {
  if (path.includes('list_customers')) return 'Search Customers (/)'
  if (path.includes('list_items')) return 'Search Items (/)'
  if (path.includes('list_invoices')) return 'Search Invoices (/)'
  if (path.includes('list_sales_orders')) return 'Search Sales Orders (/)'
  if (path.includes('qbwc/customers/list')) return 'Search QB Customers (/)'
  if (path.includes('qbwc/items/list')) return 'Search QB Items (/)'
  if (path.includes('qbwc/customers/never_match')) return 'Search QB Never Match Customers (/)'
  if (path.includes('qbwc/items/never_match')) return 'Search QB Never Match Items (/)'
  if (path.includes('list_users')) return 'Search Users (/)'
  if (path.includes('download_backup_db')) return 'Search Back Up (/)'
  if (path.includes('list_logs')) return 'Search Logs (/)'
  return null
}

const Topbar = ({ handleLogout, toggleSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'Guest'
  const firstName = localStorage.getItem('firstName') || ''
  const lastName = localStorage.getItem('lastName') || ''
  const isStaff = localStorage.getItem('isStaff') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('notifications') // 'notifications' | 'user'
  const [notifFilter, setNotifFilter] = useState('all')
  const [lastToastTime, setLastToastTime] = useState(null)

  const searchLabel = getSearchLabel(location.pathname)
  const showSearch = !!searchLabel

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithToken(`${apiUrl}/list_notifications/`, 'GET', { username }, {})
      const data = response.data.data || []
      const quantityUnread = response.data.quantity_unread || 0
      setNotifications(data)
      setUnreadCount(quantityUnread)

      const currentTime = Date.now()
      if (quantityUnread >= 1 && (!lastToastTime || currentTime - lastToastTime >= 600000)) {
        const unread = data.filter(n => !n.notification_is_read)
        if (quantityUnread === 1) {
          toast.info(`${unread[0].notification_message} on ${unread[0].notification_modified}`, {
            onClick: () => handleCheckNotification(unread[0]),
          })
        } else {
          toast.info(`You have ${quantityUnread} new notifications`, {
            onClick: () => { setDrawerMode('notifications'); setDrawerOpen(true) },
          })
        }
        setLastToastTime(currentTime)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  useEffect(() => {
    setSearchTerm('')
    localStorage.setItem('searchTermGlobal', '')
    fetchNotifications()
    const id = setInterval(fetchNotifications, 300000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    localStorage.setItem('searchTermGlobal', e.target.value)
    window.dispatchEvent(new Event('storage'))
  }

  const handleCheckNotification = async (notification) => {
    try {
      const response = await fetchWithToken(
        `${apiUrl}/check_read_notification/${notification.notification_id}`,
        'POST',
        { username },
        {}
      )
      if (response.status === 200) {
        setDrawerOpen(false)
        if (notification.notification_module !== 'backup') {
          navigate(`/integration/list_${notification.notification_module}`)
        } else {
          navigate('/integration/download_backup_db')
        }
      }
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'unread') return !n.notification_is_read
    if (notifFilter === 'read') return n.notification_is_read
    return true
  })

  return (
    <TooltipProvider>
      <div className="flex items-center h-14 px-4 bg-[#f7f7fe] border-b border-border gap-4">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden flex-shrink-0"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>

        {/* Search */}
        <div className="flex-1 min-w-0">
          {showSearch && (
            <div className="relative flex items-center w-full max-w-[288px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="absolute left-1 z-10 h-7 px-1 gap-0">
                    <Search size={14} />
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {SEARCH_OPTIONS.map(opt => (
                    <DropdownMenuItem
                      key={opt.path}
                      onClick={() => navigate(opt.path)}
                      className={cn(location.pathname === opt.path && 'bg-accent')}
                    >
                      {location.pathname === opt.path && <Check size={14} className="mr-2" />}
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder={searchLabel}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-16 h-9 text-sm"
              />
            </div>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <BarChart2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tasks</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={() => { setDrawerMode('notifications'); setDrawerOpen(true) }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <Link to="/integration/application_settings">
                  <Settings size={18} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configuration</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 gap-0"
                onClick={() => { setDrawerMode('user'); setDrawerOpen(true) }}
              >
                <UserCircle size={18} />
                {drawerMode === 'user' && drawerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Account</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[380px] p-0" aria-describedby={undefined}>
          <SheetTitle className="sr-only">
            {drawerMode === 'user' ? 'User Profile' : 'Notifications'}
          </SheetTitle>
          {drawerMode === 'user' ? (
            <div className="h-full flex flex-col">
              {/* User header */}
              <div className="bg-[#444A60] text-white p-4 flex items-start gap-3">
                <UserCircle size={56} className="flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70">{firstName} {lastName}</p>
                  <p className="text-sm font-semibold">User: {username}</p>
                  <p className="text-sm">Role: <strong>{isStaff.toUpperCase()}</strong></p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/10 flex-shrink-0"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X size={14} />
                </Button>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <Button variant="link" size="sm" onClick={() => alert('Under Construction')} className="p-0 h-auto text-xs">
                  My Account
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { setDrawerOpen(false); handleLogout() }}
                >
                  <LogOut size={14} className="mr-1" />
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Notifications header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex gap-2">
                  {['all', 'unread', 'read'].map(f => (
                    <Button
                      key={f}
                      variant={notifFilter === f ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs capitalize"
                      onClick={() => setNotifFilter(f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDrawerOpen(false)}>
                  <X size={14} />
                </Button>
              </div>
              <Separator />
              <ScrollArea className="flex-1">
                {filteredNotifications.map((n, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent border-b border-border/50 transition-colors',
                      !n.notification_is_read && 'bg-blue-50'
                    )}
                    onClick={() => handleCheckNotification(n)}
                  >
                    <div className={cn(
                      'rounded p-1 mt-0.5 flex-shrink-0',
                      n.notification_is_read ? 'text-muted-foreground bg-background' :
                        n.notification_message?.toLowerCase().includes('zoho') ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100'
                    )}>
                      {MODULE_ICON[n.notification_module] || <Receipt size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.notification_is_read && 'font-semibold')}>
                        {n.notification_message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.notification_modified}</p>
                    </div>
                  </div>
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

export default Topbar
