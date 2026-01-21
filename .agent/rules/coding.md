---
trigger: always_on
---

# Padrões de Integridade e Qualidade (Zero Preguiça)

## Diretivas Globais
1.  **SEM PLACEHOLDERS:** É estritamente proibido deixar comentários como `// ... resto do código` ou ``. Escreva a implementação completa.
2.  **Verificação de Sintaxe:** Antes de confirmar uma edição em PHP ou Python, verifique mentalmente se há erros de sintaxe (ponto e vírgula, indentação).

## Segurança (Crítico)
1.  **Segredos:** NUNCA exponha chaves de API, senhas de banco ou tokens diretamente no código. Use arquivos de configuração segregados ou variáveis de ambiente.
2.  **Validação de Input:** Em arquivos PHP, nunca confie na entrada do usuário. Sanitize sempre.

## Manutenção
1.  **Comentários:** Comente o "Porquê" e não o "Como".
2.  **Limpeza:** Ao criar scripts Python temporários, instrua sua exclusão após o uso ou salve-os em `.agent/scripts/temp/`.