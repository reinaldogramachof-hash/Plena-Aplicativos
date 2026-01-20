
def analyze_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find the script block
    start_line = -1
    end_line = -1
    
    for i, line in enumerate(lines):
        if i + 1 == 1877:
            if '<script>' in line:
                start_line = i
        if i + 1 == 3434:
             if '</script>' in line:
                end_line = i
                
    if start_line == -1 or end_line == -1:
        print(f"Could not find exact script block at 1877-3434. Found start={start_line}, end={end_line}")
        # Try finding by content
        for i, line in enumerate(lines):
            if 'const DB_KEY' in line:
                start_line = i - 1 # Assuming <script> is right before
                break
        
        # Find closing
        if start_line != -1:
            for i in range(start_line, len(lines)):
                if '</script>' in lines[i]:
                    end_line = i
                    # We want the LAST script tag if there are nested ones? No, usually not nested scripts.
                    # But we want the one that closes the block started at start_line.
                    
                    # Heuristic: The main block is huge.
                    if i > start_line + 1000:
                        break
    
    if start_line == -1:
        print("Script block not found.")
        return

    print(f"Analyzing script block from line {start_line+1} to {end_line+1}")

    brace_stack = []
    
    for i in range(start_line, end_line + 1):
        line = lines[i]
        # Remove comments roughly
        # Single line //
        if '//' in line:
            line = line.split('//')[0]
        # We process line char by char
        
        # Note: This is a simple parser, might fail on regex or strings containing braces.
        # But it's a good first step.
        
        for j, char in enumerate(line):
            if char == '{':
                brace_stack.append((i+1, j+1))
            elif char == '}':
                if not brace_stack:
                    print(f"ERROR: Unexpected '}}' at line {i+1}, col {j+1}")
                    return
                brace_stack.pop()

    if brace_stack:
        print(f"ERROR: Unclosed '{{' found. Stack size: {len(brace_stack)}")
        print("First 3 unclosed braces:")
        for b in brace_stack[:3]:
            print(f"  Line {b[0]}, Col {b[1]}: {lines[b[0]-1].strip()}")
        print("Last 3 unclosed braces:")
        for b in brace_stack[-3:]:
             print(f"  Line {b[0]}, Col {b[1]}: {lines[b[0]-1].strip()}")

if __name__ == "__main__":
    analyze_braces(r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus\plena_beleza.html")
