class_name BaseTower
extends Node2D

## BaseTower: Lớp cơ sở cho các Tháp phòng thủ (Tower Defense)
## Quét tầm bắn qua Area2D, xoay nòng tháp mượt mà bằng lerp_angle và tự động khai hỏa theo cooldown.
## Đồ họa hoàn toàn bằng Procedural Vector (Polygon2D / Line2D) phong cách Sci-Fi Neon.

signal fired(target: Node2D)

const SoundSynthClass = preload("../audio/SoundSynthesizer.gd")

@export_group("Combat Stats")
@export var attack_range: float = 240.0
@export var attack_cooldown: float = 1.0
@export var base_damage: float = 20.0

@export_group("Upgrade Stats")
@export var level: int = 1
@export var max_level: int = 3
@export var base_cost: int = 60
var total_invested: int = 60
var is_selected: bool = false

@export_group("Visuals")
@export var theme_color: Color = Color(0.1, 0.85, 1.0, 1.0)
@export var glow_color: Color = Color(0.6, 0.95, 1.0, 0.8)
@export var base_radius: float = 38.0

var targets_in_range: Array[Node2D] = []
var current_target: Node2D = null
var turret_rotation: float = 0.0
var _cooldown_timer: float = 0.0
var _muzzle_flash: float = 0.0
var _idle_pulse: float = 0.0
var paralyze_timer: float = 0.0

@onready var range_area: Area2D = get_node_or_null("RangeArea") as Area2D
@onready var range_shape: CollisionShape2D = get_node_or_null("RangeArea/CollisionShape2D") as CollisionShape2D
var sound_synth: Node = null

func _ready() -> void:
	# Gắn vào nhóm towers để Boss dễ tìm
	add_to_group("towers")

	# Tạo hoặc liên kết SoundSynthesizer
	sound_synth = SoundSynthesizer.get_shared(self)

	# Thiết lập Area2D quét tầm bắn
	if range_area:
		range_area.collision_layer = 0
		range_area.collision_mask = 2 # Lớp kẻ địch (Enemy / CharacterBody2D)
		range_area.body_entered.connect(_on_body_entered)
		range_area.body_exited.connect(_on_body_exited)

	if range_shape and range_shape.shape is CircleShape2D:
		range_shape.shape.radius = attack_range

	queue_redraw()

## Bị Boss làm tê liệt trong X giây (không xoay nòng, không bắn)
func apply_paralyze(duration: float) -> void:
	paralyze_timer = maxf(paralyze_timer, duration)
	queue_redraw()

func _physics_process(delta: float) -> void:
	_idle_pulse += delta * 3.0
	if _idle_pulse > TAU:
		_idle_pulse -= TAU

	if _muzzle_flash > 0.0:
		_muzzle_flash = maxf(0.0, _muzzle_flash - delta * 6.0)

	# Nếu đang bị Boss làm tê liệt: dừng mọi hoạt động xoay và bắn
	if paralyze_timer > 0.0:
		paralyze_timer -= delta
		queue_redraw()
		return

	if _cooldown_timer > 0.0:
		_cooldown_timer -= delta

	# 1. Làm sạch danh sách mục tiêu và chọn mục tiêu ưu tiên
	_update_target_selection()

	# 2. Xoay nòng súng về phía mục tiêu
	if current_target and is_instance_valid(current_target):
		var aim_dir = (current_target.global_position - global_position).normalized()
		var target_angle = aim_dir.angle()
		turret_rotation = lerp_angle(turret_rotation, target_angle, delta * 12.0)

		# 3. Khai hỏa khi đã sẵn sàng
		if _cooldown_timer <= 0.0:
			_cooldown_timer = attack_cooldown
			_muzzle_flash = 1.0
			fire(current_target)
			emit_signal("fired", current_target)

	queue_redraw()

## Kiểm tra xem tháp có thể hoạt động/tấn công được không (không bị tê liệt)
func can_attack() -> bool:
	return paralyze_timer <= 0.0

## Lựa chọn mục tiêu: ưu tiên quái vật tiến xa nhất về bên phải (trục X lớn nhất)
func _update_target_selection() -> void:
	# Lọc bỏ các quái đã chết / giải phóng
	var valid_targets: Array[Node2D] = []
	for t in targets_in_range:
		if is_instance_valid(t) and not t.is_queued_for_deletion():
			# Kiểm tra lại khoảng cách thực tế
			if global_position.distance_to(t.global_position) <= attack_range + 10.0:
				valid_targets.append(t)
	targets_in_range = valid_targets

	if targets_in_range.is_empty():
		current_target = null
		return

	# Ưu tiên mục tiêu đang gần về đích nhất (X lớn nhất)
	var best_target: Node2D = targets_in_range[0]
	var max_x = best_target.global_position.x
	for i in range(1, targets_in_range.size()):
		var cand = targets_in_range[i]
		if cand.global_position.x > max_x:
			max_x = cand.global_position.x
			best_target = cand

	current_target = best_target

## Hàm ảo: Các lớp tháp con ghi đè cơ chế vũ khí riêng biệt
func fire(_target: Node2D) -> void:
	pass

func _on_body_entered(body: Node2D) -> void:
	if not targets_in_range.has(body):
		targets_in_range.append(body)

func _on_body_exited(body: Node2D) -> void:
	targets_in_range.erase(body)

## Lấy chi phí nâng cấp lên cấp tiếp theo
func get_upgrade_cost() -> int:
	if level == 1:
		return int(base_cost * 0.70) # Cấp 2: Chi phí = 70% giá gốc
	elif level == 2:
		return int(base_cost * 1.20) # Cấp 3: Chi phí = 120% giá gốc
	return 0

## Lấy giá trị hoàn lại khi bán trụ (70% tổng tiền đã đầu tư)
func get_sell_value() -> int:
	return int(total_invested * 0.70)

func can_upgrade() -> bool:
	return level < max_level

## Thăng cấp trụ
func upgrade() -> bool:
	if not can_upgrade():
		return false
	var cost = get_upgrade_cost()
	total_invested += cost
	level += 1

	if level == 2:
		base_damage *= 1.35   # +35% sát thương
		attack_range *= 1.15   # +15% tầm bắn
		attack_cooldown *= 0.85 # Tăng tốc độ bắn
	elif level == 3:
		base_damage *= 1.30
		attack_range *= 1.10
		attack_cooldown *= 0.90
		apply_level_3_special()

	# Cập nhật Area2D quét tầm bắn
	if range_shape and range_shape.shape is CircleShape2D:
		range_shape.shape.radius = attack_range

	if sound_synth:
		sound_synth.play_upgrade()

	queue_redraw()
	return true

## Hàm ảo: Kích hoạt hiệu ứng đặc thù cấp 3 ở từng chủng loại
func apply_level_3_special() -> void:
	pass

func _draw() -> void:
	# 1. Vẽ vòng tròn bán trong suốt thể hiện tầm bắn (Attack Range)
	var range_alpha = 0.14 if is_selected else (0.04 + sin(_idle_pulse) * 0.015)
	var stroke_alpha = 0.70 if is_selected else 0.22
	var range_color = Color(theme_color.r, theme_color.g, theme_color.b, range_alpha)
	draw_circle(Vector2.ZERO, attack_range, range_color)
	draw_arc(Vector2.ZERO, attack_range, 0.0, TAU, 64, Color(theme_color.r, theme_color.g, theme_color.b, stroke_alpha), 2.0 if is_selected else 1.2)

	# 2. Vẽ bệ tháp Neon (Base Pedestal) cỡ lớn
	# Vòng ngoài hình bát giác kiên cố
	var oct_points: PackedVector2Array = []
	for i in range(8):
		var angle = (float(i) / 8.0) * TAU
		oct_points.append(Vector2(cos(angle), sin(angle)) * base_radius)
	draw_colored_polygon(oct_points, Color(0.02, 0.05, 0.14, 0.96))

	var loop_oct = oct_points.duplicate()
	loop_oct.append(oct_points[0])
	var border_w = 3.2 if level >= 2 else 2.4
	draw_polyline(loop_oct, theme_color, border_w, true)

	# Các rãnh mạch vi điện tử tản nhiệt (Circuit Traces) nối từ góc vào tâm
	for i in range(4):
		var angle = (float(i) / 4.0) * TAU + (PI / 8.0)
		var p_outer = Vector2(cos(angle), sin(angle)) * (base_radius * 0.88)
		var p_inner = Vector2(cos(angle), sin(angle)) * (base_radius * 0.45)
		draw_line(p_outer, p_inner, Color(theme_color.r, theme_color.g, theme_color.b, 0.65), 1.8)

	# Lõi năng lượng trung tâm của bệ
	var core_rad = base_radius * 0.42 + sin(_idle_pulse * 2.0) * 2.0
	draw_circle(Vector2.ZERO, core_rad, Color(theme_color.r, theme_color.g, theme_color.b, 0.50))
	draw_circle(Vector2.ZERO, core_rad * 0.60, Color.WHITE)

	# Đèn LED chỉ báo Cấp độ tháp (Level Indicators: 1, 2, 3 chấm sáng)
	var led_offset_y = base_radius * 0.72
	for k in range(level):
		var led_x = (float(k) - float(level - 1) * 0.5) * 10.0
		var led_pos = Vector2(led_x, led_offset_y)
		draw_circle(led_pos, 3.2, Color(1.0, 0.88, 0.2, 0.95))
		draw_circle(led_pos, 1.8, Color.WHITE)

	# 3. ĐỒ HỌA TỰ SINH NÂNG CẤP THÁP:
	# Cấp 2: Thêm vòng năng lượng xoay quanh đỉnh/bệ tháp
	if level >= 2:
		var ring1_r = base_radius * 1.30
		var ring1_col = Color(glow_color.r, glow_color.g, glow_color.b, 0.80)
		draw_arc(Vector2.ZERO, ring1_r, 0, TAU, 36, ring1_col, 2.0)
		# 3 hạt năng lượng quay quanh
		for k in range(3):
			var a = _idle_pulse * 3.5 + (float(k) / 3.0) * TAU
			var pt = Vector2(cos(a), sin(a)) * ring1_r
			draw_circle(pt, 4.2, glow_color)
			draw_circle(pt, 2.2, Color.WHITE)

	# Cấp 3: Thêm vòng năng lượng thứ 2 xoay ngược chiều + 4 điểm tinh thể cực phẩm
	if level >= 3:
		var ring2_r = base_radius * 1.55
		var ring2_col = Color(theme_color.r, theme_color.g, theme_color.b, 0.90)
		draw_arc(Vector2.ZERO, ring2_r, 0, TAU, 48, ring2_col, 2.5)
		for k in range(4):
			var a = -_idle_pulse * 2.8 + (float(k) / 4.0) * TAU
			var pt = Vector2(cos(a), sin(a)) * ring2_r
			draw_circle(pt, 5.0, glow_color)
			draw_circle(pt, 2.8, Color.WHITE)

	# 4. Hiệu ứng viền nhấp nháy khi tháp được CHỌN
	if is_selected:
		var sel_r = base_radius + 8.0
		var sel_col = Color(1.0, 0.85, 0.2, 0.88 + sin(_idle_pulse * 4.0) * 0.12)
		draw_arc(Vector2.ZERO, sel_r, 0, TAU, 40, sel_col, 3.2)
		draw_arc(Vector2.ZERO, sel_r + 4.0, 0, TAU, 32, Color(1.0, 0.85, 0.2, 0.35), 1.5)

	# 5. Hiệu ứng tia điện đỏ khi tháp bị Boss làm TÊ LIỆT
	if paralyze_timer > 0.0:
		var zap_col = Color(1.0, 0.2, 0.25, 0.92)
		draw_arc(Vector2.ZERO, base_radius + 6.0, 0, TAU, 28, zap_col, 2.8)
		for i in range(4):
			var a = (float(i) / 4.0) * TAU + _idle_pulse * 5.0
			var p1 = Vector2(cos(a), sin(a)) * 18.0
			var p2 = Vector2(cos(a + 0.5), sin(a + 0.5)) * 40.0
			draw_line(p1, p2, zap_col, 2.5)
		draw_line(Vector2(-14, -14), Vector2(14, 14), Color(1.0, 0.2, 0.2, 0.95), 3.0)
		draw_line(Vector2(-14, 14), Vector2(14, -14), Color(1.0, 0.2, 0.2, 0.95), 3.0)

	# 6. Vẽ nòng tháp xoay theo turret_rotation
	_draw_turret_head()

## Các lớp con có thể tùy biến ngoại hình nòng tháp
func _draw_turret_head() -> void:
	draw_set_transform(Vector2.ZERO, turret_rotation, Vector2.ONE)

	# Nòng súng / Đèn tập trung năng lượng cỡ lớn
	var barrel_len = base_radius * 1.15
	var barrel_rect = Rect2(Vector2(0, -6.0), Vector2(barrel_len, 12.0))
	draw_rect(barrel_rect, Color(0.08, 0.18, 0.32, 0.95), true)
	draw_rect(barrel_rect, theme_color, false, 2.0)

	# Điểm sáng đầu nòng khi bắn (Muzzle Flash)
	if _muzzle_flash > 0.0:
		var flash_pos = Vector2(barrel_len + 8.0, 0)
		draw_circle(flash_pos, 16.0 * _muzzle_flash, glow_color)
		draw_circle(flash_pos, 8.0 * _muzzle_flash, Color.WHITE)

	# Đầu tháp tròn trung tâm
	draw_circle(Vector2.ZERO, base_radius * 0.58, Color(0.04, 0.10, 0.22, 1.0))
	draw_circle(Vector2.ZERO, base_radius * 0.58, theme_color, false, 2.5)
	draw_circle(Vector2.ZERO, base_radius * 0.30, Color.WHITE)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
