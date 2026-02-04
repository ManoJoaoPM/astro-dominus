# Implementation Plan: Dynamic QR Code Refresh

The user requests that the system checks for a new QR Code every 3 seconds while in the "connecting" state, because the QR code changes periodically. The current implementation only fetches the QR code once during creation and relies on webhooks (which might fail locally) or static polling of the *database*. Since the DB isn't being updated by webhooks (likely due to localhost), the QR code becomes stale or remains empty.

## 1. Feature Description
We need to actively fetch the latest QR code from Evolution API whenever the frontend polls for the instance status, specifically when the status is "connecting".

## 2. Technical Implementation

### 2.1 Backend (`src/app/api/whatsapp/instances/[[...id]]/route.ts`)
The `CRUDController`'s `beforeGet` hook is designed to modify the *query filters*, not to transform the *results*. We cannot easily modify the returned documents inside `beforeGet`.

However, `CRUDController` usually returns the found documents. If we want to intercept and update the data *on read*, we might need to override the `GET` handler or use a specific pattern.

**Better Approach**: Create a dedicated "Refresh QR" endpoint or modify the `GET` logic to perform a "lazy update" if the instance is connecting.
Since we are using `CRUDController`, overriding `GET` completely is possible but verbose.

**Alternative**: Use `afterGet` hook if available? The standard `struct` `CRUDController` typically supports `beforeGet` (query modification) but might not support `afterGet` (result transformation) in all versions.

**Proposed Solution**:
Create a new dedicated route `src/app/api/whatsapp/instances/[id]/refresh/route.ts` (or similar) that:
1.  Fetches the instance from DB.
2.  If status is "connecting", calls `evolution.connectInstance()`.
3.  Updates the DB with the new QR code.
4.  Returns the updated instance.

Then, update the Frontend to call this endpoint or have the existing SWR polling hit this endpoint.

**Even Simpler**: Update the Frontend `useSWR` to call a new endpoint `/api/whatsapp/instances/refresh?clientId=...` which does the check-and-update logic, OR modify the existing `GET` to handle a `refresh=true` query param if we were writing a custom handler.

Given the constraints and the need for speed:
1.  **Create `src/app/api/whatsapp/instances/refresh/route.ts`**:
    - Accepts `clientId`.
    - Finds the instance.
    - If "connecting", fetches new QR from Evolution.
    - Updates DB.
    - Returns instance.
2.  **Update Frontend**: Change the SWR endpoint to this new route (or add a secondary poller).

Actually, since the user said "no timer de a cada 3 segundos ele faça uma verificação", and the frontend *already* polls `/api/whatsapp/instances?clientId=...` every 3 seconds:

We can simply **modify the existing GET logic** in `route.ts`? No, `CRUDController` is a class.
We can export a custom `GET` that wraps the controller's `GET`, or creates a separate route.

**Plan**:
1.  Create `src/app/api/whatsapp/instances/refresh/route.ts`.
2.  In this route, we find the instance for the client.
3.  If `status === 'connecting'`, we call `evolution.connectInstance`, get the new QR, update the DB `WhatsAppInstance`, and save.
4.  Return the instance.
5.  Update Frontend to poll this `/refresh` endpoint instead of the standard list endpoint when waiting for connection.

## 3. Execution Steps

1.  **Create Route**: `src/app/api/whatsapp/instances/refresh/route.ts`.
2.  **Update Frontend**: `src/app/dashboard/clients/[clientId]/whatsapp/connect/page.tsx`.
    - Switch SWR URL to `/api/whatsapp/instances/refresh?clientId=${clientId}`.

This ensures that every 3 seconds, we not only read the DB but also actively refresh the data from Evolution.
