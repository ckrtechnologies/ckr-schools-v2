import os
from PIL import Image

SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

FOREGROUND_SIZES = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}

master_path = '/Users/chandanmallik/projects/ckr-schools-v2/deployment/schoolkarma-logo-1024.png'
master = Image.open(master_path)

apps = [
    '/Users/chandanmallik/projects/ckr-schools-v2/mobile/student_app/android/app/src/main/res',
    '/Users/chandanmallik/projects/ckr-schools-v2/mobile/teacher_app/android/app/src/main/res'
]

for app_res in apps:
    for folder, size in SIZES.items():
        dir_path = os.path.join(app_res, folder)
        if os.path.exists(dir_path):
            resized = master.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(os.path.join(dir_path, 'ic_launcher.png'))
            resized.save(os.path.join(dir_path, 'ic_launcher_round.png'))
            
    for folder, size in FOREGROUND_SIZES.items():
        dir_path = os.path.join(app_res, folder)
        if os.path.exists(dir_path):
            # For foreground, scale logo down to ~65% to fit inside adaptive icon safe-zone
            fg_canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            inner_size = int(size * 0.72)
            inner_logo = master.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
            offset = (size - inner_size) // 2
            fg_canvas.paste(inner_logo, (offset, offset), inner_logo)
            fg_canvas.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

print("Updated all Android app launcher icons in student_app and teacher_app!")

