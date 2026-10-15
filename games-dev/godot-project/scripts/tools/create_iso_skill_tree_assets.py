import os
import math
from PIL import Image, ImageDraw, ImageFilter

icons_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "assets", "textures", "skills")
os.makedirs(icons_dir, exist_ok=True)

def draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col_theme):
    # 1. Base ambient drop shadow
    draw.ellipse([cx - 88, base_y + 12, cx + 88, base_y + 60], fill=(2, 5, 14, 180))

    # 2. Lower Plinth (Isometric Block)
    hw = 76
    hh = 30
    depth = 26

    p_top = (cx, base_y - hh)
    p_right = (cx + hw, base_y)
    p_bot = (cx, base_y + hh)
    p_left = (cx - hw, base_y)

    p_right_d = (cx + hw, base_y + depth)
    p_bot_d = (cx, base_y + hh + depth)
    p_left_d = (cx - hw, base_y + depth)

    # Left front face (deep dark metallic with gradient)
    draw.polygon([p_left, p_bot, p_bot_d, p_left_d], fill=(10, 16, 28, 255), outline=(24, 38, 62, 255), width=2)
    # Right front face (medium metallic)
    draw.polygon([p_bot, p_right, p_right_d, p_bot_d], fill=(16, 26, 44, 255), outline=(32, 50, 80, 255), width=2)
    # Top face
    draw.polygon([p_top, p_right, p_bot, p_left], fill=(22, 36, 60, 255), outline=(48, 76, 118, 255), width=2)

    # Metallic specular edge on front ridge
    draw.line([p_bot, p_bot_d], fill=(90, 130, 190, 255), width=2)
    draw.line([p_left, p_bot], fill=(50, 80, 125, 255), width=2)
    draw.line([p_bot, p_right], fill=(80, 120, 180, 255), width=2)

    # Upper Tier Inset (Elevated Hexagonal/Diamond Pad)
    ihw = 58
    ihh = 22
    ip_top = (cx, base_y - ihh)
    ip_right = (cx + ihw, base_y)
    ip_bot = (cx, base_y + ihh)
    ip_left = (cx - ihw, base_y)
    draw.polygon([ip_top, ip_right, ip_bot, ip_left], fill=(14, 24, 40, 255), outline=(col_theme[0], col_theme[1], col_theme[2], 160), width=2)

    # Core Socket (Glowing Neon Wells)
    shw = 38
    shh = 14
    sp_top = (cx, base_y - shh)
    sp_right = (cx + shw, base_y)
    sp_bot = (cx, base_y + shh)
    sp_left = (cx - shw, base_y)
    draw.polygon([sp_top, sp_right, sp_bot, sp_left], fill=(col_theme[0]//5, col_theme[1]//5, col_theme[2]//5, 255), outline=col_theme, width=2)
    gdraw.polygon([sp_top, sp_right, sp_bot, sp_left], fill=(col_theme[0], col_theme[1], col_theme[2], 90))

    # 4 Corner Illuminated Energy Bolts / Micro-conduits
    for px, py in [(cx - 46, base_y - 7), (cx + 46, base_y - 7), (cx - 46, base_y + 7), (cx + 46, base_y + 7)]:
        draw.ellipse([px - 4, py - 3, px + 4, py + 3], fill=(255, 255, 255, 255), outline=col_theme)
        gdraw.ellipse([px - 6, py - 5, px + 6, py + 5], fill=(col_theme[0], col_theme[1], col_theme[2], 180))

def create_25d_radar_t1(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (0, 235, 255, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Steampunk Tactical Radar Array
    # Hydraulic mounting yoke
    draw.polygon([(cx - 16, base_y - 6), (cx + 16, base_y - 6), (cx + 12, base_y - 32), (cx - 12, base_y - 32)], fill=(40, 58, 86, 255), outline=(75, 110, 160, 255), width=2)
    draw.ellipse([cx - 8, base_y - 36, cx + 8, base_y - 24], fill=(20, 35, 55, 255), outline=col, width=2)

    # 3D Tilted Radar Dish (Deep parabolic saucer)
    dish_cy = 96
    # Outer dish rim
    draw.ellipse([cx - 54, dish_cy - 40, cx + 54, dish_cy + 40], fill=(15, 28, 48, 255), outline=(0, 210, 255, 255), width=3)
    # Metallic mesh lines inside dish
    for r in [42, 28, 14]:
        draw.ellipse([cx - r, dish_cy - int(r*0.75), cx + r, dish_cy + int(r*0.75)], outline=(0, 180, 230, 140), width=1)

    # 4 grid ribs
    draw.line([(cx - 50, dish_cy), (cx + 50, dish_cy)], fill=(0, 200, 240, 180), width=2)
    draw.line([(cx, dish_cy - 36), (cx, dish_cy + 36)], fill=(0, 200, 240, 180), width=2)

    # Protruding central feed horn with glowing emitter node
    draw.line([(cx, dish_cy), (cx + 24, dish_cy - 22)], fill=(220, 245, 255, 255), width=4)
    draw.ellipse([cx + 18, dish_cy - 28, cx + 30, dish_cy - 16], fill=(255, 255, 255, 255), outline=col, width=2)
    gdraw.ellipse([cx + 12, dish_cy - 34, cx + 36, dish_cy - 10], fill=(0, 240, 255, 220))

    # Volumetric radar sweep cone
    draw.polygon([(cx, dish_cy), (cx - 48, dish_cy - 34), (cx - 24, dish_cy - 42)], fill=(0, 240, 255, 120))
    gdraw.polygon([(cx, dish_cy), (cx - 50, dish_cy - 36), (cx - 22, dish_cy - 44)], fill=(0, 240, 255, 90))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_laser_t2(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (0, 235, 255, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Photonic Laser Optics Array
    # Sleek cyber-gimbal neck
    draw.rectangle([cx - 10, base_y - 34, cx + 10, base_y - 6], fill=(35, 52, 78, 255), outline=(70, 105, 155, 255), width=2)

    t_y = 94
    # Dual Heavy Laser Projector Pods (Left & Right 3D Cylinders)
    for sign in [-1, 1]:
        px = cx + sign * 36
        draw.polygon([(px - 14, t_y + 16), (px + 14, t_y + 16), (px + 14, t_y - 18), (px - 14, t_y - 18)], fill=(18, 32, 54, 255), outline=(50, 95, 150, 255), width=2)
        # Glowing aperture lens
        draw.ellipse([px - 10, t_y - 14, px + 10, t_y + 2], fill=(0, 220, 255, 220), outline=(220, 255, 255, 255), width=2)
        gdraw.ellipse([px - 16, t_y - 20, px + 16, t_y + 8], fill=(0, 240, 255, 160))

    # Center Photonic AI Crystal Prism (Faceted 3D Diamond)
    prism_pts = [(cx, t_y - 44), (cx + 28, t_y), (cx, t_y + 30), (cx - 28, t_y)]
    draw.polygon(prism_pts, fill=(12, 48, 80, 255), outline=(130, 240, 255, 255), width=3)
    # Facet reflections
    draw.polygon([(cx, t_y - 44), (cx + 28, t_y), (cx, t_y + 5)], fill=(30, 85, 135, 200))
    draw.polygon([(cx, t_y - 44), (cx - 28, t_y), (cx, t_y + 5)], fill=(18, 60, 100, 200))
    draw.line([(cx, t_y - 44), (cx, t_y + 30)], fill=(220, 255, 255, 255), width=2)

    # AI Optical Target Crosshair Beam
    draw.line([(cx - 45, t_y), (cx + 45, t_y)], fill=(0, 240, 255, 200), width=1)
    draw.line([(cx, t_y - 50), (cx, t_y + 36)], fill=(0, 240, 255, 200), width=1)
    # Laser targeting ray
    draw.line([(cx, t_y - 5), (cx + 75, t_y - 46)], fill=(255, 255, 255, 255), width=3)
    gdraw.line([(cx, t_y - 5), (cx + 75, t_y - 46)], fill=(0, 240, 255, 240), width=9)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_satellite_t3(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (0, 235, 255, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Orbital Particle Satellite Platform
    s_y = 90

    # Floating Gyroscopic Rings
    # Outer Tilted Gyro Ring
    draw.ellipse([cx - 62, s_y - 34, cx + 62, s_y + 34], outline=(0, 190, 245, 240), width=3)
    gdraw.ellipse([cx - 64, s_y - 36, cx + 64, s_y + 36], outline=(0, 235, 255, 160), width=7)

    # Inner Counter-Rotating Ring
    draw.ellipse([cx - 42, s_y - 46, cx + 42, s_y + 46], outline=(120, 230, 255, 220), width=2)

    # Center Quantum Singularity Crystal (Sphere with Specular Core)
    r = 24
    draw.ellipse([cx - r, s_y - r, cx + r, s_y + r], fill=(0, 180, 255, 255), outline=(240, 255, 255, 255), width=3)
    draw.ellipse([cx - 10, s_y - 14, cx + 8, s_y + 4], fill=(255, 255, 255, 255))
    gdraw.ellipse([cx - 32, s_y - 32, cx + 32, s_y + 32], fill=(0, 240, 255, 200))

    # 4 Orbiting Micro-Relay Drones
    for ang, dist in [(25, 56), (115, 52), (205, 58), (295, 50)]:
        rad = math.radians(ang)
        ox = cx + dist * math.cos(rad)
        oy = s_y + dist * 0.58 * math.sin(rad)
        draw.ellipse([ox - 6, oy - 6, ox + 6, oy + 6], fill=(255, 255, 255, 255), outline=col, width=2)
        gdraw.ellipse([ox - 10, oy - 10, ox + 10, oy + 10], fill=(0, 240, 255, 180))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_damage_t1(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (255, 60, 45, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Heavy Gunpowder Cannon Breech & Giant Explosive Shells
    s_y = 96

    # Armored Heavy Cannon Breech Housing (Dark Cast Iron Block with Brass Rivets)
    draw.polygon([(cx - 22, base_y - 8), (cx + 22, base_y - 8), (cx + 18, base_y - 32), (cx - 18, base_y - 32)], fill=(45, 22, 22, 255), outline=(130, 45, 45, 255), width=2)
    # Brass rivets
    for rx in [cx - 12, cx, cx + 12]:
        draw.ellipse([rx - 2, base_y - 20, rx + 2, base_y - 16], fill=(240, 180, 50, 255))

    # 2 Heavy Artillery Shells (3D Cylinders with Glowing Red Thermal Warheads)
    # Shell 1 (Left, Brass casing)
    draw.polygon([(cx - 38, s_y + 16), (cx - 16, s_y + 16), (cx - 16, s_y - 22), (cx - 27, s_y - 42), (cx - 38, s_y - 22)], fill=(185, 125, 40, 255), outline=(245, 175, 55, 255), width=2)
    # Glowing Molten Warhead Cone
    draw.polygon([(cx - 38, s_y - 22), (cx - 16, s_y - 22), (cx - 27, s_y - 42)], fill=(255, 55, 35, 255), outline=(255, 200, 140, 255), width=1)
    gdraw.ellipse([cx - 35, s_y - 48, cx - 19, s_y - 32], fill=(255, 80, 40, 180))

    # Shell 2 (Center-Right, Upright Heavy Warhead)
    draw.polygon([(cx - 10, s_y + 20), (cx + 18, s_y + 20), (cx + 18, s_y - 26), (cx + 4, s_y - 50), (cx - 10, s_y - 26)], fill=(205, 140, 45, 255), outline=(255, 195, 65, 255), width=2)
    draw.polygon([(cx - 10, s_y - 26), (cx + 18, s_y - 26), (cx + 4, s_y - 50)], fill=(255, 50, 30, 255), outline=(255, 220, 160, 255), width=2)
    gdraw.ellipse([cx - 6, s_y - 58, cx + 14, s_y - 38], fill=(255, 100, 40, 220))

    # Fiery smoke sparks
    for sp in [(cx - 22, s_y - 52), (cx + 12, s_y - 58), (cx - 4, s_y - 38)]:
        draw.ellipse([sp[0]-3, sp[1]-3, sp[0]+3, sp[1]+3], fill=(255, 220, 100, 255))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_damage_t2(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (255, 60, 45, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Tungsten APFSDS Armor-Piercing Fin-Stabilized Kinetic Penetrator
    s_y = 92

    # Heavy Sabot Cradle (Split Aluminum-Titanium Petals)
    draw.polygon([(cx - 32, s_y + 16), (cx + 32, s_y + 16), (cx + 22, s_y - 10), (cx - 22, s_y - 10)], fill=(50, 50, 60, 255), outline=(130, 130, 150, 255), width=2)
    # Warning chevron stripes
    draw.polygon([(cx - 8, s_y + 4), (cx + 8, s_y + 4), (cx + 4, s_y - 4), (cx - 4, s_y - 4)], fill=(255, 180, 30, 255))

    # Long Dense Tungsten-Carbide Dart Core (High Specular Metallic Finish)
    draw.polygon([(cx - 8, s_y + 30), (cx + 8, s_y + 30), (cx + 8, s_y - 34), (cx, s_y - 58), (cx - 8, s_y - 34)], fill=(210, 220, 235, 255), outline=(255, 255, 255, 255), width=2)

    # Glowing Molten Depleted Core Channel
    draw.line([(cx, s_y + 24), (cx, s_y - 48)], fill=(255, 50, 30, 255), width=4)
    gdraw.line([(cx, s_y + 24), (cx, s_y - 54)], fill=(255, 70, 40, 240), width=9)

    # 4 Aerodynamic Stabilizing Fins
    draw.polygon([(cx - 8, s_y + 16), (cx - 28, s_y + 26), (cx - 8, s_y + 28)], fill=(130, 35, 35, 255), outline=col, width=1)
    draw.polygon([(cx + 8, s_y + 16), (cx + 28, s_y + 26), (cx + 8, s_y + 28)], fill=(130, 35, 35, 255), outline=col, width=1)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_damage_t3(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (255, 60, 45, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Antimatter Singularity Core inside Magnetic Claws
    s_y = 90

    # 4 Curved Magnetic Containment Pylons
    for sign in [-1, 1]:
        px = cx + sign * 42
        pts = [(cx + sign * 18, s_y + 28), (px, s_y + 4), (cx + sign * 26, s_y - 42)]
        draw.line(pts, fill=(70, 20, 30, 255), width=8)
        draw.line(pts, fill=(255, 65, 45, 255), width=3)
        gdraw.line(pts, fill=(255, 75, 50, 160), width=6)

    # Fiery Accretion Disk (Tilted Oval with Molten Plasma Glow)
    draw.ellipse([cx - 56, s_y - 20, cx + 56, s_y + 20], fill=(255, 60, 25, 160))
    gdraw.ellipse([cx - 62, s_y - 24, cx + 62, s_y + 24], fill=(255, 70, 30, 200))

    # Pitch Black Singularity Event Horizon Sphere
    r = 22
    draw.ellipse([cx - r, s_y - r, cx + r, s_y + r], fill=(8, 2, 6, 255), outline=(255, 140, 90, 255), width=3)
    # Radiating Gamma-Ray Flares
    for i in range(8):
        ang = math.radians(45 * i)
        draw.line([(cx + r * math.cos(ang), s_y + r * math.sin(ang)), (cx + (r + 16) * math.cos(ang), s_y + (r + 16) * math.sin(ang))], fill=(255, 230, 170, 255), width=2)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_speed_t1(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (250, 195, 25, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Rotary Ammunition Carousel & High-Speed Gear Turbine
    s_y = 94

    # Heavy Brass Rotor Housing (3D Cylinder)
    draw.ellipse([cx - 42, s_y + 10, cx + 42, s_y + 40], fill=(40, 32, 16, 255), outline=(160, 125, 35, 255), width=2)
    draw.rectangle([cx - 42, s_y - 16, cx + 42, s_y + 25], fill=(52, 42, 22, 255))
    draw.ellipse([cx - 42, s_y - 32, cx + 42, s_y - 2], fill=(70, 58, 30, 255), outline=(225, 185, 50, 255), width=3)

    # Golden Clockwork Sprockets & Ammo Belt Linkages
    for i in range(6):
        ang = math.radians(60 * i)
        gx = cx + 28 * math.cos(ang)
        gy = (s_y - 17) + 14 * math.sin(ang)
        draw.ellipse([gx - 7, gy - 7, gx + 7, gy + 7], fill=(255, 205, 45, 255), outline=(255, 245, 150, 255), width=1)

    # Central High-Speed Drive Spindle
    draw.ellipse([cx - 10, s_y - 24, cx + 10, s_y - 10], fill=(255, 255, 255, 255), outline=col, width=2)
    # Spinning Speed Motion Streaks
    gdraw.ellipse([cx - 48, s_y - 38, cx + 48, s_y + 4], outline=(255, 220, 60, 180), width=5)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_speed_t2(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (250, 195, 25, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Cryogenic Cooling Manifold & Liquid Helium Heat Exchanger
    s_y = 92

    # Dual Heavy Cryo Flasks with Glowing Turquoise Coolant Windows
    for sign in [-1, 1]:
        tx = cx + sign * 34
        draw.polygon([(tx - 12, s_y + 24), (tx + 12, s_y + 24), (tx + 12, s_y - 28), (tx - 12, s_y - 28)], fill=(28, 44, 60, 255), outline=(80, 160, 210, 255), width=2)
        # Liquid coolant sight glass
        draw.rectangle([tx - 6, s_y - 18, tx + 6, s_y + 18], fill=(0, 235, 255, 220))
        gdraw.rectangle([tx - 9, s_y - 21, tx + 9, s_y + 21], fill=(0, 240, 255, 140))
        # Flask metal cap
        draw.ellipse([tx - 12, s_y - 32, tx + 12, s_y - 24], fill=(245, 195, 45, 255), outline=(255, 240, 140, 255))

    # Interconnecting Heat Radiator Copper/Gold Fins
    for f in range(-4, 5):
        fy = s_y + f * 5
        draw.line([(cx - 18, fy), (cx + 18, fy)], fill=(245, 195, 45, 255), width=3)

    # Frost crystal sparkles on top
    for fx, fy in [(cx - 12, s_y - 42), (cx + 12, s_y - 40), (cx, s_y - 48)]:
        draw.line([(fx - 4, fy), (fx + 4, fy)], fill=(255, 255, 255, 255), width=2)
        draw.line([(fx, fy - 4), (fx, fy + 4)], fill=(255, 255, 255, 255), width=2)
        gdraw.ellipse([fx - 6, fy - 6, fx + 6, fy + 6], fill=(180, 240, 255, 160))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_speed_t3(out_path):
    size = 256
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = 128
    base_y = 175
    col = (250, 195, 25, 255)

    draw_luxurious_iso_pedestal(draw, gdraw, cx, base_y, col)

    # 2.5D Hyper-Drive Tachyon Reactor & Plasma Lightning Dynamo
    s_y = 88

    # Tilted Golden Torus Ring (Magnetic Acceleration Accelerator)
    draw.ellipse([cx - 58, s_y - 32, cx + 58, s_y + 32], outline=(245, 195, 40, 255), width=4)
    gdraw.ellipse([cx - 62, s_y - 36, cx + 62, s_y + 36], outline=(255, 225, 70, 180), width=9)

    # Counter-Angle Gold Stabilizer Ring
    draw.ellipse([cx - 38, s_y - 44, cx + 38, s_y + 44], outline=(255, 240, 140, 220), width=2)

    # Blazing Tachyon Star (Plasma Fusion Core)
    r = 24
    draw.ellipse([cx - r, s_y - r, cx + r, s_y + r], fill=(255, 235, 110, 255), outline=(255, 255, 255, 255), width=3)
    draw.ellipse([cx - 8, s_y - 14, cx + 8, s_y + 4], fill=(255, 255, 255, 255))
    gdraw.ellipse([cx - 38, s_y - 38, cx + 38, s_y + 38], fill=(255, 215, 40, 220))

    # Golden High-Voltage Lightning Bolts
    pts1 = [(cx - 42, s_y - 12), (cx - 18, s_y - 20), (cx - 6, s_y - 6), (cx + 32, s_y - 28)]
    draw.line(pts1, fill=(255, 255, 255, 255), width=3)
    pts2 = [(cx - 24, s_y + 24), (cx + 6, s_y + 14), (cx + 18, s_y + 26), (cx + 45, s_y + 6)]
    draw.line(pts2, fill=(255, 255, 255, 255), width=3)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved:", out_path)

def create_25d_conduit(col_theme, out_path):
    w = 64
    h = 44
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    gdraw = ImageDraw.Draw(glow)

    cx = w // 2

    # 2.5D Isometric Vertical Pipe
    draw.rectangle([cx - 11, 4, cx + 11, h - 4], fill=(10, 20, 36, 230), outline=(45, 70, 110, 255), width=2)
    # Metallic Collars with Specular Trim
    draw.ellipse([cx - 15, 0, cx + 15, 9], fill=(28, 45, 72, 255), outline=(70, 110, 165, 255), width=2)
    draw.ellipse([cx - 15, h - 9, cx + 15, h], fill=(28, 45, 72, 255), outline=(70, 110, 165, 255), width=2)

    # Glowing Plasma Conduit Core
    draw.rectangle([cx - 4, 6, cx + 4, h - 6], fill=col_theme)
    draw.line([(cx, 6), (cx, h - 6)], fill=(255, 255, 255, 255), width=2)
    gdraw.rectangle([cx - 8, 4, cx + 8, h - 4], fill=(col_theme[0], col_theme[1], col_theme[2], 190))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=4))
    im = Image.alpha_composite(im, glow)
    im.save(out_path, "PNG")
    print("Saved conduit:", out_path)

create_25d_radar_t1(os.path.join(icons_dir, "skill_range_1.png"))
create_25d_laser_t2(os.path.join(icons_dir, "skill_range_2.png"))
create_25d_satellite_t3(os.path.join(icons_dir, "skill_range_3.png"))

create_25d_damage_t1(os.path.join(icons_dir, "skill_dmg_1.png"))
create_25d_damage_t2(os.path.join(icons_dir, "skill_dmg_2.png"))
create_25d_damage_t3(os.path.join(icons_dir, "skill_dmg_3.png"))

create_25d_speed_t1(os.path.join(icons_dir, "skill_spd_1.png"))
create_25d_speed_t2(os.path.join(icons_dir, "skill_spd_2.png"))
create_25d_speed_t3(os.path.join(icons_dir, "skill_spd_3.png"))

create_25d_conduit((0, 235, 255, 255), os.path.join(icons_dir, "conduit_range.png"))
create_25d_conduit((255, 60, 45, 255), os.path.join(icons_dir, "conduit_dmg.png"))
create_25d_conduit((250, 195, 25, 255), os.path.join(icons_dir, "conduit_spd.png"))

print("All enhanced 2.5D Isometric Skill Tree Assets generated successfully!")
