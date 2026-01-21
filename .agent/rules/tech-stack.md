---
trigger: always_on
---

# Constituição do Tech Stack: Plena Aplicativos

## 1. Frontend (Diretório `apps/` e `*.html`)
* **Core:** HTML5 Semântico e Vanilla JavaScript (ES6+).
* **Proibido:** NÃO utilize frameworks como React, Vue ou Angular. O projeto é *framework-less*.
* **Estilização:** CSS nativo ou bibliotecas já presentes no `assets/`.
* **Estrutura de Apps:** Cada novo aplicativo deve residir em sua própria pasta categorizada: `apps/<categoria>/<nome_do_app>/index.html`.

## 2. Backend (Arquivos `*.php`)
* **Linguagem:** PHP Puro (Vanilla).
* **Estilo:** API Restful retornando JSON.
* **Segurança:** Use Prepared Statements para SQL (se houver banco). Valide todos os `$_POST` e `$_GET`.
* **Mailer:** Utilize a classe `SimpleMailer.php` existente, não use `PHPMailer` externo ou `mail()` nativo diretamente sem o wrapper.

## 3. Automação e Tooling
* **Scripts do Agente:** Utilize Python 3 para scripts de manutenção em `.agent/scripts/`.
* **Node.js:** Apenas para ferramentas de desenvolvimento em `dev_tools/`.

## 4. Padrões de Dados
* **Configuração:** Preferência por JSON (`config.json`, `leads_abandono.json`).
* **Logs:** Mantenha logs de erro consistentes.