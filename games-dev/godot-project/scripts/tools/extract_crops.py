import cv2
import os
import numpy as np

def write_img(rel_path, img):
    ext = os.path.splitext(rel_path)[1]
    _, buf = cv2.imencode(ext, img)
    with open(rel_path, "wb") as f:
        f.write(buf.tobytes())

video_rel = "game mobile libraries/videos/others/gemini_generated_video_d8bb17a2.mp4"
out_dir = "games-dev/godot-project/assets/extracted_video_frames"
os.makedirs(out_dir, exist_ok=True)
crops_dir = os.path.join(out_dir, "crops")
os.makedirs(crops_dir, exist_ok=True)

cap = cv2.VideoCapture(video_rel)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print("Opened video. Total frames:", total_frames)

# Read Frame 0
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ret, f0 = cap.read()
if ret:
    write_img(os.path.join(out_dir, "frame_000.png"), f0)
    print("Saved frame_000.png:", f0.shape)

    # 1. Health Bar with chains:
    # In frame 0: center x is 640. Health bar is roughly from x=490 to 790, y=0 to 95
    health_crop = f0[0:95, 490:790]
    write_img(os.path.join(crops_dir, "health_bar_chains.png"), health_crop)

    # 2. Wave & Gold Crest:
    # Top right: x=960 to 1270, y=5 to 135
    wave_crop = f0[5:135, 960:1270]
    write_img(os.path.join(crops_dir, "wave_gold_crest.png"), wave_crop)

    # 3. Bottom command dock (all 5 cards together):
    # From y=500 to 715, x=135 to 1145
    bottom_crop = f0[500:715, 135:1145]
    write_img(os.path.join(crops_dir, "bottom_command_dock.png"), bottom_crop)

    # 4. Each of the 5 cards:
    # 5 cards spanning across x=150 to 1130
    # Card 1: MUA TRỤ
    # Card 2: KỸ NĂNG
    # Card 3: PHÉP THUẬT
    # Card 4: GỌI ĐỢT
    # Card 5: BẪY CẦU
    card_boxes = [
        ("card_buy_tower", 155, 335),
        ("card_skill", 355, 535),
        ("card_spell", 555, 735),
        ("card_next_wave", 755, 935),
        ("card_bridge_emp", 955, 1135),
    ]
    for name, x1, x2 in card_boxes:
        card_img = f0[510:715, x1:x2]
        write_img(os.path.join(crops_dir, f"{name}.png"), card_img)
        print(f"Saved {name}: {card_img.shape}")

# Frame 65: Magic Circle
cap.set(cv2.CAP_PROP_POS_FRAMES, 65)
ret, f65 = cap.read()
if ret:
    write_img(os.path.join(out_dir, "frame_065.png"), f65)
    # Magic circle is in the middle of the road: y=380 to 560, x=510 to 740
    circle_crop = f65[380:560, 510:740]
    write_img(os.path.join(crops_dir, "magic_circle.png"), circle_crop)
    print("Saved magic_circle:", circle_crop.shape)

# Frame 85: Meteor Strike Impact / Blast
cap.set(cv2.CAP_PROP_POS_FRAMES, 85)
ret, f85 = cap.read()
if ret:
    write_img(os.path.join(out_dir, "frame_085.png"), f85)
    blast_crop = f85[350:570, 480:780]
    write_img(os.path.join(crops_dir, "meteor_blast.png"), blast_crop)
    print("Saved meteor_blast:", blast_crop.shape)

# Frame 180: Watchtower firing fireballs
cap.set(cv2.CAP_PROP_POS_FRAMES, 180)
ret, f180 = cap.read()
if ret:
    write_img(os.path.join(out_dir, "frame_180.png"), f180)
    tower_crop = f180[190:480, 620:840]
    write_img(os.path.join(crops_dir, "watchtower_fire.png"), tower_crop)
    print("Saved watchtower_fire:", tower_crop.shape)

cap.release()
print("All frames and crops processed successfully!")
