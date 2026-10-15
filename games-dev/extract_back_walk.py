import cv2
import os
import glob
import numpy as np

# Find input video
search_pattern = os.path.join(r"E:\phát\game mobile libraries\videos\quái\01_mech_walker", "*20261013*.mp4")
files = sorted(glob.glob(search_pattern))
if not files:
    raise FileNotFoundError("Could not find new video in E:\\phát\\game mobile libraries\\videos\\quái\\01_mech_walker")

src_video = files[0]
print(f"Reading from: {src_video}")

out_dir = os.path.abspath(r"games-dev/godot-project/assets/sprites/enemies/mech_walker")
os.makedirs(out_dir, exist_ok=True)

cap = cv2.VideoCapture(src_video)
fps = cap.get(cv2.CAP_PROP_FPS)

# Cycle from frame 41 to frame 72 (31 frames period)
start_frame = 41
cycle_len = 31
num_out = 20

sample_indices = [int(round(start_frame + i * (cycle_len / float(num_out)))) for i in range(num_out)]
print("Sample indices:", sample_indices)

CANVAS_H = 440
CANVAS_W = 400
TARGET_FEET_Y = 423
TARGET_CENTER_X = 200

bg_color = np.array([125.0, 125.0, 125.0])

for out_idx, f_idx in enumerate(sample_indices):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if not ret:
        print(f"Failed to read frame {f_idx}")
        continue

    h, w = frame.shape[:2]
    diff = np.linalg.norm(frame.astype(float) - bg_color, axis=2)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]

    mask = np.zeros((h, w), dtype=np.uint8)
    mask[diff > 25] = 255
    mask[sat > 20] = 255

    # Exclude floor shadow and corner star watermark
    shadow = (np.arange(h)[:, None] > 560) & (sat < 16) & (val < 135)
    mask[shadow] = 0
    mask[:, 1120:] = 0

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # Filter small noise
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
    clean_mask = np.zeros_like(mask)
    for l_idx in range(1, num_labels):
        if stats[l_idx, cv2.CC_STAT_AREA] > 800:
            clean_mask[labels == l_idx] = 255

    # Feather edges
    feathered = cv2.GaussianBlur(clean_mask, (3, 3), 0)

    # RGBA
    b, g, r = cv2.split(frame)
    rgba = cv2.merge([b, g, r, feathered])

    # Crop to character bounding box
    y_idxs, x_idxs = np.where(clean_mask > 30)
    if len(y_idxs) == 0:
        continue

    y_min, y_max = y_idxs.min(), y_idxs.max()
    x_min, x_max = x_idxs.min(), x_idxs.max()

    char_h = y_max - y_min + 1
    char_w = x_max - x_min + 1

    char_rgba = rgba[y_min:y_max+1, x_min:x_max+1]

    # Scale to match roughly 400px height (same scale as front mech)
    target_scale = 405.0 / float(char_h)
    new_w = int(round(char_w * target_scale))
    new_h = int(round(char_h * target_scale))

    resized_char = cv2.resize(char_rgba, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

    # Place on 440x400 canvas
    canvas = np.zeros((CANVAS_H, CANVAS_W, 4), dtype=np.uint8)

    # Position so feet touch TARGET_FEET_Y and center is TARGET_CENTER_X
    dest_y1 = max(0, TARGET_FEET_Y - new_h)
    dest_y2 = min(CANVAS_H, dest_y1 + new_h)

    dest_x1 = max(0, TARGET_CENTER_X - new_w // 2)
    dest_x2 = min(CANVAS_W, dest_x1 + new_w)

    src_h = dest_y2 - dest_y1
    src_w = dest_x2 - dest_x1

    canvas[dest_y1:dest_y2, dest_x1:dest_x2] = resized_char[:src_h, :src_w]

    out_file = os.path.join(out_dir, f"walk_back_{out_idx:02d}.png")
    is_success, buf = cv2.imencode(".png", canvas)
    if is_success:
        with open(out_file, "wb") as fp:
            fp.write(buf)
        print(f"Extracted frame {out_idx:02d} -> {out_file}")
    else:
        print(f"Failed to encode frame {out_idx:02d}")

cap.release()
print("SUCCESS: All 20 rear walk frames extracted and calibrated!")
