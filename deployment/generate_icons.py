from PIL import Image, ImageDraw, ImageFont
import os

def create_schoolkarma_logo(size=512):
    # High-resolution 512x512 app icon
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Background rounded squircle
    radius = int(size * 0.22)
    # Deep Emerald (#064E3B)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(6, 78, 59, 255))
    
    # 2. Outer golden sun beacon ring / rays
    center_x = size // 2
    sun_y = int(size * 0.28)
    sun_radius = int(size * 0.08)
    
    # Sun core in Gold (#F59E0B)
    draw.ellipse([center_x - sun_radius, sun_y - sun_radius, center_x + sun_radius, sun_y + sun_radius], fill=(245, 158, 11, 255))
    
    # 3. Wisdom Book Pages
    # Left page (Golden Amber #F59E0B)
    left_coords = [
        (int(size * 0.25), int(size * 0.75)),
        (int(size * 0.46), int(size * 0.70)),
        (int(size * 0.46), int(size * 0.40)),
        (int(size * 0.25), int(size * 0.45)),
    ]
    draw.polygon(left_coords, fill=(245, 158, 11, 255))
    
    # Right page (Mint Green #34D399)
    right_coords = [
        (int(size * 0.54), int(size * 0.70)),
        (int(size * 0.75), int(size * 0.75)),
        (int(size * 0.75), int(size * 0.45)),
        (int(size * 0.54), int(size * 0.40)),
    ]
    draw.polygon(right_coords, fill=(52, 211, 153, 255))
    
    # Center white spine line
    draw.line([(center_x, int(size * 0.38)), (center_x, int(size * 0.72))], fill=(255, 255, 255, 255), width=int(size * 0.025))

    return img

if __name__ == '__main__':
    base_icon = create_schoolkarma_logo(1024)
    base_icon.save('/Users/chandanmallik/projects/ckr-schools-v2/deployment/schoolkarma-logo-1024.png')
    print('Generated 1024x1024 master icon')

