# QBWC Zoho Integration — Claude Code Guide

## Project Overview

Full-stack integration between **QuickBooks Web Connector (QBWC)** and **Zoho Books**, with a Django backend and two React frontends.

```
api_qbwc_zoho_integration/
├── api_qbwc_zoho_backend/         # Django REST API backend
├── api_qbwc_zoho_frontend/        # Legacy frontend (React + MUI) — DO NOT MODIFY
├── api_qbwc_zoho_new_frontend/    # New frontend (React + Vite + shadcn/ui + Tailwind)
├── api_qbwc_zoho_backend/         # Django app modules
└── docker-compose*.yml            # Container orchestration
```

---

## New Frontend (`api_qbwc_zoho_new_frontend`)

### Tech Stack

| Tool | Purpose |
|------|---------|
| Vite + React 18 | Build tool & UI framework |
| Tailwind CSS v3 | Utility-first CSS |
| shadcn/ui | Component library (Radix UI primitives) |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Charts (line, bar, pie) |
| sonner | Toast notifications |
| lucide-react | Icons |
| react-hook-form | Form validation |

### Setup

```bash
cd api_qbwc_zoho_new_frontend
npm install
npm run dev        # Start dev server (default: http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
```

### Environment Variables

Copy `.env` to `.env.local` for local overrides. All variables use `VITE_` prefix:

```
VITE_BACKEND_URL_DEV=https://api-qbwc-zoho.newwindowsystem.net/api_qbwc_zoho
VITE_BACKEND_URL_PROD=https://api-qbwc-zoho.newwindowsystem.net/api_qbwc_zoho
VITE_ENVIRONMENT=DEV
VITE_DEFAULT_ROWS_PER_PAGE=50
```

> **Note:** The original frontend used `REACT_APP_*` (Create React App). The new frontend uses `VITE_*` (Vite). All environment variable references have been updated.

### Project Structure

```
src/
├── main.jsx                    # Entry point (Router + AuthProvider + App)
├── App.jsx                     # Route definitions
├── index.css                   # Tailwind directives + CSS variables
├── lib/
│   └── utils.js               # cn(), apiUrl, fetchWithToken, sorting helpers
├── components/
│   ├── auth/
│   │   ├── AuthContext.jsx    # Auth context (login/logout/useAuth)
│   │   └── ProtectedRoute.jsx # Route guard
│   ├── login/
│   │   └── LoginForm.jsx
│   ├── layout/
│   │   ├── Dashboard.jsx      # Root layout (sidebar + topbar + outlet)
│   │   ├── Sidebar.jsx        # Fixed 240px left nav
│   │   ├── Topbar.jsx         # Search + notifications + user menu
│   │   └── Footer.jsx
│   ├── dashboard/
│   │   └── MainContent.jsx    # Dashboard home with stats cards + charts
│   ├── charts/
│   │   ├── LineChartComponent.jsx
│   │   ├── BarChartComponent.jsx
│   │   └── PieChartComponent.jsx
│   ├── customers/             # Zoho customers
│   ├── items/                 # Zoho items
│   ├── invoices/              # Stock invoices
│   ├── sales-orders/          # Custom sales orders
│   ├── qbwc/                  # QuickBooks connector pages
│   │   ├── QbwcGetting.jsx
│   │   ├── items/             # QB items (list, matched, similar, never-matched)
│   │   └── customers/         # QB customers (list, matched, similar, never-matched)
│   ├── users/                 # User management (admin only)
│   ├── settings/              # Application settings
│   ├── logging/               # System logs (admin only)
│   ├── backup/                # Database backups
│   ├── zoho/                  # Zoho OAuth loading
│   ├── shared/                # Reusable utility components
│   │   ├── AlertLoading.jsx
│   │   ├── AlertError.jsx
│   │   ├── CustomFilter.jsx
│   │   ├── EmptyRecordsCell.jsx
│   │   ├── TableCustomPagination.jsx
│   │   └── NavigationRightButton.jsx
│   └── ui/                    # shadcn/ui component library
```

### Key Utilities (`src/lib/utils.js`)

```js
import { fetchWithToken, apiUrl, cn, stableSort, getComparator, getComparatorUndefined, formatDate } from '@/lib/utils'
```

| Export | Purpose |
|--------|---------|
| `cn(...classes)` | Merge Tailwind classes (clsx + tailwind-merge) |
| `apiUrl` | Computed backend URL from env vars |
| `fetchWithToken(url, method, data, headers)` | Axios wrapper with JWT auto-refresh |
| `getAccessToken()` / `getRefreshToken()` | JWT token getters |
| `stableSort(array, comparator)` | Stable sort preserving order for equals |
| `getComparator(order, orderBy)` | Sort comparator for `fields[orderBy]` |
| `getComparatorUndefined(order, orderBy)` | Sort comparator for flat objects |
| `formatDate(isoString)` | Format date with timezone |
| `getCsrfToken()` / `getCookie(name)` | CSRF helpers |

### Authentication Flow

1. User submits username/password in `LoginForm`
2. POST to `${apiUrl}/api/token/` → gets JWT access + refresh tokens
3. POST to `${apiUrl}/login/` → Django session login
4. Tokens stored in `localStorage`, user info stored in `localStorage`
5. `AuthContext` sets `isAuthenticated = true`
6. Idle timer (30 min) auto-logs out inactive users

### Routing

All protected routes live under `/integration/*` inside `<Dashboard>` which renders `<Outlet />`.

| Path | Component |
|------|-----------|
| `/` | LoginForm (or redirect to `/integration` if authenticated) |
| `/integration` | MainContent (dashboard) |
| `/integration/list_customers` | CustomersListPage |
| `/integration/list_items` | ItemsListPage |
| `/integration/list_invoices` | InvoicesListPage |
| `/integration/list_sales_orders` | SalesOrdersListPage |
| `/integration/qbwc` | QbwcGetting |
| `/integration/qbwc/items/list` | QbwcItemsListPage |
| `/integration/qbwc/customers/list` | QbwcCustomersListPage |
| `/integration/list_users` | UsersListPage (admin only) |
| `/integration/list_logs` | LoggingListPage (admin only) |
| `/integration/application_settings` | ApplicationSettingsContainer |
| `/integration/download_backup_db` | DownloadBackupList |
| `/integration/zoho` | ZohoLoading |

### Shared Component Usage

```jsx
// Loading state
<AlertLoading message="Customers List" />

// Error state
<AlertError error={errorMessage} />

// Filter dropdown
<CustomFilter config={{
  filter,
  handleFilterChange,
  listValues: [{ value: 'all', label: 'All' }, { value: 'matched', label: 'Matched' }],
  hasSearch: false
}} />

// Empty table row
<EmptyRecordsCell colSpan={5} />

// Pagination (inside TableBody)
<TableCustomPagination
  colSpan={5}
  data={filteredData}
  page={page}
  rowsPerPage={rowsPerPage}
  onPageChange={(_, newPage) => setPage(newPage)}
  onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value))}
/>

// Navigation button
<NavigationRightButton items={[
  { label: 'Back to Integration', icon: <HomeIcon size={14} />, route: '/integration', visible: true }
]} />
```

---

## Backend (`api_qbwc_zoho_backend`)

Django REST Framework API. Key endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/token/` | POST | Get JWT tokens |
| `/api/token/refresh/` | POST | Refresh JWT |
| `/login/` | POST | Django session login |
| `/logout/` | GET | Logout |
| `/api_zoho_customers/list_customers/` | GET | Zoho customers list |
| `/api_zoho_items/list_items/` | GET | Zoho items list |
| `/api_quickbook_soap/matched/invoices/stock/` | GET | Matched invoices |
| `/api_quickbook_soap/matched/sales_orders/custom/` | GET | Custom sales orders |
| `/api_zoho_statistics/data/data_{model}_{module}_statistics/` | GET | Dashboard stats |
| `/list_notifications/` | GET | Notifications |
| `/check_read_notification/{id}` | POST | Mark notification read |
| `/generate_auth_url/` | GET | Zoho OAuth URL |
| `/zoho_api_settings/` | GET/POST | Zoho configuration |
| `/application_settings/` | GET/POST | App settings |
| `/list_users/` | GET | Users list |
| `/manage_user/` | POST | Create/update user |
| `/list_loggings/` | GET | System logs |
| `/do_backup_db/` | GET | Trigger DB backup |
| `/download_backup_db/` | GET | List backups |

---

## Legacy Frontend (`api_qbwc_zoho_frontend`)

The original frontend using Create React App + Material-UI. **Do not modify** — it is the reference implementation.

Key differences from new frontend:
- `process.env.REACT_APP_*` → `import.meta.env.VITE_*`
- MUI components → shadcn/ui + Tailwind
- `react-toastify` → `sonner`
- SweetAlert2 → shadcn/ui `Dialog`
- `recharts` (already in both)
- Component paths are flat (`components/Customers/`) → organized (`components/customers/`)

---

## Docker & Deployment

```bash
# Local development with Docker
docker-compose up

# Build images
docker-compose build
```

See `docker-compose.yml` and `.dockerignore` for container configuration.

---

## Common Patterns

### Data Fetching with Polling

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetchWithToken(`${apiUrl}/endpoint/`, 'GET', null, {})
      setData(JSON.parse(response.data)) // or response.data
    } catch (err) {
      setError(`Failed to fetch: ${err}`)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
  const id = setInterval(fetchData, 5000)
  return () => clearInterval(id)
}, [])
```

### Table with Sort

```jsx
const SortableHeader = ({ col, label, orderBy, order, onSort }) => (
  <TableHead className="cursor-pointer bg-[#F9F9FB] text-xs font-bold uppercase" onClick={() => onSort(col)}>
    <div className="flex items-center gap-1">
      {label}
      {orderBy === col ? (order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
    </div>
  </TableHead>
)
```

### localStorage Patterns

```js
// User info (set at login)
localStorage.getItem('username')
localStorage.getItem('firstName')
localStorage.getItem('lastName')
localStorage.getItem('isStaff')     // 'admin' | 'user'

// Pagination state (persisted between navigations)
localStorage.getItem('customerListPage')
localStorage.getItem('customerListRowsPerPage')

// Global search (updated by Topbar, read by list components)
localStorage.getItem('searchTermGlobal')
window.dispatchEvent(new Event('storage'))  // trigger reactivity
```
