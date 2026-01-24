---
trigger: always_on
---

# Manifesto Plena Aplicativos: Filosofia de Engenharia

## 1. Identidade
Somos uma "Software House de Varejo". Criamos produtos, não serviços. Nossos softwares são bens duráveis digitais.

## 2. O Modelo "Sem Mensalidade" (Restrição Técnica Absoluta)
O agente deve projetar sistemas que funcionem **independente de nós**.
- **PROIBIDO:** Depender de backends complexos (Firebase, AWS, Supabase) para o funcionamento core do app.
- **OBRIGATÓRIO:** O banco de dados principal é o `localStorage` ou `IndexedDB` do navegador do cliente.
- **Backup:** A lógica de backup deve ser sempre "Exportar JSON" e "Importar JSON". O cliente é dono do dado.

## 3. Público-Alvo (UX/UI)
Nossos usuários não são técnicos. São o "Brasil Real" (pedreiros, manicures, donos de bar).
- **Interface:** Botões grandes, textos claros em PT-BR, fluxos lineares.
- **Performance:** O app deve abrir instantaneamente em celulares modestos (Android de entrada).

## 4. Stack Tecnológico (Simplicidade de Manutenção)
- Não usamos Build Steps complexos (Webpack, Vite) a menos que estritamente necessário.
- Preferimos "Unzip & Run": HTML + JS + CSS que rodam ao abrir o arquivo.