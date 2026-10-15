import cv2
import os
import glob
import numpy as np

def chroma_key(frame):
    h, w = frame.shape[:2]
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Green detection
    green_mask = (hsv[:, :, 0] >= 35) & (hsv[:, :, 0] <= 85) & (hsv[:, :, 1] >= 55) & (hsv[:, :, 2] >= 55)

    # Invert to get character mask
    alpha = np.where(green_mask, 0, 255).astype(np.uint8)

    # Exclude bottom-right corner watermark (Gemini star)
    alpha[int(h * 0.85):, int(w * 0.88):] = 0

    # Exclude soft floor shadow (low saturation, dark, near bottom)
    floor_shadow = (np.arange(h)[:, None] > int(h * 0.78)) & (hsv[:, :, 1] < 35) & (hsv[:, :, 2] < 155)
    alpha[floor_shadow] = 0

    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, kernel)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)

    # Remove small noise islands
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(alpha)
    clean_alpha = np.zeros_like(alpha)
    for l_idx in range(1, num_labels):
        if stats[l_idx, cv2.CC_STAT_AREA] > 600:
            clean_alpha[labels == l_idx] = 255

    # Feather alpha edges
    feathered_alpha = cv2.GaussianBlur(clean_alpha, (3, 3), 0)

    # Despill green reflection on character edges
    b, g, r = cv2.split(frame)
    spill = (feathered_alpha > 0) & (g > np.maximum(r, b))
    g_despill = g.copy()
    g_despill[spill] = np.maximum(r[spill], b[spill])

    return cv2.merge([b, g_despill, r, feathered_alpha])

def extract_animation(video_path, out_dir, prefix, num_frames, start_f, period, canvas_w, canvas_h, target_feet_y, target_center_x, target_char_h, cut_treadmill_y=None, extra_copies=None, reverse_frames=False):
    os.makedirs(out_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)

    sample_indices = [int(round(start_f + i * (period / float(num_frames)))) for i in range(num_frames)]
    if reverse_frames:
        sample_indices.reverse()
    print(f"Extracting {prefix} ({num_frames} frames, reversed={reverse_frames}) from {os.path.basename(video_path)}: frames {sample_indices}")

    for out_idx, f_idx in enumerate(sample_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        ret, frame = cap.read()
        if not ret:
            print(f"Failed to read frame {f_idx}")
            continue

        rgba = chroma_key(frame)

        # If treadmill cut is requested, zero out alpha below treadmill line
        if cut_treadmill_y is not None:
            rgba[cut_treadmill_y:, :, 3] = 0

        alpha = rgba[:, :, 3]
        y_idxs, x_idxs = np.where(alpha > 30)
        if len(y_idxs) == 0:
            print(f"No character in frame {f_idx}")
            continue

        y_min, y_max = y_idxs.min(), y_idxs.max()
        x_min, x_max = x_idxs.min(), x_idxs.max()

        char_h = y_max - y_min + 1
        char_w = x_max - x_min + 1

        char_crop = rgba[y_min:y_max+1, x_min:x_max+1]

        # Scale character to standard height
        scale = float(target_char_h) / float(char_h)
        new_w = int(round(char_w * scale))
        new_h = int(round(char_h * scale))

        resized_char = cv2.resize(char_crop, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # Place onto standard canvas
        canvas = np.zeros((canvas_h, canvas_w, 4), dtype=np.uint8)

        dest_y1 = max(0, target_feet_y - new_h)
        dest_y2 = min(canvas_h, dest_y1 + new_h)
        dest_x1 = max(0, target_center_x - new_w // 2)
        dest_x2 = min(canvas_w, dest_x1 + new_w)

        src_h = dest_y2 - dest_y1
        src_w = dest_x2 - dest_x1

        canvas[dest_y1:dest_y2, dest_x1:dest_x2] = resized_char[:src_h, :src_w]

        # Save primary file
        out_file = os.path.join(out_dir, f"{prefix}_{out_idx:02d}.png")
        is_success, buf = cv2.imencode(".png", canvas)
        if is_success:
            with open(out_file, "wb") as fp:
                fp.write(buf)
        else:
            print(f"Failed to encode {out_file}")

        # Save extra copies if needed (e.g. for backward compatibility)
        if extra_copies:
            for extra_prefix in extra_copies:
                extra_file = os.path.join(out_dir, f"{extra_prefix}_{out_idx:02d}.png")
                with open(extra_file, "wb") as fp:
                    fp.write(buf)

    cap.release()
    print(f"DONE {prefix}: {num_frames} frames saved.")

def main():
    print("=== EXTRACTING MECH WALKER 8-DIRECTION ASSETS ===")
    mech_dir = os.path.abspath(r"games-dev/godot-project/assets/sprites/enemies/mech_walker")

    # 1. NE (Back-Right, North-East) - 1 Boiler (Chuỗi frame tự nhiên bước tiến vào nền)
    v_ne = glob.glob(r"E:\phát\game mobile libraries\videos\quái\01_mech_walker\Steampunk_mech_walking_on_greenc*_20261013215236.mp4")[0]
    extract_animation(v_ne, mech_dir, "walk_ne", 20, 43, 40, 400, 440, 423, 200, 405, extra_copies=["walk_back"], reverse_frames=False)

    # 2. SE (Front-Right, South-East)
    v_se = glob.glob(r"E:\phát\game mobile libraries\videos\quái\01_mech_walker\Steampunk_robot_walking_on_green*_20261013214404.mp4")[0]
    extract_animation(v_se, mech_dir, "walk_se", 20, 36, 29, 400, 440, 423, 200, 405, extra_copies=["walk"])

    # 3. E (East, Side Profile)
    v_e = glob.glob(r"E:\phát\game mobile libraries\videos\quái\01_mech_walker\Steampunk_mech_robot_walking_20261013215427.mp4")[0]
    extract_animation(v_e, mech_dir, "walk_e", 20, 29, 49, 400, 440, 423, 200, 405)

    # 4. S (South, Front)
    v_s = glob.glob(r"E:\phát\game mobile libraries\videos\quái\01_mech_walker\Steampunk_robot_walking_on_green*_20261013214400.mp4")[0]
    extract_animation(v_s, mech_dir, "walk_s", 20, 27, 35, 400, 440, 423, 200, 405)

    # 5. N (North, Back - Chuỗi frame tự nhiên bước tiến vào nền)
    v_n = glob.glob(r"E:\phát\game mobile libraries\videos\quái\01_mech_walker\Steampunk_mech_walking_on_greenc*_20261013215239.mp4")[0]
    extract_animation(v_n, mech_dir, "walk_n", 20, 38, 35, 400, 440, 423, 200, 405, reverse_frames=False)

    print("\n=== EXTRACTING STEAM TRAIN 8-DIRECTION ASSETS ===")
    train_dir = os.path.abspath(r"games-dev/godot-project/assets/sprites/enemies/steam_train")

    # 1. SE (Front-Right, South-East) - cut treadmill at 575
    v_train_se = glob.glob(r"E:\phát\game mobile libraries\videos\quái\02_steam_train\Cartoon_steam_locomotive_driving*_20261013220119.mp4")[0]
    extract_animation(v_train_se, train_dir, "train_se", 24, 48, 30, 480, 432, 431, 240, 415, cut_treadmill_y=575)

    # 2. E (East, Side Profile)
    v_train_e = glob.glob(r"E:\phát\game mobile libraries\videos\quái\02_steam_train\Cartoon_steam_locomotive_driving*_20261013221513.mp4")[0]
    extract_animation(v_train_e, train_dir, "train_e", 24, 46, 31, 480, 432, 431, 240, 415, extra_copies=["train"])

    # 3. NE (Back-Right, North-East)
    v_train_ne = glob.glob(r"E:\phát\game mobile libraries\videos\quái\02_steam_train\Train_monster_driving_on_green_20261013220414.mp4")[0]
    extract_animation(v_train_ne, train_dir, "train_ne", 24, 33, 14, 480, 432, 431, 240, 415)

    print("\nALL 8-DIRECTION MONSTER ASSETS EXTRACTED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
