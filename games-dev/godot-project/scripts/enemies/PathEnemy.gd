class_name PathEnemy
extends PathFollow2D

## PathEnemy: Quái vật di chuyển trên đường ray PathFollow2D thông minh, mượt mà và tự nhiên
## Tính năng:
## 1. Ôm cua mượt (Smooth Path Turning): Đặt rotates = false trên PathFollow2D để loại bỏ giật cục.
##    Tính vector hướng đi theo frame, dùng lerp_angle() xoay nghiêng sprite ôm cua mượt mà.
## 2. Lật sprite hợp lý (Sprite Direction): Chỉ flip_h ngang khi góc di chuyển đổi giữa trái và phải
##    (cos(angle) > 0 hoặc < 0). Tuyệt đối không xoay lộn ngược bụng sprite 2.5D.
## 3. Giảm dồn cục (Offset Spacing): Gán h_offset = randf_range(-15.0, 15.0) khi spawn để phân tán tự nhiên dọc 2 bên lối mòn.
## 4. Đồng bộ bước chân (Step Sync): Scale tốc độ animation theo vận tốc thực tế (speed_scale = current_speed / base_walk_speed),
##    triệt tiêu hoàn toàn hiện tượng trượt chân.

signal died(enemy: Node2D, reward: int)
signal reached_goal(enemy: Node2D)
signal health_changed(current: float, max: float)

@export_group("Combat Stats")
@export var max_hp: float = 100.0
@export var current_hp: float = 100.0
@export var base_speed: float = 85.0 ## Vận tốc chuẩn (pixel/s)
@export var current_speed: float = 85.0
@export var gold_reward: int = 25

@export_group("Turning & Visual 2.5D")
@export var base_walk_speed: float = 85.0 ## Vận tốc tương ứng với speed_scale 1.0 của hoạt ảnh bước chân
@export var turn_speed: float = 7.5 ## Tốc độ ôm cua mượt mà (rad/s)
@export var max_tilt_deg: float = 12.0 ## Góc nghiêng tối đa khi ôm cua để giữ form dáng 2.5D

# Node References
@onready var visual_root: Node2D = get_node_or_null("VisualRoot") as Node2D
@onready var sprite: Sprite2D = get_node_or_null("VisualRoot/Sprite") as Sprite2D
@onready var anim_player: AnimationPlayer = get_node_or_null("AnimationPlayer") as AnimationPlayer
@onready var hurtbox: Area2D = get_node_or_null("Hurtbox") as Area2D

# State
var is_dead: bool = false
var _prev_global_pos: Vector2 = Vector2.ZERO
var _current_tilt: float = 0.0

func _ready() -> void:
	# 1. BẮT BUỘC: rotates = false để PathFollow2D không bẻ góc thô giật cục và không lật ngược
	rotates = false
	loop = false
	cubic_interp = true

	current_hp = max_hp
	_prev_global_pos = global_position

	# 2. Giảm dồn cục (Offset Spacing):
	# Phân tán ngẫu nhiên dọc hai bên lối mòn, không đè đúp lên cùng một pixel
	h_offset = randf_range(-15.0, 15.0)
	v_offset = randf_range(-10.0, 10.0)

	add_to_group("enemies")

	_ensure_components()

	# Khởi động animation bước chân nếu có
	if anim_player and anim_player.has_animation("walk"):
		anim_player.play("walk")

func _ensure_components() -> void:
	if not visual_root:
		visual_root = get_node_or_null("VisualRoot") as Node2D
		if not visual_root:
			visual_root = Node2D.new()
			visual_root.name = "VisualRoot"
			add_child(visual_root)

	if not hurtbox:
		hurtbox = Area2D.new()
		hurtbox.name = "Hurtbox"
		hurtbox.collision_layer = 2 # Lớp quái (Enemy)
		hurtbox.collision_mask = 0
		add_child(hurtbox)
		var shape = CollisionShape2D.new()
		var circle = CircleShape2D.new()
		circle.radius = 18.0
		shape.shape = circle
		hurtbox.add_child(shape)

func _process(delta: float) -> void:
	if is_dead:
		return

	# 1. Di chuyển dọc theo đường ray
	progress += current_speed * delta

	# Kiểm tra chạm đích cuối đường
	if progress_ratio >= 1.0:
		_on_reach_goal()
		return

	# 2. Tính vector hướng di chuyển thực tế giữa 2 khung hình
	var move_vec = global_position - _prev_global_pos
	_prev_global_pos = global_position

	# 3. Ôm cua mượt mà và Lật Sprite hợp lý (Sprite Direction)
	if move_vec.length_squared() > 0.001:
		var move_dir = move_vec.normalized()
		var move_angle = move_dir.angle()
		_handle_smooth_turning(move_angle, delta)

	# 4. Đồng bộ bước chân (Step Sync): Triệt tiêu trượt chân
	_sync_step_animation()

## Xử lý xoay ôm cua mượt và lật sprite 2.5D
func _handle_smooth_turning(move_angle: float, delta: float) -> void:
	if not visual_root:
		return

	# LẬT SPRITE HỢP LÝ (Sprite Direction):
	# Dùng cos(move_angle) để xác định hướng trái / phải
	# Có vùng đệm deadband 0.08 chống giật khi di chuyển lên / xuống thẳng đứng
	var cos_val = cos(move_angle)
	if cos_val > 0.08:
		# Hướng Phải
		if sprite:
			sprite.flip_h = false
		else:
			visual_root.scale.x = abs(visual_root.scale.x)
	elif cos_val < -0.08:
		# Hướng Trái
		if sprite:
			sprite.flip_h = true
		else:
			visual_root.scale.x = -abs(visual_root.scale.x)

	# ÔM CUA MƯỢT (Smooth Path Turning):
	# Nghiêng nhẹ sprite theo độ dốc tiếp tuyến bằng lerp_angle(), không xoay lộn ngược bụng
	var sin_val = sin(move_angle)
	var target_tilt = clampf(sin_val * deg_to_rad(max_tilt_deg), -deg_to_rad(max_tilt_deg), deg_to_rad(max_tilt_deg))
	_current_tilt = lerp_angle(_current_tilt, target_tilt, delta * turn_speed)
	visual_root.rotation = _current_tilt

## Đồng bộ tốc độ phát animation của Mech theo vận tốc di chuyển thực tế
func _sync_step_animation() -> void:
	if anim_player and anim_player.has_animation("walk"):
		if current_speed <= 0.01:
			anim_player.speed_scale = 0.0 # Dừng bước chân khi bị stun / đóng băng
		else:
			# Công thức triệt tiêu hoàn toàn trượt chân: speed_scale = current_speed / base_walk_speed
			anim_player.speed_scale = current_speed / base_walk_speed

## Nhận sát thương từ tháp
func take_damage(amount: float) -> void:
	if is_dead:
		return
	current_hp = maxf(0.0, current_hp - amount)
	emit_signal("health_changed", current_hp, max_hp)
	if current_hp <= 0.0:
		die()

func die() -> void:
	if is_dead:
		return
	is_dead = true
	emit_signal("died", self, gold_reward)
	if anim_player and anim_player.has_animation("death"):
		anim_player.play("death")
		await anim_player.animation_finished
	queue_free()

func _on_reach_goal() -> void:
	emit_signal("reached_goal", self)
	queue_free()
