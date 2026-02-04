# Implementation Plan: Add Metric Selection to Report Blocks

The user wants to add metric selection capabilities to the report blocks. Currently, the `ReportEditor` only allows adding/removing/reordering blocks, but not editing their configuration (specifically `metricsSelected`).

## 1. Feature Description
We will add an interface to edit the metrics displayed in each block instance. This will satisfy **RF-05 (Free Metric Substitution)**.

### 1.1 UI Components
- **Block Configuration Dialog**: A popover or modal triggered from the block item in the editor.
- **Metric Selector**: A checklist or multi-select component showing available metrics for that specific block template.

## 2. Technical Implementation

### 2.1 Update `ReportEditor` (`src/app/dashboard/marketing/reports/[id]/edit/page.tsx`)
- Add a "Settings" (cog icon) button to the `SortableBlock`.
- Implement a `Sheet` or `Dialog` that opens when settings are clicked.
- Inside the dialog, fetch the block's current config and the template's supported metrics.
- Allow the user to toggle metrics from the `supportedMetrics` list defined in `BLOCK_TEMPLATES`.
- On save, call `PATCH /api/marketing/reports/[id]/blocks/[blockId]` with the new `config.metricsSelected`.

### 2.2 Component Structure
We'll create a sub-component `BlockConfigSheet` inside the page file (or a separate file if it grows too large) to handle the editing logic.

**BlockConfigSheet Props**:
- `block`: The block instance being edited.
- `template`: The template definition (to know supported metrics).
- `onSave`: Async callback to save changes.
- `onClose`: Callback to close the sheet.

## 3. Execution Steps

1.  **Modify `SortableBlock`**: Add a Settings button.
2.  **Create `BlockConfigSheet`**: Implement the UI to select metrics using ShadCN components (`Sheet`, `Checkbox`, `ScrollArea`).
3.  **Integrate**: Connect the sheet to the editor state and the update API.
