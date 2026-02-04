# Implementation Plan: Fix Evolution API Instance Creation Webhook Error

The user is experiencing a `400 Bad Request` with the message `Invalid "url" property` when creating an instance in the Evolution API.

## 1. Diagnosis
The `createInstance` method in `src/services/evolution/api.ts` sends:
```json
{
  ...
  "webhook": webhookUrl,
  "webhook_by_events": true,
  ...
}
```

The error `Invalid "url" property` suggests that the `webhook` field is being rejected. This can happen if:
1. `webhookUrl` is undefined or empty.
2. The Evolution API expects `webhook` to be an object (e.g., `webhook: { url: "..." }`) rather than a string in some versions.
3. The URL itself is malformed (e.g., `undefined/api/webhooks/evolution`).

In `src/app/api/whatsapp/instances/[[...id]]/route.ts`, we see:
```typescript
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`;
```
If `process.env.NEXT_PUBLIC_APP_URL` is undefined, the URL becomes `undefined/api/webhooks/evolution`, which is invalid.

## 2. Solution
We will check if `webhookUrl` is valid before sending it. If it's not provided or invalid, we should omit the webhook configuration to avoid the 400 error, or ensure the environment variable is set.

However, to fix the specific error `Invalid "url" property` when `webhook` is provided, we should check if the API expects `webhook_url` or if `webhook` should be just the string. Based on Evolution v2 docs, it might be strict about the URL format.

Given the error `Invalid "url" property`, it's highly likely the URL is `undefined...`.

**Plan:**
1.  **Validate URL**: In `src/app/api/whatsapp/instances/[[...id]]/route.ts`, ensure `webhookUrl` is valid. If `NEXT_PUBLIC_APP_URL` is missing, fallback to a placeholder or omit the webhook.
2.  **Fix API Service**: In `src/services/evolution/api.ts`, conditionally include `webhook` only if it's a valid string.

## 3. Execution Steps

1.  **Modify `src/app/api/whatsapp/instances/[[...id]]/route.ts`**:
    - Add a check for `process.env.NEXT_PUBLIC_APP_URL`.
    - If missing, log a warning and pass `undefined` (or a valid fallback if testing locally like ngrok).

2.  **Modify `src/services/evolution/api.ts`**:
    - Update `createInstance` to conditionally add `webhook` and `webhook_by_events` only if `webhookUrl` is provided.

This will prevent sending an invalid URL and causing the 400 error.
