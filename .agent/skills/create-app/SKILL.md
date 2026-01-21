---
name: create-app
description: Cria a estrutura de pastas e arquivos para um novo aplicativo no ecossistema Plena.
---

# Protocolo de Criação de Novo App

**Gatilho:** Quando o usuário pedir "Crie um app de [tema]" ou "Novo módulo [nome]".

## Passos:

1.  **Definição de Categoria:**
    * Analise o nome do app e determine a melhor categoria existente em `apps/` (ex: `food`, `lazer`, `saude`). Se não houver, sugira uma nova.

2.  **Estruturação de Diretórios:**
    * Crie o caminho: `apps/<categoria>/<nome-slug>/`.

3.  **Scaffolding (Geração de Arquivos):**
    * Gere `index.html` baseado no padrão visual dos outros apps (cabeçalho, ícones, script de lock).
    * **Importante:** Inclua a referência ao script de bloqueio: `<script src="../../../assets/js/plena-lock.js"></script>`.

4.  **Registro (Opcional):**
    * Se houver um arquivo central de listagem (como o `index.html` raiz ou um JSON de menu), adicione o novo app lá.