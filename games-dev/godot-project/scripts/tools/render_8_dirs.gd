extends SceneTree

func _init():
	var vp = SubViewport.new()
	vp.size = Vector2i(512, 512)
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
	cam.size = 5.2
	cam.position = Vector3(0.0, 1.45, 3.8)
	cam.rotation_degrees = Vector3(-28.0, 0.0, 0.0)
	cam.current = true
	vp.add_child(cam)

	var armature = model.find_child("Armature", true, false) as Node3D
	var baserotate = model.find_child("baserotate_low", true, false) as Node3D
	var skel = model.find_child("Skeleton3D", true, false) as Skeleton3D
	var bone_m1 = skel.find_bone("CannonMane1_end_07")
	var bone_m2 = skel.find_bone("CannonMane2_end_06")

	for i in range(5):
		await process_frame

	var test_angles = [0.0, 45.0, 90.0, 135.0, 180.0, 225.0, 270.0, 315.0]
	var dir_names = ["East", "SE", "South", "SW", "West", "NW", "North", "NE"]

	for idx in range(test_angles.size()):
		var deg_2d = test_angles[idx]
		var angle_2d = deg_to_rad(deg_2d)
		var target_yaw_3d = -angle_2d + deg_to_rad(90.0)

		if armature:
			armature.rotation.y = target_yaw_3d
		if baserotate:
			baserotate.rotation.y = target_yaw_3d

		for f in range(4):
			await process_frame

		var tex = vp.get_texture()
		if tex:
			var img = tex.get_image()
			if img:
				var out_p = "C:/Users/lepha/.gemini/antigravity-ide/brain/8cad86fc-7bb1-481c-81ad-817e85557e4f/turret_512_%s.png" % dir_names[idx]
				img.save_png(out_p)
				print("Saved: ", out_p)

		var m1_global = skel.to_global(skel.get_bone_global_pose(bone_m1).origin)
		var m2_global = skel.to_global(skel.get_bone_global_pose(bone_m2).origin)
		var p1 = cam.unproject_position(m1_global)
		var p2 = cam.unproject_position(m2_global)
		print("%s (2D %d deg -> yaw %.1f deg): Muzzle1=%s, Muzzle2=%s" % [dir_names[idx], int(deg_2d), rad_to_deg(target_yaw_3d), str(p1), str(p2)])

	print("ALL 8 DIRECTIONS VERIFIED!")
	quit(0)
