class_name Enemy
extends CharacterBody2D

## Enemy: Quái vật Sci-Fi Neon trong Tower Defense Phản Trọng Lực
## Kế thừa CharacterBody2D, tự động di chuyển theo quỹ đạo và chịu lực từ GravityZone.
## Đa dạng 3 chủng loại: Normal (Cân bằng), Scout (Nhanh, nhẹ), Tank (Trâu bò, kháng knockback).

signal died(enemy: Node2D, reward: int)
signal escaped(enemy: Node2D)
signal deflected(enemy: Node2D)
signal absorbed(enemy: Node2D)
signal boss_hp_changed(current_hp: float, max_hp: float)
signal boss_defeated(boss: Node2D)

enum State {
	NORMAL,     ## Di chuyển ổn định từ trái sang phải
	IN_ZONE,    ## Đang trong vùng GravityZone, chịu gia tốc bẻ cong
	DEFLECTED,  ## Vừa bị hất văng hoặc bẻ cong quỹ đạo
	ABSORBED    ## Đang bị nghiền nát / hút vào tâm Hố đen
}

enum Type {
	NORMAL,     ## Quái thường (100 HP, tốc độ chuẩn, 15 Vàng)
	SCOUT,      ## Quái trinh sát (35 HP, tốc độ x1.75, 10 Vàng)
	TANK,       ## Quái thiết giáp (260 HP, tốc độ x0.6, kháng 50% Knockback, 35 Vàng)
	BOSS_TITAN  ## Chiến hạm Titan (1500 HP, Đồ họa cực đại, Kháng Stun EMP, Kỹ năng Phá Sóng, 150 Vàng)
}

@export_group("Archetype & Stats")
@export var enemy_type: Type = Type.NORMAL
@export var max_hp: float = 100.0
@export var current_hp: float = 100.0
@export var base_speed: float = 220.0
@export var base_direction: Vector2 = Vector2.RIGHT
@export var gold_reward: int = 15
@export var knockback_resist: float = 0.0

@export_group("Visuals")
@export var enemy_color: Color = Color(1.0, 0.32, 0.12, 1.0) ## Neon Cam-Đỏ rực lửa
@export var edge_color: Color = Color(1.0, 0.75, 0.25, 0.95)  ## Viền vàng Neon phát sáng
@export var core_color: Color = Color(1.0, 1.0, 1.0, 0.95)   ## Lõi pha lê trắng sáng
@export var max_trail_points: int = 28

var current_state: State = State.NORMAL
var trail_points: Array[Vector2] = []
var _engine_pulse: float = 0.0
var _hit_flash: float = 0.0
var _absorb_target: Vector2 = Vector2.ZERO
var _last_haptic_time: float = 0.0
var _slow_factor: float = 1.0
var _slow_timer: float = 0.0
var stun_timer: float = 0.0
var force_attract_timer: float = 0.0
var force_attract_target: Vector2 = Vector2.ZERO

# Cơ chế đặc thù Chiến Hạm Titan (Boss)
var _escort_angle: float = 0.0
var boss_ability_cooldown: float = 6.0
var _ability_timer: float = 3.0
var _shockwave_anim: float = 0.0

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

# Tọa độ các hình dạng đa giác theo từng chủng loại
const POLY_NORMAL: PackedVector2Array = [
	Vector2(22.0, 0.0),
	Vector2(-10.0, -14.0),
	Vector2(-5.0, -5.0),
	Vector2(-14.0, 0.0),
	Vector2(-5.0, 5.0),
	Vector2(-10.0, 14.0)
]

const POLY_SCOUT: PackedVector2Array = [
	Vector2(19.0, 0.0),
	Vector2(-12.0, -9.0),
	Vector2(-5.0, 0.0),
	Vector2(-12.0, 9.0)
]

const POLY_TANK: PackedVector2Array = [
	Vector2(18.0, 0.0),
	Vector2(10.0, -15.0),
	Vector2(-10.0, -15.0),
	Vector2(-18.0, 0.0),
	Vector2(-10.0, 15.0),
	Vector2(10.0, 15.0)
]

# Đa giác Chiến hạm Titan: Kích thước gấp 3 lần quái thường (dài ~100px, rộng ~84px)
const POLY_BOSS: PackedVector2Array = [
	Vector2(52.0, 0.0),
	Vector2(26.0, -20.0),
	Vector2(6.0, -42.0),
	Vector2(-32.0, -40.0),
	Vector2(-22.0, -16.0),
	Vector2(-46.0, -12.0),
	Vector2(-36.0, 0.0),
	Vector2(-46.0, 12.0),
	Vector2(-22.0, 16.0),
	Vector2(-32.0, 40.0),
	Vector2(6.0, 42.0),
	Vector2(26.0, 20.0)
]

# Đa giác thoi năng lượng hộ tống xoay quanh Boss
const POLY_ESCORT_DRONE: PackedVector2Array = [
	Vector2(11.0, 0.0),
	Vector2(0.0, -6.5),
	Vector2(-11.0, 0.0),
	Vector2(0.0, 6.5)
]

func _ready() -> void:
	setup_archetype(enemy_type)
	velocity = base_direction.normalized() * base_speed
	rotation = velocity.angle()
	queue_redraw()

## Cấu hình thuộc tính theo chủng loại
func setup_archetype(type: Type) -> void:
	enemy_type = type
	match enemy_type:
		Type.NORMAL:
			max_hp = 100.0
			base_speed = 220.0
			gold_reward = 15
			knockback_resist = 0.0
			enemy_color = Color(1.0, 0.35, 0.12, 1.0) # Cam-Đỏ Neon
			edge_color = Color(1.0, 0.8, 0.25, 0.95)
		Type.SCOUT:
			max_hp = 35.0
			base_speed = 385.0
			gold_reward = 10
			knockback_resist = 0.0
			enemy_color = Color(0.15, 0.95, 0.45, 1.0) # Xanh Lục Neon
			edge_color = Color(0.65, 1.0, 0.75, 0.95)
		Type.TANK:
			max_hp = 260.0
			base_speed = 125.0
			gold_reward = 35
			knockback_resist = 0.50 # Kháng 50% lực giật
			enemy_color = Color(0.92, 0.12, 0.25, 1.0) # Đỏ Huyết Neon
			edge_color = Color(1.0, 0.45, 0.5, 0.95)
		Type.BOSS_TITAN:
			max_hp = 1500.0
			base_speed = 95.0
			gold_reward = 150
			knockback_resist = 0.85 # Đầm chắc, kháng 85% Knockback
			enemy_color = Color(1.0, 0.12, 0.28, 1.0) # Đỏ Neon Rực Lửa
			edge_color = Color(1.0, 0.55, 0.65, 0.95)
			core_color = Color(1.0, 0.95, 0.95, 1.0)

	current_hp = max_hp
	if enemy_type == Type.BOSS_TITAN:
		emit_signal("boss_hp_changed", current_hp, max_hp)

func _physics_process(delta: float) -> void:
	_engine_pulse += delta * 12.0
	if _engine_pulse > TAU:
		_engine_pulse -= TAU

	if _hit_flash > 0.0:
		_hit_flash = maxf(0.0, _hit_flash - delta * 5.0)

	if _slow_timer > 0.0:
		_slow_timer -= delta
		if _slow_timer <= 0.0:
			_slow_factor = 1.0

	# Cập nhật đặc thù Chiến Hạm Titan (Boss)
	if enemy_type == Type.BOSS_TITAN:
		_escort_angle += delta * 2.8
		if _escort_angle > TAU:
			_escort_angle -= TAU

		_ability_timer -= delta
		if _ability_timer <= 0.0:
			_trigger_boss_ability_wavebreaker()
			_ability_timer = boss_ability_cooldown

	if _shockwave_anim > 0.0:
		_shockwave_anim = maxf(0.0, _shockwave_anim - delta * 2.0)

	# 1. Hiệu ứng Choáng (EMP Stun): Đóng băng vận tốc trong 2.5s (Boss kháng hoàn toàn)
	if stun_timer > 0.0:
		stun_timer -= delta
		velocity = Vector2.ZERO
		move_and_slide()
		queue_redraw()
		_check_screen_bounds()
		return

	# 2. Hiệu ứng Quá tải Hố Đen (Force Attract): Kéo cưỡng chế về tâm hố đen
	if force_attract_timer > 0.0:
		force_attract_timer -= delta
		var pull_dir = (force_attract_target - global_position).normalized()
		velocity = velocity.move_toward(pull_dir * 460.0, delta * 1600.0)
		if velocity.length_squared() > 10.0:
			rotation = lerp_angle(rotation, velocity.angle(), delta * 12.0)
		move_and_slide()
		trail_points.push_front(global_position)
		if trail_points.size() > max_trail_points:
			trail_points.pop_back()
		queue_redraw()
		_check_screen_bounds()
		return

	match current_state:
		State.ABSORBED:
			_process_absorbed(delta)
			return

		State.NORMAL:
			# Di chuyển ổn định sang phải, từ từ giữ hướng bay thẳng
			var eff_speed = base_speed * _slow_factor
			var target_vel = base_direction.normalized() * eff_speed
			velocity = velocity.move_toward(target_vel, delta * 120.0)

		State.IN_ZONE, State.DEFLECTED:
			# Đang chịu ảnh hưởng của trường lực, hướng xoay thân lượn mượt theo vận tốc
			if velocity.length_squared() > 10.0:
				var target_rot = velocity.angle()
				rotation = lerp_angle(rotation, target_rot, delta * 10.0)

	# Di chuyển theo vật lý chuẩn Godot 4
	move_and_slide()

	# Cập nhật vệt quỹ đạo phát sáng (Trail)
	trail_points.push_front(global_position)
	if trail_points.size() > max_trail_points:
		trail_points.pop_back()

	queue_redraw()

	# Kiểm tra giới hạn màn hình để tự hủy giải phóng tài nguyên
	_check_screen_bounds()

## Kỹ năng chủ động "Phá Sóng" của Boss: Vô hiệu hóa 1 tháp trong 3 giây
func _trigger_boss_ability_wavebreaker() -> void:
	var towers = get_tree().get_nodes_in_group("towers")
	var valid_towers: Array = []
	for t in towers:
		if is_instance_valid(t) and t.has_method("apply_paralyze"):
			if t.paralyze_timer <= 0.0:
				valid_towers.append(t)

	if valid_towers.is_empty():
		return

	# Chọn ngẫu nhiên 1 tháp đang hoạt động
	var target_tower = valid_towers[randi() % valid_towers.size()]
	target_tower.apply_paralyze(3.0)

	_shockwave_anim = 1.0
	queue_redraw()

	if web_bridge:
		web_bridge.trigger_haptic("heavy")
		web_bridge.show_toast("⚠️ TITAN PHÁ SÓNG! VÔ HIỆU HÓA 1 THÁP TRONG 3S!", "warning")

## Xử lý khi bị Hố đen nuốt chửng vào tâm
func _process_absorbed(delta: float) -> void:
	global_position = global_position.lerp(_absorb_target, delta * 14.0)
	scale = scale.lerp(Vector2.ZERO, delta * 10.0)
	rotation += delta * 20.0
	queue_redraw()

	if scale.x < 0.06:
		emit_signal("absorbed", self)
		emit_signal("died", self, gold_reward)
		if enemy_type == Type.BOSS_TITAN:
			emit_signal("boss_defeated", self)
		if web_bridge:
			web_bridge.trigger_haptic("heavy")
		queue_free()

## Nhận lực gia tốc từ GravityZone
func apply_custom_force(accel: Vector2, delta: float) -> void:
	if current_state == State.ABSORBED:
		return

	if current_state != State.IN_ZONE:
		current_state = State.IN_ZONE

	# Quái trinh sát bị bẻ cong mạnh hơn (x1.25), quái tank đầm chắc hơn (x0.8), Boss cực đầm chắc (x0.35)
	var mass_factor: float = 1.0
	if enemy_type == Type.SCOUT:
		mass_factor = 1.25
	elif enemy_type == Type.TANK:
		mass_factor = 0.80
	elif enemy_type == Type.BOSS_TITAN:
		mass_factor = 0.35

	velocity += accel * (delta * mass_factor)

	# Kiểm tra nếu bị hất văng với gia tốc mạnh
	if accel.length() > 650.0 and (Time.get_ticks_msec() / 1000.0) - _last_haptic_time > 0.35:
		_last_haptic_time = Time.get_ticks_msec() / 1000.0
		emit_signal("deflected", self)
		if web_bridge:
			web_bridge.trigger_haptic("light")

## Bị Hố đen hút thẳng vào điểm kỳ dị (Singularity)
func absorb_into_singularity(singularity_pos: Vector2) -> void:
	if current_state == State.ABSORBED:
		return
	current_state = State.ABSORBED
	_absorb_target = singularity_pos
	set_collision_layer_value(2, false)
	if web_bridge:
		web_bridge.trigger_haptic("medium")

## Nhận lực giật lùi từ vũ khí xung kích (Railgun Knockback)
func apply_knockback(force: Vector2) -> void:
	if current_state == State.ABSORBED:
		return
	var eff_force = force * (1.0 - knockback_resist)
	velocity += eff_force
	_hit_flash = 1.0
	queue_redraw()

## Nhận hiệu ứng làm chậm (Slow debuff từ Tháp Hư Không)
func apply_slow(factor: float, duration: float) -> void:
	_slow_factor = minf(_slow_factor, factor)
	_slow_timer = maxf(_slow_timer, duration)

## Nhận hiệu ứng choáng EMP (Freeze vận tốc trong 2.5s)
## Boss Titan kháng hoàn toàn EMP (chỉ giảm 40% tốc độ, không bị stun 0 vận tốc)
func apply_stun(duration: float) -> void:
	if current_state == State.ABSORBED:
		return
	if enemy_type == Type.BOSS_TITAN:
		apply_slow(0.6, duration)
		return
	stun_timer = maxf(stun_timer, duration)
	velocity = Vector2.ZERO
	queue_redraw()

## Cưỡng chế kéo về tâm GravityZone (Quá tải Hố Đen)
func apply_force_attract(target_pos: Vector2, duration: float) -> void:
	if current_state == State.ABSORBED:
		return
	force_attract_timer = maxf(force_attract_timer, duration)
	force_attract_target = target_pos
	current_state = State.IN_ZONE
	queue_redraw()

## Nhận sát thương
func take_damage(amount: float) -> void:
	current_hp = clampf(current_hp - amount, 0.0, max_hp)
	_hit_flash = 1.0
	queue_redraw()

	if enemy_type == Type.BOSS_TITAN:
		emit_signal("boss_hp_changed", current_hp, max_hp)

	if current_hp <= 0.0:
		emit_signal("died", self, gold_reward)
		if enemy_type == Type.BOSS_TITAN:
			emit_signal("boss_defeated", self)
		_spawn_death_particles()
		if web_bridge:
			web_bridge.trigger_haptic("medium")
		queue_free()

## Hiệu ứng hạt nổ tung khi quái bị tiêu diệt
func _spawn_death_particles() -> void:
	if not get_parent():
		return
	var p = CPUParticles2D.new()
	p.global_position = global_position
	p.emitting = true
	p.one_shot = true
	p.explosiveness = 0.95
	p.amount = 48 if enemy_type == Type.BOSS_TITAN else 24
	p.lifetime = 0.65 if enemy_type == Type.BOSS_TITAN else 0.45
	p.spread = 180.0
	p.initial_velocity_min = 120.0
	p.initial_velocity_max = 340.0
	p.scale_amount_min = 3.5 if enemy_type == Type.BOSS_TITAN else 2.5
	p.scale_amount_max = 7.5 if enemy_type == Type.BOSS_TITAN else 5.5
	p.color = enemy_color
	get_parent().add_child(p)
	get_tree().create_timer(0.75).timeout.connect(p.queue_free)

## Tự giải phóng khi ra khỏi giới hạn màn hình
func _check_screen_bounds() -> void:
	var pos = global_position
	# Khi vượt qua cạnh phải màn hình (X > 730): Coi như đã xâm nhập căn cứ
	if pos.x > 730.0:
		emit_signal("escaped", self)
		queue_free()
		return

	if pos.x < -120.0 or pos.y < -150.0 or pos.y > 1400.0:
		queue_free()

func _draw() -> void:
	# 1. Vẽ vệt đuôi phát sáng (Curved Trail)
	if trail_points.size() >= 2 and current_state != State.ABSORBED:
		var trail_count = trail_points.size()
		for i in range(trail_count - 1):
			var p1 = to_local(trail_points[i])
			var p2 = to_local(trail_points[i + 1])
			var prog = float(i) / float(trail_count)
			var alpha = (1.0 - prog) * 0.7
			var line_w = (1.0 - prog) * (9.0 if enemy_type == Type.BOSS_TITAN else 5.0) + 1.2
			var t_col = Color(enemy_color.r, enemy_color.g * 0.8, enemy_color.b, alpha)
			draw_line(p1, p2, t_col, line_w)

	# 2. Vẽ ngọn lửa phản lực phía sau động cơ
	if current_state != State.ABSORBED:
		if enemy_type == Type.BOSS_TITAN:
			# 2 ngọn lửa phản lực kép ở 2 bên động cơ
			var thrust_len = 16.0 + sin(_engine_pulse) * 6.0
			var thrust_top = PackedVector2Array([
				Vector2(-24.0, -18.0),
				Vector2(-24.0 - thrust_len, -18.0),
				Vector2(-24.0, -12.0)
			])
			var thrust_bot = PackedVector2Array([
				Vector2(-24.0, 12.0),
				Vector2(-24.0 - thrust_len, 18.0),
				Vector2(-24.0, 18.0)
			])
			draw_colored_polygon(thrust_top, Color(1.0, 0.45, 0.15, 0.95))
			draw_colored_polygon(thrust_bot, Color(1.0, 0.45, 0.15, 0.95))
		else:
			var thrust_len = 8.0 + sin(_engine_pulse) * 4.0
			var thrust_poly = PackedVector2Array([
				Vector2(-13.0, -3.0),
				Vector2(-13.0 - thrust_len, 0.0),
				Vector2(-13.0, 3.0)
			])
			draw_colored_polygon(thrust_poly, Color(1.0, 0.8, 0.2, 0.9))

	# 3. Vẽ thân quái vật theo từng chủng loại
	var active_poly = POLY_NORMAL
	match enemy_type:
		Type.SCOUT:
			active_poly = POLY_SCOUT
		Type.TANK:
			active_poly = POLY_TANK
		Type.BOSS_TITAN:
			active_poly = POLY_BOSS

	var body_col = enemy_color
	if _hit_flash > 0.0:
		body_col = body_col.lerp(Color.WHITE, _hit_flash)
	draw_colored_polygon(active_poly, body_col)

	# Viền sáng ngoài
	var loop_poly = active_poly.duplicate()
	loop_poly.append(active_poly[0])
	draw_polyline(loop_poly, edge_color, 2.5 if enemy_type == Type.BOSS_TITAN else 2.0, true)

	# 4. Lõi tinh thể trung tâm
	draw_circle(Vector2.ZERO, 6.0 if enemy_type == Type.BOSS_TITAN else 3.5, core_color)

	# 5. Vẽ 2 thoi năng lượng hộ tống xoay quanh nếu là BOSS_TITAN
	if enemy_type == Type.BOSS_TITAN and current_state != State.ABSORBED:
		var orbit_r: float = 64.0
		var escort_col = Color(1.0, 0.45, 0.2, 0.95)
		var drone_pos_1 = Vector2(cos(_escort_angle), sin(_escort_angle)) * orbit_r
		var drone_pos_2 = Vector2(cos(_escort_angle + PI), sin(_escort_angle + PI)) * orbit_r

		# Tia năng lượng nối tâm tới thoi hộ tống
		draw_line(Vector2.ZERO, drone_pos_1, Color(1.0, 0.2, 0.3, 0.35), 1.5)
		draw_line(Vector2.ZERO, drone_pos_2, Color(1.0, 0.2, 0.3, 0.35), 1.5)

		# Vẽ Thoi 1
		var t1_poly = PackedVector2Array()
		for pt in POLY_ESCORT_DRONE:
			t1_poly.append(drone_pos_1 + pt.rotated(_escort_angle))
		draw_colored_polygon(t1_poly, escort_col)
		var t1_loop = t1_poly.duplicate()
		t1_loop.append(t1_poly[0])
		draw_polyline(t1_loop, Color.WHITE, 1.5, true)

		# Vẽ Thoi 2
		var t2_poly = PackedVector2Array()
		for pt in POLY_ESCORT_DRONE:
			t2_poly.append(drone_pos_2 + pt.rotated(_escort_angle + PI))
		draw_colored_polygon(t2_poly, escort_col)
		var t2_loop = t2_poly.duplicate()
		t2_loop.append(t2_poly[0])
		draw_polyline(t2_loop, Color.WHITE, 1.5, true)

	# 6. Sóng xung kích kỹ năng Phá Sóng
	if _shockwave_anim > 0.0:
		var wave_r = (1.0 - _shockwave_anim) * 220.0 + 35.0
		var wave_alpha = _shockwave_anim * 0.85
		var wave_col = Color(1.0, 0.15, 0.35, wave_alpha)
		draw_arc(Vector2.ZERO, wave_r, 0, TAU, 32, wave_col, 3.0)

	# Hiệu ứng tia điện EMP khi bị Stun
	if stun_timer > 0.0:
		var stun_col = Color(0.1, 0.95, 1.0, 0.85)
		draw_arc(Vector2.ZERO, 20.0 + sin(_engine_pulse * 3.0) * 3.0, 0, TAU, 16, stun_col, 1.5)
		for i in range(3):
			var a1 = (float(i) / 3.0) * TAU + _engine_pulse * 2.0
			var p1 = Vector2(cos(a1), sin(a1)) * 14.0
			var p2 = Vector2(cos(a1 + 0.6), sin(a1 + 0.6)) * 24.0
			draw_line(p1, p2, stun_col, 2.0)

	# 7. Thanh máu nhỏ gọn phía trên đầu
	_draw_health_bar()

func _draw_health_bar() -> void:
	if current_state == State.ABSORBED:
		return

	var bar_w: float = 34.0
	var bar_h: float = 4.5
	var bar_y_offset: float = -24.0

	if enemy_type == Type.TANK:
		bar_w = 42.0
	elif enemy_type == Type.BOSS_TITAN:
		bar_w = 78.0
		bar_h = 6.0
		bar_y_offset = -48.0

	var bar_offset = Vector2(-bar_w * 0.5, bar_y_offset)

	draw_set_transform(Vector2.ZERO, -rotation, Vector2.ONE)

	# Nền thanh máu
	var bg_rect = Rect2(bar_offset, Vector2(bar_w, bar_h))
	draw_rect(bg_rect, Color(0.04, 0.08, 0.16, 0.85), true)
	draw_rect(bg_rect, Color(0.25, 0.45, 0.75, 0.6), false, 1.0)

	# Phần trăm máu hiện tại
	var ratio = clampf(current_hp / max_hp, 0.0, 1.0)
	var hp_w = (bar_w - 2.0) * ratio
	if hp_w > 0.0:
		var hp_col = Color(0.2, 0.95, 0.45, 0.95)
		if enemy_type == Type.BOSS_TITAN:
			hp_col = Color(1.0, 0.2, 0.35, 0.95)
		elif ratio < 0.35:
			hp_col = Color(1.0, 0.25, 0.25, 0.95)
		elif ratio < 0.65:
			hp_col = Color(1.0, 0.78, 0.2, 0.95)

		var hp_rect = Rect2(bar_offset + Vector2(1.0, 1.0), Vector2(hp_w, bar_h - 2.0))
		draw_rect(hp_rect, hp_col, true)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
