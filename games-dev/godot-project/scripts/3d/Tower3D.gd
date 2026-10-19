class_name Tower3D
extends Node3D

## Tower3D: Tháp Phòng Thủ 3D Hiện Đại (Combat Turret 3D)
## Tích hợp mô hình 3D thực tế combat_turret.glb với khung chân kiên cố & nòng pháo đôi giật lùi
## TUÂN THỦ NGHIÊM NGẶT:
## 1. Ground Contact Invariant (Rule 4 & 12): Chân tháp bám sát mặt đất (Y_contact = 0.0), không lơ lửng
## 2. Hoạt ảnh tích hợp: 'Action' (Bắn giật nòng) & 'IDLE' (Chờ nhịp thở)
## 3. Hệ thống ngắm bắn 360° linh hoạt theo mục tiêu và bắn tia năng lượng chùm photon

const CombatTurretGLB = preload("res://assets/models/towers/combat_turret.glb")
const Enemy3DClass = preload("Enemy3D.gd")

@export var attack_range: float = 16.0
@export var attack_cooldown: float = 0.45
@export var base_damage: float = 35.0
@export var turn_speed: float = 14.0

var _cooldown_timer: float = 0.0
var _idle_time: float = 0.0
var _recoil: float = 0.0
var is_selected: bool = false
var _barrel_toggle: bool = false

# Node tham chiếu
var turret_head: Node3D = null
var crystal_orb: MeshInstance3D = null
var crystal_mat: StandardMaterial3D = null
var barrel_mesh_instance: MeshInstance3D = null
var selection_ring: MeshInstance3D = null

# Tham chiếu mô hình 3D combat_turret.glb
var model_instance: Node3D = null
var anim_player: AnimationPlayer = null
var skeleton: Skeleton3D = null
var bone_barrel_left: int = -1
var bone_barrel_right: int = -1

# Mục tiêu hiện tại
var current_target: Node3D = null

signal tower_fired(tower: Node3D, target: Node3D)

func _ready() -> void:
	_build_combat_turret()

func _process(delta: float) -> void:
	_idle_time += delta

	# Đếm ngược thời gian hồi đạn
	if _cooldown_timer > 0.0:
		_cooldown_timer -= delta

	# Tìm kiếm và ngắm bắn mục tiêu
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
		if desired_look.length_squared() > 0.001:
			var target_yaw = atan2(desired_look.x, desired_look.z)
			turret_head.rotation.y = lerp_angle(turret_head.rotation.y, target_yaw, delta * turn_speed)

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

	# Phát hoạt ảnh bắn giật nòng Action
	if anim_player:
		anim_player.play("Action")

	# Đổi nòng bắn trái / phải luân phiên
	_barrel_toggle = not _barrel_toggle
	var muzzle_pos = _get_muzzle_position(_barrel_toggle)
	var hit_pos = target.global_position + Vector3(0.0, 0.6, 0.0)

	# Bắn tia photon năng lượng từ đầu nòng đến mục tiêu
	_spawn_laser_beam(muzzle_pos, hit_pos)
	target.take_damage(base_damage)

	emit_signal("tower_fired", self, target)

func _get_muzzle_position(right_barrel: bool) -> Vector3:
	var bone_idx = bone_barrel_right if right_barrel else bone_barrel_left
	if skeleton and bone_idx != -1:
		return skeleton.to_global(skeleton.get_bone_global_pose(bone_idx).origin)

	# Fallback theo transform của turret_head
	if turret_head:
		var x_offset = 0.24 if right_barrel else -0.01
		return turret_head.global_transform * Vector3(x_offset, 1.41, 1.36)
	return global_position + Vector3(0.0, 1.4, 0.0)

## Hiệu ứng tia laser năng lượng 3D nối giữa tháp và quái vật
func _spawn_laser_beam(from_pos: Vector3, to_pos: Vector3) -> void:
	var dist = from_pos.distance_to(to_pos)
	if dist < 0.1:
		return

	var beam = MeshInstance3D.new()
	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.1
	cyl.bottom_radius = 0.1
	cyl.height = dist
	cyl.radial_segments = 6

	var beam_mat = StandardMaterial3D.new()
	beam_mat.albedo_color = Color(0.2, 0.9, 1.0)
	beam_mat.emission_enabled = true
	beam_mat.emission = Color(0.1, 0.95, 1.0)
	beam_mat.emission_energy_multiplier = 4.0
	beam_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED

	beam.mesh = cyl
	beam.material_override = beam_mat
	beam.position = (from_pos + to_pos) * 0.5
	if get_tree() and get_tree().current_scene:
		get_tree().current_scene.add_child(beam)
		beam.look_at(to_pos, Vector3.UP)
		beam.rotate_object_local(Vector3.RIGHT, deg_to_rad(90.0))
		get_tree().create_timer(0.08).timeout.connect(beam.queue_free)
	else:
		beam.free()

## Khởi tạo mô hình Tháp Pháo 3D từ combat_turret.glb
func _build_combat_turret() -> void:
	turret_head = Node3D.new()
	turret_head.name = "TurretHead"
	add_child(turret_head)

	if CombatTurretGLB:
		model_instance = CombatTurretGLB.instantiate() as Node3D
		# Sát mặt đất 100% (Rule 4 & 12 Ground Contact Invariant)
		model_instance.position = Vector3(0.0, 0.0, 0.0)
		model_instance.scale = Vector3.ONE
		turret_head.add_child(model_instance)

		# Tìm Skeleton và các nòng pháo
		skeleton = model_instance.find_child("Skeleton3D", true, false) as Skeleton3D
		if skeleton:
			bone_barrel_left = skeleton.find_bone("CannonMane1_end_07")
			bone_barrel_right = skeleton.find_bone("CannonMane2_end_06")

		# Tìm AnimationPlayer và khởi chạy IDLE
		anim_player = model_instance.find_child("AnimationPlayer", true, false) as AnimationPlayer
		if anim_player:
			var idle_anim = anim_player.get_animation("IDLE")
			if idle_anim:
				idle_anim.loop_mode = Animation.LOOP_LINEAR
			anim_player.play("IDLE")
			anim_player.animation_finished.connect(func(anim_name: StringName):
				if anim_name == "Action" and anim_player:
					anim_player.play("IDLE")
			)

	# Vòng đèn LED công nghệ dưới chân tháp (sát mặt đất Y=0.02)
	var ring_mesh = TorusMesh.new()
	ring_mesh.inner_radius = 1.6
	ring_mesh.outer_radius = 1.75
	var ring_inst = MeshInstance3D.new()
	ring_inst.mesh = ring_mesh
	var ring_mat = StandardMaterial3D.new()
	ring_mat.albedo_color = Color(0.0, 0.85, 1.0)
	ring_mat.emission_enabled = true
	ring_mat.emission = Color(0.0, 0.9, 1.0)
	ring_mat.emission_energy_multiplier = 2.0
	ring_inst.material_override = ring_mat
	ring_inst.position = Vector3(0.0, 0.02, 0.0)
	add_child(ring_inst)
