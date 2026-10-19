import cv2
import os
import numpy as np

out_dir = "games-dev/godot-project/assets/textures/cards/video_style"

def read_img(rel_path):
    with open(rel_path, "rb") as f:
        buf = np.frombuffer(f.read(), dtype=np.uint8)
        return cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)

def write_img(rel_path, img):
    ext = os.path.splitext(rel_path)[1]
    _, buf = cv2.imencode(ext, img)
    with open(rel_path, "wb") as f:
        f.write(buf.tobytes())

# For each card, we create a clean RGBA image
cards = ["card_buy_tower", "card_skill", "card_spell", "card_next_wave", "card_bridge_emp"]

for idx, name in enumerate(cards):
    raw_path = os.path.join(out_dir, f"{name}_raw.png")
    img = read_img(raw_path)
    h, w, _ = img.shape

    # Create mask for card
    mask = np.zeros((h, w), dtype=np.uint8)

    # Card polygon coordinates:
    # Based on card tilt:
    # Card 0 (Buy Tower): tilted left ~ 4 deg
    # Card 1 (Skill): tilted left ~ 2 deg
    # Card 2 (Spell): upright
    # Card 3 (Wave): tilted right ~ 2 deg
    # Card 4 (Bridge EMP): tilted right ~ 4 deg

    if idx == 0:
        # Tilt left: top is shifted left
        pts = np.array([
            [12, 45], [20, 20], [45, 12], [145, 16], [162, 35],
            [155, 200], [145, 212], [30, 212], [18, 200]
        ], dtype=np.int32)
        # Gem circle at top left
        cv2.circle(mask, (32, 35), 26, 255, -1)
        cv2.fillPoly(mask, [pts], 255)
    elif idx == 1:
        pts = np.array([
            [8, 42], [18, 18], [42, 12], [148, 14], [164, 32],
            [158, 200], [148, 212], [26, 212], [16, 200]
        ], dtype=np.int32)
        cv2.circle(mask, (30, 32), 26, 255, -1)
        cv2.fillPoly(mask, [pts], 255)
    elif idx == 2:
        # Upright
        pts = np.array([
            [6, 40], [16, 16], [40, 10], [148, 10], [165, 28],
            [165, 198], [152, 212], [18, 212], [6, 198]
        ], dtype=np.int32)
        cv2.circle(mask, (28, 30), 26, 255, -1)
        cv2.fillPoly(mask, [pts], 255)
    elif idx == 3:
        # Tilt right
        pts = np.array([
            [10, 42], [20, 18], [44, 12], [150, 14], [164, 32],
            [164, 198], [152, 212], [22, 212], [10, 198]
        ], dtype=np.int32)
        cv2.circle(mask, (32, 32), 26, 255, -1)
        cv2.fillPoly(mask, [pts], 255)
    elif idx == 4:
        # Tilt right
        pts = np.array([
            [12, 45], [22, 20], [48, 14], [152, 16], [164, 35],
            [164, 198], [150, 212], [24, 212], [12, 198]
        ], dtype=np.int32)
        cv2.circle(mask, (34, 35), 26, 255, -1)
        cv2.fillPoly(mask, [pts], 255)

    # Smooth edges with slight blur
    mask = cv2.GaussianBlur(mask, (3, 3), 0)

    # Merge RGBA
    b, g, r = cv2.split(img)
    rgba = cv2.merge([b, g, r, mask])

    out_card_path = os.path.join(out_dir, f"{name}.png")
    write_img(out_card_path, rgba)

    # Also generate a glowing active / hover card
    glow = cv2.merge([
        np.clip(b.astype(int) + 30, 0, 255).astype(np.uint8),
        np.clip(g.astype(int) + 40, 0, 255).astype(np.uint8),
        np.clip(r.astype(int) + 50, 0, 255).astype(np.uint8),
        mask
    ])
    write_img(os.path.join(out_dir, f"{name}_active.png"), glow)
    print(f"Created clean RGBA {name}.png and {name}_active.png")

print("All 5 clean RGBA cards created successfully!")
