# Implementation Plan: WhatsApp Backend Optimization & Robustness

This plan addresses the requirement to make the WhatsApp backend "totally functional" and optimized before further frontend development. It focuses on connection management, status verification, and optimized message storage (partial caching).

## 1. Connection & Status Management

### 1.1 Store Connection Status
- **Goal**: Persist status (`connecting`, `connected`, `disconnected`, `error`) and timestamps.
- **Current State**: `WhatsAppInstance` model already has `status`.
- **Enhancement**: Ensure `lastStatusCheck` is updated during verifications.

### 1.2 Automatic Status Verification
- **Goal**: Verify connection with Evolution API whenever a dependent page is accessed.
- **Implementation**:
    - Update `src/app/api/whatsapp/instances/refresh/route.ts` to not only refresh QR code but also **validate connection status**.
    - If Evolution says "connected" but DB says "disconnected", update DB.
    - If Evolution says "disconnected" but DB says "connected", update DB.
    - This endpoint is already called by the frontend polling.

## 2. Optimized Message Storage & Retrieval

### 2.1 Partial Message Storage (Pagination)
- **Goal**: Store all messages but load only 20 by default.
- **Current State**: `Message` model stores everything. `CRUDController` for messages (`src/app/api/whatsapp/messages/[[...id]]/route.ts`) sorts by `timestamp: 1` (oldest first) which is good for full chat, but for "latest 20" we need reverse sort + limit.
- **Implementation**:
    - Modify `GET /api/whatsapp/messages` to support **cursor-based pagination** or `limit/offset`.
    - Default behavior: Fetch last 20 messages.
    - Add `beforeGet` hook to handle `limit` and `before` (timestamp) query params for scrolling up.

### 2.2 List Conversations
- **Goal**: List conversations with "preview" (last message).
- **Current State**: `Conversation` model has `lastMessageContent` and `lastMessageAt`.
- **Action**: Ensure `webhook` updates these fields correctly (already implemented). No changes needed if webhook logic is solid.

## 3. Implementation Steps

### Step 1: Enhanced Instance Refresh Logic
- **File**: `src/app/api/whatsapp/instances/refresh/route.ts`
- **Logic**:
    - Call `evolution.fetchInstances()` or specific instance state.
    - Update DB `status` based on API response.
    - If `connecting`, continue fetching QR.

### Step 2: Optimized Message Retrieval
- **File**: `src/app/api/whatsapp/messages/[[...id]]/route.ts`
- **Logic**:
    - Implement pagination in `beforeGet` or override `GET` if `CRUDController` is too limiting.
    - Standard `CRUDController` might support `limit` and `skip` via query params. We will verify and ensure it sorts correctly for "chat history" (usually we want newest 20, then reverse them for display, or fetch range).
    - **Strategy**: Fetch `limit=20`, `sort={timestamp: -1}` (newest first), then reverse on client OR fetch with `sort={timestamp: -1}` and `timestamp < last_seen_timestamp`.

### Step 3: Verify Webhook Logic
- **File**: `src/app/api/webhooks/evolution/route.ts`
- **Logic**: Ensure `MESSAGES_UPSERT` updates `Conversation.lastMessage*` fields correctly (already done).

## 4. Execution Plan

1.  **Enhance Refresh Endpoint**: Update `src/app/api/whatsapp/instances/refresh/route.ts` to handle status synchronization (connected/disconnected) in addition to QR codes.
2.  **Optimize Message API**: Update `src/app/api/whatsapp/messages/[[...id]]/route.ts` to support pagination parameters (`limit`, `before`).

This ensures the backend is robust, self-healing (status checks), and performant (pagination).
