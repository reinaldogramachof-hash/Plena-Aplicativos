import os
import re

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

DUPLICATE_APPS = [
    "plena_alugueis",
    "plena_orcamentos", 
    "plena_financas",
    "plena_distribuidora",
    "plena_controle",
    "plena_card",
    "plena_beleza",
    "plena_motoboy"
]

def clean_legacy(app_name):
    path = os.path.join(APPS_DIR, app_name, "index.html")
    if not os.path.exists(path):
        return
        
    print(f"Cleaning legacy blocks in {app_name}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_len = len(content)
    
    # Define markers for the New System (we don't touch anything after this, usually)
    robust_marker = "SISTEMA DE ATUALIZAÇÃO E PWA (ROBUSTO)"
    robust_idx = content.find(robust_marker)
    
    if robust_idx == -1:
        print("  WARNING: Robusto system not found. Skipping to avoid breaking app.")
        return

    # Split content
    legacy_part = content[:robust_idx]
    system_part = content[robust_idx:]
    
    # 1. Remove Legacy PWA Prompt (found in orcamentos)
    # Pattern: // PWA INSTALL PROMPT ... let deferredPrompt ... (block)
    # Regex: // PWA INSTALL PROMPT.*?(window\.addEventListener\('beforeinstallprompt'.*?\}\);)
    # We'll use a broad match for the comment section.
    
    # Regex for "PWA INSTALL PROMPT" block
    # It generally ends before "// OFFLINE SUPPORT" or just ends a script block
    legacy_part = re.sub(
        r'// PWA INSTALL PROMPT.*?deferredPrompt = null;\s*installButton\.remove\(\);\s*\}\);\s*\}\;\s*document\.body\.appendChild\(installButton\);\s*lucide\.createIcons\(\);\s*\}\);',
        '// Legacy PWA removed\n',
        legacy_part,
        flags=re.DOTALL
    )
    
    # Helper to remove variable redeclaration if regex missed the block
    if "let deferredPrompt;" in legacy_part:
        legacy_part = legacy_part.replace("let deferredPrompt;", "// let deferredPrompt; (Removed)")

    # 2. Remove Legacy Notification Module (found in alugueis)
    # Pattern: // MÓDULO DE NOTIFICAÇÕES INTELIGENTE (MODELO BARBEARIA) ...
    # This block usually lives inside a <script> ... </script>. 
    # The header is distinctive.
    
    legacy_part = re.sub(
        r'// =+\s*// MÓDULO DE NOTIFICAÇÕES INTELIGENTE \(MODELO BARBEARIA\).*?window\.acknowledgeNotification = acknowledgeNotification;\s*</script>',
        '// Legacy Notifs Removed </script>',
        legacy_part,
        flags=re.DOTALL
    )

    # 3. Remove Legacy HTML Modal (found in alugueis)
    # Pattern: <!-- SYSTEM BLOCKING MODAL (Static) --> ... (div) ... </div>
    legacy_part = re.sub(
        r'<!-- SYSTEM BLOCKING MODAL \(Static\) -->.*?id="sysBlockingModal".*?</div>\s*</div>',
        '<!-- Legacy Modal Removed -->',
        legacy_part,
        flags=re.DOTALL
    )
    
    # 4. Remove loose redeclarations of NOTIF_API_URL
    if "const NOTIF_API_URL =" in legacy_part:
        legacy_part = legacy_part.replace("const NOTIF_API_URL =", "// const NOTIF_API_URL =")

    # Reassemble
    new_content = legacy_part + system_part
    
    if len(new_content) != original_len:
        print(f"  Fixed! Reduced size by {original_len - len(new_content)} bytes.")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
    else:
        print("  No legacy patterns matched (or cleanup made no change).")

def main():
    for app in DUPLICATE_APPS:
        clean_legacy(app)

if __name__ == "__main__":
    main()
