class_name PlasmaTower
extends "BaseTower.gd"

## PlasmaTower: Tháp Cung Năng Lượng (Plasma Bow - Màu Xanh Cyan)
## Bắn đạn photon bay nhanh. Quỹ đạo đạn bị uốn cong nếu bay qua GravityZone.
## Sát thương đơn mục tiêu, tốc độ bắn nhanh.

const ProjectileScene = preload("../../scenes/towers/PlasmaProjectile.tscn")

func _init() -> void:
	attack_range = 280.0
	attack_cooldown = 0.42
	base_damage = 22.0
	base_cost = 60
	total_invested = 60
	theme_color = Color(0.0, 0.95, 1.0, 1.0)
	glow_color = Color(0.5, 1.0, 1.0, 0.9)

func fire(target: Node2D) -> void:
	if not is_instance_valid(target):
		return

	if ProjectileScene:
		# Ở Cấp 3: Bắn chùm 2 tia photon song song tỏa nhẹ
		if level >= 3:
			for angle_offset in [-0.10, 0.10]:
				var proj = ProjectileScene.instantiate()
				if proj:
					var fire_rot = turret_rotation + angle_offset
					var muzzle_offset = Vector2.RIGHT.rotated(fire_rot) * (base_radius * 0.95)
					proj.global_position = global_position + muzzle_offset
					var aim_dir = Vector2.RIGHT.rotated(fire_rot)
					get_tree().current_scene.add_child(proj)
					proj.launch(aim_dir, base_damage, target)
		else:
			var proj = ProjectileScene.instantiate()
			if proj:
				var muzzle_offset = Vector2.RIGHT.rotated(turret_rotation) * (base_radius * 0.95)
				proj.global_position = global_position + muzzle_offset
				var aim_dir = (target.global_position - proj.global_position).normalized()
				get_tree().current_scene.add_child(proj)
				proj.launch(aim_dir, base_damage, target)

	if sound_synth:
		sound_synth.play_plasma_bow()

func _draw_turret_head() -> void:
	draw_set_transform(Vector2.ZERO, turret_rotation, Vector2.ONE)

	# Hai cánh cung năng lượng cỡ lớn uốn cong hình lưỡi liềm (Plasma Bow)
	var bow_arc: PackedVector2Array = [
		Vector2(20.0, -25.0),
		Vector2(28.0, -10.0),
		Vector2(32.0, 0.0),
		Vector2(28.0, 10.0),
		Vector2(20.0, 25.0),
		Vector2(14.0, 14.0),
		Vector2(18.0, 0.0),
		Vector2(14.0, -14.0)
	]
	draw_colored_polygon(bow_arc, Color(0.0, 0.18, 0.32, 0.96))

	var loop_bow = bow_arc.duplicate()
	loop_bow.append(bow_arc[0])
	draw_polyline(loop_bow, theme_color, 2.5, true)

	# Vành trợ lực bên ngoài cánh cung (Outer Energy Wings)
	var wing_l: PackedVector2Array = [Vector2(20.0, -25.0), Vector2(26.0, -32.0), Vector2(30.0, -20.0)]
	var wing_r: PackedVector2Array = [Vector2(20.0, 25.0), Vector2(26.0, 32.0), Vector2(30.0, 20.0)]
	draw_polyline(wing_l, glow_color, 2.0)
	draw_polyline(wing_r, glow_color, 2.0)

	# Dây cung năng lượng kép phát sáng rực rỡ
	draw_line(Vector2(20.0, -25.0), Vector2(6.0, 0.0), Color(theme_color.r, theme_color.g, theme_color.b, 0.85), 2.0)
	draw_line(Vector2(20.0, 25.0), Vector2(6.0, 0.0), Color(theme_color.r, theme_color.g, theme_color.b, 0.85), 2.0)
	draw_line(Vector2(20.0, -25.0), Vector2(6.0, 0.0), Color.WHITE, 1.0)
	draw_line(Vector2(20.0, 25.0), Vector2(6.0, 0.0), Color.WHITE, 1.0)

	# Điểm sáng đầu nòng khi bắn (Muzzle Flash)
	if _muzzle_flash > 0.0:
		draw_circle(Vector2(32.0, 0.0), 18.0 * _muzzle_flash, glow_color)
		draw_circle(Vector2(32.0, 0.0), 9.0 * _muzzle_flash, Color.WHITE)

	# Lõi tháp trung tâm
	draw_circle(Vector2.ZERO, base_radius * 0.48, Color(0.03, 0.10, 0.22, 1.0))
	draw_circle(Vector2.ZERO, base_radius * 0.48, theme_color, false, 2.5)
	draw_circle(Vector2.ZERO, base_radius * 0.25, Color.WHITE)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
