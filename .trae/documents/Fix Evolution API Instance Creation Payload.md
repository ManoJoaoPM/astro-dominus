# Implementation Plan: Fix Evolution API Instance Creation Error

The user is experiencing a `400 Bad Request` with the message `Invalid integration` when creating an instance in the Evolution API. This typically happens when the `integration` field (which corresponds to "WHATSAPP-BAILEYS") is missing or incorrect in the request body, or if the API version expects a specific payload structure.

Based on the Evolution API documentation (v1/v2), the `integration` type is often required or defaults to `WHATSAPP-BAILEYS`.

## 1. Diagnosis
The current implementation in `src/services/evolution/api.ts` sends:
```json
{
  "instanceName": "...",
  "token": "",
  "qrcode": true,
  "webhook": "...",
  "webhook_by_events": true,
  "events": [...]
}
```

The error `Invalid integration` suggests we need to explicitly specify the integration type.

## 2. Solution
We need to update the `createInstance` method in `src/services/evolution/api.ts` to include `integration: "WHATSAPP-BAILEYS"`.

## 3. Execution Steps

1.  **Modify `src/services/evolution/api.ts`**:
    - Update the payload in `createInstance` to include `integration: "WHATSAPP-BAILEYS"`.

This should resolve the "Invalid integration" error.
