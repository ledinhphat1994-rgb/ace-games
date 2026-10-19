import math
import numpy as np
import cv2
import os

size = 512
img = np.zeros((size, size, 4), dtype=np.uint8)
center = (size // 2, size // 2)

# Color: golden yellow with bright white core
gold_bgr = (40, 215, 255) # BGR
white_bgr = (200, 245, 255)

# Outer glow
for r in range(235, 255):
    alpha = int(45 * (1.0 - (r - 235) / 20.0))
    cv2.circle(img, center, r, (gold_bgr[0], gold_bgr[1], gold_bgr[2], alpha), 2)

# Outer main thick ring
cv2.circle(img, center, 235, (gold_bgr[0], gold_bgr[1], gold_bgr[2], 255), 4)
cv2.circle(img, center, 230, (gold_bgr[0], gold_bgr[1], gold_bgr[2], 180), 1)

# Inner rune ring
cv2.circle(img, center, 185, (gold_bgr[0], gold_bgr[1], gold_bgr[2], 255), 3)

# Runes / tick marks between outer and inner ring (24 sectors)
for i in range(24):
    angle = i * (2 * math.pi / 24)
    x1 = int(center[0] + 190 * math.cos(angle))
    y1 = int(center[1] + 190 * math.sin(angle))
    x2 = int(center[0] + 225 * math.cos(angle))
    y2 = int(center[1] + 225 * math.sin(angle))
    cv2.line(img, (x1, y1), (x2, y2), (gold_bgr[0], gold_bgr[1], gold_bgr[2], 200), 2)

    # Sacred glyph mark in between ticks
    mid_angle = angle + (math.pi / 24)
    mx = int(center[0] + 208 * math.cos(mid_angle))
    my = int(center[1] + 208 * math.sin(mid_angle))
    cv2.circle(img, (mx, my), 5, (white_bgr[0], white_bgr[1], white_bgr[2], 230), -1)

# Middle geometric star / diamond
cv2.circle(img, center, 150, (gold_bgr[0], gold_bgr[1], gold_bgr[2], 200), 2)

# 8-pointed overlapping arc star (Sacred Geometry)
num_points = 8
pts_star = []
for i in range(num_points * 2):
    r = 150 if i % 2 == 0 else 75
    ang = i * (math.pi / num_points)
    px = int(center[0] + r * math.cos(ang))
    py = int(center[1] + r * math.sin(ang))
    pts_star.append([px, py])
cv2.polylines(img, [np.array(pts_star, dtype=np.int32)], True, (gold_bgr[0], gold_bgr[1], gold_bgr[2], 255), 3)

# Inner sanctum ring
cv2.circle(img, center, 75, (gold_bgr[0], gold_bgr[1], gold_bgr[2], 255), 2)
cv2.circle(img, center, 45, (white_bgr[0], white_bgr[1], white_bgr[2], 255), 2)

# Center celestial diamond
pts_diamond = [
    [center[0], center[1] - 35],
    [center[0] + 35, center[1]],
    [center[0], center[1] + 35],
    [center[0] - 35, center[1]]
]
cv2.polylines(img, [np.array(pts_diamond, dtype=np.int32)], True, (white_bgr[0], white_bgr[1], white_bgr[2], 255), 3)
cv2.circle(img, center, 12, (255, 255, 255, 255), -1)

# Slight bloom blur
glow_layer = cv2.GaussianBlur(img, (7, 7), 0)
final_img = cv2.addWeighted(img, 0.75, glow_layer, 0.55, 0)

out_path = "games-dev/godot-project/assets/textures/fx/arcane_magic_circle_512.png"
_, buf = cv2.imencode(".png", final_img)
with open(out_path, "wb") as f:
    f.write(buf.tobytes())

print("arcane_magic_circle_512.png created!")
