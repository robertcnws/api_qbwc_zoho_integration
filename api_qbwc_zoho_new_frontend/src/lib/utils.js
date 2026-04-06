import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import axios from 'axios'

// shadcn/ui utility
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// API URL — Vite sets import.meta.env.DEV automatically:
//   npm run dev   → true  (uses VITE_BACKEND_URL_DEV, e.g. /api_proxy)
//   npm run build → false (uses VITE_BACKEND_URL_PROD, the real URL)
export const apiUrl =
  import.meta.env.DEV
    ? import.meta.env.VITE_BACKEND_URL_DEV
    : import.meta.env.VITE_BACKEND_URL_PROD

export const clearLocalStorage = () => {
  localStorage.removeItem('invoicesListPage')
  localStorage.removeItem('invoicesListRowsPerPage')
  localStorage.removeItem('invoicesListFilterDate')
}

export const getCsrfToken = async () => {
  try {
    const response = await axios.get(`${apiUrl}/get_csrf_token/`, { withCredentials: true })
    return response.data.csrftoken
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    throw new Error('Failed to get CSRF token')
  }
}

export const getCookie = (name) => {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.indexOf(name + '=') === 0) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

export const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

export const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

export const getComparatorUndefined = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparatorUndefined(a, b, orderBy)
    : (a, b) => -descendingComparatorUndefined(a, b, orderBy)
}

const descendingComparator = (a, b, orderBy) => {
  if (b.fields[orderBy] < a.fields[orderBy]) return -1
  if (b.fields[orderBy] > a.fields[orderBy]) return 1
  return 0
}

const descendingComparatorUndefined = (a, b, orderBy) => {
  if (!a || !b || !a[orderBy] || !b[orderBy]) return 0
  if (b[orderBy] < a[orderBy]) return -1
  if (b[orderBy] > a[orderBy]) return 1
  return 0
}

export const getAccessToken = () => localStorage.getItem('accessToken')
export const getRefreshToken = () => localStorage.getItem('refreshToken')

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

const refreshAccessToken = async () => {
  const token = getRefreshToken()
  try {
    const response = await axios.post(`${apiUrl}/api/token/refresh/`, { refresh: token })
    const { access } = response.data
    setTokens(access, token)
    return access
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

export const fetchWithToken = async (url, method = 'GET', data = null, headers = {}) => {
  const accessToken = getAccessToken()

  const makeRequest = async (token) => {
    const config = {
      method,
      url,
      withCredentials: true,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(method === 'GET' ? { params: data } : { data }),
    }
    return axios(config)
  }

  try {
    return await makeRequest(accessToken)
  } catch (error) {
    if (error.response && error.response.status === 401) {
      const newAccessToken = await refreshAccessToken()
      if (newAccessToken) {
        return await makeRequest(newAccessToken)
      }
    }
    throw error
  }
}

export const formatDate = (isoString) => {
  const date = new Date(isoString)
  const pad = (num) => String(num).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  const timezoneOffset = -date.getTimezoneOffset() / 60
  const timezoneString = `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezoneString}`
}
