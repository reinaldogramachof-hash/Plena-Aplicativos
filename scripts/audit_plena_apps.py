
import os
import re

# Configurações de Auditoria
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_DIRS = ['apps.plus']
REPORT_FILE = os.path.join(ROOT_DIR, 'audit_report.md')

def check_file_exists(app_path, filename):
    return os.path.exists(os.path.join(app_path, filename))

def analyze_file_content(file_path):
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        checks = {
            'vue_3': False,
            'bootstrap_5': False,
            'font_awesome': False,
            'plena_lock': False,
            'title_plena': False,
            'anti_patterns': []
        }
        
        # Check Vue.js 3
        if re.search(r'vue(@3|\.global)', content, re.IGNORECASE):
            checks['vue_3'] = True
            
        # Check Bootstrap 5
        if re.search(r'bootstrap(@5|\.min\.css)', content, re.IGNORECASE):
            if 'bootstrap' in content.lower():
                checks['bootstrap_5'] = True
        elif 'bootstrap' in content.lower(): # Fallback loose check
             if '5' in content.lower():
                 checks['bootstrap_5'] = True

        # Check FontAwesome
        if 'fontawesome' in content.lower() or 'fa-' in content.lower():
             checks['font_awesome'] = True
             
        # Check Plena Lock
        if 'plena-lock.js' in content:
            checks['plena_lock'] = True
            
        # Check Title
        title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
        if title_match:
            title_text = title_match.group(1).strip()
            if title_text.startswith('Plena'):
                checks['title_plena'] = True
                
        # Anti-patterns
        if 'firebase' in content.lower():
            checks['anti_patterns'].append('Firebase Detected')
        if 'supabase' in content.lower():
            checks['anti_patterns'].append('Supabase Detected')
            
        return checks
    except Exception as e:
        print(f"Erro ao ler {file_path}: {e}")
        return None

def audit_app(category_dir, app_name):
    app_path = os.path.join(ROOT_DIR, category_dir, app_name)
    is_single_file = os.path.isfile(app_path)
    
    if not os.path.isdir(app_path) and not is_single_file:
        return None

    report = {
        'name': app_name,
        'path': f"{category_dir}/{app_name}",
        'score': 0,
        'status': 'Reprovado',
        'issues': [],
        'checks': {}
    }
    
    # 1. Estrutura PWA
    if is_single_file:
        has_index = True
        has_manifest = False 
        has_sw = False
        html_analysis = analyze_file_content(app_path)
    else:
        has_index = check_file_exists(app_path, 'index.html')
        has_manifest = check_file_exists(app_path, 'manifest.json')
        has_sw = check_file_exists(app_path, 'sw.js')
        
        html_analysis = None
        if has_index:
             html_analysis = analyze_file_content(os.path.join(app_path, 'index.html'))
    
    report['checks']['index.html'] = has_index
    report['checks']['manifest.json'] = has_manifest
    report['checks']['sw.js'] = has_sw

    if not has_index:
        report['issues'].append("❌ Falta index.html (Crítico)")
    if is_single_file:
        report['issues'].append("⚠️ App é arquivo único (não possui estrutura de pasta PWA)")
    
    if not has_manifest:
        report['issues'].append("❌ Falta manifest.json")
    if not has_sw:
        report['issues'].append("❌ Falta sw.js (Service Worker)")

    # 2. Análise de Conteúdo
    if html_analysis:
        report['checks'].update(html_analysis)
        
        if not html_analysis['vue_3']:
            report['issues'].append("❌ Não usa Vue.js 3 detectável")
        if not html_analysis['bootstrap_5']:
            report['issues'].append("❌ Não usa Bootstrap 5 detectável")
        if not html_analysis['font_awesome']:
            report['issues'].append("❌ Não usa FontAwesome")
        if not html_analysis['plena_lock']:
            report['issues'].append("❌ Falta script 'plena-lock.js' (Segurança)")
        if not html_analysis['title_plena']:
            report['issues'].append("⚠️ Título fora do padrão (não inicia com 'Plena')")
            
        for ap in html_analysis['anti_patterns']:
            report['issues'].append(f"⛔ ANTI-PATTERN: {ap}")
    elif has_index and not is_single_file:
         report['issues'].append("❌ Erro ao ler index.html")

    # Calculo de Nota
    total_items = 8
    passed_items = 0
    
    if has_index: passed_items += 1
    if has_manifest: passed_items += 1
    if has_sw: passed_items += 1
    
    if html_analysis:
        if html_analysis['vue_3']: passed_items += 1
        if html_analysis['bootstrap_5']: passed_items += 1
        if html_analysis['font_awesome']: passed_items += 1
        if html_analysis['plena_lock']: passed_items += 1
        if html_analysis['title_plena']: passed_items += 1
        
        if len(html_analysis['anti_patterns']) > 0:
            passed_items = 0

    score = int((passed_items / total_items) * 100)
    report['score'] = score
    
    if score == 100:
        report['status'] = 'Aprovado ✅'
    elif score >= 70:
        report['status'] = 'Atenção ⚠️'
    else:
        report['status'] = 'Reprovado ❌'

    return report

def generate_markdown(results):
    lines = []
    lines.append("# Relatório de Auditoria: Apps Plena (Apps.Plus)")
    lines.append(f"**Data:** {os.popen('date /t').read().strip()} {os.popen('time /t').read().strip()}")
    lines.append("\n## Resumo Executivo")
    lines.append("| Nome do App | Caminho | Nota | Status |")
    lines.append("|---|---|---|---|")
    
    for r in results:
        lines.append(f"| {r['name']} | `{r['path']}` | {r['score']}% | {r['status']} |")
        
    lines.append("\n## Detalhes por App")
    
    for r in results:
        if r['score'] < 100:
            lines.append(f"\n### {r['name']} ({r['score']}%)")
            lines.append(f"Caminho: `{r['path']}`")
            if not r['issues']:
                lines.append("- *Nenhum problema detectado (mas pontuação incorreta?)*")
            for issue in r['issues']:
                lines.append(f"- {issue}")

    return "\n".join(lines)

def main():
    print(f"Iniciando auditoria em: {ROOT_DIR}")
    results = []
    
    for d in AUDIT_DIRS:
        dir_path = os.path.join(ROOT_DIR, d)
        if os.path.exists(dir_path):
            print(f"Varrendo diretório: {d}...")
            subdirs = os.listdir(dir_path)
            for subdir in subdirs:
                if subdir.startswith('.'): continue
                
                full_path = os.path.join(dir_path, subdir)
                
                if os.path.isfile(full_path) and subdir.endswith('.html'):
                     res = audit_app(d, subdir)
                     if res: results.append(res)
                     continue

                if os.path.isdir(full_path):
                     if os.path.exists(os.path.join(full_path, 'index.html')):
                         res = audit_app(d, subdir)
                         if res: results.append(res)
                     else:
                         nested_subdirs = os.listdir(full_path)
                         for nested in nested_subdirs:
                             nested_path = os.path.join(full_path, nested)
                             if os.path.isdir(nested_path) and not nested.startswith('.'):
                                  res = audit_app(f"{d}/{subdir}", nested)
                                  if res: results.append(res)
        else:
            print(f"Diretório não encontrado: {dir_path}")

    report_content = generate_markdown(results)
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    print(f"\n[OK] Auditoria concluída! Relatório gerado em: {REPORT_FILE}")
    print(f"Apps analisados: {len(results)}")

if __name__ == "__main__":
    main()
