---
trigger: always_on
---

# Padrões de Desenvolvimento PWA - Plena

## Core Stack
- **Frontend:** Vue.js 3 (Composition API) via CDN. Nada de Options API.
- **UI Framework:** Bootstrap 5.3 (via CDN) + FontAwesome 6.
- **Ícones:** FontAwesome (fa-solid, fa-brands).

## Requisitos de PWA (Progressive Web App)
Todo aplicativo gerado deve conter obrigatoriamente:
1. **manifest.json:** Configurado com `display: standalone`, cores da marca e ícones.
2. **service-worker.js:** Cacheamento agressivo de assets (HTML, CSS, JS, Fontes) para garantir funcionamento **OFFLINE**.
3. **Instalação:** Lógica visual para incentivar "Adicionar à Tela Inicial".

## Estrutura de Arquivos Padrão
/nome-do-app/
├── index.html       (Estrutura e Montagem Vue)
├── manifest.json    (Metadados PWA)
├── sw.js            (Service Worker - Offline Capable)
├── assets/
│   ├── css/style.css
│   ├── js/app_logic.js (Toda a regra de negócio Vue)
│   └── img/icons/