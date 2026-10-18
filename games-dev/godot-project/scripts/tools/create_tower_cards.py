import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Load Windows native Segoe UI fonts with full Vietnamese Unicode support
try:
    font_bold_sm = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
    font_bold_md = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 15)
    font_bold_lg = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 16)
    font_reg_sm = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 12)
except Exception:
    font_bold_sm = None
    font_bold_md = None
    font_bold_lg = None
    font_reg_sm = None

def make_card(name, tower_img_path, base_img_path, faction_name, faction_color, cost_text, out_path, is_magical=False):
    card_w, card_h = 240, 280
    im = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # 1. Khung nền bo góc kim loại Sci-Fi 2.5D (Dark Slate Gradient)
    corner_r = 16
    # Vẽ bóng đổ
    shadow_box = [4, 4, card_w - 4, card_h - 4]
    draw.rounded_rectangle(shadow_box, radius=corner_r, fill=(5, 10, 22, 240), outline=(20, 35, 65, 255), width=2)

    # Nền bên trong
    inner_box = [6, 6, card_w - 6, card_h - 6]
    draw.rounded_rectangle(inner_box, radius=corner_r - 2, fill=(11, 20, 38, 255))

    # Viền phát sáng theo hệ (Faction Glow Border - 2px uniform)
    draw.rounded_rectangle(inner_box, radius=corner_r - 2, outline=faction_color, width=2)

    # Lưới vi mạch công nghệ chìm ở nền
    for y in range(24, card_h - 42, 16):
        draw.line([(10, y), (card_w - 10, y)], fill=(255, 255, 255, 12), width=1)
    for x in range(20, card_w - 20, 20):
        draw.line([(x, 18), (x, card_h - 48)], fill=(255, 255, 255, 12), width=1)

    # Vầng sáng trung tâm (Radial Glow)
    glow_size = 150
    glow = Image.new("RGBA", (glow_size, glow_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gc = faction_color[:3]
    for r in range(glow_size // 2, 0, -4):
        alpha = int(55 * (1.0 - (r / (glow_size / 2))))
        glow_draw.ellipse([glow_size // 2 - r, glow_size // 2 - r, glow_size // 2 + r, glow_size // 2 + r], fill=(gc[0], gc[1], gc[2], alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(8))
    im.paste(glow, (card_w // 2 - glow_size // 2, 105 - glow_size // 2), glow)

    # 2. Chèn hình ảnh Trụ thật (Composite Base + Turret)
    turret_canvas = Image.new("RGBA", (180, 180), (0, 0, 0, 0))

    if base_img_path and os.path.exists(base_img_path):
        # Đế tháp cho các tháp tách rời base (Plasma, SAM, Tesla)
        base_im = Image.open(base_img_path).convert("RGBA")
        base_im = base_im.resize((140, 80), Image.Resampling.LANCZOS)
        turret_canvas.paste(base_im, (20, 95), base_im)

        if tower_img_path and os.path.exists(tower_img_path):
            tower_im = Image.open(tower_img_path).convert("RGBA")
            w, h = tower_im.size
            target_w = 150
            scale = target_w / float(w)
            target_h = int(h * scale)
            if target_h > 150:
                target_h = 150
                scale = target_h / float(h)
                target_w = int(w * scale)
            tower_im = tower_im.resize((target_w, target_h), Image.Resampling.LANCZOS)
            paste_x = (180 - target_w) // 2
            paste_y = (150 - target_h) // 2 + 10
            turret_canvas.paste(tower_im, (paste_x, paste_y), tower_im)
    else:
        # Tháp đã tích hợp hoàn chỉnh thân và đế nguyên vẹn (Gatling Gun)
        if tower_img_path and os.path.exists(tower_img_path):
            tower_im = Image.open(tower_img_path).convert("RGBA")
            if tower_im.width > 1000:
                tower_im = tower_im.crop((0, 0, 640, 640))
            bbox = tower_im.getbbox()
            if bbox:
                tower_crop = tower_im.crop(bbox)
            else:
                tower_crop = tower_im
            cw, ch = tower_crop.size
            target_h = 145
            scale = target_h / float(ch)
            target_w = int(cw * scale)
            tower_resized = tower_crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
            paste_x = (180 - target_w) // 2
            paste_y = 175 - target_h
            turret_canvas.paste(tower_resized, (paste_x, paste_y), tower_resized)

    im.paste(turret_canvas, ((card_w - 180) // 2, 24), turret_canvas)

    # 3. Huy hiệu Faction trên đỉnh (Vietnamese font sắc nét)
    badge_box = [16, 12, 120, 34]
    draw.rounded_rectangle(badge_box, radius=6, fill=(14, 28, 54, 230), outline=faction_color, width=1)
    draw.text((24, 14), faction_name, fill=faction_color, font=font_bold_sm)

    # 4. Tên tháp ở bên dưới
    name_bg = [14, card_h - 80, card_w - 14, card_h - 48]
    draw.rounded_rectangle(name_bg, radius=6, fill=(16, 28, 52, 240), outline=(50, 85, 135, 255), width=1)
    draw.text((24, card_h - 75), name, fill=(240, 248, 255, 255), font=font_bold_md)

    # 5. Khung giá vàng ở đáy
    cost_bg = [14, card_h - 44, card_w - 14, card_h - 12]
    draw.rounded_rectangle(cost_bg, radius=6, fill=(26, 22, 12, 255), outline=(234, 179, 8, 255), width=1)

    # Icon vàng coin
    draw.ellipse([22, card_h - 38, 40, card_h - 18], fill=(234, 179, 8, 255), outline=(254, 240, 138, 255), width=1)
    draw.text((27, card_h - 36), "G", fill=(0, 0, 0, 255), font=font_bold_sm)
    draw.text((48, card_h - 36), cost_text, fill=(253, 224, 71, 255), font=font_bold_sm)

    im.save(out_path, "PNG")
    print("Saved card:", out_path)

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out_dir = os.path.join(base_dir, "assets", "textures", "cards")
os.makedirs(out_dir, exist_ok=True)

# 1. Gatling Gun (100G) - Dùng sprite hướng 4 (SE 3/4 isometric perspective) hoàn chỉnh 100% thân đế
make_card(
    "GATLING GUN",
    os.path.join(base_dir, "assets/sprites/towers/gatling/gatling_dir_4.png"),
    None, # Không dùng base tách rời để loại bỏ hoàn toàn lỗi đầu bay lơ lửng
    "CƠ KHÍ",
    (16, 185, 129, 255), # Emerald
    "100 VÀNG",
    os.path.join(out_dir, "card_gatling.png")
)

# 2. Plasma Cannon (60G)
make_card(
    "PLASMA CANNON",
    os.path.join(base_dir, "assets/sprites/tower_plasma_cannon.png"),
    os.path.join(base_dir, "assets/sprites/tower_plasma_base.png"),
    "NHIỆT HẠCH",
    (0, 240, 255, 255), # Cyan Neon
    "60 VÀNG",
    os.path.join(out_dir, "card_plasma.png")
)

# 3. Tesla Coil (150G)
make_card(
    "TESLA COIL",
    os.path.join(base_dir, "assets/sprites/tower_tesla_coil.png"),
    None,
    "ĐIỆN TỪ",
    (168, 85, 247, 255), # Purple
    "150 VÀNG",
    os.path.join(out_dir, "card_tesla.png")
)

print("Card assets created successfully with pristine Vietnamese fonts!")
