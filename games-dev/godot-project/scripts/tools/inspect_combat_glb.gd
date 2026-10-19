extends SceneTree

func _init():
	var p = load("res://assets/models/towers/combat_turret.glb") as PackedScene
	var inst = p.instantiate()
	print_tree_node(inst, "")
	quit(0)

func print_tree_node(n: Node, indent: String):
	var extra = ""
	if n is MeshInstance3D:
		extra = " [MeshInstance3D]"
	elif n is Skeleton3D:
		extra = " [Skeleton3D]"
		var skel = n as Skeleton3D
		for b in range(skel.get_bone_count()):
			extra += "\n" + indent + "    bone " + str(b) + ": " + skel.get_bone_name(b)
	elif n is BoneAttachment3D:
		extra = " [BoneAttachment3D]"
	print(indent + n.name + extra)
	for c in n.get_children():
		print_tree_node(c, indent + "  ")
