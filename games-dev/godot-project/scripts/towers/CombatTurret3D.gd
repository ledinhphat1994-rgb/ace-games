class_name CombatTurret3D
extends Node3D

## CombatTurret3D: Tháp Pháo Phòng Thủ Chiến Thuật 3D Đa Nòng (Combat Turret)
## Sử dụng mô hình 3D combat_turret.glb nguyên khối với khung chân kiên cố & nòng pháo đôi giật lùi
## TUÂN THỦ NGHIÊM NGẶT QUY TẮC:
## 1. Ground Contact Invariant (Rule 4 & 12): Chân tháp tiếp xúc sát mặt đất (Y_contact = 0.0), không lơ lửng
## 2. Hoạt ảnh xương tích hợp: 'Action' (Bắn giật nòng đôi) & 'IDLE' (Chờ nhịp nhàng)
## 3. Tự động xoay nòng ngắm bắn quái vật 360° và bắn tia năng lượng chùm từ 2 đầu nòng

const MODEL_SCENE = preload("res://assets/models/towers/combat_turret.glb")
const Enemy3DClass = preload("res://scripts/3d/Enemy3D.gd")

@export var attack_range: float = 16.0
@export var attack_cooldown: float = 0.45
@export var base_damage: float = 35.0
@export var turn_speed: float = 14.0

var _cooldown_timer: float = 0.0
var _anim_player: AnimationPlayer = null
var _skeleton: Skeleton3D = null
var _bone_barrel_left: int = -1
var _bone_barrel_right: int = -1
var _barrel_toggle: bool = false
var _is_firing_anim: bool = false

var model_root: Node3D = null
var turret_head: Node3D = null
var current_target: Node3D = null
var is_selected: bool = false

# Hiệu ứng ánh sáng nòng súng
var muzzle_light_left: OmniLight3D = null
var muzzle_light_right: OmniLight3D = null

signal tower_fired(tower: Node3D, target: Node3D)

func _ready() -> void:
	_setup_model()
	_setup_muzzle_lights()

func _setup_model() -> void:
	if not MODEL_SCENE:
		push_error("[CombatTurret3D] Không tìm thấy combat_turret.glb!")
		return

	model_root = MODEL_SCENE.instantiate() as Node3D
	# Sát mặt đất 100% (Rule 4 & 12): Chân đế đặt tại Y = 0.0
	model_root.position = Vector3(0.0, 0.0, 0.0)
	model_root.scale = Vector3.ONE
	add_child(model_root)

	# Gán turret_head tham chiếu cho camera và hệ thống xoay
	turret_head = self

	# Tìm Skeleton và các nòng pháo
	_skeleton = model_root.find_child("Skeleton3D", true, false) as Skeleton3D
	if _skeleton:
		_bone_barrel_left = _skeleton.find_bone("CannonMane1_end_07")
		_bone_barrel_right = _skeleton.find_bone("CannonMane2_end_06")

	# Tìm AnimationPlayer và khởi động IDLE loop
	_anim_player = model_root.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if _anim_player:
		var idle_anim = _anim_player.get_animation("IDLE")
		if idle_anim:
			idle_anim.loop_mode = Animation.LOOP_LINEAR
		_anim_player.play("IDLE")
		_anim_player.animation_finished.connect(_on_animation_finished)

func _setup_muzzle_lights() -> void:
	# Đèn chớp lửa đầu nòng trái
	muzzle_light_left = OmniLight3D.new()
	muzzle_light_left.light_color = Color(0.2, 0.9, 1.0)
	muzzle_light_left.light_energy = 0.0
	muzzle_light_left.omni_range = 3.5
	add_child(muzzle_light_left)

	# Đèn chớp lửa đầu nòng phải
	muzzle_light_right = OmniLight3D.new()
	muzzle_light_right.light_color = Color(0.2, 0.9, 1.0)
	muzzle_light_right.light_energy = 0.0
	muzzle_light_right.omni_range = 3.5
	add_child(muzzle_light_right)

func _process(delta: float) -> void:
	if _cooldown_timer > 0.0:
		_cooldown_timer -= delta

	_update_target_and_aim(delta)

## Xoay thủ công khi ở góc nhìn Turret Camera
func rotate_turret_manually(delta_yaw: float) -> void:
	rotation.y += delta_yaw

## Cập nhật ngắm và khai hỏa
func _update_target_and_aim(delta: float) -> void:
	# Kiểm tra mục tiêu cũ còn hợp lệ
	if current_target and is_instance_valid(current_target):
		var dist = global_position.distance_to(current_target.global_position)
		if dist > attack_range or current_target.current_hp <= 0.0:
			current_target = null
	else:
		current_target = null

	# Tìm mục tiêu mới nếu chưa có
	if not current_target:
		current_target = _find_nearest_enemy()

	# Xoay nòng theo hướng mục tiêu
	if current_target and is_instance_valid(current_target):
		var target_pos = current_target.global_position
		var flat_target = Vector3(target_pos.x, global_position.y, target_pos.z)
		var desired_look = (flat_target - global_position).normalized()
		if desired_look.length_squared() > 0.001:
			var target_yaw = atan2(desired_look.x, desired_look.z)
			rotation.y = lerp_angle(rotation.y, target_yaw, delta * turn_speed)

		# Khai hỏa khi sẵn sàng
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
	# Kích hoạt hoạt ảnh bắn giật lùi (Action)
	if _anim_player:
		_is_firing_anim = true
		_anim_player.play("Action")

	# Luân chuyển nòng bắn (Left / Right) để tạo nhịp bắn liên thanh
	_barrel_toggle = not _barrel_toggle
	var muzzle_pos = get_muzzle_global_position(_barrel_toggle)
	var active_light = muzzle_light_left if not _barrel_toggle else muzzle_light_right

	# Hiệu ứng chớp lửa đầu nòng
	if active_light:
		active_light.global_position = muzzle_pos
		active_light.light_energy = 4.5
		var tw = create_tween()
		tw.tween_property(active_light, "light_energy", 0.0, 0.12)

	# Bắn tia năng lượng Photon Beam đến mục tiêu
	var hit_pos = target.global_position + Vector3(0.0, 0.6, 0.0)
	_spawn_combat_laser_beam(muzzle_pos, hit_pos)

	# Trừ máu quái vật
	if target.has_method("take_damage"):
		target.take_damage(base_damage)

	emit_signal("tower_fired", self, target)

func _on_animation_finished(anim_name: StringName) -> void:
	if anim_name == "Action":
		_is_firing_anim = false
		if _anim_player:
			_anim_player.play("IDLE")

## Lấy tọa độ đầu nòng súng chính xác theo Skeleton Bone
func get_muzzle_global_position(right_barrel: bool = false) -> Vector3:
	var bone_idx = _bone_barrel_right if right_barrel else _bone_barrel_left
	if _skeleton and bone_idx != -1:
		return _skeleton.to_global(_skeleton.get_bone_global_pose(bone_idx).origin)

	# Fallback tính toán hình học nếu chưa bind bone
	var offset_x = 0.24 if right_barrel else -0.01
	return global_transform * Vector3(offset_x, 1.41, 1.36)

## Hiệu ứng tia laser năng lượng xanh neon
func _spawn_combat_laser_beam(from_pos: Vector3, to_pos: Vector3) -> void:
	var dist = from_pos.distance_to(to_pos)
	if dist < 0.1:
		return

	var beam = MeshInstance3D.new()
	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.08
	cyl.bottom_radius = 0.08
	cyl.height = dist
	cyl.radial_segments = 8

	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.3, 0.95, 1.0)
	mat.emission_enabled = true
	mat.emission = Color(0.2, 0.9, 1.0)
	mat.emission_energy_multiplier = 4.0
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED

	beam.mesh = cyl
	beam.material_override = mat
	beam.position = (from_pos + to_pos) * 0.5

	if get_tree() and get_tree().current_scene:
		get_tree().current_scene.add_child(beam)
		beam.look_at(to_pos, Vector3.UP)
		beam.rotate_object_local(Vector3.RIGHT, deg_to_rad(90.0))
		get_tree().create_timer(0.09).timeout.connect(beam.queue_free)
	else:
		beam.free()
