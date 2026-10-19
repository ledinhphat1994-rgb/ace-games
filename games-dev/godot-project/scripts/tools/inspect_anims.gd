extends SceneTree

func _init():
	var p = load("res://assets/models/towers/combat_turret.glb") as PackedScene
	var inst = p.instantiate() as Node3D
	var ap = inst.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if ap:
		print("Animations in glb: ", ap.get_animation_list())
		for anim_name in ap.get_animation_list():
			var anim = ap.get_animation(anim_name)
			print("Anim ", anim_name, " length: ", anim.length, " track count: ", anim.get_track_count())
			for t in range(min(5, anim.get_track_count())):
				print("   track ", t, ": ", anim.track_get_path(t))
	else:
		print("No AnimationPlayer found!")

	# Check materials and visibility of meshes under Armature
	var skel = inst.find_child("Skeleton3D", true, false) as Skeleton3D
	for c in skel.get_children():
		if c is MeshInstance3D:
			print("Mesh: ", c.name, " mat_override: ", c.material_override, " mat: ", c.get_active_material(0))

	quit(0)
