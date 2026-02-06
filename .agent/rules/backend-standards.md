# Padrões de Backend Python
Escopo: @/src/**

Diretivas:
1. Segredos: NUNCA hardcode chaves de API. Use sempre `os.getenv` ou Pydantic BaseSettings.
2. Tipagem: Todo código novo deve usar Type Hints estritos.
3. Modularidade: Evite funções com mais de 50 linhas. Quebre em sub-funções menores.
4. Logging: Use a lib `logging` padrão, nunca `print()`.
