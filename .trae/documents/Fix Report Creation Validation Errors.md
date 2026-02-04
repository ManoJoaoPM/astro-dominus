# Implementation Plan: Fix Report Creation Validation Errors

The user is encountering validation errors when creating a report:

1. `clientId`: "Invalid input: expected string, received undefined"
2. `isPublic`: "Invalid input: expected boolean, received array"

These errors stem from how the `ModalForm` sends data and how `zod` validates it.

## 1. Fix `clientId` Missing

The `reportSchema` requires `clientId`, but the form (`ModalForm`) is not automatically injecting it. In a typical multi-tenant or client-scoped app, the `clientId` should be passed via context, URL params, or a hidden field.

Since `ReportsPage` is likely rendered within a client context (e.g., `/dashboard/clients/[clientId]/marketing/reports` or similar), we need to ensure `clientId` is available.
However, looking at the path `src/app/dashboard/marketing/reports/page.tsx`, it seems to be a general list. If it's a general list, the user must **select a client** or the system must infer it.

Given the error `expected string, received undefined`, the backend is not receiving `clientId`.
We need to:

* **Option A**: Add a `clientId` field to the form (if the user can choose the client).

* **Option B**: Inject `clientId` in `beforeCreate` hook if it's derived from the user session or context (but `CRUDController` doesn't magically know the client).

**Decision**: Add a `clientId` field to `reportFields` in `utils.tsx` so the user can select the client (using `model-select` type).

## 2. Fix `isPublic` Type Error

The error `expected boolean, received array` suggests that the checkbox component in `ModalForm` is sending an array (e.g., `['on']` or `['true']`) instead of a simple boolean `true/false`.
This is a common issue with some form libraries handling checkboxes.

We need to:

* **Fix**: Update the Zod schema to accept the array format and transform it to boolean, OR ensure the frontend component sends a boolean.

* **Action**: Modify `reportSchema` in `src/models/marketing/report/index.ts` to use `z.preprocess` or `z.union` to handle the array input, OR fix the `checkbox` field type definition to ensure it emits boolean.

## 3. Execution Steps

1. **Update** **`reportFields`**: Add `clientId` field (type: `model-select`, model: `client`) to `src/models/marketing/report/utils.tsx`.
2. **Update** **`reportSchema`**: Modify `src/models/marketing/report/index.ts` to handle the `isPublic` array issue. We'll use `z.preprocess` to convert the array/string value to a boolean.

### Plan Details

**Step 1: Update Utils**
File: `src/models/marketing/report/utils.tsx`

* Add:

  ```typescript
  {
    name: "clientId",
    label: "Cliente",
    type: "model-select",
    model: "client", // or "astro/client" depending on registration
    required: true,
  }
  ```

**Step 2: Update Schema**
File: `src/models/marketing/report/index.ts`

* Modify `isPublic`:

  ```typescript
  isPublic: z.preprocess((val) => {
    if (Array.isArray(val)) return val.includes("on") || val.includes("true");
    if (val === "on" || val === "true") return true;
    return Boolean(val);
  }, z.boolean().default(false)),
  ```

