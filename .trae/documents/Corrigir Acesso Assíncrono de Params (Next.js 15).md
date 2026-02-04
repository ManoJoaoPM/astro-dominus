Corrigirei o erro de acesso aos parâmetros (`params`) que está impedindo o carregamento correto do `clientId` e, consequentemente, fazendo com que a lista de WhatsApps apareça vazia. No Next.js 15+, os `params` são tratados como Promises e precisam ser "desembrulhados" usando `React.use()`.

### Plano de Correção:

1.  **Atualizar a Página Principal de WhatsApp**:
    - No arquivo [page.tsx](file:///c%3A/Users/julio/OneDrive/Documentos/Astro%20-%20Dominus/struct-boilerplate/src/app/dashboard/clients/%5BclientId%5D/whatsapp/page.tsx), importar `use` de `react`.
    - Substituir `const { clientId } = params;` por `const { clientId } = React.use(params);`.
2.  **Atualizar a Página de Conexão**:
    - No arquivo [page.tsx](file:///c%3A/Users/julio/OneDrive/Documentos/Astro%20-%20Dominus/struct-boilerplate/src/app/dashboard/clients/%5BclientId%5D/whatsapp/connect/%5BinstanceId%5D/page.tsx), aplicar a mesma correção para `clientId` e `instanceId`.
3.  **Atualizar a Inbox Customizada**:
    - No arquivo [page.tsx](file:///c%3A/Users/julio/OneDrive/Documentos/Astro%20-%20Dominus/struct-boilerplate/src/app/dashboard/clients/%5BclientId%5D/whatsapp/inbox/%5BinstanceId%5D/page.tsx), aplicar a mesma correção.
4.  **Verificação de Estabilidade**:
    - Confirmar se o `useSWR` agora recebe o `clientId` correto, o que deve fazer com que o card da nova instância apareça na lista imediatamente após a criação.
