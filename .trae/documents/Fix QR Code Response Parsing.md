# Implementation Plan: Fix QR Code Retrieval and Update Loop

The user is reporting an "infinite generating QR code" state. The backend is successfully creating the instance and returning a record, but the `qrCode` field is empty/undefined. This means `evolution.connectInstance` is likely failing or returning a different structure than expected, OR the `QRCODE_UPDATED` webhook is not updating the database correctly/fast enough.

## 1. Diagnosis
1.  **Creation Phase**: `src/app/api/whatsapp/instances/[[...id]]/route.ts` calls `evolution.createInstance` then `evolution.connectInstance`.
    - If `createInstance` succeeds, it returns metadata.
    - `connectInstance` is called immediately. Evolution API might take a few milliseconds to be ready to generate a QR code.
2.  **Webhook Phase**: Evolution should fire `QRCODE_UPDATED` to `src/app/api/webhooks/evolution/route.ts`.
    - If the webhook is not firing (e.g. localhost URL issue) or failing, the DB is never updated with the QR code.
3.  **Frontend**: Polling `/api/whatsapp/instances` checks the DB. If `qrCode` is missing, it shows "Generating...".

**Key Issue**: The initial `connectInstance` call might be returning `null` or a structure we aren't parsing correctly, AND the webhook fallback isn't working (likely due to localhost environment).

## 2. Solution
We need to ensure the `qrCode` is populated either synchronously during creation or reliably via polling/webhook.

1.  **Debug/Fix `connectInstance` Response**: Check if the response actually contains `qrcode.base64`. Evolution v2 often returns `{ base64: "..." }` or `{ qrcode: { base64: "..." } }`. Our code expects `response.data.qrcode.base64` or `response.data`.
    - In `api.ts`: `return response.data;`
    - In `route.ts`: `data.qrCode = connectionData?.qrcode?.base64;`
    - We should check if `connectionData.base64` exists directly (common in some versions).

2.  **Fallback Mechanism**: If `connectInstance` returns empty initially, we rely on the webhook. Since the user is likely on localhost without a public URL, the webhook won't work.
    - **Workaround**: The Frontend is already polling the *internal DB*. We should also make the Frontend (or a specific API route) capable of fetching the QR code *directly* from Evolution on demand if it's missing in the DB.
    - **Better approach**: In `GET /api/whatsapp/instances`, if an instance is "connecting" but has no QR code, try to fetch it from Evolution dynamically and update the DB.

## 3. Execution Steps

1.  **Modify `src/app/api/whatsapp/instances/[[...id]]/route.ts`**:
    - Update `beforeGet` hook (or `afterGet` if available, or just inside the `GET` logic via a custom controller method? `CRUDController` hooks are limited).
    - Actually, `CRUDController` might not support "on read" side effects easily.
    - **Alternative**: Create a new route `src/app/api/whatsapp/instances/[id]/qrcode/route.ts` to manually refresh/fetch the QR code.
    - **Simpler**: Update `src/services/evolution/api.ts` to handle different response formats for `connectInstance`.

2.  **Fix Response Parsing in `route.ts`**:
    - `data.qrCode = connectionData?.qrcode?.base64 || connectionData?.base64 || connectionData?.qrcode;`

3.  **Create Refresh Endpoint** (Optional but recommended):
    - `GET /api/whatsapp/instances/[id]/connect` -> triggers `evolution.connectInstance` and updates DB.
    - Update Frontend to call this if stuck.

**Decision**: Let's first make the `create` logic more robust in parsing the response.

**Response Structure Analysis**:
Evolution v1/v2 `GET /instance/connect/{instance}` usually returns:
```json
{
  "instance": "name",
  "base64": "data:image/png;base64,..."
}
```
OR
```json
{
  "qrcode": {
    "base64": "..."
  }
}
```
Our current code expects `connectionData?.qrcode?.base64`. If it returns `{ base64: ... }`, it fails.

## Plan
1.  **Update `src/app/api/whatsapp/instances/[[...id]]/route.ts`**:
    - Improve QR code extraction logic in `beforeCreate`.
2.  **Update `src/services/evolution/api.ts`**:
    - Ensure `connectInstance` returns the raw data correctly.

If that doesn't fix it (because Evolution needs time), we will add a "Refresh QR" button in the frontend or auto-refresh logic.

Let's start by fixing the parsing.
