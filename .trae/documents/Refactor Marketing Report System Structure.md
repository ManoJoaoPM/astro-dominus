# Implementation Plan: Fix Report System Structure and Bugs

This plan addresses the structural issues and bugs identified in the implementation of the Marketing Report system.

## 1. Create `utils.tsx` for Marketing Models
We will move the UI definitions (columns, fields) from `page.tsx` and `index.ts` to their dedicated `utils.tsx` files as per the Struct pattern.

### 1.1 Report Utils
- **Path**: `src/models/marketing/report/utils.tsx`
- **Content**:
    - `reportColumns`: Definition of table columns.
    - `reportFields`: Definition of form fields.
- **Action**: Extract these from `src/app/dashboard/marketing/reports/page.tsx` and `index.ts`.

### 1.2 ReportBlock Utils
- **Path**: `src/models/marketing/report-block/utils.tsx`
- **Content**: `reportBlockSchema` (if applicable for client-side validation).

### 1.3 MetricSnapshot Utils
- **Path**: `src/models/marketing/metric-snapshot/utils.tsx`
- **Content**: Empty or basic definitions if needed.

## 2. Fix Reports Page (`src/app/dashboard/marketing/reports/page.tsx`)

### 2.1 Remove Inline Definitions
- Import `reportColumns` and `reportFields` from the new `src/models/marketing/report/utils.tsx`.

### 2.2 Fix `TableView` Props
- **Issue**: `onRowClick` is not a valid prop for `TableView` in the current Struct version.
- **Fix**: Use the `actions` prop or a custom cell renderer to provide a link/button to the edit page. Alternatively, if `TableView` supports `asChild`, wrap the row. We will use a standard "Edit" action button in the columns or check if `TableView` allows row linking via a different prop (e.g., `href` builder). *Correction*: Based on typical Struct usage, we'll add an "Ações" column with an Edit button that navigates to the edit page.

### 2.3 Fix Modal Form
- **Issue**: "Quando vamos criar um novo formulário ele abre um Modal sem botão de criar".
- **Fix**: Ensure `ModalForm` has the correct `trigger` (if controlled internally) or `buttonLabel` prop. Since it's controlled via `useModalForm`, the button inside the modal footer should appear if `schema` and `fields` are correct. We will double-check the `ModalForm` implementation and ensure `buttonLabel="Criar Relatório"` is passed.

## 3. Refactor Models

### 3.1 Report Model
- **Path**: `src/models/marketing/report/index.ts`
- **Action**: Keep only Types and Zod Schemas here. Move UI configs to `utils.tsx`.

## 4. Execution Steps

1.  **Create Utils**: Create `src/models/marketing/report/utils.tsx` and move fields/columns there.
2.  **Refactor Page**: Update `src/app/dashboard/marketing/reports/page.tsx` to use the imported utils.
3.  **Fix Table Interaction**: Replace `onRowClick` with an explicit Action column or valid Struct pattern.
4.  **Fix Modal**: Add `buttonLabel` to `ModalForm`.
5.  **Verify Models**: Create empty `utils.tsx` for other marketing models to maintain consistency.
