import os
import math
from PIL import Image, ImageDraw, ImageFilter

icons_dir = "games-dev/godot-project/assets/textures/skills"
os.makedirs(icons_dir, exist_ok=True)

def create_tech_node_icon(name, color, symbol_type, out_path):
    size = 128
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # Nền hình lục giác bo cạnh công nghệ
    center = size // 2
    r = 54
    points = []
    for i in range(6):
        angle = math.radians(60 * i - 30)
        px = center + r * math.cos(angle)
        py = center + r * math.sin(angle)
        points.append((px, py))

    # Đổ bóng
    shadow_points = [(px + 2, py + 2) for px, py in points]
    draw.polygon(shadow_points, fill=(5, 10, 25, 200))

    # Nền lục giác chính
    draw.polygon(points, fill=(10, 20, 42, 255), outline=color, width=3)

    # Vòng tròn bên trong
    inner_r = 38
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r], fill=(15, 28, 55, 255), outline=(color[0], color[1], color[2], 120), width=2)

    # Biểu tượng biểu trưng bên trong (Radar, Crosshair, Sword, Fire, Bolt, Turbo)
    sc = color
    if symbol_type == "radar": # Tầm bắn / Radar
        draw.ellipse([center - 22, center - 22, center + 22, center + 22], outline=sc, width=2)
        draw.ellipse([center - 10, center - 10, center + 10, center + 10], outline=sc, width=2)
        draw.line([(center, center - 28), (center, center + 28)], fill=sc, width=2)
        draw.line([(center - 28, center), (center + 28, center)], fill=sc, width=2)
        draw.ellipse([center + 8, center - 12, center + 14, center - 6], fill=(255, 255, 255, 255))
    elif symbol_type == "laser": # Vệ tinh laser
        draw.ellipse([center - 26, center - 26, center + 26, center + 26], outline=sc, width=2)
        draw.line([(center - 32, center - 32), (center + 32, center + 32)], fill=(255, 255, 255, 255), width=3)
        draw.line([(center - 15, center + 15), (center + 15, center - 15)], fill=sc, width=2)
        draw.ellipse([center - 4, center - 4, center + 4, center + 4], fill=sc)
    elif symbol_type == "quantum": # Định vị lượng tử
        for ang in [0, 45, 90, 135]:
            rad = math.radians(ang)
            dx = 28 * math.cos(rad)
            dy = 28 * math.sin(rad)
            draw.line([(center - dx, center - dy), (center + dx, center + dy)], fill=sc, width=2)
        draw.ellipse([center - 8, center - 8, center + 8, center + 8], fill=(255, 255, 255, 255), outline=sc, width=2)
    elif symbol_type == "sword": # Sát thương đạn
        draw.polygon([(center, center - 28), (center + 12, center + 14), (center - 12, center + 14)], fill=sc)
        draw.line([(center, center - 28), (center, center + 24)], fill=(255, 255, 255, 255), width=2)
        draw.rectangle([center - 16, center + 14, center + 16, center + 18], fill=sc)
    elif symbol_type == "plasma_core": # Lõi plasma nhiệt hạch
        draw.ellipse([center - 24, center - 24, center + 24, center + 24], outline=sc, width=3)
        draw.ellipse([center - 14, center - 14, center + 14, center + 14], fill=sc, outline=(255, 255, 255, 255), width=2)
        draw.ellipse([center - 5, center - 5, center + 5, center + 5], fill=(255, 255, 255, 255))
    elif symbol_type == "antimatter": # Lõi phản vật chất
        draw.ellipse([center - 28, center - 28, center + 28, center + 28], outline=(255, 255, 255, 200), width=2)
        draw.ellipse([center - 18, center - 18, center + 18, center + 18], fill=sc)
        draw.polygon([(center, center - 14), (center + 12, center + 10), (center - 12, center + 10)], fill=(255, 255, 255, 255))
    elif symbol_type == "motor": # Động cơ quay tốc độ
        draw.ellipse([center - 24, center - 24, center + 24, center + 24], outline=sc, width=2)
        for i in range(3):
            ang = math.radians(120 * i)
            bx = center + 18 * math.cos(ang)
            by = center + 18 * math.sin(ang)
            draw.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=sc)
        draw.ellipse([center - 8, center - 8, center + 8, center + 8], fill=(255, 255, 255, 255))
    elif symbol_type == "coolant": # Ni-tơ lỏng
        # Bông tuyết / tản nhiệt
        for i in range(6):
            ang = math.radians(60 * i)
            ex = center + 24 * math.cos(ang)
            ey = center + 24 * math.sin(ang)
            draw.line([(center, center), (ex, ey)], fill=sc, width=2)
            draw.ellipse([ex - 3, ey - 3, ex + 3, ey + 3], fill=(255, 255, 255, 255))
    elif symbol_type == "superconductor": # Siêu dẫn bão đạn
        # Tia chớp kép
        draw.polygon([(center - 4, center - 26), (center + 14, center - 4), (center + 2, center - 2), (center + 12, center + 26), (center - 12, center + 4), (center - 2, center + 2)], fill=sc, outline=(255, 255, 255, 255), width=1)

    im.save(out_path, "PNG")
    print("Saved skill icon:", out_path)

# Tạo 9 nodes cho 3 nhánh kỹ năng
# Nhánh 1: Tầm bắn (Cyan)
create_tech_node_icon("Radar", (0, 240, 255, 255), "radar", os.path.join(icons_dir, "skill_range_1.png"))
create_tech_node_icon("Laser", (0, 240, 255, 255), "laser", os.path.join(icons_dir, "skill_range_2.png"))
create_tech_node_icon("Quantum", (0, 240, 255, 255), "quantum", os.path.join(icons_dir, "skill_range_3.png"))

# Nhánh 2: Sát thương (Đỏ cam)
create_tech_node_icon("Tungsten", (239, 68, 68, 255), "sword", os.path.join(icons_dir, "skill_dmg_1.png"))
create_tech_node_icon("PlasmaCore", (239, 68, 68, 255), "plasma_core", os.path.join(icons_dir, "skill_dmg_2.png"))
create_tech_node_icon("Antimatter", (239, 68, 68, 255), "antimatter", os.path.join(icons_dir, "skill_dmg_3.png"))

# Nhánh 3: Tốc bắn (Vàng)
create_tech_node_icon("Motor", (234, 179, 8, 255), "motor", os.path.join(icons_dir, "skill_spd_1.png"))
create_tech_node_icon("Coolant", (234, 179, 8, 255), "coolant", os.path.join(icons_dir, "skill_spd_2.png"))
create_tech_node_icon("Superconductor", (234, 179, 8, 255), "superconductor", os.path.join(icons_dir, "skill_spd_3.png"))
