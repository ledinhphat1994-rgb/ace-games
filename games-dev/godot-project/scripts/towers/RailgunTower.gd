class_name RailgunTower
extends "BaseTower.gd"

## RailgunTower: Tháp Súng Xung Lực (Heavy Railgun - Màu Vàng/Cam Neon)
## Bắn tia xung kích tức thì bằng Line2D (hiển thị tia chớp rồi mờ dần trong 0.15s)
## Tạo lực giật lùi (Knockback) hất lùi quái vật trên quỹ đạo bay. Sát thương cao, tốc độ chậm.

var _beam_start: Vector2 = Vector2.ZERO
var _beam_end: Vector2 = Vector2.ZERO
var _beam_end2: Vector2 = Vector2.ZERO
var _has_pierce_target: bool = false
var _beam_alpha: float = 0.0

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _init() -> void:
	attack_range = 340.0
	attack_cooldown = 1.75
	base_damage = 70.0
	base_cost = 120
	total_invested = 120
	theme_color = Color(1.0, 0.72, 0.1, 1.0)
	glow_color = Color(1.0, 0.9, 0.4, 0.9)

func _physics_process(delta: float) -> void:
	super._physics_process(delta)
	if _beam_alpha > 0.0:
		_beam_alpha = maxf(0.0, _beam_alpha - delta * 6.5)
		queue_redraw()

func fire(target: Node2D) -> void:
	if not is_instance_valid(target):
		return

	var muzzle_offset = Vector2.RIGHT.rotated(turret_rotation) * (base_radius * 1.3)
	_beam_start = muzzle_offset
	_beam_end = to_local(target.global_position)
	_beam_alpha = 1.0
	_has_pierce_target = false

	var hit_dir = (target.global_position - global_position).normalized()

	# 1. Gây sát thương nặng cho mục tiêu 1
	if target.has_method("take_damage"):
		target.take_damage(base_damage)

	# 2. Tạo lực giật lùi (Knockback) hất văng quái vật lùi lại
	if target.has_method("apply_knockback"):
		target.apply_knockback(hit_dir * 440.0)

	# 3. Hiệu ứng hạt tóe lửa tại điểm bắn trúng
	_spawn_railgun_impact(target.global_position)

	# 4. CẤP 3 - CỰC PHẨM: Xuyên thấu mục tiêu thứ 2 thẳng hàng
	if level >= 3:
		var best_target2: Node2D = null
		var max_dot: float = 0.82
		for cand in targets_in_range:
			if cand != target and is_instance_valid(cand) and not cand.is_queued_for_deletion():
				var cand_dir = (cand.global_position - global_position).normalized()
				var dot = hit_dir.dot(cand_dir)
				if dot > max_dot:
					max_dot = dot
					best_target2 = cand
		if best_target2:
			_has_pierce_target = true
			_beam_end2 = to_local(best_target2.global_position)
			if best_target2.has_method("take_damage"):
				best_target2.take_damage(base_damage * 0.85)
			if best_target2.has_method("apply_knockback"):
				best_target2.apply_knockback(hit_dir * 380.0)
			_spawn_railgun_impact(best_target2.global_position)

	# 5. Âm thanh nổ trầm dồn dập
	if sound_synth:
		sound_synth.play_railgun()

	if web_bridge:
		web_bridge.trigger_haptic("medium")

func _spawn_railgun_impact(pos: Vector2) -> void:
	if not get_parent():
		return
	var p = CPUParticles2D.new()
	p.global_position = pos
	p.emitting = true
	p.one_shot = true
	p.explosiveness = 1.0
	p.amount = 16
	p.lifetime = 0.35
	p.spread = 180.0
	p.initial_velocity_min = 80.0
	p.initial_velocity_max = 220.0
	p.scale_amount_min = 2.0
	p.scale_amount_max = 4.5
	p.color = Color(1.0, 0.85, 0.2, 1.0)
	get_parent().add_child(p)
	get_tree().create_timer(0.45).timeout.connect(p.queue_free)

func _draw() -> void:
	super._draw()

	# Vẽ tia chớp xung kích tức thì (Railgun Lightning Beam)
	if _beam_alpha > 0.0:
		var beam_col = Color(theme_color.r, theme_color.g, theme_color.b, _beam_alpha)
		var core_col = Color(1.0, 1.0, 1.0, _beam_alpha)
		# Vầng sáng ngoài
		draw_line(_beam_start, _beam_end, beam_col, 11.0 * _beam_alpha)
		# Lõi năng lượng trắng sáng giữa tia
		draw_line(_beam_start, _beam_end, core_col, 4.0 * _beam_alpha)

		# Tia xuyên qua mục tiêu 2 nếu có
		if _has_pierce_target:
			draw_line(_beam_end, _beam_end2, beam_col, 9.0 * _beam_alpha)
			draw_line(_beam_end, _beam_end2, core_col, 3.0 * _beam_alpha)

func _draw_turret_head() -> void:
	draw_set_transform(Vector2.ZERO, turret_rotation, Vector2.ONE)

	# Nòng súng đôi Railgun dài dũng mãnh
	var barrel_len = base_radius * 1.45
	# Thanh ray trên
	draw_rect(Rect2(Vector2(0, -9.0), Vector2(barrel_len, 5.5)), Color(0.18, 0.12, 0.05, 1.0), true)
	draw_rect(Rect2(Vector2(0, -9.0), Vector2(barrel_len, 5.5)), theme_color, false, 2.0)
	# Thanh ray dưới
	draw_rect(Rect2(Vector2(0, 3.5), Vector2(barrel_len, 5.5)), Color(0.18, 0.12, 0.05, 1.0), true)
	draw_rect(Rect2(Vector2(0, 3.5), Vector2(barrel_len, 5.5)), theme_color, false, 2.0)

	# 3 cuộn cảm từ trường (Magnetic Coils) vàng neon dọc thân nòng
	for k in range(3):
		var coil_x = 12.0 + float(k) * 14.0
		draw_rect(Rect2(Vector2(coil_x, -11.0), Vector2(6.0, 22.0)), glow_color, true)
		draw_rect(Rect2(Vector2(coil_x, -11.0), Vector2(6.0, 22.0)), Color.WHITE, false, 1.2)

	# Lõi tích điện giữa 2 thanh ray
	draw_rect(Rect2(Vector2(4.0, -3.0), Vector2(barrel_len - 6.0, 6.0)), glow_color, true)
	draw_rect(Rect2(Vector2(4.0, -1.5), Vector2(barrel_len - 6.0, 3.0)), Color.WHITE, true)

	# Tia chớp đầu nòng khi bắn
	if _muzzle_flash > 0.0:
		draw_circle(Vector2(barrel_len + 10.0, 0), 22.0 * _muzzle_flash, glow_color)
		draw_circle(Vector2(barrel_len + 10.0, 0), 11.0 * _muzzle_flash, Color.WHITE)

	# Khối tháp trung tâm vuông vức hầm hố
	var body_rect = Rect2(Vector2(-base_radius * 0.52, -base_radius * 0.52), Vector2(base_radius * 1.04, base_radius * 1.04))
	draw_rect(body_rect, Color(0.12, 0.09, 0.04, 1.0), true)
	draw_rect(body_rect, theme_color, false, 2.5)
	draw_circle(Vector2.ZERO, base_radius * 0.32, Color(1.0, 0.9, 0.3, 0.95))
	draw_circle(Vector2.ZERO, base_radius * 0.18, Color.WHITE)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
