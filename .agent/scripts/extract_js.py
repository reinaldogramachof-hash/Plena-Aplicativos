
import os

HTML_FILE = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus\plena_beleza.html'
JS_FILE = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\temp_check.js'

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = -1
end_line = -1

for i, line in enumerate(lines):
    if i + 1 == 1877:
        if '<script>' in line:
            start_line = i
    if i + 1 == 3434:
            if '</script>' in line:
            # Actually, let's find the closing script tag after start_line
                pass

# Let's just find the big script block again dynamically to be safe
start_line = -1
for i, line in enumerate(lines):
    if '<script>' in line and 'const DB_KEY' in lines[i+2]: # Heuristic
        start_line = i
        break
    # Or just use the line 1877 from before if confirmed
    if i == 1876 and '<script>' in line:
        start_line = i
        break

if start_line != -1:
    # Find end
    for i in range(start_line, len(lines)):
        if '</script>' in lines[i]:
            end_line = i
            if i > start_line + 100: # Ensure it's the big one
                break

if start_line != -1 and end_line != -1:
    print(f"Extracted script from {start_line+1} to {end_line+1}")
    script_content = "".join(lines[start_line+1:end_line]) # Skip <script> and </script> tags
    
    with open(JS_FILE, 'w', encoding='utf-8') as f:
        f.write(script_content)
else:
    print("Could not find script block")
