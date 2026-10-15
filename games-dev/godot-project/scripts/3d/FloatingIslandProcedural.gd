class_name FloatingIslandProcedural
extends Node3D

## FloatingIslandProcedural: Sinh Môi trường Đảo Bay Low-Poly & Đường ray Quái vật
## Dựng hòn đảo lơ lửng phong cách Stylized Low-Poly:
## 1. Mặt đảo bằng phẳng phủ cỏ xanh tươi sáng & đường mòn uốn lượn
## 2. Vách đá đáy đảo vát nhọn Low-Poly chìm trong mây trời
## 3. Các đảo vệ tinh nhỏ trôi bồng bềnh xung quanh
## 4. Đường cong Path3D dẫn đường cho quái vật từ Cổng Portal đến Căn Cứ

@onready var path_3d: Path3D = null

# Danh sách tọa độ 4 bệ đặt tháp dọc hai bên con đường
const BUILD_SPOTS: Array[Vector3] = [
	Vector3(-6.0, 0.3, -2.5),
	Vector3(-1.5, 0.3, 3.2),
	Vector3(3.5, 0.3, -2.8),
	Vector3(7.5, 0.3, 2.5)
]

func _ready() -> void:
	_build_main_island()
	_build_path_3d()
	_build_decorations_and_satellites()

## 1. Dựng khối đảo bay chính
func _build_main_island() -> void:
	# Khối đất mặt trên (Cỏ xanh Low-Poly)
	var top_mesh = CylinderMesh.new()
	top_mesh.top_radius = 12.0
	top_mesh.bottom_radius = 11.5
	top_mesh.height = 1.2
	top_mesh.radial_segments = 14 # 14 cạnh tạo phong cách Low-Poly vát phẳng

	var grass_mat = StandardMaterial3D.new()
	grass_mat.albedo_color = Color(0.32, 0.74, 0.34) # Xanh cỏ phong cách Stylized
	grass_mat.roughness = 0.85
	grass_mat.specular_mode = BaseMaterial3D.SPECULAR_DISABLED

	var top_instance = MeshInstance3D.new()
	top_instance.mesh = top_mesh
	top_instance.material_override = grass_mat
	top_instance.position = Vector3(0.0, 0.0, 0.0)
	top_instance.scale = Vector3(1.3, 1.0, 0.85) # Kéo dẹt tạo dáng hòn đảo dài
	add_child(top_instance)

	# Vách đá nhọn bên dưới (Cliff Underside)
	var bottom_cone = CylinderMesh.new()
	bottom_cone.top_radius = 11.5
	bottom_cone.bottom_radius = 0.8
	bottom_cone.height = 7.5
	bottom_cone.radial_segments = 12

	var rock_mat = StandardMaterial3D.new()
	rock_mat.albedo_color = Color(0.42, 0.35, 0.30) # Nâu đá Low-Poly
	rock_mat.roughness = 0.95

	var bottom_instance = MeshInstance3D.new()
	bottom_instance.mesh = bottom_cone
	bottom_instance.material_override = rock_mat
	bottom_instance.position = Vector3(0.0, -4.2, 0.0)
	bottom_instance.scale = Vector3(1.25, 1.0, 0.8)
	add_child(bottom_instance)

	# Bệ đặt tháp chiến thuật (Build Pads)
	var pad_mesh = CylinderMesh.new()
	pad_mesh.top_radius = 1.3
	pad_mesh.bottom_radius = 1.4
	pad_mesh.height = 0.3
	pad_mesh.radial_segments = 6 # Bát giác / lục giác

	var pad_mat = StandardMaterial3D.new()
	pad_mat.albedo_color = Color(0.22, 0.32, 0.45)
	pad_mat.metallic = 0.4
	pad_mat.emission_enabled = true
	pad_mat.emission = Color(0.0, 0.85, 1.0)
	pad_mat.emission_energy_multiplier = 0.4

	for spot in BUILD_SPOTS:
		var pad_node = MeshInstance3D.new()
		pad_node.mesh = pad_mesh
		pad_node.material_override = pad_mat
		pad_node.position = spot
		pad_node.name = "BuildPad"
		add_child(pad_node)

## 2. Dựng đường ray di chuyển Path3D uốn lượn
func _build_path_3d() -> void:
	path_3d = Path3D.new()
	path_3d.name = "MonsterPath"

	var curve = Curve3D.new()
	# Tạo đường uốn lượn hình chữ S trên mặt đảo từ trái qua phải
	curve.add_point(Vector3(-14.0, 0.65, 0.0), Vector3.ZERO, Vector3(2.5, 0.0, 2.5))
	curve.add_point(Vector3(-8.0, 0.65, 2.8), Vector3(-2.0, 0.0, -1.0), Vector3(2.5, 0.0, -2.5))
	curve.add_point(Vector3(-1.0, 0.65, -2.6), Vector3(-2.5, 0.0, 2.0), Vector3(2.5, 0.0, 2.0))
	curve.add_point(Vector3(6.0, 0.65, 2.2), Vector3(-2.0, 0.0, -2.0), Vector3(2.0, 0.0, -1.5))
	curve.add_point(Vector3(14.0, 0.65, 0.0), Vector3(-2.0, 0.0, 1.0), Vector3.ZERO)

	path_3d.curve = curve
	add_child(path_3d)

	# Dựng mô hình trực quan con đường cát vàng uốn lượn bằng các đoạn ống phẳng (Road ribbon)
	var road_mat = StandardMaterial3D.new()
	road_mat.albedo_color = Color(0.86, 0.74, 0.52) # Cát vàng sáng
	road_mat.roughness = 0.9

	var sample_points = curve.tessellate(5, 4.0)
	for i in range(sample_points.size() - 1):
		var p1 = sample_points[i]
		var p2 = sample_points[i + 1]
		var seg_len = p1.distance_to(p2)
		var seg_mid = (p1 + p2) * 0.5

		var road_mesh = BoxMesh.new()
		road_mesh.size = Vector3(2.2, 0.12, seg_len)

		var road_inst = MeshInstance3D.new()
		road_inst.mesh = road_mesh
		road_inst.material_override = road_mat
		road_inst.position = seg_mid
		add_child(road_inst)
		road_inst.look_at(p2, Vector3.UP)

## 3. Cổng xuất phát (Spawn Portal) & Căn cứ (Citadel Fortress) & Đảo vệ tinh
func _build_decorations_and_satellites() -> void:
	# 1. Cổng Portal ở đầu bên trái (-13.5, 0.65, 0.0)
	var portal_base = MeshInstance3D.new()
	var portal_mesh = TorusMesh.new()
	portal_mesh.inner_radius = 1.2
	portal_mesh.outer_radius = 1.8
	portal_base.mesh = portal_mesh
	portal_base.position = Vector3(-13.5, 2.2, 0.0)
	portal_base.rotation.y = deg_to_rad(90.0)

	var portal_mat = StandardMaterial3D.new()
	portal_mat.albedo_color = Color(0.1, 0.2, 0.4)
	portal_mat.emission_enabled = true
	portal_mat.emission = Color(0.2, 0.8, 1.0)
	portal_mat.emission_energy_multiplier = 2.5
	portal_base.material_override = portal_mat
	add_child(portal_base)

	# 2. Căn cứ phòng thủ / Lâu đài Citadel ở đầu bên phải (13.5, 0.65, 0.0)
	var fort_base = MeshInstance3D.new()
	var fort_mesh = BoxMesh.new()
	fort_mesh.size = Vector3(3.5, 4.0, 3.5)
	fort_base.mesh = fort_mesh
	fort_base.position = Vector3(13.5, 2.4, 0.0)

	var fort_mat = StandardMaterial3D.new()
	fort_mat.albedo_color = Color(0.25, 0.35, 0.48)
	fort_mat.metallic = 0.5
	fort_base.material_override = fort_mat
	add_child(fort_base)

	# Mái chóp pha lê trên đỉnh lâu đài
	var roof_mesh = PrismMesh.new()
	roof_mesh.size = Vector3(3.2, 2.5, 3.2)
	var roof_inst = MeshInstance3D.new()
	roof_inst.mesh = roof_mesh
	roof_inst.position = Vector3(13.5, 5.5, 0.0)

	var roof_mat = StandardMaterial3D.new()
	roof_mat.albedo_color = Color(0.1, 0.6, 0.9)
	roof_mat.emission_enabled = true
	roof_mat.emission = Color(0.1, 0.85, 1.0)
	roof_mat.emission_energy_multiplier = 1.5
	roof_inst.material_override = roof_mat
	add_child(roof_inst)

	# 3. Ba hòn đảo vệ tinh bay lơ lửng xung quanh (Floating Islets)
	var satellite_offsets = [
		Vector3(-18.0, 3.0, -12.0),
		Vector3(15.0, 4.5, -14.0),
		Vector3(-2.0, -2.5, 16.0)
	]

	for sat_pos in satellite_offsets:
		var sat_top = CylinderMesh.new()
		sat_top.top_radius = 3.5
		sat_top.bottom_radius = 3.2
		sat_top.height = 0.8
		sat_top.radial_segments = 8

		var sat_cone = CylinderMesh.new()
		sat_cone.top_radius = 3.2
		sat_cone.bottom_radius = 0.4
		sat_cone.height = 3.2
		sat_cone.radial_segments = 7

		var sat_group = Node3D.new()
		sat_group.position = sat_pos

		var m1 = MeshInstance3D.new()
		m1.mesh = sat_top
		var g_mat = StandardMaterial3D.new()
		g_mat.albedo_color = Color(0.35, 0.78, 0.38)
		m1.material_override = g_mat
		sat_group.add_child(m1)

		var m2 = MeshInstance3D.new()
		m2.mesh = sat_cone
		var r_mat = StandardMaterial3D.new()
		r_mat.albedo_color = Color(0.40, 0.32, 0.28)
		m2.material_override = r_mat
		m2.position = Vector3(0.0, -1.8, 0.0)
		sat_group.add_child(m2)

		add_child(sat_group)

	# 4. Các đám mây trắng Low-Poly bồng bềnh dưới chân đảo
	var cloud_mat = StandardMaterial3D.new()
	cloud_mat.albedo_color = Color(0.96, 0.98, 1.0)
	cloud_mat.roughness = 0.9

	var cloud_positions = [
		Vector3(-9.0, -5.5, 7.0),
		Vector3(8.0, -6.0, -6.0),
		Vector3(-14.0, -4.5, -8.0),
		Vector3(13.0, -5.0, 8.0),
		Vector3(0.0, -6.5, 11.0),
		Vector3(-5.0, -6.8, -11.0)
	]

	for c_pos in cloud_positions:
		var c_node = Node3D.new()
		c_node.position = c_pos
		for b in range(3):
			var b_mesh = BoxMesh.new()
			var s_val = 3.2 - float(b) * 0.4
			b_mesh.size = Vector3(s_val * 1.3, s_val * 0.75, s_val)
			var b_inst = MeshInstance3D.new()
			b_inst.mesh = b_mesh
			b_inst.material_override = cloud_mat
			b_inst.position = Vector3(float(b) * 1.4 - 1.4, 0.0, float(b) * 0.4 - 0.4)
			c_node.add_child(b_inst)
		add_child(c_node)
