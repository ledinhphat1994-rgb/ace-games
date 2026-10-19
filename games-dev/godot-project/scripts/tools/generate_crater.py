import cv2
import numpy as np

size = 256
img = np.zeros((size, size, 4), dtype=np.uint8)
center = (size // 2, size // 2)

# Charred black ground scorch with cracked fiery embers
np.random.seed(42)
for y in range(size):
    for x in range(size):
        dx = (x - center[0])
        dy = (y - center[1]) * 1.8 # Isometric oval
        dist = np.sqrt(dx*dx + dy*dy)
        if dist < 110:
            noise = np.random.uniform(0.7, 1.3)
            effective_dist = dist * noise
            if effective_dist < 95:
                alpha = int(180 * (1.0 - effective_dist / 95.0))
                # Dark ash / char color
                img[y, x] = [15, 18, 22, alpha]
                # Center red/orange smoldering crack
                if effective_dist < 40 and np.random.rand() > 0.65:
                    img[y, x] = [20, 80, 240, int(alpha * 0.9)]

# Blur slightly
img = cv2.GaussianBlur(img, (5, 5), 0)

out_path = "games-dev/godot-project/assets/textures/fx/scorch_crater.png"
_, buf = cv2.imencode(".png", img)
with open(out_path, "wb") as f:
    f.write(buf.tobytes())

print("scorch_crater.png created!")
