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
	Vector2(225.0, -120.0), # Dir 0 (0.00°)
	Vector2(210.0, -102.0), # Dir 1 (11.25°)
	Vector2(182.0, -87.0),  # Dir 2 (22.50°)
	Vector2(158.0, -77.0),  # Dir 3 (33.75°)
	Vector2(120.0, -67.0),  # Dir 4 (45.00°)
	Vector2(90.0, -62.0),   # Dir 5 (56.25°)
	Vector2(53.0, -58.0),   # Dir 6 (67.50°)
	Vector2(26.0, -55.0),   # Dir 7 (78.75°)
	Vector2(-5.0, -55.0),   # Dir 8 (90.00°)
	Vector2(-42.0, -55.0),  # Dir 9 (101.25°)
	Vector2(-92.0, -60.0),  # Dir 10 (112.50°)
	Vector2(-148.0, -66.0), # Dir 11 (123.75°)
	Vector2(-200.0, -75.0), # Dir 12 (135.00°)
	Vector2(-242.0, -85.0), # Dir 13 (146.25°)
	Vector2(-272.0, -100.0),# Dir 14 (157.50°)
	Vector2(-285.0, -115.0),# Dir 15 (168.75°)
	Vector2(-288.0, -130.0),# Dir 16 (180.00°)
	Vector2(-280.0, -145.0),# Dir 17 (191.25°)
	Vector2(-260.0, -160.0),# Dir 18 (202.50°)
	Vector2(-235.0, -175.0),# Dir 19 (213.75°)
	Vector2(-200.0, -190.0),# Dir 20 (225.00°)
	Vector2(-160.0, -200.0),# Dir 21 (236.25°)
	Vector2(-115.0, -210.0),# Dir 22 (247.50°)
	Vector2(-60.0, -220.0), # Dir 23 (258.75°)
	Vector2(0.0, -260.0),   # Dir 24 (270.00°)
	Vector2(180.0, -205.0), # Dir 25 (281.25°)
	Vector2(215.0, -195.0), # Dir 26 (292.50°)
	Vector2(235.0, -180.0), # Dir 27 (303.75°)
	Vector2(250.0, -165.0), # Dir 28 (315.00°)
	Vector2(255.0, -150.0), # Dir 29 (326.25°)
	Vector2(245.0, -135.0), # Dir 30 (337.50°)
	Vector2(235.0, -125.0), # Dir 31 (348.75°)
]

const PLASMA_MUZZLE_OFFSETS: Array[Vector2] = [
	Vector2(308.2, -109.8), # Dir 0 (0.00°)
	Vector2(302.2, -78.7),  # Dir 1 (11.25°)
	Vector2(286.7, -48.9),  # Dir 2 (22.50°)
	Vector2(262.1, -21.6),  # Dir 3 (33.75°)
	Vector2(229.6, 2.2),    # Dir 4 (45.00°)
	Vector2(190.2, 21.5),   # Dir 5 (56.25°)
	Vector2(145.7, 35.7),   # Dir 6 (67.50°)
	Vector2(97.5, 44.1),    # Dir 7 (78.75°)
	Vector2(47.7, 46.5),    # Dir 8 (90.00°)
	Vector2(-1.9, 42.7),    # Dir 9 (101.25°)
	Vector2(-49.4, 32.9),   # Dir 10 (112.50°)
	Vector2(-92.9, 17.5),   # Dir 11 (123.75°)
	Vector2(-130.8, -2.9),  # Dir 12 (135.00°)
	Vector2(-161.7, -27.6), # Dir 13 (146.25°)
	Vector2(-184.2, -55.5), # Dir 14 (157.50°)
	Vector2(-197.7, -85.7), # Dir 15 (168.75°)
	Vector2(-201.4, -117.0),# Dir 16 (180.00°)
	Vector2(-195.4, -148.1),# Dir 17 (191.25°)
	Vector2(-179.9, -177.9),# Dir 18 (202.50°)
	Vector2(-155.3, -205.2),# Dir 19 (213.75°)
	Vector2(-122.8, -229.0),# Dir 20 (225.00°)
	Vector2(-83.4, -248.3), # Dir 21 (236.25°)
	Vector2(-38.9, -262.5), # Dir 22 (247.50°)
	Vector2(9.3, -270.9),   # Dir 23 (258.75°)
	Vector2(59.1, -273.3),  # Dir 24 (270.00°)
	Vector2(108.7, -269.5), # Dir 25 (281.25°)
	Vector2(156.2, -259.7), # Dir 26 (292.50°)
	Vector2(199.7, -244.3), # Dir 27 (303.75°)
	Vector2(237.6, -223.9), # Dir 28 (315.00°)
	Vector2(268.5, -199.2), # Dir 29 (326.25°)
	Vector2(291.0, -171.3), # Dir 30 (337.50°)
	Vector2(304.5, -141.1), # Dir 31 (348.75°)
]

# GÓC HƯỚNG QUAY THỰC TẾ CỦA NÒNG SÚNG TRONG KHÔNG GIAN 2D ISOMETRIC CHO TỪNG FRAME TRONG 32 HƯỚNG
const GATLING_BARREL_ANGLES: Array[float] = [
	0.00000, 0.08551, 0.17937, 0.26572, 0.41590, 0.57246, 0.86350, 1.19029,
	1.64757, 2.14446, 2.56369, 2.79174, 2.92028, 2.99796, 3.06820, 3.12405,
	-3.10688, -3.05254, -2.98894, -2.91169, -2.80492, -2.67795, -2.47755, -2.11122,
	-1.57080, -1.03038, -0.66405, -0.46365, -0.31756, -0.20136, -0.10472, -0.03491
]

const PLASMA_BARREL_ANGLES: Array[float] = [
	0.01402, 0.13852, 0.26968, 0.41428, 0.58057, 0.77825, 1.01655, 1.29758,
	1.60640, 1.91128, 2.18315, 2.41161, 2.60126, 2.76180, 2.90268, 3.03176,
	-3.12758, -3.00307, -2.87191, -2.72731, -2.56103, -2.36334, -2.12504, -1.84401,
	-1.53519, -1.23031, -0.95844, -0.72998, -0.54033, -0.37980, -0.23892, -0.10983
]

## Tìm frame sprite có góc nòng súng hướng chuẩn xác nhất vào góc mục tiêu 2D
static func get_closest_barrel_dir_idx(type: TowerType, target_angle: float) -> int:
	var table: Array[float] = GATLING_BARREL_ANGLES if type == TowerType.GATLING_GUN else PLASMA_BARREL_ANGLES
	var best_idx: int = 0
	var min_diff: float = 999.0
	for i in range(32):
		var diff: float = absf(angle_difference(table[i], target_angle))
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
	var center_ground = Vector2(0.0, 4.0)
	var ao_rx = 34.0
	var ao_ry = 18.0
	for i in range(24):
		var ang = float(i) * TAU / 24.0
		_static_ao_shadow_poly.append(center_ground + Vector2(cos(ang) * ao_rx, sin(ang) * ao_ry))
	var plinth_rx = 28.0
	var plinth_ry = 14.0
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
var max_level: int = 3
var base_cost: int = 60
var total_invested: int = 60
var total_damage_dealt: int = 0
var kill_count: int = 0

var max_targets: int = 3:
	get:
		if tower_type == TowerType.TESLA_COIL and level >= 3:
			return 5
		return 3

var buff_aura_multiplier: float = 1.15:
	get:
		if tower_type == TowerType.PYLON_BUFFER and level >= 3:
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
var _muzzle_flash_timer: float = 0.0
var _muzzle_flash_rot: float = 0.0
var _muzzle_flash_scale: float = 1.0
var _shots_fired_count: int = 0

# Khói súng bốc lên sau mỗi phát bắn
var _smoke_puffs: Array[Dictionary] = []

# Tesla
var _idle_spark_timer: float = 0.0
var _spark_points: Array[Vector2] = []

# Nâng cấp Halo
var _halo_radius: float = 0.0
var _halo_alpha: float = 0.0
var _aura_rot: float = 0.0

# Sprite nodes
var sprite_base: Sprite2D = null
var sprite_head: Sprite2D = null
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
			_base_scale = 0.185
		TowerType.GATLING_GUN:
			attack_range = 230.0
			attack_cooldown = 0.12
			damage = 10.0
			base_cost = 100
			_base_scale = 0.200
		TowerType.TESLA_COIL:
			attack_range = 220.0
			attack_cooldown = 0.78
			damage = 46.0
			base_cost = 150
			_base_scale = 0.150
		TowerType.SAM_BATTERY:
			attack_range = 320.0
			attack_cooldown = 1.40
			damage = 68.0
			base_cost = 120
			_base_scale = 0.190
		TowerType.FROST_SPIRE:
			attack_range = 200.0
			attack_cooldown = 0.85
			damage = 24.0
			base_cost = 90
			_base_scale = 0.170
		TowerType.MAGMA_MONOLITH:
			attack_range = 220.0
			attack_cooldown = 1.30
			damage = 48.0
			base_cost = 110
			_base_scale = 0.180
		TowerType.VOID_OBELISK:
			attack_range = 250.0
			attack_cooldown = 0.95
			damage = 35.0
			base_cost = 140
			_base_scale = 0.175
		TowerType.SPORE_SPITTER:
			attack_range = 210.0
			attack_cooldown = 0.75
			damage = 28.0
			base_cost = 80
			_base_scale = 0.170
		TowerType.PYLON_BUFFER:
			attack_range = 180.0
			attack_cooldown = 1.00
			damage = 0.0
			base_cost = 130
			_base_scale = 0.180
	total_invested = base_cost

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
			_turret_mount_pos = Vector2(-9.3, -30.8)
			sprite_base.position = _turret_mount_pos

		TowerType.GATLING_GUN:
			sprite_base.texture = TexGatlingBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(0.0, -23.0)
			sprite_base.position = _turret_mount_pos

		TowerType.TESLA_COIL:
			sprite_base.texture = TexTesla
			sprite_base.position = Vector2(-2.4, -43.65)
			_turret_mount_pos = Vector2(-2.4, -88.0)

		TowerType.SAM_BATTERY:
			sprite_base.texture = TexGatlingBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(0.0, -23.0)
			sprite_base.position = _turret_mount_pos

		_:
			# FROST_SPIRE, MAGMA_MONOLITH, VOID_OBELISK, SPORE_SPITTER, PYLON_BUFFER
			sprite_base.texture = TexPlasmaBase
			sprite_base.centered = false
			sprite_base.offset = Vector2(-320.0, -320.0)
			_turret_mount_pos = Vector2(-9.3, -30.8)
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
			sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]
		else:
			sprite_head.texture = TEX_PLASMA_32DIR[_current_dir_idx]

		add_child(sprite_head)

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
				local_offset = Vector2(244.0, -129.0)
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
	var pivot_y_offset: float = -24.0 if tower_type == TowerType.GATLING_GUN else -20.31
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

	if _recoil_time > 0.0:
		_recoil_time -= delta
		if _recoil_time <= 0.0:
			_recoil_offset = Vector2.ZERO
			if sprite_head:
				sprite_head.position = _turret_mount_pos
	else:
		if sprite_head:
			sprite_head.position = _turret_mount_pos + _recoil_offset

	# 2. Cập nhật khói súng (Smoke Puffs)
	_update_smoke_puffs(delta)

	# 3. Hoạt ảnh riêng biệt từng loại tháp
	_update_tower_specific_effects(delta)

	# 4. Quét mục tiêu & Hướng nòng súng chuẩn xác theo video
	_update_aim_and_fire(delta)

	queue_redraw()

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

	if tower_type == TowerType.TESLA_COIL:
		_idle_spark_timer -= delta
		if _idle_spark_timer <= 0.0:
			_idle_spark_timer = randf_range(0.08, 0.16)
			_spark_points.clear()
			var sphere_center = Vector2(-2.1, -88.0)
			for s in range(3):
				var ang = randf() * TAU
				var rad = randf_range(6.0, 16.0)
				_spark_points.append(sphere_center + Vector2(cos(ang), sin(ang)) * rad)

	if tower_type == TowerType.PLASMA_CANNON and _is_charging:
		_charge_timer -= delta
		if sprite_head:
			sprite_head.position = _turret_mount_pos + Vector2(randf_range(-1.2, 1.2), randf_range(-1.2, 1.2))
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
		_aim_angle = lerp_angle(_aim_angle, _target_aim_angle, delta * 12.0)

		# Với súng Gatling: nòng quay dồn dập khi đang khóa mục tiêu
		if tower_type == TowerType.GATLING_GUN:
			_barrel_spin_time += delta * 18.0

		# 1. CẬP NHẬT SPRITE FRAME THEO HƯỚNG NÒNG SÚNG GẦN MỤC TIÊU NHẤT TRONG KHÔNG GIAN 2D
		var best_dir = get_closest_barrel_dir_idx(tower_type, _aim_angle)
		if best_dir != _current_dir_idx:
			_current_dir_idx = best_dir
			if tower_type == TowerType.GATLING_GUN:
				sprite_head.texture = TEX_GATLING_32DIR[_current_dir_idx]
			else:
				sprite_head.texture = TEX_PLASMA_32DIR[_current_dir_idx]

			if sound_synth and _swivel_cooldown <= 0.0:
				sound_synth.play_turret_swivel()
				_swivel_cooldown = 0.25

		# 2. TRỤC NÒNG SÚNG CHUẨN XÁC 100%: Lấy trực tiếp vector hướng vật lý của nòng súng từ frame hiện tại
		var barrel_table: Array[float] = GATLING_BARREL_ANGLES if tower_type == TowerType.GATLING_GUN else PLASMA_BARREL_ANGLES
		var cur_barrel_angle: float = barrel_table[_current_dir_idx]
		_aim_dir = Vector2(cos(cur_barrel_angle), sin(cur_barrel_angle))

		# 3. FIRING GATE: Chỉ cho phép khai hỏa khi nòng súng đã xoay khớp chính xác vào mục tiêu
		var angle_err = absf(angle_difference(cur_barrel_angle, _target_aim_angle))
		var is_aim_aligned = angle_err <= deg_to_rad(12.0)

		if is_aim_aligned and _cooldown_timer <= 0.0:
			_cooldown_timer = eff_cooldown
			_initiate_attack(current_target)
	else:
		# Khi rảnh rỗi / chưa có địch: Quét tuần tra mượt mà theo vòng cung tự nhiên
		_idle_patrol_timer += delta * 0.85
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
				else:
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

	# Độ giật lùi nòng súng & Hoạt họa Nhún (Squash & Stretch Recoil trong 0.12s)
	play_recoil_squash(_aim_dir)

	# Chớp lửa đầu nòng dạng sao (Star Muzzle Flash) từ video
	_muzzle_flash_timer = 0.06
	_muzzle_flash_rot = randf_range(-PI, PI)
	_muzzle_flash_scale = randf_range(0.95, 1.35)

	var muzzle_pos = global_position + get_muzzle_local_pos()

	# Sinh làn khói súng bốc lên cuồn cuộn sau mỗi 2 phát bắn
	if _shots_fired_count % 2 == 0:
		_spawn_muzzle_smoke(muzzle_pos, _aim_dir)

	# Văng vỏ đạn đồng từ buồng đạn bên hông ụ súng (ejection port)
	var eject_side = -14.0 if not _is_facing_left else 14.0
	var eject_pos = global_position + _turret_mount_pos + Vector2(eject_side, -12.0)
	var pad_ground_y = global_position.y + 4.0
	var casing = CasingClass.new()
	casing.setup(eject_pos, _aim_dir, pad_ground_y, sound_synth)
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(casing)

	# Bắn đạn siêu thanh vệt vàng kim bay thẳng 100% dọc theo trục nòng súng
	var proj = ProjectileClass.new()
	proj.source_tower = self
	if level >= 3 and (_shots_fired_count % 4 == 0):
		proj.is_piercing = true
	if spawn_parent:
		spawn_parent.add_child(proj)
	proj.launch_straight(muzzle_pos, _aim_dir, target, eff_dmg, ProjectileClass.ProjectileType.GATLING_BULLET)

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

	# Độ giật lùi nòng súng & Hoạt họa Nhún
	play_recoil_squash(_aim_dir)

	if sprite_head:
		var base_sc = Vector2(_base_scale, _base_scale)
		sprite_head.scale = Vector2(_base_scale * 1.08, _base_scale * 0.94)
		var tween = sprite_head.create_tween()
		tween.tween_property(sprite_head, "scale", base_sc, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

	var muzzle_pos = global_position + get_muzzle_local_pos()

	# Khói ion xanh
	_spawn_muzzle_smoke(muzzle_pos, _aim_dir)

	var proj = ProjectileClass.new()
	proj.source_tower = self
	if level >= 3:
		proj.is_thermal_overload = true
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(proj)
	var eff_dmg = get_effective_damage()
	proj.launch_straight(muzzle_pos, _aim_dir, target, eff_dmg, ProjectileClass.ProjectileType.PLASMA_ORB)

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

## Hoạt họa Nhún & Giật Nòng (Squash & Stretch Recoil trong 0.12s)
func play_recoil_squash(shoot_dir: Vector2) -> void:
	_recoil_offset = -shoot_dir.normalized() * 3.5
	_recoil_time = 0.12
	var tw = create_tween()
	tw.tween_property(self, "scale", Vector2(1.08, 0.93), 0.05).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "scale", Vector2(1.0, 1.0), 0.07).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)

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
	# 0. BỆ ĐÁ CỔ NGỮ ISOMETRIC 2 LỚP & BÓNG TIẾP ĐẤT DƯỚI CHÂN TRỤ (GROUNDING & TACTICAL STONE PLINTH)
	_ensure_static_plinth()
	var center_ground = Vector2(0.0, 4.0)

	# Lớp 1 (Ambient Occlusion Shadow): Elip đen mềm rx = 34, ry = 18, Color(0.02, 0.04, 0.06, 0.45)
	draw_colored_polygon(_static_ao_shadow_poly, Color(0.02, 0.04, 0.06, 0.45))

	# Lớp 2 (Tactical Stone Plinth): Vòng elip viền đá/kim loại mỏng rx = 28, ry = 14, Color(0.22, 0.28, 0.35, 0.65)
	draw_colored_polygon(_static_plinth_poly, Color(0.12, 0.16, 0.22, 0.60))
	draw_polyline(_static_plinth_poly, Color(0.22, 0.28, 0.35, 0.65), 1.6)

	# 4 chốt góc kim loại nhỏ (Metal Corner Pins) tại 45°, 135°, 225°, 315°
	for pin_pos in _static_plinth_pins:
		draw_circle(pin_pos, 2.2, Color(0.35, 0.42, 0.52, 0.85))
		draw_circle(pin_pos, 1.2, Color(0.70, 0.80, 0.90, 0.95))

	# Vòng bụi trắng tỏa ra quanh chân đế khi xây / nâng cấp
	if _ground_dust_alpha > 0.01:
		draw_set_transform(center_ground, 0.0, Vector2(1.0, 0.52))
		draw_arc(Vector2.ZERO, _ground_dust_radius, 0, TAU, 36, Color(0.92, 0.95, 1.0, _ground_dust_alpha * 0.70), 2.5)
		draw_arc(Vector2.ZERO, _ground_dust_radius * 0.75, 0, TAU, 36, Color(1.0, 1.0, 1.0, _ground_dust_alpha * 0.40), 1.5)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# 1. KHÓI SÚNG (Gun Smoke Puffs)
	for p in _smoke_puffs:
		var smk_col = Color(0.75, 0.78, 0.82, p.alpha)
		var smk_core = Color(0.90, 0.92, 0.95, p.alpha * 0.5)
		draw_circle(p.pos, p.radius, smk_col)
		draw_circle(p.pos + Vector2(0, -p.radius * 0.25), p.radius * 0.6, smk_core)

	# 3. VÒNG TỰA KHÓA MỤC TIÊU & TIA LASER NGẮM (Laser Sight dọc theo trục nòng súng)
	if is_instance_valid(current_target) and not current_target.is_queued_for_deletion():
		var target_local = to_local(current_target.global_position + Vector2(0, -22.0))
		var muzzle_local = get_muzzle_local_pos()
		var laser_dist = muzzle_local.distance_to(target_local)
		var laser_end = muzzle_local + _aim_dir * laser_dist

		var laser_col = Color(1.0, 0.35, 0.12, 0.45) if tower_type == TowerType.GATLING_GUN else Color(0.2, 0.95, 1.0, 0.40)
		draw_line(muzzle_local, laser_end, laser_col, 1.5)
		draw_circle(target_local, 3.5, laser_col)

	# 4. Vòng tròn hiển thị tầm bắn khi được chọn (Isometric 2.5D)
	if is_selected:
		var eff_range = get_effective_range()
		var pts = PackedVector2Array()
		var rx = eff_range
		var ry = eff_range * 0.55
		for i in range(49):
			var a = float(i) * TAU / 48.0
			pts.append(Vector2(cos(a) * rx, sin(a) * ry))
		draw_polyline(pts, Color(0.2, 0.95, 1.0, 0.45), 1.8)
		draw_circle(Vector2.ZERO, 28.0, Color(0.2, 0.9, 1.0, 0.15))

	# 4.1. Vòng hào quang Pylon Buff nếu tháp đang được hưởng lợi
	if atk_speed_buff > 1.0 or range_buff > 1.0:
		draw_arc(Vector2.ZERO, 34.0, 0, TAU, 32, Color(1.0, 0.85, 0.25, 0.65), 2.0)

	# 4.2. Hiệu ứng Quá Tải Xung Nhịp (Overclock Arc Rings & Rotating Gears)
	if is_overclocked:
		var oc_rot = _idle_patrol_timer * 10.0
		var oc_rad = 36.0
		draw_arc(Vector2.ZERO, oc_rad, oc_rot, oc_rot + PI * 0.8, 24, Color(0.2, 0.95, 1.0, 0.90), 2.5)
		draw_arc(Vector2.ZERO, oc_rad, oc_rot + PI, oc_rot + PI * 1.8, 24, Color(1.0, 0.85, 0.25, 0.90), 2.5)
		draw_arc(Vector2.ZERO, oc_rad + 6.0, -oc_rot, -oc_rot + PI, 24, Color(0.25, 1.0, 0.7, 0.55), 1.8)
		draw_circle(Vector2.ZERO, 10.0, Color(0.2, 0.95, 1.0, 0.15))

	# 4.3. Hiệu ứng Nhiễu Sóng Từ Boss (Jammed Pulsing Aura)
	if jammed_timer > 0.0:
		var j_pulse = 0.5 + 0.5 * sin(_idle_patrol_timer * 12.0)
		draw_arc(Vector2.ZERO, 30.0, 0, TAU, 24, Color(0.85, 0.25, 0.95, 0.65 + 0.35 * j_pulse), 2.0)
		draw_string(ThemeDB.fallback_font, Vector2(-36.0, -55.0), "NHIỄU (-35%)", HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(0.9, 0.4, 1.0))

	# 5. Hiệu ứng thăng cấp Halo
	if _halo_alpha > 0.01:
		var halo_col = Color(1.0, 0.85, 0.2, _halo_alpha)
		draw_arc(Vector2.ZERO, _halo_radius, 0, TAU, 40, halo_col, 3.5)

	# 6. Tháp Cấp 3: 2 ngọc hào quang xoay quanh đỉnh tháp
	if level >= 3:
		var orb_dist = 22.0
		var top_y = -95.0 if (tower_type == TowerType.TESLA_COIL or tower_type == TowerType.PYLON_BUFFER) else -42.0
		var p1 = Vector2(cos(_aura_rot), sin(_aura_rot) * 0.4) * orb_dist + Vector2(0, top_y)
		var p2 = Vector2(cos(_aura_rot + PI), sin(_aura_rot + PI) * 0.4) * orb_dist + Vector2(0, top_y)
		draw_circle(p1, 3.5, Color(1.0, 0.85, 0.2, 0.95))
		draw_circle(p2, 3.5, Color(0.2, 0.95, 1.0, 0.95))

	# 7. CHỚP LỬA ĐẦU NÒNG HÌNH SAO ĐA GIÁC (Star Muzzle Flash) TẠI ĐẦU NÒNG
	if tower_type == TowerType.GATLING_GUN and _muzzle_flash_timer > 0.0:
		var m_pos = get_muzzle_local_pos()
		var alpha = clampf(_muzzle_flash_timer / 0.06, 0.0, 1.0)
		var sc = _muzzle_flash_scale

		# Quầng sáng bao quanh
		draw_circle(m_pos, 22.0 * sc, Color(1.0, 0.50, 0.0, 0.35 * alpha))

		# 4 tia sao chính (chữ thập)
		var l_main = 26.0 * sc
		var w_main = 5.5 * sc
		for ang_offset in [0.0, PI * 0.5, PI, PI * 1.5]:
			var a = _muzzle_flash_rot + ang_offset
			var tip = m_pos + Vector2(cos(a), sin(a)) * l_main
			var left_pt = m_pos + Vector2(cos(a + PI * 0.5), sin(a + PI * 0.5)) * w_main
			var right_pt = m_pos + Vector2(cos(a - PI * 0.5), sin(a - PI * 0.5)) * w_main
			var pts = PackedVector2Array([m_pos, left_pt, tip, right_pt])
			draw_colored_polygon(pts, Color(1.0, 0.85, 0.25, 0.95 * alpha))

		# 4 tia sao phụ (đường chéo)
		var l_sub = 15.0 * sc
		var w_sub = 3.5 * sc
		for ang_offset in [PI * 0.25, PI * 0.75, PI * 1.25, PI * 1.75]:
			var a = _muzzle_flash_rot + ang_offset
			var tip = m_pos + Vector2(cos(a), sin(a)) * l_sub
			var left_pt = m_pos + Vector2(cos(a + PI * 0.5), sin(a + PI * 0.5)) * w_sub
			var right_pt = m_pos + Vector2(cos(a - PI * 0.5), sin(a - PI * 0.5)) * w_sub
			var pts = PackedVector2Array([m_pos, left_pt, tip, right_pt])
			draw_colored_polygon(pts, Color(1.0, 0.60, 0.10, 0.85 * alpha))

		# Lõi chớp trắng sáng
		draw_circle(m_pos, 7.0 * sc, Color(1.0, 1.0, 0.95, 1.0 * alpha))

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
