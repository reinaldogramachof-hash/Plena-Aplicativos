import os
import re

def find_license_footers(directory):
    html_files = [f for f in os.listdir(directory) if f.endswith('.html')]
    for filename in html_files:
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Search for the footer div
            match = re.search(r'<div[^>]*>[\s\S]*?Licença de Uso Concedida a:[\s\S]*?<\/div>', content)
            if match:
                print(f"Found in {filename}:")
                print(match.group(0))
                print("-" * 20)
            # Search for the LICENSE_DATA const
            match = re.search(r'const LICENSE_DATA = {[\s\S]*?};', content)
            if match:
                print(f"Found LICENSE_DATA in {filename}:")
                print(match.group(0))
                print("-" * 20)


find_license_footers('c:/Users/reina/OneDrive/Desktop/Projetos/Plena Aplicativos/apps.plus/')
