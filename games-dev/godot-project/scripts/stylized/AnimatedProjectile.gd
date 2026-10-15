class_name AnimatedProjectile
extends Node2D

## AnimatedProjectile: Hệ thống Đạn Đồ Họa Riêng Biệt Cho Từng Loại Tháp
## 1. GATLING_BULLET: Vệt sáng vàng cam siêu thanh, nảy tia lửa kim loại khi găm mục tiêu
## 2. PLASMA_ORB: Quả cầu năng lượng xoay tít, khi nổ tạo sóng xung kích diện rộng (AoE Splash 80px)

enum ProjectileType {
	GATLING_BULLET = 0,
	PLASMA_ORB = 1,
	SAM_MISSILE = 2,
	FROST_SHARD = 3,
	MAGMA_BOMB = 4,
	VOID_RAY = 5,
	ACID_SPORE = 6,
	DIVINE_BEAM = 7
}

const TexSpiral = preload("res://assets/sprites/projectile_energy_spiral.png")
const TexExplosion = preload("res://assets/sprites/explosion_fire_burst.png")
const SoundSynthClass = preload("res://scripts/audio/SoundSynthesizer.gd")

var proj_type: ProjectileType = ProjectileType.PLASMA_ORB
var target: Node2D = null
var source_tower: Node2D = null
var is_piercing: bool = false
var is_thermal_overload: bool = false
var damage: float = 25.0
var speed: float = 720.0
var lifetime: float = 0.0

var sprite: Sprite2D = null
var sound_synth: SoundSynthesizer = null

# Lịch sử vị trí để vẽ vệt sáng đạn (Trail)
var _trail_points: Array[Vector2] = []
var _max_trail: int = 8
var _last_dir: Vector2 = Vector2.RIGHT

func _ready() -> void:
	sound_synth = SoundSynthesizer.get_shared(self)

	sprite = Sprite2D.new()
	sprite.texture = TexSpiral
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	add_child(sprite)

	_apply_projectile_styling()

func _apply_projectile_styling() -> void:
	match proj_type:
		ProjectileType.GATLING_BULLET:
			speed = 1350.0
			_max_trail = 12
			if sprite: sprite.visible = false
		ProjectileType.PLASMA_ORB:
			speed = 640.0
			_max_trail = 14
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.26, 0.26)
				sprite.modulate = Color(0.2, 1.3, 1.2, 1.0)
		ProjectileType.SAM_MISSILE:
			speed = 820.0
			_max_trail = 16
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.20, 0.20)
				sprite.modulate = Color(1.2, 0.65, 0.2, 1.0)
		ProjectileType.FROST_SHARD:
			speed = 720.0
			_max_trail = 14
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.22, 0.22)
				sprite.modulate = Color(0.3, 0.95, 1.3, 1.0)
		ProjectileType.MAGMA_BOMB:
			speed = 560.0
			_max_trail = 15
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.28, 0.28)
				sprite.modulate = Color(1.3, 0.45, 0.1, 1.0)
		ProjectileType.VOID_RAY:
			speed = 1100.0
			_max_trail = 12
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.24, 0.24)
				sprite.modulate = Color(0.85, 0.3, 1.3, 1.0)
		ProjectileType.ACID_SPORE:
			speed = 620.0
			_max_trail = 14
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.22, 0.22)
				sprite.modulate = Color(0.4, 1.3, 0.3, 1.0)
		ProjectileType.DIVINE_BEAM:
			speed = 1300.0
			_max_trail = 10
			if sprite:
				sprite.visible = true
				sprite.scale = Vector2(0.25, 0.25)
				sprite.modulate = Color(1.3, 1.15, 0.4, 1.0)

func launch(target_node: Node2D, dmg: float, type: ProjectileType = ProjectileType.PLASMA_ORB, initial_dir: Vector2 = Vector2.ZERO) -> void:
	target = target_node
	damage = dmg
	proj_type = type
	_apply_projectile_styling()
	if initial_dir != Vector2.ZERO:
		_last_dir = initial_dir.normalized()
	elif is_instance_valid(target):
		var aim_pos = target.global_position + Vector2(0.0, -22.0)
		_last_dir = (aim_pos - global_position).normalized()
	rotation = _last_dir.angle()

## Bắn đạn bay thẳng 100% dọc theo trục nòng súng (Straight-Line Ballistics)
func launch_straight(spawn_pos: Vector2, shoot_dir: Vector2, target_node: Node2D, dmg: float, type: ProjectileType = ProjectileType.GATLING_BULLET) -> void:
	global_position = spawn_pos
	target = target_node
	damage = dmg
	proj_type = type
	_apply_projectile_styling()
	_last_dir = shoot_dir.normalized()
	rotation = _last_dir.angle()

func _process(delta: float) -> void:
	lifetime += delta
	if lifetime > 2.5:
		queue_free()
		return

	# Tự xoay quanh trục
	if sprite:
		match proj_type:
			ProjectileType.GATLING_BULLET:
				sprite.rotation += delta * 30.0
			ProjectileType.PLASMA_ORB:
				sprite.rotation += delta * 15.0

	# Lưu lịch sử đường bay
	_trail_points.push_front(global_position)
	if _trail_points.size() > _max_trail:
		_trail_points.pop_back()

	# 1. ĐẠN BAY THẲNG TUYỆT ĐỐI THEO TRỤC NÒNG SÚNG (Không bẻ cong/homing)
	global_position += _last_dir * speed * delta
	rotation = _last_dir.angle()

	# 2. KIỂM TRA VA CHẠM VỚI MỤC TIÊU DỌC ĐƯỜNG ĐẠN
	if is_instance_valid(target) and not target.is_queued_for_deletion() and not target.get("_is_dead"):
		var aim_pos = target.global_position + Vector2(0.0, -22.0)
		var dist = global_position.distance_to(aim_pos)
		if dist <= 32.0:
			_on_hit_target()
		else:
			# Đạn bay ngang qua hoặc cắt qua mục tiêu ở cự ly gần
			var to_aim = aim_pos - global_position
			if to_aim.dot(_last_dir) <= 0.0 and dist <= 48.0:
				_on_hit_target()
	elif get_tree():
		var enemies = get_tree().get_nodes_in_group("animated_enemies")
		for e in enemies:
			if is_instance_valid(e) and not e.is_queued_for_deletion() and not e.get("_is_dead"):
				var aim_pos = e.global_position + Vector2(0.0, -22.0)
				var dist = global_position.distance_to(aim_pos)
				if dist <= 32.0 or ((aim_pos - global_position).dot(_last_dir) <= 0.0 and dist <= 48.0):
					target = e
					_on_hit_target()
					break

	queue_redraw()

func _on_hit_target() -> void:
	match proj_type:
		ProjectileType.GATLING_BULLET:
			if is_instance_valid(target) and target.has_method("take_damage"):
				var was_dead = target.get("_is_dead")
				target.take_damage(damage, AnimatedEnemy.DamageType.KINETIC, source_tower)
				var recorded_dmg = damage
				if is_piercing:
					var true_dmg = damage * 0.35
					target.take_damage(true_dmg, AnimatedEnemy.DamageType.TRUE_DAMAGE, source_tower)
					recorded_dmg += true_dmg

					# SPRINT 5: Cross-Tower Combo - Thermal Shock (💥 SỐC NHIỆT!)
					var is_slowed = false
					if "status_slow_timer" in target and target.get("status_slow_timer") > 0.0:
						is_slowed = true
					elif "status_chilled_timer" in target and target.get("status_chilled_timer") > 0.0:
						is_slowed = true
					elif "status_frozen_timer" in target and target.get("status_frozen_timer") > 0.0:
						is_slowed = true

					if is_slowed and not was_dead:
						var shock_dmg = damage * 0.25
						target.take_damage(shock_dmg, AnimatedEnemy.DamageType.TRUE_DAMAGE, source_tower)
						recorded_dmg += shock_dmg
						if target.has_method("_spawn_combat_text"):
							target._spawn_combat_text("SỐC NHIỆT!", Color(1.0, 0.35, 0.15))
						_notify_combo_reaction()

				var overload_dmg = _apply_tesla_overload_bonus(target, damage)
				recorded_dmg += overload_dmg

				var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(recorded_dmg, not was_dead and now_dead)
			_spawn_damage_number(global_position, int(damage), Color(1.0, 0.85, 0.2))
			_spawn_gatling_sparks(global_position)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.PLASMA_ORB:
			_trigger_plasma_aoe_splash(global_position)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.SAM_MISSILE:
			_trigger_missile_aoe_splash(global_position)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.FROST_SHARD:
			if is_instance_valid(target) and target.has_method("take_damage"):
				var was_dead = target.get("_is_dead")
				target.take_damage(damage, AnimatedEnemy.DamageType.ARCANE)
				if target.has_method("apply_chill"):
					target.apply_chill(3.5)
				var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(damage, not was_dead and now_dead)
			_spawn_damage_number(global_position, int(damage), Color(0.3, 0.9, 1.0))
			_spawn_gatling_sparks(global_position)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.MAGMA_BOMB:
			_trigger_magma_aoe_splash(global_position)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.VOID_RAY:
			if is_instance_valid(target) and target.has_method("take_damage"):
				var was_dead = target.get("_is_dead")
				var bonus_hp_dmg = 0.0
				if "max_hp" in target:
					bonus_hp_dmg = target.get("max_hp") * 0.15
				target.take_damage(damage + bonus_hp_dmg, AnimatedEnemy.DamageType.ARCANE)
				var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(damage + bonus_hp_dmg, not was_dead and now_dead)
				_spawn_damage_number(global_position, int(damage + bonus_hp_dmg), Color(0.85, 0.35, 1.3))
			_spawn_plasma_shockwave(global_position, 55.0)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.ACID_SPORE:
			if is_instance_valid(target) and target.has_method("take_damage"):
				var was_dead = target.get("_is_dead")
				target.take_damage(damage, AnimatedEnemy.DamageType.BIO_CORROSIVE)
				if target.has_method("apply_acid"):
					target.apply_acid(6.0)
				var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(damage, not was_dead and now_dead)
			_spawn_damage_number(global_position, int(damage), Color(0.4, 1.1, 0.3))
			_spawn_gatling_sparks(global_position)
			if sound_synth: sound_synth.play_hit()

		ProjectileType.DIVINE_BEAM:
			if is_instance_valid(target) and target.has_method("take_damage"):
				var was_dead = target.get("_is_dead")
				target.take_damage(damage, AnimatedEnemy.DamageType.TRUE_DAMAGE)
				var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(damage, not was_dead and now_dead)
			_spawn_damage_number(global_position, int(damage), Color(1.3, 1.15, 0.4))
			_spawn_plasma_shockwave(global_position, 60.0)
			if sound_synth: sound_synth.play_hit()

	queue_free()

func _apply_tesla_overload_bonus(enemy: Node2D, base_dmg: float) -> float:
	if not is_instance_valid(enemy):
		return 0.0
	# Đòn đánh từ trụ khác (không phải từ Tesla Coil)
	if is_instance_valid(source_tower) and source_tower.get("tower_type") == 2: # 2 = TESLA_COIL
		return 0.0
	var is_charged = false
	if "_electro_charged_timer" in enemy and enemy.get("_electro_charged_timer") > 0.0:
		is_charged = true
	elif "status_overload_timer" in enemy and enemy.get("status_overload_timer") > 0.0:
		is_charged = true
	if is_charged:
		var bonus_dmg = base_dmg * 0.20
		enemy.set("_electro_charged_timer", 0.0)
		enemy.set("status_overload_timer", 0.0)
		enemy.take_damage(bonus_dmg, AnimatedEnemy.DamageType.ELECTRO_EMP, source_tower)
		if enemy.has_method("_spawn_combat_text"):
			enemy._spawn_combat_text("QUÁ TẢI!", Color(0.3, 0.9, 1.0))
		_notify_combo_reaction()
		return bonus_dmg
	return 0.0

func _notify_combo_reaction() -> void:
	if is_inside_tree() and get_tree() and get_tree().current_scene:
		if get_tree().current_scene.has_method("notify_combo_reaction"):
			get_tree().current_scene.notify_combo_reaction()

func _trigger_plasma_aoe_splash(center_pos: Vector2) -> void:
	var splash_radius = 80.0 * (1.20 if is_thermal_overload else 1.0)
	var splash_damage = damage

	if is_instance_valid(target) and target.has_method("take_damage"):
		var was_dead = target.get("_is_dead")
		target.take_damage(damage, AnimatedEnemy.DamageType.THERMAL_PLASMA, source_tower)
		if is_thermal_overload and target.has_method("apply_slow"):
			target.apply_slow(0.8, 1.5)
		var recorded_dmg = damage + _apply_tesla_overload_bonus(target, damage)
		var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
		if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
			source_tower.record_damage_dealt(recorded_dmg, not was_dead and now_dead)
		_spawn_damage_number(center_pos, int(damage), Color(0.2, 1.0, 0.9))

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e != target and not e.is_queued_for_deletion():
			var d = center_pos.distance_to(e.global_position)
			if d <= splash_radius and e.has_method("take_damage"):
				var falloff_dmg = splash_damage * clampf(1.0 - (d / splash_radius) * 0.45, 0.5, 1.0)
				var was_dead = e.get("_is_dead")
				e.take_damage(falloff_dmg, AnimatedEnemy.DamageType.THERMAL_PLASMA, source_tower)
				if is_thermal_overload and e.has_method("apply_slow"):
					e.apply_slow(0.8, 1.5)
				var recorded_falloff = falloff_dmg + _apply_tesla_overload_bonus(e, falloff_dmg)
				var now_dead = e.get("_is_dead") or e.is_queued_for_deletion() or e.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(recorded_falloff, not was_dead and now_dead)
				_spawn_damage_number(e.global_position + Vector2(randf_range(-15, 15), -20), int(falloff_dmg), Color(0.4, 0.9, 1.0))

	_spawn_plasma_shockwave(center_pos, splash_radius)

func _trigger_missile_aoe_splash(center_pos: Vector2) -> void:
	var splash_radius = 95.0
	var splash_damage = damage

	if is_instance_valid(target) and target.has_method("take_damage"):
		var was_dead = target.get("_is_dead")
		target.take_damage(damage, AnimatedEnemy.DamageType.KINETIC, source_tower)
		var is_flyer = (target.get("is_flying") or target.get("armor_type") == AnimatedEnemy.ArmorType.AERIAL or target.get("variant") == AnimatedEnemy.EnemyVariant.AIR_DRONE)
		var is_sam_lv3 = is_instance_valid(source_tower) and source_tower.get("tower_type") == 3 and source_tower.get("level") >= 3
		var eff_dealt = damage * (3.0 if (is_sam_lv3 and is_flyer) else (2.2 if is_flyer else 1.5))
		var recorded_dmg = eff_dealt + _apply_tesla_overload_bonus(target, damage)
		var now_dead = target.get("_is_dead") or target.is_queued_for_deletion() or target.get("current_hp") <= 0.0
		if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
			source_tower.record_damage_dealt(recorded_dmg, not was_dead and now_dead)
		_spawn_damage_number(center_pos, int(eff_dealt), Color(1.2, 0.7, 0.2))

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e != target and not e.is_queued_for_deletion():
			var d = center_pos.distance_to(e.global_position)
			if d <= splash_radius and e.has_method("take_damage"):
				var falloff_dmg = splash_damage * clampf(1.0 - (d / splash_radius) * 0.5, 0.4, 1.0)
				var was_dead = e.get("_is_dead")
				e.take_damage(falloff_dmg, AnimatedEnemy.DamageType.KINETIC, source_tower)
				var is_flyer_e = (e.get("is_flying") or e.get("armor_type") == AnimatedEnemy.ArmorType.AERIAL or e.get("variant") == AnimatedEnemy.EnemyVariant.AIR_DRONE)
				var is_sam_lv3_e = is_instance_valid(source_tower) and source_tower.get("tower_type") == 3 and source_tower.get("level") >= 3
				var eff_falloff = falloff_dmg * (3.0 if (is_sam_lv3_e and is_flyer_e) else (2.2 if is_flyer_e else 1.5))
				var recorded_falloff = eff_falloff + _apply_tesla_overload_bonus(e, falloff_dmg)
				var now_dead = e.get("_is_dead") or e.is_queued_for_deletion() or e.get("current_hp") <= 0.0
				if is_instance_valid(source_tower) and source_tower.has_method("record_damage_dealt"):
					source_tower.record_damage_dealt(recorded_falloff, not was_dead and now_dead)
				_spawn_damage_number(e.global_position + Vector2(randf_range(-15, 15), -20), int(eff_falloff), Color(1.0, 0.7, 0.2))

	_spawn_plasma_shockwave(center_pos, splash_radius)

func _trigger_magma_aoe_splash(center_pos: Vector2) -> void:
	var splash_radius = 85.0
	var splash_damage = damage

	if is_instance_valid(target) and target.has_method("take_damage"):
		target.take_damage(damage, AnimatedEnemy.DamageType.ARCANE)
		if target.has_method("apply_burn"):
			target.apply_burn(30.0, 4.0)
		_spawn_damage_number(center_pos, int(damage), Color(1.3, 0.5, 0.1))

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e != target and not e.is_queued_for_deletion():
			var d = center_pos.distance_to(e.global_position)
			if d <= splash_radius and e.has_method("take_damage"):
				e.take_damage(splash_damage * 0.7, AnimatedEnemy.DamageType.ARCANE)
				if e.has_method("apply_burn"):
					e.apply_burn(25.0, 3.5)
				_spawn_damage_number(e.global_position + Vector2(randf_range(-15, 15), -20), int(splash_damage * 0.7), Color(1.2, 0.5, 0.1))

	_spawn_plasma_shockwave(center_pos, splash_radius)

func _get_spawn_parent() -> Node:
	if is_inside_tree() and get_tree() and is_instance_valid(get_tree().current_scene):
		return get_tree().current_scene
	if get_parent():
		return get_parent()
	return null

func _spawn_gatling_sparks(pos: Vector2) -> void:
	var burst = Sprite2D.new()
	burst.texture = TexExplosion
	burst.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	burst.global_position = pos
	burst.scale = Vector2(0.18, 0.18)
	burst.modulate = Color(1.3, 0.9, 0.2, 1.0)
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(burst)

	var tween = burst.create_tween()
	tween.tween_property(burst, "scale", Vector2(0.42, 0.42), 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(burst, "modulate:a", 0.0, 0.14)
	tween.tween_callback(burst.queue_free)

func _spawn_plasma_shockwave(pos: Vector2, radius: float) -> void:
	var burst = Sprite2D.new()
	burst.texture = TexExplosion
	burst.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	burst.global_position = pos
	burst.scale = Vector2(0.35, 0.35)
	burst.modulate = Color(0.3, 1.1, 1.2, 1.0)
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(burst)

	var tween = burst.create_tween()
	tween.tween_property(burst, "scale", Vector2(0.85, 0.85), 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(burst, "modulate:a", 0.0, 0.26)
	tween.tween_callback(burst.queue_free)

	var shockwave = Node2D.new()
	shockwave.global_position = pos
	shockwave.set_script(load("res://scripts/stylized/ShockwaveRing.gd"))
	if spawn_parent:
		spawn_parent.add_child(shockwave)
	shockwave.call("trigger", radius, Color(0.2, 0.95, 1.0, 0.85))

func _spawn_damage_number(pos: Vector2, dmg_val: int, col: Color) -> void:
	var label = Label.new()
	label.text = "-%d" % dmg_val
	label.add_theme_font_size_override("font_size", 21)
	label.add_theme_color_override("font_color", col)
	label.add_theme_color_override("font_outline_color", Color(0.08, 0.08, 0.1, 0.95))
	label.add_theme_constant_override("outline_size", 4)
	label.global_position = pos + Vector2(-16.0, -25.0)
	label.z_index = 20
	var spawn_parent = _get_spawn_parent()
	if spawn_parent:
		spawn_parent.add_child(label)

	var tween = label.create_tween()
	tween.tween_property(label, "global_position:y", label.global_position.y - 38.0, 0.45).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(label, "modulate:a", 0.0, 0.45)
	tween.tween_callback(label.queue_free)

func _draw() -> void:
	if _trail_points.size() > 1:
		for i in range(1, _trail_points.size()):
			var p1 = to_local(_trail_points[i - 1])
			var p2 = to_local(_trail_points[i])
			var t_ratio = 1.0 - (float(i) / float(_max_trail))

			match proj_type:
				ProjectileType.GATLING_BULLET:
					var w = t_ratio * 3.5 + 0.8
					draw_line(p1, p2, Color(1.0, 0.75, 0.15, t_ratio * 0.85), w)
					draw_line(p1, p2, Color(1.0, 1.0, 0.8, t_ratio), w * 0.4)
				ProjectileType.PLASMA_ORB:
					var w = t_ratio * 8.0 + 1.5
					draw_line(p1, p2, Color(0.15, 0.85, 1.0, t_ratio * 0.75), w)
					draw_line(p1, p2, Color(0.9, 1.0, 1.0, t_ratio * 0.9), w * 0.45)
				ProjectileType.SAM_MISSILE:
					var w = t_ratio * 5.0 + 1.2
					draw_line(p1, p2, Color(1.0, 0.55, 0.15, t_ratio * 0.8), w)
					draw_line(p1, p2, Color(0.9, 0.9, 0.9, t_ratio * 0.5), w * 1.5)
				ProjectileType.FROST_SHARD:
					var w = t_ratio * 6.0 + 1.2
					draw_line(p1, p2, Color(0.3, 0.9, 1.2, t_ratio * 0.85), w)
				ProjectileType.MAGMA_BOMB:
					var w = t_ratio * 7.5 + 1.5
					draw_line(p1, p2, Color(1.2, 0.4, 0.1, t_ratio * 0.85), w)
				ProjectileType.VOID_RAY:
					var w = t_ratio * 7.0 + 1.2
					draw_line(p1, p2, Color(0.85, 0.3, 1.3, t_ratio * 0.85), w)
				ProjectileType.ACID_SPORE:
					var w = t_ratio * 5.5 + 1.2
					draw_line(p1, p2, Color(0.4, 1.2, 0.3, t_ratio * 0.85), w)
				ProjectileType.DIVINE_BEAM:
					var w = t_ratio * 8.0 + 2.0
					draw_line(p1, p2, Color(1.3, 1.15, 0.4, t_ratio * 0.9), w)

	if proj_type == ProjectileType.GATLING_BULLET:
		draw_line(Vector2(-14.0, 0.0), Vector2(8.0, 0.0), Color(1.0, 0.60, 0.10, 0.95), 3.8)
		draw_line(Vector2(-10.0, 0.0), Vector2(10.0, 0.0), Color(1.0, 0.95, 0.35, 1.0), 2.2)
		draw_line(Vector2(-4.0, 0.0), Vector2(11.0, 0.0), Color.WHITE, 1.2)
		draw_circle(Vector2(11.0, 0.0), 2.5, Color.WHITE)
