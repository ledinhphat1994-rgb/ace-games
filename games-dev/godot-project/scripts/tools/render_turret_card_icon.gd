extends SceneTree

func _init() -> void:
	var vp = SubViewport.new()
	vp.size = Vector2i(512, 512)
	vp.transparent_bg = true
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)

	var env = WorldEnvironment.new()
	var e = Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.7, 0.8, 0.95)
	env.environment = e
	vp.add_child(env)

	var light = DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-35.0, 45.0, 0.0)
	light.light_color = Color(1.0, 0.98, 0.94)
	light.light_energy = 1.3
	vp.add_child(light)

	var fill_light = DirectionalLight3D.new()
	fill_light.rotation_degrees = Vector3(20.0, -135.0, 0.0)
	fill_light.light_color = Color(0.2, 0.5, 0.9)
	fill_light.light_energy = 0.5
	vp.add_child(fill_light)

	var turret_cls = load("res://scripts/towers/CombatTurret3D.gd")
	var turret = turret_cls.new()
	turret.position = Vector3(0.0, -0.6, 0.0)
	turret.rotation_degrees = Vector3(0.0, 15.0, 0.0)
	vp.add_child(turret)

	var cam = Camera3D.new()
	cam.position = Vector3(0.0, 1.3, 3.8)
	cam.rotation_degrees = Vector3(-18.0, 0.0, 0.0)
	cam.current = true
	vp.add_child(cam)

	for i in range(5):
		await process_frame

	var img = vp.get_texture().get_image()
	var out_path = "res://assets/textures/cards/turret_combat_icon.png"
	var err = img.save_png(ProjectSettings.globalize_path(out_path))
	if err == OK:
		print("CARD_ICON_RENDERED: " + out_path)
	quit(0)
