Reestruturarei o serviço de integração com a Evolution API para seguir o fluxo de "Observador Proativo" recomendado, garantindo sincronização total de conversas, mensagens e metadados.

### 1. Evolução da EvolutionApi (`src/services/evolution/api.ts`)

* **Instâncias**: Adicionar `getConnectionState`, `restartInstance`, `logoutInstance`.

* **Webhook**: Implementar `setWebhook` e `findWebhook` para garantir a configuração automática.

* **Consultas**: Corrigir `fetchChats` para `POST` e adicionar `fetchMessages`, `fetchProfilePictureUrl`, `findContacts` e `getBase64FromMediaMessage`.

### 2. Aprimoramento do WhatsAppSyncService (`src/services/whatsapp/sync.ts`)

* **Carga Inicial**: Implementar varredura de chats (top 50) e mensagens (top 20) ao conectar.

* **Metadados**: Sincronizar nomes e fotos de perfil dos contatos.

* **Resiliência**: Lógica de "cursor" para evitar duplicatas e preencher lacunas de mensagens.

### 3. Refatoração do Webhook (`src/app/api/webhooks/evolution/route.ts`)

* **Eventos**: Suporte a `messages.update`, `messages.delete` e `connection.update`.

* **Automação**: Garantir que o webhook seja configurado automaticamente no `beforeCreate` da instância.

### 4. Melhorias na Inbox (`src/app/dashboard/clients/.../inbox/page.tsx`)

* **Visual**: Exibir fotos de perfil e nomes reais.

* **Mídia**: Suporte a visualização de imagens e áudios via conversão Base64.

