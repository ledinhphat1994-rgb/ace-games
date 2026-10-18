class_name AnimatedTower
extends Node2D

## AnimatedTower: Tháp Phòng Thủ 2.5D Kiên Cố, Luôn Đứng Thẳng Chuẩn Xác 100% Theo Thiết Kế
## TUÂN THỦ NGHIÊM NGẶT QUY TẮC THIẾT KẾ & VIDEO THAM CHIẾU:
## 1. Đế tháp (Base): Cố định 100% trên bệ đá tròn, bóng đổ bám đất, đứng vững chãi
## 2. Thân tháp / Ụ súng (Turret Body):
##    - LUÔN ĐỨNG THẲNG UPRIGHT TRÊN BỆ ĐÁ (rotation = 0.0), TUYỆT ĐỐI KHÔNG NẰM NGHIÊNG, LẬT NGỬA HAY LỘN NGƯỢC
##    - Quay ngang 2 hướng Trái / Phải theo mục tiêu qua scale.x (-0.18 / +0.18)
##    - Độ giật lùi nòng súng (Recoil) trượt ngang dọc theo ray mâm xoay và nảy hồi phục tức thì
## 3. Hiệu ứng đồ họa từ Video:
##    - Chớp lửa đầu nòng dạng sao đa giác bùng nổ (Star Muzzle Flash) tại đúng chóp nòng
##    - Làn khói súng bốc lên cuồn cuộn sau mỗi loạt bắn (Gun Smoke Puffs)
##    - Vỏ đạn đồng văng từ buồng đạn, nảy trên mặt đất và phát ra tiếng leng keng kim loại
## 4. Âm thanh thực tế từ Video:
##    - Tiếng súng máy Gatling đanh thép giòn tan (4 biến thể âm thanh)
##    - Tiếng mâm xoay servo khi chuyển hướng
##    - Tiếng vỏ đạn rơi leng keng

enum FactionType {
	SCI_FI = 0,    # Hệ Cơ khí / Công nghệ
	ARCANE = 1,    # Hệ Phép thuật / Huyền bí
	BIO = 2,       # Hệ Sinh học / Dị biến
	DIVINE = 3     # Hệ Tâm linh / Cổ đại
}

enum TowerType {
	PLASMA_CANNON = 0,  # Trụ Pháo Plasma 3 nòng (Sci-Fi)
	GATLING_GUN = 1,    # Tháp Súng Máy Xoay (Sci-Fi)
	TESLA_COIL = 2,     # Trụ Bẫy Điện Từ (Sci-Fi)
	SAM_BATTERY = 3,    # Bệ Phóng Tên Lửa Tầm Xa (Sci-Fi)
	FROST_SPIRE = 4,    # Tháp Băng Vĩnh Cửu (Arcane)
	MAGMA_MONOLITH = 5, # Đài Lửa Dung Nham (Arcane)
	VOID_OBELISK = 6,   # Tháp Chuông Hư Không (Arcane)
	SPORE_SPITTER = 7,  # Bào Tử Ăn Mòn (Bio)
	PYLON_BUFFER = 8    # Đền Thần Tiếp Năng Lượng (Divine)
}

const TexPlasmaBase = preload("res://assets/sprites/tower_plasma_base.png")
const TexPlasmaTurret = preload("res://assets/sprites/tower_plasma_turret.png")
const TexGatlingBase = preload("res://assets/sprites/tower_gatling_base.png")
const TexGatlingTurret = preload("res://assets/sprites/tower_gatling_turret.png")
const TexTesla = preload("res://assets/sprites/tower_tesla_coil.png")
const GatlingSpinShader = preload("res://shaders/gatling_barrel_spin.gdshader")

# BỘ SPRITE 32 HƯỚNG CHUẨN CƠ KHÍ 2D ISOMETRIC (32-DIRECTIONAL SPRITES)
# Xoay tròn mượt mà 360 độ (mỗi hướng 11.25°), ụ tháp cố định nằm ngang 100%, không ngửa/gật
const TEX_GATLING_32DIR = [
	preload("res://assets/sprites/towers/gatling/gatling_dir_0.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_1.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_2.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_3.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_4.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_5.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_6.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_7.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_8.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_9.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_10.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_11.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_12.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_13.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_14.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_15.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_16.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_17.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_18.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_19.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_20.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_21.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_22.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_23.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_24.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_25.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_26.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_27.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_28.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_29.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_30.png"),
	preload("res://assets/sprites/towers/gatling/gatling_dir_31.png"),
]

## Trả về texture nòng súng Gatling theo 32 hướng isometric chuẩn xác (không dùng sprite méo lệch)
static func get_gatling_spin_texture(dir_idx: int, _frame_idx: int = 0) -> Texture2D:
	dir_idx = clampi(dir_idx, 0, 31)
	return TEX_GATLING_32DIR[dir_idx]


const TEX_PLASMA_32DIR = [
	preload("res://assets/sprites/towers/plasma/plasma_dir_0.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_1.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_2.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_3.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_4.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_5.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_6.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_7.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_8.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_9.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_10.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_11.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_12.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_13.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_14.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_15.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_16.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_17.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_18.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_19.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_20.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_21.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_22.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_23.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_24.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_25.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_26.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_27.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_28.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_29.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_30.png"),
	preload("res://assets/sprites/towers/plasma/plasma_dir_31.png"),
]

# TỌA ĐỘ ĐẦU NÒNG SÚNG (MUZZLE TIP) CHUẨN XÁC 100% THEO TỪNG HƯỚNG TRONG 32 HƯỚNG (Scale 1.0)
const GATLING_MUZZLE_OFFSETS: Array[Vector2] = [
	Vector2( 260.0,  -75.0), # Dir  0 (  0.0°)
	Vector2( 246.6,  -25.9), # Dir  1 ( 11.2°)
	Vector2( 213.5,   13.4), # Dir  2 ( 22.5°)
	Vector2( 173.1,   40.7), # Dir  3 ( 33.8°)
	Vector2( 133.1,   58.1), # Dir  4 ( 45.0°)
	Vector2(  96.2,   69.0), # Dir  5 ( 56.2°)
	Vector2(  62.3,   75.5), # Dir  6 ( 67.5°)
	Vector2(  30.6,   78.9), # Dir  7 ( 78.8°)
	Vector2(   0.0,   80.0), # Dir  8 ( 90.0°)
	Vector2( -30.6,   78.9), # Dir  9 (101.2°)
	Vector2( -62.3,   75.5), # Dir 10 (112.5°)
	Vector2( -96.2,   69.0), # Dir 11 (123.8°)
	Vector2(-133.1,   58.1), # Dir 12 (135.0°)
	Vector2(-173.1,   40.7), # Dir 13 (146.2°)
	Vector2(-213.5,   13.4), # Dir 14 (157.5°)
	Vector2(-246.6,  -25.9), # Dir 15 (168.8°)
	Vector2(-260.0,  -75.0), # Dir 16 (180.0°)
	Vector2(-242.8, -123.3), # Dir 17 (191.2°)
	Vector2(-203.2, -159.2), # Dir 18 (202.5°)
	Vector2(-159.5, -181.6), # Dir 19 (213.8°)
	Vector2(-119.8, -194.8), # Dir 20 (225.0°)
	Vector2( -85.2, -202.5), # Dir 21 (236.2°)
	Vector2( -54.7, -207.0), # Dir 22 (247.5°)
	Vector2( -26.7, -209.3), # Dir 23 (258.8°)
	Vector2(   0.0, -210.0), # Dir 24 (270.0°)
	Vector2(  26.7, -209.3), # Dir 25 (281.2°)
	Vector2(  54.7, -207.0), # Dir 26 (292.5°)
	Vector2(  85.2, -202.5), # Dir 27 (303.8°)
	Vector2( 119.8, -194.8), # Dir 28 (315.0°)
	Vector2( 159.5, -181.6), # Dir 29 (326.2°)
	Vector2( 203.2, -159.2), # Dir 30 (337.5°)
	Vector2( 242.8, -123.3), # Dir 31 (348.8°)
]


const PLASMA_MUZZLE_OFFSETS: Array[Vector2] = [
	Vector2( 315.0,  -38.0), # Dir  0 ( 0.00°)
	Vector2( 308.9,   -9.7), # Dir  1 (11.25°)
	Vector2( 291.0,   17.5), # Dir  2 (22.50°)
	Vector2( 261.9,   42.6), # Dir  3 (33.75°)
	Vector2( 222.7,   64.5), # Dir  4 (45.00°)
	Vector2( 175.0,   82.6), # Dir  5 (56.25°)
	Vector2( 120.5,   96.0), # Dir  6 (67.50°)
	Vector2(  61.5,  104.2), # Dir  7 (78.75°)
	Vector2(   0.0,  107.0), # Dir  8 (90.00°)
	Vector2( -61.5,  104.2), # Dir  9 (101.25°)
	Vector2(-120.5,   96.0), # Dir 10 (112.50°)
	Vector2(-175.0,   82.6), # Dir 11 (123.75°)
	Vector2(-222.7,   64.5), # Dir 12 (135.00°)
	Vector2(-261.9,   42.6), # Dir 13 (146.25°)
	Vector2(-291.0,   17.5), # Dir 14 (157.50°)
	Vector2(-308.9,   -9.7), # Dir 15 (168.75°)
	Vector2(-315.0,  -38.0), # Dir 16 (180.00°)
	Vector2(-308.9,  -66.3), # Dir 17 (191.25°)
	Vector2(-291.0,  -93.5), # Dir 18 (202.50°)
	Vector2(-261.9, -118.6), # Dir 19 (213.75°)
	Vector2(-222.7, -140.5), # Dir 20 (225.00°)
	Vector2(-175.0, -158.6), # Dir 21 (236.25°)
	Vector2(-120.5, -172.0), # Dir 22 (247.50°)
	Vector2( -61.5, -180.2), # Dir 23 (258.75°)
	Vector2(   0.0, -183.0), # Dir 24 (270.00°)
	Vector2(  61.5, -180.2), # Dir 25 (281.25°)
	Vector2( 120.5, -172.0), # Dir 26 (292.50°)
	Vector2( 175.0, -158.6), # Dir 27 (303.75°)
	Vector2( 222.7, -140.5), # Dir 28 (315.00°)
	Vector2( 261.9, -118.6), # Dir 29 (326.25°)
	Vector2( 291.0,  -93.5), # Dir 30 (337.50°)
	Vector2( 308.9,  -66.3), # Dir 31 (348.75°)
]

# GÓC HƯỚNG QUAY THỰC TẾ CỦA NÒNG SÚNG TRONG KHÔNG GIAN 2D (32 HƯỚNG XOAY ĐỀU 11.25°)
const GATLING_BARREL_ANGLES: Array[float] = [
	0.0, 0.19634954, 0.39269908, 0.58904862, 0.78539816, 0.98174770, 1.17809725, 1.37444679,
	1.57079633, 1.76714587, 1.96349541, 2.15984495, 2.35619449, 2.55254403, 2.74889357, 2.94524311,
	3.14159265, -2.94524311, -2.74889357, -2.55254403, -2.35619449, -2.15984495, -1.96349541, -1.76714587,
	-1.57079633, -1.37444679, -1.17809725, -0.98174770, -0.78539816, -0.58904862, -0.39269908, -0.19634954,
]

const PLASMA_BARREL_ANGLES: Array[float] = [
	0.0, 0.19634954, 0.39269908, 0.58904862, 0.78539816, 0.98174770, 1.17809725, 1.37444679,
	1.57079633, 1.76714587, 1.96349541, 2.15984495, 2.35619449, 2.55254403, 2.74889357, 2.94524311,
	3.14159265, -2.94524311, -2.74889357, -2.55254403, -2.35619449, -2.15984495, -1.96349541, -1.76714587,
	-1.57079633, -1.37444679, -1.17809725, -0.98174770, -0.78539816, -0.58904862, -0.39269908, -0.19634954,
]

## Tìm frame sprite có góc nòng súng hướng chuẩn xác nhất vào góc mục tiêu 2D (So khớp góc thực tế của từng frame)
static func get_closest_barrel_dir_idx(type: TowerType, target_angle: float) -> int:
	var table: Array[float] = GATLING_BARREL_ANGLES if type == TowerType.GATLING_GUN else PLASMA_BARREL_ANGLES
	var best_idx: int = 0
	var min_diff: float = 999.0
	for i in range(table.size()):
		var diff = absf(angle_difference(target_angle, table[i]))
		if diff < min_diff:
			min_diff = diff
			best_idx = i
	return best_idx

static func get_faction_for_tower(type: TowerType) -> FactionType:
	match type:
		TowerType.PLASMA_CANNON, TowerType.GATLING_GUN, TowerType.TESLA_COIL, TowerType.SAM_BATTERY:
			return FactionType.SCI_FI
		TowerType.FROST_SPIRE, TowerType.MAGMA_MONOLITH, TowerType.VOID_OBELISK:
			return FactionType.ARCANE
		TowerType.SPORE_SPITTER:
			return FactionType.BIO
		TowerType.PYLON_BUFFER:
			return FactionType.DIVINE
		_:
			return FactionType.SCI_FI

static func get_tower_name(type: TowerType) -> String:
	match type:
		TowerType.PLASMA_CANNON: return "PHÁO PLASMA 3 NÒNG"
		TowerType.GATLING_GUN: return "SÚNG GATLING XOAY"
		TowerType.TESLA_COIL: return "TRỤ BẪY ĐIỆN TỪ EMP"
		TowerType.SAM_BATTERY: return "BỆ PHÓNG SAM TẦM XA"
		TowerType.FROST_SPIRE: return "THÁP BĂNG VĨNH CỬU"
		TowerType.MAGMA_MONOLITH: return "ĐÀI LỬA DUNG NHAM"
		TowerType.VOID_OBELISK: return "THÁP CHUÔNG HƯ KHÔNG"
		TowerType.SPORE_SPITTER: return "BÀO TỬ ĂN MÒN"
		TowerType.PYLON_BUFFER: return "ĐỀN THẦN TIẾP NĂNG LƯỢNG"
		_: return "THÁP PHÒNG THỦ"

static func get_tower_tactics(type: TowerType) -> String:
	match type:
		TowerType.PLASMA_CANNON: return "PLASMA (+50% Giáp | +100% Khiên)"
		TowerType.GATLING_GUN: return "ĐỘNG NĂNG (+50% Máu | Tăng Tốc)"
		TowerType.TESLA_COIL: return "SỐC ĐIỆN EMP (Tê Liệt Xe | Phá Khiên)"
		TowerType.SAM_BATTERY: return "TÊN LỬA TẦM XA (Ưu Tiên Quái Bay)"
		TowerType.FROST_SPIRE: return "HỆ BĂNG (Làm Chậm AoE | Đóng Băng 2s)"
		TowerType.MAGMA_MONOLITH: return "DUNG NHAM (Đất Cháy AoE | Thiêu Đốt)"
		TowerType.VOID_OBELISK: return "HƯ KHÔNG (Bỏ Qua Giáp | % Máu Tối Đa)"
		TowerType.SPORE_SPITTER: return "AXIT (Bào Mòn 30% Giáp | Lây Lan)"
		TowerType.PYLON_BUFFER: return "HÀO QUANG (+25% Tốc | +15% Tầm Bắn)"
		_: return ""

const ProjectileClass = preload("res://scripts/stylized/AnimatedProjectile.gd")
const LightningClass = preload("res://scripts/stylized/TeslaLightningEffect.gd")
const CasingClass = preload("res://scripts/stylized/GatlingCasing.gd")
const SoundSynthClass = preload("res://scripts/audio/SoundSynthesizer.gd")

# ========================================================
# TECH TREE MODIFIERS (Cộng hưởng từ Cây Kỹ Năng Công Nghệ)
# ========================================================
static var tech_damage_mult: float = 1.0
static var tech_range_mult: float = 1.0
static var tech_speed_mult: float = 1.0

static var _static_ao_shadow_poly: PackedVector2Array = PackedVector2Array()
static var _static_plinth_poly: PackedVector2Array = PackedVector2Array()
static var _static_plinth_pins: Array[Vector2] = []

static func _ensure_static_plinth() -> void:
	if _static_ao_shadow_poly.size() > 0:
		return
	var center_ground = Vector2(0.0, 0.0)
	var ao_rx = 23.0
	var ao_ry = 11.5
	for i in range(24):
		var ang = float(i) * TAU / 24.0
		_static_ao_shadow_poly.append(center_ground + Vector2(cos(ang) * ao_rx, sin(ang) * ao_ry))
	var plinth_rx = 23.0
	var plinth_ry = 11.5
	for i in range(24):
		var ang = float(i) * TAU / 24.0
		_static_plinth_poly.append(center_ground + Vector2(cos(ang) * plinth_rx, sin(ang) * plinth_ry))
	for pin_ang in [PI * 0.25, PI * 0.75, PI * 1.25, PI * 1.75]:
		_static_plinth_pins.append(center_ground + Vector2(cos(pin_ang) * plinth_rx * 0.88, sin(pin_ang) * plinth_ry * 0.88))

enum TargetPriority {
	FIRST = 0,     # Ưu tiên quái tiến xa nhất trên đường đi (gần căn cứ nhất)
	STRONGEST = 1, # Ưu tiên quái có nhiều máu + khiên nhất (Diệt Boss / Mech bọc thép)
	WEAKEST = 2,   # Ưu tiên quái ít máu nhất (Tỉa quái để dọn bớt mục tiêu)
	CLOSEST = 3,   # Ưu tiên quái ở gần trụ nhất
	FLYING = 4     # Ưu tiên quái bay trên không (Chim máy, Drone)
}

static func reset_tech_tree() -> void:
	tech_damage_mult = 1.0
	tech_range_mult = 1.0
	tech_speed_mult = 1.0

func cycle_target_priority() -> TargetPriority:
	target_priority = ((int(target_priority) + 1) % 5) as TargetPriority
	return target_priority

func get_target_priority_name(priority: int = -1) -> String:
	var p = target_priority if priority == -1 else (priority as TargetPriority)
	match p:
		TargetPriority.FIRST: return "ĐẦU TIÊN"
		TargetPriority.STRONGEST: return "MÁU CAO NHẤT"
		TargetPriority.WEAKEST: return "MÁU THẤP NHẤT"
		TargetPriority.CLOSEST: return "GẦN NHẤT"
		TargetPriority.FLYING: return "BAY TRÊN KHÔNG"
		_: return "ĐẦU TIÊN"

func get_effective_range() -> float:
	var rng = attack_range * range_buff * tech_range_mult * pad_range_mult
	if is_overclocked:
		rng *= 1.15 # +15% Tầm bắn khi Overclock
	return rng

func get_effective_damage() -> float:
	var syn_mult = 1.15 if _buff_decay_timer > 0.0 else 1.0
	return damage * tech_damage_mult * syn_mult

func get_effective_cooldown() -> float:
	var cd = maxf(0.04, (attack_cooldown / atk_speed_buff) / (tech_speed_mult * pad_speed_mult))
	if is_overclocked:
		cd /= 1.40 # +40% Tốc độ bắn khi Overclock
	if jammed_timer > 0.0:
		cd /= jammed_slow_factor # Giảm 35% tốc độ bắn do Xung Nhiễu Boss
	return cd

var target_priority: TargetPriority = TargetPriority.FIRST
var pad_range_mult: float = 1.0
var pad_speed_mult: float = 1.0

# Sprint 6: Quá Tải Xung Nhịp (Overclock) & Nhiễu Sóng Từ Boss (Jammed)
var is_overclocked: bool = false
var overclock_timer: float = 0.0
var overclock_cooldown: float = 0.0
var jammed_timer: float = 0.0
var jammed_slow_factor: float = 0.65

var tower_type: TowerType = TowerType.PLASMA_CANNON
var faction: FactionType = FactionType.SCI_FI
var attack_range: float = 230.0
var attack_cooldown: float = 0.55
var damage: float = 32.0

# Buffs từ Pylon Hào Quang
var atk_speed_buff: float = 1.0
var range_buff: float = 1.0
var _buff_decay_timer: float = 0.0

# Gatling Ramp-up (sát thương tăng dần khi bắn liên tục 1 mục tiêu)
var _ramp_target: Node2D = null
var _ramp_multiplier: float = 1.0

# Pylon Buffer Aura
var _pylon_pulse_timer: float = 0.0
var _pylon_wave_radius: float = 0.0

# Timers hoạt ảnh phép thuật & sinh học
var _frost_crystal_rot: float = 0.0
var _magma_bubble_timer: float = 0.0
var _void_eye_pulse: float = 0.0
var _spore_pulse_timer: float = 0.0

# Hệ thống cấp độ & Thống kê sát thương thực tế
var level: int = 1
var max_level: int = 4
var base_cost: int = 60
var total_invested: int = 60
var total_damage_dealt: int = 0
var kill_count: int = 0

var max_targets: int = 3:
	get:
		if tower_type == TowerType.TESLA_COIL:
			if level >= 4:
				return 8
			elif level >= 3:
				return 5
		return 3

var buff_aura_multiplier: float = 1.15:
	get:
		if tower_type == TowerType.PYLON_BUFFER:
			if level >= 4:
				return 1.45
			elif level >= 3:
				return 1.30
		return 1.15

func record_damage_dealt(dmg: float, killed: bool = false) -> void:
	total_damage_dealt += int(dmg)
	if killed:
		kill_count += 1

func get_tier3_perk_name() -> String:
	match tower_type:
		TowerType.GATLING_GUN:
			return "[CẤP 3: ĐẠN XUYÊN PHÁ - SÁT THƯƠNG CHUẨN +35%]"
		TowerType.PLASMA_CANNON:
			return "[CẤP 3: NHIỆT NĂNG LAN TỎA - +20% NỔ LAN & LÀM CHẬM 20%]"
		TowerType.TESLA_COIL:
			return "[CẤP 3: VÒNG XUYÊN THẤU - PHÁ KHIÊN & TÊ LIỆT 5 MỤC TIÊU]"
		TowerType.SAM_BATTERY:
			return "[CẤP 3: TẦM NHIỄU KHÔNG VẬT - SÁT THƯƠNG PHÒNG KHÔNG X3]"
		TowerType.FROST_SPIRE:
			return "[CẤP 3: BĂNG PHONG VĨNH CỬU - ĐÓNG BĂNG 2S]"
		TowerType.MAGMA_MONOLITH:
			return "[CẤP 3: CHẤN ĐỘNG NUNG CHẢY - ĐẤT CHÁY AOE KÉP]"
		TowerType.VOID_OBELISK:
			return "[CẤP 3: HƯ VÔ TẬN DIỆT - PHÂN RÃ % MÁU TỐI ĐA]"
		TowerType.SPORE_SPITTER:
			return "[CẤP 3: DỊCH BỆNH ĂN MÒN - BÀO MÒN GIÁP TOÀN BỘ QUÁI]"
		TowerType.PYLON_BUFFER:
			return "[CẤP 3: LÕI THỊNH VƯỢNG - BUFF +30% TỐC & +25G CUỐI WAVE]"
		_:
			return "[CẤP 3: NỘI TẠI CHUYÊN HÓA]"

func get_tier4_perk_name() -> String:
	match tower_type:
		TowerType.GATLING_GUN:
			return "[CẤP TỐI THƯỢNG: HYPER-OVERDRIVE - BÃO ĐẠN HOÀNG KIM & BỎ QUA GIÁP]"
		TowerType.PLASMA_CANNON:
			return "[CẤP TỐI THƯỢNG: LÕI ION VÔ TẬN - NỔ LAN SIÊU NĂNG & ĐỊA CHẤN ION]"
		TowerType.TESLA_COIL:
			return "[CẤP TỐI THƯỢNG: CẦU SÉT THẦN LỰC - GIẬT XÍCH TOÀN BỘ QUÁI]"
		TowerType.SAM_BATTERY:
			return "[CẤP TỐI THƯỢNG: PHÁO ĐÀI PHÒNG KHÔNG - XẢ TÊN LỬA LIÊN HOÀN]"
		TowerType.FROST_SPIRE:
			return "[CẤP TỐI THƯỢNG: BĂNG GIÁ TUYỆT ĐỐI - BÃO TUYẾT ĐÓNG BĂNG TOÀN DIỆN]"
		TowerType.MAGMA_MONOLITH:
			return "[CẤP TỐI THƯỢNG: THIÊN THẠCH NUNG CHẢY - VÙNG DUNG NHAM VĨNH CỬU]"
		TowerType.VOID_OBELISK:
			return "[CẤP TỐI THƯỢNG: LỖ ĐEN HƯ VÔ - HÚT & PHÂN RÃ CỰC HẠN]"
		TowerType.SPORE_SPITTER:
			return "[CẤP TỐI THƯỢNG: DỊCH BỆNH BĂNG HOẠI - BÀO MÒN 60% GIÁP & LÂY NHIỄM]"
		TowerType.PYLON_BUFFER:
			return "[CẤP TỐI THƯỢNG: THẦN ĐIỆN VĨNH CỬU - HÀO QUANG TOÀN ĐẢO & +50G CUỐI WAVE]"
		_:
			return "[CẤP TỐI THƯỢNG: SỨC MẠNH VÔ SONG]"

var _cooldown_timer: float = 0.0
var _recoil_offset: Vector2 = Vector2.ZERO
var _recoil_time: float = 0.0
var current_target: Node2D = null
var is_selected: bool = false:
	set(val):
		is_selected = val
		queue_redraw()

# Hướng ngắm mục tiêu & Tọa độ mâm xoay
var _aim_dir: Vector2 = Vector2.RIGHT
var _turret_mount_pos: Vector2 = Vector2.ZERO
var _is_facing_left: bool = false
var _current_dir_idx: int = 0
var _is_barrel_rotating: bool = false


# Góc xoay mâm súng ngắm mục tiêu mượt mà 360 độ (Smooth Circular Aiming)
var _aim_angle: float = 0.0
var _target_aim_angle: float = 0.0
var _idle_patrol_timer: float = 0.0
var _swivel_cooldown: float = 0.0

# Sạc Plasma
var _is_charging: bool = false
var _charge_timer: float = 0.0
const PLASMA_CHARGE_TIME: float = 0.25

# Gatling Visual Effects (theo Video)
var _barrel_spin_time: float = 0.0
var _gatling_barrel_spin_angle: float = 0.0
var _gatling_spin_speed: float = 0.0
var _muzzle_flash_timer: float = 0.0
var _muzzle_flash_rot: float = 0.0
var _muzzle_flash_scale: float = 1.0
var _shots_fired_count: int = 0
var _barrel_heat: float = 0.0

# Khói súng bốc lên sau mỗi phát bắn
var _smoke_puffs: Array[Dictionary] = []

# Tesla
var _idle_spark_timer: float = 0.0
var _spark_points: Array[Vector2] = []

# Nâng cấp Halo
var _halo_radius: float = 0.0
var _halo_alpha: float = 0.0
var _aura_rot: float = 0.0
var _was_needing_redraw: bool = true

# Sprite nodes
var sprite_base: Sprite2D = null
var sprite_head: Sprite2D = null
var _gatling_shader_mat: ShaderMaterial = null
var _base_scale: float = 0.18
var sound_synth: SoundSynthesizer = null

# Vòng bụi trắng tiếp đất (Ground Dust Ring)
var _ground_dust_radius: float = 0.0
var _ground_dust_alpha: float = 0.0

signal tower_fired(tower: Node2D, target: Node2D)
signal tower_upgraded(tower: Node2D, new_level: int)

func setup(type: TowerType) -> void:
	tower_type = type
	faction = get_faction_for_tower(tower_type)
	match tower_type:
		TowerType.PLASMA_CANNON:
			attack_range = 240.0
			attack_cooldown = 1.15
			damage = 55.0
			base_cost = 60
			_base_scale = 0.140
		TowerType.GATLING_GUN:
			attack_range = 230.0
			attack_cooldown = 0.12
			damage = 10.0
			base_cost = 100
			_base_scale = 0.140
		TowerType.TESLA_COIL:
			attack_range = 220.0
			attack_cooldown = 0.78
			damage = 46.0
			base_cost = 150
			_base_scale = 0.116
		TowerType.SAM_BATTERY:
			attack_range = 320.0
			attack_cooldown = 1.40
			damage = 68.0
			base_cost = 120
			_base_scale = 0.145
		TowerType.FROST_SPIRE:
			attack_range = 200.0
			attack_cooldown = 0.85
			damage = 24.0
			base_cost = 90
			_base_scale = 0.128
		TowerType.MAGMA_MONOLITH:
			attack_range = 220.0
			attack_cooldown = 1.30
			damage = 48.0
			base_cost = 110
			_base_scale = 0.136
		TowerType.VOID_OBELISK:
			attack_range = 250.0
			attack_cooldown = 0.95
			damage = 35.0
			base_cost = 140
			_base_scale = 0.132
		TowerType.SPORE_SPITTER:
			attack_range = 210.0
			attack_cooldown = 0.75
			damage = 28.0
			base_cost = 80
			_base_scale = 0.128
		TowerType.PYLON_BUFFER:
			attack_range = 180.0
			attack_cooldown = 1.00
			damage = 0.0
			base_cost = 130
			_base_scale = 0.136
	total_invested = base_cost

	if sprite_head:
		if tower_type == TowerType.GATLING_GUN:
			sprite_head.hframes = 6
			sprite_head.vframes = 1
			sprite_head.frame = 0
			sprite_head.material = null
			sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]
		elif tower_type == TowerType.PLASMA_CANNON or tower_type == TowerType.SAM_BATTERY:
			sprite_head.hframes = 1
			sprite_head.vframes = 1
			sprite_head.frame = 0
			sprite_head.material = null
			sprite_head.texture = TEX_PLASMA_32DIR[_current_dir_idx]

func _ready() -> void:
	add_to_group("animated_towers")
	sound_synth = SoundSynthesizer.get_shared(self)

	# Hiệu ứng "Dậm xuống đất" (Drop-in bounce) khi xây tháp mới
	play_drop_in_bounce()

	# 1. LAYER 1: ĐẾ THÁP (BASE) CỐ ĐỊNH 100% TRÊN BỆ ĐÁ TRÒN (KHÔNG BAO GIỜ NHẬN LỆNH ROTATE)
	sprite_base = Sprite2D.new()
	sprite_base.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	sprite_base.scale = Vector2(_base_scale, _base_scale)
	sprite_base.rotation = 0.0 # BẢO ĐẢM CỐ ĐỊNH 100%

	match tower_type:
		TowerType.PLASMA_CANNON:
			sprite_base.texture = TexPlasmaBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(-8.0, -16.0)
			sprite_base.position = _turret_mount_pos

		TowerType.GATLING_GUN:
			# Chân đế cơ giới 4 chân 3D đã tích hợp hoàn chỉnh 100% trong sprite tháp nguyên vẹn
			sprite_base.texture = TexGatlingBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(0.0, -20.0)
			sprite_base.position = _turret_mount_pos
			sprite_base.visible = false

		TowerType.TESLA_COIL:
			sprite_base.texture = TexTesla
			sprite_base.position = Vector2(-2.0, -27.0)
			_turret_mount_pos = Vector2(-2.0, -66.0)

		TowerType.SAM_BATTERY:
			sprite_base.texture = TexGatlingBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(0.0, -9.5)
			sprite_base.position = _turret_mount_pos

		_:
			# FROST_SPIRE, MAGMA_MONOLITH, VOID_OBELISK, SPORE_SPITTER, PYLON_BUFFER
			sprite_base.texture = TexPlasmaBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(-8.0, -16.0)
			sprite_base.position = _turret_mount_pos

	add_child(sprite_base)

	# 2. LAYER 2: NÒNG/ĐẦU SÚNG (BARREL/HEAD) - Cho các tháp cơ khí xoay nòng 32 hướng
	if tower_type == TowerType.GATLING_GUN or tower_type == TowerType.PLASMA_CANNON or tower_type == TowerType.SAM_BATTERY:
		sprite_head = Sprite2D.new()
		sprite_head.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		sprite_head.scale = Vector2(_base_scale, _base_scale)
		sprite_head.position = _turret_mount_pos
		sprite_head.rotation = 0.0
		sprite_head.centered = false
		sprite_head.offset = Vector2(-320.0, -320.0)
		_current_dir_idx = 0

		if tower_type == TowerType.GATLING_GUN:
			sprite_head.hframes = 6
			sprite_head.vframes = 1
			sprite_head.frame = 0
			sprite_head.material = null
			sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]
		else:
			sprite_head.hframes = 1
			sprite_head.vframes = 1
			sprite_head.frame = 0
			sprite_head.material = null
			sprite_head.texture = TEX_PLASMA_32DIR[_current_dir_idx]

		add_child(sprite_head)

## Cập nhật nòng súng Gatling Gun
func _update_gatling_shader_dir() -> void:
	pass

## Tọa độ đầu nòng súng thực tế theo hướng 8 chiều isometric
func get_muzzle_local_pos() -> Vector2:
	if not sprite_head:
		return _turret_mount_pos + Vector2(0.0, -30.0)

	var local_offset = Vector2.ZERO
	match tower_type:
		TowerType.GATLING_GUN:
			if _current_dir_idx >= 0 and _current_dir_idx < GATLING_MUZZLE_OFFSETS.size():
				local_offset = GATLING_MUZZLE_OFFSETS[_current_dir_idx]
			else:
				local_offset = Vector2(260.0, -75.0)
		TowerType.PLASMA_CANNON:
			if _current_dir_idx >= 0 and _current_dir_idx < PLASMA_MUZZLE_OFFSETS.size():
				local_offset = PLASMA_MUZZLE_OFFSETS[_current_dir_idx]
			else:
				local_offset = Vector2(164.0, -129.0)
		_:
			return _turret_mount_pos + Vector2(0.0, -42.0)

	# Đầu nòng súng vươn từ vị trí mount của ụ súng:
	return sprite_head.position + local_offset * _base_scale

## Vị trí tâm trục xoay của nòng súng trên bệ tháp trong tọa độ thế giới
func get_gun_pivot_world_pos() -> Vector2:
	var pivot_y_offset: float = GATLING_MUZZLE_OFFSETS[0].y * _base_scale if tower_type == TowerType.GATLING_GUN else -20.31
	return global_position + _turret_mount_pos + Vector2(0.0, pivot_y_offset)

func _process(delta: float) -> void:
	_aura_rot += delta * 2.5

	# Sprint 6: Cập nhật thời gian Quá Tải & Nhiễu Sóng Boss
	if is_overclocked:
		overclock_timer -= delta
		if overclock_timer <= 0.0:
			is_overclocked = false
			overclock_timer = 0.0
	if overclock_cooldown > 0.0:
		overclock_cooldown = maxf(0.0, overclock_cooldown - delta)
	if jammed_timer > 0.0:
		jammed_timer = maxf(0.0, jammed_timer - delta)

	# 1. Hồi chiêu & Giật lùi nòng súng (Recoil trượt ngang trên ray)
	if _cooldown_timer > 0.0:
		_cooldown_timer -= delta

	if _buff_decay_timer > 0.0:
		_buff_decay_timer -= delta
		if _buff_decay_timer <= 0.0:
			atk_speed_buff = 1.0
			range_buff = 1.0

	if _swivel_cooldown > 0.0:
		_swivel_cooldown -= delta

	if _recoil_time > 0.0 and tower_type != TowerType.GATLING_GUN and tower_type != TowerType.PLASMA_CANNON:
		_recoil_time -= delta
		_recoil_offset = _recoil_offset.move_toward(Vector2.ZERO, delta * 36.0)
		if _recoil_time <= 0.0:
			_recoil_offset = Vector2.ZERO
		if sprite_head:
			sprite_head.position = _turret_mount_pos + _recoil_offset
	else:
		_recoil_time = 0.0
		_recoil_offset = Vector2.ZERO
		if sprite_head:
			sprite_head.position = _turret_mount_pos

	# 2. Cập nhật khói súng (Smoke Puffs)
	_update_smoke_puffs(delta)

	# 3. Hoạt ảnh riêng biệt từng loại tháp
	_update_tower_specific_effects(delta)

	# 4. Quét mục tiêu & Hướng nòng súng chuẩn xác theo video
	_update_aim_and_fire(delta)

	# Tối ưu hóa 60 FPS: Chỉ redraw khi tháp đang bắn/recoil/flash, xoay nòng, có hiệu ứng hoặc được chọn
	var needs_redraw: bool = (
		is_selected
		or _recoil_time > 0.0
		or _muzzle_flash_timer > 0.0
		or _is_barrel_rotating
		or (tower_type == TowerType.GATLING_GUN and _gatling_spin_speed > 0.1)
		or _ground_dust_alpha > 0.01
		or not _smoke_puffs.is_empty()
		or is_overclocked
		or jammed_timer > 0.0
		or _buff_decay_timer > 0.0
		or _halo_alpha > 0.01
		or level >= 3
		or (tower_type == TowerType.PYLON_BUFFER)
		or (tower_type == TowerType.TESLA_COIL and not _spark_points.is_empty())
	)
	if needs_redraw or _was_needing_redraw:
		queue_redraw()
	_was_needing_redraw = needs_redraw
	_is_barrel_rotating = false

func _update_smoke_puffs(delta: float) -> void:
	var i = _smoke_puffs.size() - 1
	while i >= 0:
		var p = _smoke_puffs[i]
		p.life -= delta
		if p.life <= 0.0:
			_smoke_puffs.remove_at(i)
		else:
			p.pos += p.vel * delta
			p.vel.y -= 22.0 * delta
			p.vel.x *= 0.94
			var ratio = 1.0 - (p.life / p.max_life)
			p.radius = lerpf(p.start_radius, p.max_radius, ratio)
			p.alpha = clampf((p.life / p.max_life) * 0.65, 0.0, 1.0)
		i -= 1

func _update_tower_specific_effects(delta: float) -> void:
	if _muzzle_flash_timer > 0.0:
		_muzzle_flash_timer -= delta

	if tower_type == TowerType.GATLING_GUN:
		var has_target = is_instance_valid(current_target) and not current_target.is_queued_for_deletion() and not current_target.get("_is_dead")
		if has_target:
			# Nòng quay dồn dập tăng tốc khi khóa mục tiêu (18 rad/s) & quay tít mù khi xả đạn (36 rad/s)
			var target_spin = 36.0 if (_muzzle_flash_timer > 0.0 or _recoil_time > 0.0 or _cooldown_timer <= 0.08) else 18.0
			_gatling_spin_speed = lerpf(_gatling_spin_speed, target_spin, delta * 12.0)
		else:
			# Giảm tốc mượt mà có quán tính cơ học khi hết quái (Spool-down)
			_gatling_spin_speed = lerpf(_gatling_spin_speed, 0.0, delta * 5.0)
			if _gatling_spin_speed < 0.35:
				_gatling_spin_speed = 0.0

		# Luôn quay theo 1 chiều dương liên tục (Không gián đoạn, không đổi chiều)
		_gatling_barrel_spin_angle += _gatling_spin_speed * delta

		# Đổi frame nòng súng 6-nòng 3D mượt mà
		if sprite_head:
			if _gatling_spin_speed > 0.05:
				var phase = fmod(_gatling_barrel_spin_angle, TAU / 6.0) / (TAU / 6.0)
				sprite_head.frame = int(floor(phase * 6.0)) % 6
			else:
				sprite_head.frame = 0

	if tower_type == TowerType.TESLA_COIL:
		_idle_spark_timer -= delta
		if _idle_spark_timer <= 0.0:
			_idle_spark_timer = randf_range(0.08, 0.16)
			_spark_points.clear()
			var sphere_center = Vector2(-2.1, -76.0)
			for s in range(3):
				var ang = randf() * TAU
				var rad = randf_range(6.0, 16.0)
				_spark_points.append(sphere_center + Vector2(cos(ang), sin(ang)) * rad)

	if tower_type == TowerType.PLASMA_CANNON and _is_charging:
		_charge_timer -= delta
		# TRỤ SÚNG PLASMA CỐ ĐỊNH 100%, KHÔNG RUNG GIẬT
		if sprite_head:
			sprite_head.position = _turret_mount_pos
		if _charge_timer <= 0.0:
			_is_charging = false
			if is_instance_valid(current_target):
				_execute_plasma_blast(current_target)

	if tower_type == TowerType.PYLON_BUFFER:
		_pylon_pulse_timer -= delta
		_pylon_wave_radius += delta * 150.0
		var eff_range = get_effective_range()
		if _pylon_wave_radius > eff_range:
			_pylon_wave_radius = 20.0
		if _pylon_pulse_timer <= 0.0:
			_pylon_pulse_timer = 0.5
			_pulse_pylon_aura()

	if tower_type == TowerType.FROST_SPIRE:
		_frost_crystal_rot += delta * 2.0

	if tower_type == TowerType.MAGMA_MONOLITH:
		_magma_bubble_timer += delta * 2.5

	if tower_type == TowerType.VOID_OBELISK:
		_void_eye_pulse += delta * 3.0

	if tower_type == TowerType.SPORE_SPITTER:
		_spore_pulse_timer += delta * 2.2

func _update_aim_and_fire(delta: float) -> void:
	var eff_range = get_effective_range()
	var eff_cooldown = get_effective_cooldown()

	if is_instance_valid(current_target) and not current_target.is_queued_for_deletion() and not current_target.get("_is_dead"):
		if global_position.distance_to(current_target.global_position) > eff_range:
			current_target = null
	else:
		current_target = null

	if not current_target:
		current_target = _find_best_enemy()

	var prev_angle = _aim_angle
	var pivot_pos = get_gun_pivot_world_pos()

	if is_instance_valid(current_target) and sprite_head:
		var target_chest = current_target.get_chest_world_pos() if current_target.has_method("get_chest_world_pos") else current_target.global_position + Vector2(0.0, -22.0)
		var diff = target_chest - pivot_pos
		_target_aim_angle = diff.angle()

		# Nội suy góc xoay mâm súng mượt mà theo hình tròn quanh trụ (Smooth Circular Yaw Tracking)
		_aim_angle = lerp_angle(_aim_angle, _target_aim_angle, delta * 8.5)

		# Với súng Gatling: nòng quay dồn dập khi đang khóa mục tiêu
		if tower_type == TowerType.GATLING_GUN:
			_barrel_spin_time += delta * 18.0

		# 1. CẬP NHẬT HƯỚNG NÒNG SÚNG GẦN MỤC TIÊU NHẤT TRONG KHÔNG GIAN 2D
		var best_dir = get_closest_barrel_dir_idx(tower_type, _aim_angle)
		if best_dir != _current_dir_idx:
			_current_dir_idx = best_dir
			_is_barrel_rotating = true
			if tower_type == TowerType.GATLING_GUN and sprite_head:
				sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]
				_update_gatling_shader_dir()
			elif tower_type == TowerType.PLASMA_CANNON and sprite_head:
				sprite_head.texture = TEX_PLASMA_32DIR[_current_dir_idx]

			if sound_synth and _swivel_cooldown <= 0.0:
				sound_synth.play_turret_swivel()
				_swivel_cooldown = 0.25

		# 2. TRỤC NÒNG SÚNG CHUẨN XÁC 100%: Đường đạn bắt buộc đồng trục hoàn toàn với nòng súng
		var barrel_table: Array[float] = GATLING_BARREL_ANGLES if tower_type == TowerType.GATLING_GUN else PLASMA_BARREL_ANGLES
		var cur_barrel_angle: float = barrel_table[_current_dir_idx]
		_aim_dir = Vector2(cos(cur_barrel_angle), sin(cur_barrel_angle))

		# 3. FIRING GATE: Cho phép khai hỏa khi nòng súng đã xoay khớp vào vùng mục tiêu (18° cho Gatling, 12° cho Plasma)
		var angle_err = absf(angle_difference(cur_barrel_angle, _target_aim_angle))
		var max_err = deg_to_rad(18.0) if tower_type == TowerType.GATLING_GUN else deg_to_rad(12.0)
		var is_aim_aligned = angle_err <= max_err

		if is_aim_aligned and _cooldown_timer <= 0.0:
			_cooldown_timer = eff_cooldown
			_initiate_attack(current_target)
	else:
		# Khi rảnh rỗi / chưa có địch: Quét tuần tra mượt mà theo vòng cung tự nhiên
		_idle_patrol_timer += delta * 0.75
		var patrol_offset = sin(_idle_patrol_timer) * deg_to_rad(45.0)
		var base_patrol_dir = PI if _is_facing_left else 0.0
		_target_aim_angle = base_patrol_dir + patrol_offset
		_aim_angle = lerp_angle(_aim_angle, _target_aim_angle, delta * 3.5)

		if sprite_head:
			var best_dir = get_closest_barrel_dir_idx(tower_type, _aim_angle)
			if best_dir != _current_dir_idx:
				_current_dir_idx = best_dir
				if tower_type == TowerType.GATLING_GUN:
					sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]
					_update_gatling_shader_dir()
				elif tower_type == TowerType.PLASMA_CANNON:
					sprite_head.texture = TEX_PLASMA_32DIR[_current_dir_idx]

			var barrel_table: Array[float] = GATLING_BARREL_ANGLES if tower_type == TowerType.GATLING_GUN else PLASMA_BARREL_ANGLES
			var cur_barrel_angle: float = barrel_table[_current_dir_idx]
			_aim_dir = Vector2(cos(cur_barrel_angle), sin(cur_barrel_angle))

	# Áp dụng góc xoay và hướng vào Sprite Head:
	if sprite_head:
		var cos_aim = cos(_aim_angle)
		var prev_facing = _is_facing_left
		if cos_aim < -0.15:
			_is_facing_left = true
		elif cos_aim > 0.15:
			_is_facing_left = false

		if prev_facing != _is_facing_left or abs(angle_difference(_aim_angle, prev_angle)) > deg_to_rad(12.0) * delta * 60.0:
			if sound_synth and _swivel_cooldown <= 0.0:
				sound_synth.play_turret_swivel()
				_swivel_cooldown = 0.35

		sprite_head.rotation = 0.0
		sprite_head.scale = Vector2(_base_scale, _base_scale)

	# ĐẢM BẢO SPRITE ĐẦU THÁP GATLING LUÔN GIỮ TEXTURE 32 HƯỚNG CHUẨN XÁC, KHÔNG BỊ CO GIẬT MÉO HÌNH
	if tower_type == TowerType.GATLING_GUN and sprite_head:
		if sprite_head.texture != TEX_GATLING_32DIR[_current_dir_idx]:
			sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]

	# Với Tesla: Tự phóng điện râm ran
	if tower_type == TowerType.TESLA_COIL and is_instance_valid(current_target):
		if _cooldown_timer <= 0.0:
			_cooldown_timer = eff_cooldown
			_fire_tesla(current_target)

	# Với các tháp Phép / Sinh học không dùng sprite_head xoay nòng:
	if (tower_type == TowerType.FROST_SPIRE or tower_type == TowerType.MAGMA_MONOLITH or tower_type == TowerType.VOID_OBELISK or tower_type == TowerType.SPORE_SPITTER) and is_instance_valid(current_target):
		if _cooldown_timer <= 0.0:
			_cooldown_timer = eff_cooldown
			_initiate_attack(current_target)

func _find_best_enemy() -> Node2D:
	if tower_type == TowerType.PYLON_BUFFER:
		return null
	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	var eff_range = get_effective_range()
	var in_range: Array[Node2D] = []

	# Lọc kẻ địch còn sống trong tầm bắn
	for e in enemies:
		if is_instance_valid(e) and not e.is_queued_for_deletion() and not e.get("_is_dead"):
			var d = global_position.distance_to(e.global_position)
			if d <= eff_range:
				in_range.append(e)

	if in_range.is_empty():
		return null

	# Ưu tiên SAM BATTERY: Tìm mục tiêu bay (Flying) trước tiên
	if tower_type == TowerType.SAM_BATTERY:
		var flyers: Array[Node2D] = []
		for e in in_range:
			if e.get("is_flying") or e.get("armor_type") == AnimatedEnemy.ArmorType.AERIAL:
				flyers.append(e)
		if not flyers.is_empty():
			in_range = flyers

	# Chọn mục tiêu theo target_priority:
	var best: Node2D = in_range[0]
	match target_priority:
		TargetPriority.FIRST:
			var max_prog: float = -999999.0
			for e in in_range:
				var prog = e.get_path_progress() if e.has_method("get_path_progress") else -global_position.distance_to(e.global_position)
				if prog > max_prog:
					max_prog = prog
					best = e

		TargetPriority.STRONGEST:
			var max_hp_shield: float = -1.0
			for e in in_range:
				var hp_s = (e.get("current_hp") if e.get("current_hp") != null else 0.0) + (e.get("current_shield") if e.get("current_shield") != null else 0.0)
				if hp_s > max_hp_shield:
					max_hp_shield = hp_s
					best = e

		TargetPriority.WEAKEST:
			var min_hp: float = 9999999.0
			for e in in_range:
				var hp = e.get("current_hp") if e.get("current_hp") != null else 99999.0
				if hp < min_hp:
					min_hp = hp
					best = e

		TargetPriority.CLOSEST:
			var min_dist: float = 999999.0
			for e in in_range:
				var d = global_position.distance_to(e.global_position)
				if d < min_dist:
					min_dist = d
					best = e

		TargetPriority.FLYING:
			var max_prog: float = -999999.0
			var has_flyer: bool = false
			for e in in_range:
				var is_f = false
				if "is_flying" in e and e.get("is_flying"): is_f = true
				elif e.has_method("get") and e.get("variant") == 2: is_f = true # AIR_DRONE
				elif "enemy_type" in e and e.get("enemy_type") == 1: is_f = true # WINGED_BOT

				if is_f:
					if not has_flyer:
						has_flyer = true
						max_prog = -999999.0
					var prog = e.get_path_progress() if e.has_method("get_path_progress") else -global_position.distance_to(e.global_position)
					if prog > max_prog:
						max_prog = prog
						best = e
				elif not has_flyer:
					var prog = e.get_path_progress() if e.has_method("get_path_progress") else -global_position.distance_to(e.global_position)
					if prog > max_prog:
						max_prog = prog
						best = e

	return best

func _initiate_attack(target: Node2D) -> void:
	match tower_type:
		TowerType.GATLING_GUN:
			_fire_gatling(target)
		TowerType.PLASMA_CANNON:
			_fire_plasma_start(target)
		TowerType.TESLA_COIL:
			_fire_tesla(target)
		TowerType.SAM_BATTERY:
			_fire_sam(target)
		TowerType.FROST_SPIRE:
			_fire_frost(target)
		TowerType.MAGMA_MONOLITH:
			_fire_magma(target)
		TowerType.VOID_OBELISK:
			_fire_void(target)
		TowerType.SPORE_SPITTER:
			_fire_spore(target)

## 1. GATLING GUN: Bắn liên thanh vệt vàng siêu tốc, nòng giật ngang, vỏ đạn văng theo video
func _fire_gatling(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)
	_shots_fired_count += 1

	# Gatling Ramp-up
	if target == _ramp_target:
		_ramp_multiplier = minf(2.2, _ramp_multiplier + 0.08)
	else:
		_ramp_target = target
		_ramp_multiplier = 1.0

	var eff_dmg = get_effective_damage() * _ramp_multiplier

	# THÂN TRỤ CỐ ĐỊNH 100%, KHÔNG RUNG GIẬT HAY LẮC KHI BẮN
	_recoil_offset = Vector2.ZERO
	_recoil_time = 0.0
	if sprite_head:
		sprite_head.position = _turret_mount_pos

	# Chớp lửa đầu nòng dạng sao (Star Muzzle Flash) tại đúng chóp nòng súng
	_muzzle_flash_timer = 0.06
	_muzzle_flash_rot = randf_range(-PI, PI)
	_muzzle_flash_scale = randf_range(1.10, 1.45) if level >= 4 else randf_range(0.95, 1.25)

	var muzzle_pos = global_position + get_muzzle_local_pos()

	# Sinh làn khói súng bốc lên cuồn cuộn sau mỗi 2 phát bắn
	if _shots_fired_count % 2 == 0:
		_spawn_muzzle_smoke(muzzle_pos + _aim_dir * 6.0, _aim_dir)

	# Văng vỏ đạn đồng từ buồng đạn bên hông ụ súng (ejection port)
	var eject_side = -14.0 if not _is_facing_left else 14.0
	var eject_pos = global_position + _turret_mount_pos + Vector2(eject_side, -12.0)
	var pad_ground_y = global_position.y + 4.0
	var casing = CasingClass.new()
	casing.setup(eject_pos, _aim_dir, pad_ground_y, sound_synth)
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(casing)

	var perp = Vector2(-_aim_dir.y, _aim_dir.x)

	if level == 1:
		# Level 1: 1 nòng - 1 viên đạn tiêu chuẩn
		var proj = ProjectileClass.new()
		proj.source_tower = self
		if spawn_parent:
			spawn_parent.add_child(proj)
		proj.launch_straight(muzzle_pos, _aim_dir, target, eff_dmg, ProjectileClass.ProjectileType.GATLING_BULLET)
	elif level == 2:
		# Level 2: 2 nòng - 2 viên đạn song song từ 2 nòng súng
		for sign_val in [-1.0, 1.0]:
			var proj = ProjectileClass.new()
			proj.source_tower = self
			if spawn_parent:
				spawn_parent.add_child(proj)
			var sub_pos = muzzle_pos + perp * (sign_val * 2.8)
			proj.launch_straight(sub_pos, _aim_dir, target, eff_dmg * 0.65, ProjectileClass.ProjectileType.GATLING_BULLET)
	elif level == 3:
		# Level 3: 3 nòng - 3 tia đạn song song dồn dập (trái, giữa, phải) + đạn xuyên phá mỗi 3 phát
		for sign_val in [-1.0, 0.0, 1.0]:
			var proj = ProjectileClass.new()
			proj.source_tower = self
			if _shots_fired_count % 3 == 0 and sign_val == 0.0:
				proj.is_piercing = true
			if spawn_parent:
				spawn_parent.add_child(proj)
			var sub_pos = muzzle_pos + perp * (sign_val * 2.8)
			proj.launch_straight(sub_pos, _aim_dir, target, eff_dmg * 0.45, ProjectileClass.ProjectileType.GATLING_BULLET)
	else:
		# Level 4 (MAX): CẤP TỐI THƯỢNG - HYPER-OVERDRIVE
		# 3 luồng đạn hoàng kim cực tốc: Đạn chính giữa xuyên phá 100% + 2 luồng đạn sườn dồn sát thương cực đại
		for sign_val in [-1.0, 0.0, 1.0]:
			var proj = ProjectileClass.new()
			proj.source_tower = self
			if sign_val == 0.0:
				proj.is_piercing = true
			if spawn_parent:
				spawn_parent.add_child(proj)
			var sub_pos = muzzle_pos + perp * (sign_val * 3.2)
			var dmg_factor = 0.70 if sign_val == 0.0 else 0.45
			proj.launch_straight(sub_pos, _aim_dir, target, eff_dmg * dmg_factor, ProjectileClass.ProjectileType.GATLING_BULLET)

		if _shots_fired_count % 2 == 0:
			var proj_extra = ProjectileClass.new()
			proj_extra.source_tower = self
			if spawn_parent:
				spawn_parent.add_child(proj_extra)
			var side_offset = perp * (randf_range(-4.0, 4.0))
			proj_extra.launch_straight(muzzle_pos + side_offset, _aim_dir, target, eff_dmg * 0.35, ProjectileClass.ProjectileType.GATLING_BULLET)

	# Âm thanh súng máy thực tế trích xuất trực tiếp từ video
	if sound_synth:
		sound_synth.play_gatling_shot()

func _spawn_muzzle_smoke(spawn_pos: Vector2, shoot_dir: Vector2) -> void:
	var puff = {
		"pos": to_local(spawn_pos),
		"vel": shoot_dir * randf_range(25.0, 50.0) + Vector2(randf_range(-8, 8), -randf_range(18, 32)),
		"radius": randf_range(5.0, 7.5),
		"start_radius": randf_range(5.0, 7.5),
		"max_radius": randf_range(18.0, 26.0),
		"alpha": 0.65,
		"life": 0.45,
		"max_life": 0.45
	}
	_smoke_puffs.append(puff)

func _get_spawn_parent() -> Node:
	if is_inside_tree() and get_tree() and is_instance_valid(get_tree().current_scene):
		return get_tree().current_scene
	if get_parent():
		return get_parent()
	return null

## 2. PLASMA CANNON: Tụ năng lượng 0.25s, giật lùi nòng, bắn cầu ion xanh nổ AoE
func _fire_plasma_start(_target: Node2D) -> void:
	_is_charging = true
	_charge_timer = PLASMA_CHARGE_TIME
	if sound_synth:
		sound_synth.play_plasma_charge()

func _execute_plasma_blast(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)

	# TRỤ PLASMA CỐ ĐỊNH 100%, KHÔNG RUNG GIẬT, KHÔNG RECOIL NHÚN, CỐ ĐỊNH VỮNG CHÃI
	if sprite_head:
		sprite_head.position = _turret_mount_pos
		sprite_head.scale = Vector2(_base_scale, _base_scale)

	var muzzle_pos = global_position + get_muzzle_local_pos()

	# Khói ion xanh
	_spawn_muzzle_smoke(muzzle_pos, _aim_dir)

	var spawn_parent = _get_spawn_parent()
	var eff_dmg = get_effective_damage()
	var perp = Vector2(-_aim_dir.y, _aim_dir.x)

	if level == 1:
		# Level 1: 1 nòng - 1 Cầu Plasma ion
		var proj = ProjectileClass.new()
		proj.source_tower = self
		if spawn_parent:
			spawn_parent.add_child(proj)
		proj.launch_straight(muzzle_pos, _aim_dir, target, eff_dmg, ProjectileClass.ProjectileType.PLASMA_ORB)
	elif level == 2:
		# Level 2: 2 nòng - 2 Cầu Plasma song song
		for sign_val in [-1.0, 1.0]:
			var proj = ProjectileClass.new()
			proj.source_tower = self
			if spawn_parent:
				spawn_parent.add_child(proj)
			var sub_muzzle = muzzle_pos + perp * (sign_val * 5.0)
			proj.launch_straight(sub_muzzle, _aim_dir, target, eff_dmg * 0.65, ProjectileClass.ProjectileType.PLASMA_ORB)
	elif level == 3:
		# Level 3: 3 nòng - 3 Cầu Plasma xòe góc hình quạt
		var angles = [-0.14, 0.0, 0.14]
		for a_off in angles:
			var proj = ProjectileClass.new()
			proj.source_tower = self
			proj.is_thermal_overload = true
			if spawn_parent:
				spawn_parent.add_child(proj)
			var dir = _aim_dir.rotated(a_off)
			proj.launch_straight(muzzle_pos, dir, target, eff_dmg * 0.50, ProjectileClass.ProjectileType.PLASMA_ORB)
	else:
		# Level 4 (MAX): CẤP TỐI THƯỢNG - LÕI ION VÔ TẬN (SUPERCHARGED ION VORTEX)
		# 1 Cầu Siêu Năng Siêu Bão Ion cực mạnh ở giữa + 2 đạn bọc sườn
		var proj_main = ProjectileClass.new()
		proj_main.source_tower = self
		proj_main.is_thermal_overload = true
		if spawn_parent:
			spawn_parent.add_child(proj_main)
		proj_main.launch_straight(muzzle_pos, _aim_dir, target, eff_dmg * 1.25, ProjectileClass.ProjectileType.PLASMA_ORB)

		for sign_val in [-1.0, 1.0]:
			var proj_side = ProjectileClass.new()
			proj_side.source_tower = self
			proj_side.is_thermal_overload = true
			if spawn_parent:
				spawn_parent.add_child(proj_side)
			var side_dir = _aim_dir.rotated(sign_val * 0.12)
			var sub_muzzle = muzzle_pos + perp * (sign_val * 6.5)
			proj_side.launch_straight(sub_muzzle, side_dir, target, eff_dmg * 0.45, ProjectileClass.ProjectileType.PLASMA_ORB)

	if sound_synth:
		sound_synth.play_plasma_blast()

## 3. TESLA COIL: PHÓNG TIA SÉT ZICZAC TỨC THÌ & SÉT LAN TRUYỀN
func _fire_tesla(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)

	play_recoil_squash(Vector2(0, 1.0))

	var origin_pos = global_position + Vector2(0, -88.0)
	var primary_hit_pos = target.global_position + Vector2(0, -22.0)
	var eff_dmg = get_effective_damage()

	var secondary_targets: Array[Vector2] = []
	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e != target and not e.is_queued_for_deletion():
			var dist = target.global_position.distance_to(e.global_position)
			if dist <= 130.0:
				secondary_targets.append(e.global_position + Vector2(0, -22.0))
				if e.has_method("electrocute"):
					e.electrocute(0.20)
				var sec_dmg = eff_dmg * 0.60
				var was_sec_dead = e.get("_is_dead")
				if e.has_method("take_damage"):
					e.take_damage(sec_dmg, AnimatedEnemy.DamageType.ELECTRO_EMP)
				var now_sec_dead = e.get("_is_dead") or e.is_queued_for_deletion() or e.get("current_hp") <= 0.0
				record_damage_dealt(sec_dmg, not was_sec_dead and now_sec_dead)
				if secondary_targets.size() >= 2:
					break

	var was_target_dead = target.get("_is_dead")
	if target.has_method("electrocute"):
		target.electrocute(0.28)
	if target.has_method("take_damage"):
		target.take_damage(eff_dmg, AnimatedEnemy.DamageType.ELECTRO_EMP)
	var now_target_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
	record_damage_dealt(eff_dmg, not was_target_dead and now_target_dead)

	var lightning = LightningClass.new()
	lightning.setup(origin_pos, primary_hit_pos, secondary_targets)
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(lightning)

	if sound_synth:
		sound_synth.play_tesla_lightning()

## 4. SAM BATTERY: Bắn tên lửa tầm xa ưu tiên quái bay
func _fire_sam(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)
	play_recoil_squash(_aim_dir)
	var muzzle_pos = global_position + get_muzzle_local_pos()
	_spawn_muzzle_smoke(muzzle_pos, _aim_dir)
	var proj = ProjectileClass.new()
	proj.source_tower = self
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(proj)
	proj.launch_straight(muzzle_pos, _aim_dir, target, get_effective_damage(), ProjectileClass.ProjectileType.SAM_MISSILE)
	if sound_synth:
		sound_synth.play_plasma_blast()

## 5. FROST SPIRE: Bắn mảnh băng làm chậm diện rộng, 5 tầng đóng băng 2s
func _fire_frost(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)
	var muzzle_pos = global_position + Vector2(0.0, -55.0)
	var proj = ProjectileClass.new()
	proj.source_tower = self
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(proj)
	var shoot_dir = (target.global_position + Vector2(0, -22.0) - muzzle_pos).normalized()
	proj.launch_straight(muzzle_pos, shoot_dir, target, get_effective_damage(), ProjectileClass.ProjectileType.FROST_SHARD)
	if sound_synth:
		sound_synth.play_hit()

## 6. MAGMA MONOLITH: Bắn cầu dung nham tạo đất cháy AoE
func _fire_magma(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)
	var muzzle_pos = global_position + Vector2(0.0, -50.0)
	var proj = ProjectileClass.new()
	proj.source_tower = self
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(proj)
	var shoot_dir = (target.global_position + Vector2(0, -22.0) - muzzle_pos).normalized()
	proj.launch_straight(muzzle_pos, shoot_dir, target, get_effective_damage(), ProjectileClass.ProjectileType.MAGMA_BOMB)
	if sound_synth:
		sound_synth.play_plasma_blast()

## 7. VOID OBELISK: Tia phân rã % Máu tối đa đơn mục tiêu
func _fire_void(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)
	var muzzle_pos = global_position + Vector2(0.0, -55.0)
	var proj = ProjectileClass.new()
	proj.source_tower = self
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(proj)
	var shoot_dir = (target.global_position + Vector2(0, -22.0) - muzzle_pos).normalized()
	proj.launch_straight(muzzle_pos, shoot_dir, target, get_effective_damage(), ProjectileClass.ProjectileType.VOID_RAY)
	if sound_synth:
		sound_synth.play_tesla_zap()

## 8. SPORE SPITTER: Bắn dịch axit bào mòn giáp, lây lan mầm bệnh
func _fire_spore(target: Node2D) -> void:
	emit_signal("tower_fired", self, target)
	var muzzle_pos = global_position + Vector2(0.0, -42.0)
	var proj = ProjectileClass.new()
	proj.source_tower = self
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(proj)
	var shoot_dir = (target.global_position + Vector2(0, -22.0) - muzzle_pos).normalized()
	proj.launch_straight(muzzle_pos, shoot_dir, target, get_effective_damage(), ProjectileClass.ProjectileType.ACID_SPORE)
	if sound_synth:
		sound_synth.play_hit()

## 9. PYLON BUFFER: Hào quang buff tốc đánh + tầm bắn & thanh tẩy trừ tà
func _pulse_pylon_aura() -> void:
	var eff_range = get_effective_range()
	var spd_mult = 1.35 if level >= 3 else 1.25
	var rng_mult = 1.25 if level >= 3 else 1.15
	var parent_node = get_parent()
	if parent_node:
		for sibling in parent_node.get_children():
			if is_instance_valid(sibling) and sibling is AnimatedTower and sibling != self:
				if global_position.distance_to(sibling.global_position) <= eff_range:
					sibling.apply_pylon_buff(spd_mult, rng_mult, 0.75)

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and not e.is_queued_for_deletion() and not e.get("_is_dead"):
			if global_position.distance_to(e.global_position) <= eff_range:
				if e.get("is_ethereal") or e.get("armor_type") == AnimatedEnemy.ArmorType.ETHEREAL:
					e.take_damage(25.0, AnimatedEnemy.DamageType.TRUE_DAMAGE)

func apply_pylon_buff(spd_mult: float, rng_mult: float, duration: float) -> void:
	atk_speed_buff = maxf(atk_speed_buff, spd_mult)
	range_buff = maxf(range_buff, rng_mult)
	_buff_decay_timer = duration

## Hệ thống Cấp Độ & Nâng Cấp
func can_upgrade() -> bool:
	return level < max_level

func get_upgrade_cost() -> int:
	if level == 1:
		return int(float(base_cost) * 0.70)
	elif level == 2:
		return int(float(base_cost) * 1.20)
	elif level == 3:
		return int(float(base_cost) * 2.00)
	return 9999

func get_sell_value(is_between_waves: bool = false) -> int:
	var refund_rate: float = 0.85 if is_between_waves else 0.70
	return int(float(total_invested) * refund_rate)

func can_overclock() -> bool:
	return overclock_cooldown <= 0.0 and not is_overclocked

func activate_overclock() -> bool:
	if not can_overclock():
		return false
	is_overclocked = true
	overclock_timer = 6.0
	overclock_cooldown = 15.0
	_spawn_combat_text("OVERCLOCK!", Color(0.2, 0.95, 1.0))
	queue_redraw()
	return true

func apply_jammed(duration: float = 3.0, slow_pct: float = 0.35) -> void:
	jammed_timer = maxf(jammed_timer, duration)
	jammed_slow_factor = minf(jammed_slow_factor, 1.0 - slow_pct)
	_spawn_combat_text("NHIỄU SÓNG -35%!", Color(0.85, 0.3, 0.95))
	queue_redraw()

func _spawn_combat_text(txt: String, col: Color) -> void:
	if not is_inside_tree() or not get_tree() or not get_tree().current_scene:
		return
	var label = Label.new()
	label.text = txt
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", col)
	label.add_theme_color_override("font_outline_color", Color(0.1, 0.08, 0.05, 0.95))
	label.add_theme_constant_override("outline_size", 4)
	label.global_position = global_position + Vector2(randf_range(-20.0, 10.0), -65.0)
	label.z_index = 32
	get_tree().current_scene.add_child(label)

	var tw = label.create_tween()
	tw.tween_property(label, "global_position:y", label.global_position.y - 32.0, 0.65).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(label, "modulate:a", 0.0, 0.65)
	tw.tween_callback(label.queue_free)

func upgrade() -> bool:
	if not can_upgrade():
		return false

	var cost = get_upgrade_cost()
	total_invested += cost
	level += 1

	damage *= 1.35
	attack_range += 15.0
	attack_cooldown = maxf(0.08, attack_cooldown * 0.88)

	_trigger_upgrade_halo()
	play_drop_in_bounce()

	if sound_synth:
		sound_synth.play_upgrade()

	emit_signal("tower_upgraded", self, level)
	return true

func _trigger_upgrade_halo() -> void:
	_halo_radius = 12.0
	_halo_alpha = 1.0

	var tween = create_tween()
	tween.tween_property(self, "_halo_radius", 68.0, 0.45).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(self, "_halo_alpha", 0.0, 0.45)

	if sprite_head:
		var base_sc = Vector2(_base_scale, _base_scale)
		sprite_head.scale = base_sc * 1.25
		var tween_s = sprite_head.create_tween()
		tween_s.tween_property(sprite_head, "scale", base_sc, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

## Hàm vẽ vòng elip chuẩn Isometric dẹt 2.5D dùng chung (ry = rx * 0.48)
func draw_isometric_ring(center: Vector2, radius_x: float, color: Color, width: float = 1.5, start_angle: float = 0.0, end_angle: float = TAU, segments: int = 32) -> void:
	var pts = PackedVector2Array()
	var ry = radius_x * 0.48
	var angle_span = end_angle - start_angle
	for i in range(segments + 1):
		var a = start_angle + float(i) * angle_span / float(segments)
		pts.append(center + Vector2(cos(a) * radius_x, sin(a) * ry))
	draw_polyline(pts, color, width)

## Hoạt họa Nhún & Giật Nòng (Squash & Stretch Recoil trong 0.12s)
func play_recoil_squash(shoot_dir: Vector2) -> void:
	if tower_type == TowerType.PLASMA_CANNON or tower_type == TowerType.GATLING_GUN:
		_recoil_offset = Vector2.ZERO
		_recoil_time = 0.0
		scale = Vector2.ONE
		if sprite_head:
			sprite_head.position = _turret_mount_pos
		return
	_recoil_offset = -shoot_dir.normalized() * 3.5
	_recoil_time = 0.12
	# CỐ ĐỊNH 100% TOÀN THÂN TRỤ TRÊN MẶT ĐẤT - CẤM TWEEN SCALE/POSITION CỦA SELF
	scale = Vector2.ONE

## Hoạt ảnh "Dậm xuống đất" (Drop-in bounce) khi xây hoặc nâng cấp tháp
func play_drop_in_bounce() -> void:
	scale = Vector2(0.6, 1.35)
	_ground_dust_radius = 8.0
	_ground_dust_alpha = 0.95
	var tw = create_tween()
	tw.tween_property(self, "scale", Vector2(1.12, 0.88), 0.16).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.tween_property(self, "scale", Vector2(1.0, 1.0), 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

	var tw_dust = create_tween()
	tw_dust.tween_property(self, "_ground_dust_radius", 38.0, 0.35).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw_dust.parallel().tween_property(self, "_ground_dust_alpha", 0.0, 0.35)

func _draw() -> void:
	var center_ground = Vector2(0.0, 0.0)

	# 0. BỆ ĐÁ CỔ NGỮ ISOMETRIC 2 LỚP & BÓNG TIẾP ĐẤT DƯỚI CHÂN TRỤ (GROUNDING & TACTICAL STONE PLINTH)
	# Quy tắc 4 AGENTS.md: Trụ Gatling đã có chân đế cơ giới và đổ bóng nguyên vẹn, cấm vẽ vòng tròn/đa giác đen giả nhân tạo
	if tower_type != TowerType.GATLING_GUN:
		_ensure_static_plinth()

		# Lớp 1 (Ambient Occlusion Shadow): Elip đen mềm rx = 26, ry = 13, Color(0.02, 0.05, 0.02, 0.55)
		draw_colored_polygon(_static_ao_shadow_poly, Color(0.02, 0.05, 0.02, 0.55))

		# 4-6 cụm cỏ/đá nhỏ tiệp màu với mặt cỏ đảo (Color(0.32, 0.48, 0.22, 0.85)) ôm nhẹ quanh mép dưới đế trụ:
		var grass_tufts = [
			Vector2(-24.0, 3.0), Vector2(-15.0, 9.0), Vector2(-3.0, 11.5),
			Vector2(12.0, 10.5), Vector2(22.0, 4.0), Vector2(1.0, 8.0)
		]
		for g_pos in grass_tufts:
			draw_circle(g_pos, 1.8, Color(0.32, 0.48, 0.22, 0.85))
			draw_line(g_pos, g_pos + Vector2(-1.0, -3.5), Color(0.42, 0.60, 0.28, 0.90), 1.2)
			draw_line(g_pos, g_pos + Vector2(1.2, -3.0), Color(0.38, 0.55, 0.25, 0.90), 1.2)

		# Lớp 2 (Tactical Stone Plinth): Vòng elip viền đá/kim loại mỏng rx = 26, ry = 13, Color(0.22, 0.28, 0.35, 0.65)
		draw_colored_polygon(_static_plinth_poly, Color(0.12, 0.16, 0.22, 0.60))
		draw_polyline(_static_plinth_poly, Color(0.22, 0.28, 0.35, 0.65), 1.6)

		# 4 chốt góc kim loại nhỏ (Metal Corner Pins) tại 45°, 135°, 225°, 315°
		for pin_pos in _static_plinth_pins:
			draw_circle(pin_pos, 2.2, Color(0.35, 0.42, 0.52, 0.85))
			draw_circle(pin_pos, 1.2, Color(0.70, 0.80, 0.90, 0.95))

	# Vòng bụi trắng tỏa ra quanh chân đế khi xây / nâng cấp
	if _ground_dust_alpha > 0.01:
		draw_set_transform(center_ground, 0.0, Vector2(1.0, 0.48))
		draw_arc(Vector2.ZERO, _ground_dust_radius, 0, TAU, 36, Color(0.92, 0.95, 1.0, _ground_dust_alpha * 0.70), 2.5)
		draw_arc(Vector2.ZERO, _ground_dust_radius * 0.75, 0, TAU, 36, Color(1.0, 1.0, 1.0, _ground_dust_alpha * 0.40), 1.5)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# 1. KHÓI SÚNG (Gun Smoke Puffs)
	for p in _smoke_puffs:
		var smk_col = Color(0.75, 0.78, 0.82, p.alpha)
		var smk_core = Color(0.90, 0.92, 0.95, p.alpha * 0.5)
		draw_circle(p.pos, p.radius, smk_col)
		draw_circle(p.pos + Vector2(0, -p.radius * 0.25), p.radius * 0.6, smk_core)

	# 3. VÒNG TỰA KHÓA MỤC TIÊU & TIA LASER NGẮM (Chỉ hiển thị khi người chơi chọn tháp)
	if is_selected and is_instance_valid(current_target) and not current_target.is_queued_for_deletion():
		var target_local = to_local(current_target.global_position + Vector2(0, -22.0))
		var muzzle_local = get_muzzle_local_pos()
		var laser_dist = muzzle_local.distance_to(target_local)
		var laser_end = muzzle_local + _aim_dir * laser_dist

		var laser_col = Color(1.0, 0.35, 0.12, 0.45) if tower_type == TowerType.GATLING_GUN else Color(0.2, 0.95, 1.0, 0.40)
		draw_line(muzzle_local, laser_end, laser_col, 1.5)
		draw_circle(target_local, 3.5, laser_col)

	# 4. Vòng tròn hiển thị tầm bắn khi được chọn (Isometric 2.5D dẹt ry = rx * 0.48)
	if is_selected:
		var eff_range = get_effective_range()
		draw_isometric_ring(Vector2.ZERO, eff_range, Color(0.2, 0.95, 1.0, 0.45), 1.8, 0, TAU, 48)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.0, 0.48))
		draw_circle(Vector2.ZERO, 28.0, Color(0.2, 0.9, 1.0, 0.15))
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# 4.1. Vòng hào quang Pylon Buff nếu tháp đang được hưởng lợi (Isometric 2.5D)
	if atk_speed_buff > 1.0 or range_buff > 1.0:
		draw_isometric_ring(Vector2.ZERO, 34.0, Color(1.0, 0.85, 0.25, 0.65), 2.0)

	# 4.2. Hiệu ứng Quá Tải Xung Nhịp (Overclock Arc Rings & Rotating Gears)
	if is_overclocked:
		var oc_rot = _idle_patrol_timer * 10.0
		var oc_rad = 36.0
		draw_isometric_ring(Vector2.ZERO, oc_rad, Color(0.2, 0.95, 1.0, 0.90), 2.5, oc_rot, oc_rot + PI * 0.8)
		draw_isometric_ring(Vector2.ZERO, oc_rad, Color(1.0, 0.85, 0.25, 0.90), 2.5, oc_rot + PI, oc_rot + PI * 1.8)
		draw_isometric_ring(Vector2.ZERO, oc_rad + 6.0, Color(0.25, 1.0, 0.7, 0.55), 1.8, -oc_rot, -oc_rot + PI)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.0, 0.48))
		draw_circle(Vector2.ZERO, 10.0, Color(0.2, 0.95, 1.0, 0.15))
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# 4.3. Hiệu ứng Nhiễu Sóng Từ Boss (Jammed Pulsing Aura)
	if jammed_timer > 0.0:
		var j_pulse = 0.5 + 0.5 * sin(_idle_patrol_timer * 12.0)
		draw_isometric_ring(Vector2.ZERO, 30.0, Color(0.85, 0.25, 0.95, 0.65 + 0.35 * j_pulse), 2.0)
		draw_string(ThemeDB.fallback_font, Vector2(-36.0, -55.0), "NHIỄU (-35%)", HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(0.9, 0.4, 1.0))

	# 5. Hiệu ứng thăng cấp Halo
	if _halo_alpha > 0.01:
		var halo_col = Color(1.0, 0.85, 0.2, _halo_alpha)
		draw_isometric_ring(Vector2.ZERO, _halo_radius, halo_col, 3.5)

	# 6. Tháp Cấp 3: 2 ngọc hào quang xoay quanh đỉnh tháp
	if level == 3:
		var orb_dist = 22.0
		var top_y = -85.0 if (tower_type == TowerType.TESLA_COIL or tower_type == TowerType.PYLON_BUFFER) else -38.0
		var p1 = Vector2(cos(_aura_rot), sin(_aura_rot) * 0.4) * orb_dist + Vector2(0, top_y)
		var p2 = Vector2(cos(_aura_rot + PI), sin(_aura_rot + PI) * 0.4) * orb_dist + Vector2(0, top_y)
		draw_circle(p1, 3.5, Color(1.0, 0.85, 0.2, 0.95))
		draw_circle(p2, 3.5, Color(0.2, 0.95, 1.0, 0.95))

	# 6.1. HIỆU ỨNG VFX ĐẶC BIỆT CỦA CẤP TỐI THƯỢNG (LEVEL 4 MAX SPECIAL VFX)
	if level >= 4:
		_draw_level4_max_vfx()

	# 7. CHỚP LỬA ĐẦU NÒNG HÌNH SAO SẮC NÉT (Star Muzzle Flash) TẠI ĐÚNG ĐẦU NÒNG SÚNG
	if tower_type == TowerType.GATLING_GUN and _muzzle_flash_timer > 0.0:
		var m_pos = get_muzzle_local_pos()
		var alpha = clampf(_muzzle_flash_timer / 0.06, 0.0, 1.0)
		var sc = _muzzle_flash_scale

		# Định hướng chớp lửa tỏa ra phía trước đầu nòng súng (_aim_dir), tuyệt đối không vẽ lùi vào trong nòng súng
		var base_a = _aim_dir.angle()
		var flash_pos = m_pos + _aim_dir * 6.5
		var perp = Vector2(-_aim_dir.y, _aim_dir.x)

		# Tia chớp chính thẳng hướng đạn bay
		var l_main = 19.0 * sc
		var w_main = 3.6 * sc
		var tip_main = flash_pos + _aim_dir * l_main
		var l_pt = flash_pos + _aim_dir * (2.5 * sc) + perp * w_main
		var r_pt = flash_pos + _aim_dir * (2.5 * sc) - perp * w_main
		draw_colored_polygon(PackedVector2Array([flash_pos, l_pt, tip_main, r_pt]), Color(1.0, 0.88, 0.30, 0.95 * alpha))

		# Cặp tia chớp phụ xòe góc nhọn phía trước (±30°), hướng ra không khí
		var l_sub = 12.0 * sc
		var w_sub = 2.4 * sc
		for ang_off in [-0.52, 0.52]:
			var d_sub = Vector2(cos(base_a + ang_off), sin(base_a + ang_off) * 0.75).normalized()
			var p_sub = Vector2(-d_sub.y, d_sub.x)
			var tip = flash_pos + d_sub * l_sub
			var p_l = flash_pos + d_sub * (2.0 * sc) + p_sub * w_sub
			var p_r = flash_pos + d_sub * (2.0 * sc) - p_sub * w_sub
			draw_colored_polygon(PackedVector2Array([flash_pos, p_l, tip, p_r]), Color(1.0, 0.65, 0.15, 0.85 * alpha))

		# Cặp tia lửa tạt bên hông phía trước đầu nòng (±60°)
		var l_side = 7.5 * sc
		var w_side = 1.6 * sc
		for ang_off in [-1.05, 1.05]:
			var d_side = Vector2(cos(base_a + ang_off), sin(base_a + ang_off) * 0.75).normalized()
			var p_side = Vector2(-d_side.y, d_side.x)
			var tip = flash_pos + d_side * l_side
			var p_l = flash_pos + d_side * (1.5 * sc) + p_side * w_side
			var p_r = flash_pos + d_side * (1.5 * sc) - p_side * w_side
			draw_colored_polygon(PackedVector2Array([flash_pos, p_l, tip, p_r]), Color(1.0, 0.50, 0.10, 0.75 * alpha))

		# Lõi chớp trắng sáng ngoài đầu nòng
		draw_circle(flash_pos + _aim_dir * 2.5, 3.5 * sc, Color(1.0, 1.0, 0.95, 1.0 * alpha))
		draw_circle(flash_pos + _aim_dir * 2.5, 6.5 * sc, Color(1.0, 0.85, 0.25, 0.40 * alpha))

	# 8. Quả cầu năng lượng Plasma đang tụ khi sạc
	if tower_type == TowerType.PLASMA_CANNON and _is_charging:
		var m_pos = get_muzzle_local_pos()
		var charge_ratio = 1.0 - (_charge_timer / PLASMA_CHARGE_TIME)
		var rad = lerpf(3.0, 12.0, charge_ratio)
		draw_circle(m_pos, rad, Color(0.2, 0.95, 1.0, 0.85))
		draw_circle(m_pos, rad * 0.5, Color(1.0, 1.0, 1.0, 0.95))

	# 9. Hạt tia sét mini quanh chóp tháp Tesla
	if tower_type == TowerType.TESLA_COIL:
		for pt in _spark_points:
			draw_circle(pt, 2.0, Color(0.7, 0.4, 1.0, 0.85))
			draw_line(Vector2(0, -88.0), pt, Color(1.0, 1.0, 1.0, 0.9), 1.0)

	# 10. SAM BATTERY: Ống phóng tên lửa & Đèn radar
	if tower_type == TowerType.SAM_BATTERY:
		var m_pos = get_muzzle_local_pos()
		draw_circle(m_pos, 6.0, Color(1.0, 0.35, 0.1, 0.9))
		draw_circle(m_pos, 3.0, Color(1.0, 0.9, 0.2, 0.95))

	# 11. FROST SPIRE: Trụ pha lê băng & Mảnh băng xoay quanh
	if tower_type == TowerType.FROST_SPIRE:
		var frost_poly = PackedVector2Array([Vector2(-11, -16), Vector2(11, -16), Vector2(7, -68), Vector2(0, -92), Vector2(-7, -68)])
		draw_colored_polygon(frost_poly, Color(0.35, 0.82, 0.98, 0.88))
		draw_polyline(frost_poly, Color(0.75, 0.95, 1.0, 0.95), 1.8)
		draw_circle(Vector2(0, -92), 6.5, Color(0.85, 0.98, 1.0, 0.95))
		for c in range(3):
			var c_ang = _frost_crystal_rot + float(c) * TAU / 3.0
			var c_pos = Vector2(cos(c_ang) * 19.0, sin(c_ang) * 6.5 - 62.0)
			draw_circle(c_pos, 3.8, Color(0.6, 0.95, 1.0, 0.92))

	# 12. MAGMA MONOLITH: Trụ dung nham & Khe nứt phát sáng
	if tower_type == TowerType.MAGMA_MONOLITH:
		var magma_poly = PackedVector2Array([Vector2(-14, -16), Vector2(14, -16), Vector2(10, -62), Vector2(0, -85), Vector2(-10, -62)])
		draw_colored_polygon(magma_poly, Color(0.20, 0.11, 0.09, 0.95))
		draw_polyline(magma_poly, Color(1.0, 0.42, 0.08, 0.92), 2.0)
		draw_line(Vector2(0, -16), Vector2(3, -55), Color(1.0, 0.50, 0.10, 0.95), 2.8)
		draw_circle(Vector2(0, -82), 7.5, Color(1.0, 0.60, 0.15, 0.95))
		draw_circle(Vector2(0, -82), 15.0, Color(1.0, 0.35, 0.05, 0.35))

	# 13. VOID OBELISK: Tháp hư không & Mắt vũ trụ
	if tower_type == TowerType.VOID_OBELISK:
		var void_poly = PackedVector2Array([Vector2(-12, -16), Vector2(12, -16), Vector2(8, -68), Vector2(0, -94), Vector2(-8, -68)])
		draw_colored_polygon(void_poly, Color(0.12, 0.05, 0.19, 0.95))
		draw_polyline(void_poly, Color(0.68, 0.28, 0.98, 0.92), 2.0)
		var p_rad = 5.2 + sin(_void_eye_pulse) * 1.8
		draw_circle(Vector2(0, -64), p_rad, Color(0.88, 0.32, 1.0, 0.95))
		draw_arc(Vector2(0, -64), 13.0, 0, TAU, 24, Color(0.65, 0.22, 0.95, 0.65), 1.6)

	# 14. SPORE SPITTER: Bào tử sinh học & Bong bóng axit
	if tower_type == TowerType.SPORE_SPITTER:
		draw_circle(Vector2(0, -38), 16.5, Color(0.24, 0.62, 0.15, 0.95))
		draw_circle(Vector2(0, -38), 10.5, Color(0.48, 0.92, 0.26, 0.95))
		draw_circle(Vector2(0, -38), 4.5, Color(0.08, 0.28, 0.06, 0.95))
		var drop_y = -18.0 + sin(_spore_pulse_timer) * 4.0
		draw_circle(Vector2(-6, drop_y), 2.6, Color(0.45, 0.98, 0.22, 0.85))
		draw_circle(Vector2(6, drop_y - 2.0), 2.2, Color(0.45, 0.98, 0.22, 0.85))

	# 15. PYLON BUFFER: Đền thần ánh sáng & Sóng hào quang buff
	if tower_type == TowerType.PYLON_BUFFER:
		var eff_range = get_effective_range()
		# Sóng hào quang lan tỏa
		draw_circle(Vector2.ZERO, eff_range, Color(1.0, 0.88, 0.25, 0.06))
		draw_arc(Vector2.ZERO, eff_range, 0, TAU, 48, Color(1.0, 0.85, 0.25, 0.30), 1.5)
		draw_arc(Vector2.ZERO, _pylon_wave_radius, 0, TAU, 36, Color(1.0, 0.92, 0.40, 0.50 * (1.0 - _pylon_wave_radius / eff_range)), 2.2)

		# Cấu trúc đền thần
		var pylon_poly = PackedVector2Array([Vector2(-14, -16), Vector2(14, -16), Vector2(9, -70), Vector2(0, -96), Vector2(-9, -70)])
		draw_colored_polygon(pylon_poly, Color(0.95, 0.90, 0.75, 0.95))
		draw_polyline(pylon_poly, Color(1.0, 0.82, 0.20, 0.95), 2.2)
		draw_circle(Vector2(0, -96), 8.5, Color(1.0, 0.94, 0.40, 0.98))
		draw_circle(Vector2(0, -96), 18.0, Color(1.0, 0.85, 0.20, 0.35))

## Hiệu ứng đồ họa đặc biệt cho Tháp Cấp Tối Thượng (Level 4 MAX Special VFX)
func _draw_level4_max_vfx() -> void:
	match tower_type:
		TowerType.GATLING_GUN:
			# Hào quang Hoàng kim Quá tải (Golden Overdrive Aura)
			var a1 = _aura_rot * 2.2
			draw_isometric_ring(Vector2.ZERO, 38.0, Color(1.0, 0.82, 0.20, 0.90), 2.4, a1, a1 + PI * 1.4)
			draw_isometric_ring(Vector2.ZERO, 43.0, Color(1.0, 0.55, 0.10, 0.70), 1.8, -a1, -a1 + PI * 1.2)
			# 4 hạt năng lượng hoàng kim xoay quanh đế
			for m in range(4):
				var m_ang = _aura_rot * 2.8 + float(m) * TAU / 4.0
				var m_pos = Vector2(cos(m_ang) * 40.0, sin(m_ang) * 19.2)
				draw_circle(m_pos, 3.2, Color(1.0, 0.92, 0.35, 0.95))
				draw_circle(m_pos, 5.5, Color(1.0, 0.65, 0.15, 0.40))
			# Hạt tia lửa nhỏ lóe sáng từ buồng đạn
			var spark_ang = randf() * TAU
			var spark_pos = _turret_mount_pos + Vector2(cos(spark_ang) * 14.0, sin(spark_ang) * 8.0)
			draw_circle(spark_pos, 1.8, Color(1.0, 0.95, 0.6, 0.85))

		TowerType.PLASMA_CANNON:
			# Cặp vòng xoay Ion lưỡng cực Cyan & Magenta (Dual Orbiting Ion Rings)
			var r1 = _aura_rot * 2.0
			var r2 = -_aura_rot * 1.8
			draw_isometric_ring(Vector2.ZERO, 36.0, Color(0.20, 0.95, 1.0, 0.85), 2.2, r1, r1 + PI * 1.5)
			draw_isometric_ring(Vector2.ZERO, 42.0, Color(0.95, 0.25, 0.85, 0.80), 2.0, r2, r2 + PI * 1.5)
			# Cầu năng lượng ion siêu sáng lơ lửng tại khớp xoay ụ súng
			var core_pos = _turret_mount_pos + Vector2(0.0, -8.0)
			var core_pulse = 5.0 + sin(_aura_rot * 4.0) * 1.5
			draw_circle(core_pos, core_pulse, Color(0.20, 0.95, 1.0, 0.45))
			draw_circle(core_pos, 2.5, Color(1.0, 1.0, 1.0, 0.95))
			# 4 đốm năng lượng plasma xoay trên vòng
			for p in range(4):
				var p_ang = r1 + float(p) * TAU / 4.0
				var p_pos = Vector2(cos(p_ang) * 36.0, sin(p_ang) * 17.28)
				draw_circle(p_pos, 3.0, Color(0.3, 1.0, 0.9, 0.95))

		TowerType.TESLA_COIL:
			# Cầu sét thần lực (Ball Lightning Sphere) lơ lửng trên đỉnh tháp
			var sphere_pos = Vector2(-2.0, -88.0)
			var pulse_r = 9.0 + sin(_aura_rot * 5.0) * 2.0
			draw_circle(sphere_pos, pulse_r, Color(0.65, 0.30, 1.0, 0.40))
			draw_circle(sphere_pos, 5.5, Color(0.85, 0.70, 1.0, 0.85))
			draw_circle(sphere_pos, 2.8, Color(1.0, 1.0, 1.0, 0.98))
			# Vòng tĩnh điện tiếp đất
			draw_isometric_ring(Vector2.ZERO, 36.0, Color(0.60, 0.35, 1.0, 0.75), 2.0)

		TowerType.SAM_BATTERY:
			# Radar quét mục tiêu tầm xa & Đèn dẫn đường
			var scan_ang = _aura_rot * 1.5
			var scan_len = 50.0
			var scan_dir = Vector2(cos(scan_ang), sin(scan_ang) * 0.48)
			draw_line(Vector2.ZERO, scan_dir * scan_len, Color(0.2, 0.95, 0.5, 0.65), 1.6)
			draw_isometric_ring(Vector2.ZERO, 38.0, Color(1.0, 0.45, 0.15, 0.75), 1.8)

		TowerType.FROST_SPIRE:
			# Bão tuyết & 6 pha lê băng bay quanh đỉnh tháp
			draw_isometric_ring(Vector2.ZERO, 35.0, Color(0.4, 0.9, 1.0, 0.80), 2.0)
			for c in range(6):
				var c_ang = _aura_rot * 1.8 + float(c) * TAU / 6.0
				var c_pos = Vector2(cos(c_ang) * 26.0, sin(c_ang) * 10.0 - 64.0)
				draw_circle(c_pos, 3.5, Color(0.75, 0.98, 1.0, 0.95))

		TowerType.MAGMA_MONOLITH:
			# Địa chấn dung nham sôi sục & Vòng sóng nhiệt
			draw_isometric_ring(Vector2.ZERO, 38.0, Color(1.0, 0.35, 0.08, 0.85), 2.2)
			for f in range(5):
				var f_ang = _aura_rot * 2.2 + float(f) * TAU / 5.0
				var f_pos = Vector2(cos(f_ang) * 32.0, sin(f_ang) * 15.36)
				draw_circle(f_pos, 2.8, Color(1.0, 0.80, 0.20, 0.90))

		TowerType.VOID_OBELISK:
			# Lỗ đen hư vô & Đĩa bồi tụ trọng lực
			var v_pos = Vector2(0.0, -70.0)
			draw_circle(v_pos, 10.0, Color(0.08, 0.02, 0.15, 0.95))
			draw_circle(v_pos, 6.0, Color(0.0, 0.0, 0.0, 1.0))
			draw_arc(v_pos, 15.0, _aura_rot, _aura_rot + PI * 1.3, 24, Color(0.75, 0.25, 1.0, 0.90), 2.0)
			draw_isometric_ring(Vector2.ZERO, 38.0, Color(0.55, 0.18, 0.90, 0.75), 2.0)

		TowerType.SPORE_SPITTER:
			# Vầng sương mù độc sinh học
			draw_isometric_ring(Vector2.ZERO, 36.0, Color(0.35, 0.85, 0.20, 0.80), 2.0)
			for s in range(4):
				var s_ang = _aura_rot * 1.6 + float(s) * TAU / 4.0
				var s_pos = Vector2(cos(s_ang) * 28.0, sin(s_ang) * 13.44 - 15.0)
				draw_circle(s_pos, 3.5, Color(0.40, 0.95, 0.25, 0.80))

		TowerType.PYLON_BUFFER:
			# Thánh điện hoàng kim toàn diện
			draw_isometric_ring(Vector2.ZERO, 45.0, Color(1.0, 0.88, 0.25, 0.95), 2.5)
			draw_isometric_ring(Vector2.ZERO, 52.0, Color(1.0, 0.75, 0.15, 0.65), 1.8, -_aura_rot, -_aura_rot + PI)
			for g in range(6):
				var g_ang = _aura_rot * 2.0 + float(g) * TAU / 6.0
				var g_pos = Vector2(cos(g_ang) * 48.0, sin(g_ang) * 23.0)
				draw_circle(g_pos, 3.5, Color(1.0, 0.95, 0.50, 0.95))
