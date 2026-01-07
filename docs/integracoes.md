# Integrações da Página Principal

## Catálogo e Links
- Os apps são listados na seção Vue `apps` em [index.html](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Plena%20Aplicativos/index.html).
- Cada item possui `link` apontando para `apps.plus/<app>/index.html`.
- Páginas de categoria também possuem links diretos: [servicos.html](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Plena%20Aplicativos/servicos.html), [restaurantes.html](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Plena%20Aplicativos/restaurantes.html).

## Abertura de Demos
- Função `openDemo(url)` abre um modal com iframe.
- Estados controlados: `loadingDemo`, `demoError`, `retryDemo`, `onDemoLoad`.
- Timeout de 8s com fallback de erro e opção de tentar novamente.

## Verificação Automática de Links
- Script: `scripts/link-checker.js`.
- Executa validação de todas as rotas válidas e cenários negativos (404).
- Como executar: `node scripts/link-checker.js`.

## Segurança no Servidor
- Cabeçalhos configurados em [server.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Plena%20Aplicativos/server.js):
  - Content-Security-Policy, Referrer-Policy, X-Frame-Options, X-Content-Type-Options, Permissions-Policy.

## Boas Práticas
- Ao adicionar novos Apps Plus, incluir o `link` no catálogo e validar com o link-checker.
- Evitar duplicações de lógica PWA no escopo da página principal.
- Garantir que conteúdo dinâmico renderizado por apps use sanitização adequada.

