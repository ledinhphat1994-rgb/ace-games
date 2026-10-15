class_name Tower3D
extends Node3D

## Tower3D: Tháp Phòng Thủ 3D Low-Poly (Hexagon Crystal Turret)
## Dựng hoàn toàn bằng code procedural:
## 1. Bệ tháp hình trụ lục giác (Hexagon: 6 cạnh vát phẳng)
## 2. Nòng súng đại bác xoay theo trục Y hướng về mục tiêu
## 3. Lõi pha lê bay lơ lửng ở đỉnh tháp tự xoay tròn & phát sáng nhịp nhàng
## 4. Bắn tia năng lượng chùm photon vào quái vật trong tầm bắn

const Enemy3DClass = preload("Enemy3D.gd")

@export var attack_range: float = 14.0
@export var attack_cooldown: float = 0.55
@export var base_damage: float = 24.0

var _cooldown_timer: float = 0.0
var _idle_time: float = 0.0
var _recoil: float = 0.0
var is_selected: bool = false

# Node tham chiếu
var turret_head: Node3D = null
var crystal_orb: MeshInstance3D = null
var crystal_mat: StandardMaterial3D = null
var barrel_mesh_instance: MeshInstance3D = null
var selection_ring: MeshInstance3D = null

# Mục tiêu hiện tại
var current_target: Node3D = null

signal tower_fired(tower: Node3D, target: Node3D)

func _ready() -> void:
	_build_hexagon_tower()

func _process(delta: float) -> void:
	_idle_time += delta

	# 1. Hiệu ứng lõi pha lê bay lơ lửng & xoay tròn ở đỉnh tháp
	if crystal_orb:
		crystal_orb.position.y = 2.4 + sin(_idle_time * 3.5) * 0.18
		crystal_orb.rotation.y += delta * 2.2
		crystal_orb.rotation.x = sin(_idle_time * 2.0) * 0.15

	# 2. Hồi phục nòng súng sau khi giật (Recoil recovery)
	if _recoil > 0.0:
		_recoil = maxf(0.0, _recoil - delta * 6.0)
		if barrel_mesh_instance:
			barrel_mesh_instance.position.z = 0.8 - _recoil * 0.25

	# 3. Đếm ngược thời gian hồi đạn
	if _cooldown_timer > 0.0:
		_cooldown_timer -= delta

	# 4. Tìm kiếm và ngắm bắn mục tiêu
	_update_target_and_aim(delta)

## Xoay nòng súng thủ công khi người chơi ở chế độ Turret View
func rotate_turret_manually(delta_yaw: float) -> void:
	if turret_head:
		turret_head.rotation.y += delta_yaw

func _update_target_and_aim(delta: float) -> void:
	# Kiểm tra mục tiêu cũ có còn hợp lệ không
	if current_target and is_instance_valid(current_target):
		var dist = global_position.distance_to(current_target.global_position)
		if dist > attack_range or current_target.current_hp <= 0.0:
			current_target = null
	else:
		current_target = null

	# Nếu chưa có mục tiêu, quét tìm quái vật gần nhất trong tầm bắn
	if not current_target:
		current_target = _find_nearest_enemy()

	# Nếu có mục tiêu hợp lệ, xoay nòng theo trục Y ngắm bắn
	if current_target and is_instance_valid(current_target) and turret_head:
		var target_pos = current_target.global_position
		var flat_target = Vector3(target_pos.x, turret_head.global_position.y, target_pos.z)
		var desired_look = (flat_target - turret_head.global_position).normalized()
		if desired_look.length_squared() > 0.01:
			var target_yaw = atan2(desired_look.x, desired_look.z)
			turret_head.rotation.y = lerp_angle(turret_head.rotation.y, target_yaw, delta * 12.0)

		# Khai hỏa khi đã sẵn sàng
		if _cooldown_timer <= 0.0:
			_cooldown_timer = attack_cooldown
			_fire_at(current_target)

func _find_nearest_enemy() -> Node3D:
	var enemies = get_tree().get_nodes_in_group("enemies_3d")
	var best_enemy: Node3D = null
	var min_dist: float = attack_range
	for e in enemies:
		if is_instance_valid(e) and e is Enemy3DClass and e.current_hp > 0.0:
			var d = global_position.distance_to(e.global_position)
			if d < min_dist:
				min_dist = d
				best_enemy = e
	return best_enemy

func _fire_at(target: Node3D) -> void:
	_recoil = 1.0

	# Bùng sáng lõi pha lê
	if crystal_mat:
		crystal_mat.emission_energy_multiplier = 4.0
		get_tree().create_timer(0.12).timeout.connect(func():
			if crystal_mat: crystal_mat.emission_energy_multiplier = 2.0
		)

	# Bắn tia năng lượng Photon Beam 3D từ nòng súng đến quái vật
	if turret_head and target and is_instance_valid(target):
		var muzzle_pos = turret_head.global_position + turret_head.global_transform.basis.z * 1.6 + Vector3(0.0, 0.4, 0.0)
		_spawn_laser_beam(muzzle_pos, target.global_position + Vector3(0.0, 0.6, 0.0))
		target.take_damage(base_damage)

	emit_signal("tower_fired", self, target)

## Hiệu ứng tia laser năng lượng 3D nối giữa tháp và quái vật
func _spawn_laser_beam(from_pos: Vector3, to_pos: Vector3) -> void:
	var dist = from_pos.distance_to(to_pos)
	var mid = (from_pos + to_pos) * 0.5

	var beam = MeshInstance3D.new()
	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.12
	cyl.bottom_radius = 0.12
	cyl.height = dist
	cyl.radial_segments = 6

	var beam_mat = StandardMaterial3D.new()
	beam_mat.albedo_color = Color(0.2, 0.9, 1.0)
	beam_mat.emission_enabled = true
	beam_mat.emission = Color(0.1, 0.95, 1.0)
	beam_mat.emission_energy_multiplier = 3.5

	beam.mesh = cyl
	beam.material_override = beam_mat
	beam.position = mid
	if get_tree() and get_tree().current_scene:
		get_tree().current_scene.add_child(beam)
		beam.look_at(to_pos, Vector3.UP)
		beam.rotate_object_local(Vector3.RIGHT, deg_to_rad(90.0))
		get_tree().create_timer(0.08).timeout.connect(beam.queue_free)
	else:
		beam.free()

## Dựng mô hình Tháp Low-Poly Lục Giác
func _build_hexagon_tower() -> void:
	# 1. Bệ tháp hình trụ lục giác (Hexagonal Base: 6 cạnh)
	var base_mesh = CylinderMesh.new()
	base_mesh.top_radius = 1.2
	base_mesh.bottom_radius = 1.35
	base_mesh.height = 0.8
	base_mesh.radial_segments = 6

	var base_mat = StandardMaterial3D.new()
	base_mat.albedo_color = Color(0.18, 0.22, 0.30) # Kim loại công nghệ
	base_mat.metallic = 0.8
	base_mat.roughness = 0.35

	var base_inst = MeshInstance3D.new()
	base_inst.mesh = base_mesh
	base_inst.material_override = base_mat
	base_inst.position = Vector3(0.0, 0.4, 0.0)
	add_child(base_inst)

	# Vòng đèn LED chân tháp
	var ring_mesh = TorusMesh.new()
	ring_mesh.inner_radius = 1.22
	ring_mesh.outer_radius = 1.36
	var ring_inst = MeshInstance3D.new()
	ring_inst.mesh = ring_mesh
	var ring_mat = StandardMaterial3D.new()
	ring_mat.albedo_color = Color(0.0, 0.85, 1.0)
	ring_mat.emission_enabled = true
	ring_mat.emission = Color(0.0, 0.9, 1.0)
	ring_mat.emission_energy_multiplier = 1.5
	ring_inst.material_override = ring_mat
	ring_inst.position = Vector3(0.0, 0.1, 0.0)
	add_child(ring_inst)

	# 2. Cụm nòng súng xoay (Turret Head)
	turret_head = Node3D.new()
	turret_head.position = Vector3(0.0, 0.8, 0.0)
	turret_head.name = "TurretHead"
	add_child(turret_head)

	# Ổ trục tháp
	var pivot_mesh = CylinderMesh.new()
	pivot_mesh.top_radius = 0.75
	pivot_mesh.bottom_radius = 0.8
	pivot_mesh.height = 0.6
	pivot_mesh.radial_segments = 6
	var pivot_inst = MeshInstance3D.new()
	pivot_inst.mesh = pivot_mesh
	pivot_inst.material_override = base_mat
	pivot_inst.position = Vector3(0.0, 0.3, 0.0)
	turret_head.add_child(pivot_inst)

	# Nòng đại bác đôi (Dual Barrels)
	var barrel_mesh = CylinderMesh.new()
	barrel_mesh.top_radius = 0.16
	barrel_mesh.bottom_radius = 0.18
	barrel_mesh.height = 1.5
	barrel_mesh.radial_segments = 6

	var barrel_mat = StandardMaterial3D.new()
	barrel_mat.albedo_color = Color(0.25, 0.28, 0.35)
	barrel_mat.metallic = 0.9

	barrel_mesh_instance = MeshInstance3D.new()
	barrel_mesh_instance.mesh = barrel_mesh
	barrel_mesh_instance.material_override = barrel_mat
	# Quay nòng nằm ngang hướng về phía trước (Z dương)
	barrel_mesh_instance.rotation.x = deg_to_rad(90.0)
	barrel_mesh_instance.position = Vector3(0.0, 0.45, 0.8)
	turret_head.add_child(barrel_mesh_instance)

	# 3. Lõi pha lê năng lượng bay lơ lửng ở đỉnh (Floating Crystal Core)
	crystal_mat = StandardMaterial3D.new()
	crystal_mat.albedo_color = Color(0.1, 0.9, 1.0)
	crystal_mat.emission_enabled = true
	crystal_mat.emission = Color(0.0, 0.95, 1.0)
	crystal_mat.emission_energy_multiplier = 2.0
	crystal_mat.roughness = 0.1

	var crystal_mesh = PrismMesh.new()
	crystal_mesh.size = Vector3(0.7, 1.0, 0.7)

	crystal_orb = MeshInstance3D.new()
	crystal_orb.mesh = crystal_mesh
	crystal_orb.material_override = crystal_mat
	crystal_orb.position = Vector3(0.0, 2.4, 0.0)
	add_child(crystal_orb)
