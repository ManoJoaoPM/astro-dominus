Implementarei a funcionalidade de "Observador de Conversas do WhatsApp" integrando todos os requisitos da especificação técnica, com foco em uma interface funcional e independente do framework `Struct`.

### 1. Modelagem de Dados (MongoDB)
- **WhatsAppInstance**: Incluir `lastActivityAt`, `status` detalhado e logs de conexão.
- **Thread (Conversa)**: 
  - Atributos: `remoteJid`, `contactName`, `origin` (`Orgânico`, `Google Ads`, `Meta Ads`, `Não identificado`), `isPinned`, `lastMessagePreview`, `firstContactAt`.
  - Persistência: Mantida permanentemente para histórico (mesmo após 180 dias).
- **Message**: 
  - Atributos: `direction` (inbound/outbound), `type`, `content`, `mediaMeta` (apenas link/referência), `timestamp`.
  - Retenção: Índice TTL de 180 dias para deleção automática.

### 2. Backend & Integração (Evolution API)
- **Webhook Resiliente**: Ingestão de mensagens e eventos de conexão com deduplicação por `messageId`.
- **API Customizada**:
  - Listagem de instâncias com tempo de offline.
  - Inbox com filtros por origem, busca e filtro "Somente Fixados".
  - Ações de Pin e alteração manual de Origem.
  - Carregamento incremental (Infinite Scroll) de mensagens.

### 3. Interface do Usuário (Custom Inbox)
- **Tela de WhatsApps**: Grid/Lista com status em tempo real, alertas de desconexão ("Offline há X tempo") e fluxo de QR Code.
- **Inbox de Conversas**:
  - **Sidebar**: Lista ordenada por atividade, com pins no topo, busca e filtros de origem.
  - **Chat**: Visualização somente leitura, inbound/outbound, e seletor de origem no cabeçalho.
- **Acesso Interno**: Interface restrita à equipe da empresa.

### 4. Regras de Negócio Implementadas
- **Somente Leitura**: Sem inputs de envio.
- **Sem Histórico Antigo**: Registro inicia a partir da conexão.
- **Mídias Leves**: Sem armazenamento de arquivos pesados ou base64.
- **Edição de Origem**: Total flexibilidade para o time interno ajustar a classificação.
