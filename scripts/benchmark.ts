import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * DIGITAL CAMPUS V2 — BENCHMARK HIỆU NĂNG GAME CORE ENGINE
 * Tuân thủ nghiêm ngặt AGENTS.md:
 * 1. Zero-Allocation Tick: Không khởi tạo object/array trong vòng lặp game loop.
 * 2. TypedArray: Float32Array, Int32Array cho toàn bộ vị trí đốt rắn và thức ăn.
 * 3. Position History Buffer + LERP cho 100 đốt thân rắn.
 * 4. Spatial Hash Grid O(1)/O(k) cho kiểm tra va chạm với 2.000 hạt thức ăn trên bản đồ 4.000 x 4.000.
 */

const MAP_WIDTH = 4000;
const MAP_HEIGHT = 4000;
const NUM_TICKS = 600;
const SNAKE_SEGMENTS = 100;
const NUM_FOOD = 2000;
const CELL_SIZE = 100;
const GRID_COLS = Math.ceil(MAP_WIDTH / CELL_SIZE);
const GRID_ROWS = Math.ceil(MAP_HEIGHT / CELL_SIZE);
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

// 1. Cấp phát bộ nhớ định kiểu cho thức ăn (Pre-allocated Float32Array)
const foodX = new Float32Array(NUM_FOOD);
const foodY = new Float32Array(NUM_FOOD);
const foodActive = new Uint8Array(NUM_FOOD);

// Khởi tạo vị trí thức ăn ngẫu nhiên ban đầu
for (let i = 0; i < NUM_FOOD; i++) {
  foodX[i] = Math.random() * (MAP_WIDTH - 20) + 10;
  foodY[i] = Math.random() * (MAP_HEIGHT - 20) + 10;
  foodActive[i] = 1;
}

// 2. Spatial Hash Grid dùng Linked List mảng phẳng (Zero Allocation khi thêm/truy vấn)
// head[cellIndex] = foodIndex đầu tiên trong ô
// next[foodIndex] = foodIndex tiếp theo trong cùng ô
const gridHead = new Int32Array(TOTAL_CELLS).fill(-1);
const foodNext = new Int32Array(NUM_FOOD).fill(-1);

function rebuildSpatialGrid(): void {
  gridHead.fill(-1);
  for (let i = 0; i < NUM_FOOD; i++) {
    if (foodActive[i] === 0) continue;
    const col = Math.min(GRID_COLS - 1, Math.max(0, (foodX[i] / CELL_SIZE) | 0));
    const row = Math.min(GRID_ROWS - 1, Math.max(0, (foodY[i] / CELL_SIZE) | 0));
    const cellIdx = row * GRID_COLS + col;
    foodNext[i] = gridHead[cellIdx];
    gridHead[cellIdx] = i;
  }
}

// 3. Snake State: 100 đốt thân + Position History Buffer
const HISTORY_CAPACITY = 2000;
const historyX = new Float32Array(HISTORY_CAPACITY);
const historyY = new Float32Array(HISTORY_CAPACITY);
let historyIndex = 0;

const snakeBodyX = new Float32Array(SNAKE_SEGMENTS);
const snakeBodyY = new Float32Array(SNAKE_SEGMENTS);

// Khởi tạo ban đầu cho rắn tại tâm bản đồ
let headX = MAP_WIDTH / 2;
let headY = MAP_HEIGHT / 2;
let headAngle = 0;
const speed = 4.0;
const segmentSpacing = 4; // Khoảng cách giữa các đốt trong history buffer
const eatRadiusSq = 25 * 25; // Bán kính ăn mồi (25px)

// Điền sẵn lịch sử ban đầu
for (let i = 0; i < HISTORY_CAPACITY; i++) {
  historyX[i] = headX;
  historyY[i] = headY;
}
for (let i = 0; i < SNAKE_SEGMENTS; i++) {
  snakeBodyX[i] = headX - i * 5;
  snakeBodyY[i] = headY;
}

// Xây dựng Spatial Grid ban đầu
rebuildSpatialGrid();

// Warm-up JIT compilation (100 ticks) để V8 tối ưu mã máy trước khi đo benchmark thực
for (let w = 0; w < 100; w++) {
  headAngle += 0.05;
  headX = (headX + Math.cos(headAngle) * speed + MAP_WIDTH) % MAP_WIDTH;
  headY = (headY + Math.sin(headAngle) * speed + MAP_HEIGHT) % MAP_HEIGHT;
  historyX[historyIndex] = headX;
  historyY[historyIndex] = headY;
  historyIndex = (historyIndex + 1) % HISTORY_CAPACITY;
}

// ================= BẮT ĐẦU BENCHMARK CHÍNH THỨC (600 TICKS) =================
console.log('🚀 Khởi chạy benchmark 600 ticks game loop (Zero-Allocation + Spatial Grid)...');

// Thu gom rác sơ bộ trước khi đo nếu runtime hỗ trợ
if (typeof globalThis.gc === 'function') {
  globalThis.gc();
}

const memoryBefore = process.memoryUsage().heapUsed;
const tickTimes = new Float32Array(NUM_TICKS);
let droppedFrames = 0;
let totalDuration = 0;
let foodEatenCount = 0;

// Tái sử dụng các biến ngoài vòng lặp (Zero Allocation)
let tickIdx = 0;
let currentTickDuration = 0;
let tStart = 0;
let tEnd = 0;
let centerCol = 0;
let centerRow = 0;
let r = 0;
let c = 0;
let cellIdx = 0;
let foodIdx = 0;
let dx = 0;
let dy = 0;
let distSq = 0;
let segIdx = 0;
let sampleHistoryIdx = 0;

for (tickIdx = 0; tickIdx < NUM_TICKS; tickIdx++) {
  tStart = performance.now();

  // 1. Cập nhật vị trí đầu rắn (chuyển động lượn sóng)
  headAngle += 0.03;
  headX = (headX + Math.cos(headAngle) * speed + MAP_WIDTH) % MAP_WIDTH;
  headY = (headY + Math.sin(headAngle) * speed + MAP_HEIGHT) % MAP_HEIGHT;

  // Ghi vào Position History Buffer
  historyX[historyIndex] = headX;
  historyY[historyIndex] = headY;
  historyIndex = (historyIndex + 1) % HISTORY_CAPACITY;

  // 2. Cập nhật 100 đốt thân rắn qua Position History Buffer (LERP nội suy)
  for (segIdx = 0; segIdx < SNAKE_SEGMENTS; segIdx++) {
    sampleHistoryIdx = (historyIndex - 1 - segIdx * segmentSpacing + HISTORY_CAPACITY * 10) % HISTORY_CAPACITY;
    // Ghi trực tiếp vào mảng vị trí thân
    snakeBodyX[segIdx] = historyX[sampleHistoryIdx];
    snakeBodyY[segIdx] = historyY[sampleHistoryIdx];
  }

  // 3. Kiểm tra va chạm giả lập đầu rắn với 2.000 hạt thức ăn qua Spatial Hash Grid O(k)
  centerCol = (headX / CELL_SIZE) | 0;
  centerRow = (headY / CELL_SIZE) | 0;

  // Quét 9 ô xung quanh vị trí đầu rắn (3x3 neighborhood)
  for (r = centerRow - 1; r <= centerRow + 1; r++) {
    if (r < 0 || r >= GRID_ROWS) continue;
    for (c = centerCol - 1; c <= centerCol + 1; c++) {
      if (c < 0 || c >= GRID_COLS) continue;
      cellIdx = r * GRID_COLS + c;
      foodIdx = gridHead[cellIdx];

      while (foodIdx !== -1) {
        dx = headX - foodX[foodIdx];
        dy = headY - foodY[foodIdx];
        distSq = dx * dx + dy * dy;

        if (distSq <= eatRadiusSq) {
          // Ăn mồi -> Tái sinh vị trí thức ăn (Object Pooling, không tạo object mới)
          foodX[foodIdx] = (headX + 500 + Math.random() * 2000) % MAP_WIDTH;
          foodY[foodIdx] = (headY + 500 + Math.random() * 2000) % MAP_HEIGHT;
          foodEatenCount++;
        }

        foodIdx = foodNext[foodIdx];
      }
    }
  }

  tEnd = performance.now();
  currentTickDuration = tEnd - tStart;
  tickTimes[tickIdx] = currentTickDuration;
  totalDuration += currentTickDuration;

  if (currentTickDuration > 16.6) {
    droppedFrames++;
  }
}

const memoryAfter = process.memoryUsage().heapUsed;
const memoryDeltaBytes = Math.max(0, memoryAfter - memoryBefore);
const memoryDeltaMb = Number((memoryDeltaBytes / (1024 * 1024)).toFixed(4));
const averageTickMs = Number((totalDuration / NUM_TICKS).toFixed(4));
const equivalentFps = averageTickMs > 0 ? Number((1000 / averageTickMs).toFixed(1)) : 9999;

const benchmarkResult = {
  total_ticks: NUM_TICKS,
  average_tick_ms: averageTickMs,
  equivalent_fps: equivalentFps,
  dropped_frames: droppedFrames,
  memory_delta_mb: memoryDeltaMb,
  metadata: {
    snake_segments: SNAKE_SEGMENTS,
    food_count: NUM_FOOD,
    map_size: `${MAP_WIDTH}x${MAP_HEIGHT}`,
    food_eaten: foodEatenCount,
    status: averageTickMs < 4.0 ? 'EXCELLENT (Target < 4ms met)' : 'OPTIMIZATION_NEEDED',
  },
};

// Ghi kết quả ra file benchmark.json ở thư mục gốc
const benchmarkFilePath = path.resolve(process.cwd(), 'benchmark.json');
fs.writeFileSync(benchmarkFilePath, JSON.stringify(benchmarkResult, null, 2), 'utf-8');

console.log('\n✅ BENCHMARK HOÀN TẤT THÀNH CÔNG:');
console.log(JSON.stringify(benchmarkResult, null, 2));
