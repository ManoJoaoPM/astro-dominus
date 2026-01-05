# Implementação do Módulo de Scraping de Leads e Integrações

Este plano detalha a construção do módulo de Scraping de Leads, incluindo a integração com DataForSEO (Google Maps), Scraping de WhatsApp (fallback) e Exportação para Pipedrive.

## 1. Configuração e Serviços Backend

### Atualização de Variáveis de Ambiente

* Adicionar chaves do Pipedrive (`PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_COMPANY_DOMAIN`) ao arquivo `src/env.ts`.

### Criação de Serviços (`src/services/commercial/`)

1. **`dataforseo.ts`**:

   * Implementar integração com a API `google/maps/task_post` do DataForSEO.

   * Lógica para buscar imobiliárias por cidade.
2. **`scraper.ts`**:

   * Criar função `scrapeWebsiteForContact(url)` que acessa o site da imobiliária e busca por links `wa.me`, `api.whatsapp` ou padrões de telefone celular para capturar o WhatsApp caso não venha do Maps.
3. **`pipedrive.ts`**:

   * Implementar métodos:

     * `searchPerson(email/phone)`: Para verificação de duplicidade.

     * `createPerson(lead)`: Criar o contato.

     * `createDeal(personId)`: Criar o negócio no funil padrão.

     * `createActivity(dealId)`: Criar a tarefa "Enviar Primeiro Toque".

## 2. API Routes (`src/app/api/commercial/`)

1. **`/scraper/route.ts`**:

   * `POST`: Recebe `{ city }`, inicia o job no DataForSEO e cria um registro `ScraperJob`.

   * `GET`: Lista jobs recentes ou status por cidade.
2. **`/export/pipedrive/route.ts`**:

   * `POST`: Recebe lista de IDs de leads qualificados.

   * Executa a lógica de verificação e criação no Pipedrive.

   * Retorna status da importação (sucesso/duplicado).

## 3. Frontend - Telas do Dashboard

### A. Tela de Scraping (`/dashboard/leads/scraper`)

* **Cards por Cidade**: Grid exibindo cards para cada cidade que possui leads na base.

  * Conteúdo: Nome da cidade, Quantidade de Leads.

* **Trigger de Novo Scraping**:

  * Input para digitar o nome de uma cidade.

  * Botão "Iniciar Busca" que chama a API e inicia o processo.

  * Feedback visual de "Buscando...".

### B. Tela de Qualificação (`/dashboard/leads/qualification`)

* **Ajustes na tela existente**:

  * Garantir filtro fixo `status = 'pending'`.

  * **Botões de Ação Rápida**:

    * "Site" (abre em nova aba).

    * "Instagram" (abre em nova aba).

  * **Botões de Decisão**:

    * "Qualificado" (move para status `qualified`).

    * "Desqualificado" (move para status `unqualified`).

### C. Tela de Exportação (`/dashboard/leads/export`)

* **Nova página**: Lista apenas leads com status `qualified`.

* **Verificação Pipedrive**:

  * Ao carregar, verifica via API se o lead já existe no Pipedrive (visual: ícone de check ou alerta).

* **Ação**: Botão "Exportar para Pipedrive".

  * Envia os leads selecionados para a automação de criação (Pessoa -> Negócio -> Tarefa).

## 4. Estrutura de Pastas Proposta

```
src/
  app/
    dashboard/
      leads/
        scraper/
          page.tsx       # Cards de Cidades + Trigger
        export/
          page.tsx       # Exportação Pipedrive
  services/
    commercial/
      dataforseo.ts
      pipedrive.ts
      scraper.ts
```

