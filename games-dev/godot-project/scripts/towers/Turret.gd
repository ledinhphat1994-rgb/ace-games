class_name Turret
extends Node2D

## Turret: Bộ điều khiển Trụ súng phòng thủ chuẩn cơ khí (Turret Controller)
## Tính năng:
## 1. Cơ chế khóa mục tiêu (Target Locking): Ưu tiên quái có progress_ratio cao nhất trên đường đua.
##    Khi đã khóa mục tiêu, bám sát duy nhất mục tiêu đó cho đến khi chết hoặc thoát tầm. Tuyệt đối không quét đổi quái liên tục mỗi frame.
## 2. Xoay mượt mà (Smooth Rotation): Dùng lerp_angle() với tốc độ 5.0 - 8.0 rad/s tạo gia tốc và quán tính quay cơ khí thực tế.
## 3. Tách khớp nòng: Node Base đứng tĩnh 100%, chỉ xoay riêng node GunHead. Chỉ cho phép khai hỏa khi góc lệch < 5 độ.

signal fired(target: Node2D)
signal target_locked(target: Node2D)
signal target_lost()

@export_group("Combat Stats")
@export var attack_range: float = 240.0:
	set(val):
		attack_range = val
		_update_range_shape()
@export var attack_cooldown: float = 0.5 ## Thời gian giữa 2 phát bắn (giây)
@export var damage: float = 25.0

@export_group("Mechanical Rotation")
@export var rotation_speed: float = 6.5 ## Tốc độ quay cơ khí (5.0 - 8.0 rad/s)
@export var max_aim_error_deg: float = 5.0 ## Ngưỡng lệch góc tối đa để nhả đạn (độ)
@export var idle_patrol: bool = true ## Quét tuần tra nhẹ khi rảnh rỗi

# Node References
@onready var base_node: Node2D = get_node_or_null("Base") as Node2D
@onready var gun_head: Node2D = get_node_or_null("GunHead") as Node2D
@onready var muzzle: Marker2D = get_node_or_null("GunHead/Muzzle") as Marker2D
@onready var range_area: Area2D = get_node_or_null("RangeArea2D") as Area2D
@onready var range_shape: CollisionShape2D = get_node_or_null("RangeArea2D/CollisionShape2D") as CollisionShape2D

# Runtime State
var current_target: Node2D = null
var targets_in_range: Array[Node2D] = []
var _cooldown_timer: float = 0.0
var _target_angle: float = 0.0
var _idle_timer: float = 0.0
var _recoil_offset: float = 0.0

func _ready() -> void:
	add_to_group("turrets")
	_ensure_components()
	_update_range_shape()

func _ensure_components() -> void:
	# Tự động tạo RangeArea2D nếu scene chưa gán sẵn
	if not range_area:
		range_area = Area2D.new()
		range_area.name = "RangeArea2D"
		range_area.collision_layer = 0
		range_area.collision_mask = 2 # Lớp kẻ địch
		add_child(range_area)

		range_shape = CollisionShape2D.new()
		range_shape.name = "CollisionShape2D"
		var circle = CircleShape2D.new()
		circle.radius = attack_range
		range_shape.shape = circle
		range_area.add_child(range_shape)

	if range_area:
		if not range_area.body_entered.is_connected(_on_target_entered):
			range_area.body_entered.connect(_on_target_entered)
		if not range_area.body_exited.is_connected(_on_target_exited):
			range_area.body_exited.connect(_on_target_exited)
		if not range_area.area_entered.is_connected(_on_target_entered):
			range_area.area_entered.connect(_on_target_entered)
		if not range_area.area_exited.is_connected(_on_target_exited):
			range_area.area_exited.connect(_on_target_exited)

	# Tự động tạo GunHead nếu chưa có
	if not gun_head:
		gun_head = Node2D.new()
		gun_head.name = "GunHead"
		add_child(gun_head)

func _update_range_shape() -> void:
	if range_shape and range_shape.shape is CircleShape2D:
		range_shape.shape.radius = attack_range

func _physics_process(delta: float) -> void:
	# 1. Hồi chiêu nạp đạn
	if _cooldown_timer > 0.0:
		_cooldown_timer -= delta

	# 2. Hồi nòng súng sau khi giật bắn
	if _recoil_offset > 0.0 and muzzle:
		_recoil_offset = maxf(0.0, _recoil_offset - delta * 45.0)
		muzzle.position.x = -_recoil_offset

	# 3. Quản lý khóa mục tiêu (Target Locking)
	_update_target_locking()

	# 4. Xoay nòng mượt mà và ngắm bắn
	_process_aiming_and_firing(delta)

	# 5. Đế tháp Base đứng yên 100%, không bị ảnh hưởng bởi góc xoay nòng
	if base_node:
		base_node.rotation = 0.0

## Cơ chế Khóa mục tiêu (Target Locking):
## Bám sát mục tiêu hiện tại cho đến khi chết hoặc ra khỏi vùng RangeArea2D.
## Tuyệt đối không quét đổi quái liên tục mỗi frame!
func _update_target_locking() -> void:
	# Dọn dẹp danh sách các quái đã bị hủy hoặc chết
	var valid_list: Array[Node2D] = []
	for candidate in targets_in_range:
		if _is_target_valid(candidate):
			valid_list.append(candidate)
	targets_in_range = valid_list

	# Kiểm tra mục tiêu đang khóa có còn tồn tại và nằm trong tầm bắn không
	if current_target != null:
		var still_in_range = _is_target_valid(current_target) and _is_within_range_distance(current_target)
		if not still_in_range:
			current_target = null
			emit_signal("target_lost")

	# CHỈ KHI chưa có mục tiêu (hoặc mục tiêu cũ vừa mất), mới khóa mục tiêu mới
	if current_target == null and not targets_in_range.is_empty():
		current_target = _select_highest_priority_target()
		if current_target != null:
			emit_signal("target_locked", current_target)

## Chọn mục tiêu ưu tiên cao nhất: Quái đi xa nhất trên đường ray (progress_ratio cao nhất)
func _select_highest_priority_target() -> Node2D:
	var best_target: Node2D = null
	var max_progress: float = -INF

	for candidate in targets_in_range:
		if not _is_target_valid(candidate):
			continue

		var candidate_progress = _get_target_progress(candidate)
		if candidate_progress > max_progress:
			max_progress = candidate_progress
			best_target = candidate

	return best_target

## Trích xuất tiến độ đường đua của mục tiêu
func _get_target_progress(target: Node2D) -> float:
	var prog_val = target.get("progress_ratio")
	if prog_val != null:
		return float(prog_val)
	var prog_px = target.get("progress")
	if prog_px != null:
		return float(prog_px)
	if target.has_meta("progress_ratio"):
		return float(target.get_meta("progress_ratio"))
	if target.has_method("get_progress_ratio"):
		return float(target.get_progress_ratio())
	# Fallback cho quái không có đường ray: ưu tiên quái đi xa nhất về đích hoặc gần tháp
	return -global_position.distance_to(target.global_position)

## Xoay nòng súng mượt mà và khai hỏa khi thỏa mãn góc lệch < 5 độ
func _process_aiming_and_firing(delta: float) -> void:
	if not gun_head:
		return

	if current_target != null:
		var target_pos = current_target.global_position
		if current_target.has_node("AimPoint"):
			target_pos = current_target.get_node("AimPoint").global_position

		var aim_vec = target_pos - gun_head.global_position
		_target_angle = aim_vec.angle()

		# Xoay mượt mà với gia tốc cơ học (5.0 - 8.0 rad/s)
		gun_head.rotation = lerp_angle(gun_head.rotation, _target_angle, delta * rotation_speed)

		# Tính góc lệch giữa nòng và mục tiêu
		var angle_error = abs(angle_difference(gun_head.rotation, _target_angle))
		var max_allowed_rad = deg_to_rad(max_aim_error_deg)

		# CHỈ BẮN KHI GÓC LỆCH < 5 ĐỘ VÀ ĐÃ HẾT COOLDOWN
		if angle_error <= max_allowed_rad and _cooldown_timer <= 0.0:
			_fire(current_target)
	else:
		# Khi rảnh rỗi: Quét tuần tra nhẹ nhàng
		if idle_patrol:
			_idle_timer += delta * 1.5
			var patrol_angle = sin(_idle_timer) * deg_to_rad(30.0)
			gun_head.rotation = lerp_angle(gun_head.rotation, patrol_angle, delta * (rotation_speed * 0.35))

func _fire(target: Node2D) -> void:
	_cooldown_timer = attack_cooldown
	_recoil_offset = 5.0 # Hiệu ứng nòng giật lùi 5px

	if target.has_method("take_damage"):
		target.take_damage(damage)

	emit_signal("fired", target)

func _is_target_valid(target: Node2D) -> bool:
	if not is_instance_valid(target) or target.is_queued_for_deletion():
		return false
	if "is_dead" in target and target.is_dead:
		return false
	if target.get("_is_dead") == true:
		return false
	return true

func _is_within_range_distance(target: Node2D) -> bool:
	return global_position.distance_to(target.global_position) <= attack_range + 20.0

func _on_target_entered(target: Node2D) -> void:
	# Lấy Node đại diện nếu target là Area2D (Hurtbox)
	var enemy_node = target
	if target is Area2D and target.get_parent() is Node2D:
		enemy_node = target.get_parent()

	if not targets_in_range.has(enemy_node):
		targets_in_range.append(enemy_node)

func _on_target_exited(target: Node2D) -> void:
	var enemy_node = target
	if target is Area2D and target.get_parent() is Node2D:
		enemy_node = target.get_parent()

	targets_in_range.erase(enemy_node)
	if current_target == enemy_node:
		current_target = null
		emit_signal("target_lost")
