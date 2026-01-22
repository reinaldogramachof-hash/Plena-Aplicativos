---
name: create-plena-app
description: Gera um novo PWA completo seguindo o padrão Plena (Local-First, Vue3, Bootstrap).
---

# Protocolo de Criação de App Plena

Use esta habilidade quando o usuário solicitar um novo aplicativo (ex: "Crie o Plena Barbearia").

## Passo 1: Definição do Escopo de Varejo
Analise o nicho solicitado (ex: Barbearia, Pizzaria).
Defina as 3 funcionalidades vitais (ex: Barbearia = Agenda + Comanda + Cadastro Cliente).
*Lembre-se: Mantenha simples. O usuário quer substituir o papel.*

## Passo 2: Estrutura de Dados (JSON Schema)
Defina como os dados serão salvos no `localStorage`.
Exemplo:
```json
{
  "clientes": [],
  "agendamentos": [],
  "config": { "nome_loja": "", "whatsapp": "" }
}