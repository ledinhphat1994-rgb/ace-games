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

	# Nguồn sáng chính góc chiếu 35 độ từ Tây-Bắc (chuẩn Isometric của game)
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-45.0, 45.0, 0.0)
	sun.light_color = Color(1.0, 0.96, 0.90)
	sun.light_energy = 1.35
	sun.shadow_enabled = true
	vp.add_child(sun)

	# Nguồn sáng phụ xanh dương dịu
	var fill = DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(25.0, -135.0, 0.0)
	fill.light_color = Color(0.25, 0.55, 0.90)
	fill.light_energy = 0.45
	vp.add_child(fill)

	var turret_cls = load("res://scripts/towers/CombatTurret3D.gd")
	var turret = turret_cls.new()
	# Canh chỉnh tâm xoay của ụ pháo ngay giữa khung hình (320, 320)
	turret.position = Vector3(0.0, -0.65, 0.0)
	vp.add_child(turret)

	var cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 3.6
	cam.position = Vector3(0.0, 1.45, 3.8)
	cam.rotation_degrees = Vector3(-28.0, 0.0, 0.0)
	cam.current = true
	vp.add_child(cam)

	# Đợi 5 frame khởi động
	for f in range(5):
		await process_frame

	print("Bắt đầu bake 32 hướng cho Combat Turret...")
	# Trong game 2.5D:
	# Dir 0 = Đông (East, quay sang phải) -> góc 0 độ
	# Dir 8 = Nam (South, quay xuống dưới) -> góc 90 độ
	# Dir 16 = Tây (West, quay sang trái) -> góc 180 độ
	# Dir 24 = Bắc (North, quay lên trên) -> góc 270 độ
	for i in range(32):
		var angle_deg = float(i) * (360.0 / 32.0)
		# Chuyển đổi góc 2D sang góc quay Y của mô hình 3D (Z+ là phía trước)
		turret.rotation_degrees.y = -angle_deg + 90.0

		for wait_f in range(2):
			await process_frame

		var img = vp.get_texture().get_image()
		var file_path = "%s/combat_dir_%d.png" % [out_dir, i]
		var err = img.save_png(ProjectSettings.globalize_path(file_path))
		if err != OK:
			print("Lỗi lưu file: ", file_path)

	print("HOÀN TẤT BAKE 32 HƯỚNG COMBAT TURRET!")
	quit(0)
