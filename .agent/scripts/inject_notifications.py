import os
import re

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

# HTML Snippets
HEADER_BELL_HTML = """
                <!-- Notification Bell -->
                <button onclick="router('system')"
                    class="relative p-2 mr-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors group"
                    title="Notificações do Sistema">
                    <i data-lucide="bell" class="w-6 h-6"></i>
                    <!-- Container Neutro para Badge (O JS injeta o visual) -->
                    <span id="header-badge" class="absolute top-2 right-2 flex h-3 w-3 hidden"></span>
                </button>
"""

SIDEBAR_BADGE_HTML = """
                <span id="sidebar-badge" class="hidden ml-auto flex h-3 w-3">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
"""

def inject_notifications(app_name):
    path = os.path.join(APPS_DIR, app_name, "index.html")
    if not os.path.exists(path):
        return

    print(f"Processing {app_name}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Inject Header Bell
    if 'id="header-badge"' in content:
        print(f"  Header Bell already exists. Skipping.")
    else:
        # Target the container for header actions
        # Standard: <div class="flex items-center gap-2 sm:gap-3">
        # We want to prepend inside this div.
        
        # Regex to find the opening tag of the action container
        # We look for the div that contains the buttons
        # Usually it's the last div in <header>... <div class="flex items-center gap-2 sm:gap-3">
        
        target_class = 'class="flex items-center gap-2 sm:gap-3"'
        idx = content.find(target_class)
        
        if idx != -1:
            # Find the end of the opening tag ">"
            tag_close_idx = content.find('>', idx)
            if tag_close_idx != -1:
                # Insert after the opening tag
                insert_pos = tag_close_idx + 1
                content = content[:insert_pos] + HEADER_BELL_HTML + content[insert_pos:]
                print(f"  Injected Header Bell.")
                modified = True
            else:
                print(f"  Could not find end of container tag.")
        else:
            print(f"  Could not find header action container.")

    # 2. Inject Sidebar Badge
    if 'id="sidebar-badge"' in content:
        print(f"  Sidebar Badge already exists. Skipping.")
    else:
        # Find the System Nav button checking for id="nav-system"
        # We want to insert before the closing </button>
        
        nav_sys_pattern = r'(<button[^>]*id="nav-system"[^>]*>)(.*?)(</button>)'
        
        # Using regex to find the block is tricky if it spans lines.
        # Let's find the start index of id="nav-system"
        
        sys_idx = content.find('id="nav-system"')
        if sys_idx != -1:
            # Find the closing button tag AFTER this id
            # We need to be careful not to find a nested button or one before.
            # But header buttons don't have nested buttons.
            
            # Start searching for </button> from sys_idx
            btn_close_idx = content.find('</button>', sys_idx)
            
            if btn_close_idx != -1:
                # Insert just before </button>
                content = content[:btn_close_idx] + SIDEBAR_BADGE_HTML + content[btn_close_idx:]
                print(f"  Injected Sidebar Badge.")
                modified = True
            else:
                print(f"  Could not find closing button tag for System nav.")
        else:
            print(f"  Could not find System nav button.")

    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

def main():
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    for app in apps:
        if app == "plena_barbearia":
            continue # Skip reference app
        inject_notifications(app)

if __name__ == "__main__":
    main()
