# Implementation Plan: Integrated Modular Report System

This plan outlines the steps to build the custom drag-and-drop reporting system for Meta and Google Ads, adhering to the `struct-boilerplate` patterns.

## 1. Data Modeling (Backend)

We will create the necessary Mongoose models and Zod schemas in `src/models/marketing`.

### 1.1 Report Entity
- **Path**: `src/models/marketing/report`
- **Fields**: `clientId`, `name`, `slug` (unique, for public link), `dateRange` (start/end or preset), `isPublic`.
- **Purpose**: Stores the report metadata and global configuration.

### 1.2 Report Block Instance
- **Path**: `src/models/marketing/report-block`
- **Fields**: `reportId`, `templateId` (e.g., 'SM-01'), `order` (number), `config` (JSON: selected metrics, overrides).
- **Purpose**: Represents a specific block added to a report.

### 1.3 Metric Snapshot (Normalized Data)
- **Path**: `src/models/marketing/metric-snapshot`
- **Fields**: `clientId`, `provider` (meta_ads, google_ads, etc.), `metricKey`, `date`, `value`, `dimensions` (JSON).
- **Purpose**: Unified storage for all metrics, allowing flexible querying regardless of the source.

### 1.4 Block Templates (Library)
- **Path**: `src/constants/marketing/blocks.ts`
- **Content**: Static definition of available blocks (SM-01, TP-01, etc.), their default layouts, and supported metrics.

## 2. API Implementation

We will use `CRUDController` and standard Next.js routes.

### 2.1 Reports Management
- `GET/POST /api/marketing/reports`: List and create reports.
- `GET/PATCH/DELETE /api/marketing/reports/[id]`: Manage specific reports.

### 2.2 Block Management
- `POST /api/marketing/reports/[id]/blocks`: Add a block.
- `PATCH /api/marketing/reports/[id]/blocks/[blockId]`: Update config/metrics.
- `DELETE /api/marketing/reports/[id]/blocks/[blockId]`: Remove block.
- `PATCH /api/marketing/reports/[id]/reorder`: Update block positions.

### 2.3 Public View
- `GET /api/public/reports/[slug]`: Read-only endpoint returning the report and its fully populated blocks (data + config).

### 2.4 Data Sync
- Refactor `src/app/api/marketing/sync` to populate `MetricSnapshot` in addition to/instead of `DailyFact`.
- Implement fetching logic for Meta Ads (adapting existing service).

## 3. Frontend Implementation

### 3.1 Report Editor (`/dashboard/marketing/reports/[id]/edit`)
- **Drag-and-Drop**: Use `@dnd-kit` to allow reordering of blocks.
- **Sidebar**: List of available templates from the library.
- **Block Config**: UI to select metrics and filters for each block instance.

### 3.2 Public Viewer (`/r/[slug]`)
- **Layout**: Clean, read-only interface.
- **Rendering**: Dynamic rendering of blocks based on the JSON configuration returned by the API.

### 3.3 Components
- `BlockRenderer`: Generic component that takes a `templateId` and `data` and renders the appropriate chart/table.
- `MetricCard`: Standard UI for displaying a single metric.

## 4. Execution Steps

1.  **Models**: Create `Report`, `ReportBlock`, `MetricSnapshot`.
2.  **Constants**: Define the `BLOCK_TEMPLATES` library.
3.  **APIs**: Implement the CRUD routes for Reports and Blocks.
4.  **Sync**: Update the sync engine to normalize data into `MetricSnapshot`.
5.  **Frontend**: Build the Editor and Public View pages.

This approach ensures modularity (RF-03), flexibility (RF-05), and performance (RNF-01) by decoupling the data storage from the presentation.
