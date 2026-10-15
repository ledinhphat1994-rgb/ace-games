class_name VoidPylonTower
extends "BaseTower.gd"

## VoidPylonTower: Tháp Ma Pháp Hư Không (Void Magic Pylon - Màu Tím Neon)
## Bắn quả cầu ma pháp nổ diện rộng (AoE), tạo một vòng xoáy năng lượng mini giữ chân và rút máu quái vật trong 2 giây.

const VoidOrbScene = preload("../../scenes/towers/VoidOrb.tscn")

var _crystal_spin: float = 0.0

func _init() -> void:
	attack_range = 260.0
	attack_cooldown = 1.6
	base_damage = 20.0
	base_cost = 150
	total_invested = 150
	theme_color = Color(0.85, 0.1, 1.0, 1.0)
	glow_color = Color(0.95, 0.5, 1.0, 0.85)

func _physics_process(delta: float) -> void:
	super._physics_process(delta)
	_crystal_spin += delta * 2.5
	if _crystal_spin > TAU:
		_crystal_spin -= TAU

func fire(target: Node2D) -> void:
	if not is_instance_valid(target):
		return

	if VoidOrbScene:
		var orb = VoidOrbScene.instantiate()
		if orb:
			orb.global_position = global_position + Vector2(0, -18.0)
			orb.target_position = target.global_position
			orb.target_node = target
			# Ở Cấp 3: Tăng gấp đôi bán kính vòng xoáy năng lượng Hư Không (160px)
			orb.vortex_radius = 160.0 if level >= 3 else 80.0
			get_tree().current_scene.add_child(orb)

	if sound_synth:
		sound_synth.play_void_magic()

func _draw_turret_head() -> void:
	# Trụ Pylon Ma Pháp với các tinh thể pha lê tím uy nghi, lơ lửng xoay tròn
	var levitate_y = -10.0 + sin(_idle_pulse * 2.2) * 5.0

	# 0. Vòng cổ ma thuật cổ ngữ xoay quanh chân tháp
	var rune_radius = 28.0 + sin(_idle_pulse * 3.0) * 2.0
	draw_arc(Vector2(0, levitate_y + 12.0), rune_radius, 0, TAU, 32, Color(theme_color.r, theme_color.g, theme_color.b, 0.35), 1.5)
	for r in range(4):
		var r_ang = _crystal_spin * 0.8 + float(r) * (TAU / 4.0)
		var r_pt = Vector2(cos(r_ang) * rune_radius, levitate_y + 12.0 + sin(r_ang) * (rune_radius * 0.35))
		draw_circle(r_pt, 2.5, glow_color)

	# 1. Tinh thể trung tâm hình thoi đa diện lớn (Chiều cao ~50px, rộng 28px)
	var crystal_top = Vector2(0, levitate_y - 30.0)
	var crystal_bottom = Vector2(0, levitate_y + 20.0)
	var crystal_left = Vector2(-15.0, levitate_y - 4.0)
	var crystal_right = Vector2(15.0, levitate_y - 4.0)
	var crystal_center = Vector2(0, levitate_y - 4.0)

	# Vẽ mặt trái (tông tối hơn tạo khối 3D)
	var poly_left: PackedVector2Array = [crystal_top, crystal_left, crystal_bottom, crystal_center]
	draw_colored_polygon(poly_left, Color(0.18, 0.02, 0.28, 0.95))

	# Vẽ mặt phải (tông sáng hơn)
	var poly_right: PackedVector2Array = [crystal_top, crystal_right, crystal_bottom, crystal_center]
	draw_colored_polygon(poly_right, Color(0.32, 0.04, 0.46, 0.95))

	# Viền ngoài sắc sảo của tinh thể
	var border_crystal: PackedVector2Array = [crystal_top, crystal_right, crystal_bottom, crystal_left, crystal_top]
	draw_polyline(border_crystal, theme_color, 2.4, true)
	# Đường gờ sống lưng giữa tinh thể
	draw_line(crystal_top, crystal_bottom, glow_color, 1.8)

	# Lõi năng lượng Hư Không siêu sáng (Ark Singularity Core)
	var core_pulse = 1.0 + sin(_idle_pulse * 5.0) * 0.2
	draw_circle(crystal_center, 9.0 * core_pulse, Color(0.95, 0.4, 1.0, 0.4))
	draw_circle(crystal_center, 5.5 * core_pulse, glow_color)
	draw_circle(crystal_center, 2.8, Color.WHITE)

	# 2. Ba mảnh tinh thể vệ tinh (Satellites) xoay quanh quỹ đạo elip 3D
	for k in range(3):
		var ang = _crystal_spin + float(k) * (TAU / 3.0)
		var sat_pos = Vector2(cos(ang) * 32.0, levitate_y - 4.0 + sin(ang) * 11.0)

		# Tia sét nối giữa lõi và vệ tinh
		var bolt_alpha = 0.25 + 0.2 * sin(_idle_pulse * 8.0 + float(k))
		draw_line(crystal_center, sat_pos, Color(1.0, 0.5, 1.0, bolt_alpha), 1.2)

		# Mảnh tinh thể vệ tinh hình thoi sắc nhọn
		var sat_pts: PackedVector2Array = [
			sat_pos + Vector2(0, -8.0),
			sat_pos + Vector2(5.5, 0),
			sat_pos + Vector2(0, 8.0),
			sat_pos + Vector2(-5.5, 0)
		]
		draw_colored_polygon(sat_pts, Color(0.25, 0.03, 0.38, 0.9))
		var sat_border = sat_pts.duplicate()
		sat_border.append(sat_pts[0])
		draw_polyline(sat_border, glow_color, 1.5, true)
		draw_circle(sat_pos, 2.0, Color.WHITE)

	# 3. Điểm sáng bùng nổ khi khai hỏa
	if _muzzle_flash > 0.0:
		draw_circle(crystal_center, 32.0 * _muzzle_flash, Color(0.9, 0.2, 1.0, 0.5))
		draw_circle(crystal_center, 20.0 * _muzzle_flash, glow_color)
		draw_circle(crystal_center, 10.0 * _muzzle_flash, Color.WHITE)
