# Implementation Plan: WhatsApp Conversation Intelligence

This plan outlines the steps to implement the WhatsApp monitoring and intelligence feature using the Evolution API, as requested.

## 1. Data Modeling

We will create the necessary Mongoose models to store WhatsApp instances, conversations, and messages.

### 1.1 WhatsApp Instance (`src/models/whatsapp/instance`)
- **Fields**: `clientId`, `instanceName` (unique ID in Evolution), `status` (connected, disconnected, etc.), `qrCode` (base64/string, transient), `evolutionId`.
- **Purpose**: Manage the connection between a Client and the Evolution API.

### 1.2 Conversation (`src/models/whatsapp/conversation`)
- **Fields**: `instanceId`, `remoteJid` (phone number), `contactName`, `lastMessageContent`, `lastMessageAt`, `unreadCount`, `source` (Meta Ads, Google Ads, Unknown).
- **Purpose**: Aggregate messages by contact (Feature 2 & 3).

### 1.3 Message (`src/models/whatsapp/message`)
- **Fields**: `conversationId`, `instanceId`, `evolutionId` (message ID), `key` (remoteJid), `fromMe` (boolean), `content` (text), `timestamp`, `type` (text, image, audio), `analysis` (JSON - intent, keywords).
- **Purpose**: Store full chat history and analysis results (Feature 4 & 5).

## 2. Evolution API Integration

We will create a service wrapper for the Evolution API to handle instance creation, QR code retrieval, and webhook management.

### 2.1 Service (`src/services/evolution/api.ts`)
- **Methods**:
    - `createInstance(instanceName)`
    - `connectInstance(instanceName)` -> returns QR Code
    - `fetchInstances()`
    - `setWebhook(instanceName, url)`

### 2.2 Webhook Handler (`src/app/api/webhooks/evolution/route.ts`)
- **Purpose**: Receive real-time events from Evolution API.
- **Events**:
    - `qrcode.updated`: Update QR code in DB/UI.
    - `connection.update`: Update instance status.
    - `messages.upsert`: Save new messages, create/update conversations, trigger analysis.

## 3. Intelligence Engine (Analysis & Triggers)

We will implement a simple analysis engine (using OpenAI or rule-based initially, extensible to AI) to process incoming messages.

### 3.1 Analysis Service (`src/services/intelligence/analyzer.ts`)
- **Function**: `analyzeMessage(content)`
- **Logic**: Detect intents (e.g., "price", "visit") and keywords.
- **Output**: Analysis object stored in the Message model.

### 3.2 Trigger Service (`src/services/intelligence/trigger.ts`)
- **Function**: `processTriggers(message, analysis)`
- **Logic**: If analysis matches specific criteria (e.g., intent="buy"), execute defined actions (log event, update lead status).

## 4. Frontend Implementation

### 4.1 Connection Page (`src/app/dashboard/clients/[clientId]/whatsapp/connect/page.tsx`)
- **UI**: QR Code display, Connection Status, "Connect" button.
- **Logic**: Poll for status or listen to socket/updates.

### 4.2 Conversation List (`src/app/dashboard/clients/[clientId]/whatsapp/conversations/page.tsx`)
- **UI**: List of contacts with last message, time, and source tag.

### 4.3 Chat View (`src/app/dashboard/clients/[clientId]/whatsapp/conversations/[phone]/page.tsx`)
- **UI**: Message bubbles (sent/received), timestamps, read-only view.

## 5. Execution Steps

1.  **Models**: Create `WhatsAppInstance`, `Conversation`, `Message` models.
2.  **Service**: Implement `EvolutionApi` service.
3.  **Backend**: Create API routes for instance management and webhooks.
4.  **Intelligence**: Implement basic `Analyzer` and `Trigger` services.
5.  **Frontend**: Build Connection, List, and Detail pages.
6.  **Env**: Add `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` to `env.ts` (if not already present).

This plan covers all 8 features and the acceptance criteria defined in the prompt.
