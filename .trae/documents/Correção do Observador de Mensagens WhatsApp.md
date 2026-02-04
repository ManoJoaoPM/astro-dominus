# Diagnóstico e Correção: Webhook não recebe mensagens

O comportamento “não observa nenhuma mensagem enviada/recebida” quase sempre acontece por 2 causas no seu código:
1) o webhook **não está registrado** (ou está registrando com URL errada), e/ou
2) a Evolution **não consegue alcançar** a URL do seu Next.js (ex.: `localhost`, URL interna de Docker, sem HTTPS público).

Além disso, o seu `refresh` está chamando um endpoint que, no seu ambiente, está retornando **404** (você viu isso no terminal). Isso impede o fluxo de “marcar connected” e também impede a auto-correção do webhook.

## 1) Tornar o registro do webhook inevitável (e verificável)
**Arquivos:**
- `src/app/api/whatsapp/instances/[[...id]]/route.ts`
- `src/app/api/whatsapp/instances/refresh/route.ts`

Ações:
- Remover a condição “só valida webhook quando `newStatus === connected`” e validar/ajustar webhook sempre que `NEXT_PUBLIC_APP_URL` existir.
- Garantir que, no `beforeCreate`, mesmo se o QR ainda não estiver “open”, o webhook já fique setado (quando `NEXT_PUBLIC_APP_URL` existir).
- Deixar o sistema resiliente caso `NEXT_PUBLIC_APP_URL` não exista: retornar um erro claro na criação (em vez de “pular silenciosamente”), porque sem URL pública o observador nunca vai funcionar.

## 2) Corrigir o 404 do `getConnectionState`
**Arquivo:** `src/services/evolution/api.ts`

Ações:
- Implementar fallback: se `GET /instance/connectionState/:instanceName` retornar 404/null, tentar rotas alternativas comuns (ou fallback via `fetchInstances()` e filtrar pelo `instanceName`).
- Ajustar o `refresh` para não travar o fluxo quando o estado não puder ser consultado.

## 3) Blindar parsing do payload do webhook (compatibilidade)
**Arquivo:** `src/app/api/webhooks/evolution/route.ts`

Ações:
- Tornar a leitura do “nome da instância” compatível com variações do payload da Evolution:
  - aceitar `instance` como string, `instanceName`, e `instance.instanceName`.
- Tornar a leitura de mensagens compatível com variações de estrutura:
  - `data` array direto, `data.messages`, `data.messages.records`, etc.
- Manter filtros para ignorar `@g.us` e `status@broadcast`.

## 4) Observabilidade sem poluir o terminal
**Arquivos:**
- `src/models/whatsapp/instance/model.ts`
- `src/app/api/webhooks/evolution/route.ts`

Ações:
- Adicionar campos leves em `WhatsAppInstance`:
  - `lastWebhookAt`, `lastWebhookEvent` e `lastWebhookError` (opcional)
- Atualizar esses campos a cada POST recebido no webhook.

Isso permite você ver rapidamente, pelo banco/UI, se o webhook está chegando — sem `console.log`.

## 5) Validação prática
- Usar o endpoint existente de simulação para confirmar que o pipeline de salvar mensagem funciona localmente:
  - `src/app/api/dev/simulate-webhook/route.ts`
- Depois validar no mundo real: conferir via Evolution (`findWebhook`) se a URL cadastrada está correta e acessível externamente.

Se você confirmar este plano, eu implemento as mudanças acima e deixo um caminho claro para detectar quando a Evolution está (ou não) batendo no seu webhook.