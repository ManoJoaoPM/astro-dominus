Para tornar o Roadmap funcional e integrado ao banco de dados, precisamos sair dos dados "mockados" (fictícios) e criar a estrutura real de dados.

Aqui está o plano técnico para implementar a persistência de dados:

## 1. Modelagem de Dados (Backend)
Criaremos um novo módulo em `src/models/roadmap` para armazenar o estado das fases.
- **Roadmap Model**:
  - `client`: Referência ao Cliente.
  - `globalStatus`: Métricas globais (Total Leads, MQL, etc).
  - `phases`: Objeto contendo o estado de cada fase (`spy`, `pickup`, etc).
    - Cada fase terá: `score`, `status`, `checklist` (array), `kpis` (array), `timeline`.
  - `alerts`: Lista de alertas operacionais ativos.

## 2. API Routes (Backend)
Criaremos endpoints para gerenciar esses dados:
- `GET /api/roadmap?clientId=XYZ`: Busca o roadmap completo do cliente.
- `POST /api/roadmap`: Cria um roadmap inicial padrão para um novo cliente.
- `PATCH /api/roadmap/[id]`: Permite atualizar itens do checklist, KPIs ou adicionar eventos na timeline (manualmente ou via webhook futuro).

## 3. Integração no Frontend
- **Hook `useRoadmap`**: Substituir os dados estáticos (`PHASE_DATA`) por chamadas `useSWR` conectadas à API.
- **Tratamento de Loading/Empty**: Exibir estados de carregamento enquanto busca os dados reais.
- **Inicialização**: Garantir que, se o cliente não tiver roadmap, o sistema crie um com os valores padrão (zerados).

## 4. Estrutura de Pastas Proposta
```
src/
  models/
    roadmap/          # Schemas do Mongoose e Zod
      index.ts
      model.ts
      utils.tsx       # Helper para criar roadmap padrão
  app/
    api/
      roadmap/        # Endpoints da API
        route.ts
        [clientId]/
          route.ts
```

Após sua confirmação, irei criar os Models e a API para conectar tudo.
