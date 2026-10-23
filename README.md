# DataForge AI

> **Enterprise Synthetic Data Platform, Stateful Mock REST API Builder & Data Quality Lab**  
> Built with **Great Generator**, FastAPI, Python 3.12/3.15, SQLite, PyArrow, React, Vite, TypeScript, and Tailwind CSS.

---

## 1. Product Overview

DataForge AI is an AI-powered developer and data engineering platform combining three core products:

1. **DataForge Studio:** Generate realistic synthetic datasets using Great Generator with strict semantics, boundaries, accepted enum values, date formats, and distributions.
2. **MockAPI Forge:** Instantly transform any generated synthetic dataset into an interactive, stateful mock REST API (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with persistence, sorting, filtering, and 1-click reset.
3. **DataTest AI (Quality Lab):** Audit datasets against 15 automated validation checks, compute transparent quality scores, inspect affected rows/columns, simulate fault injection with controlled defect percentages, and export compliance reports.
4. **AI Data Copilot:** Natural-language dataset specification assistant powered by Gemma and deterministic rule-based semantic parsers.

---

## 2. Live Application Addresses

- **Frontend Web UI:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:8000](http://localhost:8000)
- **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Health Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. Architecture & Tech Stack

```text
dataforge-ai/
├── backend/
│   ├── app/
│   │   ├── api/                 # Documented FastAPI routers (System, Studio, Schemas, Quality, Mock API, Relationships, AI)
│   │   ├── core/                # Configuration and security rules
│   │   ├── database/            # SQLAlchemy models & SQLite session manager
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── services/            # Great Generator adapter, quality engine, mock API engine, relational designer
│   │   └── tests/               # Pytest suite with 100% passing tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/layout/   # Sidebar, TopNav with Ctrl+K command palette, AppLayout
│   │   ├── pages/               # 14 functional pages (Overview, Studio, Schema Builder, etc.)
│   │   ├── services/            # Typed API client
│   │   └── App.tsx              # React Router v6 routing
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── data/
│   ├── dataforge.db             # SQLite local database
│   ├── datasets/                # High-performance Parquet dataset files
│   ├── mock_state/              # Stateful JSON mutation stores for Mock APIs
│   └── reports/                 # Quality audit reports
└── exports/                     # Generated CSV, JSON, Parquet, and SQL files
```

### Backend
- **FastAPI & Uvicorn:** Async REST API server with OpenAPI docs.
- **Great Generator (`great-generator`):** Official core synthetic generation engine.
- **Pandas & PyArrow:** High-throughput dataset generation, transformations, and Parquet serialization.
- **SQLAlchemy & SQLite:** Local persistent catalog of schemas, datasets, mock APIs, generation jobs, and audit reports.
- **pytest & HTTPX:** Automated test suites.

### Frontend
- **React 18 & TypeScript:** Strict type-safe UI components.
- **Vite:** Blazing fast development server and optimized production bundler.
- **Tailwind CSS:** Dark navy / charcoal developer SaaS aesthetic with Indigo accents.
- **Lucide Icons:** Clean developer glyphs across navigation and controls.
- **Recharts:** Interactive generation activity and format distribution visualizations.

---

## 4. 14 Fully Functional Sidebar Pages

1. **Overview Dashboard (`/`):** Live platform metrics (total records, active mock APIs, quality averages), generation output charts, and quick-start actions.
2. **Data Studio (`/studio`):** Core generator supporting natural language prompts, visual schema builder, Great Generator domain presets (banking, healthcare, ecommerce, etc.), and SQL DDL.
3. **Schema Builder (`/schema-builder`):** Visual schema definition tool with column types, min/max bounds, enum accepted values, descriptions, JSON import/export, and database persistence.
4. **Relationship Designer (`/relationships`):** Visual designer for multi-table star schemas (Customers, Orders, Items, Payments) with verified foreign keys and 100% referential integrity.
5. **MockAPI Forge (`/mockapi`):** Deploy stateful REST endpoints from datasets with pagination, filtering, allowed HTTP verb toggles, and sample code snippets.
6. **API Explorer (`/api-explorer`):** In-browser HTTP client to execute `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests with live latency measurements and response headers.
7. **Data Quality Lab (`/quality`):** 15 automated validation checks, transparent scoring out of 100, and fault injection simulator.
8. **AI Copilot (`/ai-copilot`):** Natural-language conversational prompt-to-schema assistant with Gemma and deterministic rule-based NLP fallback.
9. **Dataset Explorer (`/datasets`):** Manage, search, paginate, inspect, and export saved datasets as CSV, JSON, Parquet, or SQL.
10. **Templates (`/templates`):** 15 pre-built domain templates (Customers, Products, Inventory, Orders, Transactions, Employees, Students, Attendance, Hospital Appointments, Hospital Admissions, SaaS Subscriptions, Support Tickets, IoT Sensors, Social Posts, Developer Telemetry).
11. **Generation History (`/history`):** Complete execution audit trail with row counts, random seeds, durations, and reproducibility configurations.
12. **Reports (`/reports`):** Archive of quality audit reports downloadable in Markdown and JSON formats.
13. **Documentation (`/docs`):** In-depth guides, Great Generator tutorials, and copy-paste code snippets for Python, cURL, and JavaScript Fetch.
14. **Settings (`/settings`):** Local storage directory layout, row limit thresholds, and AI provider configurations.

---

## 5. Quick Start Instructions

### Prerequisites
- Python 3.12 or 3.15
- Node.js 18+ and npm

### Startup Commands

#### Start Backend:
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Start Frontend:
```bash
cd frontend
npm run dev
```

#### Run Automated Tests:
```bash
cd backend
python -m pytest app/tests/ -v
```

---

## 6. End-to-End Acceptance Test Verification

All 15 verification steps have been validated directly against the running services:
1. `GET /health` returned `status: healthy` with engine `great-generator`.
2. Created schema with custom constraints and types.
3. Generated 100 synthetic records with realistic names, emails, and bounded ages.
4. Paginated and previewed records.
5. Exported dataset as CSV, JSON, and Parquet.
6. Created Mock REST API `/api/mock/live_customers`.
7. Queried mock API via `GET` with pagination.
8. Created new record via `POST` with HTTP 201 Created.
9. Updated record via `PATCH`.
10. Deleted record via `DELETE`.
11. Reset mock API state to restore initial generated records.
12. Executed 15 data quality checks and generated a quality score of 100.0/100.
13. Injected 15% controlled defects (missing values, corrupted emails) into a separate test variant without touching the original dataset.
14. Verified original dataset remained completely intact.
15. Refreshed and confirmed database persistence in SQLite and Parquet storage.
