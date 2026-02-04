Corrigirei o mapeamento da resposta da Evolution API para que o sistema consiga extrair corretamente as mensagens do objeto `messages.records`.

### Passos da Implementação:

1.  **Atualizar EvolutionApi (`src/services/evolution/api.ts`)**:
    - Modificar `fetchMessages` para tentar extrair o array de mensagens de `data.messages.records`, `data.record` ou `data` diretamente.
    - Adicionar logs para mostrar o formato exato detectado.

2.  **Refinar WhatsAppSyncService (`src/services/whatsapp/sync.ts`)**:
    - Garantir que a lógica de extração de conteúdo (`extractContent`) seja compatível com o formato de mensagem dentro de `records`.
    - Melhorar o log de depuração para mostrar quantas mensagens foram extraídas do objeto complexo.
