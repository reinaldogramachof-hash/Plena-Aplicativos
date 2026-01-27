import os

FILE_PATH = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus\plena_assistencia\index.html"
LOCK_SCRIPT_NAME = "plena-lock.js"

if not os.path.exists(FILE_PATH):
    print("File not found")
else:
    print(f"Reading {FILE_PATH}...")
    try:
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            content = f.read()
            print("Read with UTF-8")
    except:
        try:
            with open(FILE_PATH, "r", encoding="latin-1") as f:
                content = f.read()
                print("Read with Latin-1")
        except:
            print("Failed to read file")
            exit()
            
    if LOCK_SCRIPT_NAME in content:
        print(f"String '{LOCK_SCRIPT_NAME}' FOUND in content at index {content.index(LOCK_SCRIPT_NAME)}")
        # Show context
        idx = content.index(LOCK_SCRIPT_NAME)
        print(f"Context: {content[idx-50:idx+50]}")
    else:
        print(f"String '{LOCK_SCRIPT_NAME}' NOT found. Script should have run.")
        
    if "</head>" in content:
        print("Found </head> tag.")
    else:
        print("</head> tag NOT found.")
