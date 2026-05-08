# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack integration between **QuickBooks Web Connector (QBWC)** (SOAP) and **Zoho Books** (REST). A Django backend exposes REST + WebSocket APIs and serves the SOAP endpoint that the QBWC desktop client polls; two React frontends consume the REST/WS APIs.

```
api_qbwc_zoho_integration/
├── api_qbwc_zoho_backend/         # Django REST + Channels (ASGI/Daphne) + Celery
├── api_qbwc_zoho_frontend/        # Legacy CRA + MUI — DO NOT MODIFY (reference impl)
├── api_qbwc_zoho_new_frontend/    # Active: Vite + React 18 + shadcn/ui + Tailwind
├── nginx_onpremise/               # Nginx reverse proxy for local/on-prem
├── k8s/                           # Kubernetes manifests (kind cluster, see kind-config.yaml)
├── docker-compose*.yml            # Local + AWS prod compose stacks
└── Jenkinsfile                    # CI: changeset-conditional ECR builds + ECS deploy
```

## Common Commands

### Backend (`api_qbwc_zoho_backend`)

Python 3.12, Django 5.0, Postgres 16, Redis (Celery + channels). Settings are read from `api_qbwc_zoho_backend/.env` via `django-environ` and Django will fail at import time if required vars are missing — copy from `aws-backend.env` or ask for the dev env file.

```bash
cd api_qbwc_zoho_backend

# Install
pip install -r requirements.txt

# DB migrations (entrypoint.sh runs both on container start)
python manage.py makemigrations
python manage.py migrate

# Dev server (ASGI — Channels/WebSockets won't work under runserver in some setups)
python manage.py runserver 0.0.0.0:8000
# Or, matching prod (supervisord runs all three):
daphne -b 0.0.0.0 -p 8000 project_api.asgi:application
celery -A project_api worker --loglevel=info
celery -A project_api beat   --loglevel=info

# Tests (per-app; each app has tests.py)
python manage.py test                       # all apps
python manage.py test api_zoho_invoices     # one app
python manage.py test api_zoho_invoices.tests.SomeTestCase.test_method
```

### New frontend (`api_qbwc_zoho_new_frontend`)

```bash
cd api_qbwc_zoho_new_frontend
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview
```

There are no lint or test scripts wired into `package.json` — don't suggest `npm test` / `npm run lint`.

### Docker (full local stack)

```bash
docker network create shared-network    # one-time; compose declares it as external
docker-compose up                       # backend + postgres + redis + nginx
```

`docker-compose.aws.backend.prod.yml` and `docker-compose.aws.frontend.prod.yml` are used by Jenkins to build images for ECR — don't run them locally.

## Backend Architecture

Single Django project `project_api` with one app per integration domain. **Every URL is prefixed with `/api_qbwc_zoho/`** (see `project_api/urls.py`). When wiring or referencing endpoints, always include that prefix.

| App | Responsibility |
|-----|----------------|
| `api_zoho` | Auth (custom `LoginUser` model, JWT + session), notifications, app/Zoho settings, backups, health check |
| `api_zoho_customers` / `api_zoho_items` / `api_zoho_invoices` / `api_zoho_sales_orders` | Zoho Books REST sync per entity (models, services, Celery tasks) |
| `api_zoho_purchase_orders` | **In progress** on `feature/local_deploy_purchase_orders` — not yet in `INSTALLED_APPS` or `project_api/urls.py` |
| `api_quickbook_soap` | QBWC SOAP request/response handlers + match/unmatch logic between QB and Zoho records |
| `api_zoho_statistics` | Dashboard aggregations (`/data_{model}_{module}_statistics/`) |
| `api_ws` | Channels consumers for real-time updates (no DB models) |

Cross-cutting:

- **AUTH**: `AUTH_USER_MODEL = 'api_zoho.LoginUser'` with custom `LoginUserBackend` in `api_zoho/auth_backends.py`. JWT tokens at `/api_qbwc_zoho/api/token/` and `/api_qbwc_zoho/api/token/refresh/`; session login at `/api_qbwc_zoho/login/`. The frontend calls both.
- **WebSockets** (`api_ws/routing.py`, ASGI via Daphne): `ws://…/api_qbwc_zoho/ws/{invoices,sales_orders,customers,items,qbwc_items,qbwc_customers}/`. `CHANNEL_LAYERS` uses `InMemoryChannelLayer` (single-process only — won't fan out across replicas).
- **Celery**: broker = `CELERY_BROKER_URL` (defaults to `redis://localhost:6379/0`). Beat schedule lives in `settings.py` → `CELERY_BEAT_SCHEDULE` (currently a daily 8:30 AM `load_invoices_periodic_task`). Tasks are auto-discovered from each app's `tasks.py`.
- **Env-driven settings**: `settings.py` selects DB and several config values per `ENVIRONMENT in {DEV, QA, PROD}` (e.g. `DB_NAME_DEV` vs `DB_NAME_PROD`). When adding new config, follow this same env-suffixed pattern.
- **QBWC `.qwc` files** in `qbwc_web_services/` are the subscription files installed into the QuickBooks Web Connector on the customer machine — they point at the SOAP endpoint and ship with the project.

## New Frontend Architecture

| Tool | Role |
|------|------|
| Vite + React 18 | Build/UI |
| Tailwind v3 + shadcn/ui (Radix) | Styling + components (`components.json` configures shadcn CLI) |
| React Router v6 | Routing — protected routes nest under `/integration/*` inside `<Dashboard>` (renders `<Outlet />`) |
| Axios via `fetchWithToken` | All HTTP — handles JWT auto-refresh on 401 |
| `recharts`, `sonner`, `lucide-react`, `react-hook-form` | Charts, toasts, icons, forms |

### Key conventions

- **Path alias `@/`** → `src/` (configured in `vite.config.js` and `components.json`).
- **API base URL**: `apiUrl` in `src/lib/utils.js` resolves from `VITE_BACKEND_URL_DEV` / `VITE_BACKEND_URL_PROD` based on `VITE_ENVIRONMENT`. All env vars must use the `VITE_` prefix (the legacy frontend used `REACT_APP_*` — do not copy that).
- **Vite dev proxy** (`vite.config.js`) rewrites `/api_proxy/*` → `https://api-qbwc-zoho.newwindowsystem.net/api_qbwc_zoho/*` and proxies `/ws` to the prod WSS endpoint. Useful for running the frontend against prod without standing up the full local stack.
- **Auth state** lives in `localStorage` (tokens, `username`, `firstName`, `lastName`, `isStaff` ∈ `'admin' | 'user'`). `AuthContext` (`components/auth/AuthContext.jsx`) is the source of truth; `ProtectedRoute` guards routes; idle timer in `Dashboard` auto-logs out after 30 min.
- **Global search**: `Topbar` writes `localStorage.searchTermGlobal` and dispatches a `storage` event; list components listen for it. When adding a list page, hook into the same pattern instead of creating a new search box.
- **Pagination state** is persisted per list under keys like `customerListPage` / `customerListRowsPerPage` so navigating away and back preserves position. Reuse this convention for new list pages.
- **Shared components** under `src/components/shared/` (`AlertLoading`, `AlertError`, `CustomFilter`, `EmptyRecordsCell`, `TableCustomPagination`, `NavigationRightButton`) — prefer these over inline implementations to keep list pages consistent.
- **Data fetching pattern**: list pages typically `fetchWithToken(...)` once on mount and then `setInterval(..., 5000)` to poll. Some endpoints return JSON in `response.data`, others return a JSON string that needs `JSON.parse(response.data)` — check the endpoint before assuming.

### Migration from legacy frontend

When porting a page from `api_qbwc_zoho_frontend/` (read-only reference): `process.env.REACT_APP_*` → `import.meta.env.VITE_*`, MUI → shadcn/ui + Tailwind, `react-toastify` → `sonner`, SweetAlert2 → shadcn `Dialog`, flat `components/Customers/` → kebab-case `components/customers/`.

## CI/CD

`Jenkinsfile` triggers on `githubPush` and uses `when { changeset "**/api_qbwc_zoho_backend/**" }` (and the matching frontend path) to gate stages — backend-only changes won't rebuild/deploy the frontend image, and vice versa. Builds push to AWS ECR (`324037323031.dkr.ecr.us-east-2.amazonaws.com/nws`) and force-redeploy ECS services in cluster `api-dealerportal-cluster`. Note the gating path is `api_qbwc_zoho_frontend/` (legacy) — the new frontend has no Jenkins stage yet.
