from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, path):
    # Create valid directory if not exists (though we tried via command)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # Plena Brand Colors (Dark Blue / Gradient style simplified)
    bg_color = (13, 17, 39) # #0d1127 (approx from logs)
    text_color = (255, 255, 255)
    
    # Create image
    img = Image.new('RGB', (size, size), color=bg_color)
    d = ImageDraw.Draw(img)
    
    # Draw a "P" or "Rocket"
    # Simple "P" for now as we don't have font files guaranteed
    # Trying to draw a simple shape or text
    
    padding = size // 4
    
    # Draw a simplified "Rocket" shape (Triangle + Rect) or just a Circle
    # Let's do a Circle with a "P" inside roughly
    
    # Circle container
    d.ellipse([padding, padding, size-padding, size-padding], outline=(0, 149, 255), width=size//20)
    
    # Text "P" centered (manual drawing or basic font)
    # Since we can't guarantee fonts, let's draw a geometric P
    
    # Vertical Line
    p_x = size // 2 - size // 8
    p_y = size // 3
    p_h = size // 2
    p_w = size // 8
    d.rectangle([p_x, p_y, p_x + p_w, p_y + p_h], fill=(0, 149, 255))
    
    # Top Loop
    d.arc([p_x, p_y, p_x + size//3, p_y + size//3], 270, 90, fill=(0, 149, 255), width=p_w)
    d.rectangle([p_x + p_w, p_y, p_x + size//6, p_y + size//8], fill=(0, 149, 255)) # Top connector
    d.rectangle([p_x + p_w, p_y + size//4, p_x + size//6, p_y + size//3 - size//16], fill=(0, 149, 255)) # Bottom connector
    
    # Save
    img.save(path)
    print(f"Created {path}")

# Paths
base_dir = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\assets\img\icons"

create_icon(192, os.path.join(base_dir, "icon-192.png"))
create_icon(512, os.path.join(base_dir, "icon-512.png"))
