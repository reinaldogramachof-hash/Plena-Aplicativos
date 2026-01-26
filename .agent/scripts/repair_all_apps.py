import os
import re

REF_APP_PATH = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus\plena_barbearia\index.html"
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def get_system_js():
    try:
        with open(REF_APP_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # JS BLOCK
        # Starts at // SISTEMA DE ATUALIZAÇÃO E PWA (ROBUSTO)
        js_start_str = "SISTEMA DE ATUALIZAÇÃO E PWA (ROBUSTO)"
        js_start_idx = content.find(js_start_str)
        if js_start_idx == -1:
             print("CRITICAL: Could not define JS Block in ref app")
             return None
        
        # We need to capture until the end of the script. 
        # The script tag closes at line 4442 approx.
        # Find the next </script> after js_start_idx
        js_end_idx = content.find('</script>', js_start_idx)
        
        # We need to include the "Router Hook" fix we did before?
        # In plena_barbearia, the router IS the original one?
        # No, in standardizing we REPLACED the unsafe router with a safe wrapper.
        # But plena_barbearia HAS the full logic.
        # If I copy barbearia's JS, I get barbearia's router.
        # I MUST APPLY THE SAFE WRAPPER AGAIN.
        
        raw_js = content[js_start_idx:js_end_idx]
        
        # Apply Safe Router Wrapper
        safe_router_wrapper = """
    // Extended Router for System Tab
    const _baseRouter = window.router;
    window.router = function(view) {
        if (typeof _baseRouter === 'function') _baseRouter(view);
        if (view === 'system') {
             // Standard view toggle if not handled by base router for 'system'
             document.querySelectorAll('.view-section').forEach(el => el.classList.add('hide'));
             const sysEl = document.getElementById('view-system');
             if(sysEl) sysEl.classList.remove('hide');
             
             // Nav highlight
             document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active-nav', 'bg-white/10'));
             const navSys = document.getElementById('nav-system');
             if(navSys) navSys.classList.add('active-nav', 'bg-white/10');
             
             renderSystemTab();
        }
    };
    """
        # Replace the router logic in raw_js (if it exists) with safe wrapper
        # Barbearia has: const originalRouter = ... window.router = ...
        
        start_marker = "// Router Hook (Simulated)"
        end_marker = "// SW REGISTRATION" # Next block
        
        s_idx = raw_js.find(start_marker)
        e_idx = raw_js.find(end_marker)
        
        if s_idx != -1 and e_idx != -1:
            final_js = raw_js[:s_idx] + safe_router_wrapper + raw_js[e_idx:]
            return final_js
        else:
            print("WARN: Could not replace router in template. Using raw.")
            return raw_js

    except Exception as e:
        print(f"Error extracting JS: {e}")
        return None

SYSTEM_JS = get_system_js()

def repair_app(app_path):
    try:
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # 1. REMOVE LEGACY PWA TOAST
        # Look for the toast containing "fa-download" (Legacy)
        # <div id="pwa-install-toast" ... <i class="fa-solid fa-download ... </div>
        # Regex is safest if we match the ID layout
        
        # This matches the legacy structure specifically
        legacy_toast_pattern = r'<div id="pwa-install-toast"[^>]*>.*?fa-download.*?<\/div>\s*<\/div>' 
        # Note: The legacy toast in assistencia had correct closing divs?
        # Line 4402: </div> </div> (Nested?)
        # Let's inspect content again... it ends with </div> </div> around 4402
        
        # Let's try to remove by exact string snippet if possible, or regex.
        # <div id="pwa-install-toast" class="fixed bottom-4 ...">
        
        if '<div id="pwa-install-toast" class="fixed bottom-4' in content:
            print("  Removing Legacy PWA Toast...")
            # We remove the block.
            # Regex to find this specific opening tag and non-greedy match until first </div> isn't enough because of nesting.
            # But the legacy one seems to be `...max-w-md mx-auto w-full"> ... </div></div>`
            
            # Simple approach: content.replace(legacy_block, "")
            # We construct the legacy block start
            legacy_start = '<div id="pwa-install-toast" class="fixed bottom-4'
            start_idx = content.find(legacy_start)
            if start_idx != -1:
                # Find end... assume it's before the "Blocking Modal" which usually follows
                blocking_modal = '<!-- Blocking Modal'
                end_idx = content.find(blocking_modal, start_idx)
                if end_idx != -1:
                    # Remove everything between
                    # But verify we aren't eating too much.
                     print(f"    Removing {end_idx - start_idx} chars.")
                     content = content[:start_idx] + content[end_idx:]
                else:
                    print("    Could not find end of legacy toast safely.")

        # 2. INJECT SYSTEM JS IF MISSING
        if 'function renderSystemTab' not in content:
            print("  Missing renderSystemTab. Injecting Module...")
            if SYSTEM_JS:
                # Insert before the last </script> (which closes the app logic)
                # Should be before the PWA script we injected at the end?
                # The file structure is:
                # ... App Logic ...
                # ... System JS (Missing) ...
                # ... PWA Toast ...
                # ... PWA Script ...
                # </body>
                
                # We want to insert it AFTER the main app logic.
                # Usually look for `// INICIALIZAR APLICATIVO` block end?
                # Or just before `<!-- PWA INSTALLATION TOAST`?
                
                marker_pwa = "<!-- PWA INSTALLATION TOAST (Standardized) -->"
                pwa_idx = content.find(marker_pwa)
                
                if pwa_idx != -1:
                    # Insert BEFORE PWA
                    # Ensure we are inside a <script> tag? 
                    # No, SYSTEM_JS content is raw code, it needs a <script> tag if outside?
                    # Wait, extract logic returned RAW CODE.
                    # In `standardize`, we injected it inside existing script or new one?
                    # "Insert before last </script>"
                    
                    # If we insert it before PWA toast, we are likely OUTSIDE of the main script tag.
                    # So we should wrap it in <script> or find the previous </script> and append before it?
                    
                    # Safer: Wrap in <script> and place before PWA Toast.
                    # But wait, SYSTEM_JS relies on `db` and `router` which are global.
                    # If we make a new script tag, it's fine.
                    
                    # BUT, duplicate router definition issues? 
                    # We have the wrapper.
                    
                    new_block = f"\n<script>\n{SYSTEM_JS}\n</script>\n\n"
                    content = content[:pwa_idx] + new_block + content[pwa_idx:]
                else:
                    # Fallback: Append before body
                    print("    PWA Marker not found. Appending to body end.")
                    content = content.replace('</body>', f'\n<script>\n{SYSTEM_JS}\n</script>\n</body>')
                    
        if content != original_content:
            with open(app_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("  Repaired.")
        else:
            print("  No repairs needed.")

    except Exception as e:
        print(f"Error repairing {app_path}: {e}")

# EXECUTE
if SYSTEM_JS:
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file == "index.html":
                # Skip barbearia itself?
                if "plena_barbearia" in root:
                    continue
                print(f"Checking {os.path.basename(root)}...")
                repair_app(os.path.join(root, file))
else:
    print("Failed to init System JS.")
