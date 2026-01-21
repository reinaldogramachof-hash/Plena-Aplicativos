---
name: run-maintenance
description: Executa scripts de auditoria, limpeza e padronização do sistema.
---

# Protocolo de Manutenção do Sistema

**Gatilho:** "Padronizar apps", "Auditar sistema", "Limpar locks", "Corrigir ícones".

## Ferramentas Disponíveis:
* `python .agent/scripts/standardize_apps.py`: Padroniza estrutura HTML/JS dos apps.
* `python .agent/scripts/audit_apps.py`: Verifica integridade.
* `python .agent/scripts/fix_icons.py`: Corrige caminhos de ícones quebrados.
* `python .agent/scripts/clean_locks.py`: Remove arquivos de trava temporários.

## Procedimento:
1.  **Seleção:** Identifique qual script resolve o problema do usuário.
2.  **Execução:** Rode o script via terminal.
3.  **Relatório:** Leia a saída do terminal e resuma para o usuário quais arquivos foram alterados.