class_name Enemy3D
extends PathFollow3D

## Enemy3D: Quái vật Robot Cơ khí Low-Poly di chuyển trên Path3D
## Tạo hoàn toàn bằng code procedural geometry:
## - Thân hình khối đa giác kim loại công nghệ
## - Đầu robot với mắt phát sáng đèn LED đỏ/cam nhấp nháy
## - Cặp chân/bánh đà xoay và ống xả phản lực
## - Thanh máu 3D trên đầu & hiệu ứng nổ hạt khi tiêu diệt

@export var max_hp: float = 60.0
var current_hp: float = 60.0
@export var move_speed: float = 4.2
@export var gold_reward: int = 25

var _time_alive: float = 0.0
var _hit_flash: float = 0.0

# Node tham chiếu
var visual_root: Node3D = null
var eye_material: StandardMaterial3D = null
var body_material: StandardMaterial3D = null
var hp_bar_fill: MeshInstance3D = null

signal enemy_died(enemy: Node3D, reward: int)
signal enemy_escaped(enemy: Node3D)

func _ready() -> void:
	current_hp = max_hp
	loop = false
	rotation_mode = PathFollow3D.ROTATION_ORIENTED

	_build_robot_model()
	_build_health_bar()

func _process(delta: float) -> void:
	_time_alive += delta

	# Di chuyển dọc theo đường cong Path3D
	progress += move_speed * delta

	# Kiểm tra nếu đã đến đích cuối cùng của đường ray
	if progress_ratio >= 0.99:
		emit_signal("enemy_escaped", self)
		queue_free()
		return

	# Hiệu ứng chuyển động bước đi / bập bồng nhịp nhàng
	if visual_root:
		visual_root.position.y = 0.5 + sin(_time_alive * 9.0) * 0.12
		visual_root.rotation.z = sin(_time_alive * 6.0) * 0.08

	# Nhấp nháy đèn LED mắt robot
	if eye_material:
		var blink = 1.0 + sin(_time_alive * 12.0) * 0.4
		eye_material.emission_energy_multiplier = blink * (3.0 if _hit_flash <= 0.0 else 6.0)

	# Giảm dần hiệu ứng chớp khi bị bắn trúng
	if _hit_flash > 0.0:
		_hit_flash = maxf(0.0, _hit_flash - delta * 5.0)
		if body_material:
			body_material.albedo_color = Color(0.35, 0.4, 0.45).lerp(Color.WHITE, _hit_flash * 0.7)

## Dựng mô hình Robot bằng hoạt ảnh MoCap 3D chuyên nghiệp
func _build_robot_model() -> void:
	visual_root = Node3D.new()
	visual_root.name = "Visual"
	add_child(visual_root)

	var walk_packed = load("res://assets/motions/walk_loop_inplace.glb") as PackedScene
	if walk_packed:
		var model = walk_packed.instantiate()
		model.scale = Vector3(0.65, 0.65, 0.65)
		model.rotation.y = PI
		visual_root.add_child(model)

		var anim_player = _find_anim_player(model)
		if anim_player:
			var anim_list = anim_player.get_animation_list()
			if anim_list.size() > 0:
				var anim = anim_player.get_animation(anim_list[0])
				if anim:
					anim.loop_mode = Animation.LOOP_LINEAR
				anim_player.play(anim_list[0])
	else:
		_build_fallback_boxes()

func _find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var found = _find_anim_player(child)
		if found:
			return found
	return null

func _build_fallback_boxes() -> void:
	body_material = StandardMaterial3D.new()
	body_material.albedo_color = Color(0.35, 0.4, 0.45)
	body_material.metallic = 0.7
	body_material.roughness = 0.4

	var torso_mesh = BoxMesh.new()
	torso_mesh.size = Vector3(0.9, 0.8, 0.7)
	var torso = MeshInstance3D.new()
	torso.mesh = torso_mesh
	torso.material_override = body_material
	torso.position = Vector3(0.0, 0.6, 0.0)
	visual_root.add_child(torso)

	var head_mesh = BoxMesh.new()
	head_mesh.size = Vector3(0.65, 0.5, 0.55)
	var head = MeshInstance3D.new()
	head.mesh = head_mesh
	head.material_override = body_material
	head.position = Vector3(0.0, 1.25, 0.0)
	visual_root.add_child(head)

	eye_material = StandardMaterial3D.new()
	eye_material.albedo_color = Color(1.0, 0.2, 0.1)
	eye_material.emission_enabled = true
	eye_material.emission = Color(1.0, 0.25, 0.05)
	eye_material.emission_energy_multiplier = 2.5

	var visor_mesh = BoxMesh.new()
	visor_mesh.size = Vector3(0.5, 0.18, 0.15)
	var visor = MeshInstance3D.new()
	visor.mesh = visor_mesh
	visor.material_override = eye_material
	visor.position = Vector3(0.0, 1.28, 0.28)
	visual_root.add_child(visor)

	var wheel_mesh = CylinderMesh.new()
	wheel_mesh.top_radius = 0.3
	wheel_mesh.bottom_radius = 0.3
	wheel_mesh.height = 0.25
	wheel_mesh.radial_segments = 8

	var wheel_mat = StandardMaterial3D.new()
	wheel_mat.albedo_color = Color(0.18, 0.2, 0.22)
	wheel_mat.metallic = 0.8

	for side in [-0.55, 0.55]:
		var wheel = MeshInstance3D.new()
		wheel.mesh = wheel_mesh
		wheel.material_override = wheel_mat
		wheel.position = Vector3(side, 0.25, 0.0)
		wheel.rotation.z = deg_to_rad(90.0)
		visual_root.add_child(wheel)

## Dựng thanh máu 3D lơ lửng trên đầu
func _build_health_bar() -> void:
	var hp_root = Node3D.new()
	hp_root.position = Vector3(0.0, 1.85, 0.0)
	add_child(hp_root)

	# Nền đen thanh máu
	var bg_mesh = BoxMesh.new()
	bg_mesh.size = Vector3(1.1, 0.12, 0.05)
	var bg_mat = StandardMaterial3D.new()
	bg_mat.albedo_color = Color(0.1, 0.1, 0.1, 0.8)
	var hp_bg = MeshInstance3D.new()
	hp_bg.mesh = bg_mesh
	hp_bg.material_override = bg_mat
	hp_root.add_child(hp_bg)

	# Phần máu đỏ tươi
	var fill_mesh = BoxMesh.new()
	fill_mesh.size = Vector3(1.05, 0.09, 0.06)
	var fill_mat = StandardMaterial3D.new()
	fill_mat.albedo_color = Color(1.0, 0.2, 0.25)
	fill_mat.emission_enabled = true
	fill_mat.emission = Color(1.0, 0.1, 0.15)
	fill_mat.emission_energy_multiplier = 1.0

	hp_bar_fill = MeshInstance3D.new()
	hp_bar_fill.mesh = fill_mesh
	hp_bar_fill.material_override = fill_mat
	hp_bar_fill.position = Vector3(0.0, 0.0, 0.01)
	hp_root.add_child(hp_bar_fill)

## Nhận sát thương từ đạn tháp
func take_damage(amount: float) -> void:
	current_hp = maxf(0.0, current_hp - amount)
	_hit_flash = 1.0

	# Cập nhật tỉ lệ thanh máu
	if hp_bar_fill:
		var ratio = clampf(current_hp / max_hp, 0.0, 1.0)
		hp_bar_fill.scale.x = ratio
		hp_bar_fill.position.x = -(1.0 - ratio) * 0.5

	if current_hp <= 0.0:
		_die()

func _die() -> void:
	emit_signal("enemy_died", self, gold_reward)
	_spawn_death_particles()
	queue_free()

func _spawn_death_particles() -> void:
	if not get_parent():
		return
	var p = CPUParticles3D.new()
	p.global_position = global_position + Vector3(0.0, 0.8, 0.0)
	p.emitting = true
	p.one_shot = true
	p.explosiveness = 0.95
	p.amount = 24
	p.lifetime = 0.6
	p.spread = 180.0
	p.initial_velocity_min = 3.5
	p.initial_velocity_max = 8.0

	var p_mesh = BoxMesh.new()
	p_mesh.size = Vector3(0.18, 0.18, 0.18)
	p.mesh = p_mesh

	var p_mat = StandardMaterial3D.new()
	p_mat.albedo_color = Color(1.0, 0.45, 0.1)
	p_mat.emission_enabled = true
	p_mat.emission = Color(1.0, 0.35, 0.05)
	p_mat.emission_energy_multiplier = 2.0
	p.material_override = p_mat

	get_tree().current_scene.add_child(p)
	get_tree().create_timer(0.7).timeout.connect(p.queue_free)
