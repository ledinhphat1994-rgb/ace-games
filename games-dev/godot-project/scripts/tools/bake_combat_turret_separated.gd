extends SceneTree

func _init() -> void:
	var out_dir = "res://assets/sprites/towers/combat"
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(out_dir))

	var vp = SubViewport.new()
	vp.size = Vector2i(640, 640)
	vp.transparent_bg = true
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)

	var env = WorldEnvironment.new()
	var e = Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.72, 0.78, 0.88)
	env.environment = e
	vp.add_child(env)

	# Nguồn sáng chính chuẩn Isometric
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-45.0, 45.0, 0.0)
	sun.light_color = Color(1.0, 0.96, 0.90)
	sun.light_energy = 1.35
	sun.shadow_enabled = true
	vp.add_child(sun)

	var fill = DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(25.0, -135.0, 0.0)
	fill.light_color = Color(0.25, 0.55, 0.90)
	fill.light_energy = 0.45
	vp.add_child(fill)

	var turret_cls = load("res://scripts/towers/CombatTurret3D.gd")
	var turret = turret_cls.new()
	turret.position = Vector3(0.0, -0.65, 0.0)
	vp.add_child(turret)

	var cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 3.6
	cam.position = Vector3(0.0, 1.45, 3.8)
	cam.rotation_degrees = Vector3(-28.0, 0.0, 0.0)
	cam.current = true
	vp.add_child(cam)

	for f in range(5):
		await process_frame

	var base_low = turret.find_child("base_low", true, false)
	var supports_low = turret.find_child("supports_low", true, false)
	var overitems_low = turret.find_child("overitems_low", true, false)
	var tripod_low = turret.find_child("tripod_low", true, false)
	var baserotate_low = turret.find_child("baserotate_low", true, false)
	var armature = turret.find_child("Armature", true, false)

	# BAKE 1: CHÂN ĐẾ TĨNH (BASE)
	if baserotate_low: baserotate_low.visible = false
	if armature: armature.visible = false
	turret.rotation_degrees.y = 0.0
	for f in range(2):
		await process_frame

	var base_img = vp.get_texture().get_image()
	base_img.save_png(ProjectSettings.globalize_path("%s/combat_base.png" % out_dir))
	print("Đã bake: combat_base.png")

	# BAKE 2: 32 HƯỚNG CỦA Ụ PHÁO XOAY (TURRET HEAD)
	if base_low: base_low.visible = false
	if supports_low: supports_low.visible = false
	if overitems_low: overitems_low.visible = false
	if tripod_low: tripod_low.visible = false
	if baserotate_low: baserotate_low.visible = true
	if armature: armature.visible = true

	for i in range(32):
		var angle_deg = float(i) * (360.0 / 32.0)
		turret.rotation_degrees.y = -angle_deg + 90.0

		for wait_f in range(2):
			await process_frame

		var head_img = vp.get_texture().get_image()
		var file_path = "%s/combat_head_dir_%d.png" % [out_dir, i]
		head_img.save_png(ProjectSettings.globalize_path(file_path))

	print("HOÀN TẤT BAKE CHÂN ĐẾ & 32 HƯỚNG NÒNG PHÁO COMBAT TURRET!")
	quit(0)
