import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Canvas dimensions (High DPI 2x of 150x192)
CARD_W = 300
CARD_H = 384
CORNER_R = 18

try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20)
    font_hotkey = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 13)
    font_hotkey_bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 13)
except Exception:
    font_title = ImageFont.load_default()
    font_hotkey = ImageFont.load_default()
    font_hotkey_bold = ImageFont.load_default()

def create_card(art_path, title, hotkey, accent_rgb, out_path):
    # 1. Base Image
    im = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0))

    # 2. Outer frame mask (Rounded Rectangle)
    mask = Image.new("L", (CARD_W, CARD_H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, CARD_W - 1, CARD_H - 1], radius=CORNER_R, fill=255)

    # 3. Load & Process Artwork
    art = Image.open(art_path).convert("RGBA")

    # Crop to card ratio (preserve center subject)
    art_w, art_h = art.size
    target_aspect = CARD_W / float(CARD_H)
    current_aspect = art_w / float(art_h)

    if current_aspect > target_aspect:
        # Wider than target -> crop sides
        new_w = int(art_h * target_aspect)
        left = (art_w - new_w) // 2
        art_cropped = art.crop((left, 0, left + new_w, art_h))
    else:
        # Taller than target -> crop top/bottom slightly (favor center-top)
        new_h = int(art_w / target_aspect)
        top = int((art_h - new_h) * 0.25)
        art_cropped = art.crop((0, top, art_w, top + new_h))

    art_resized = art_cropped.resize((CARD_W, CARD_H), Image.Resampling.LANCZOS)
    im.paste(art_resized, (0, 0), mask)

    # 4. Vignette / Contrast enhancement layer
    overlay = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    # Top subtle shadow to make the energy gem pop
    for y in range(40):
        alpha = int(120 * (1.0 - y / 40.0))
        ov_draw.line([(0, y), (CARD_W, y)], fill=(8, 12, 20, alpha))

    # Bottom deep obsidian gradient for pristine text readability
    grad_start = CARD_H - 120
    for y in range(grad_start, CARD_H):
        ratio = (y - grad_start) / float(CARD_H - grad_start)
        # Smooth quadratic curve for natural cinematic falloff
        alpha = int(245 * (ratio ** 1.3))
        ov_draw.line([(0, y), (CARD_W, y)], fill=(6, 10, 18, alpha))

    im = Image.alpha_composite(im, overlay)
    draw = ImageDraw.Draw(im)

    # 5. High-Tech Metallic Beveled Frame
    # Outer dark titanium rim (2px)
    draw.rounded_rectangle([0, 0, CARD_W - 1, CARD_H - 1], radius=CORNER_R, outline=(18, 26, 42, 255), width=2)
    # Inner vibrant neon accent border (1.5px)
    accent_rgba = (accent_rgb[0], accent_rgb[1], accent_rgb[2], 220)
    draw.rounded_rectangle([2, 2, CARD_W - 3, CARD_H - 3], radius=CORNER_R - 1, outline=accent_rgba, width=2)
    # Inner specular highlight (1px subtle cyan-white)
    specular_rgba = (255, 255, 255, 45)
    draw.rounded_rectangle([4, 4, CARD_W - 5, CARD_H - 5], radius=CORNER_R - 2, outline=specular_rgba, width=1)

    # 6. Top Center Energy Gem / Crest
    gem_w, gem_h = 32, 12
    gem_x = (CARD_W - gem_w) // 2
    gem_y = 6
    # Gem background
    draw.rounded_rectangle([gem_x, gem_y, gem_x + gem_w, gem_y + gem_h], radius=4, fill=(10, 16, 26, 240), outline=accent_rgba, width=1)
    # Gem core
    gem_core_w = 16
    gem_core_x = (CARD_W - gem_core_w) // 2
    draw.rounded_rectangle([gem_core_x, gem_y + 3, gem_core_x + gem_core_w, gem_y + gem_h - 3], radius=2, fill=accent_rgba)

    # 7. Corner Tech Brackets (4 corners)
    corner_size = 14
    for cx, cy, sx, sy in [(6, 6, 1, 1), (CARD_W - 7, 6, -1, 1), (6, CARD_H - 7, 1, -1), (CARD_W - 7, CARD_H - 7, -1, -1)]:
        draw.line([(cx, cy), (cx + sx * corner_size, cy)], fill=(255, 255, 255, 180), width=1)
        draw.line([(cx, cy), (cx, cy + sy * corner_size)], fill=(255, 255, 255, 180), width=1)

    # 8. Bottom Nameplate & Hotkey
    plate_y = CARD_H - 68
    plate_h = 56
    plate_rect = [12, plate_y, CARD_W - 12, plate_y + plate_h]

    # Glass nameplate container
    draw.rounded_rectangle(plate_rect, radius=8, fill=(10, 16, 28, 215), outline=(accent_rgb[0] // 2, accent_rgb[1] // 2, accent_rgb[2] // 2, 180), width=1)

    # Title Text (Centered, bold, sharp with drop shadow)
    # Measure text
    bbox = draw.textbbox((0, 0), title, font=font_title)
    text_w = bbox[2] - bbox[0]
    text_x = (CARD_W - text_w) // 2
    text_y = plate_y + 6

    # Shadow
    draw.text((text_x + 1, text_y + 2), title, fill=(0, 0, 0, 240), font=font_title)
    draw.text((text_x - 1, text_y), title, fill=(0, 0, 0, 240), font=font_title)
    draw.text((text_x, text_y + 1), title, fill=(0, 0, 0, 240), font=font_title)
    # Crisp white text with accent tint
    draw.text((text_x, text_y), title, fill=(255, 255, 255, 255), font=font_title)

    # Hotkey Badge (Centered below title)
    hk_bbox = draw.textbbox((0, 0), hotkey, font=font_hotkey_bold)
    hk_w = hk_bbox[2] - hk_bbox[0] + 16
    hk_h = 18
    hk_x = (CARD_W - hk_w) // 2
    hk_y = text_y + 26

    # Hotkey pill container
    draw.rounded_rectangle([hk_x, hk_y, hk_x + hk_w, hk_y + hk_h], radius=5, fill=(18, 28, 46, 240), outline=accent_rgba, width=1)
    draw.text((hk_x + 8, hk_y + 1), hotkey, fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], 255), font=font_hotkey_bold)

    # Save
    im.save(out_path, "PNG", optimize=True)
    print("Exported card:", out_path)

if __name__ == "__main__":
    cards_data = [
        (
            r"C:\Users\lepha\.gemini\antigravity-ide\brain\30eee20e-7e0c-4b93-8959-fef72b04cdb3\card_buy_tower_art_1792412528775.jpg",
            "MUA TRỤ",
            "[SPACE]",
            (0, 240, 255), # Cyan
            "games-dev/godot-project/assets/textures/cards/video_style/card_buy_tower.png"
        ),
        (
            r"C:\Users\lepha\.gemini\antigravity-ide\brain\30eee20e-7e0c-4b93-8959-fef72b04cdb3\card_skill_art_1792412550389.jpg",
            "KỸ NĂNG",
            "[W]",
            (16, 230, 140), # Emerald
            "games-dev/godot-project/assets/textures/cards/video_style/card_skill.png"
        ),
        (
            r"C:\Users\lepha\.gemini\antigravity-ide\brain\30eee20e-7e0c-4b93-8959-fef72b04cdb3\card_spell_art_1792412569456.jpg",
            "PHÉP THUẬT",
            "[F]",
            (255, 205, 50), # Gold
            "games-dev/godot-project/assets/textures/cards/video_style/card_spell.png"
        ),
        (
            r"C:\Users\lepha\.gemini\antigravity-ide\brain\30eee20e-7e0c-4b93-8959-fef72b04cdb3\card_next_wave_art_1792412589957.jpg",
            "GỌI ĐỢT",
            "[N]",
            (255, 60, 60), # Ruby Red
            "games-dev/godot-project/assets/textures/cards/video_style/card_next_wave.png"
        ),
        (
            r"C:\Users\lepha\.gemini\antigravity-ide\brain\30eee20e-7e0c-4b93-8959-fef72b04cdb3\card_bridge_emp_art_1792412607111.jpg",
            "BẪY CẦU",
            "[E]",
            (190, 110, 255), # Violet
            "games-dev/godot-project/assets/textures/cards/video_style/card_bridge_emp.png"
        )
    ]

    for art, title, hotkey, rgb, out in cards_data:
        full_out = os.path.abspath(out)
        create_card(art, title, hotkey, rgb, full_out)
