extends SceneTree

func _init():
	var vp = SubViewport.new()
	vp.size = Vector2i(256, 256)
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)

	var packed = load("res://assets/models/towers/combat_turret.glb") as PackedScene
	var model = packed.instantiate() as Node3D
	model.position = Vector3(0.0, -0.65, 0.0)
	vp.add_child(model)

	var env = Environment.new()
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.72, 0.78, 0.88)
	env.ambient_light_energy = 0.85
	var we = WorldEnvironment.new()
	we.environment = env
	vp.add_child(we)

	var sun = DirectionalLight3D.new()
	sun.light_color = Color(1.0, 0.96, 0.90)
	sun.light_energy = 1.35
	sun.rotation_degrees = Vector3(-45.0, 45.0, 0.0)
	vp.add_child(sun)

	var cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 3.6
	cam.position = Vector3(0.0, 1.45, 3.8)
	cam.rotation_degrees = Vector3(-28.0, 0.0, 0.0)
	cam.current = true
	vp.add_child(cam)

	var armature = model.find_child("Armature", true, false) as Node3D
	var baserotate = model.find_child("baserotate_low", true, false) as Node3D
	var skel = model.find_child("Skeleton3D", true, false) as Skeleton3D
	var bone_m1 = skel.find_bone("CannonMane1_end_07")

	for i in range(5):
		await process_frame

	# Test 8 angles of 2D diff:
	# 0 = East, 90 = South, 180 = West, 270 / -90 = North
	var test_angles = [0.0, 45.0, 90.0, 135.0, 180.0, 225.0, 270.0, 315.0]
	var dir_names = ["East", "SE", "South", "SW", "West", "NW", "North", "NE"]

	for idx in range(test_angles.size()):
		var deg_2d = test_angles[idx]
		var angle_2d = deg_to_rad(deg_2d)
		# Current AnimatedTower formula:
		var target_yaw_3d = -angle_2d + deg_to_rad(90.0)

		if armature:
			armature.rotation.y = target_yaw_3d
		if baserotate:
			baserotate.rotation.y = target_yaw_3d

		for f in range(3):
			await process_frame

		var img = vp.get_texture().get_image()
		var out_p = "C:/Users/lepha/.gemini/antigravity-ide/brain/8cad86fc-7bb1-481c-81ad-817e85557e4f/test_3d_%s.png" % dir_names[idx]
		img.save_png(out_p)

		# Check muzzle pos
		var m_3d = skel.to_global(skel.get_bone_global_pose(bone_m1).origin)
		var unp = cam.unproject_position(m_3d)
		print("%s (2D %d deg -> yaw %.1f deg): Muzzle3D=%s, VP_pos=%s" % [dir_names[idx], int(deg_2d), rad_to_deg(target_yaw_3d), str(m_3d), str(unp)])

	print("DONE RENDERING 8 ANGLES")
	quit(0)
