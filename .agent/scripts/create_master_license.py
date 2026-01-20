import json
import os
import datetime

# Path to the licenses database
LICENSE_FILE = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\data\database_licenses_secure.json'
BACKUP_FILE = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\data\database_licenses_secure.bak'

# Master License Data
MASTER_KEY = "PLENA-MASTER-2026"
MASTER_LICENSE = {
    "key": MASTER_KEY,
    "product": "MASTER_KEY",
    "client": "admin@plena.com",
    "clientName": "Admin Master",
    "whatsapp": "5511999999999",
    "status": "active",
    "device_id": "", # Empty initially, but API has bypass
    "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "expires_at": "2030-12-31 23:59:59",
    "last_access": "",
    "duration": "lifetime"
}

def create_master_license():
    # Load existing licenses
    if os.path.exists(LICENSE_FILE):
        with open(LICENSE_FILE, 'r', encoding='utf-8') as f:
            try:
                licenses = json.load(f)
            except json.JSONDecodeError:
                licenses = {}
                print("Warning: JSON decode error, starting with empty dict (backup your file manually first if needed)")
    else:
        licenses = {}
    
    # Backup
    if os.path.exists(LICENSE_FILE):
        with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
            json.dump(licenses, f, indent=4)
        print(f"Backup created at {BACKUP_FILE}")

    # Add/Update Master License
    licenses[MASTER_KEY] = MASTER_LICENSE
    
    # Save
    with open(LICENSE_FILE, 'w', encoding='utf-8') as f:
        json.dump(licenses, f, indent=4)
        
    print(f"Success! Master License created/updated.")
    print(f"Key: {MASTER_KEY}")
    print(f"Product Type: MASTER_KEY")

if __name__ == "__main__":
    create_master_license()
