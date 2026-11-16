import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Bomb, 
  ShoppingBag,
  ArrowRight,
  Clock
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'timed' | 'endless';

type ItemType = 
  | 'gold_small' 
  | 'gold_med' 
  | 'gold_large' 
  | 'diamond' 
  | 'rock_small' 
  | 'rock_large' 
  | 'mystery_bag' 
  | 'tnt'
  | 'pig_diamond';

interface MineItem {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  radius: number;
  value: number;
  weight: number; // 0.5 (rất nhẹ) đến 5.5 (rất nặng)
  isAlive: boolean;
  rotation: number;
  vx?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

// Cấu hình kích thước Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const WINCH_X = CANVAS_WIDTH / 2; // 480px
const WINCH_Y = 60; // Điểm xuất phát của cáp tời trên xe thợ mỏ
const BASE_HOOK_LEN = 38;
const MAX_SWING_ANGLE = 1.25; // ~72 độ

// Mục tiêu vàng theo từng cấp độ
const LEVEL_TARGETS = [
  650,   // Màn 1
  1400,  // Màn 2
  2300,  // Màn 3
  3400,  // Màn 4
  4700,  // Màn 5
  6200,  // Màn 6
  7900,  // Màn 7
  9800,  // Màn 8
  12000, // Màn 9
  15000, // Màn 10
];

// --- CÁC HÀM VẼ ĐỒ HỌA CAO CẤP TRÊN CANVAS ---

// 1. Vẽ quặng vàng giác cạnh 3D lấp lánh
function drawGoldNugget(
  ctx: CanvasRenderingContext2D,
  radius: number,
  type: 'gold_small' | 'gold_med' | 'gold_large',
  time: number,
  seed: number
) {
  ctx.save();
  // Hiệu ứng ánh hào quang vàng kim
  ctx.shadowColor = 'rgba(245, 158, 11, 0.55)';
  ctx.shadowBlur = radius * 0.7;

  // Gradient khối vàng đa lớp sáng bóng
  const goldGrad = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 1, 0, 0, radius * 1.05);
  goldGrad.addColorStop(0, '#ffffff');
  goldGrad.addColorStop(0.2, '#fef08a');
  goldGrad.addColorStop(0.55, '#f59e0b');
  goldGrad.addColorStop(0.85, '#d97706');
  goldGrad.addColorStop(1, '#78350f');

  ctx.fillStyle = goldGrad;
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;

  // Tạo đa giác giác cạnh tự nhiên (8 cạnh cho vàng lớn, 7 cạnh cho vàng vừa, 6 cạnh cho vàng nhỏ)
  const sides = type === 'gold_large' ? 8 : type === 'gold_med' ? 7 : 6;
  const vertices: { x: number; y: number }[] = [];
  for (let s = 0; s < sides; s++) {
    const a = (Math.PI * 2 * s) / sides;
    const rVar = 0.82 + Math.sin(s * 2.3 + seed) * 0.18;
    const r = radius * rVar;
    vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  ctx.beginPath();
  vertices.forEach((v, idx) => {
    if (idx === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vẽ các đường giác cắt 3D bên trong
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  vertices.forEach((v) => {
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(-radius * 0.15, -radius * 0.15);
  });
  ctx.stroke();

  // Điểm lóa sáng kim loại Specular Shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(-radius * 0.32, -radius * 0.32, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Ngôi sao lấp lánh (Twinkle Star) xoay nhẹ theo thời gian
  const twinklePhase = Math.sin(time * 0.003 + seed * 5);
  if (twinklePhase > 0.4) {
    const starAlpha = (twinklePhase - 0.4) / 0.6;
    ctx.save();
    ctx.translate(radius * 0.35, -radius * 0.25);
    ctx.rotate(time * 0.002);
    ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    const sLen = radius * 0.45 * starAlpha;
    const sThick = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -sLen);
    ctx.quadraticCurveTo(sThick, 0, sLen, 0);
    ctx.quadraticCurveTo(sThick, sThick, 0, sLen);
    ctx.quadraticCurveTo(-sThick, sThick, -sLen, 0);
    ctx.quadraticCurveTo(-sThick, 0, 0, -sLen);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// 2. Vẽ kim cương tinh thể xanh pha lê phát quang
function drawDiamond(ctx: CanvasRenderingContext2D, radius: number, time: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(6, 182, 212, 0.9)';
  ctx.shadowBlur = 16;

  // Thân kim cương đa giác cắt giác
  const dGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  dGrad.addColorStop(0, '#ffffff');
  dGrad.addColorStop(0.35, '#cffafe');
  dGrad.addColorStop(0.7, '#38bdf8');
  dGrad.addColorStop(1, '#0284c7');

  ctx.fillStyle = dGrad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;

  // Hình cắt 8 góc kim cương
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.15);
  ctx.lineTo(radius * 0.9, -radius * 0.3);
  ctx.lineTo(radius * 0.8, radius * 0.6);
  ctx.lineTo(0, radius * 1.15);
  ctx.lineTo(-radius * 0.8, radius * 0.6);
  ctx.lineTo(-radius * 0.9, -radius * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mặt bàn và giác cắt phản quang bên trong
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.7);
  ctx.lineTo(radius * 0.45, -radius * 0.15);
  ctx.lineTo(0, radius * 0.4);
  ctx.lineTo(-radius * 0.45, -radius * 0.15);
  ctx.closePath();
  ctx.fill();

  // Ngôi sao lấp lánh phát sáng mạnh
  const sLen = 7 + Math.sin(time * 0.005) * 3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.6 - sLen);
  ctx.lineTo(1.5, -radius * 0.6);
  ctx.lineTo(sLen, -radius * 0.6);
  ctx.lineTo(1.5, -radius * 0.6 + 1.5);
  ctx.lineTo(0, -radius * 0.6 + sLen);
  ctx.lineTo(-1.5, -radius * 0.6 + 1.5);
  ctx.lineTo(-sLen, -radius * 0.6);
  ctx.lineTo(-1.5, -radius * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 3. Vẽ đá cuội / đá tảng hoa cương gồ ghề
function drawRock(ctx: CanvasRenderingContext2D, radius: number, seed: number) {
  ctx.save();
  const rockGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, 1, 0, 0, radius * 1.1);
  rockGrad.addColorStop(0, '#cbd5e1');
  rockGrad.addColorStop(0.3, '#94a3b8');
  rockGrad.addColorStop(0.7, '#475569');
  rockGrad.addColorStop(1, '#1e293b');

  ctx.fillStyle = rockGrad;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;

  const sides = 7;
  const vertices: { x: number; y: number }[] = [];
  for (let s = 0; s < sides; s++) {
    const a = (Math.PI * 2 * s) / sides;
    const r = radius * (0.8 + Math.sin(s * 3.1 + seed) * 0.2);
    vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  ctx.beginPath();
  vertices.forEach((v, idx) => {
    if (idx === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vết rạn nứt trên đá
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.3, -radius * 0.2);
  ctx.lineTo(-radius * 0.05, 0);
  ctx.lineTo(radius * 0.25, -radius * 0.1);
  ctx.lineTo(radius * 0.4, radius * 0.25);
  ctx.stroke();

  // Rêu xanh bám trên đỉnh đá
  ctx.fillStyle = 'rgba(101, 163, 13, 0.4)';
  ctx.beginPath();
  ctx.arc(-radius * 0.2, -radius * 0.4, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 4. Vẽ thùng thuốc nổ TNT thùng gỗ sọc nguy hiểm
function drawTNT(ctx: CanvasRenderingContext2D, radius: number, time: number) {
  ctx.save();
  const w = radius * 1.6;
  const h = radius * 1.7;

  // Gradient thùng gỗ đỏ
  const tntGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  tntGrad.addColorStop(0, '#991b1b');
  tntGrad.addColorStop(0.2, '#dc2626');
  tntGrad.addColorStop(0.5, '#ef4444');
  tntGrad.addColorStop(0.8, '#dc2626');
  tntGrad.addColorStop(1, '#991b1b');

  ctx.fillStyle = tntGrad;
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // Vành đai thép đen có đinh tán
  ctx.fillStyle = '#334155';
  ctx.fillRect(-w / 2, -h / 2 + 3, w, 4);
  ctx.fillRect(-w / 2, h / 2 - 7, w, 4);

  // Dải băng sọc vàng đen cảnh báo nguy hiểm ở giữa
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w / 2, -h * 0.22, w, h * 0.44);
  ctx.clip();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-w / 2, -h * 0.22, w, h * 0.44);

  // Sọc đen chéo
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  for (let sx = -w; sx < w * 2; sx += 8) {
    ctx.beginPath();
    ctx.moveTo(sx, -h * 0.25);
    ctx.lineTo(sx + 10, h * 0.25);
    ctx.stroke();
  }
  ctx.restore();

  // Biển chữ TNT nổi bật
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 4;
  ctx.fillText('TNT', 0, 0);

  // Dây ngòi nổ cong ở phía trên với tàn lửa cháy đỏ
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.quadraticCurveTo(6, -h / 2 - 8, 3, -h / 2 - 12);
  ctx.stroke();

  // Tàn lửa ngòi nổ cháy lập lòe
  const sparkY = -h / 2 - 12;
  const sparkX = 3;
  const sparkSize = 3 + Math.sin(time * 0.02) * 1.5;
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 5. Vẽ túi bí ẩn bao bố có quai buộc
function drawMysteryBag(ctx: CanvasRenderingContext2D, radius: number, time: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
  ctx.shadowBlur = 10;

  // Thân túi tròn căng
  const bagGrad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, 2, 0, 2, radius * 1.1);
  bagGrad.addColorStop(0, '#d97706');
  bagGrad.addColorStop(0.5, '#b45309');
  bagGrad.addColorStop(1, '#78350f');

  ctx.fillStyle = bagGrad;
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(0, 4, radius * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Miệng túi buộc dây thừng
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-7, -radius * 0.85, 14, 6);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(-8, -radius * 0.75, 16, 2.5);

  // Dấu hỏi chấm vàng phát sáng
  const pulseScale = 1 + Math.sin(time * 0.005) * 0.08;
  ctx.save();
  ctx.scale(pulseScale, pulseScale);
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.fillText('?', 0, 4);
  ctx.restore();

  ctx.restore();
}

// 6. Vẽ chú heo con ngậm kim cương chạy lon ton
function drawPiglet(ctx: CanvasRenderingContext2D, radius: number, vx: number, time: number) {
  ctx.save();
  const facingRight = vx >= 0;
  if (!facingRight) {
    ctx.scale(-1, 1);
  }

  // Thân heo mập mạp màu hồng
  ctx.fillStyle = '#f472b6';
  ctx.strokeStyle = '#db2777';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.1, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mõm heo
  ctx.fillStyle = '#f9a8d4';
  ctx.beginPath();
  ctx.ellipse(radius * 0.9, 2, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lỗ mũi
  ctx.fillStyle = '#be185d';
  ctx.beginPath();
  ctx.arc(radius * 0.95, 1, 1, 0, Math.PI * 2);
  ctx.arc(radius * 0.95, 3.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Tai heo vểnh
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.moveTo(radius * 0.2, -radius * 0.7);
  ctx.lineTo(radius * 0.45, -radius * 1.1);
  ctx.lineTo(radius * 0.6, -radius * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mắt đen láy tròn xoe
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(radius * 0.5, -radius * 0.2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(radius * 0.55, -radius * 0.25, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Bốn chân lon ton bước đi
  const legWalk = Math.sin(time * 0.015) * 4;
  ctx.strokeStyle = '#db2777';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.6, radius * 0.6);
  ctx.lineTo(-radius * 0.6 + legWalk, radius * 1.15);
  ctx.moveTo(radius * 0.5, radius * 0.6);
  ctx.lineTo(radius * 0.5 - legWalk, radius * 1.15);
  ctx.stroke();

  // Kim cương ngậm trong miệng phát sáng
  ctx.save();
  ctx.translate(radius * 1.25, 5);
  drawDiamond(ctx, 7, time);
  ctx.restore();

  ctx.restore();
}

// 7. Hàm dispatch vẽ bất kỳ vật phẩm quặng mỏ nào
function drawSingleItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  item: MineItem,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(item.rotation);

  switch (item.type) {
    case 'gold_small':
    case 'gold_med':
    case 'gold_large':
      drawGoldNugget(ctx, item.radius, item.type, time, item.id);
      break;
    case 'diamond':
      drawDiamond(ctx, item.radius, time);
      break;
    case 'rock_small':
    case 'rock_large':
      drawRock(ctx, item.radius, item.id);
      break;
    case 'tnt':
      drawTNT(ctx, item.radius, time);
      break;
    case 'mystery_bag':
      drawMysteryBag(ctx, item.radius, time);
      break;
    case 'pig_diamond':
      drawPiglet(ctx, item.radius, item.vx || 0.8, time);
      break;
  }

  ctx.restore();
}

// 8. Vẽ Thợ Mỏ và Cỗ Xe Kéo Vàng ở mặt đất (Winch & Miner Assembly)
function drawMinerAndWinch(
  ctx: CanvasRenderingContext2D,
  winchX: number,
  hookState: 'SWINGING' | 'SHOOTING' | 'RETRACTING',
  hookAngle: number,
  grabbedItem: MineItem | null,
  crankAngle: number,
  time: number
) {
  ctx.save();
  ctx.translate(winchX, 42);

  const isRetracting = hookState === 'RETRACTING';
  const isPullingHeavy = isRetracting && grabbedItem && grabbedItem.weight > 2.0;
  const isExcited = isRetracting && grabbedItem && (grabbedItem.type === 'diamond' || grabbedItem.type === 'pig_diamond' || grabbedItem.type === 'gold_large');

  // 1. Bóng đổ của xe goòng trên đường ray
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 32, 42, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Hai bánh xe sắt mỏ than (X = -25 và X = +25)
  const drawWheel = (wx: number) => {
    ctx.save();
    ctx.translate(wx, 30);
    const wheelGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 8);
    wheelGrad.addColorStop(0, '#64748b');
    wheelGrad.addColorStop(0.7, '#334155');
    wheelGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = wheelGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nan hoa sắt
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
    ctx.moveTo(0, -6); ctx.lineTo(0, 6);
    ctx.stroke();

    // Ốc trục trung tâm
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawWheel(-25);
  drawWheel(25);

  // 3. Thùng xe goòng gỗ sồi nẹp sắt chắc chắn
  const cartGrad = ctx.createLinearGradient(-34, 0, 34, 0);
  cartGrad.addColorStop(0, '#451a03');
  cartGrad.addColorStop(0.5, '#78350f');
  cartGrad.addColorStop(1, '#451a03');

  ctx.fillStyle = cartGrad;
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-34, 14, 68, 20, [4, 4, 8, 8]);
  ctx.fill();
  ctx.stroke();

  // Nẹp sắt và đinh tán góc xe
  ctx.fillStyle = '#334155';
  ctx.fillRect(-34, 14, 6, 20);
  ctx.fillRect(28, 14, 6, 20);
  ctx.fillRect(-34, 30, 68, 4);

  // Đinh tán kim loại
  ctx.fillStyle = '#cbd5e1';
  [-31, 31].forEach(rx => {
    [17, 24, 31].forEach(ry => {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // 4. BỘ RÒNG RỌC CƠ KHÍ & MÁY TỜI (Mechanical Winch & Pulley Wheel)
  // Khung A đỡ trục ròng rọc
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.lineTo(8, 10);
  ctx.lineTo(16, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bánh Ròng Rọc / Bánh Đà Lớn (Winch Pulley Wheel) tại tâm (X = 8, Y = 16), bán kính 13px
  const pulleyX = 8;
  const pulleyY = 16;
  const pulleyR = 13;

  ctx.save();
  ctx.translate(pulleyX, pulleyY);

  // Vành ngoài kim loại có rãnh quấn cáp
  const rimGrad = ctx.createRadialGradient(0, 0, pulleyR * 0.5, 0, 0, pulleyR);
  rimGrad.addColorStop(0, '#78350f');
  rimGrad.addColorStop(0.6, '#d97706');
  rimGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = rimGrad;
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, pulleyR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rãnh cáp lõm giữa bánh
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, pulleyR - 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // 6 Nan hoa ròng rọc quay tròn theo crankAngle
  ctx.save();
  ctx.rotate(crankAngle);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;
  for (let sp = 0; sp < 6; sp++) {
    const spA = (Math.PI / 3) * sp;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(spA) * (pulleyR - 2), Math.sin(spA) * (pulleyR - 2));
    ctx.stroke();
  }
  ctx.restore();

  // Trục trung tâm bằng đồng thau
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore(); // Kết thúc vẽ Bánh ròng rọc

  // Tọa độ tay cầm tay quay ròng rọc (Crank Handle)
  const crankRadius = 14;
  const handleX = pulleyX + Math.cos(crankAngle) * crankRadius;
  const handleY = pulleyY + Math.sin(crankAngle) * crankRadius;

  // Thanh đòn tay quay bằng thép cứng
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pulleyX, pulleyY);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pulleyX, pulleyY);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();

  // Núm gỗ tay cầm ròng rọc xoay tự do
  ctx.fillStyle = '#78350f';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(handleX, handleY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cần gạt nhả móc ở bên trái (X = -20, Y = 16)
  const leverAngle = hookState === 'SHOOTING' ? -0.45 : 0.2;
  ctx.save();
  ctx.translate(-20, 20);
  ctx.rotate(leverAngle);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -13);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -13, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. ĐỘNG HỌC THÂN THỂ THỢ MỎ QUAY RÒNG RỌC (Natural Cranking Kinematics)
  let bodyLeanX = 0;
  let bodyLeanY = 0;
  let bodyTilt = 0;

  if (isRetracting) {
    const crankCos = Math.cos(crankAngle);
    const crankSin = Math.sin(crankAngle);

    if (isPullingHeavy) {
      // Khi kéo vật nặng: Dồn sức ngả người về sau, nhấp nhô theo chu kỳ quay
      bodyLeanX = -crankCos * 4.5 - 3;
      bodyLeanY = crankSin * 3;
      bodyTilt = -0.12 - crankCos * 0.08;
    } else {
      // Khi kéo dây bình thường: Chuyển động nhịp nhàng theo tay quay
      bodyLeanX = crankCos * 2.5;
      bodyLeanY = crankSin * 1.8;
      bodyTilt = crankCos * 0.05;
    }
  } else if (hookState === 'SHOOTING') {
    // Đang đẩy cần gạt thả móc
    bodyLeanX = 3;
    bodyLeanY = 1.5;
    bodyTilt = 0.08;
  } else {
    // Đang đung đưa: Thư thả quan sát
    bodyTilt = hookAngle * 0.05;
  }

  // Tọa độ trọng tâm thân thợ mỏ
  const minerX = -12 + bodyLeanX;
  const minerY = 4 + bodyLeanY;

  ctx.save();
  ctx.translate(minerX, minerY);
  ctx.rotate(bodyTilt);

  // Thân áo đỏ flannel
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(-14, -2, 28, 18, 5);
  ctx.fill();

  // Quần yếm denim xanh
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(-12, 4, 24, 14, 3);
  ctx.fill();

  // Dây đeo quần yếm có khuy đồng
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -2); ctx.lineTo(-8, 10);
  ctx.moveTo(8, -2); ctx.lineTo(8, 10);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(-8, 6, 1.6, 0, Math.PI * 2);
  ctx.arc(8, 6, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Đầu thợ mỏ
  const headY = -15;
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, headY, 11.5, 0, Math.PI * 2);
  ctx.fill();

  // Má hồng
  ctx.fillStyle = 'rgba(248, 113, 113, 0.45)';
  ctx.beginPath();
  ctx.arc(-6, headY + 3, 3.5, 0, Math.PI * 2);
  ctx.arc(6, headY + 3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Mũi to tròn ngộ nghĩnh
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(0, headY + 1, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bộ râu trắng bồng bềnh nhiều tầng
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-6, headY + 6, 5, 0, Math.PI * 2);
  ctx.arc(0, headY + 9, 6.5, 0, Math.PI * 2);
  ctx.arc(6, headY + 6, 5, 0, Math.PI * 2);
  ctx.arc(-3, headY + 14, 5, 0, Math.PI * 2);
  ctx.arc(3, headY + 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ria mép cong vút
  ctx.beginPath();
  ctx.moveTo(-8, headY + 3);
  ctx.quadraticCurveTo(-4, headY - 1, 0, headY + 3);
  ctx.quadraticCurveTo(4, headY - 1, 8, headY + 3);
  ctx.quadraticCurveTo(4, headY + 6, 0, headY + 4);
  ctx.quadraticCurveTo(-4, headY + 6, -8, headY + 3);
  ctx.fill();

  // Đôi mắt và biểu cảm sinh động
  if (isPullingHeavy) {
    // Nhắm tít mắt gồng sức (> <)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-7, headY - 3); ctx.lineTo(-4, headY - 1); ctx.lineTo(-7, headY + 1);
    ctx.moveTo(7, headY - 3); ctx.lineTo(4, headY - 1); ctx.lineTo(7, headY + 1);
    ctx.stroke();

    // Giọt mồ hôi bắn ra
    const sweatPhase = (time * 0.006) % 1;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-14 - sweatPhase * 8, headY - 4 - sweatPhase * 5, 2.5 * (1 - sweatPhase * 0.5), 0, Math.PI * 2);
    ctx.fill();
  } else if (isExcited) {
    // Cười híp mắt vui sướng (^ ^)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-5, headY - 1, 3, Math.PI, 0);
    ctx.arc(5, headY - 1, 3, Math.PI, 0);
    ctx.stroke();
  } else {
    // Mắt mở to nhìn theo hướng móc câu
    ctx.fillStyle = '#0f172a';
    const lookX = Math.sin(hookAngle) * 2;
    ctx.beginPath();
    ctx.arc(-5 + lookX, headY - 1, 2.2, 0, Math.PI * 2);
    ctx.arc(5 + lookX, headY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4 + lookX, headY - 2, 0.8, 0, Math.PI * 2);
    ctx.arc(6 + lookX, headY - 2, 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, headY - 5); ctx.lineTo(-2, headY - 4);
    ctx.moveTo(8, headY - 5); ctx.lineTo(2, headY - 4);
    ctx.stroke();
  }

  // Mũ bảo hộ vàng công trình
  const helmetGrad = ctx.createLinearGradient(0, headY - 22, 0, headY - 8);
  helmetGrad.addColorStop(0, '#fef08a');
  helmetGrad.addColorStop(0.35, '#eab308');
  helmetGrad.addColorStop(1, '#a16207');

  ctx.fillStyle = helmetGrad;
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1.2;

  // Vòm mũ
  ctx.beginPath();
  ctx.arc(0, headY - 11, 12, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Vành mũ
  ctx.beginPath();
  ctx.ellipse(0, headY - 10, 15, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Đèn pin gắn trên mũ (chỉ hiển thị thấu kính phát sáng nhỏ, không rọi chùm sáng xuống đất)
  const lampY = headY - 18;
  ctx.fillStyle = '#475569';
  ctx.fillRect(-3, lampY - 2, 6, 4);

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#fef08a';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, lampY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Kết thúc transform minerX, minerY

  // 6. CÁNH TAY CÓ KHỚP KHUỶU QUAY TAY CẦM RÒNG RỌC (Articulated Arm Kinematics)
  const shoulderRx = minerX + 8;
  const shoulderRy = minerY - 3;
  const shoulderLx = minerX - 8;
  const shoulderLy = minerY - 3;

  ctx.lineCap = 'round';

  if (isRetracting) {
    // --- CÁNH TAY PHẢI: QUAY TAY CẦM RÒNG RỌC ---
    const dx = handleX - shoulderRx;
    const dy = handleY - shoulderRy;
    const dist = Math.hypot(dx, dy) || 1;
    const midX = (shoulderRx + handleX) / 2;
    const midY = (shoulderRy + handleY) / 2;
    const bend = Math.max(3, Math.sqrt(Math.max(0, 144 - (dist * dist) / 4)));
    const elbowRx = midX - (dy / dist) * bend * 0.45;
    const elbowRy = midY + (dx / dist) * bend * 0.45 + 2;

    // Bắp tay áo đỏ (vai -> khuỷu)
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(shoulderRx, shoulderRy);
    ctx.lineTo(elbowRx, elbowRy);
    ctx.stroke();

    // Cẳng tay màu da (khuỷu -> bàn tay)
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(elbowRx, elbowRy);
    ctx.lineTo(handleX, handleY);
    ctx.stroke();

    // Bàn tay phải nắm chặt tay cầm
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(handleX, handleY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // --- CÁNH TAY TRÁI ---
    if (isPullingHeavy) {
      const targetLx = handleX - 3;
      const targetLy = handleY - 2;
      const dlx = targetLx - shoulderLx;
      const dly = targetLy - shoulderLy;
      const distL = Math.hypot(dlx, dly) || 1;
      const midLx = (shoulderLx + targetLx) / 2;
      const midLy = (shoulderLy + targetLy) / 2;
      const bendL = Math.max(2, Math.sqrt(Math.max(0, 144 - (distL * distL) / 4)));
      const elbowLx = midLx - (dly / distL) * bendL * 0.4;
      const elbowLy = midLy + (dlx / distL) * bendL * 0.4 + 2;

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(shoulderLx, shoulderLy);
      ctx.lineTo(elbowLx, elbowLy);
      ctx.stroke();

      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(elbowLx, elbowLy);
      ctx.lineTo(targetLx, targetLy);
      ctx.stroke();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(targetLx, targetLy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const braceX = -2;
      const braceY = 16;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(shoulderLx, shoulderLy);
      ctx.lineTo(shoulderLx + 3, shoulderLy + 10);
      ctx.stroke();

      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shoulderLx + 3, shoulderLy + 10);
      ctx.lineTo(braceX, braceY);
      ctx.stroke();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(braceX, braceY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hookState === 'SHOOTING') {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(shoulderLx, shoulderLy);
    ctx.lineTo(shoulderLx - 4, shoulderLy + 6);
    ctx.stroke();

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderLx - 4, shoulderLy + 6);
    ctx.lineTo(-20, 8);
    ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-20, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(shoulderRx, shoulderRy);
    ctx.lineTo(shoulderRx + 6, shoulderRy + 4);
    ctx.stroke();

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderRx + 6, shoulderRy + 4);
    ctx.lineTo(shoulderRx + 12, shoulderRy);
    ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(shoulderRx + 12, shoulderRy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(shoulderLx, shoulderLy);
    ctx.lineTo(shoulderLx - 4, shoulderRy + 6);
    ctx.stroke();

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderLx - 4, shoulderRy + 6);
    ctx.lineTo(-20, 9);
    ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-20, 9, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(shoulderRx, shoulderRy);
    ctx.lineTo(shoulderRx + 5, shoulderRy + 7);
    ctx.stroke();

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderRx + 5, shoulderRy + 7);
    ctx.lineTo(minerX + 13, minerY + 6);
    ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(minerX + 13, minerY + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // WINCH_X
}

export const GameGoldMiner: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('acegames_gold_miner_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [mode, setMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_gold_miner');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['classic', 'timed', 'endless'].includes(parsed.gameMode)) return parsed.gameMode;
      }
    } catch {}
    return 'classic';
  });

  const [initialTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_gold_miner');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeLimit === 'number') return parsed.timeLimit;
      }
    } catch {}
    return 60;
  });

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [dynamiteCount, setDynamiteCount] = useState(2);
  const [hasStrengthPotion, setHasStrengthPotion] = useState(false);
  const [hasDiamondPolish, setHasDiamondPolish] = useState(false);
  const [hasLuckyClover, setHasLuckyClover] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Danh sách quặng mỏ
  const [items, setItems] = useState<MineItem[]>([]);
  const itemsRef = useRef<MineItem[]>([]);
  itemsRef.current = items;

  // Trạng thái móc kéo (Hook State)
  const hookStateRef = useRef<'SWINGING' | 'SHOOTING' | 'RETRACTING'>('SWINGING');
  const hookAngleRef = useRef<number>(0);
  const swingDirRef = useRef<number>(1);
  const hookLengthRef = useRef<number>(BASE_HOOK_LEN);
  const grabbedItemRef = useRef<MineItem | null>(null);
  const crankAngleRef = useRef<number>(0);

  // Hiệu ứng hạt & chữ bay
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Âm thanh Web Audio API
  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.1, gain: number = 0.08) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const playLaunchSound = useCallback(() => {
    playTone(320, 'triangle', 0.12, 0.08);
  }, [playTone]);

  const playLatchSound = useCallback(() => {
    playTone(440, 'square', 0.08, 0.06);
    setTimeout(() => playTone(660, 'sine', 0.08, 0.05), 40);
  }, [playTone]);

  const playCoinSound = useCallback(() => {
    playTone(987, 'triangle', 0.1, 0.1);
    setTimeout(() => playTone(1318, 'sine', 0.15, 0.09), 60);
  }, [playTone]);

  const playDiamondSound = useCallback(() => {
    playTone(1200, 'sine', 0.08, 0.08);
    setTimeout(() => playTone(1600, 'sine', 0.12, 0.09), 50);
    setTimeout(() => playTone(2100, 'sine', 0.16, 0.1), 100);
  }, [playTone]);

  const playExplosionSound = useCallback(() => {
    playTone(90, 'sawtooth', 0.35, 0.18);
    setTimeout(() => playTone(60, 'triangle', 0.4, 0.15), 50);
  }, [playTone]);

  // Sinh quặng mỏ cho từng màn chơi
  const generateLevelItems = useCallback((lvl: number): MineItem[] => {
    const list: MineItem[] = [];
    let idCounter = 1;

    const addItem = (type: ItemType, x: number, y: number) => {
      let radius = 18;
      let value = 100;
      let weight = 1.8;

      switch (type) {
        case 'gold_small':
          radius = 13;
          value = 50;
          weight = 1.0;
          break;
        case 'gold_med':
          radius = 21;
          value = 100;
          weight = 1.9;
          break;
        case 'gold_large':
          radius = 33;
          value = 500;
          weight = 3.8;
          break;
        case 'diamond':
          radius = 11;
          value = hasDiamondPolish ? 800 : 600;
          weight = 0.5;
          break;
        case 'rock_small':
          radius = 18;
          value = 11;
          weight = 3.2;
          break;
        case 'rock_large':
          radius = 30;
          value = 20;
          weight = 5.4;
          break;
        case 'mystery_bag':
          radius = 20;
          value = Math.floor(Math.random() * 500) + 150;
          weight = 1.4;
          break;
        case 'tnt':
          radius = 18;
          value = 2;
          weight = 0.8;
          break;
        case 'pig_diamond':
          radius = 16;
          value = (hasDiamondPolish ? 800 : 600) + 100;
          weight = 0.6;
          break;
      }

      list.push({
        id: idCounter++,
        type,
        x,
        y,
        radius,
        value,
        weight,
        isAlive: true,
        rotation: (Math.random() - 0.5) * 0.4,
      });
    };

    // Tạo các quặng ngẫu nhiên không đè lên nhau
    const spawnSlots: { x: number; y: number }[] = [];
    const minX = 70;
    const maxX = CANVAS_WIDTH - 70;
    const minY = 160;
    const maxY = CANVAS_HEIGHT - 60;

    const count = 13 + Math.min(lvl * 2, 10);

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let placed = false;
      while (attempts < 25 && !placed) {
        attempts++;
        const candidateX = Math.random() * (maxX - minX) + minX;
        const candidateY = Math.random() * (maxY - minY) + minY;

        const tooClose = spawnSlots.some(s => Math.hypot(s.x - candidateX, s.y - candidateY) < 55);
        if (!tooClose) {
          spawnSlots.push({ x: candidateX, y: candidateY });
          placed = true;

          // Xác suất loại quặng
          const rand = Math.random();
          if (rand < 0.22) {
            addItem('gold_small', candidateX, candidateY);
          } else if (rand < 0.45) {
            addItem('gold_med', candidateX, candidateY);
          } else if (rand < 0.60) {
            addItem('gold_large', candidateX, candidateY);
          } else if (rand < 0.72) {
            addItem('diamond', candidateX, candidateY);
          } else if (rand < 0.84) {
            addItem('mystery_bag', candidateX, candidateY);
          } else if (rand < 0.93) {
            addItem('rock_small', candidateX, candidateY);
          } else if (rand < 0.97) {
            addItem('tnt', candidateX, candidateY);
          } else {
            addItem('rock_large', candidateX, candidateY);
          }
        }
      }
    }

    // Từ màn 2 trở lên: Xuất hiện 1-2 chú heo ngậm kim cương chạy lon ton
    if (lvl >= 2) {
      const pigCount = Math.min(2, lvl - 1);
      for (let p = 0; p < pigCount; p++) {
        const pigY = 230 + p * 110 + Math.random() * 30;
        list.push({
          id: idCounter++,
          type: 'pig_diamond',
          x: 120 + Math.random() * (CANVAS_WIDTH - 240),
          y: pigY,
          radius: 16,
          value: (hasDiamondPolish ? 800 : 600) + 100,
          weight: 0.6,
          isAlive: true,
          rotation: 0,
          vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4),
        });
      }
    }

    return list;
  }, [hasDiamondPolish]);

  // Khởi động lại hoặc vào màn mới
  const startLevel = useCallback((lvl: number) => {
    setLevel(lvl);
    setTimeLeft(initialTime);
    setIsShopOpen(false);
    setIsGameOver(false);
    hookStateRef.current = 'SWINGING';
    hookLengthRef.current = BASE_HOOK_LEN;
    grabbedItemRef.current = null;

    const newItems = generateLevelItems(lvl);
    setItems(newItems);
  }, [generateLevelItems, initialTime]);

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  // Đếm ngược thời gian ván chơi (60 giây)
  useEffect(() => {
    if (isPaused || isGameOver || isShopOpen || mode === 'endless') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const target = LEVEL_TARGETS[level - 1] || 15000;
          if (score >= target) {
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 }
            });
            playCoinSound();
            setIsShopOpen(true);
          } else {
            setIsGameOver(true);
            playTone(160, 'sawtooth', 0.5, 0.15);
          }
          return 0;
        }

        if (prev <= 10) {
          playTone(600, 'sine', 0.04, 0.03);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused, isShopOpen, level, mode, playCoinSound, playTone, score]);

  // Bắn móc câu (Thả móc)
  const handleLaunchHook = useCallback(() => {
    if (hookStateRef.current !== 'SWINGING' || isPaused || isGameOver || isShopOpen) return;
    hookStateRef.current = 'SHOOTING';
    playLaunchSound();
  }, [isGameOver, isPaused, isShopOpen, playLaunchSound]);

  // Ném thuốc nổ làm nổ quặng đang kéo
  const handleUseDynamite = useCallback(() => {
    if (dynamiteCount <= 0 || hookStateRef.current !== 'RETRACTING' || !grabbedItemRef.current) return;

    setDynamiteCount(d => d - 1);
    playExplosionSound();
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 350);

    grabbedItemRef.current = null;

    // Hiệu ứng nổ tại vị trí đầu móc hiện tại
    const hookX = WINCH_X + Math.sin(hookAngleRef.current) * hookLengthRef.current;
    const hookY = WINCH_Y + Math.cos(hookAngleRef.current) * hookLengthRef.current;

    const newParticles: Particle[] = [];
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: hookX,
        y: hookY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#f97316' : '#ef4444',
        size: 3.5 + Math.random() * 4,
        alpha: 1,
      });
    }
    setParticles(prev => [...prev.slice(-40), ...newParticles]);

    // Thu hồi dây nhanh về vị trí ban đầu
    hookLengthRef.current = Math.max(BASE_HOOK_LEN, hookLengthRef.current - 20);
  }, [dynamiteCount, playExplosionSound]);

  // Bắt phím Space / Mũi tên xuống để thả móc, Mũi tên lên / Phím W để ném thuốc nổ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleLaunchHook();
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleUseDynamite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunchHook, handleUseDynamite]);

  // Vòng lặp vật lý và render Canvas 60 FPS Retina High-DPI
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2;
      const targetWidth = CANVAS_WIDTH * dpr;
      const targetHeight = CANVAS_HEIGHT * dpr;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const time = Date.now();

      // CẬP NHẬT VẬT LÝ MÓC CÂU (PHYSICS UPDATE)
      if (!isPaused && !isGameOver && !isShopOpen) {
        // Cập nhật vị trí di chuyển của heo con ngậm kim cương
        for (const it of itemsRef.current) {
          if (it.type === 'pig_diamond' && it.isAlive && it !== grabbedItemRef.current) {
            const speed = it.vx || 0.8;
            it.x += speed;
            if (it.x > CANVAS_WIDTH - 60) {
              it.vx = -Math.abs(speed);
            } else if (it.x < 60) {
              it.vx = Math.abs(speed);
            }
          }
        }

        // 1. Nếu đang đung đưa tự do
        if (hookStateRef.current === 'SWINGING') {
          const swingSpeed = 0.026; // Nhịp lắc con lắc mượt mà, dễ căn góc bắn chuẩn
          hookAngleRef.current += swingSpeed * swingDirRef.current;

          if (hookAngleRef.current > MAX_SWING_ANGLE) {
            hookAngleRef.current = MAX_SWING_ANGLE;
            swingDirRef.current = -1;
          } else if (hookAngleRef.current < -MAX_SWING_ANGLE) {
            hookAngleRef.current = -MAX_SWING_ANGLE;
            swingDirRef.current = 1;
          }
        }
        // 2. Nếu đang phóng móc ra ngoài
        else if (hookStateRef.current === 'SHOOTING') {
          const shootSpeed = 9.2; // Giảm tốc độ phóng móc để người chơi nhìn rõ đường lao xuống
          hookLengthRef.current += shootSpeed;

          const hookX = WINCH_X + Math.sin(hookAngleRef.current) * hookLengthRef.current;
          const hookY = WINCH_Y + Math.cos(hookAngleRef.current) * hookLengthRef.current;

          // Kiểm tra va chạm biên màn hình
          if (hookX <= 15 || hookX >= CANVAS_WIDTH - 15 || hookY >= CANVAS_HEIGHT - 20) {
            hookStateRef.current = 'RETRACTING';
          } else {
            // Kiểm tra va chạm với các quặng mỏ
            for (const item of itemsRef.current) {
              if (item.isAlive) {
                const dist = Math.hypot(hookX - item.x, hookY - item.y);
                if (dist <= item.radius + 12) {
                  // Trúng quặng!
                  if (item.type === 'tnt') {
                    item.isAlive = false;
                    playExplosionSound();
                    setScreenShake(true);
                    setTimeout(() => setScreenShake(false), 350);

                    // Phá hủy tất cả quặng xung quanh trong bán kính 130px
                    setItems(prev =>
                      prev.map(it => {
                        if (it.isAlive && Math.hypot(it.x - item.x, it.y - item.y) <= 130) {
                          return { ...it, isAlive: false };
                        }
                        return it;
                      })
                    );

                    hookStateRef.current = 'RETRACTING';
                  } else {
                    item.isAlive = false;
                    grabbedItemRef.current = item;
                    hookStateRef.current = 'RETRACTING';
                    playLatchSound();
                  }
                  break;
                }
              }
            }
          }
        }
        // 3. Nếu đang thu hồi dây kéo về
        else if (hookStateRef.current === 'RETRACTING') {
          const grabbed = grabbedItemRef.current;
          let pullSpeed = 11.0; // Dây kéo rỗng thu hồi êm ái

          if (grabbed) {
            // Tốc độ kéo phụ thuộc chính xác theo loại quặng (kéo dây chậm hơn mang lại cảm giác nặng đầm tay)
            const baseItemSpeeds: Record<ItemType, number> = {
              diamond: 8.5,       // Kim cương nhẹ nhất, thu cực nhanh
              pig_diamond: 7.8,   // Heo ngậm kim cương thu nhanh
              gold_small: 5.4,    // Vàng nhỏ
              mystery_bag: 4.6,   // Túi bí ẩn vừa phải
              gold_med: 3.4,      // Vàng vừa có cảm giác nặng
              rock_small: 2.0,    // Đá nhỏ nặng, thu chậm
              gold_large: 1.8,    // Vàng lớn rất nặng, giá trị $500 kéo chậm hào hứng
              rock_large: 1.1,    // Đá tảng cực nặng, kéo siêu chậm, thúc đẩy ném thuốc nổ
              tnt: 7.0,
            };
            const speedMod = hasStrengthPotion ? 2.2 : 1.0;
            pullSpeed = (baseItemSpeeds[grabbed.type] || 3.0) * speedMod;
          }

          hookLengthRef.current -= pullSpeed;
          crankAngleRef.current += pullSpeed * 0.22; // Bánh răng tời cơ khí quay đồng bộ theo tốc độ kéo

          // Khi dây đã thu hồi hoàn toàn về vị trí xuất phát
          if (hookLengthRef.current <= BASE_HOOK_LEN) {
            hookLengthRef.current = BASE_HOOK_LEN;
            hookStateRef.current = 'SWINGING';

            if (grabbed) {
              let earned = grabbed.value;

              // Xử lý túi bí ẩn
              if (grabbed.type === 'mystery_bag') {
                const bagRand = Math.random();
                if (bagRand < 0.25) {
                  setDynamiteCount(d => d + 1);
                  setFloatingTexts(prev => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      x: WINCH_X,
                      y: WINCH_Y + 15,
                      text: '+1 THUỐC NỔ 💣',
                      color: '#f97316',
                    }
                  ]);
                } else if (bagRand < 0.45) {
                  setHasStrengthPotion(true);
                  setFloatingTexts(prev => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      x: WINCH_X,
                      y: WINCH_Y + 15,
                      text: 'BÙA SỨC MẠNH! ⚡',
                      color: '#22d3ee',
                    }
                  ]);
                } else {
                  earned = hasLuckyClover ? Math.floor(earned * 1.5) : earned;
                }
              }

              // Cộng điểm tiền vàng
              if (grabbed.type === 'diamond' || grabbed.type === 'pig_diamond') {
                playDiamondSound();
              } else {
                playCoinSound();
              }

              setScore(s => {
                const ns = s + earned;
                if (ns > highScore) {
                  setHighScore(ns);
                  try {
                    localStorage.setItem('acegames_gold_miner_highscore', ns.toString());
                  } catch {}
                }
                return ns;
              });

              // Tạo chữ bay cộng tiền vàng
              setFloatingTexts(prev => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  x: WINCH_X,
                  y: WINCH_Y + 10,
                  text: `+$${earned}`,
                  color: (grabbed.type === 'diamond' || grabbed.type === 'pig_diamond') ? '#38bdf8' : '#facc15',
                }
              ]);

              grabbedItemRef.current = null;
            }
          }
        }
      }

      // VẼ TOÀN BỘ ĐỒ HỌA SÂN CHƠI (CANVAS RENDER)
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Bầu trời đêm và Trại mỏ trên mặt đất (Y: 0 đến 76)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 76);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 76);

      // Ngôi sao lấp lánh trên bầu trời đêm
      for (let s = 0; s < 12; s++) {
        const sx = (s * 83 + 25) % (CANVAS_WIDTH - 40);
        const sy = (s * 37 + 10) % 55;
        const sTwinkle = 0.3 + Math.sin(time * 0.002 + s * 1.5) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, sTwinkle)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Khung giàn dầm gỗ chống hầm mỏ (Timber Scaffolding)
      const drawTimberPost = (tx: number) => {
        const postGrad = ctx.createLinearGradient(tx - 7, 0, tx + 7, 0);
        postGrad.addColorStop(0, '#2e1509');
        postGrad.addColorStop(0.5, '#451a03');
        postGrad.addColorStop(1, '#2e1509');
        ctx.fillStyle = postGrad;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.fillRect(tx - 7, 0, 14, 76);
        ctx.strokeRect(tx - 7, 0, 14, 76);

        ctx.beginPath();
        ctx.moveTo(tx - 7, 15); ctx.lineTo(tx + (tx < 500 ? 25 : -25), 0);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(tx, 20, 1.5, 0, Math.PI * 2);
        ctx.arc(tx, 50, 1.5, 0, Math.PI * 2);
        ctx.fill();
      };
      drawTimberPost(60);
      drawTimberPost(CANVAS_WIDTH - 60);

      // Đèn bão (Lantern) treo trên cột gỗ bên trái
      const flameFlicker = Math.sin(time * 0.008) * 2;
      const lanternGlow = ctx.createRadialGradient(60, 38, 2, 60, 38, 70 + flameFlicker * 3);
      lanternGlow.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      lanternGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
      lanternGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(60, 38, 80, 0, Math.PI * 2);
      ctx.fill();

      // Thân đèn bão
      ctx.fillStyle = '#d97706';
      ctx.fillRect(56, 30, 8, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(58, 33, 4, 8);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.strokeRect(56, 30, 8, 14);

      // Thùng thuốc nổ dự trữ bên cạnh (X = WINCH_X - 70, Y = 62)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(WINCH_X - 76, 56, 16, 16);
      ctx.strokeStyle = '#b45309';
      ctx.strokeRect(WINCH_X - 76, 56, 16, 16);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(WINCH_X - 74, 52, 4, 10);
      ctx.fillRect(WINCH_X - 68, 50, 4, 12);
      ctx.fillRect(WINCH_X - 63, 53, 4, 9);

      // Đống quặng vàng & cuốc mỏ bên cạnh (X = WINCH_X + 68, Y = 66)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(WINCH_X + 66, 68, 5, 0, Math.PI * 2);
      ctx.arc(WINCH_X + 74, 69, 4, 0, Math.PI * 2);
      ctx.fill();

      // Đường ray xe goòng & Tà vẹt gỗ (Y: 68 đến 80)
      for (let rx = 15; rx < CANVAS_WIDTH; rx += 25) {
        ctx.fillStyle = '#3e1804';
        ctx.fillRect(rx, 68, 15, 6);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(rx + 2, 70, 1.5, 1.5);
        ctx.fillRect(rx + 11, 70, 1.5, 1.5);
      }

      // Hai thanh ray thép chạy dài
      const railGrad = ctx.createLinearGradient(0, 70, 0, 77);
      railGrad.addColorStop(0, '#cbd5e1');
      railGrad.addColorStop(0.5, '#64748b');
      railGrad.addColorStop(1, '#334155');
      ctx.fillStyle = railGrad;
      ctx.fillRect(0, 70, CANVAS_WIDTH, 2.5);
      ctx.fillRect(0, 75, CANVAS_WIDTH, 2.5);

      // Dải cỏ xanh tự nhiên mép đất
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 78, CANVAS_WIDTH, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 77, CANVAS_WIDTH, 1.5);

      // 2. Nền Lòng Đất Mỏ Vàng Đa Tầng Địa Chất (Y: 80 đến CANVAS_HEIGHT = 540)
      // Tầng 1: Đất mùn & sét đỏ (80 - 180)
      const dirtGrad1 = ctx.createLinearGradient(0, 80, 0, 180);
      dirtGrad1.addColorStop(0, '#261307');
      dirtGrad1.addColorStop(1, '#3b1c0b');
      ctx.fillStyle = dirtGrad1;
      ctx.fillRect(0, 80, CANVAS_WIDTH, 100);

      // Rễ cây đâm xuống từ mặt đất
      ctx.strokeStyle = '#573012';
      ctx.lineWidth = 1.5;
      for (let rx = 40; rx < CANVAS_WIDTH; rx += 90) {
        ctx.beginPath();
        ctx.moveTo(rx, 80);
        ctx.quadraticCurveTo(rx + 5, 95, rx + ((rx % 2 === 0) ? 12 : -8), 105);
        ctx.stroke();
      }

      // Tầng 2: Sa thạch & Phiến sét vàng nâu (180 - 320)
      const dirtGrad2 = ctx.createLinearGradient(0, 180, 0, 320);
      dirtGrad2.addColorStop(0, '#3b1c0b');
      dirtGrad2.addColorStop(1, '#2c1407');
      ctx.fillStyle = dirtGrad2;
      ctx.fillRect(0, 180, CANVAS_WIDTH, 140);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.bezierCurveTo(240, 172, 480, 188, CANVAS_WIDTH, 180);
      ctx.stroke();

      // Tầng 3: Tầng đá sô-cô-la chứa quặng sâu (320 - 430)
      const dirtGrad3 = ctx.createLinearGradient(0, 320, 0, 430);
      dirtGrad3.addColorStop(0, '#2c1407');
      dirtGrad3.addColorStop(1, '#1b0b04');
      ctx.fillStyle = dirtGrad3;
      ctx.fillRect(0, 320, CANVAS_WIDTH, 110);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, 320);
      ctx.bezierCurveTo(320, 330, 640, 312, CANVAS_WIDTH, 322);
      ctx.stroke();

      // Tầng 4: Tầng đá gốc bazan sâu thẳm (430 - 540)
      const dirtGrad4 = ctx.createLinearGradient(0, 430, 0, CANVAS_HEIGHT);
      dirtGrad4.addColorStop(0, '#1b0b04');
      dirtGrad4.addColorStop(1, '#090402');
      ctx.fillStyle = dirtGrad4;
      ctx.fillRect(0, 430, CANVAS_WIDTH, CANVAS_HEIGHT - 430);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, 430);
      ctx.bezierCurveTo(200, 422, 600, 438, CANVAS_WIDTH, 428);
      ctx.stroke();

      // Vi hạt bụi vàng lấp lánh trong lòng đất
      for (let gx = 30; gx < CANVAS_WIDTH; gx += 50) {
        for (let gy = 100; gy < CANVAS_HEIGHT; gy += 45) {
          const goldSpark = Math.sin(time * 0.003 + gx * 0.05 + gy * 0.08);
          if (goldSpark > 0.3) {
            ctx.fillStyle = `rgba(245, 158, 11, ${(goldSpark - 0.3) * 0.35})`;
            ctx.beginPath();
            ctx.arc(gx + ((gy % 90 === 0) ? 25 : 0), gy, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3. Vẽ tất cả các quặng mỏ trong lòng đất (chưa bị gắp)
      for (const item of items) {
        if (!item.isAlive) continue;
        drawSingleItem(ctx, item.x, item.y, item, time);
      }

      // 4. Tính toán vị trí đầu móc câu hiện tại
      const hookX = WINCH_X + Math.sin(hookAngleRef.current) * hookLengthRef.current;
      const hookY = WINCH_Y + Math.cos(hookAngleRef.current) * hookLengthRef.current;

      // 5. Vẽ sợi dây cáp thép nối từ tời đến đầu móc câu
      ctx.save();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(WINCH_X, WINCH_Y);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(WINCH_X, WINCH_Y);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 0.9;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();

      // 6. Vẽ đầu móc câu bằng thép xoay theo góc dây
      ctx.save();
      ctx.translate(hookX, hookY);
      ctx.rotate(-hookAngleRef.current);

      const grabbed = grabbedItemRef.current;
      let clawSpread = 0.38;
      if (hookStateRef.current === 'RETRACTING') {
        if (grabbed) {
          clawSpread = Math.min(0.45, 0.12 + grabbed.radius * 0.009);
        } else {
          clawSpread = 0.08;
        }
      }

      // Khớp tời trên đầu móc
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-5, -8, 10, 8, 2);
      ctx.fill();
      ctx.stroke();

      // Càng móc bên trái
      ctx.save();
      ctx.rotate(-clawSpread);
      const clawGradL = ctx.createLinearGradient(-15, 0, 0, 24);
      clawGradL.addColorStop(0, '#f1f5f9');
      clawGradL.addColorStop(0.5, '#94a3b8');
      clawGradL.addColorStop(1, '#334155');
      ctx.fillStyle = clawGradL;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(-16, 12, -11, 24);
      ctx.lineTo(-7, 16);
      ctx.quadraticCurveTo(-9, 10, 0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Càng móc bên phải
      ctx.save();
      ctx.rotate(clawSpread);
      const clawGradR = ctx.createLinearGradient(0, 0, 15, 24);
      clawGradR.addColorStop(0, '#f1f5f9');
      clawGradR.addColorStop(0.5, '#94a3b8');
      clawGradR.addColorStop(1, '#334155');
      ctx.fillStyle = clawGradR;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(16, 12, 11, 24);
      ctx.lineTo(7, 16);
      ctx.quadraticCurveTo(9, 10, 0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Bu-lông trục xoay đồng thau
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vẽ quặng đang bị gắp kẹp chặt giữa 2 càng móc
      if (grabbed) {
        ctx.save();
        ctx.translate(0, 10 + grabbed.radius * 0.72);
        drawSingleItem(ctx, 0, 0, grabbed, time);
        ctx.restore();
      }

      ctx.restore(); // Hook transform

      // 7. Vẽ Thợ Mỏ và Cỗ Xe Kéo Vàng ở mặt đất (Winch & Miner Assembly)
      drawMinerAndWinch(
        ctx,
        WINCH_X,
        hookStateRef.current,
        hookAngleRef.current,
        grabbedItemRef.current,
        crankAngleRef.current,
        time
      );

      // 8. Vẽ các hạt vụn nổ
      for (const p of particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Vẽ chữ bay tiền vàng
      for (const f of floatingTexts) {
        ctx.save();
        ctx.fillStyle = f.color;
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 8;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      ctx.restore(); // Kết thúc scale dpr

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [hasDiamondPolish, hasLuckyClover, hasStrengthPotion, isGameOver, isPaused, isShopOpen, items, particles, playDiamondSound, playCoinSound, playExplosionSound, playLatchSound]);

  // Cập nhật hạt bụi nổ & chữ bay
  useEffect(() => {
    const timer = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.16,
            alpha: p.alpha - 0.04,
          }))
          .filter(p => p.alpha > 0)
      );

      setFloatingTexts(prev =>
        prev
          .map(t => ({
            ...t,
            y: t.y - 1.3,
          }))
          .slice(-10)
      );
    }, 25);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (floatingTexts.length > 0) {
      const t = setTimeout(() => {
        setFloatingTexts(prev => prev.slice(1));
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [floatingTexts]);

  const targetScore = LEVEL_TARGETS[level - 1] || 15000;

  // Mua hàng trong shop
  const handleBuyItem = (itemType: 'dynamite' | 'strength' | 'polish' | 'clover', price: number) => {
    if (score < price) return;
    soundManager.playButtonClick();
    playCoinSound();
    setScore(s => s - price);

    switch (itemType) {
      case 'dynamite':
        setDynamiteCount(d => d + 1);
        break;
      case 'strength':
        setHasStrengthPotion(true);
        break;
      case 'polish':
        setHasDiamondPolish(true);
        break;
      case 'clover':
        setHasLuckyClover(true);
        break;
    }
  };

  const handleNextLevelFromShop = () => {
    soundManager.playButtonClick();
    startLevel(level + 1);
  };

  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setDynamiteCount(2);
    setHasStrengthPotion(false);
    setHasDiamondPolish(false);
    setHasLuckyClover(false);
    startLevel(1);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070503]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Chế độ chơi & Nút Ném Thuốc Nổ */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {(['classic', 'timed', 'endless'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  resetGame();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === m
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'classic' ? 'Cổ Điển' : m === 'timed' ? 'Tính Giờ' : 'Vô Tận'}
              </button>
            ))}
          </div>

          {/* Nút Thuốc Nổ Nhanh trên HUD */}
          <button
            onClick={handleUseDynamite}
            disabled={dynamiteCount <= 0 || hookStateRef.current !== 'RETRACTING' || !grabbedItemRef.current}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs transition cursor-pointer active:scale-95 ${
              dynamiteCount > 0 && hookStateRef.current === 'RETRACTING' && grabbedItemRef.current
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-slate-950/60 border-white/10 text-gray-400 opacity-60'
            }`}
            title="Ném Thuốc Nổ (Phím W hoặc Chuột Phải)"
          >
            <Bomb className="w-3.5 h-3.5 text-rose-400" />
            <span>NỔ ({dynamiteCount})</span>
          </button>
        </div>

        {/* Khối Giữa: Căn giữa tuyệt đối 50% */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-gray-400">VÀNG:</span>
            <span className="text-sm sm:text-lg font-black text-amber-400 font-mono tracking-tight">
              ${score.toLocaleString()}
            </span>
          </div>

          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 hidden sm:block" />

          {mode !== 'endless' && (
            <div className="text-xs font-bold text-gray-300 hidden sm:flex items-center gap-1">
              <span className="text-gray-400">MỤC TIÊU:</span>
              <span className="text-amber-300 font-mono font-black">${targetScore.toLocaleString()}</span>
            </div>
          )}

          {mode !== 'endless' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 hidden sm:block" />
              <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span className={timeLeft <= 10 ? 'text-rose-400 animate-pulse font-black' : 'text-gray-300'}>
                  {timeLeft}s
                </span>
              </div>
            </>
          )}
        </div>

        {/* Khối Phải: Cấp độ, Tạm dừng & Chơi lại */}
        <div className="flex items-center gap-2 z-10">
          <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-black text-cyan-400 font-mono">
            MÀN {level}
          </div>

          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Ván Mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sân đấu Widescreen 16:9 Arcade Canvas Container */}
      <div 
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-235px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] touch-none flex-shrink min-h-0 transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleLaunchHook}
          onContextMenu={(e) => {
            e.preventDefault();
            handleUseDynamite();
          }}
          className="w-full h-full cursor-pointer block"
        />

        {/* Nút bấm ảo trên điện thoại để thả móc */}
        <div className="sm:hidden absolute bottom-4 right-4 z-20">
          <button
            onClick={handleLaunchHook}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-2xl active:scale-90 text-sm uppercase"
          >
            THẢ
          </button>
        </div>

        {/* Cửa Hàng Thợ Mỏ Giữa Các Màn (Shop Modal) */}
        {isShopOpen && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-2xl p-4 sm:p-6 rounded-3xl bg-slate-900/95 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 sm:space-y-5">
              {/* Header cửa hàng */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-black text-base sm:text-xl tracking-wide">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
                  </div>
                  <span>CỬA HÀNG THỢ MỎ</span>
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-black font-mono text-sm sm:text-base shadow-inner">
                  <span className="text-amber-400 text-xs sm:text-sm">VÀNG:</span>
                  <span>${score.toLocaleString()}</span>
                </div>
              </div>

              {/* 4 Thẻ Vật Phẩm Trực Quan To Rõ & Animated (Chữ ít) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                {/* 1. Thuốc Nổ */}
                <div className="group relative p-3 sm:p-4 rounded-2xl bg-slate-950/80 border-2 border-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_25px_rgba(244,63,94,0.3)] transition-all duration-300 hover:scale-105 flex flex-col justify-between items-center text-center">
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="absolute inset-2 bg-rose-500/20 rounded-full blur-xl group-hover:bg-rose-500/35 transition-colors" />
                      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
                        <circle cx="50" cy="18" r="6" fill="#fef08a" className="animate-ping opacity-75" />
                        <circle cx="50" cy="18" r="4" fill="#f59e0b" className="animate-pulse" />
                        <circle cx="50" cy="18" r="2" fill="#ffffff" />
                        <path d="M 50 18 Q 44 26 50 36" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                        <rect x="26" y="36" width="14" height="48" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                        <rect x="29" y="38" width="4" height="44" rx="2" fill="#ef4444" opacity="0.6" />
                        <rect x="60" y="36" width="14" height="48" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                        <rect x="63" y="38" width="4" height="44" rx="2" fill="#ef4444" opacity="0.6" />
                        <rect x="42" y="32" width="16" height="54" rx="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
                        <rect x="45" y="34" width="4" height="50" rx="2" fill="#fca5a5" opacity="0.7" />
                        <rect x="24" y="44" width="52" height="6" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                        <rect x="24" y="68" width="52" height="6" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                        <text x="50" y="61" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">TNT</text>
                      </svg>
                    </div>

                    <span className="text-xs sm:text-sm font-black text-white mt-1.5 block">THUỐC NỔ</span>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-[10px] sm:text-[11px]">
                      +1 💣 NỔ ĐÁ
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuyItem('dynamite', 150)}
                    disabled={score < 150}
                    className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95"
                  >
                    $150
                  </button>
                </div>

                {/* 2. Nước Tăng Lực */}
                <div className="group relative p-3 sm:p-4 rounded-2xl bg-slate-950/80 border-2 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-105 flex flex-col justify-between items-center text-center">
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="absolute inset-2 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/35 transition-colors" />
                      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
                        <rect x="42" y="16" width="16" height="8" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                        <path d="M 44 24 L 44 32 L 32 48 C 24 58 24 74 34 84 C 42 92 58 92 66 84 C 76 74 76 58 68 48 L 56 32 L 56 24 Z" fill="#083344" stroke="#38bdf8" strokeWidth="2" />
                        <path d="M 32 60 C 32 78 40 86 50 86 C 60 86 68 78 68 60 C 62 62 56 58 50 60 C 44 62 38 58 32 60 Z" fill="#0284c7" />
                        <circle cx="44" cy="72" r="3" fill="#ffffff" opacity="0.6" className="animate-bounce" />
                        <circle cx="56" cy="66" r="2" fill="#ffffff" opacity="0.7" className="animate-ping" />
                        <path d="M 53 38 L 44 54 L 51 54 L 46 72 L 58 52 L 50 52 Z" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" className="animate-pulse" />
                        <path d="M 36 52 C 30 62 30 74 38 82" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                      </svg>
                    </div>

                    <span className="text-xs sm:text-sm font-black text-white mt-1.5 block">TĂNG LỰC</span>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black text-[10px] sm:text-[11px]">
                      ⚡ KÉO x2
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuyItem('strength', 200)}
                    disabled={score < 200 || hasStrengthPotion}
                    className={`w-full mt-3 py-2 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95 ${
                      hasStrengthPotion
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 disabled:opacity-40 text-slate-950'
                    }`}
                  >
                    {hasStrengthPotion ? '✓ ĐÃ CÓ' : '$200'}
                  </button>
                </div>

                {/* 3. Đánh Bóng Kim Cương */}
                <div className="group relative p-3 sm:p-4 rounded-2xl bg-slate-950/80 border-2 border-fuchsia-500/30 hover:border-fuchsia-400 hover:shadow-[0_0_25px_rgba(217,70,239,0.3)] transition-all duration-300 hover:scale-105 flex flex-col justify-between items-center text-center">
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="absolute inset-2 bg-fuchsia-500/20 rounded-full blur-xl group-hover:bg-fuchsia-500/35 transition-colors" />
                      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
                        <polygon points="50,20 78,42 66,80 34,80 22,42" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                        <polygon points="50,20 62,42 50,56 38,42" fill="#ffffff" opacity="0.6" />
                        <polygon points="38,42 50,56 34,80" fill="#38bdf8" opacity="0.7" />
                        <polygon points="62,42 50,56 66,80" fill="#0369a1" opacity="0.8" />
                        <polygon points="50,56 34,80 66,80" fill="#075985" opacity="0.9" />
                        <g transform="translate(74, 30)" className="animate-pulse">
                          <path d="M 0 -8 L 1.5 -2 L 8 0 L 1.5 2 L 0 8 L -1.5 2 L -8 0 L -1.5 -2 Z" fill="#ffffff" />
                        </g>
                        <g transform="translate(24, 62)" className="animate-pulse">
                          <path d="M 0 -6 L 1.2 -1.5 L 6 0 L 1.2 1.5 L 0 6 L -1.2 1.5 L -6 0 L -1.2 -1.5 Z" fill="#ffffff" />
                        </g>
                      </svg>
                    </div>

                    <span className="text-xs sm:text-sm font-black text-white mt-1.5 block">ĐÁNH BÓNG</span>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-black text-[10px] sm:text-[11px]">
                      💎 +$200
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuyItem('polish', 180)}
                    disabled={score < 180 || hasDiamondPolish}
                    className={`w-full mt-3 py-2 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95 ${
                      hasDiamondPolish
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
                        : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:brightness-110 disabled:opacity-40 text-slate-950'
                    }`}
                  >
                    {hasDiamondPolish ? '✓ ĐÃ CÓ' : '$180'}
                  </button>
                </div>

                {/* 4. Cỏ May Mắn */}
                <div className="group relative p-3 sm:p-4 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-105 flex flex-col justify-between items-center text-center">
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="absolute inset-2 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/35 transition-colors" />
                      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10" fill="none">
                        <path d="M 50 50 Q 56 74 46 88" stroke="#15803d" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 50 50 C 40 36 34 22 46 16 C 54 12 50 28 50 50 C 50 28 46 12 54 16 C 66 22 60 36 50 50 Z" fill="#22c55e" stroke="#166534" strokeWidth="1.2" />
                        <path d="M 50 50 C 64 40 78 34 84 46 C 88 54 72 50 50 50 C 72 50 88 46 84 54 C 78 66 64 60 50 50 Z" fill="#22c55e" stroke="#166534" strokeWidth="1.2" />
                        <path d="M 50 50 C 60 64 66 78 54 84 C 46 88 50 72 50 50 C 50 72 54 88 46 84 C 34 78 40 64 50 50 Z" fill="#22c55e" stroke="#166534" strokeWidth="1.2" />
                        <path d="M 50 50 C 36 60 22 66 16 54 C 12 46 28 50 50 50 C 28 50 12 54 16 46 C 22 34 36 40 50 50 Z" fill="#22c55e" stroke="#166534" strokeWidth="1.2" />
                        <circle cx="50" cy="50" r="3" fill="#fde047" className="animate-ping opacity-60" />
                        <circle cx="50" cy="50" r="2.5" fill="#facc15" />
                        <circle cx="70" cy="28" r="2.5" fill="#fef08a" className="animate-pulse" />
                        <circle cx="28" cy="32" r="2" fill="#fef08a" className="animate-pulse" />
                      </svg>
                    </div>

                    <span className="text-xs sm:text-sm font-black text-white mt-1.5 block">CỎ MAY MẮN</span>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-[10px] sm:text-[11px]">
                      🍀 QUÀ XỊN
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuyItem('clover', 120)}
                    disabled={score < 120 || hasLuckyClover}
                    className={`w-full mt-3 py-2 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95 ${
                      hasLuckyClover
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 disabled:opacity-40 text-slate-950'
                    }`}
                  >
                    {hasLuckyClover ? '✓ ĐÃ CÓ' : '$120'}
                  </button>
                </div>
              </div>

              {/* Nút sang màn tiếp theo */}
              <div className="pt-1">
                <button
                  onClick={handleNextLevelFromShop}
                  className="group w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt Đầu Màn {level + 1}</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <span className="text-5xl mb-2 animate-bounce">⛏️</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">CHƯA ĐẠT MỤC TIÊU!</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Mục tiêu màn {level} là ${targetScore.toLocaleString()}, bạn chỉ đào được ${score.toLocaleString()}.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 mb-6 w-full max-w-[220px]">
              <span className="text-xs text-gray-400 block mb-1">TIỀN VÀNG CAO NHẤT</span>
              <span className="text-2xl font-black text-amber-400 font-mono">${highScore.toLocaleString()}</span>
            </div>
            <button
              onClick={resetGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95"
            >
              Chơi Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
