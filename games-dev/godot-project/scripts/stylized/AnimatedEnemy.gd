class_name AnimatedEnemy
extends Node2D

## AnimatedEnemy: Quái Vật 2.5D Cử Động Chân Tay Thực Sự, Bước Đi Dưới Đất
## Tích hợp:
## 1. Tiếp đất 100% trên mặt đường cát vàng, bàn chân chạm đất, bóng đổ bám đất
## 2. CỬ ĐỘNG CHÂN TAY RÕ RỆT:
##    - Hai chân sải bước so le (Alternating Leg Stride): Nhấc chân, gập gối, dậm gót chạm đất
##    - Hai tay vung vẩy nhịp nhàng ngược chiều bước chân (Arm Swing)
##    - Thân và đầu nhún nhảy theo nhịp dậm chân (Torso Bobbing)
##    - Khói bụi đất tung ra mỗi khi bàn chân tiếp đất
## 3. Hiệu ứng bị giật điện Tesla (co giật bần bật, chớp tím), chớp trắng khi dính đạn
## 4. Nổ hạt lửa cam và thưởng vàng +30G bay lên khi bị tiêu diệt

enum EnemyType {
	MECH_WALKER = 0,       # Cỗ Máy Bọc Thép (Heavy Mech Juggernaut)
	STEAM_TRAIN = 1,       # Xe Lửa Hơi Nước Cơ Khí
	WINGED_BOT = 2,        # Chim Máy / Drone Trinh Sát
	SWARM_CRAWLER = 3,     # Quái Bầy Nhỏ (Swarm - Bọ máy / Chuột cống)
	SHIELD_DROID = 4,      # Robot Hỗ Trợ Tạo Khiên Năng Lượng
	ETHEREAL_WRAITH = 5    # Bóng Ma Vô Thể (Tàng hình, Miễn nhiễm Kinetic)
}

enum ArmorType {
	HEAVY_ARMOR = 0,    # Giáp Sắt / Robot bọc thép (ARMOR)
	MECHANICAL = 1,     # Động cơ cơ khí (Yếu trước EMP)
	AERIAL = 2,         # Chim máy / Đơn vị bay
	ARMOR = 0,          # Alias cho Giáp Sắt
	SHIELD = 3,         # Giáp Năng Lượng / Khiên
	FLESH = 4,          # Máu Sinh Học / Bầy quái Swarm
	ETHEREAL = 5        # Thể Linh Hồn / Bóng Ma
}

enum DamageType {
	KINETIC = 0,        # Sát thương Vật lý: -40% Giáp Sắt, 100% Khiên, +50% Máu Sinh Học, 0% Linh Hồn
	THERMAL_PLASMA = 1, # Năng lượng / Plasma: +50% Giáp Sắt, +100% Khiên Năng Lượng, 100% Máu, 100% Linh Hồn
	PLASMA = 1,         # Alias Plasma
	ELECTRO_EMP = 2,    # Sét điện từ EMP: Tê liệt cơ khí x2.2, phá khiên tức thì
	ARCANE = 3,         # Phép thuật: 100% Giáp Sắt, -30% Khiên, 100% Máu, +100% Linh Hồn
	BIO_CORROSIVE = 4,  # Axit / Ăn mòn: Bào mòn vĩnh viễn giáp, 0% Khiên, +50% Máu Sinh Học, 0% Linh Hồn
	TRUE_DAMAGE = 5,    # Thánh / Thuần khiết: Xuyên 100% giáp, bỏ qua khiên, +150% Linh Hồn
	VOID_GRAVITY = 6    # Trọng lực hư không
}

const TexMechTorso = preload("res://assets/sprites/enemy_mech_torso.png")
const TexMechLegL = preload("res://assets/sprites/enemy_mech_leg_left.png")
const TexMechLegR = preload("res://assets/sprites/enemy_mech_leg_right.png")
const TexTrain = preload("res://assets/sprites/enemy_steam_train.png")
const TexWingMid = preload("res://assets/sprites/enemy_winged_bot.png")
const TexWingUp = preload("res://assets/sprites/enemy_winged_bot_up.png")
const TexWingDown = preload("res://assets/sprites/enemy_winged_bot_down.png")
const TexExplosion = preload("res://assets/sprites/explosion_fire_burst.png")
const TexSwarmCrawler = preload("res://assets/sprites/enemy_swarm_crawler.png")
const TexShieldDroid = preload("res://assets/sprites/enemy_shield_droid.png")
const TexEtherealWraith = preload("res://assets/sprites/enemy_ethereal_wraith.png")
const SoundSynthClass = preload("res://scripts/audio/SoundSynthesizer.gd")
const CombatTextPoolClass = preload("res://scripts/stylized/CombatTextPool.gd")

# BỘ KHUNG HÌNH XE LỬA ĐA HƯỚNG TRÍCH XUẤT TỪ VIDEO 3D CHUẨN XÁC 100%
const STEAM_TRAIN_SE_FRAMES: Array[Texture2D] = [
	preload("res://assets/sprites/enemies/steam_train/train_se_00.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_01.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_02.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_03.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_04.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_05.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_06.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_07.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_08.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_09.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_10.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_11.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_12.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_13.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_14.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_15.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_16.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_17.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_18.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_19.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_20.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_21.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_22.png"),
	preload("res://assets/sprites/enemies/steam_train/train_se_23.png"),
]

const STEAM_TRAIN_E_FRAMES: Array[Texture2D] = STEAM_TRAIN_SE_FRAMES
const STEAM_TRAIN_NE_FRAMES: Array[Texture2D] = STEAM_TRAIN_SE_FRAMES
const STEAM_TRAIN_FRAMES: Array[Texture2D] = STEAM_TRAIN_SE_FRAMES

# BỘ KHUNG HÌNH BƯỚC ĐI ĐA HƯỚNG CỦA ROBOT TRÍCH XUẤT TỪ VIDEO 3D (ĐÃ ĐỒNG BỘ 1 BÌNH KHÓI 100%)
const MECH_WALK_SE_FRAMES: Array[Texture2D] = [
	preload("res://assets/sprites/enemies/mech_walker/walk_se_00.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_01.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_02.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_03.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_04.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_05.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_06.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_07.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_08.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_09.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_10.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_11.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_12.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_13.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_14.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_15.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_16.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_17.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_18.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_se_19.png"),
]

const MECH_WALK_NE_FRAMES: Array[Texture2D] = [
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_00.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_01.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_02.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_03.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_04.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_05.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_06.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_07.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_08.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_09.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_10.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_11.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_12.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_13.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_14.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_15.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_16.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_17.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_18.png"),
	preload("res://assets/sprites/enemies/mech_walker/walk_ne_19.png"),
]

const MECH_WALK_E_FRAMES: Array[Texture2D] = MECH_WALK_SE_FRAMES
const MECH_WALK_S_FRAMES: Array[Texture2D] = MECH_WALK_SE_FRAMES
const MECH_WALK_N_FRAMES: Array[Texture2D] = MECH_WALK_NE_FRAMES

const MECH_WALK_FRAMES: Array[Texture2D] = MECH_WALK_SE_FRAMES
const MECH_WALK_BACK_FRAMES: Array[Texture2D] = MECH_WALK_NE_FRAMES

# BỘ 20 KHUNG HÌNH ĐẬP CÁNH & PHẢN LỰC CỦA CHIM MÁY TRÍCH XUẤT TỪ VIDEO 3D CHUẨN XÁC 100%
const WINGED_BOT_FRAMES: Array[Texture2D] = [
	preload("res://assets/sprites/enemies/winged_bot/fly_00.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_01.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_02.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_03.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_04.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_05.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_06.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_07.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_08.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_09.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_10.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_11.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_12.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_13.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_14.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_15.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_16.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_17.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_18.png"),
	preload("res://assets/sprites/enemies/winged_bot/fly_19.png"),
]

enum EnemyVariant {
	NORMAL = 0,
	SCOUT = 1,      # Quái Nhanh: 0.85x scale, 1.35x speed, 0.7x HP
	ARMORED = 2,    # Quái Giáp Dày: 0.75x speed, 1.8x HP, HEAVY_ARMOR
	BOSS = 3,       # Boss Mech: 1.35x scale, 4.0x HP, hào quang năng lượng & khiên
	SUPPORT = 4,    # Quái Hộ Vệ: 0.90x speed, 1.30x HP, phát xung hồi máu/khiên đồng minh mỗi 4.0s
	AIR_DRONE = 5   # Phi Đội Không Kích: Bay lơ lửng, 1.25x speed, né 30% Plasma, nhận x3 SAM
}

var enemy_type: EnemyType = EnemyType.MECH_WALKER
var variant: EnemyVariant = EnemyVariant.NORMAL
var support_pulse_timer: float = 4.0
var is_boss: bool = false
var armor_type: ArmorType = ArmorType.HEAVY_ARMOR
var max_hp: float = 90.0
var current_hp: float = 90.0
var max_shield: float = 0.0
var current_shield: float = 0.0
var speed: float = 80.0
var gold_reward: int = 25
var is_ethereal: bool = false
var is_flying: bool = false

# Hiệu ứng trạng thái & Combo nguyên tố
var status_acid_timer: float = 0.0         # Axit bào mòn giáp (Corrosive)
var status_chilled_timer: float = 0.0      # Làm chậm băng (-40% tốc)
var status_freeze_stacks: int = 0          # Tầng băng (5 tầng = Đóng băng 2s)
var status_frozen_timer: float = 0.0       # Đóng băng hoàn toàn (Bất động)
var status_burn_timer: float = 0.0         # Thiêu đốt dung nham (Burn DoT)
var status_burn_dps: float = 0.0
var status_oiled_timer: float = 0.0        # Bị phủ dầu (Dễ bắt lửa x2 nổ bùng)
var status_slow_timer: float = 0.0         # Làm chậm do Plasma Cấp 3 (Thermal Overload -20% tốc)
var status_slow_factor: float = 0.8
var status_overload_timer: float = 0.0     # Quá tải điện từ từ Tesla (2.0s: nhận thêm +20% dmg từ trụ khác)
var _electro_charged_timer: float = 0.0     # Timer quá tải điện tích Tesla 2.0s
var _overdrive_triggered: bool = false     # Boss Overdrive khi HP <= 50%
var _overdrive_timer: float = 0.0          # 3.5s tăng 25% tốc độ di chuyển

# Sprint 6: Cơ Chế Boss Xung Nhiễu & Bão Từ Trường Ion
static var is_ion_storm_active: bool = false # Đợt Bão Ion (Wave 7 & 9): Sát thương điện +25%
var is_jamming: bool = false                # Boss Mech đang tích tụ xung nhiễu (2.0s)
var jamming_timer: float = 0.0
var jamming_cooldown: float = 7.0           # Tích tụ mỗi 7.0s
var is_vulnerable: bool = false             # Bị ngắt chiêu: Choáng & nhận +25% sát thương
var vulnerable_timer: float = 0.0
var is_support: bool = false:
	get:
		return variant == EnemyVariant.SUPPORT
var heal_cooldown: float = 4.0
var _heal_timer: float = 0.0
var _last_combat_text_time: float = -999.0
var _combat_text_stack_offset: float = 0.0
var _last_status_text_time: float = -999.0

var waypoints: Array[Vector2] = []
var _current_wp_idx: int = 0
var _time_alive: float = 0.0
var _walk_step: float = 0.0
var _last_mech_frame: int = -1
var _hit_flash: float = 0.0
var _electrocute_timer: float = 0.0
var _base_scale: float = 0.165
var _is_dead: bool = false
var _is_facing_left: bool = false

# Hệ thống 8 Hướng Di Chuyển 2.5D (8-Directional Movement System)
enum MovementDirection {
	SOUTH = 0,       # Đi thẳng xuống (Tiến về camera)
	SOUTH_EAST = 1,  # Chéo xuống bên phải (+45 độ)
	EAST = 2,        # Đi ngang sang phải (0 độ)
	NORTH_EAST = 3,  # Chéo lên bên phải (Leo dốc vào cổng thành, -45 độ)
	NORTH = 4,       # Đi thẳng lên (Quay lưng hoàn toàn)
	NORTH_WEST = 5,  # Chéo lên bên trái (-135 độ)
	WEST = 6,        # Đi ngang sang trái (180 độ)
	SOUTH_WEST = 7   # Chéo xuống bên trái (+135 độ)
}

var current_direction: MovementDirection = MovementDirection.SOUTH_EAST
var is_moving_upward: bool = false
var current_move_dir: Vector2 = Vector2.RIGHT

# Góc cử động chân tay & bánh xe tàu
var _leg_left_angle: float = 0.0
var _leg_right_angle: float = 0.0
var _arm_left_angle: float = 0.0
var _arm_right_angle: float = 0.0
var _torso_bob: float = 0.0
var _wheel_angle: float = 0.0
var lane_offset: float = 0.0

# Nodes
var visual_root: Node2D = null
var sprite: Sprite2D = null
var mech_leg_left: Sprite2D = null
var mech_leg_right: Sprite2D = null
var sound_synth: SoundSynthesizer = null

# Hạt bụi đất bước chân
var _dust_timer: float = 0.0
var _dust_particles: Array[Dictionary] = []

# Hạt phản lực chim máy
var _jet_timer: float = 0.0

# Hạt khói tàu hơi nước & khói lò hơi
var _smoke_timer: float = 0.0
var _smoke_particles: Array[Dictionary] = []

# Hoạt ảnh sụp đổ khi chết (Death Collapse Sequence từ Video)
var _death_timer: float = 0.0
var _death_impact_triggered: bool = false
var _death_smoke_timer: float = 0.0
var _mech_steam_timer: float = 0.0
var _debris_particles: Array[Dictionary] = []

signal enemy_died(enemy: Node2D, reward: int)
signal enemy_escaped(enemy: Node2D)
signal enemy_hit_castle(enemy: Node2D, damage: int)

# Trạng thái Công Thành Lâu Đài (Castle Siege & Attack State)
var is_attacking_castle: bool = false
var castle_attack_timer: float = 0.0
var _castle_attack_hit_done: bool = false
var _attack_swing_offset: Vector2 = Vector2.ZERO

func get_path_progress() -> float:
	var progress = float(_current_wp_idx) * 1000.0
	if _current_wp_idx < waypoints.size():
		var dist_to_next = global_position.distance_to(waypoints[_current_wp_idx])
		progress -= dist_to_next
	return progress

func setup(type: EnemyType, path_points: Array[Vector2], wave_multiplier: float = 1.0, v: EnemyVariant = EnemyVariant.NORMAL) -> void:
	enemy_type = type
	variant = v
	is_boss = (v == EnemyVariant.BOSS)

	# Đảm bảo tuyệt đối: Robot đi bộ (MECH_WALKER) và Xe lửa (STEAM_TRAIN) luôn là lính bám đất, không bao giờ bay
	if enemy_type == EnemyType.MECH_WALKER or enemy_type == EnemyType.STEAM_TRAIN:
		is_flying = false
		if variant == EnemyVariant.AIR_DRONE:
			variant = EnemyVariant.SCOUT

	waypoints = path_points
	if waypoints.size() > 0:
		global_position = waypoints[0]
		_current_wp_idx = 1 if waypoints.size() > 1 else 0

	# Độ lệch làn: giới hạn quái bộ tối đa ±3.0px (0.0px khi qua cầu đá), quái bay ±8.0px
	if path_points.size() > 2:
		if is_flying or enemy_type == EnemyType.WINGED_BOT or variant == EnemyVariant.AIR_DRONE:
			lane_offset = randf_range(-8.0, 8.0)
		else:
			lane_offset = randf_range(-3.0, 3.0)
	else:
		lane_offset = 0.0

	match enemy_type:
		EnemyType.MECH_WALKER:
			armor_type = ArmorType.HEAVY_ARMOR
			max_hp = 180.0 * wave_multiplier
			speed = 58.0 # Bước đi chậm chạp, uy lực, hùng hổ của quái to
			gold_reward = 45
			_base_scale = 0.205 # Kích thước to lớn vượt trội
		EnemyType.STEAM_TRAIN:
			armor_type = ArmorType.MECHANICAL
			max_hp = 90.0 * wave_multiplier
			speed = 82.0
			gold_reward = 30
			_base_scale = 0.160
		EnemyType.WINGED_BOT:
			armor_type = ArmorType.AERIAL
			is_flying = true
			max_hp = 55.0 * wave_multiplier
			speed = 110.0
			gold_reward = 20
			_base_scale = 0.165
		EnemyType.SWARM_CRAWLER:
			armor_type = ArmorType.FLESH
			max_hp = 35.0 * wave_multiplier
			speed = 120.0 # Bầy quái đông, di chuyển nhanh
			gold_reward = 12
			_base_scale = 0.125
		EnemyType.SHIELD_DROID:
			armor_type = ArmorType.SHIELD
			max_hp = 75.0 * wave_multiplier
			max_shield = 85.0 * wave_multiplier
			current_shield = max_shield
			speed = 70.0
			gold_reward = 35
			_base_scale = 0.165
		EnemyType.ETHEREAL_WRAITH:
			armor_type = ArmorType.ETHEREAL
			is_ethereal = true
			max_hp = 60.0 * wave_multiplier
			speed = 95.0
			gold_reward = 30
			_base_scale = 0.155

	# Áp dụng các biến thể Quái Sprint 3:
	match variant:
		EnemyVariant.SCOUT:
			speed *= 1.35
			max_hp *= 0.70
			_base_scale *= 0.85
			scale = Vector2(0.85, 0.85)
			gold_reward = int(gold_reward * 0.85)
		EnemyVariant.ARMORED:
			armor_type = ArmorType.HEAVY_ARMOR
			speed *= 0.75
			max_hp *= 1.80
			gold_reward = int(gold_reward * 1.5)
		EnemyVariant.BOSS:
			armor_type = ArmorType.HEAVY_ARMOR
			speed *= 0.65
			max_hp *= 4.0
			max_shield = max_hp * 0.5
			current_shield = max_shield
			_base_scale *= 1.35
			scale = Vector2(1.35, 1.35)
			gold_reward = int(gold_reward * 4.0)
			jamming_cooldown = 7.0
			is_jamming = false
			is_vulnerable = false
		EnemyVariant.SUPPORT:
			speed *= 0.90
			max_hp *= 1.30
			gold_reward = int(gold_reward * 1.3)
			_base_scale *= 1.10
			scale = Vector2(1.10, 1.10)
		EnemyVariant.AIR_DRONE:
			is_flying = true
			armor_type = ArmorType.AERIAL
			speed *= 1.25
			gold_reward = int(gold_reward * 1.2)
			_base_scale *= 0.95
			scale = Vector2(0.95, 0.95)

	current_hp = max_hp

	if sprite:
		sprite.scale = Vector2(_base_scale, _base_scale)
		match enemy_type:
			EnemyType.MECH_WALKER:
				sprite.texture = MECH_WALK_FRAMES[0]
				sprite.offset = Vector2(0.0, -195.0)
			EnemyType.STEAM_TRAIN:
				sprite.texture = STEAM_TRAIN_FRAMES[0]
				sprite.offset = Vector2(0.0, -220.0)
			EnemyType.WINGED_BOT:
				sprite.texture = WINGED_BOT_FRAMES[0]
				sprite.offset = Vector2(0.0, -175.0)
			EnemyType.SWARM_CRAWLER:
				sprite.texture = TexSwarmCrawler
				sprite.offset = Vector2(0.0, -180.0)
			EnemyType.SHIELD_DROID:
				sprite.texture = TexShieldDroid
				sprite.offset = Vector2(0.0, -210.0)
			EnemyType.ETHEREAL_WRAITH:
				sprite.texture = TexEtherealWraith
				sprite.offset = Vector2(0.0, -210.0)
				sprite.modulate = Color(1.0, 1.0, 1.0, 0.75)

static var active_enemies: Array[AnimatedEnemy] = []

static func get_active_enemies() -> Array[AnimatedEnemy]:
	return active_enemies

func _enter_tree() -> void:
	if not active_enemies.has(self):
		active_enemies.append(self)

func _exit_tree() -> void:
	active_enemies.erase(self)

func _ready() -> void:
	sound_synth = SoundSynthesizer.get_shared(self)

	visual_root = Node2D.new()
	visual_root.z_index = 1 # Bảo vệ Hình bóng Nhân vật (Silhouette): Thân luôn hiển thị trên hào quang chân
	add_child(visual_root)

	sprite = Sprite2D.new()
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	sprite.scale = Vector2(_base_scale, _base_scale)

	match enemy_type:
		EnemyType.MECH_WALKER:
			sprite.texture = MECH_WALK_FRAMES[0]
			sprite.centered = true
			sprite.offset = Vector2(0.0, -195.0)
			sprite.position = Vector2.ZERO # Bàn chân tiếp xúc chuẩn mặt đất Y = 0 (Zero Air Gap, không bay lơ lửng)
			visual_root.add_child(sprite)

		EnemyType.STEAM_TRAIN:
			sprite.texture = STEAM_TRAIN_FRAMES[0]
			sprite.centered = true
			sprite.offset = Vector2(0.0, -220.0)
			sprite.position = Vector2(0.0, -6.0) # Nâng khung gầm và bánh xe lăn chuẩn trên mặt đường đá cuội
			visual_root.add_child(sprite)

		EnemyType.WINGED_BOT:
			sprite.texture = WINGED_BOT_FRAMES[0]
			sprite.centered = true
			sprite.offset = Vector2(0.0, -175.0)
			sprite.position = Vector2(0.0, -32.0)
			visual_root.add_child(sprite)

		EnemyType.SWARM_CRAWLER:
			sprite.texture = TexSwarmCrawler
			sprite.centered = true
			sprite.offset = Vector2(0.0, -180.0)
			sprite.position = Vector2(0.0, -24.0)
			visual_root.add_child(sprite)

		EnemyType.SHIELD_DROID:
			sprite.texture = TexShieldDroid
			sprite.centered = true
			sprite.offset = Vector2(0.0, -210.0)
			sprite.position = Vector2(0.0, -32.0)
			visual_root.add_child(sprite)

		EnemyType.ETHEREAL_WRAITH:
			sprite.texture = TexEtherealWraith
			sprite.centered = true
			sprite.offset = Vector2(0.0, -210.0)
			sprite.position = Vector2(0.0, -30.0)
			sprite.modulate = Color(1.0, 1.0, 1.0, 0.75)
			visual_root.add_child(sprite)

func _process(delta: float) -> void:
	if _is_dead:
		_update_death_animation(delta)
		queue_redraw()
		return

	_time_alive += delta

	# Xử lý các hiệu ứng trạng thái (Status Effects)
	if status_frozen_timer > 0.0:
		status_frozen_timer -= delta
		queue_redraw()
		return

	if status_burn_timer > 0.0:
		status_burn_timer -= delta
		current_hp = maxf(0.0, current_hp - status_burn_dps * delta)
		if current_hp <= 0.0:
			_die()
			return

	if status_chilled_timer > 0.0:
		status_chilled_timer -= delta
	if status_acid_timer > 0.0:
		status_acid_timer -= delta
	if status_oiled_timer > 0.0:
		status_oiled_timer -= delta
	if status_slow_timer > 0.0:
		status_slow_timer -= delta
	if status_overload_timer > 0.0:
		status_overload_timer -= delta
	if _electro_charged_timer > 0.0:
		_electro_charged_timer -= delta
	if _overdrive_timer > 0.0:
		_overdrive_timer -= delta
	if variant == EnemyVariant.SUPPORT and not _is_dead:
		support_pulse_timer -= delta
		_heal_timer = support_pulse_timer
		if support_pulse_timer <= 0.0:
			support_pulse_timer = 4.0
			_heal_timer = 4.0
			trigger_support_pulse()

	# Xử lý Boss Mech Tích Tụ Xung Nhiễu (Jamming Pulse mỗi 7.0s)
	if is_boss and not _is_dead:
		if vulnerable_timer > 0.0:
			vulnerable_timer -= delta
			if vulnerable_timer <= 0.0:
				is_vulnerable = false
		elif is_jamming:
			jamming_timer -= delta
			if jamming_timer <= 0.0:
				_discharge_jamming_pulse()
		else:
			jamming_cooldown -= delta
			if jamming_cooldown <= 0.0:
				start_jamming_channel()

	# 0. NẾU ĐANG Ở TRẠNG THÁI CÔNG THÀNH LÂU ĐÀI (Castle Attack State)
	if is_attacking_castle and not _is_dead:
		castle_attack_timer += delta
		var finish_time = 1.25
		var hit_time = 0.35
		var dmg = 1

		match enemy_type:
			EnemyType.MECH_WALKER:
				dmg = 3 if is_boss else 1
				finish_time = 1.50 if is_boss else 1.25
				hit_time = 0.38
				# Lùi lấy đà rồi vung tay đấm sầm vào cổng lâu đài
				if castle_attack_timer < 0.25:
					_attack_swing_offset = Vector2(-10.0, -2.0) * (castle_attack_timer / 0.25)
				elif castle_attack_timer < 0.50:
					_attack_swing_offset = Vector2(18.0, 2.0)
				else:
					_attack_swing_offset = lerp(_attack_swing_offset, Vector2.ZERO, delta * 6.0)
			EnemyType.STEAM_TRAIN:
				dmg = 2
				finish_time = 1.40
				hit_time = 0.42
				# Lùi xe lấy đà rồi tông sầm đầu tàu vào cổng gỗ
				if castle_attack_timer < 0.28:
					_attack_swing_offset = Vector2(-15.0, 0.0) * (castle_attack_timer / 0.28)
				elif castle_attack_timer < 0.55:
					_attack_swing_offset = Vector2(25.0, 0.0)
				else:
					_attack_swing_offset = lerp(_attack_swing_offset, Vector2.ZERO, delta * 6.0)
			EnemyType.WINGED_BOT:
				dmg = 1
				finish_time = 1.10
				hit_time = 0.32
				# Bay giật lùi rồi chao cánh bắn năng lượng vào tường thành
				if castle_attack_timer < 0.20:
					_attack_swing_offset = Vector2(-8.0, -6.0)
				elif castle_attack_timer < 0.45:
					_attack_swing_offset = Vector2(16.0, 4.0)
				else:
					_attack_swing_offset = lerp(_attack_swing_offset, Vector2.ZERO, delta * 6.0)
			EnemyType.SWARM_CRAWLER:
				dmg = 1
				finish_time = 0.45
				hit_time = 0.20
				# Nhảy chồm lên cắn và phát nổ tự sát
				if castle_attack_timer < 0.20:
					_attack_swing_offset = Vector2(14.0, -8.0)
				else:
					_attack_swing_offset = Vector2.ZERO
			_:
				dmg = 1
				finish_time = 1.20
				hit_time = 0.35
				_attack_swing_offset = Vector2(sin(castle_attack_timer * 15.0) * 5.0, 0)

		# Thời điểm đòn đánh chạm đích (Impact)
		if castle_attack_timer >= hit_time and not _castle_attack_hit_done:
			_castle_attack_hit_done = true
			_spawn_castle_attack_fx()
			emit_signal("enemy_hit_castle", self, dmg)
			if sound_synth:
				if enemy_type == EnemyType.STEAM_TRAIN:
					sound_synth.play_plasma_blast()
				elif enemy_type == EnemyType.WINGED_BOT:
					sound_synth.play_gatling_shot()
				else:
					sound_synth.play_hit()

		if sprite:
			sprite.position = _attack_swing_offset

		_update_particles(delta)
		queue_redraw()

		# Kết thúc chu kỳ đòn đánh:
		if enemy_type == EnemyType.SWARM_CRAWLER:
			if castle_attack_timer >= finish_time:
				emit_signal("enemy_escaped", self)
				queue_free()
			return
		else:
			# Các loại quái khác đập liên tục vào cổng thành cho đến khi bị tiêu diệt hoặc lâu đài sụp đổ
			if castle_attack_timer >= finish_time:
				castle_attack_timer = 0.0
				_castle_attack_hit_done = false
		return

	var effective_speed = get_effective_speed()

	# Chống đè quái (Anti-Overlap Congestion Control): Quái đi sau giảm tốc nhẹ khi tiếp cận quái đi trước
	if _current_wp_idx < waypoints.size():
		var my_dist_to_wp_sq: float = global_position.distance_squared_to(waypoints[_current_wp_idx])
		for other in active_enemies:
			if other != self and is_instance_valid(other) and not other._is_dead:
				var wp_diff: int = other._current_wp_idx - _current_wp_idx
				if wp_diff >= 0 and wp_diff <= 1 and other._current_wp_idx < other.waypoints.size():
					var d_sq: float = global_position.distance_squared_to(other.global_position)
					if d_sq < 1296.0: # 36.0 * 36.0
						var is_other_ahead: bool = (wp_diff > 0) or \
							(my_dist_to_wp_sq > other.global_position.distance_squared_to(other.waypoints[other._current_wp_idx]))
						if is_other_ahead:
							effective_speed = minf(effective_speed, other.speed * 0.85)

	# 1. Di chuyển bám chính xác theo tim đường mòn Waypoints
	if _current_wp_idx < waypoints.size():
		var target_pt = waypoints[_current_wp_idx]
		var prev_pt = waypoints[_current_wp_idx - 1] if _current_wp_idx > 0 else (waypoints[0] - Vector2(1.0, 0.0))
		var seg_vec = target_pt - prev_pt
		var seg_dir = seg_vec.normalized()
		if seg_dir.length_squared() < 0.001:
			seg_dir = Vector2.RIGHT
		var seg_normal = Vector2(-seg_dir.y, seg_dir.x)

		# Ép độ lệch làn về 0.0px khi đi qua Cầu Đá và đường dẫn mố cầu (x ~ 395..555 hoặc waypoint 4..9)
		var is_on_bridge = (global_position.x >= 395.0 and global_position.x <= 555.0) or (_current_wp_idx >= 4 and _current_wp_idx <= 9)
		var cur_lane = 0.0 if (is_on_bridge and not is_flying) else lane_offset

		# Tọa độ đích cố định cho chặng đường này
		var actual_target = target_pt + seg_normal * cur_lane
		var to_target = actual_target - global_position
		var dist = to_target.length()
		var move_dist = effective_speed * delta

		# Nếu đã đến đích của chặng đường (hoặc đi ngang qua mặt phẳng đích)
		var passed_plane = (global_position - actual_target).dot(seg_dir) >= 0.0 and _current_wp_idx > 0
		if dist <= move_dist or dist < 4.0 or passed_plane:
			global_position = actual_target
			_current_wp_idx += 1
		else:
			var dir = to_target / maxf(dist, 0.001)
			global_position += dir * move_dist
			_update_facing_direction(dir)
	else:
		if not is_attacking_castle and not _is_dead:
			is_attacking_castle = true
			castle_attack_timer = 0.0
			_castle_attack_hit_done = false
			effective_speed = 0.0
			_is_facing_left = false
			if visual_root:
				visual_root.scale.x = -1.0 # Hướng về phía cổng thành bên phải
			return
		return

	# 2. Hoạt ảnh BƯỚC ĐI TIẾP ĐẤT VỮNG CHÃI & CỬ ĐỘNG CHÂN TAY (Grounded Walk Cycle)
	_update_limb_animation(delta, effective_speed)

	# 3. Cập nhật hạt bụi bước chân & khói tàu
	_update_particles(delta)

	queue_redraw()

## Tính toán chu kỳ cử động chân cơ học 40/60 chuẩn MoCap (Swing 40% nhấc gối, Stance 60% chịu lực bám đất)
func _calc_leg_motion(t: float) -> Dictionary:
	var rot_max: float = 0.52   # ~30 độ biên độ sải chân
	var lift_max: float = 11.0  # 11px nhấc cao đầu gối rõ rệt
	var rot: float = 0.0
	var lift: float = 0.0
	var strike: bool = false

	if t < 0.40:
		# Pha Vung Chân (Swing Phase: 40% chu kỳ):
		# Nhấc gối nâng cao chân theo cung tròn sin, vung nhanh từ sau ra trước
		var u = t / 0.40
		lift = sin(u * PI) * lift_max
		rot = -rot_max + (2.0 * rot_max) * (1.0 - cos(u * PI)) * 0.5
		if u > 0.85:
			strike = true
	else:
		# Pha Tiếp Đất Chịu Lực (Stance Phase: 60% chu kỳ):
		# Bàn chân bám chặt mặt đường cát vàng (lift = 0), đẩy lùi đều đặn
		var u = (t - 0.40) / 0.60
		lift = 0.0
		rot = rot_max - (2.0 * rot_max) * u

	return {"rot": rot, "lift": lift, "strike": strike}

## Cập nhật hệ thống 8 hướng di chuyển & Lật gương trục X
func _update_facing_direction(dir: Vector2) -> void:
	current_move_dir = dir

	# 1. Hướng di chuyển trục X:
	# Quái đi từ Tây sang Đông (dir.x >= -0.05): scale.x = 1.0 (nhìn sang phải)
	# Nếu đi ngược từ Đông sang Tây (dir.x < -0.05): scale.x = -1.0 (lật gương nhìn sang trái)
	if dir.x < -0.05:
		_is_facing_left = true
	elif dir.x > 0.05:
		_is_facing_left = false

	# 2. Phân biệt hướng di chuyển leo dốc (Back View - xa camera) hay xuống dốc (Front View - gần camera)
	# Sử dụng bộ lọc trễ (Hysteresis) để triệt tiêu 100% hiện tượng rung giật / flip qua lại ở khúc cua:
	if is_moving_upward:
		if dir.y > -0.15:
			is_moving_upward = false # Thoát khỏi trạng thái leo dốc khi đường đã phẳng hoặc dốc xuống
	else:
		if dir.y < -0.25:
			is_moving_upward = true # Chỉ kích hoạt leo dốc khi thực sự đi ngược lên trên rõ rệt (dir.y < -0.25)

	# 3. Gán MovementDirection tương ứng (Chuẩn hóa hệ 8 hướng):
	var a = rad_to_deg(dir.angle())
	if a >= -22.5 and a < 22.5:
		current_direction = MovementDirection.EAST
	elif a >= 22.5 and a < 67.5:
		current_direction = MovementDirection.SOUTH_EAST
	elif a >= 67.5 and a < 112.5:
		current_direction = MovementDirection.SOUTH
	elif a >= 112.5 and a < 157.5:
		current_direction = MovementDirection.SOUTH_WEST
	elif a >= 157.5 or a < -157.5:
		current_direction = MovementDirection.WEST
	elif a >= -157.5 and a < -112.5:
		current_direction = MovementDirection.NORTH_WEST
	elif a >= -112.5 and a < -67.5:
		current_direction = MovementDirection.NORTH
	else:
		current_direction = MovementDirection.NORTH_EAST

	# 4. Lật gương trục X chuẩn xác theo từng loại hình nhân vật:
	if visual_root:
		match enemy_type:
			EnemyType.STEAM_TRAIN:
				# Xe lửa cơ khí sprite gốc nhìn sang Phải (East / South-East)
				visual_root.scale.x = -1.0 if _is_facing_left else 1.0
			EnemyType.MECH_WALKER:
				# Robot Mech Walker:
				# Khi đi xuống dốc / bình nguyên (SE Front View): sprite gốc nhìn sang Trái (West / South-West)
				#   -> Khi đi sang Phải (_is_facing_left == false): scale.x = -1.0 để nhìn sang Phải
				#   -> Khi đi sang Trái (_is_facing_left == true): scale.x = 1.0 để nhìn sang Trái
				# Khi leo dốc lên (NE Back View - Cầu đá vượt thác & Cổng thành): sprite gốc nhìn sang Phải (East / North-East)
				#   -> Khi đi sang Phải (_is_facing_left == false): giữ scale.x = 1.0 nhìn thẳng hướng tiến 1h
				#   -> Khi đi sang Trái (_is_facing_left == true): lật gương scale.x = -1.0 nhìn sang 11h
				if is_moving_upward:
					visual_root.scale.x = -1.0 if _is_facing_left else 1.0
				else:
					visual_root.scale.x = 1.0 if _is_facing_left else -1.0
			_:
				# Các loại khác (Chim máy, bọ, drone - sprite gốc nhìn sang Trái)
				if dir.x >= 0.02:
					visual_root.scale.x = -1.0
					_is_facing_left = false
				elif dir.x <= -0.02:
					visual_root.scale.x = 1.0
					_is_facing_left = true

func _update_limb_animation(delta: float, current_speed: float = -1.0) -> void:
	if not sprite:
		return

	var active_speed = speed if current_speed < 0.0 else current_speed

	# Xử lý hiệu ứng giật điện Tesla
	if _electrocute_timer > 0.0:
		_electrocute_timer -= delta
		sprite.position = Vector2(randf_range(-4.0, 4.0), randf_range(-2.5, 2.5))
		sprite.modulate = Color(1.8, 0.7, 2.4, 1.0)
		return

	# Chu kỳ bước chân & lăn bánh xe
	_walk_step += delta * active_speed # Quãng đường di chuyển tích lũy (pixel)
	_wheel_angle += delta * active_speed * 0.12

	match enemy_type:
		EnemyType.MECH_WALKER:
			# Mech Walker: 20 Khung hình trích xuất từ Video 3D thực tế
			# Chu kỳ sải chân cơ học vững chãi bám đất chuẩn xác (Zero Foot Slide & Zero Moonwalk)
			var walk_cycle_len = 38.0 # Quãng đường pixel cho 1 chu kỳ 20 frames (2 bước sải chân)
			var cycle_t = fmod(_walk_step, walk_cycle_len) / walk_cycle_len
			if cycle_t < 0.0:
				cycle_t += 1.0

			var frame_idx: int = int(cycle_t * 20.0) % 20

			# CHỌN KHUNG HÌNH THEO HƯỚNG DỐC ISOMETRIC 2.5D:
			# Khi leo dốc lên (Cầu đá vượt thác & Cổng thành): Dùng góc nhìn sau lưng (NE Back View)
			# Khi đi dốc xuống & bình nguyên: Dùng góc nhìn phía trước (SE Front View)
			if is_moving_upward:
				sprite.texture = MECH_WALK_NE_FRAMES[frame_idx]
			else:
				sprite.texture = MECH_WALK_SE_FRAMES[frame_idx]

			# Phát hiện thời điểm tiếp đất (Foot Strike):
			# Frame 0: Gót chân trái dậm đất
			# Frame 10: Gót chân phải dậm đất
			if frame_idx != _last_mech_frame:
				if frame_idx == 0 or frame_idx == 10:
					_spawn_footstep_dust()
					if sound_synth:
						sound_synth.play_mech_step()
				_last_mech_frame = frame_idx

			# Ống khói lò hơi sau lưng phì khói trắng
			_mech_steam_timer -= delta
			if _mech_steam_timer <= 0.0:
				_mech_steam_timer = 0.18
				_spawn_mech_steam()

			# Bàn chân robot luôn dính chặt mặt đất tại Y = 0 (Zero Air Gap)
			sprite.position = Vector2.ZERO

		EnemyType.STEAM_TRAIN:
			# XE LỬA CƠ KHÍ: 24 Khung hình trích xuất từ Video 3D (Bánh xoay, piston chuyển động, khói bốc)
			var train_cycle_len = 68.0 # Quãng đường di chuyển (px) cho 2 vòng bánh xe hoàn chỉnh
			var cycle_t = fmod(_walk_step, train_cycle_len) / train_cycle_len
			if cycle_t < 0.0:
				cycle_t += 1.0

			var frame_idx: int = int(cycle_t * 24.0) % 24

			# Luôn dùng bộ hoạt ảnh xe lửa hơi nước hoạt hình chuẩn xác 100%
			sprite.texture = STEAM_TRAIN_SE_FRAMES[frame_idx]

			# Độ nghiêng xe lửa mượt mà theo độ dốc con đường (Giới hạn góc nghiêng nhẹ nhàng để bánh xe không bị cắm xuống đất)
			var target_tilt: float = clampf(current_move_dir.y * 0.10, -0.05, 0.05)
			if _is_facing_left:
				target_tilt = -target_tilt
			sprite.rotation = lerpf(sprite.rotation, target_tilt, delta * 8.0)

			# Bánh xe dính chặt mặt đường đá cuội, nâng -6px để không bao giờ bị lún qua mặt đất
			sprite.position = Vector2(0.0, -6.0)

			# Khói hơi nước xả thêm từ ống khói tạo chiều sâu hạt 3D
			_smoke_timer -= delta
			if _smoke_timer <= 0.0:
				_smoke_timer = 0.12
				_spawn_train_smoke()

			# Bụi đất từ bánh xích bám đường cát vàng
			_dust_timer -= delta
			if _dust_timer <= 0.0:
				_dust_timer = 0.16
				_spawn_train_dust()

		EnemyType.WINGED_BOT:
			# CHIM ROBOT ĐẬP CÁNH BAY LIÊN TỤC & PHẢN LỰC ĐỘNG CƠ (20 Khung Hình Trích Xuất Video 3D)
			var wing_cycle_len = 44.0 # Quãng đường di chuyển (px) cho 1 nhịp vỗ cánh
			var cycle_t = fmod(_walk_step, wing_cycle_len) / wing_cycle_len
			if cycle_t < 0.0:
				cycle_t += 1.0

			var frame_idx: int = int(cycle_t * 20.0) % 20
			sprite.texture = WINGED_BOT_FRAMES[frame_idx]

			# Nghiêng cánh lượn theo hướng bay (Banking & Pitch)
			var target_wing_rot = -0.14 if is_moving_upward else (0.10 if current_direction == MovementDirection.SOUTH_EAST or current_direction == MovementDirection.SOUTH_WEST else 0.0)
			sprite.rotation = lerpf(sprite.rotation, target_wing_rot, delta * 8.0)

			# Thân chim bay lượn nhấp nhô nhẹ nhàng trong không trung (Hovering)
			var hover_y = sin(_time_alive * 9.0) * 4.0
			sprite.position = Vector2(0.0, -14.0 + hover_y)

			# Đã loại bỏ hoàn toàn hiệu ứng tia lửa / phun lửa từ chim theo yêu cầu người dùng
			pass

		EnemyType.SWARM_CRAWLER:
			# Bọ máy bò nhanh, lắc lư chân và nhấp nhô
			var crawl_wobble = sin(_time_alive * 26.0) * 0.08
			var crawl_hop = abs(sin(_time_alive * 26.0)) * 2.5
			sprite.rotation = crawl_wobble
			sprite.position = Vector2(0.0, -8.0 - crawl_hop)

		EnemyType.SHIELD_DROID:
			# Droid khiên bay lơ lửng, nhấp nhô theo nhịp sóng năng lượng
			var float_y = sin(_time_alive * 5.5) * 5.0
			sprite.position = Vector2(0.0, -16.0 + float_y)

		EnemyType.ETHEREAL_WRAITH:
			# Bóng ma lượn lờ hư không, uốn lượn mờ ảo
			var ghost_y = sin(_time_alive * 4.0) * 7.0
			var ghost_x = cos(_time_alive * 3.0) * 3.5
			sprite.position = Vector2(ghost_x, -14.0 + ghost_y)

	# Chớp trắng khi dính đòn nặng / chí mạng (Nháy sáng trắng mượt trong 0.06s)
	if _hit_flash > 0.0:
		_hit_flash = maxf(0.0, _hit_flash - delta * 16.67)
		sprite.modulate = Color.WHITE.lerp(Color(2.5, 2.5, 2.5), _hit_flash)
		if mech_leg_left:
			mech_leg_left.modulate = sprite.modulate
		if mech_leg_right:
			mech_leg_right.modulate = sprite.modulate
	else:
		if enemy_type == EnemyType.ETHEREAL_WRAITH:
			var pulse_alpha = 0.65 + sin(_time_alive * 5.0) * 0.20
			sprite.modulate = Color(1.0, 1.0, 1.0, pulse_alpha)
		elif enemy_type == EnemyType.SHIELD_DROID:
			sprite.modulate = Color(0.95, 1.15, 1.35, 1.0)
		else:
			sprite.modulate = Color.WHITE
		if mech_leg_left:
			mech_leg_left.modulate = Color.WHITE
		if mech_leg_right:
			mech_leg_right.modulate = Color.WHITE

func _update_death_animation(delta: float) -> void:
	_death_timer += delta
	_update_particles(delta)

	match enemy_type:
		EnemyType.MECH_WALKER:
			# CHUỖI HOẠT ẢNH TÉ NGÃ KHỦNG BỐ THEO ĐÚNG VIDEO THỰC TẾ (4 PHA)
			if _death_timer < 0.22:
				# PHA 1: Trượt chân hẫng người bật ngửa ra sau (Slip & Stumble)
				var p1 = _death_timer / 0.22
				if visual_root:
					visual_root.rotation = lerpf(0.0, -0.45, p1)
				if mech_leg_left:
					mech_leg_left.rotation = lerpf(mech_leg_left.rotation, 0.75, p1)
					mech_leg_left.position.y = lerpf(mech_leg_left.position.y, -30.0, p1)
				if mech_leg_right:
					mech_leg_right.rotation = lerpf(mech_leg_right.rotation, 0.90, p1)
					mech_leg_right.position.y = lerpf(mech_leg_right.position.y, -34.0, p1)
				position.y -= 10.0 * delta
				_hit_flash = 1.0
			elif _death_timer < 0.45:
				# PHA 2: Rơi đập mạnh mông và lưng xuống đất (Ground Impact Shockwave)
				var p2 = (_death_timer - 0.22) / 0.23
				if not _death_impact_triggered:
					_death_impact_triggered = true
					_spawn_death_impact_shockwave()
					_spawn_flying_gears()
					if sound_synth:
						sound_synth.play_enemy_death()

				if visual_root:
					visual_root.rotation = lerpf(-0.45, -0.85, p2)
					var squish = 1.0 - sin(p2 * PI) * 0.22
					visual_root.scale.y = squish
				if mech_leg_left:
					mech_leg_left.rotation = 0.85
					mech_leg_left.position.y = -15.0
				if mech_leg_right:
					mech_leg_right.rotation = 0.95
					mech_leg_right.position.y = -18.0
			elif _death_timer < 0.95:
				# PHA 3: Nằm gục phế tích, khói đen lò hơi cuồn cuộn bốc lên, mắt tắt ngúm
				if visual_root:
					visual_root.rotation = -0.85
					visual_root.scale.y = 1.0
				_death_smoke_timer -= delta
				if _death_smoke_timer <= 0.0:
					_death_smoke_timer = 0.07
					_spawn_death_black_smoke()
				modulate = Color(0.65, 0.65, 0.65, 1.0)
			else:
				# PHA 4: Mờ dần tan biến
				var p4 = (_death_timer - 0.95) / 0.30
				modulate.a = clampf(1.0 - p4, 0.0, 1.0)
				if _death_timer >= 1.25:
					queue_free()

		EnemyType.STEAM_TRAIN:
			# Tàu lật nghiêng bánh xe, nổ khói đen, mờ dần
			if visual_root:
				visual_root.rotation = lerpf(0.0, -0.65, minf(1.0, _death_timer * 3.5))
				visual_root.position.y = minf(12.0, _death_timer * 35.0)
			_death_smoke_timer -= delta
			if _death_smoke_timer <= 0.0 and _death_timer < 0.8:
				_death_smoke_timer = 0.08
				_spawn_death_black_smoke()
			if _death_timer > 0.65:
				modulate.a = clampf(1.0 - (_death_timer - 0.65) / 0.35, 0.0, 1.0)
			if _death_timer >= 1.05:
				queue_free()

		EnemyType.WINGED_BOT:
			# Chim robot gãy cánh rơi xoay tròn cắm xuống đất
			if visual_root:
				visual_root.rotation += delta * 12.0
				visual_root.position.y += delta * 90.0
			if _death_timer > 0.45:
				modulate.a = clampf(1.0 - (_death_timer - 0.45) / 0.35, 0.0, 1.0)
			if _death_timer >= 0.85:
				queue_free()

func _spawn_castle_attack_fx() -> void:
	var impact_pt = Vector2(22.0, -18.0)
	for p in range(12):
		var ang = randf_range(-PI * 0.85, PI * 0.85)
		var spd = randf_range(45.0, 120.0)
		_dust_particles.append({
			"pos": impact_pt + Vector2(randf_range(-5, 5), randf_range(-5, 5)),
			"vel": Vector2(cos(ang) * spd, sin(ang) * spd - randf_range(15, 35)),
			"life": 0.40,
			"max_life": 0.40,
			"radius": randf_range(2.0, 4.5),
			"is_spark": true,
			"spark_color": Color(1.0, randf_range(0.4, 0.95), 0.1, 1.0)
		})
	for d in range(6):
		var ang = randf_range(-PI * 0.9, -PI * 0.1)
		var spd = randf_range(35.0, 80.0)
		_debris_particles.append({
			"pos": impact_pt,
			"vel": Vector2(cos(ang) * spd, sin(ang) * spd),
			"life": 0.50,
			"max_life": 0.50,
			"size": randf_range(3.0, 6.0),
			"rot": randf() * TAU,
			"rot_speed": randf_range(-8.0, 8.0)
		})

func _spawn_footstep_dust() -> void:
	var side = -1.0 if _is_facing_left else 1.0
	# Đợt bụi tung ra từ cú dậm gót đất uy lực của robot to
	for p in range(6):
		var ang = randf_range(-PI * 0.95, -PI * 0.05)
		var spd = randf_range(16.0, 48.0)
		_dust_particles.append({
			"pos": Vector2(randf_range(-14, 14) * side, randf_range(-2, 3)),
			"vel": Vector2(cos(ang) * spd, sin(ang) * spd * 0.40 - randf_range(8, 18)),
			"life": 0.45,
			"max_life": 0.45,
			"radius": randf_range(5.0, 9.5)
		})

func _spawn_train_smoke() -> void:
	var side = -1.0 if _is_facing_left else 1.0
	_smoke_particles.append({
		"pos": Vector2(-16.0 * side, -55.0),
		"vel": Vector2(-randf_range(16, 32) * side, -randf_range(28, 48)),
		"life": 0.45,
		"max_life": 0.45,
		"radius": randf_range(5.5, 10.0),
		"is_black": false
	})

func _spawn_train_dust() -> void:
	var side = -1.0 if _is_facing_left else 1.0
	for p in range(2):
		_dust_particles.append({
			"pos": Vector2(randf_range(8, 20) * side, randf_range(-1, 2)),
			"vel": Vector2(randf_range(10, 24) * side, -randf_range(4, 12)),
			"life": 0.35,
			"max_life": 0.35,
			"radius": randf_range(3.5, 6.0)
		})

func _spawn_bird_jet_particles() -> void:
	pass

func _spawn_mech_steam() -> void:
	var side = -1.0 if _is_facing_left else 1.0
	# Ống khói lò hơi ở vai sau, cao ~72px
	_smoke_particles.append({
		"pos": Vector2(-8.0 * side, -72.0),
		"vel": Vector2(-randf_range(8, 20) * side, -randf_range(22, 42)),
		"life": 0.42,
		"max_life": 0.42,
		"radius": randf_range(4.5, 9.0),
		"is_black": false
	})

func _spawn_death_impact_shockwave() -> void:
	for i in range(14):
		var ang = float(i) / 14.0 * TAU + randf_range(-0.15, 0.15)
		var spd = randf_range(28.0, 58.0)
		_dust_particles.append({
			"pos": Vector2(cos(ang) * 6.0, sin(ang) * 2.5),
			"vel": Vector2(cos(ang) * spd, sin(ang) * spd * 0.45 - randf_range(8.0, 18.0)),
			"life": 0.55,
			"max_life": 0.55,
			"radius": randf_range(7.0, 13.0)
		})

func _spawn_flying_gears() -> void:
	for i in range(8):
		var ang = randf_range(-PI * 0.85, -PI * 0.15)
		var spd = randf_range(70.0, 150.0)
		_debris_particles.append({
			"pos": Vector2(randf_range(-10, 10), randf_range(-25, -15)),
			"vel": Vector2(cos(ang) * spd, sin(ang) * spd),
			"rot": randf() * TAU,
			"rot_speed": randf_range(-15.0, 15.0),
			"radius": randf_range(3.5, 6.5),
			"life": 0.85,
			"max_life": 0.85,
			"is_gear": (i % 2 == 0)
		})

func _spawn_death_black_smoke() -> void:
	var side = -1.0 if _is_facing_left else 1.0
	_smoke_particles.append({
		"pos": Vector2(-12.0 * side, -28.0),
		"vel": Vector2(randf_range(-14, 14), -randf_range(35, 65)),
		"life": 0.65,
		"max_life": 0.65,
		"radius": randf_range(8.0, 15.0),
		"is_black": true
	})

func _update_particles(delta: float) -> void:
	var i = _dust_particles.size() - 1
	while i >= 0:
		_dust_particles[i]["life"] -= delta
		if _dust_particles[i]["life"] <= 0.0:
			_dust_particles.remove_at(i)
		else:
			_dust_particles[i]["pos"] += _dust_particles[i]["vel"] * delta
			if _dust_particles[i].get("is_spark", false):
				_dust_particles[i]["radius"] = maxf(0.8, _dust_particles[i]["radius"] - delta * 3.5)
			else:
				_dust_particles[i]["radius"] += delta * 6.0
		i -= 1

	var j = _smoke_particles.size() - 1
	while j >= 0:
		_smoke_particles[j]["life"] -= delta
		if _smoke_particles[j]["life"] <= 0.0:
			_smoke_particles.remove_at(j)
		else:
			_smoke_particles[j]["pos"] += _smoke_particles[j]["vel"] * delta
			_smoke_particles[j]["radius"] += delta * 12.0
		j -= 1

	var k = _debris_particles.size() - 1
	while k >= 0:
		var dp = _debris_particles[k]
		dp["life"] -= delta
		if dp["life"] <= 0.0:
			_debris_particles.remove_at(k)
		else:
			dp["vel"].y += 320.0 * delta # Trọng lực rơi
			dp["pos"] += dp["vel"] * delta
			dp["rot"] += dp["rot_speed"] * delta
			if dp["pos"].y > 2.0:
				dp["pos"].y = 2.0
				dp["vel"] = Vector2.ZERO
				dp["rot_speed"] = 0.0
		k -= 1

## Hàm vẽ vòng elip chuẩn Isometric dẹt 2.5D dùng chung (ry = rx * 0.48)
func draw_isometric_ring(center: Vector2, radius_x: float, color: Color, width: float = 1.2, start_angle: float = 0.0, end_angle: float = TAU, segments: int = 32) -> void:
	var pts = PackedVector2Array()
	var ry = radius_x * 0.48
	var angle_span = end_angle - start_angle
	for i in range(segments + 1):
		var a = start_angle + float(i) * angle_span / float(segments)
		pts.append(center + Vector2(cos(a) * radius_x, sin(a) * ry))
	draw_polyline(pts, color, width)

func _draw() -> void:
	# 0. BÓNG TIẾP ĐẤT DƯỚI BÀN CHÂN (Contact Shadow Ellipse)
	if not is_flying and enemy_type != EnemyType.WINGED_BOT and variant != EnemyVariant.AIR_DRONE:
		var sc_shadow = 1.35 if is_boss else 1.0
		if enemy_type == EnemyType.STEAM_TRAIN:
			# Bóng đổ dẹt dài theo khung gầm xe lửa hơi nước bám sát đáy bánh xe
			draw_set_transform(Vector2(0.0, -4.0), 0.0, Vector2(1.0, 0.42))
			draw_circle(Vector2.ZERO, 26.0 * sc_shadow, Color(0.0, 0.0, 0.0, 0.45))
			draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		else:
			var sh_rx = 16.0 * sc_shadow
			draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.0, 0.48))
			draw_circle(Vector2.ZERO, sh_rx, Color(0.0, 0.0, 0.0, 0.48))
			draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# 1. VẼ HẠT BỤI ĐẤT BƯỚC CHÂN & TIA LỬA ĐỘNG CƠ CHIM
	for p in _dust_particles:
		var a = (p["life"] / p["max_life"]) * 0.48
		if p.get("is_spark", false):
			var spark_a = clampf(p["life"] / p["max_life"], 0.0, 1.0)
			draw_circle(p["pos"], p["radius"], Color(1.0, 0.72, 0.18, spark_a * 0.85))
			draw_circle(p["pos"], p["radius"] * 0.45, Color(1.0, 0.95, 0.65, spark_a))
		else:
			draw_circle(p["pos"], p["radius"], Color(0.80, 0.70, 0.48, a))

	# 4. VẼ HẠT KHÓI TÀU & KHÓI NỔ LÒ HƠI
	for sp in _smoke_particles:
		var a = (sp["life"] / sp["max_life"]) * 0.55
		var col = Color(0.16, 0.16, 0.18, a) if sp.get("is_black", false) else Color(0.82, 0.85, 0.88, a)
		draw_circle(sp["pos"], sp["radius"], col)

	# 5. VẼ MẢNH VỠ BÁNH RĂNG & ỐC VÍT VĂNG TUNG TÓE
	for dp in _debris_particles:
		var a = clampf(dp["life"] / dp["max_life"], 0.0, 1.0)
		var center = dp["pos"]
		var rad = dp["radius"]
		if dp.get("is_gear", false):
			draw_circle(center, rad, Color(0.85, 0.65, 0.28, a))
			draw_circle(center, rad * 0.45, Color(0.18, 0.12, 0.08, a))
			for tooth in range(4):
				var tang = dp["rot"] + float(tooth) * (PI * 0.5)
				var tpos = center + Vector2(cos(tang), sin(tang)) * (rad + 1.8)
				draw_line(center, tpos, Color(0.92, 0.75, 0.35, a), 1.8)
		else:
			var bolt_vec = Vector2(cos(dp["rot"]), sin(dp["rot"])) * rad
			draw_line(center - bolt_vec, center + bolt_vec, Color(0.70, 0.72, 0.78, a), 2.2)

	# 6. THANH MÁU BO GÓC TRÊN ĐẦU (CHỈ HIỂN THỊ KHI CÒN SỐNG)
	if _is_dead:
		return

	# Đĩa sáng mờ Isometric (Soft Gradient Disc) dưới chân Boss (alpha = 0.16, viền mảnh 1.2px xoay nhẹ)
	if is_boss:
		var halo_pulse = sin(_time_alive * (10.0 if _overdrive_triggered else 6.0)) * 3.0
		var halo_rad = 38.0 + halo_pulse
		var halo_color = Color(1.0, 0.20, 0.05, 0.45) if _overdrive_triggered else Color(1.0, 0.35, 0.15, 0.45)
		var halo_fill = Color(1.0, 0.15, 0.05, 0.16) if _overdrive_triggered else Color(1.0, 0.22, 0.10, 0.16)

		draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.0, 0.48))
		draw_circle(Vector2.ZERO, halo_rad, halo_fill)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		draw_isometric_ring(Vector2.ZERO, halo_rad, halo_color, 1.2, _time_alive * 2.0, _time_alive * 2.0 + TAU, 36)

		# Vòng cảnh báo tích xung nhiễu / lộ điểm yếu
		if is_jamming:
			var warn_rad = 25.0 + 35.0 * clampf(jamming_timer / 2.0, 0.0, 1.0)
			draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.0, 0.48))
			draw_circle(Vector2.ZERO, warn_rad, Color(0.65, 0.35, 1.0, 0.12))
			draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			draw_isometric_ring(Vector2.ZERO, warn_rad, Color(0.65, 0.35, 1.0, 0.65), 1.2)
			draw_isometric_ring(Vector2.ZERO, warn_rad * 0.94, Color(0.20, 0.85, 1.0, 0.45), 1.0)
			draw_string(ThemeDB.fallback_font, Vector2(-60.0, -125.0), "TÍCH XUNG NHIỄU!", HORIZONTAL_ALIGNMENT_CENTER, -1, 11, Color(0.75, 0.50, 1.0))
		elif is_vulnerable:
			var vuln_pulse = 0.5 + 0.5 * sin(_time_alive * 12.0)
			draw_isometric_ring(Vector2.ZERO, 42.0, Color(0.2, 0.95, 1.0, 0.45 + 0.25 * vuln_pulse), 1.2)
			draw_string(ThemeDB.fallback_font, Vector2(-60.0, -125.0), "LỘ ĐIỂM YẾU (+25%)", HORIZONTAL_ALIGNMENT_CENTER, -1, 11, Color(0.2, 0.95, 1.0))

	# Đĩa sáng mờ Isometric dưới chân Quái Hộ Vệ (Support Mech)
	if variant == EnemyVariant.SUPPORT:
		var sup_pulse = sin(_time_alive * 4.0) * 2.5
		var sup_rad = 32.0 + sup_pulse
		draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.0, 0.48))
		draw_circle(Vector2.ZERO, sup_rad, Color(0.2, 1.0, 0.65, 0.14))
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		draw_isometric_ring(Vector2.ZERO, sup_rad, Color(0.2, 1.0, 0.65, 0.45), 1.2, -_time_alive * 2.0, -_time_alive * 2.0 + TAU, 32)

	# Bóng đổ bám đất cho đơn vị bay lơ lửng (Aerial Drone & Winged Bot)
	if is_flying or variant == EnemyVariant.AIR_DRONE or enemy_type == EnemyType.WINGED_BOT:
		var shadow_w = 26.0
		draw_set_transform(Vector2(6.0, 24.0), 0.0, Vector2(1.0, 0.48))
		draw_circle(Vector2.ZERO, shadow_w * 0.5, Color(0.05, 0.08, 0.12, 0.35))
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	var bar_w = 76.0 if is_boss else 46.0
	var bar_h = 8.0 if is_boss else 6.0
	var bar_y = -118.0 if is_boss else (-92.0 if enemy_type == EnemyType.MECH_WALKER else (-78.0 if enemy_type == EnemyType.WINGED_BOT else -70.0))

	# Viền đen 1.5px bao ngoài nền thanh máu
	draw_rect(Rect2(-bar_w * 0.5 - 1.5, bar_y - 1.5, bar_w + 3.0, bar_h + 3.0), Color(0.04, 0.06, 0.09, 0.95))

	# Thanh máu chính
	var ratio = clampf(current_hp / max_hp, 0.0, 1.0)
	var fill_color = Color(0.2, 0.95, 0.4) if ratio > 0.5 else (Color(1.0, 0.8, 0.1) if ratio > 0.25 else Color(1.0, 0.2, 0.25))
	draw_rect(Rect2(-bar_w * 0.5, bar_y, bar_w * ratio, bar_h), fill_color)

	# Thanh Khiên Năng Lượng (Shield Bar) 4px nằm chồng gọn gàng phía trên
	if max_shield > 0.0 and current_shield > 0.0:
		var s_ratio = clampf(current_shield / max_shield, 0.0, 1.0)
		draw_rect(Rect2(-bar_w * 0.5 - 1.5, bar_y - 6.0, bar_w + 3.0, 5.0), Color(0.04, 0.06, 0.09, 0.95))
		draw_rect(Rect2(-bar_w * 0.5, bar_y - 5.0, bar_w * s_ratio, 3.5), Color(0.2, 0.85, 1.0, 0.95))

	# 7. VẼ HUY HIỆU HÌNH HỌC 6px CẠNH THANH MÁU (THAY THẾ CHỮ ĐÈ TRÊN ĐẦU)
	var badge_x = -bar_w * 0.5 - 8.5
	var badge_y = bar_y + bar_h * 0.5
	if is_boss:
		# Huy hiệu Thoi Đỏ Cam phát sáng cho Boss Mech
		var pts = PackedVector2Array([
			Vector2(badge_x, badge_y - 6.0),
			Vector2(badge_x + 6.0, badge_y),
			Vector2(badge_x, badge_y + 6.0),
			Vector2(badge_x - 6.0, badge_y)
		])
		draw_colored_polygon(pts, Color(1.0, 0.25, 0.15, 0.95))
		draw_string(ThemeDB.fallback_font, Vector2(-32.0, bar_y - 8.0), "BOSS MECH", HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(1.0, 0.35, 0.25))
	elif variant == EnemyVariant.SUPPORT:
		# Hình thoi Xanh Ngọc cho Hộ Vệ
		var pts = PackedVector2Array([
			Vector2(badge_x, badge_y - 5.5),
			Vector2(badge_x + 5.0, badge_y),
			Vector2(badge_x, badge_y + 5.5),
			Vector2(badge_x - 5.0, badge_y)
		])
		draw_colored_polygon(pts, Color(0.2, 1.0, 0.65, 0.95))
	elif armor_type == ArmorType.HEAVY_ARMOR:
		# Khiên Xám cho Giáp Nặng
		var pts = PackedVector2Array([
			Vector2(badge_x - 4.5, badge_y - 5.0),
			Vector2(badge_x + 4.5, badge_y - 5.0),
			Vector2(badge_x + 4.5, badge_y),
			Vector2(badge_x, badge_y + 5.5),
			Vector2(badge_x - 4.5, badge_y)
		])
		draw_colored_polygon(pts, Color(0.75, 0.78, 0.82, 0.95))
	elif variant == EnemyVariant.SCOUT:
		# Mũi tên Vàng cho Trinh Sát
		var pts = PackedVector2Array([
			Vector2(badge_x + 5.0, badge_y),
			Vector2(badge_x - 4.5, badge_y - 4.5),
			Vector2(badge_x - 2.0, badge_y),
			Vector2(badge_x - 4.5, badge_y + 4.5)
		])
		draw_colored_polygon(pts, Color(1.0, 0.85, 0.2, 0.95))
	elif is_flying or variant == EnemyVariant.AIR_DRONE:
		# Đôi cánh xanh lơ cho Aerial
		var pts = PackedVector2Array([
			Vector2(badge_x, badge_y + 4.0),
			Vector2(badge_x + 5.5, badge_y - 4.0),
			Vector2(badge_x, badge_y - 1.0),
			Vector2(badge_x - 5.5, badge_y - 4.0)
		])
		draw_colored_polygon(pts, Color(0.25, 0.9, 1.0, 0.95))
	else:
		# Chấm tròn cơ khí cơ bản
		draw_circle(Vector2(badge_x, badge_y), 3.5, Color(0.85, 0.55, 0.2, 0.85))

func get_chest_world_pos() -> Vector2:
	if enemy_type == EnemyType.MECH_WALKER:
		return global_position + Vector2(0.0, -34.0)
	elif enemy_type == EnemyType.WINGED_BOT:
		return global_position + Vector2(0.0, -22.0)
	else:
		return global_position + Vector2(0.0, -20.0)

# Các hàm kích hoạt hiệu ứng trạng thái & Combo nguyên tố
func apply_acid(duration: float = 6.0) -> void:
	status_acid_timer = duration
	_spawn_combat_text("AXÍT!", Color(0.4, 0.95, 0.3), 13)

func apply_oil(duration: float = 6.0) -> void:
	status_oiled_timer = duration
	_spawn_combat_text("DẦU NHỜN!", Color(0.85, 0.75, 0.2), 13)

func apply_chill(duration: float = 3.5) -> void:
	status_chilled_timer = duration
	status_freeze_stacks += 1
	if status_freeze_stacks >= 5:
		status_freeze_stacks = 0
		freeze(2.0)
	else:
		_spawn_combat_text("LÀM CHẬM [%d/5]" % status_freeze_stacks, Color(0.3, 0.85, 1.0), 12)

func freeze(duration: float = 2.0) -> void:
	status_frozen_timer = duration
	_spawn_combat_text("ĐÓNG BĂNG!", Color(0.5, 0.9, 1.0), 13)

func apply_burn(dps: float = 25.0, duration: float = 4.0) -> void:
	status_burn_timer = duration
	status_burn_dps = dps
	_spawn_combat_text("THIÊU ĐỐT!", Color(1.0, 0.45, 0.1), 13)

func apply_slow(factor: float = 0.8, duration: float = 1.5) -> void:
	status_slow_timer = maxf(status_slow_timer, duration)
	status_slow_factor = minf(status_slow_factor, factor)
	_spawn_combat_text("LÀM CHẬM!", Color(0.3, 0.9, 1.0), 12)

func get_effective_speed() -> float:
	if is_vulnerable or vulnerable_timer > 0.0:
		return 0.0 # Boss bị Choáng khi bị ngắt chiêu
	var eff = speed
	if status_chilled_timer > 0.0:
		eff *= 0.60
	if status_slow_timer > 0.0:
		eff *= status_slow_factor
	return eff

func start_jamming_channel() -> void:
	if not is_boss or _is_dead or is_vulnerable:
		return
	is_jamming = true
	jamming_timer = 2.0
	_spawn_combat_text("TÍCH XUNG!", Color(0.9, 0.2, 0.85), 14)

func interrupt_jamming() -> void:
	if not is_boss or not is_jamming:
		return
	is_jamming = false
	jamming_timer = 0.0
	jamming_cooldown = 7.0
	is_vulnerable = true
	vulnerable_timer = 2.0
	status_frozen_timer = maxf(status_frozen_timer, 2.0)
	_spawn_combat_text("NGẮT CHIÊU!", Color(0.2, 0.95, 1.0), 14)
	if is_inside_tree() and get_tree() and get_tree().current_scene:
		if get_tree().current_scene.has_method("notify_boss_interrupted"):
			get_tree().current_scene.notify_boss_interrupted()

func _discharge_jamming_pulse() -> void:
	is_jamming = false
	jamming_cooldown = 7.0
	_spawn_combat_text("PHÓNG XUNG!", Color(0.85, 0.25, 0.95), 14)

	var candidates: Array = []
	if is_inside_tree() and get_tree():
		candidates = get_tree().get_nodes_in_group("animated_towers")
	if candidates.is_empty() and is_inside_tree() and get_tree().current_scene:
		var tc = get_tree().current_scene.get_node_or_null("TowersContainer")
		if tc:
			candidates = tc.get_children()
	if candidates.is_empty() and get_parent():
		candidates = get_parent().find_children("*", "", true, false)

	var valid_towers: Array = []
	for node in candidates:
		if is_instance_valid(node) and (node is AnimatedTower or node.has_method("apply_jammed")):
			valid_towers.append(node)

	valid_towers.sort_custom(func(a, b):
		return global_position.distance_to(a.global_position) < global_position.distance_to(b.global_position)
	)

	var affected: int = 0
	for t in valid_towers:
		if t.has_method("apply_jammed"):
			t.apply_jammed(3.0, 0.35)
			affected += 1
			if affected >= 2:
				break

func trigger_boss_overdrive() -> void:
	if _overdrive_triggered or _is_dead:
		return
	_overdrive_triggered = true
	_overdrive_timer = 3.5
	speed *= 1.25
	var shield_boost = max_hp * 0.20
	max_shield = maxf(max_shield, current_shield + shield_boost)
	current_shield = minf(max_shield, current_shield + shield_boost)
	_spawn_combat_text("OVERDRIVE!", Color(1.0, 0.35, 0.1))

func _find_and_heal_allies() -> void:
	trigger_support_pulse()

func trigger_support_pulse() -> void:
	if _is_dead:
		return
	_spawn_combat_text("HỒI MÁU!", Color(0.2, 1.0, 0.65))
	var enemies = []
	if is_inside_tree():
		enemies = get_tree().get_nodes_in_group("animated_enemies")
	elif get_parent():
		enemies = get_parent().find_children("*", "", true, false)
	var affected: int = 0
	for e in enemies:
		if is_instance_valid(e) and e != self and not e.get("_is_dead") and not e.is_queued_for_deletion():
			if global_position.distance_squared_to(e.global_position) <= 14400.0: # 120.0 * 120.0
				var heal_amount = e.max_hp * 0.10
				e.current_hp = minf(e.max_hp, e.current_hp + heal_amount)
				var shield_grant = e.max_hp * 0.15
				e.max_shield = maxf(e.max_shield, e.current_shield + shield_grant)
				e.current_shield = minf(e.max_shield, e.current_shield + shield_grant)
				if e.has_method("_spawn_combat_text"):
					e._spawn_combat_text("+KHIÊN!", Color(0.2, 1.0, 0.65))
				affected += 1
				if affected >= 3:
					break

func _trigger_oil_fire_burst() -> void:
	_spawn_combat_text("NỔ DẦU!", Color(1.0, 0.4, 0.1))
	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e != self and not e.is_queued_for_deletion():
			if global_position.distance_squared_to(e.global_position) <= 14400.0 and e.has_method("take_damage"):
				e.take_damage(75.0, DamageType.THERMAL_PLASMA)

func _trigger_superconductor_chain_stun() -> void:
	_spawn_combat_text("SIÊU DẪN!", Color(0.25, 0.95, 1.0))
	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and not e.is_queued_for_deletion():
			if global_position.distance_squared_to(e.global_position) <= 19600.0: # 140.0 * 140.0
				if e.has_method("electrocute"):
					e.electrocute(1.5)
				if e.has_method("take_damage") and e != self:
					e.take_damage(40.0, DamageType.ELECTRO_EMP)

func _spread_corrosive_spores() -> void:
	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e != self and not e.is_queued_for_deletion():
			if global_position.distance_squared_to(e.global_position) <= 8100.0 and e.has_method("apply_acid"):
				e.apply_acid(5.0)

func take_damage(amount: float, dmg_type: int = -1, from_tower: Node2D = null) -> void:
	if _is_dead:
		return

	# SPRINT 6: Lộ Điểm Yếu khi bị ngắt chiêu (nhận thêm +25% sát thương từ mọi nguồn)
	if is_vulnerable:
		amount *= 1.25

	# SPRINT 6: Bão Từ Trường Ion tăng +25% sát thương hệ Điện (ELECTRO_EMP)
	if dmg_type == DamageType.ELECTRO_EMP and is_ion_storm_active:
		amount *= 1.25

	# SPRINT 6: Cơ chế Ngắt Chiêu Boss Mech khi trúng ELECTRO_EMP từ Bẫy Cầu hoặc Tesla Cấp 3
	if is_boss and is_jamming and dmg_type == DamageType.ELECTRO_EMP:
		var can_interrupt = false
		if from_tower == null:
			can_interrupt = true # Bẫy Cầu trên cầu hoặc phép sấm sét toàn map
		elif is_instance_valid(from_tower) and from_tower.get("tower_type") == 2 and from_tower.get("level") >= 3:
			can_interrupt = true # Tesla Coil Cấp 3
		if can_interrupt:
			interrupt_jamming()

	# 1. ELEMENTAL COMBOS / PHẢN ỨNG NGUYÊN TỐ
	# Combo A: Tưới Dầu + Tia Lửa / Plasma / Dung Nham (Oil + Fire Burst)
	if status_oiled_timer > 0.0 and (dmg_type == DamageType.THERMAL_PLASMA or dmg_type == DamageType.ARCANE):
		status_oiled_timer = 0.0
		_trigger_oil_fire_burst()

	# Combo B: Dính Nước / Băng + Sấm Sét EMP (Superconductor Chain Stun)
	if (status_chilled_timer > 0.0 or status_frozen_timer > 0.0) and dmg_type == DamageType.ELECTRO_EMP:
		_trigger_superconductor_chain_stun()

	# 2. XỬ LÝ SÁT THƯƠNG THEO BẢNG TƯƠNG KHẮC GIÁP & SÁT THƯƠNG
	var mult: float = 1.0
	var is_crit: bool = false
	var is_resist: bool = false
	var badge_text: String = ""

	# A. ĐÒN THÁNH / THUẦN KHIẾT (TRUE DAMAGE)
	if dmg_type == DamageType.TRUE_DAMAGE:
		mult = 1.0
		if armor_type == ArmorType.ETHEREAL:
			mult = 2.5
			is_crit = true
			badge_text = "THÁNH PHẠT!"
		else:
			badge_text = "CHUẨN!"
		# Bỏ qua khiên, xuyên thẳng vào máu!
		current_hp = maxf(0.0, current_hp - amount * mult)
		_hit_flash = 1.0
		var cur_time = Time.get_ticks_msec() / 1000.0
		if cur_time - _last_status_text_time >= 0.9:
			_last_status_text_time = cur_time
			_spawn_combat_text("%d (%s)" % [int(amount * mult), badge_text], Color(1.0, 0.95, 0.4), 14)
		else:
			_spawn_combat_text("%d" % int(amount * mult), Color(1.0, 0.95, 0.4), 13)
		if is_boss and not _overdrive_triggered and current_hp > 0.0 and current_hp <= max_hp * 0.50:
			trigger_boss_overdrive()
		if current_hp <= 0.0:
			_die()
		return

	# B. GIÁP NĂNG LƯỢNG / KHIÊN (SHIELD)
	if current_shield > 0.0:
		match dmg_type:
			DamageType.KINETIC:
				mult = 1.0
			DamageType.THERMAL_PLASMA, DamageType.ELECTRO_EMP:
				mult = 2.0
				is_crit = true
				badge_text = "PHÁ KHIÊN!"
			DamageType.ARCANE:
				mult = 0.70
				is_resist = true
				badge_text = "KHIÊN -30%"
			DamageType.BIO_CORROSIVE:
				mult = 0.0
				is_resist = true
				badge_text = "MIỄN NHIỄM"

		var shield_dmg = amount * mult
		if shield_dmg > 0.0:
			if current_shield >= shield_dmg:
				current_shield -= shield_dmg
				_hit_flash = 0.8
				var cur_time = Time.get_ticks_msec() / 1000.0
				if cur_time - _last_status_text_time >= 0.9 and badge_text != "":
					_last_status_text_time = cur_time
					_spawn_combat_text("%d (%s)" % [int(shield_dmg), badge_text], Color(0.2, 0.85, 1.0), 13)
				else:
					_spawn_combat_text("%d" % int(shield_dmg), Color(0.2, 0.85, 1.0), 12)
				return
			else:
				var spillover = (shield_dmg - current_shield) / mult
				current_shield = 0.0
				amount = spillover
				var cur_time = Time.get_ticks_msec() / 1000.0
				if cur_time - _last_status_text_time >= 0.9:
					_last_status_text_time = cur_time
					_spawn_combat_text("VỠ KHIÊN!", Color(0.4, 0.95, 1.0), 13)

	# C. TÍNH SÁT THƯƠNG THEO LOẠI THÂN / GIÁP (ARMOR / FLESH / ETHEREAL)
	match armor_type:
		ArmorType.ETHEREAL: # Thể linh hồn: Miễn nhiễm Vật lý & Axit
			match dmg_type:
				DamageType.KINETIC:
					mult = 0.0
					is_resist = true
					badge_text = "KHÁNG VẬT LÝ"
				DamageType.THERMAL_PLASMA:
					mult = 1.0
				DamageType.ARCANE:
					mult = 2.0
					is_crit = true
					badge_text = "HẮC THUẬT!"
				DamageType.BIO_CORROSIVE:
					mult = 0.0
					is_resist = true
					badge_text = "KHÁNG AXÍT"

		ArmorType.FLESH, ArmorType.AERIAL: # Máu sinh học / Quái bầy / Chim bay
			match dmg_type:
				DamageType.KINETIC:
					if armor_type == ArmorType.AERIAL or is_flying or variant == EnemyVariant.AIR_DRONE:
						var is_sam_tier3 = false
						if is_instance_valid(from_tower) and from_tower.get("tower_type") == 3 and from_tower.get("level") >= 3:
							is_sam_tier3 = true
						if is_sam_tier3:
							mult = 3.0
							badge_text = "PHÒNG KHÔNG 3!"
						else:
							mult = 2.2
							badge_text = "PHÒNG KHÔNG!"
					else:
						mult = 1.5
						badge_text = "XÉ THỊT!"
					is_crit = true
				DamageType.THERMAL_PLASMA:
					if armor_type == ArmorType.AERIAL or is_flying or variant == EnemyVariant.AIR_DRONE:
						mult = 0.70
						is_resist = true
						badge_text = "NÉ (30%)"
					else:
						mult = 1.0
				DamageType.ARCANE:
					if armor_type == ArmorType.AERIAL or is_flying or variant == EnemyVariant.AIR_DRONE:
						mult = 0.70
						is_resist = true
						badge_text = "NÉ (30%)"
					else:
						mult = 1.0
				DamageType.BIO_CORROSIVE:
					mult = 1.5
					is_crit = true
					badge_text = "ĐỘC ĂN MÒN!"

		ArmorType.HEAVY_ARMOR, ArmorType.MECHANICAL, ArmorType.SHIELD: # Giáp sắt / Robot / Cơ khí
			# Combo C: Axit bào mòn giáp + Đạn Kinetic chí mạng
			if status_acid_timer > 0.0 and dmg_type == DamageType.KINETIC:
				mult = 2.0
				is_crit = true
				badge_text = "AXÍT CHÍ MẠNG!"
			else:
				match dmg_type:
					DamageType.KINETIC:
						mult = 0.50
						is_resist = true
						badge_text = "GIÁP -50%"
					DamageType.THERMAL_PLASMA:
						mult = 2.5
						is_crit = true
						badge_text = "PHÁ GIÁP!"
					DamageType.ELECTRO_EMP:
						if armor_type == ArmorType.MECHANICAL:
							mult = 2.2
							is_crit = true
							badge_text = "TÊ LIỆT!"
							electrocute(0.60)
					DamageType.ARCANE:
						mult = 1.0
					DamageType.BIO_CORROSIVE:
						mult = 1.0
						status_acid_timer = 6.0
						is_crit = true
						badge_text = "BÀO MÒN!"

	var final_damage = amount * mult
	current_hp = maxf(0.0, current_hp - final_damage)
	_hit_flash = 1.0

	var dmg_color = Color(1.0, 0.88, 0.35) # Mặc định KINETIC Gatling vàng cam
	if dmg_type == DamageType.THERMAL_PLASMA:
		dmg_color = Color(0.25, 0.95, 1.0) # PLASMA xanh lơ phát sáng
	elif dmg_type == DamageType.ELECTRO_EMP:
		dmg_color = Color(0.85, 0.45, 1.0) # EMP tím
		if is_instance_valid(from_tower) and from_tower.get("tower_type") == 2:
			status_overload_timer = 2.0
			_electro_charged_timer = 2.0
	elif dmg_type == DamageType.TRUE_DAMAGE:
		dmg_color = Color(1.0, 0.95, 0.4) # Thánh vàng

	var cur_time = Time.get_ticks_msec() / 1000.0
	var can_show_status = (cur_time - _last_status_text_time >= 0.9)

	if is_crit:
		if can_show_status and badge_text != "":
			_last_status_text_time = cur_time
			_spawn_combat_text("%d (%s)" % [int(final_damage), badge_text], Color(1.0, 0.78, 0.15), 14)
		else:
			_spawn_combat_text("%d" % int(final_damage), Color(1.0, 0.78, 0.15), 13)
	elif is_resist:
		if can_show_status and badge_text != "":
			_last_status_text_time = cur_time
			_spawn_combat_text("%d (%s)" % [int(final_damage), badge_text], Color(0.70, 0.74, 0.80), 12)
		else:
			_spawn_combat_text("%d" % int(final_damage), Color(0.65, 0.68, 0.74, 0.80), 11)
	else:
		_spawn_combat_text("%d" % int(final_damage), dmg_color, 13)

	if is_boss and not _overdrive_triggered and current_hp > 0.0 and current_hp <= max_hp * 0.50:
		trigger_boss_overdrive()

	if current_hp <= 0.0:
		if status_acid_timer > 0.0:
			_spread_corrosive_spores()
		_die()

static var _recent_combat_labels: Array[Label] = []

func _spawn_combat_text(txt: String, col: Color, font_sz: int = 14) -> void:
	var cur_time = Time.get_ticks_msec() / 1000.0
	if cur_time - _last_combat_text_time < 0.25:
		_combat_text_stack_offset += 14.0
		if _combat_text_stack_offset > 42.0:
			_combat_text_stack_offset = 0.0
	else:
		_combat_text_stack_offset = 0.0
	_last_combat_text_time = cur_time

	var spawn_y = (-90.0 if is_boss else -60.0) - _combat_text_stack_offset
	var shoulder_x = randf_range(-26.0, -12.0) if randf() < 0.5 else randf_range(12.0, 26.0)
	var spawn_pos = global_position + Vector2(shoulder_x, spawn_y)

	var pool = CombatTextPoolClass.get_instance()
	if pool:
		pool.spawn_text(spawn_pos, txt, col, font_sz, 35.0, 0.45)
		return

	if not is_inside_tree() or not get_tree() or not get_tree().current_scene:
		return

	# Lọc và đếm số chữ bay lân cận trong bán kính 90px
	var clean_labels: Array[Label] = []
	var nearby_count: int = 0
	var my_pos = global_position
	for lbl in _recent_combat_labels:
		if is_instance_valid(lbl) and lbl.is_inside_tree():
			clean_labels.append(lbl)
			if lbl.global_position.distance_squared_to(my_pos) < 8100.0:
				nearby_count += 1
	_recent_combat_labels = clean_labels

	if nearby_count >= 6 and font_sz <= 13:
		return

	var label = Label.new()
	label.text = txt
	label.add_theme_font_size_override("font_size", font_sz)
	label.add_theme_color_override("font_color", col)
	label.add_theme_color_override("font_outline_color", Color(0.06, 0.08, 0.12, 0.95))
	label.add_theme_constant_override("outline_size", 3)
	label.global_position = spawn_pos
	label.z_index = 30
	get_tree().current_scene.add_child(label)
	_recent_combat_labels.append(label)

	var tween_l = label.create_tween()
	tween_l.tween_property(label, "global_position:y", label.global_position.y - 30.0, 0.45).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween_l.parallel().tween_property(label, "modulate:a", 0.0, 0.45)
	tween_l.tween_callback(label.queue_free)

func electrocute(duration: float = 0.22) -> void:
	_electrocute_timer = duration
	_hit_flash = 1.0
	status_overload_timer = 2.0
	_electro_charged_timer = 2.0

func _die() -> void:
	if _is_dead:
		return
	_is_dead = true
	_death_timer = 0.0
	_death_impact_triggered = false

	# Gỡ ngay khỏi nhóm quái sống để tháp lập tức chuyển sang bắn mục tiêu khác
	remove_from_group("animated_enemies")

	# Báo hiệu GameManager cộng vàng và tính điểm ngay lập tức
	emit_signal("enemy_died", self, gold_reward)

	# Chùm nổ lửa ban đầu tại vị trí lò hơi
	if is_inside_tree() and get_tree() and is_instance_valid(get_tree().current_scene):
		var burst = Sprite2D.new()
		burst.texture = TexExplosion
		burst.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		burst.global_position = global_position + Vector2(0, -25.0)
		burst.scale = Vector2(0.32, 0.32)
		get_tree().current_scene.add_child(burst)

		var tween_b = burst.create_tween()
		tween_b.tween_property(burst, "scale", Vector2(0.95, 0.95), 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tween_b.parallel().tween_property(burst, "modulate:a", 0.0, 0.25)
		tween_b.tween_callback(burst.queue_free)

		# Chữ vàng +30G bay lên
		var label = Label.new()
		label.text = "+%dG" % gold_reward
		label.add_theme_font_size_override("font_size", 22)
		label.add_theme_color_override("font_color", Color(1.0, 0.88, 0.2, 1.0))
		label.add_theme_color_override("font_outline_color", Color(0.12, 0.08, 0.0, 0.95))
		label.add_theme_constant_override("outline_size", 5)
		label.global_position = global_position + Vector2(-20.0, -45.0)
		label.z_index = 25
		get_tree().current_scene.add_child(label)

		var tween_l = label.create_tween()
		tween_l.tween_property(label, "global_position:y", label.global_position.y - 45.0, 0.55).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		tween_l.parallel().tween_property(label, "modulate:a", 0.0, 0.55)
		tween_l.tween_callback(label.queue_free)
