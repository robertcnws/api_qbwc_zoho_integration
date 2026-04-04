import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, UserPlus, Home, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { stableSort, getComparatorUndefined, fetchWithToken, apiUrl, formatDate } from '@/lib/utils'
import EmptyRecordsCell from '@/components/shared/EmptyRecordsCell'
import NavigationRightButton from '@/components/shared/NavigationRightButton'
import TableCustomPagination from '@/components/shared/TableCustomPagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const numberRows = parseInt(import.meta.env.VITE_DEFAULT_ROWS_PER_PAGE) || 10

const SortableHeader = ({ col, label, orderBy, order, onSort }) => (
  <TableHead
    className="cursor-pointer select-none bg-[#F9F9FB] text-xs font-bold text-muted-foreground uppercase"
    onClick={() => onSort(col)}
  >
    <div className="flex items-center gap-1">
      {label}
      {orderBy === col ? (
        order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ArrowUpDown size={12} className="opacity-30" />
      )}
    </div>
  </TableHead>
)

const UsersList = ({ users, onSyncComplete }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(numberRows)
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTermGlobal') || '')
  const [orderBy, setOrderBy] = useState('')
  const [order, setOrder] = useState('asc')
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)
  const navigate = useNavigate()
  const confirm = useConfirm()

  useEffect(() => {
    const handleStorageChange = () => {
      setSearchTerm(localStorage.getItem('searchTermGlobal') || '')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [searchTerm])

  const handleSortChange = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(columnId)
  }

  const handleChangePage = (newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (value) => {
    setRowsPerPage(parseInt(value, 10))
    setPage(0)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const viewUser = (user) => {
    const state = { user: user }
    navigate('/integration/view_user', { state })
  }

  const setUserStatus = async (user) => {
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: `You are about to delete user ${user.username}. This action cannot be undone.`,
      icon: 'warning',
      confirmText: 'Yes, delete it!',
      cancelText: 'No, cancel!',
      variant: 'destructive',
    })
    if (!confirmed) return
    const data = JSON.stringify({ logged_username: localStorage.getItem('username') })
    const response = await fetchWithToken(
      `${apiUrl}/set_user_status/${user.username}/`,
      'POST',
      data,
      {},
      apiUrl
    )
    if (response.status === 200) {
      toast.success(response.data.message)
      onSyncComplete()
    }
  }

  const sortedUsers = stableSort(filteredUsers, getComparatorUndefined(order, orderBy))

  const columns = [
    { id: 'username', label: 'Username' },
    { id: 'role', label: 'Role' },
    { id: 'first_name', label: 'First Name' },
    { id: 'last_name', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { id: 'last_login', label: 'Last Login' },
    { id: 'actions', label: 'Actions' },
  ]

  const navItems = [
    {
      label: 'Add New User',
      icon: <UserPlus size={16} className="mr-1" />,
      onClick: () => viewUser({}),
      visible: true,
    },
    {
      label: 'Back to Integration',
      icon: <Home size={16} className="mr-1" />,
      route: '/integration',
      visible: true,
    },
  ]

  return (
    <div className="w-full px-0 py-1 bg-transparent flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2">
          <h6 className="text-base font-bold uppercase text-[#212529] ml-1">Users List</h6>
          <NavigationRightButton items={navItems} />
        </div>
        <Alert>
          <AlertDescription>There are {filteredUsers.length} users found.</AlertDescription>
        </Alert>
      </div>

      <div className="overflow-auto">
        <Table id="myTable" aria-label="users table">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <SortableHeader
                  key={column.id}
                  col={column.id}
                  label={column.label}
                  orderBy={orderBy}
                  order={order}
                  onSort={handleSortChange}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <EmptyRecordsCell colSpan={columns.length} />
            ) : (
              (rowsPerPage > 0
                ? sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : sortedUsers
              ).map((user, index) =>
                user.username !== localStorage.getItem('username') ? (
                  <TableRow
                    key={index}
                    className="cursor-pointer transition-colors"
                    style={{
                      backgroundColor: hoveredRowIndex === index ? '#F6F6FA' : '#FFFFFF',
                    }}
                    onMouseEnter={() => setHoveredRowIndex(index)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                  >
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.first_name ? user.first_name : user.username}</TableCell>
                    <TableCell>{user.last_name ? user.last_name : user.username}</TableCell>
                    <TableCell>{user.email ? user.email : '---'}</TableCell>
                    <TableCell>{user.last_login ? formatDate(user.last_login) : '---'}</TableCell>
                    <TableCell className="text-center align-middle">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => viewUser(user)}
                        aria-label="edit"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setUserStatus(user)}
                        aria-label="delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null
              )
            )}
            <TableCustomPagination
              colSpan={columns.length}
              data={filteredUsers}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default UsersList
