---
description: Padronização Automatizada de Aplicações Plena
---

# Workflow de Padronização Plena

Este workflow descreve os passos para atualizar qualquer aplicação Plena (`.html`) para os padrões de Qualidade, Segurança e PWA V2.

## 1. Verificação Inicial
- Abrir o arquivo `.html` e ler as primeiras 1500 linhas.
- Identificar dependências faltantes (Gatekeeper, SortableJS, Chart.js).
- Verificar presença de `alert(` e `confirm(`.

## 2. Injeção de Dependências
- **Gatekeeper (Segurança):**
  - Adicionar `<script src="../assets/js/plena-lock.js"></script>` no `<head>` ou antes do `</body>`.
  - Remover blocos de licenciamento antigos/hardcoded se existirem e conflitarem.
- **Libs Externas (Se necessário):**
  - `SortableJS` (se houver listas reordenáveis).
  - `Chart.js` (se houver relatórios/gráficos).
  - Atualizar `Tailwind` e `Lucide` para versões padrão se estiverem muito antigas.

## 3. UI Modernization
- **Modais de Confirmação:**
  - Inserir o HTML do `customConfirmModal` antes do fechamento do `</body>`.
  - Inserir a função JavaScript `showCustomConfirm`.
  - Inserir a função JavaScript `showNotification` (se não existir ou para atualizar).
- **Substituição de Alerts:**
  - Substituir todas as chamadas `window.alert('msg')` ou `alert('msg')` por `showNotification('msg', 'error'/'success')`.
  - Substituir `confirm('msg')` por `showCustomConfirm(...)`.

## 4. PWA & Offline
- **Manifesto:**
  - Verificar se existe `<link rel="manifest" href="./manifest.json">`. Se for data URI ou inexistente, corrigir para apontar para um arquivo real se desejado, ou manter inline se for regra do projeto (mas o padrão novo é arquivo externo para melhor suporte).
- **Service Worker:**
  - Adicionar registro do SW no final do script de inicialização:
    ```javascript
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
    ```

## 5. Mobile Optimization
- Se houver Drag & Drop nativo, substituir por lógica `SortableJS`.
- Verificar se `meta viewport` está correto para não permitir zoom indesejado em inputs (`maximum-scale=1.0, user-scalable=no`).

## 6. Validação
- Salvar arquivo.
- Confirmar que não há erros de sintaxe introduzidos.
