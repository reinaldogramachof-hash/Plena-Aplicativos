# Checklist de Qualidade PWA (Plena Apps)

Use este checklist antes de considerar qualquer PWA como "Pronto para Produção".

## 1. Identidade Visual e Manifest
- [ ] **Ícone na Home:** O app tem ícone correto (sem o logo do Android/Chrome padrão) ao ser instalado?
- [ ] **Splash Screen:** A cor de fundo da splash screen combina com a marca?
- [ ] **Nome:** O nome do app aparece corretamente abaixo do ícone (sem cortes drásticos)?
- [ ] **Display:** O app abre em tela cheia (standalone) sem barra de URL?

## 2. Instalação (Installability)
- [ ] **Prompt Automático:** O navegador oferece a instalação (ou mostra o botão na barra de endereços)?
- [ ] **Botão Manual:** Existe um botão/link "Instalar App" visível na interface para o usuário forçar a instalação?
- [ ] **iOS:** Existe instrução clara (seta apontando para "Compartilhar") para usuários de iPhone?

## 3. Funcionamento Offline (Service Worker)
- [ ] **O Teste do Modo Avião:**
    1. Abra o app online.
    2. Ative o Modo Avião.
    3. Feche o app (mate o processo).
    4. Abra o app novamente.
    *Resultado Esperado:* O app deve carregar a interface principal, não o "Dinossauro" do Chrome.
- [ ] **Assets:** Fontes e Ícones carregam offline?

## 4. Funcionalidades Core (Regra de Negócio)
- [ ] **Persistência:** Dados salvos hoje estão lá amanhã? (Teste de fechar/abrir aba).
- [ ] **Input:** Os campos numéricos abrem o teclado numérico no celular?
- [ ] **Feedback:** Ao clicar em salvar, há um feedback visual (loading/toast)?

## 5. Performance
- [ ] **Lighthouse:** O score de PWA no DevTools é verde?
