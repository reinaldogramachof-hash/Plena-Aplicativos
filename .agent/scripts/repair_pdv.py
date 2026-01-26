import os

PDV_FILE = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus\plena_pdv\index.html"

# The Clean System Block (Copied from plena_barbearia)
SYSTEM_BLOCK = r"""
<!-- Blocking Modal (Secure Broadcast) -->
    <div id="sysBlockingModal" class="fixed inset-0 z-[10000] hidden bg-black/80 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div id="sysModalHeader" class="bg-red-600 p-6 text-white flex items-center gap-3">
                <i id="sysModalIcon" data-lucide="alert-triangle" class="w-8 h-8"></i>
                <h3 id="sysModalTitle" class="font-bold text-xl">Comunicado Importante</h3>
            </div>
            <div class="p-8 text-center">
                <p id="sysModalMessage" class="text-slate-800 text-lg font-medium mb-6 leading-relaxed">Carregando...
                </p>
                <p class="text-xs text-slate-400 border-t pt-4">Mensagem Oficial do Sistema Plena</p>
            </div>
            <div class="p-6 bg-slate-50">
                <button onclick="acknowledgeNotification()"
                    class="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg">
                    <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                    ESTOU CIENTE E LI A MENSAGEM
                </button>
            </div>
        </div>
    </div>

    <!-- PWA INSTALLATION TOAST (Standardized) -->
    <div id="pwa-install-toast"
        style="display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: white; color: black; padding: 12px 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 9999; align-items: center; gap: 12px; border: 1px solid #e5e7eb; min-width: 300px;">
        <div
            style="background-color: transparent; padding: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <img src="./icons/icon-192.png" alt="App Icon"
                style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
        </div>
        <div style="flex: 1;">
            <p style="font-size: 14px; font-weight: bold; margin: 0; color: #1f2937;">Instalar Aplicativo</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">Acesso rápido 100% offline</p>
        </div>
        <button onclick="installPWA()"
            style="background-color: #000; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; white-space: nowrap;">
            Instalar
        </button>
        <button onclick="dismissInstall()"
            style="background-color: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 4px; display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-x">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
            </svg>
        </button>
    </div>

    <script>
        // SYSTEM JS INJECTION
        // ==========================================
        const BUILD_DATE = new Date().toLocaleDateString('pt-BR');
        // ... (We will rely on the fix_syntax run previously to have fixed the header here if we copied it correctly, but let's be safe and use commented header)
        
        // Actually, let's copy the JS content dynamically from barbearia or just hardcode the script tag wrapper + known good JS.
        // For simplicity and robustness, I will just re-inject the critical PWA Logic script here, assuming the rest of System JS was in the middle block.
        // WAIT. The massive block I am deleting contains THE ENTIRE SYSTEM JS (renderSystemTab, etc). I MUST restore it.
        // I will copy the script content from the corrupted block if possible or use a known good version.
        // Since I can't easily copy 1000 lines here in string, I will read the file, extract the system js part (which starts at 'const BUILD_DATE') and save it.
    </script>
"""

# BUT, I need the FULL System JS logic (renderSystemTab, notifications, etc).
# I will cheat: I will read plena_barbearia content, extract everything from "<!-- Blocking Modal" to the end of file.
# Then I will use that as the block to append.

BARBEARIA_FILE = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus\plena_barbearia\index.html"

def repair():
    # 1. Read Barbearia to get the Good Block
    with open(BARBEARIA_FILE, 'r', encoding='utf-8') as f:
        barb_content = f.read()
    
    start_marker = '<!-- Blocking Modal (Secure Broadcast) -->'
    idx_barb = barb_content.find(start_marker)
    if idx_barb == -1:
        print("Error: Could not find System Block in Reference App.")
        return
        
    good_system_block = barb_content[idx_barb:]
    
    # 2. Read Corrupted PDV File
    with open(PDV_FILE, 'r', encoding='utf-8') as f:
        pdv_content = f.read()
        
    # 3. Find corruption point
    # It happens inside printPDVReceipt, at "${receipt.innerHTML}"
    # The file has:
    # 3151:         ${receipt.innerHTML}
    # 3152:
    # 3153:
    # 3157: <!-- Blocking Modal ...
    
    corruption_marker = "${receipt.innerHTML}"
    idx_pdv = pdv_content.find(corruption_marker)
    
    if idx_pdv == -1:
        print("Error: Could not find corruption point in PDV app.")
        return

    # Find where the corruption really starts (the injected HTML)
    # It's a few lines after receipt.innerHTML
    idx_start_cut = pdv_content.find(start_marker, idx_pdv)
    if idx_start_cut == -1:
         print("Error: Could not find injected block in PDV app.")
         return
         
    # 4. Construct New Content
    # Everything before the cut
    # But we need to close the string and function properly first.
    
    # The PDV content up to the marker is:
    # ... ${receipt.innerHTML} \n \n \n
    
    # We need to backtrack to just after ${receipt.innerHTML}
    # Actually, simpler: define the fixed print function tail.
    
    fixed_print_tail = r"""
    </body>
</html>`;

            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
            } catch (e) {
                console.error("Erro ao imprimir:", e);
                alert("Erro ao abrir janela de impressão");
            }
        }
    </script>
"""
    
    # We take content up to corruption marker (start_marker)
    # But wait, lines 3152-3156 are empty/whitespace.
    # We can just cut at idx_start_cut.
    
    prefix_content = pdv_content[:idx_start_cut]
    
    # Now valid HTML termination + Good System Block
    final_content = prefix_content + fixed_print_tail + "\n\n" + good_system_block
    
    # Check if final_content ends with </html>
    if not final_content.strip().endswith('</html>'):
        final_content += "\n</html>"
        
    # Write back
    with open(PDV_FILE, 'w', encoding='utf-8') as f:
        f.write(final_content)
        
    print("Repaired plena_pdv/index.html successfully.")

if __name__ == "__main__":
    repair()
