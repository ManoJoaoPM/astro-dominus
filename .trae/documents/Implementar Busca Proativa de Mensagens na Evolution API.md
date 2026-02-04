Adicionarei métodos de busca proativa na `EvolutionApi` para permitir que o sistema recupere mensagens recentes diretamente da API, garantindo que a Inbox seja populada corretamente mesmo que o Webhook falhe ou no momento da conexão inicial.

### Passos da Implementação:

1.  **Atualizar `EvolutionApi`**:
    - Adicionar `fetchChats(instanceName)` para listar conversas do WhatsApp.
    - Adicionar `fetchMessages(instanceName, remoteJid)` para buscar as mensagens mais recentes de um chat.
2.  **Criar Serviço de Sincronização**:
    - Implementar uma lógica que utiliza esses novos métodos para popular os modelos `Conversation` e `Message` no banco de dados.
3.  **Integrar no Endpoint de Refresh**:
    - Fazer com que o `refresh/route.ts` dispare uma sincronização rápida ao detectar que uma instância acabou de ser conectada.
4.  **Ajustar Webhook**:
    - Incluir suporte ao evento `SEND_MESSAGE` para capturar mensagens enviadas pelo próprio usuário através do aparelho físico.
