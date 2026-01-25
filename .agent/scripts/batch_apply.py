import os
import subprocess

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
SCRIPT_PATH = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\.agent\scripts\apply_plena_standard.py"

IGNORE_LIST = ["plena_barbearia", "plena_motorista", "plena_motoboy", "example"]

COLOR_MAP = {
    "plena_artesanato": "pink",
    "plena_beleza": "pink",
    "plena_nutri": "green",
    "plena_fit": "green",
    "plena_feirante": "green",
    "plena_obras": "orange",
    "plena_assistencia": "blue",
    "plena_delivery": "red",
    "plena_hamburgueria": "red",
    "plena_pizzaria": "red",
    "plena_sorveteria": "red",
    "plena_marmita": "red",
    "plena_odonto": "teal",
    "plena_terapia": "teal",
    "plena_financas": "emerald",
    "plena_card": "purple",
    "plena_alugueis": "indigo",
}

def get_color(app_name):
    return COLOR_MAP.get(app_name, "indigo") # Default color

def main():
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    
    for app in apps:
        if app in IGNORE_LIST:
            print(f"Skipping {app} (Ignored)")
            continue

        index_path = os.path.join(APPS_DIR, app, "index.html")
        if not os.path.exists(index_path):
            print(f"Skipping {app} (No index.html)")
            continue
            
        color = get_color(app)
        print(f"Applying standard to {app} with color {color}...")
        
        try:
            subprocess.run(["python", SCRIPT_PATH, index_path, color], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error processing {app}: {e}")

if __name__ == "__main__":
    main()
