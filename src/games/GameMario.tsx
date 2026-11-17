import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Pause, 
  ArrowLeft, 
  ArrowRight, 
  ArrowDown, 
  Trophy, 
  ChevronRight,
  Coins,
  Clock,
  Heart,
  Flame
} from 'lucide-react';
import { soundManager } from '../utils/sound';

// Cấu hình chuẩn chung của hệ sinh thái Ace Games (Contra, Zuma, Road Fighter, Tank 1990)
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân khấu chính bên trái (756x540px), Sidebar thông số bên phải (204px)
const ARENA_WIDTH = 756;
const ARENA_HEIGHT = 540;
const SIDEBAR_X = ARENA_WIDTH;
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH;

// Kích thước khối địa hình chuẩn (48x48) & Cao độ mặt đất (y = 440)
const BLOCK_SIZE = 48;
const GROUND_Y = 440;

type MarioForm = 'small' | 'super' | 'fire';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  vRot?: number;
  isBrickPiece?: boolean;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
}

interface Block {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'brick' | 'question' | 'empty' | 'hard_block';
  content?: 'coin' | 'mushroom' | 'fireflower' | 'star';
  isHit?: boolean;
  hitOffsetY?: number;
  coinsLeft?: number;
}

interface Pipe {
  x: number;
  y: number;
  w: number;
  h: number;
  hasPiranha?: boolean;
  piranhaOffset?: number;
  piranhaDir?: number;
  piranhaTimer?: number;
}

interface Item {
  id: number;
  type: 'coin' | 'mushroom' | 'fireflower' | 'star';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isAlive: boolean;
}

interface Enemy {
  id: number;
  type: 'goomba' | 'koopa' | 'bowser';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  isStomped?: boolean;
  isShell?: boolean;
  shellSpeed?: number;
  facing: 'left' | 'right';
  animTimer: number;
  hp?: number;
  shootCooldown?: number;
}

interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAlive: boolean;
  isEnemy?: boolean;
}

// ==========================================
// BỘ VẼ ĐỒ HỌA VECTOR CAO CẤP CHO SUPER MARIO
// ==========================================

/**
 * 1. Vẽ đồng xu vàng 3D ánh kim (Không dùng Unicode emoji để chống lỗi ▯ trên hệ điều hành)
 */
function drawVectorCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number = 8) {
  ctx.save();
  // Bóng đổ nhẹ
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(x + 1, y + 1.5, r, 0, Math.PI * 2);
  ctx.fill();

  // Vành ngoài vàng gradient
  const goldGrad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.3, '#facc15');
  goldGrad.addColorStop(0.7, '#eab308');
  goldGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Viền vàng đậm 3D
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Vòng tròn kim loại bên trong
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  // Rãnh giữa đồng xu
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(x - 1, y - r * 0.45, 2, r * 0.9);

  // Đốm sáng phản quang (Shimmer highlight)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 2. Vẽ huy hiệu khuôn mặt Mario Vector cho Sidebar bên phải (thay thế emoji 👦)
 */
function drawMarioAvatarBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  form: MarioForm,
  isStar: boolean,
  now: number
) {
  ctx.save();
  // Vòng hào quang ngoài
  const badgeGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  if (isStar) {
    const hue = (Math.floor(now / 40) * 45) % 360;
    badgeGrad.addColorStop(0, `hsl(${hue}, 100%, 75%)`);
    badgeGrad.addColorStop(1, `hsl(${(hue + 40) % 360}, 100%, 45%)`);
  } else if (form === 'fire') {
    badgeGrad.addColorStop(0, '#fee2e2');
    badgeGrad.addColorStop(1, '#ef4444');
  } else if (form === 'super') {
    badgeGrad.addColorStop(0, '#dbeafe');
    badgeGrad.addColorStop(1, '#2563eb');
  } else {
    badgeGrad.addColorStop(0, '#fed7aa');
    badgeGrad.addColorStop(1, '#ea580c');
  }
  ctx.fillStyle = badgeGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Clip vùng vẽ khuôn mặt Mario bên trong
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
  ctx.clip();

  const capColor = isStar ? '#facc15' : form === 'fire' ? '#ffffff' : '#dc2626';
  const shirtColor = isStar ? '#60a5fa' : form === 'fire' ? '#ffffff' : '#dc2626';

  // Áo / cổ áo
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.85, r * 0.8, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mặt đào hồng hào
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Mũ thợ sửa ống nước
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.35, r * 0.65, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - r * 0.5, cy - r * 0.15, r * 1.1, r * 0.22);

  // Huy hiệu M trên mũ
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.45, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.font = `bold ${Math.round(r * 0.28)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', cx, cy - r * 0.43);

  // Mũi to tròn
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(cx + r * 0.15, cy + r * 0.1, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Ria mép cánh bướm huyền thoại
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.32, r * 0.42, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mắt xanh hoạt hình
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx - r * 0.12, cy - r * 0.02, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.14, cy - r * 0.05, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

/**
 * 3. Vẽ nhân vật Mario chi tiết chuẩn người thật (Giải phẫu đầy đủ, ria mép, nếp quần yếm, giày da bò)
 */
function drawDetailedMario(
  ctx: CanvasRenderingContext2D,
  m: {
    w: number;
    h: number;
    vx: number;
    vy: number;
    isGrounded: boolean;
    isCrouching: boolean;
    isSkidding: boolean;
    animFrame: number;
    isDead?: boolean;
  },
  form: MarioForm,
  isStar: boolean,
  now: number
) {
  const isSuper = form !== 'small';
  const scale = isSuper ? 1.35 : 1.0;

  // Xoay vòng màu sắc khi bất tử Star
  const starHue = isStar ? (Math.floor(now / 40) * 45) % 360 : null;
  const capColor = starHue !== null ? `hsl(${starHue}, 100%, 50%)` : form === 'fire' ? '#ffffff' : '#dc2626';
  const capShadow = starHue !== null ? `hsl(${starHue}, 100%, 40%)` : form === 'fire' ? '#cbd5e1' : '#991b1b';
  const shirtColor = starHue !== null ? `hsl(${starHue}, 100%, 50%)` : form === 'fire' ? '#ffffff' : '#dc2626';
  const shirtShadow = starHue !== null ? `hsl(${starHue}, 100%, 38%)` : form === 'fire' ? '#94a3b8' : '#991b1b';
  const overallsColor = starHue !== null ? `hsl(${(starHue + 180) % 360}, 100%, 50%)` : form === 'fire' ? '#dc2626' : '#2563eb';
  const overallsShadow = starHue !== null ? `hsl(${(starHue + 180) % 360}, 100%, 35%)` : form === 'fire' ? '#991b1b' : '#1d4ed8';

  const skinColor = '#fed7aa';
  const skinShadow = '#ea580c';
  const hairColor = '#451a03';
  const mustacheColor = '#1c1917';
  const bootColor = '#78350f';
  const bootShadow = '#451a03';

  ctx.save();
  ctx.scale(scale, scale);

  // Tư thế cúi người
  if (m.isCrouching) {
    ctx.scale(1, 0.7);
    ctx.translate(0, 10);
  }

  // Tư thế phanh trượt (skid)
  if (m.isSkidding) {
    ctx.rotate(-0.15);
  }

  const isJumping = !m.isGrounded && !m.isDead;
  const isRunning = m.isGrounded && Math.abs(m.vx) > 0.5 && !m.isDead;

  // A. CÁNH TAY & GĂNG TAY PHÍA SAU
  ctx.save();
  if (isJumping) {
    ctx.fillStyle = shirtShadow;
    ctx.beginPath();
    ctx.ellipse(-14, 2, 5, 8, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-17, 9, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (isRunning) {
    const armSwing = Math.sin((m.animFrame * Math.PI) / 2);
    ctx.fillStyle = shirtShadow;
    ctx.beginPath();
    ctx.ellipse(-8 + armSwing * 6, 4, 4.5, 7, -armSwing * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-8 + armSwing * 9, 10, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = shirtShadow;
    ctx.beginPath();
    ctx.ellipse(-7, 6, 4, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-7, 12, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // B. CHÂN & ỦNG DA BÒ
  ctx.save();
  if (isJumping) {
    // Chân sau co lại, chân trước duỗi hướng tới
    ctx.fillStyle = overallsShadow;
    ctx.beginPath();
    ctx.ellipse(-7, 14, 5, 8, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-15, 17, 10, 8, 3);
    ctx.fill();

    ctx.fillStyle = overallsColor;
    ctx.beginPath();
    ctx.ellipse(6, 13, 6, 8, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(5, 17, 12, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(5, 23, 12, 2.5);
  } else if (m.isSkidding) {
    ctx.fillStyle = overallsColor;
    ctx.fillRect(-8, 10, 16, 8);
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-8, 16, 18, 9, 3);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-8, 23, 18, 2.5);
  } else if (isRunning) {
    const legPhase = m.animFrame % 4;
    let leftLegX = -5, rightLegX = 5, leftLegY = 18, rightLegY = 18;
    if (legPhase === 1) {
      leftLegX = -9; leftLegY = 15;
      rightLegX = 7; rightLegY = 19;
    } else if (legPhase === 3) {
      leftLegX = 8; leftLegY = 15;
      rightLegX = -8; rightLegY = 19;
    }
    ctx.fillStyle = overallsShadow;
    ctx.beginPath();
    ctx.ellipse(leftLegX, 13, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = overallsColor;
    ctx.beginPath();
    ctx.ellipse(rightLegX, 13, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bootShadow;
    ctx.beginPath();
    ctx.roundRect(leftLegX - 5, leftLegY, 11, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(leftLegX - 5, leftLegY + 6, 11, 2);

    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(rightLegX - 5, rightLegY, 11, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(rightLegX - 5, rightLegY + 6, 11, 2);
  } else {
    ctx.fillStyle = overallsColor;
    ctx.fillRect(-8, 10, 16, 8);
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-10, 17, 10, 8, 3);
    ctx.roundRect(1, 17, 10, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-10, 23, 10, 2);
    ctx.fillRect(1, 23, 10, 2);
  }
  ctx.restore();

  // C. THÂN MÌNH (ÁO & QUẦN YẾM DENIM)
  ctx.save();
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(-8, 0, 16, 12, 4);
  ctx.fill();

  ctx.fillStyle = overallsColor;
  ctx.beginPath();
  ctx.roundRect(-7, 3, 14, 11, [2, 2, 4, 4]);
  ctx.fill();

  ctx.fillStyle = overallsColor;
  ctx.fillRect(1, 0, 4.5, 9);
  ctx.fillStyle = overallsShadow;
  ctx.fillRect(-5.5, 0, 4, 9);

  // Cúc kim loại vàng óng
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(3.2, 5.5, 2, 0, Math.PI * 2);
  ctx.arc(-3.5, 5.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(2.5, 4.8, 1.2, 1.2);
  ctx.restore();

  // D. CÁNH TAY TRƯỚC & GĂNG TAY TRẮNG
  ctx.save();
  if (isJumping) {
    // Nắm đấm vươn lên trời kinh điển
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.ellipse(3, -10, 5, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -18, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(2, -18, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (isRunning) {
    const armSwing = Math.sin((m.animFrame * Math.PI) / 2);
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.ellipse(6 - armSwing * 6, 4, 4.5, 7, armSwing * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6 - armSwing * 8, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(6 - armSwing * 8 - 2, 9, 4, 2);
  } else {
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.ellipse(6, 4, 4.5, 6.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // E. KHUÔN MẶT, MŨ NỒI, RIA MÉP & MẮT ANIME
  ctx.save();
  const headY = -10;

  // Lọn tóc nâu sẫm sau gáy
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(-8, headY + 3, 5, 0, Math.PI * 2);
  ctx.arc(-9, headY + 7, 4, 0, Math.PI * 2);
  ctx.fill();

  // Khuôn mặt bầu bĩnh màu đào
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.ellipse(0, headY + 1, 9, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Má ửng hồng
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.beginPath();
  ctx.arc(-1, headY + 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Vành tai
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(-6.5, headY + 1, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Lọn tóc mai
  ctx.fillStyle = hairColor;
  ctx.fillRect(-5, headY - 3, 2.5, 5);

  // Đôi mắt hoạt hình lớn có hồn
  if (m.isDead) {
    // Mắt 'X' khi trúng đòn
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, headY - 4); ctx.lineTo(6, headY + 2);
    ctx.moveTo(6, headY - 4); ctx.lineTo(2, headY + 2);
    ctx.stroke();
  } else {
    // Tròng trắng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, headY - 1, 3.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Tròng xanh biếc
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(4, headY - 1, 2.2, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Con ngươi đen
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(4.4, headY - 1, 1.4, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đốm sáng phản chiếu (Catchlight)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.6, headY - 2.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chiếc mũi cà chua to tròn có highlight
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(8.5, headY + 1, 4.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(9.2, headY - 0.5, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Bộ ria mép cánh bướm dày dặn uốn lượn
  ctx.fillStyle = mustacheColor;
  ctx.beginPath();
  ctx.moveTo(0, headY + 4);
  ctx.quadraticCurveTo(5, headY + 1.5, 9, headY + 3.5);
  ctx.quadraticCurveTo(12, headY + 4.5, 10, headY + 7);
  ctx.quadraticCurveTo(6, headY + 8, 3, headY + 6.5);
  ctx.quadraticCurveTo(0, headY + 8, -3, headY + 5.5);
  ctx.closePath();
  ctx.fill();

  // Mũ nồi thợ sửa ống nước 3D
  // Đổ bóng vành mũ lên trán
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-2, headY - 5, 12, 3);

  // Vành lưỡi trai nhô ra phía trước
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.roundRect(-2, headY - 7, 14, 4.5, [1, 3, 3, 1]);
  ctx.fill();
  ctx.fillStyle = capShadow;
  ctx.fillRect(-2, headY - 3.5, 14, 1.2);

  // Vòm mũ cong mềm
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.ellipse(0, headY - 9, 12, 7.5, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Highlight vòm mũ
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(-2, headY - 12.5, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Huy hiệu tròn trắng chữ M
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(1.5, headY - 10, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = capShadow;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 5.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 1.5, headY - 9.5);

  ctx.restore();

  // F. HIỆU ỨNG SAO BẤT TỬ ORBITING GLINTS
  if (isStar) {
    ctx.save();
    for (let sp = 0; sp < 4; sp++) {
      const angle = (now * 0.006 + sp * (Math.PI / 2)) % (Math.PI * 2);
      const orbitR = 18;
      const px = Math.cos(angle) * orbitR;
      const py = Math.sin(angle) * orbitR * 0.6 - 4;
      ctx.fillStyle = sp % 2 === 0 ? '#facc15' : '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 4. Hậu cảnh thiên nhiên sống động, triệt tiêu hoàn toàn lỗi chóp núi lơ lửng
 */
function drawBackgroundScene(
  ctx: CanvasRenderingContext2D,
  stage: number,
  camX: number,
  worldLen: number
) {
  if (stage === 4) {
    // Màn 4: Pháo đài dung nham rực lửa
    const lavaSky = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    lavaSky.addColorStop(0, '#090408');
    lavaSky.addColorStop(0.5, '#1e0816');
    lavaSky.addColorStop(1, '#450a0a');
    ctx.fillStyle = lavaSky;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.fillStyle = '#18181b';
    for (let i = 0; i < 6; i++) {
      const fx = ((i * 320 - camX * 0.25) % (worldLen + 400) + (worldLen + 400)) % (worldLen + 400) - 200;
      ctx.fillRect(fx, 180, 240, GROUND_Y - 180);
      for (let c = 0; c < 5; c++) {
        ctx.fillRect(fx + c * 48, 160, 28, 20);
      }
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(fx + 60, 240, 24, 36);
      ctx.fillRect(fx + 150, 240, 24, 36);
      ctx.fillStyle = '#18181b';
    }
    return;
  }

  if (stage === 2) {
    // Màn 2: Động thạch nhũ băng lam ngầm
    const caveGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    caveGrad.addColorStop(0, '#020617');
    caveGrad.addColorStop(0.6, '#07162c');
    caveGrad.addColorStop(1, '#0c274c');
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.fillStyle = '#1e293b';
    for (let i = 0; i < 16; i++) {
      const cx = ((i * 180 - camX * 0.2) % (worldLen + 300) + (worldLen + 300)) % (worldLen + 300) - 100;
      const h = 40 + (i % 4) * 22;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx + 16, h);
      ctx.lineTo(cx + 32, 0);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx + 12, h - 14);
      ctx.lineTo(cx + 16, h);
      ctx.lineTo(cx + 20, h - 14);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
    }
    return;
  }

  // Màn 1 & 3: Bầu trời xanh nhiệt đới gradient & Dãy núi tuyết nguyên khối
  const skyGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
  skyGrad.addColorStop(0, '#0284c7');
  skyGrad.addColorStop(0.35, '#38bdf8');
  skyGrad.addColorStop(0.75, '#7dd3fc');
  skyGrad.addColorStop(1, '#bae6fd');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  const wrapLimit = worldLen + 500;

  // 1. DÃY NÚI TUYẾT NGUYÊN KHỐI NẰM TRÊN MẶT ĐẤT (KHÔNG CÒN LƠ LỬNG)
  for (let i = 0; i < 5; i++) {
    const rawX = i * 520 - camX * 0.12;
    const mX = ((rawX % wrapLimit) + wrapLimit) % wrapLimit - 150;
    const peakY = 140 + (i % 2) * 35;
    const baseW = 340;
    const peakX = mX + baseW * 0.45;

    // Sườn núi đổ bóng (bên phải)
    ctx.fillStyle = '#3b5266';
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(mX + baseW, GROUND_Y);
    ctx.lineTo(peakX, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Sườn núi đón sáng (bên trái)
    ctx.fillStyle = '#5c7c99';
    ctx.beginPath();
    ctx.moveTo(mX, GROUND_Y);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(peakX, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Chóp tuyết dính liền thân đỉnh núi (Snowcap Liền Khối)
    const snowH = 60;
    const snowY = peakY + snowH;

    // Chóp tuyết bóng đổ
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(peakX + snowH * 0.9, snowY);
    ctx.lineTo(peakX + snowH * 0.6, snowY - 10);
    ctx.lineTo(peakX + snowH * 0.3, snowY + 5);
    ctx.lineTo(peakX, snowY - 6);
    ctx.closePath();
    ctx.fill();

    // Chóp tuyết sáng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(peakX, snowY - 6);
    ctx.lineTo(peakX - snowH * 0.35, snowY + 4);
    ctx.lineTo(peakX - snowH * 0.65, snowY - 8);
    ctx.lineTo(peakX - snowH * 0.95, snowY);
    ctx.closePath();
    ctx.fill();
  }

  // 2. ĐỒI CỎ TRÒN XANH SUPER MARIO CÓ MẮT CƯỜI
  for (let i = 0; i < 6; i++) {
    const rawX = i * 440 - camX * 0.25;
    const hillX = ((rawX % wrapLimit) + wrapLimit) % wrapLimit - 120;
    const hillR = 120 + (i % 3) * 20;
    const hillH = 90 + (i % 3) * 15;

    // Đồi cỏ xanh
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(hillX, GROUND_Y, hillR, hillH, 0, Math.PI, 0);
    ctx.fill();

    // Sọc cỏ đổ bóng đặc trưng Super Mario
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(hillX - hillR * 0.35, GROUND_Y - 25, 18, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(hillX + hillR * 0.38, GROUND_Y - 35, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt hoạt hình Super Mario trên đồi cỏ
    const eyeY = GROUND_Y - hillH * 0.65;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(hillX - 8, eyeY, 4.5, 12, 2);
    ctx.roundRect(hillX + 5, eyeY, 4.5, 12, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hillX - 7, eyeY + 1, 2.5, 4);
    ctx.fillRect(hillX + 6, eyeY + 1, 2.5, 4);
  }

  // 3. MÂY TRẮNG BỒNG BỀNH CÓ MẮT CƯỜI
  for (let i = 0; i < 7; i++) {
    const rawX = i * 360 - camX * 0.18;
    const cX = ((rawX % wrapLimit) + wrapLimit) % wrapLimit - 100;
    const cY = 60 + (i % 3) * 45;

    // Bóng mây xanh lam nhạt dưới đáy
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cX, cY + 3, 26, 0, Math.PI * 2);
    ctx.arc(cX + 24, cY - 10, 32, 0, Math.PI * 2);
    ctx.arc(cX + 54, cY + 3, 26, 0, Math.PI * 2);
    ctx.fill();

    // Khối mây trắng tinh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cX, cY, 26, 0, Math.PI * 2);
    ctx.arc(cX + 24, cY - 14, 32, 0, Math.PI * 2);
    ctx.arc(cX + 54, cY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt mây thân thiện
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cX + 16, cY - 8, 3.8, 10, 2);
    ctx.roundRect(cX + 32, cY - 8, 3.8, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cX + 17, cY - 7, 2, 3.5);
    ctx.fillRect(cX + 33, cY - 7, 2, 3.5);
  }

  // 4. BỤI CÂY VEN ĐƯỜNG CÓ QUẢ MỌNG ĐỎ
  for (let i = 0; i < 8; i++) {
    const rawX = i * 380 - camX * 0.45;
    const bx = ((rawX % wrapLimit) + wrapLimit) % wrapLimit - 80;

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(bx, GROUND_Y - 5, 18, 0, Math.PI * 2);
    ctx.arc(bx + 20, GROUND_Y - 12, 22, 0, Math.PI * 2);
    ctx.arc(bx + 40, GROUND_Y - 5, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bx + 12, GROUND_Y - 14, 3, 0, Math.PI * 2);
    ctx.arc(bx + 28, GROUND_Y - 17, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 5. Vẽ địa hình mặt đất sa thạch 2 tầng (Xóa bỏ hoàn toàn hình ảnh hàng rào gỗ)
 */
function drawGroundTerrain(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  renderY: number,
  stage: number
) {
  if (stage === 4) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(b.x, renderY, b.w, b.h);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, renderY, b.w, 48);
    ctx.strokeRect(b.x - 24, renderY + 48, b.w, 52);
    return;
  }

  if (stage === 2) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(b.x, renderY, b.w, b.h);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, renderY, b.w, 48);
    ctx.strokeRect(b.x - 24, renderY + 48, b.w, 52);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(b.x + 12, renderY + 18, 4, 4);
    ctx.fillRect(b.x + 32, renderY + 68, 3, 3);
    return;
  }

  // TẦNG 1: KHỐI ĐÁ SA THẠCH CÓ THẢM CỎ HOA VÀNG (Cao 48px)
  const topGrad = ctx.createLinearGradient(b.x, renderY, b.x, renderY + 48);
  topGrad.addColorStop(0, '#b45309');
  topGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = topGrad;
  ctx.fillRect(b.x, renderY, b.w, 48);

  // Vát cạnh 3D (highlight trên/trái, shadow dưới/phải)
  ctx.fillStyle = '#d97706';
  ctx.fillRect(b.x, renderY, b.w, 3);
  ctx.fillRect(b.x, renderY, 3, 48);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(b.x, renderY + 45, b.w, 3);
  ctx.fillRect(b.x + b.w - 3, renderY, 3, 48);

  // Vân đá nứt nhẹ
  ctx.fillStyle = '#78350f';
  ctx.fillRect(b.x + 10, renderY + 24, 3, 2);
  ctx.fillRect(b.x + 32, renderY + 34, 4, 2);

  // Thảm cỏ xanh ngọc dày dặn đỉnh đất
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(b.x, renderY, b.w, 13);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(b.x, renderY, b.w, 2.5);

  // Khóm cỏ nhọn rủ xuống
  ctx.fillStyle = '#16a34a';
  for (let gx = b.x; gx < b.x + b.w; gx += 12) {
    ctx.beginPath();
    ctx.moveTo(gx, renderY + 13);
    ctx.lineTo(gx + 6, renderY + 20);
    ctx.lineTo(gx + 12, renderY + 13);
    ctx.fill();
  }

  // Điểm xuyết hoa cúc vàng li ti
  if (Math.floor(b.x) % 96 === 0) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(b.x + 22, renderY + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(b.x + 22, renderY + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // TẦNG 2: LỚP ĐẤT NGẦM SO LE 24PX (Không thẳng hàng cột dọc = không còn giống hàng rào)
  const botGrad = ctx.createLinearGradient(b.x, renderY + 48, b.x, renderY + 100);
  botGrad.addColorStop(0, '#92400e');
  botGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = botGrad;
  ctx.fillRect(b.x, renderY + 48, b.w, 52);

  // Đường mạch rãnh ngang ngăn cách 2 tầng
  ctx.fillStyle = '#451a03';
  ctx.fillRect(b.x, renderY + 47, b.w, 2);

  // Đường rãnh dọc so le tại vị trí b.x + 24
  ctx.fillStyle = '#451a03';
  ctx.fillRect(b.x + 24, renderY + 48, 2, 52);

  // Sỏi cuội đính kèm trong lòng đất
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(b.x + 14, renderY + 70, 4, 0, Math.PI * 2);
  ctx.arc(b.x + 36, renderY + 82, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(b.x + 13, renderY + 69, 1.5, 0, Math.PI * 2);
  ctx.arc(b.x + 35, renderY + 81, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 6. Vẽ đường ống nước 3D và cây ăn thịt Piranha có cuống thân, lá xanh và hàm răng cắn
 */
function drawPipeAndPiranha(
  ctx: CanvasRenderingContext2D,
  p: Pipe,
  marioX: number
) {
  // Cây ăn thịt Piranha
  if (p.hasPiranha) {
    const isMarioNear = Math.abs(marioX - (p.x + p.w / 2)) < 60;
    const peakHeight = 44;
    const animPhase = Math.sin(p.piranhaTimer || 0);
    const plantRise = isMarioNear ? 0 : Math.max(0, animPhase) * peakHeight;
    const plantY = p.y - plantRise;

    if (plantRise > 4) {
      const centerX = p.x + p.w / 2;

      // Cuống thân xanh vươn từ trong lòng ống
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(centerX - 4.5, plantY + 16, 9, p.y - (plantY + 16) + 4);

      // 2 lá xanh đỡ hai bên cuống
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(centerX - 13, plantY + 22, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(centerX + 13, plantY + 22, 10, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Đầu hoa nụ đỏ Venus Flytrap có hàm răng nhọn
      const mouthOpen = Math.abs(Math.sin((p.piranhaTimer || 0) * 3)) * 0.35 + 0.1;

      // Họng hoa đỏ sẫm
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(centerX, plantY + 10, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hàm trên đỏ chấm bi trắng
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(centerX, plantY + 8 - mouthOpen * 8, 16, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 7, plantY + 2 - mouthOpen * 8, 3.2, 0, Math.PI * 2);
      ctx.arc(centerX + 6, plantY + 1 - mouthOpen * 8, 3, 0, Math.PI * 2);
      ctx.arc(centerX, plantY - 2 - mouthOpen * 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Răng nhọn hàm trên
      ctx.fillStyle = '#ffffff';
      for (let t = -3; t <= 3; t += 2) {
        ctx.beginPath();
        ctx.moveTo(centerX + t * 3.5, plantY + 8 - mouthOpen * 8);
        ctx.lineTo(centerX + t * 3.5 + 2, plantY + 12 - mouthOpen * 8);
        ctx.lineTo(centerX + t * 3.5 + 4, plantY + 8 - mouthOpen * 8);
        ctx.fill();
      }

      // Hàm dưới đỏ
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(centerX, plantY + 12 + mouthOpen * 8, 14, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 5, plantY + 18 + mouthOpen * 8, 2.8, 0, Math.PI * 2);
      ctx.arc(centerX + 6, plantY + 17 + mouthOpen * 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Răng nhọn hàm dưới
      ctx.fillStyle = '#ffffff';
      for (let t = -2; t <= 2; t += 2) {
        ctx.beginPath();
        ctx.moveTo(centerX + t * 3.5, plantY + 12 + mouthOpen * 8);
        ctx.lineTo(centerX + t * 3.5 + 2, plantY + 8 + mouthOpen * 8);
        ctx.lineTo(centerX + t * 3.5 + 4, plantY + 12 + mouthOpen * 8);
        ctx.fill();
      }
    }
  }

  // Thân ống & Miệng vành ống nước 3D
  const collarH = 26;
  const collarW = p.w + 8;
  const collarX = p.x - 4;

  // Lòng ống sâu đen huyền bí
  ctx.fillStyle = '#052e16';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 4, p.w / 2, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thân ống nước hình trụ 3D
  const bodyGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
  bodyGrad.addColorStop(0, '#15803d');
  bodyGrad.addColorStop(0.18, '#4ade80');
  bodyGrad.addColorStop(0.35, '#86efac');
  bodyGrad.addColorStop(0.65, '#22c55e');
  bodyGrad.addColorStop(1, '#14532d');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(p.x + 3, p.y + collarH, p.w - 6, p.h - collarH);

  // Vành miệng cống
  const collarGrad = ctx.createLinearGradient(collarX, p.y, collarX + collarW, p.y);
  collarGrad.addColorStop(0, '#15803d');
  collarGrad.addColorStop(0.18, '#4ade80');
  collarGrad.addColorStop(0.35, '#86efac');
  collarGrad.addColorStop(0.65, '#22c55e');
  collarGrad.addColorStop(1, '#14532d');
  ctx.fillStyle = collarGrad;
  ctx.beginPath();
  ctx.roundRect(collarX, p.y, collarW, collarH, 3);
  ctx.fill();

  // Đường viền kim loại
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(collarX, p.y, collarW, collarH);
  ctx.strokeRect(p.x + 3, p.y + collarH, p.w - 6, p.h - collarH);

  // Vệt phản quang ánh kim chạy dọc
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(collarX + collarW * 0.28, p.y + 2, 4, collarH - 4);
  ctx.fillRect(p.x + p.w * 0.28, p.y + collarH + 2, 3.5, p.h - collarH - 4);
}

/**
 * 7. Vẽ khối gạch hỏi chấm [?] mạ vàng 3D và khối gạch nung
 */
function drawQuestionBlock(
  ctx: CanvasRenderingContext2D,
  b: Block,
  renderY: number,
  now: number
) {
  const qGrad = ctx.createLinearGradient(b.x, renderY, b.x + b.w, renderY + b.h);
  qGrad.addColorStop(0, '#fef08a');
  qGrad.addColorStop(0.3, '#facc15');
  qGrad.addColorStop(0.7, '#eab308');
  qGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = qGrad;
  ctx.beginPath();
  ctx.roundRect(b.x, renderY, b.w, b.h, 4);
  ctx.fill();

  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(b.x, renderY, b.w, b.h);

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b.x + 3, renderY + 3, b.w - 6, b.h - 6);

  // 4 đinh tán góc
  ctx.fillStyle = '#713f12';
  ctx.fillRect(b.x + 5, renderY + 5, 4, 4);
  ctx.fillRect(b.x + b.w - 9, renderY + 5, 4, 4);
  ctx.fillRect(b.x + 5, renderY + b.h - 9, 4, 4);
  ctx.fillRect(b.x + b.w - 9, renderY + b.h - 9, 4, 4);

  // Ánh kim phản quang di chuyển
  const glintPos = (now * 0.05) % (b.w * 3);
  ctx.save();
  ctx.beginPath();
  ctx.rect(b.x, renderY, b.w, b.h);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.moveTo(b.x - 20 + glintPos, renderY);
  ctx.lineTo(b.x - 5 + glintPos, renderY);
  ctx.lineTo(b.x - 25 + glintPos, renderY + b.h);
  ctx.lineTo(b.x - 40 + glintPos, renderY + b.h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Dấu hỏi ? dập nổi 3D
  ctx.fillStyle = '#713f12';
  ctx.font = 'black 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', b.x + b.w / 2 + 1.5, renderY + b.h / 2 + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('?', b.x + b.w / 2, renderY + b.h / 2);
}

function drawBrickBlock(
  ctx: CanvasRenderingContext2D,
  b: Block,
  renderY: number,
  stage: number
) {
  ctx.fillStyle = stage === 4 ? '#991b1b' : stage === 2 ? '#334155' : '#b45309';
  ctx.fillRect(b.x, renderY, b.w, b.h);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(b.x, renderY, b.w, b.h);

  // Mạch vữa phân chia 4 viên gạch nhỏ
  ctx.beginPath();
  ctx.moveTo(b.x, renderY + b.h / 2);
  ctx.lineTo(b.x + b.w, renderY + b.h / 2);
  ctx.moveTo(b.x + b.w / 2, renderY);
  ctx.lineTo(b.x + b.w / 2, renderY + b.h / 2);
  ctx.moveTo(b.x + b.w / 4, renderY + b.h / 2);
  ctx.lineTo(b.x + b.w / 4, renderY + b.h);
  ctx.moveTo(b.x + (b.w * 3) / 4, renderY + b.h / 2);
  ctx.lineTo(b.x + (b.w * 3) / 4, renderY + b.h);
  ctx.stroke();

  // Highlight vát 3D trên viên gạch
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(b.x + 2, renderY + 2, b.w / 2 - 4, 3);
  ctx.fillRect(b.x + b.w / 2 + 2, renderY + 2, b.w / 2 - 4, 3);
}

/**
 * Vẽ khối đá bậc thang kim tự tháp (Hard Stone Pyramid Block)
 */
function drawHardBlock(
  ctx: CanvasRenderingContext2D,
  b: Block,
  renderY: number,
  stage: number
) {
  const baseColor = stage === 4 ? '#450a0a' : stage === 2 ? '#1e293b' : '#334155';
  const highlightColor = stage === 4 ? '#7f1d1d' : stage === 2 ? '#475569' : '#64748b';
  const shadowColor = stage === 4 ? '#1a0505' : stage === 2 ? '#0f172a' : '#1e293b';

  // Thân khối đá vững chắc
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(b.x, renderY, b.w, b.h, 4);
  ctx.fill();

  // Viền nổi khối 3D vát cạnh (Bevel 3D)
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = highlightColor;
  ctx.beginPath();
  ctx.moveTo(b.x, renderY + b.h);
  ctx.lineTo(b.x, renderY);
  ctx.lineTo(b.x + b.w, renderY);
  ctx.stroke();

  ctx.strokeStyle = shadowColor;
  ctx.beginPath();
  ctx.moveTo(b.x + b.w, renderY);
  ctx.lineTo(b.x + b.w, renderY + b.h);
  ctx.lineTo(b.x, renderY + b.h);
  ctx.stroke();

  // Lòng đá chìm
  ctx.fillStyle = shadowColor;
  ctx.fillRect(b.x + 5, renderY + 5, b.w - 10, b.h - 10);
  ctx.fillStyle = baseColor;
  ctx.fillRect(b.x + 7, renderY + 7, b.w - 14, b.h - 14);

  // 4 đinh tán kim loại ở 4 góc khối đá
  const rivets = [
    { x: b.x + 8, y: renderY + 8 },
    { x: b.x + b.w - 12, y: renderY + 8 },
    { x: b.x + 8, y: renderY + b.h - 12 },
    { x: b.x + b.w - 12, y: renderY + b.h - 12 },
  ];
  ctx.fillStyle = '#94a3b8';
  rivets.forEach(rv => {
    ctx.fillRect(rv.x, rv.y, 4, 4);
  });
}

/**
 * 8. Vẽ Goomba nấm hạt dẻ chân thật có răng nanh và bước đi lắc lư
 */
function drawGoomba(ctx: CanvasRenderingContext2D, en: Enemy, now: number) {
  if (en.isStomped) {
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(en.x, en.y + en.h - 14, en.w, 14, 4);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeText('x   x', en.x + 8, en.y + en.h - 4);
    return;
  }

  // Bước đi lắc lư
  const waddle = Math.sin(now * 0.012);
  const leftFootY = en.y + en.h - 10 + (waddle > 0 ? -3 : 0);
  const rightFootY = en.y + en.h - 10 + (waddle < 0 ? -3 : 0);

  // Chân da nâu
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.roundRect(en.x + 2, leftFootY, 14, 10, 4);
  ctx.roundRect(en.x + en.w - 16, rightFootY, 14, 10, 4);
  ctx.fill();

  // Thân / cổ màu be
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(en.x + 7, en.y + 16, en.w - 14, 20, 6);
  ctx.fill();

  // Mũ nấm hạt dẻ cong mềm
  const capGrad = ctx.createRadialGradient(
    en.x + en.w / 2,
    en.y + 12,
    4,
    en.x + en.w / 2,
    en.y + 18,
    22
  );
  capGrad.addColorStop(0, '#b45309');
  capGrad.addColorStop(0.7, '#78350f');
  capGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(en.x, en.y + 26);
  ctx.quadraticCurveTo(en.x + en.w / 2, en.y - 2, en.x + en.w, en.y + 26);
  ctx.quadraticCurveTo(en.x + en.w / 2, en.y + 32, en.x, en.y + 26);
  ctx.closePath();
  ctx.fill();

  // Lông mày góc cạnh hung dữ
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(en.x + 9, en.y + 18);
  ctx.lineTo(en.x + 18, en.y + 23);
  ctx.lineTo(en.x + 9, en.y + 21);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(en.x + en.w - 9, en.y + 18);
  ctx.lineTo(en.x + en.w - 18, en.y + 23);
  ctx.lineTo(en.x + en.w - 9, en.y + 21);
  ctx.fill();

  // Mắt hoạt hình lớn
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(en.x + 13, en.y + 25, 3.5, 5.5, -0.15, 0, Math.PI * 2);
  ctx.ellipse(en.x + en.w - 13, en.y + 25, 3.5, 5.5, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(en.x + 14, en.y + 25, 2, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(en.x + en.w - 14, en.y + 25, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Răng nanh trắng nhô lên
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(en.x + 10, en.y + 36);
  ctx.lineTo(en.x + 13, en.y + 30);
  ctx.lineTo(en.x + 16, en.y + 36);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(en.x + en.w - 16, en.y + 36);
  ctx.lineTo(en.x + en.w - 13, en.y + 30);
  ctx.lineTo(en.x + en.w - 10, en.y + 36);
  ctx.fill();
}

/**
 * 9. Vẽ rùa Koopa Troopa
 */
function drawKoopa(ctx: CanvasRenderingContext2D, en: Enemy, now: number) {
  if (en.isShell) {
    ctx.save();
    ctx.translate(en.x + en.w / 2, en.y + en.h / 2);
    if (Math.abs(en.shellSpeed || 0) > 0) {
      ctx.rotate((now * 0.02) % (Math.PI * 2));
    }
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(en.x + en.w / 2, en.y + en.h / 2);
  if (en.facing === 'left') ctx.scale(-1, 1);

  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(-2, 2, 16, 20, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(8, -12, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(15, -9, 7, 4.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(9, -14, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(10, -14, 2, 0, Math.PI * 2);
  ctx.fill();

  const walkPhase = Math.sin(now * 0.015);
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.roundRect(-8 + walkPhase * 4, 18, 12, 8, 3);
  ctx.roundRect(2 - walkPhase * 4, 18, 12, 8, 3);
  ctx.fill();

  ctx.restore();
}

export const GameMario: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái màn chơi
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'stage_clear' | 'game_over'>('playing');
  const currentWorld = 1;
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_mario_highscore') || '25000', 10);
    } catch {
      return 25000;
    }
  });
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [marioForm, setMarioForm] = useState<MarioForm>('small');
  const [isStarInvincible, setIsStarInvincible] = useState<boolean>(false);

  // Refs độc lập cho game loop 60 FPS
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const coinsRef = useRef(coins);
  const livesRef = useRef(lives);
  const marioFormRef = useRef<MarioForm>('small');
  const isStarRef = useRef(false);
  const starTimerRef = useRef(0);
  const invulnerableTimerRef = useRef(0);
  const cameraXRef = useRef(0);
  const worldLengthRef = useRef(3800);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { marioFormRef.current = marioForm; }, [marioForm]);
  useEffect(() => { isStarRef.current = isStarInvincible; }, [isStarInvincible]);

  // Player Mario Ref
  const marioRef = useRef({
    x: 100,
    y: GROUND_Y - 54,
    w: 36,
    h: 54,
    vx: 0,
    vy: 0,
    isGrounded: false,
    facing: 'right' as 'left' | 'right',
    isCrouching: false,
    isSkidding: false,
    isRunning: false,
    isDead: false,
    deathVy: 0,
    animFrame: 0,
    animTimer: 0,
    isFlagpoleSliding: false,
    walkToCastle: false,
  });

  // World objects
  const blocksRef = useRef<Block[]>([]);
  const pipesRef = useRef<Pipe[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const fireballsRef = useRef<Fireball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);
  const flagpoleRef = useRef({ x: 3400, y: 120, h: 320, flagY: 130 });
  const castleRef = useRef({ x: 3560, y: 200, w: 240, h: 240, hasFlag: false, castleFlagY: 200 });
  const axeRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const bridgeBlocksRef = useRef<Block[]>([]);

  // Key tracking
  const keysRef = useRef({
    left: false,
    right: false,
    down: false,
    up: false,
    jump: false,
    dash: false,
  });

  // Helper sinh hiệu ứng hạt
  const addParticles = (x: number, y: number, count: number, color: string, isBrick: boolean = false) => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = isBrick ? Math.random() * 7 + 3 : Math.random() * 5 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (isBrick ? 5 : 2.5),
        radius: isBrick ? Math.random() * 5 + 4 : Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: isBrick ? 50 : 35,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        isBrickPiece: isBrick,
      });
    }
  };

  // Helper sinh chữ nổi bay lên
  const addFloater = (x: number, y: number, text: string, color: string = '#fef08a') => {
    floatersRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.8,
      life: 0,
    });
  };

  // Thêm điểm
  const addScore = useCallback((pts: number, x?: number, y?: number) => {
    scoreRef.current += pts;
    setScore(scoreRef.current);
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      try {
        localStorage.setItem('acegames_mario_highscore', scoreRef.current.toString());
      } catch {}
    }
    if (x !== undefined && y !== undefined) {
      addFloater(x, y, `+${pts}`);
    }
  }, [highScore]);

  // Nhặt xu vàng
  const addCoin = useCallback((x: number, y: number) => {
    coinsRef.current += 1;
    setCoins(coinsRef.current);
    soundManager.playMarioCoin();
    addScore(200, x, y);
    addParticles(x, y, 10, '#facc15');

    if (coinsRef.current % 100 === 0) {
      livesRef.current += 1;
      setLives(livesRef.current);
      addFloater(x, y - 24, '1-UP!', '#4ade80');
      soundManager.playMarioPowerup();
    }
  }, [addScore]);

  // Xây dựng bản đồ cho từng Màn chơi
  const buildLevel = useCallback((stage: number) => {
    blocksRef.current = [];
    pipesRef.current = [];
    enemiesRef.current = [];
    itemsRef.current = [];
    fireballsRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];

    const levelLen = stage === 4 ? 3400 : 3800;
    worldLengthRef.current = levelLen;

    // 1. Tạo mặt đất liên tục kèm các khe hố
    let curX = 0;
    while (curX < levelLen) {
      const isPit = (stage === 1 && (curX >= 1152 && curX <= 1248 || curX >= 2208 && curX <= 2352)) ||
                    (stage === 2 && (curX >= 864 && curX <= 1008 || curX >= 1920 && curX <= 2112)) ||
                    (stage === 3 && (curX >= 672 && curX <= 864 || curX >= 1536 && curX <= 1776 || curX >= 2592 && curX <= 2832)) ||
                    (stage === 4 && (curX >= 1296 && curX <= 1536 || curX >= 2352 && curX <= 2688));

      const segLen = isPit ? 144 : 288;
      if (!isPit) {
        for (let bx = curX; bx < curX + segLen; bx += BLOCK_SIZE) {
          blocksRef.current.push({
            id: Math.random(),
            x: bx,
            y: GROUND_Y,
            w: BLOCK_SIZE,
            h: 100,
            type: 'ground',
          });
        }
      }
      curX += segLen;
    }

    // 2. Tạo đường ống nước xanh 3D (Pipes)
    if (stage !== 4) {
      const pipeLocs = [
        { x: 576, h: 72, hasPiranha: true },
        { x: 1008, h: 96, hasPiranha: true },
        { x: 1536, h: 120, hasPiranha: true },
        { x: 2544, h: 84, hasPiranha: true },
        { x: 3024, h: 108, hasPiranha: true },
      ];
      pipeLocs.forEach(p => {
        pipesRef.current.push({
          x: p.x,
          y: GROUND_Y - p.h,
          w: 68,
          h: p.h,
          hasPiranha: p.hasPiranha,
          piranhaOffset: 0,
          piranhaDir: 1,
          piranhaTimer: Math.random() * 2,
        });
      });
    }

    // 3. Khối gạch & Khối Hỏi Chấm [?] (Kích thước 48x48)
    const blockLayouts: Array<{ x: number; y: number; type: 'brick' | 'question'; content?: 'coin' | 'mushroom' | 'fireflower' | 'star' }> = [
      { x: 384, y: 300, type: 'question', content: 'coin' },
      { x: 432, y: 300, type: 'brick' },
      { x: 480, y: 300, type: 'question', content: 'mushroom' },
      { x: 528, y: 300, type: 'brick' },
      { x: 576, y: 300, type: 'question', content: 'coin' },

      { x: 768, y: 200, type: 'brick' },
      { x: 816, y: 200, type: 'question', content: 'star' },
      { x: 864, y: 200, type: 'brick' },
      { x: 912, y: 200, type: 'brick' },

      { x: 1392, y: 300, type: 'brick' },
      { x: 1440, y: 300, type: 'question', content: 'fireflower' },
      { x: 1488, y: 300, type: 'brick' },

      { x: 1776, y: 250, type: 'question', content: 'coin' },
      { x: 1824, y: 250, type: 'question', content: 'coin' },
      { x: 1872, y: 250, type: 'question', content: 'mushroom' },

      { x: 3120, y: 392, type: 'hard_block' as any },
      { x: 3168, y: 392, type: 'hard_block' as any },
      { x: 3168, y: 344, type: 'hard_block' as any },
      { x: 3216, y: 392, type: 'hard_block' as any },
      { x: 3216, y: 344, type: 'hard_block' as any },
      { x: 3216, y: 296, type: 'hard_block' as any },
      { x: 3264, y: 392, type: 'hard_block' as any },
      { x: 3264, y: 344, type: 'hard_block' as any },
      { x: 3264, y: 296, type: 'hard_block' as any },
      { x: 3264, y: 248, type: 'hard_block' as any },
    ];

    blockLayouts.forEach(b => {
      blocksRef.current.push({
        id: Math.random(),
        x: b.x,
        y: b.y,
        w: BLOCK_SIZE,
        h: BLOCK_SIZE,
        type: b.type,
        content: b.content,
        coinsLeft: b.content === 'coin' ? 1 : undefined,
      });
    });

    // 4. Kẻ địch kinh điển (Goomba 44x44, Koopa 44x62)
    if (stage !== 4) {
      const enemySpawns = [
        { type: 'goomba' as const, x: 480 },
        { type: 'goomba' as const, x: 864 },
        { type: 'koopa' as const, x: 1200 },
        { type: 'goomba' as const, x: 1440 },
        { type: 'goomba' as const, x: 1500 },
        { type: 'koopa' as const, x: 1968 },
        { type: 'goomba' as const, x: 2496 },
        { type: 'koopa' as const, x: 2928 },
      ];
      enemySpawns.forEach(e => {
        enemiesRef.current.push({
          id: Math.random(),
          type: e.type,
          x: e.x,
          y: GROUND_Y - (e.type === 'koopa' ? 62 : 44),
          w: 44,
          h: e.type === 'koopa' ? 62 : 44,
          vx: -1.3,
          vy: 0,
          isAlive: true,
          facing: 'left',
          animTimer: 0,
        });
      });
    } else {
      // Màn 4: Bowser's Castle & Lava Bridge
      const bridgeStartX = 2450;
      const bridgeLen = 384;
      bridgeBlocksRef.current = [];
      for (let bx = bridgeStartX; bx < bridgeStartX + bridgeLen; bx += BLOCK_SIZE) {
        const blk: Block = {
          id: Math.random(),
          x: bx,
          y: GROUND_Y,
          w: BLOCK_SIZE,
          h: 36,
          type: 'brick',
        };
        blocksRef.current.push(blk);
        bridgeBlocksRef.current.push(blk);
      }

      axeRef.current = {
        x: bridgeStartX + bridgeLen + 24,
        y: GROUND_Y - 60,
        active: true,
      };

      enemiesRef.current.push({
        id: 999,
        type: 'bowser',
        x: bridgeStartX + 160,
        y: GROUND_Y - 104,
        w: 96,
        h: 104,
        vx: -0.8,
        vy: 0,
        isAlive: true,
        facing: 'left',
        animTimer: 0,
        hp: 5,
        shootCooldown: 2.0,
      });
    }

    // 5. Cột cờ và Lâu đài đích đến
    flagpoleRef.current = {
      x: levelLen - 340,
      y: GROUND_Y - 320,
      h: 320,
      flagY: GROUND_Y - 310,
    };
    castleRef.current = {
      x: levelLen - 180,
      y: GROUND_Y - 240,
      w: 240,
      h: 240,
      hasFlag: false,
      castleFlagY: GROUND_Y - 240,
    };

    // Reset vị trí Mario
    const isSuper = marioFormRef.current !== 'small';
    const initH = isSuper ? 76 : 54;
    const initW = isSuper ? 44 : 36;
    marioRef.current = {
      x: 100,
      y: GROUND_Y - initH,
      w: initW,
      h: initH,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      isCrouching: false,
      isSkidding: false,
      isRunning: false,
      isDead: false,
      deathVy: 0,
      animFrame: 0,
      animTimer: 0,
      isFlagpoleSliding: false,
      walkToCastle: false,
    };

    cameraXRef.current = 0;
    setTimeLeft(300);
  }, []);

  // Khởi động ván chơi mới
  const startNewGame = useCallback((stageOverride?: number) => {
    let initLives = 3;
    let initStage = 1;
    let initForm: MarioForm = 'small';

    try {
      const saved = localStorage.getItem('ace_game_settings_mario');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.initialLives) initLives = parsed.initialLives;
        if (parsed.initialStage) initStage = parsed.initialStage;
        if (parsed.initialForm) initForm = parsed.initialForm;
      }
    } catch {}

    const targetStage = stageOverride !== undefined ? stageOverride : initStage;
    setCurrentStage(targetStage);
    setScore(0);
    setCoins(0);
    setLives(initLives);
    livesRef.current = initLives;
    setMarioForm(initForm);
    marioFormRef.current = initForm;
    setIsStarInvincible(false);
    invulnerableTimerRef.current = 0;
    setGameState('playing');
    buildLevel(targetStage);
  }, [buildLevel]);

  // Hồi sinh an toàn khi mất mạng
  const respawnMario = useCallback(() => {
    if (livesRef.current <= 1) {
      setGameState('game_over');
      soundManager.playDefeat();
      return;
    }
    livesRef.current -= 1;
    setLives(livesRef.current);
    setMarioForm('small');
    marioFormRef.current = 'small';
    setIsStarInvincible(false);
    isStarRef.current = false;
    starTimerRef.current = 0;
    invulnerableTimerRef.current = 2.5;

    // Tìm vị trí đất vững an toàn gần Camera nhất (không bao giờ sinh ra trên hố vực)
    let safeX = Math.max(80, cameraXRef.current + 80);
    const groundBlocks = blocksRef.current.filter(b => (b.type === 'ground' || b.type === 'hard_block') && b.y >= GROUND_Y - 20);
    const hasGround = groundBlocks.some(b => safeX + 18 >= b.x && safeX + 18 <= b.x + b.w);
    if (!hasGround && groundBlocks.length > 0) {
      const nearestBlock = groundBlocks.find(b => b.x >= cameraXRef.current) || groundBlocks[0];
      if (nearestBlock) safeX = nearestBlock.x + 12;
    }

    marioRef.current.x = safeX;
    marioRef.current.y = GROUND_Y - 54;
    marioRef.current.w = 36;
    marioRef.current.h = 54;
    marioRef.current.vx = 0;
    marioRef.current.vy = 0;
    marioRef.current.deathVy = 0;
    marioRef.current.isDead = false;
    marioRef.current.isGrounded = true;
  }, []);

  // Xử lý rơi xuống vực sâu (Rơi hố là chết ngay lập tức, xuyên qua cả Ngôi sao Bất tử)
  const killMarioFall = useCallback(() => {
    if (marioRef.current.isDead) return;
    marioRef.current.isDead = true;
    marioRef.current.vx = 0;
    marioRef.current.vy = 0;
    marioRef.current.deathVy = 0;
    setIsStarInvincible(false);
    isStarRef.current = false;
    starTimerRef.current = 0;
    soundManager.playMarioDie();
    setTimeout(respawnMario, 2000);
  }, [respawnMario]);

  // Biến đổi hình thái Mario
  const upgradeMario = (newForm: MarioForm) => {
    setMarioForm(newForm);
    marioFormRef.current = newForm;
    soundManager.playMarioPowerup();
    if (newForm !== 'small') {
      marioRef.current.w = 44;
      marioRef.current.h = 76;
      marioRef.current.y -= 22;
    }
    addFloater(marioRef.current.x + marioRef.current.w / 2, marioRef.current.y - 20, newForm === 'fire' ? 'FIRE MARIO!' : 'SUPER MARIO!', '#fbbf24');
  };

  const damageMario = () => {
    if (invulnerableTimerRef.current > 0 || isStarRef.current || marioRef.current.isDead) return;

    if (marioFormRef.current === 'fire') {
      upgradeMario('super');
      invulnerableTimerRef.current = 2.0;
      soundManager.playMarioPowerdown();
    } else if (marioFormRef.current === 'super') {
      setMarioForm('small');
      marioFormRef.current = 'small';
      marioRef.current.w = 36;
      marioRef.current.h = 54;
      invulnerableTimerRef.current = 2.0;
      soundManager.playMarioPowerdown();
    } else {
      marioRef.current.isDead = true;
      marioRef.current.deathVy = -12;
      soundManager.playMarioDie();
      setTimeout(respawnMario, 2200);
    }
  };

  // Mario bắn cầu lửa
  const shootFireball = () => {
    if (marioFormRef.current !== 'fire' || marioRef.current.isDead) return;
    const activeFireballs = fireballsRef.current.filter(f => !f.isEnemy && f.isAlive).length;
    if (activeFireballs >= 2) return;

    soundManager.playMarioFireball();
    const isRight = marioRef.current.facing === 'right';
    fireballsRef.current.push({
      x: marioRef.current.x + (isRight ? marioRef.current.w + 6 : -12),
      y: marioRef.current.y + 26,
      vx: isRight ? 9.5 : -9.5,
      vy: 3.5,
      radius: 8,
      isAlive: true,
      isEnemy: false,
    });
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        if (!keysRef.current.jump && marioRef.current.isGrounded && !marioRef.current.isDead) {
          marioRef.current.vy = -14.2;
          marioRef.current.isGrounded = false;
          soundManager.playMarioJump(marioFormRef.current !== 'small');
          addParticles(marioRef.current.x + marioRef.current.w / 2, marioRef.current.y + marioRef.current.h, 6, '#cbd5e1');
        }
        keysRef.current.jump = true;
      }
      if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        keysRef.current.dash = true;
        shootFireball();
      }
      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        keysRef.current.jump = false;
        if (marioRef.current.vy < -5.5) {
          marioRef.current.vy = -5.5;
        }
      }
      if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        keysRef.current.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60 FPS Game Engine Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Hỗ trợ High-DPI (Retina)
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const m = marioRef.current;

      // 1. UPDATE LOGIC KHI ĐANG CHƠI
      if (gameStateRef.current === 'playing') {
        if (isStarRef.current) {
          starTimerRef.current -= dt;
          if (starTimerRef.current <= 0) {
            setIsStarInvincible(false);
          }
        }
        if (invulnerableTimerRef.current > 0) {
          invulnerableTimerRef.current -= dt;
        }

        if (m.isDead) {
          m.deathVy += 28 * dt;
          m.y += m.deathVy;
        } else if (m.isFlagpoleSliding) {
          if (m.y < flagpoleRef.current.y + flagpoleRef.current.h - m.h) {
            m.y += 200 * dt;
          } else {
            m.isFlagpoleSliding = false;
            m.walkToCastle = true;
            m.facing = 'right';
          }
        } else if (m.walkToCastle) {
          m.x += 140 * dt;
          m.animTimer += dt * 10;
          m.animFrame = Math.floor(m.animTimer) % 3;
          if (m.x >= castleRef.current.x + castleRef.current.w / 2 - m.w / 2) {
            m.walkToCastle = false;
            castleRef.current.hasFlag = true;
            setGameState('stage_clear');
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            soundManager.playMarioStageClear();
          }
        } else {
          const maxSpeed = keysRef.current.dash ? 6.8 : 4.8;
          const accel = keysRef.current.dash ? 19 : 15;
          const friction = 13;

          m.isCrouching = keysRef.current.down && marioFormRef.current !== 'small';

          if (keysRef.current.left && !m.isCrouching) {
            m.vx = Math.max(m.vx - accel * dt, -maxSpeed);
            m.facing = 'left';
            m.isSkidding = m.vx > 0.8;
          } else if (keysRef.current.right && !m.isCrouching) {
            m.vx = Math.min(m.vx + accel * dt, maxSpeed);
            m.facing = 'right';
            m.isSkidding = m.vx < -0.8;
          } else {
            if (m.vx > 0) m.vx = Math.max(0, m.vx - friction * dt);
            else if (m.vx < 0) m.vx = Math.min(0, m.vx + friction * dt);
            m.isSkidding = false;
          }

          m.vy += 34 * dt;
          if (m.vy > 15) m.vy = 15;

          m.x += m.vx;
          if (m.x < cameraXRef.current) {
            m.x = cameraXRef.current;
            m.vx = 0;
          }

          blocksRef.current.forEach(b => {
            if (m.x + m.w > b.x && m.x < b.x + b.w && m.y + m.h > b.y && m.y < b.y + b.h) {
              if (m.vx > 0) { m.x = b.x - m.w; m.vx = 0; }
              else if (m.vx < 0) { m.x = b.x + b.w; m.vx = 0; }
            }
          });

          pipesRef.current.forEach(p => {
            if (m.x + m.w > p.x && m.x < p.x + p.w && m.y + m.h > p.y && m.y < p.y + p.h) {
              if (m.vx > 0) { m.x = p.x - m.w; m.vx = 0; }
              else if (m.vx < 0) { m.x = p.x + p.w; m.vx = 0; }
            }
          });

          m.y += m.vy;
          m.isGrounded = false;

          blocksRef.current.forEach(b => {
            if (m.x + m.w > b.x + 4 && m.x < b.x + b.w - 4) {
              if (m.vy >= 0 && m.y + m.h >= b.y && m.y + m.h <= b.y + 20) {
                m.y = b.y - m.h;
                m.vy = 0;
                m.isGrounded = true;
              } else if (m.vy < 0 && m.y <= b.y + b.h && m.y >= b.y + b.h - 20) {
                m.y = b.y + b.h;
                m.vy = 2.5;
                b.isHit = true;
                b.hitOffsetY = -10;

                if (b.type === 'question') {
                  b.type = 'empty';
                  soundManager.playMarioBrick();
                  if (b.content === 'coin') {
                    addCoin(b.x + b.w / 2, b.y);
                  } else if (b.content === 'mushroom' || b.content === 'fireflower' || b.content === 'star') {
                    itemsRef.current.push({
                      id: Math.random(),
                      type: b.content === 'mushroom' && marioFormRef.current !== 'small' ? 'fireflower' : b.content,
                      x: b.x + 6,
                      y: b.y - 36,
                      w: 36,
                      h: 36,
                      vx: 1.8,
                      vy: -3.5,
                      isAlive: true,
                    });
                    soundManager.playPowerup();
                  }
                } else if (b.type === 'brick') {
                  if (marioFormRef.current !== 'small') {
                    b.y = 9999;
                    soundManager.playMarioBrick();
                    addParticles(b.x + b.w / 2, b.y + b.h / 2, 10, '#b45309', true);
                    addScore(50);
                  } else {
                    soundManager.playMarioBrick();
                  }
                }
              }
            }
          });

          pipesRef.current.forEach(p => {
            if (p.hasPiranha) {
              p.piranhaTimer = (p.piranhaTimer || 0) + dt * 2.5;
              const isMarioNear = Math.abs(m.x - (p.x + p.w / 2)) < 60;
              const animPhase = Math.sin(p.piranhaTimer);
              const plantRise = isMarioNear ? 0 : Math.max(0, animPhase) * 44;
              const plantY = p.y - plantRise;

              // Va chạm gây sát thương cho Mario khi cây trồi lên khỏi miệng cống
              if (plantRise > 12 && !m.isDead) {
                const pLeft = p.x + 12;
                const pRight = p.x + p.w - 12;
                if (m.x + m.w > pLeft && m.x < pRight && m.y + m.h > plantY + 4 && m.y < p.y) {
                  if (isStarRef.current) {
                    p.hasPiranha = false;
                    soundManager.playMarioKick();
                    addParticles(p.x + p.w / 2, plantY + 12, 10, '#ef4444');
                    addScore(400, p.x, plantY);
                  } else {
                    damageMario();
                  }
                }
              }
            }

            if (m.x + m.w > p.x + 3 && m.x < p.x + p.w - 3) {
              if (m.vy >= 0 && m.y + m.h >= p.y && m.y + m.h <= p.y + 20) {
                m.y = p.y - m.h;
                m.vy = 0;
                m.isGrounded = true;
              }
            }
          });

          if (m.y > CANVAS_HEIGHT + 20) {
            killMarioFall();
          }

          const fp = flagpoleRef.current;
          if (m.x + m.w >= fp.x && m.x <= fp.x + 18 && m.y + m.h >= fp.y && m.y <= fp.y + fp.h) {
            m.isFlagpoleSliding = true;
            m.vx = 0;
            m.vy = 0;
            m.x = fp.x - 12;
            soundManager.playMarioFlag();
            const poleHeightRatio = Math.max(0, (fp.y + fp.h - m.y) / fp.h);
            const flagPts = Math.round(poleHeightRatio * 5000 + 500);
            addScore(flagPts, fp.x, m.y);
          }

          if (axeRef.current && axeRef.current.active) {
            const ax = axeRef.current;
            if (m.x + m.w >= ax.x && m.x <= ax.x + 36 && m.y + m.h >= ax.y && m.y <= ax.y + 50) {
              ax.active = false;
              bridgeBlocksRef.current.forEach((blk, idx) => {
                setTimeout(() => {
                  blk.y = 9999;
                  soundManager.playMarioBrick();
                  addParticles(blk.x + 24, GROUND_Y, 8, '#ea580c');
                }, idx * 75);
              });
              const bowser = enemiesRef.current.find(e => e.type === 'bowser');
              if (bowser) {
                setTimeout(() => {
                  bowser.vy = 9;
                  soundManager.playMarioDie();
                  addScore(8000, bowser.x, bowser.y);
                  confetti({ particleCount: 120, spread: 90 });
                  setGameState('stage_clear');
                }, bridgeBlocksRef.current.length * 75 + 300);
              }
            }
          }

          if (!m.isGrounded) {
            m.animFrame = 3;
          } else if (Math.abs(m.vx) > 0.2) {
            m.animTimer += dt * (Math.abs(m.vx) * 3);
            m.animFrame = Math.floor(m.animTimer) % 3;
          } else {
            m.animFrame = 0;
          }

          const targetCamX = m.x - ARENA_WIDTH * 0.38;
          if (targetCamX > cameraXRef.current) {
            cameraXRef.current = targetCamX;
          }
          if (cameraXRef.current > worldLengthRef.current - ARENA_WIDTH) {
            cameraXRef.current = worldLengthRef.current - ARENA_WIDTH;
          }
        }

        // 2. UPDATE ITEMS
        itemsRef.current.forEach(item => {
          if (!item.isAlive) return;
          item.vy += 26 * dt;
          if (item.vy > 14) item.vy = 14;
          item.x += item.vx;
          item.y += item.vy;

          // Va chạm sàn thật sự (Đất, Gạch, Bậc đá) - không đi trên không qua hố
          blocksRef.current.forEach(b => {
            if (b.y < 8000 && item.x + item.w > b.x && item.x < b.x + b.w) {
              if (item.vy >= 0 && item.y + item.h >= b.y && item.y + item.h <= b.y + 24) {
                item.y = b.y - item.h;
                item.vy = item.type === 'star' ? -8.5 : 0;
              }
            }
            if (b.type !== 'ground') {
              if (item.x + item.w > b.x && item.x < b.x + b.w && item.y + item.h > b.y + 4 && item.y < b.y + b.h) {
                item.vx = -item.vx;
              }
            }
          });

          pipesRef.current.forEach(p => {
            if (item.x + item.w > p.x && item.x < p.x + p.w && item.y + item.h > p.y) {
              item.vx = -item.vx;
            }
          });

          // Rơi xuống vực sâu hố tử thần
          if (item.y > CANVAS_HEIGHT + 60) {
            item.isAlive = false;
          }

          if (m.x + m.w > item.x && m.x < item.x + item.w && m.y + m.h > item.y && m.y < item.y + item.h) {
            item.isAlive = false;
            if (item.type === 'mushroom') {
              if (marioFormRef.current === 'small') upgradeMario('super');
              addScore(1000, item.x, item.y);
            } else if (item.type === 'fireflower') {
              upgradeMario('fire');
              addScore(1000, item.x, item.y);
            } else if (item.type === 'star') {
              setIsStarInvincible(true);
              isStarRef.current = true;
              starTimerRef.current = 12;
              soundManager.playPowerup();
              addFloater(m.x + m.w / 2, m.y - 20, 'INVINCIBLE STAR!', '#fde047');
              addScore(1000, item.x, item.y);
            }
          }
        });

        // 3. UPDATE ENEMIES
        enemiesRef.current.forEach(en => {
          if (!en.isAlive) return;
          if (en.x > cameraXRef.current + ARENA_WIDTH + 150 || en.x < cameraXRef.current - 200) return;

          if (en.type === 'goomba' || en.type === 'koopa') {
            if (!en.isStomped) {
              en.vy += 26 * dt;
              if (en.vy > 14) en.vy = 14;
              en.x += en.vx;
              en.y += en.vy;

              // Va chạm địa hình thật (rơi hố nếu không có đất bên dưới)
              blocksRef.current.forEach(b => {
                if (b.y < 8000 && en.x + en.w > b.x + 2 && en.x < b.x + b.w - 2) {
                  if (en.vy >= 0 && en.y + en.h >= b.y && en.y + en.h <= b.y + 24) {
                    en.y = b.y - en.h;
                    en.vy = 0;
                  }
                }
                if (b.type !== 'ground') {
                  if (en.x + en.w > b.x && en.x < b.x + b.w && en.y + en.h > b.y + 4 && en.y < b.y + b.h) {
                    en.vx = -en.vx;
                    en.facing = en.vx > 0 ? 'right' : 'left';
                  }
                }
              });

              pipesRef.current.forEach(p => {
                if (en.x + en.w > p.x && en.x < p.x + p.w && en.y + en.h > p.y) {
                  en.vx = -en.vx;
                  en.facing = en.vx > 0 ? 'right' : 'left';
                }
              });

              // Rơi xuống vực sâu hố tử thần -> quái bị tiêu diệt
              if (en.y > CANVAS_HEIGHT + 60) {
                en.isAlive = false;
              }

              if (!m.isDead && m.x + m.w > en.x + 4 && m.x < en.x + en.w - 4 && m.y + m.h > en.y + 4 && m.y < en.y + en.h) {
                if (isStarRef.current) {
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 12, '#f59e0b');
                  addScore(400, en.x, en.y);
                } else if (m.vy > 0 && m.y + m.h <= en.y + 24) {
                  m.vy = -10.5;
                  soundManager.playMarioStomp();
                  if (en.type === 'goomba') {
                    en.isStomped = true;
                    en.h = 14;
                    en.y += 30;
                    addScore(200, en.x, en.y);
                    setTimeout(() => { en.isAlive = false; }, 400);
                  } else if (en.type === 'koopa') {
                    if (!en.isShell) {
                      en.isShell = true;
                      en.h = 36;
                      en.y += 26;
                      en.vx = 0;
                      addScore(200, en.x, en.y);
                    } else if (en.vx === 0) {
                      en.vx = m.facing === 'right' ? 9.5 : -9.5;
                      soundManager.playMarioKick();
                    } else {
                      en.vx = 0;
                    }
                  }
                } else {
                  if (en.isShell && en.vx === 0) {
                    en.vx = m.x < en.x ? 9.5 : -9.5;
                    soundManager.playMarioKick();
                  } else {
                    damageMario();
                  }
                }
              }
            } else if (en.isShell && Math.abs(en.vx) > 0.1) {
              en.vy += 26 * dt;
              if (en.vy > 14) en.vy = 14;
              en.x += en.vx;
              en.y += en.vy;

              blocksRef.current.forEach(b => {
                if (b.y < 8000 && en.x + en.w > b.x + 2 && en.x < b.x + b.w - 2) {
                  if (en.vy >= 0 && en.y + en.h >= b.y && en.y + en.h <= b.y + 24) {
                    en.y = b.y - en.h;
                    en.vy = 0;
                  }
                }
                if (b.type !== 'ground') {
                  if (en.x + en.w > b.x && en.x < b.x + b.w && en.y + en.h > b.y + 4 && en.y < b.y + b.h) {
                    en.vx = -en.vx;
                    soundManager.playMarioBrick();
                  }
                }
              });

              pipesRef.current.forEach(p => {
                if (en.x + en.w > p.x && en.x < p.x + p.w && en.y + en.h > p.y) {
                  en.vx = -en.vx;
                  soundManager.playMarioBrick();
                }
              });

              if (en.y > CANVAS_HEIGHT + 60) {
                en.isAlive = false;
              }

              enemiesRef.current.forEach(other => {
                if (other.id !== en.id && other.isAlive && !other.isStomped) {
                  if (en.x + en.w > other.x && en.x < other.x + other.w && en.y + en.h > other.y && en.y < other.y + other.h) {
                    other.isAlive = false;
                    soundManager.playMarioKick();
                    addParticles(other.x + other.w / 2, other.y + other.h / 2, 10, '#ef4444');
                    addScore(400, other.x, other.y);
                  }
                }
              });

              if (!m.isDead && m.x + m.w > en.x + 4 && m.x < en.x + en.w - 4 && m.y + m.h > en.y + 4 && m.y < en.y + en.h) {
                if (isStarRef.current) {
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 10, '#ef4444');
                  addScore(400, en.x, en.y);
                } else if (m.vy > 0 && m.y + m.h <= en.y + 24) {
                  en.vx = 0;
                  m.vy = -10.5;
                  soundManager.playMarioStomp();
                } else {
                  damageMario();
                }
              }
            }
          } else if (en.type === 'bowser') {
            en.animTimer += dt;
            en.shootCooldown = (en.shootCooldown || 2.0) - dt;
            if (en.shootCooldown <= 0) {
              en.shootCooldown = 2.4;
              fireballsRef.current.push({
                x: en.x - 12,
                y: en.y + 36,
                vx: -7.2,
                vy: 0,
                radius: 12,
                isAlive: true,
                isEnemy: true,
              });
              soundManager.playMarioFireball();
            }

            // Bowser nhảy nhẹ khi đứng trên cầu dung nham
            let bowserOnGround = false;
            blocksRef.current.forEach(b => {
              if (b.y < 8000 && en.x + en.w > b.x && en.x < b.x + b.w) {
                if (en.vy >= 0 && en.y + en.h >= b.y && en.y + en.h <= b.y + 24) {
                  en.y = b.y - en.h;
                  en.vy = 0;
                  bowserOnGround = true;
                }
              }
            });

            if (Math.sin(en.animTimer * 2) > 0.8 && bowserOnGround) {
              en.vy = -7.5;
            }
            en.vy += 26 * dt;
            if (en.vy > 14) en.vy = 14;
            en.y += en.vy;

            // Bowser rơi xuống hố dung nham
            if (en.y > CANVAS_HEIGHT + 60) {
              en.isAlive = false;
              addScore(8000, en.x, en.y);
            }

            if (!m.isDead && m.x + m.w > en.x && m.x < en.x + en.w && m.y + m.h > en.y && m.y < en.y + en.h) {
              if (isStarRef.current) {
                en.hp = (en.hp || 5) - 1;
                soundManager.playMarioKick();
                if (en.hp <= 0) {
                  en.isAlive = false;
                  addScore(8000, en.x, en.y);
                }
              } else {
                damageMario();
              }
            }
          }
        });

        // 4. UPDATE FIREBALLS
        fireballsRef.current.forEach(fb => {
          if (!fb.isAlive) return;
          fb.x += fb.vx;
          fb.vy += 26 * dt;
          fb.y += fb.vy;

          if (fb.y + fb.radius >= GROUND_Y) {
            fb.y = GROUND_Y - fb.radius;
            fb.vy = -7.2;
          }

          if (fb.x > cameraXRef.current + ARENA_WIDTH + 40 || fb.x < cameraXRef.current - 40) {
            fb.isAlive = false;
          }

          if (!fb.isEnemy) {
            pipesRef.current.forEach(p => {
              if (p.hasPiranha) {
                const animPhase = Math.sin(p.piranhaTimer || 0);
                const isMarioNear = Math.abs(m.x - (p.x + p.w / 2)) < 60;
                const plantRise = isMarioNear ? 0 : Math.max(0, animPhase) * 44;
                const plantY = p.y - plantRise;
                if (plantRise > 10) {
                  const pLeft = p.x + 12;
                  const pRight = p.x + p.w - 12;
                  if (fb.x + fb.radius > pLeft && fb.x - fb.radius < pRight && fb.y + fb.radius > plantY && fb.y - fb.radius < p.y) {
                    fb.isAlive = false;
                    p.hasPiranha = false;
                    soundManager.playMarioKick();
                    addParticles(p.x + p.w / 2, plantY + 12, 10, '#ef4444');
                    addScore(200, p.x, plantY);
                  }
                }
              }
            });

            enemiesRef.current.forEach(en => {
              if (en.isAlive && !en.isStomped) {
                if (fb.x + fb.radius > en.x && fb.x - fb.radius < en.x + en.w && fb.y + fb.radius > en.y && fb.y - fb.radius < en.y + en.h) {
                  fb.isAlive = false;
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 10, '#f97316');
                  addScore(200, en.x, en.y);
                }
              }
            });
          } else {
            if (!m.isDead && fb.x + fb.radius > m.x && fb.x - fb.radius < m.x + m.w && fb.y + fb.radius > m.y && fb.y - fb.radius < m.y + m.h) {
              fb.isAlive = false;
              damageMario();
            }
          }
        });

        setTimeLeft(prev => {
          const next = Math.max(0, prev - dt);
          if (next <= 0 && !m.isDead) damageMario();
          return next;
        });
      }

      // 2. RENDER GRAPHICS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // ARENA VIEWPORT CLIPPING (756x540px)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      ctx.clip();

      const camX = cameraXRef.current;

      // HẬU CẢNH THIÊN NHIÊN SỐNG ĐỘNG (Parallax núi nguyên khối, đồi cỏ Super Mario & mây cười)
      drawBackgroundScene(ctx, currentStage, camX, worldLengthRef.current);

      ctx.save();
      ctx.translate(-camX, 0);

      // VẼ MẶT ĐẤT VÀ KHỐI GẠCH ĐỊA HÌNH 3D (Sa thạch 2 tầng, Khối ? mạ vàng ánh kim)
      blocksRef.current.forEach(b => {
        if (b.x + b.w < camX - 60 || b.x > camX + ARENA_WIDTH + 60) return;

        const renderY = b.y + (b.hitOffsetY || 0);
        if (b.hitOffsetY && b.hitOffsetY < 0) {
          b.hitOffsetY += 1.2;
          if (b.hitOffsetY > 0) b.hitOffsetY = 0;
        }

        if (b.type === 'ground') {
          drawGroundTerrain(ctx, b, renderY, currentStage);
        } else if (b.type === 'question') {
          drawQuestionBlock(ctx, b, renderY, now);
        } else if (b.type === 'brick') {
          drawBrickBlock(ctx, b, renderY, currentStage);
        } else if (b.type === 'hard_block') {
          drawHardBlock(ctx, b, renderY, currentStage);
        } else if (b.type === 'empty') {
          // Khối gạch rỗng sau khi đập
          ctx.fillStyle = '#71717a';
          ctx.beginPath();
          ctx.roundRect(b.x, renderY, b.w, b.h, 4);
          ctx.fill();
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
          ctx.fillStyle = '#27272a';
          ctx.fillRect(b.x + 4, renderY + 4, 4, 4);
          ctx.fillRect(b.x + b.w - 8, renderY + 4, 4, 4);
          ctx.fillRect(b.x + 4, renderY + b.h - 8, 4, 4);
          ctx.fillRect(b.x + b.w - 8, renderY + b.h - 8, 4, 4);
        }
      });

      // VẼ ĐƯỜNG ỐNG NƯỚC XANH 3D & CÂY ĂN THỊT PIRANHA
      pipesRef.current.forEach(p => {
        if (p.x + p.w < camX - 60 || p.x > camX + ARENA_WIDTH + 60) return;
        drawPipeAndPiranha(ctx, p, m.x);
      });

      // VẼ RÌU CẮT CẦU (MÀN 4)
      if (axeRef.current && axeRef.current.active) {
        const ax = axeRef.current;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(ax.x + 18, ax.y + 18, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ax.x + 14, ax.y + 24, 8, 26);
      }

      // VẼ CỘT CỜ CHIẾN THẮNG & LÂU ĐÀI
      const fp = flagpoleRef.current;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(fp.x - 14, GROUND_Y - 14, 36, 14);
      ctx.fillRect(fp.x - 8, GROUND_Y - 24, 24, 10);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(fp.x + 2, fp.y, 6, fp.h - 24);

      const orbGrad = ctx.createRadialGradient(fp.x + 5, fp.y, 2, fp.x + 5, fp.y, 14);
      orbGrad.addColorStop(0, '#fef08a');
      orbGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(fp.x + 5, fp.y, 14, 0, Math.PI * 2);
      ctx.fill();

      const flagY = m.isFlagpoleSliding || m.walkToCastle ? fp.y + fp.h - 60 : fp.flagY;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(fp.x + 8, flagY);
      ctx.lineTo(fp.x + 58, flagY + 22);
      ctx.lineTo(fp.x + 8, flagY + 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // LÂU ĐÀI ĐÍCH ĐẾN NGUY NGA
      const cst = castleRef.current;
      const castleGrad = ctx.createLinearGradient(cst.x, cst.y, cst.x + cst.w, cst.y + cst.h);
      castleGrad.addColorStop(0, currentStage === 4 ? '#450a0a' : '#64748b');
      castleGrad.addColorStop(1, currentStage === 4 ? '#1a0404' : '#334155');
      ctx.fillStyle = castleGrad;
      ctx.fillRect(cst.x, cst.y, cst.w, cst.h);

      const towerW = 50;
      ctx.fillRect(cst.x - 22, cst.y - 36, towerW, cst.h + 36);
      ctx.fillRect(cst.x + cst.w - 28, cst.y - 36, towerW, cst.h + 36);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(cst.x - 26, cst.y - 36);
      ctx.lineTo(cst.x + 3, cst.y - 88);
      ctx.lineTo(cst.x + 32, cst.y - 36);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cst.x + cst.w - 32, cst.y - 36);
      ctx.lineTo(cst.x + cst.w - 3, cst.y - 88);
      ctx.lineTo(cst.x + cst.w + 26, cst.y - 36);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cst.x + 2, cst.y - 110, 2.5, 22);
      ctx.beginPath();
      ctx.moveTo(cst.x + 4.5, cst.y - 110);
      ctx.lineTo(cst.x + 28, cst.y - 98);
      ctx.lineTo(cst.x + 4.5, cst.y - 88);
      ctx.fill();

      ctx.fillStyle = castleGrad;
      for (let bx = cst.x + 32; bx < cst.x + cst.w - 32; bx += 32) {
        ctx.fillRect(bx, cst.y - 20, 20, 20);
      }

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cst.x + cst.w / 2, cst.y + cst.h - 60, 36, Math.PI, 0);
      ctx.fillRect(cst.x + cst.w / 2 - 36, cst.y + cst.h - 60, 72, 60);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(cst.x + cst.w / 2 - 48, cst.y + cst.h - 50, 7, 0, Math.PI * 2);
      ctx.arc(cst.x + cst.w / 2 + 48, cst.y + cst.h - 50, 7, 0, Math.PI * 2);
      ctx.fill();

      // VẼ VẬT PHẨM (NẤM, HOA LỬA, SAO)
      itemsRef.current.forEach(item => {
        if (!item.isAlive) return;
        if (item.type === 'mushroom') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 16, 17, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 8, 5, 0, Math.PI * 2);
          ctx.arc(item.x + 6, item.y + 14, 4, 0, Math.PI * 2);
          ctx.arc(item.x + item.w - 6, item.y + 14, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(item.x + 9, item.y + 16, item.w - 18, 16);
          ctx.fillStyle = '#000000';
          ctx.fillRect(item.x + 13, item.y + 19, 3, 7);
          ctx.fillRect(item.x + item.w - 16, item.y + 19, 3, 7);
        } else if (item.type === 'fireflower') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 14, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 14, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(item.x + item.w / 2 - 3, item.y + 24, 6, 12);
        } else if (item.type === 'star') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          const cx = item.x + item.w / 2;
          const cy = item.y + item.h / 2;
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 17 + cx, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 17 + cy);
            ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 7.5 + cx, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 7.5 + cy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.fillRect(cx - 3.5, cy - 4, 2.5, 8);
          ctx.fillRect(cx + 1, cy - 4, 2.5, 8);
        } else if (item.type === 'coin') {
          drawVectorCoin(ctx, item.x + item.w / 2, item.y + item.h / 2, 10);
        }
      });

      // VẼ KẺ ĐỊCH (GOOMBA, KOOPA, BOWSER)
      enemiesRef.current.forEach(en => {
        if (!en.isAlive) return;

        if (en.type === 'goomba') {
          drawGoomba(ctx, en, now);
        } else if (en.type === 'koopa') {
          drawKoopa(ctx, en, now);
        } else if (en.type === 'bowser') {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(en.x + 18, en.y + 20, 60, 68);
          ctx.fillStyle = '#ffffff';
          for (let sp = 0; sp < 4; sp++) {
            ctx.beginPath();
            ctx.moveTo(en.x + 78, en.y + 24 + sp * 16);
            ctx.lineTo(en.x + 94, sp * 16 + 30 + en.y);
            ctx.lineTo(en.x + 78, sp * 16 + 36 + en.y);
            ctx.fill();
          }
          ctx.fillStyle = '#eab308';
          ctx.fillRect(en.x, en.y + 14, 38, 38);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(en.x + 4, en.y, 8, 16);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(en.x + 10, en.y + 22, 7, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(en.x + 24, en.y + 6, 26, 16);
        }
      });

      // VẼ CẦU LỬA
      fireballsRef.current.forEach(fb => {
        if (!fb.isAlive) return;
        ctx.fillStyle = fb.isEnemy ? '#dc2626' : '#f97316';
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // VẼ NHÂN VẬT MARIO CHÂN THỰC, SẮC NÉT (Bộ vẽ vector Mario chi tiết)
      if (!m.isDead || (m.isDead && m.y < CANVAS_HEIGHT + 80)) {
        const isFlickering = invulnerableTimerRef.current > 0 && Math.floor(now / 50) % 2 === 0;
        if (!isFlickering) {
          ctx.save();
          ctx.translate(m.x + m.w / 2, m.y + m.h / 2);
          if (m.facing === 'left') ctx.scale(-1, 1);
          drawDetailedMario(ctx, m, marioFormRef.current, isStarRef.current, now);
          ctx.restore();
        }
      }

      // VẼ HIỆU ỨNG HẠT VÀ CHỮ NỔI
      particlesRef.current.forEach((pt, pIdx) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.35;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;

        if (pt.alpha <= 0) {
          particlesRef.current.splice(pIdx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        if (pt.isBrickPiece) {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rotation || 0);
          ctx.fillRect(-pt.radius, -pt.radius, pt.radius * 2, pt.radius * 2);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      floatersRef.current.forEach((fl, fIdx) => {
        fl.y += fl.vy;
        fl.life++;
        fl.alpha = 1 - fl.life / 40;
        if (fl.alpha <= 0) {
          floatersRef.current.splice(fIdx, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = fl.alpha;
        ctx.fillStyle = fl.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();
      });

      ctx.restore(); // Kết thúc dịch chuyển Camera

      ctx.restore(); // Kết thúc clip Arena

      // 3. SIDEBAR THÔNG SỐ BÊN PHẢI (204px) - TINH GỌN, XÓA HẾT HƯỚNG DẪN & CHÚ THÍCH THỪA
      ctx.fillStyle = '#060a12';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X, 0);
      ctx.lineTo(SIDEBAR_X, CANVAS_HEIGHT);
      ctx.stroke();

      // Tiêu đề Sidebar duy nhất
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUPER MARIO BROS', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // Card 1: Hình Thái Mario (Xóa sạch chú thích thừa, chỉ giữ huy hiệu & tên hình thái)
      const cardY = 50;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, cardY, SIDEBAR_WIDTH - 32, 64, 12);
      ctx.fill();
      ctx.strokeStyle = isStarRef.current
        ? '#facc15'
        : marioFormRef.current === 'fire'
        ? '#ef4444'
        : marioFormRef.current === 'super'
        ? '#3b82f6'
        : '#64748b';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Avatar Vector Mario Face Badge
      drawMarioAvatarBadge(
        ctx,
        SIDEBAR_X + 46,
        cardY + 32,
        20,
        marioFormRef.current,
        isStarRef.current,
        now
      );

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const formText = isStarRef.current
        ? 'BẤT TỬ'
        : marioFormRef.current === 'fire'
        ? 'MARIO LỬA'
        : marioFormRef.current === 'super'
        ? 'SIÊU MARIO'
        : 'MARIO NHỎ';
      ctx.fillText(formText, SIDEBAR_X + 76, cardY + 32);
      ctx.textBaseline = 'alphabetic';

      // Card 2: Quân Số Mạng (Căn giữa chuẩn xác trục tâm)
      const livesY = 138;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QUÂN SỐ MẠNG', SIDEBAR_X + SIDEBAR_WIDTH / 2, livesY);

      const spacing = 38;
      const centerX = SIDEBAR_X + SIDEBAR_WIDTH / 2;
      for (let i = 0; i < 3; i++) {
        const lx = centerX + (i - 1) * spacing;
        const ly = livesY + 24;
        const hasLife = i < livesRef.current;

        ctx.fillStyle = hasLife ? '#ef4444' : '#1e293b';
        ctx.beginPath();
        ctx.arc(lx, ly, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hasLife ? '#dc2626' : '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = hasLife ? '#ffffff' : '#64748b';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(hasLife ? '♥' : '✕', lx, ly + 5);
      }

      // Card 3: Tiến Độ Màn Chơi (Thanh tiến trình gọn gàng, không chú thích rườm rà)
      const progY = 210;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, progY, SIDEBAR_WIDTH - 32, 76, 12);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('TIẾN ĐỘ', SIDEBAR_X + SIDEBAR_WIDTH / 2, progY + 22);

      const finishTargetX = flagpoleRef.current ? Math.max(1, flagpoleRef.current.x - 100) : 3400;
      const progRatio = Math.min(1, Math.max(0, m.x / finishTargetX));
      const progPct = Math.round(progRatio * 100);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 26, progY + 36, SIDEBAR_WIDTH - 52, 12, 6);
      ctx.fill();

      if (progRatio > 0.02) {
        const barGrad = ctx.createLinearGradient(SIDEBAR_X + 26, 0, SIDEBAR_X + SIDEBAR_WIDTH - 26, 0);
        barGrad.addColorStop(0, '#10b981');
        barGrad.addColorStop(1, '#22c55e');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(SIDEBAR_X + 26, progY + 36, (SIDEBAR_WIDTH - 52) * progRatio, 12, 6);
        ctx.fill();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`MÀN 1-${currentStage} • ${progPct}%`, SIDEBAR_X + SIDEBAR_WIDTH / 2, progY + 65);

      // Card 4: Điểm Số Chiến Trường & Kỷ Lục
      const scoreBoxY = 310;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, scoreBoxY, SIDEBAR_WIDTH - 32, 90, 12);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ĐIỂM SỐ', SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 24);

      ctx.fillStyle = '#facc15';
      ctx.font = 'black 24px monospace';
      ctx.fillText(`${scoreRef.current.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 56);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`KỶ LỤC: ${highScore.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 78);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addCoin, addScore, currentStage, currentWorld, damageMario, highScore, timeLeft]);

  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full select-none">
      {/* 3-Column Top HUD Bar chuẩn hệ thống Ace Games */}
      <div className="relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm flex-shrink-0">
        {/* Cột 1: Thông tin màn chơi & Chuyển màn nhanh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs uppercase font-mono">Màn 1-{currentStage}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-white/5">
            {[1, 2, 3, 4].map(stg => (
              <button
                key={stg}
                onClick={() => {
                  soundManager.playButtonClick();
                  startNewGame(stg);
                }}
                className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                  currentStage === stg
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                1-{stg}
              </button>
            ))}
          </div>
        </div>

        {/* Cột 2: Điểm số & Mạng - CĂN CHÍNH GIỮA TUYỆT ĐỐI */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-5 font-mono font-bold text-xs sm:text-sm pointer-events-none">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-gray-400 text-xs hidden md:inline">ĐIỂM:</span>
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400">
            <Coins className="w-3.5 h-3.5" />
            <span>x{coins.toString().padStart(2, '0')}</span>
          </div>

          <div className="flex items-center gap-1 text-cyan-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.ceil(timeLeft)}s</span>
          </div>

          <div className="flex items-center gap-1 text-rose-400">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>{lives} MẠNG</span>
          </div>
        </div>

        {/* Cột 3: Nút điều khiển Tạm dừng & Chơi lại */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={gameState === 'paused' ? 'Tiếp tục' : 'Tạm dừng (P)'}
          >
            {gameState === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={() => startNewGame(currentStage)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Chơi Lại Ván Này"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sân đấu Widescreen 16:9 Arcade Canvas Container */}
      <div 
        className="relative w-full max-w-[min(96vw,1320px)] max-h-[calc(100dvh-185px)] aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center flex-1 min-h-0"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full max-w-full max-h-full object-contain block"
        />

        {/* Nút Điều Khiển Cảm Ứng Ảo Trên Thiết Bị Di Động */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:hidden z-30">
          <div />
          <div className="flex items-end justify-between w-full pointer-events-auto">
            {/* D-Pad 3 Hướng (Trái, Cúi, Phải) */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
              <button
                onTouchStart={() => { keysRef.current.left = true; }}
                onTouchEnd={() => { keysRef.current.left = false; }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold text-lg"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onTouchStart={() => { keysRef.current.down = true; }}
                onTouchEnd={() => { keysRef.current.down = false; }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold text-lg"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
              <button
                onTouchStart={() => { keysRef.current.right = true; }}
                onTouchEnd={() => { keysRef.current.right = false; }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold text-lg"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            {/* Nút B (Bắn/Chạy) & A (Nhảy) */}
            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => {
                  keysRef.current.dash = true;
                  shootFireball();
                }}
                onTouchEnd={() => { keysRef.current.dash = false; }}
                className="w-14 h-14 rounded-full bg-orange-600/90 active:bg-orange-500 text-white font-black text-lg border-2 border-orange-400/50 shadow-lg flex items-center justify-center"
              >
                B
              </button>
              <button
                onTouchStart={() => {
                  if (marioRef.current.isGrounded && !marioRef.current.isDead) {
                    marioRef.current.vy = -14.2;
                    marioRef.current.isGrounded = false;
                    soundManager.playMarioJump(marioFormRef.current !== 'small');
                  }
                  keysRef.current.jump = true;
                }}
                onTouchEnd={() => { keysRef.current.jump = false; }}
                className="w-14 h-14 rounded-full bg-emerald-600/90 active:bg-emerald-500 text-white font-black text-lg border-2 border-emerald-400/50 shadow-lg flex items-center justify-center"
              >
                A
              </button>
            </div>
          </div>
        </div>

        {/* MODAL CHIẾN THẮNG MÀN CHƠI (STAGE CLEAR) CAO CẤP */}
        {gameState === 'stage_clear' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-400 mb-3 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              STAGE CLEAR!
            </h3>
            <p className="text-sm sm:text-base text-gray-200 font-bold mb-2">
              Chúc mừng bạn đã hoàn thành Màn {currentWorld}-{currentStage}!
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 font-mono">
              Điểm số: <span className="text-amber-300 font-bold">{score.toLocaleString()}</span> • Tiền xu: <span className="text-cyan-300 font-bold">{coins}</span>
            </p>
            <button
              onClick={() => {
                const nextStg = currentStage < 4 ? currentStage + 1 : 1;
                startNewGame(nextStg);
              }}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 transition cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span>{currentStage < 4 ? `Tiến Vào Màn 1-${currentStage + 1}` : 'Chơi Lại Từ Đầu'}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* MODAL THUA CUỘC (GAME OVER) */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">💀</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">
              GAME OVER
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-5">
              Bạn đã hết mạng sống trong hành trình khám phá Vương quốc Nấm!
            </p>
            <button
              onClick={() => startNewGame(1)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
            >
              Thử Lại Từ Màn 1-1
            </button>
          </div>
        )}

        {/* MODAL TẠM DỪNG (PAUSED) */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-4xl mb-2">⏸️</span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              TẠM DỪNG TRÒ CHƠI
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-5">
              Bấm [P] hoặc nút Tiếp Tục để quay trở lại Vương quốc Nấm
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiếp Tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
