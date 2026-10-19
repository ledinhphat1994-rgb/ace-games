extends Node2D
class_name MeteorSpellEffect

var target_pos: Vector2 = Vector2.ZERO
var main_scene: Node2D = null

var _circle_sprite: Sprite2D = null
var _time_alive: float = 0.0
var _has_exploded: bool = false
var _meteors: Array = []

func _ready() -> void:
	z_index = 5
	position = target_pos
	_setup_magic_circle()
	_setup_meteors()

func _setup_magic_circle() -> void:
	_circle_sprite = Sprite2D.new()
	var tex = load("res://assets/textures/fx/arcane_magic_circle_512.png")
	if tex:
		_circle_sprite.texture = tex
	var mat = CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	_circle_sprite.material = mat
	_circle_sprite.scale = Vector2(0.01, 0.005)
	_circle_sprite.modulate = Color(1.0, 0.88, 0.35, 0.95)
	add_child(_circle_sprite)

	var tw = create_tween()
	tw.tween_property(_circle_sprite, "scale", Vector2(0.58, 0.32), 0.32).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _setup_meteors() -> void:
	# 2 Quả cầu lửa thiên thạch rơi từ góc trên trái và góc trên phải
	var spawn_configs = [
		{"start": Vector2(-160.0, -420.0), "delay": 0.15, "curve": -35.0},
		{"start": Vector2(140.0, -450.0), "delay": 0.22, "curve": 35.0}
	]
	for cfg in spawn_configs:
		var m_data = {
			"start": cfg["start"],
			"curve": cfg["curve"],
			"delay": cfg["delay"],
			"pos": cfg["start"],
			"progress": 0.0,
			"active": false,
			"trail": []
		}
		_meteors.append(m_data)

func _process(delta: float) -> void:
	_time_alive += delta

	# 1. Xoay vòng ma pháp hoàng kim liên tục
	if is_instance_valid(_circle_sprite):
		_circle_sprite.rotation += delta * 2.2
		var pulse = 0.85 + 0.15 * sin(_time_alive * 8.0)
		if not _has_exploded:
			_circle_sprite.modulate = Color(1.0, 0.88, 0.35, pulse)

	# 2. Cập nhật quỹ đạo rơi của thiên thạch
	for m in _meteors:
		if _time_alive >= m["delay"] and m["progress"] < 1.0:
			m["active"] = true
			m["progress"] = clampf(m["progress"] + delta * 2.4, 0.0, 1.0)
			var p = m["progress"]
			# Parabolic Bezier arc
			var p0 = m["start"]
			var p2 = Vector2.ZERO
			var p1 = (p0 + p2) * 0.5 + Vector2(m["curve"], -60.0)
			# Quadratic Bezier
			var current_pos = (1.0 - p) * (1.0 - p) * p0 + 2.0 * (1.0 - p) * p * p1 + p * p * p2
			m["pos"] = current_pos
			m["trail"].append(current_pos)
			if m["trail"].size() > 14:
				m["trail"].pop_front()

	# 3. Kích nổ khi thiên thạch chạm mặt đất
	if _time_alive >= 0.65 and not _has_exploded:
		_has_exploded = true
		_trigger_impact_explosion()

	queue_redraw()

func _trigger_impact_explosion() -> void:
	# 1. Flash vòng ma pháp hoàng kim rực sáng
	if is_instance_valid(_circle_sprite):
		var tw = create_tween()
		tw.tween_property(_circle_sprite, "modulate", Color(2.5, 2.2, 1.2, 1.0), 0.08)
		tw.tween_property(_circle_sprite, "modulate:a", 0.0, 0.35)

	# 2. Vệt nứt cháy sém bám mặt đất (Scorch Crater Decal)
	var crater_tex = load("res://assets/textures/fx/scorch_crater.png")
	if crater_tex and main_scene:
		var crater = Sprite2D.new()
		crater.texture = crater_tex
		crater.position = target_pos
		crater.scale = Vector2(0.85, 0.50)
		crater.z_index = -1
		crater.modulate.a = 0.95
		main_scene.add_child(crater)
		var c_tw = crater.create_tween()
		c_tw.tween_interval(6.0)
		c_tw.tween_property(crater, "modulate:a", 0.0, 4.0)
		c_tw.tween_callback(crater.queue_free)

	# 3. Rung chấn màn hình (Camera Trauma)
	if main_scene and "camera_ctrl" in main_scene and is_instance_valid(main_scene.camera_ctrl):
		if main_scene.camera_ctrl.has_method("add_trauma"):
			main_scene.camera_ctrl.add_trauma(0.8)

	# 4. Âm thanh bùng nổ sấm sét / đại bác plasma
	if main_scene and "sound_synth" in main_scene and is_instance_valid(main_scene.sound_synth):
		main_scene.sound_synth.play_plasma_cannon()

	# 5. Làm chậm và thiêu đốt diện rộng cho quái vật trong bán kính 220px
	var enemies = AnimatedEnemy.get_active_enemies() if not AnimatedEnemy.get_active_enemies().is_empty() else get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e):
			var d_sq = target_pos.distance_squared_to(e.global_position)
			if d_sq <= 48400.0: # 220.0 * 220.0
				if e.has_method("apply_slow"):
					e.apply_slow(0.80, 2.0)
				if e.has_method("_spawn_combat_text"):
					e._spawn_combat_text("HỎA BÃO!", Color(1.0, 0.85, 0.2))

	# 6. Floating combat text trung tâm
	if main_scene and main_scene.has_method("_spawn_floating_map_text"):
		main_scene._spawn_floating_map_text("MƯA THIÊN THẠCH!", target_pos + Vector2(0.0, -55.0), Color(1.0, 0.90, 0.25))

	# Tự hủy sau khi kết thúc hiệu ứng
	var del_tw = create_tween()
	del_tw.tween_interval(1.2)
	del_tw.tween_callback(queue_free)

func _draw() -> void:
	# Vẽ các vệt sao băng rơi và vụ nổ bằng Vector đồ họa hiệu năng cao
	for m in _meteors:
		if not m["active"]:
			continue

		# Vẽ đuôi lửa (Fire Trail)
		var trail = m["trail"]
		if trail.size() > 1:
			for i in range(trail.size() - 1):
				var p_ratio = float(i) / float(trail.size())
				var col = Color(1.0, lerpf(0.35, 0.90, p_ratio), 0.15, p_ratio * 0.85)
				draw_line(trail[i], trail[i+1], col, lerpf(3.0, 10.0, p_ratio))
				draw_line(trail[i], trail[i+1], Color(1.0, 1.0, 0.85, p_ratio * 0.95), lerpf(1.0, 4.0, p_ratio))

		# Đầu thiên thạch rực lửa
		if m["progress"] < 1.0:
			var head_pos = m["pos"]
			draw_circle(head_pos, 16.0, Color(1.0, 0.45, 0.1, 0.40))
			draw_circle(head_pos, 10.0, Color(1.0, 0.85, 0.2, 0.85))
			draw_circle(head_pos, 5.0, Color(1.0, 1.0, 1.0, 1.0))

	# Hiệu ứng nổ shockwave khi vừa chạm đất
	if _has_exploded and _time_alive < 1.1:
		var blast_p = clampf((_time_alive - 0.65) / 0.45, 0.0, 1.0)
		var r_outer = lerpf(20.0, 190.0, blast_p)
		var r_inner = lerpf(10.0, 160.0, blast_p)
		var b_alpha = (1.0 - blast_p) * 0.85

		# Vòng shockwave isometric
		var pts = PackedVector2Array()
		for i in range(25):
			var a = float(i) * TAU / 24.0
			pts.append(Vector2(cos(a) * r_outer, sin(a) * r_outer * 0.52))
		draw_polyline(pts, Color(1.0, 0.85, 0.25, b_alpha), 4.0)

		# Vòng lửa bên trong
		var pts_in = PackedVector2Array()
		for i in range(25):
			var a = float(i) * TAU / 24.0
			pts_in.append(Vector2(cos(a) * r_inner, sin(a) * r_inner * 0.52))
		draw_polyline(pts_in, Color(1.0, 0.45, 0.15, b_alpha * 0.9), 6.0)
