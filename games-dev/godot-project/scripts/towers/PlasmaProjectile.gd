class_name PlasmaProjectile
extends CharacterBody2D

## PlasmaProjectile: Mũi tên năng lượng / Đạn photon của Tháp Cung Năng Lượng
## Kế thừa CharacterBody2D để tự động bị GravityZone bẻ cong quỹ đạo khi bay qua.
## Đồ họa phát sáng Cyan với vệt đuôi uốn lượn.

@export var damage: float = 22.0
@export var speed: float = 620.0
@export var max_trail_points: int = 22
@export var bullet_color: Color = Color(0.0, 0.95, 1.0, 1.0)
@export var homing_strength: float = 9.0

var target_node: Node2D = null
var trail_points: Array[Vector2] = []
var lifetime: float = 0.0

@onready var hit_area: Area2D = $HitArea

func _ready() -> void:
	if hit_area:
		hit_area.body_entered.connect(_on_body_entered)

func launch(dir: Vector2, initial_damage: float, target: Node2D = null) -> void:
	damage = initial_damage
	target_node = target
	velocity = dir.normalized() * speed
	rotation = velocity.angle()
	queue_redraw()

func _physics_process(delta: float) -> void:
	lifetime += delta
	if lifetime > 2.5:
		queue_free()
		return

	# Dẫn đường thông minh bám đuổi mục tiêu (Smart Homing)
	if is_instance_valid(target_node) and not target_node.is_queued_for_deletion():
		var target_pos = target_node.global_position
		var dist = global_position.distance_to(target_pos)

		# 1. Kích nổ tức thì nếu tiếp cận đủ gần (Proximity Detonation - Chống trượt đạn)
		if dist <= 26.0:
			_hit_target(target_node)
			return

		# 2. Bẻ lái mượt mà về phía mục tiêu
		var desired_dir = (target_pos - global_position).normalized()
		var cur_dir = velocity.normalized()
		var steer_rate = clampf(homing_strength * delta, 0.0, 0.85)
		var blended_dir = cur_dir.lerp(desired_dir, steer_rate).normalized()
		velocity = blended_dir * speed

	# Di chuyển theo vật lý Godot
	move_and_slide()

	# Thân đạn xoay theo hướng vector vận tốc
	if velocity.length_squared() > 10.0:
		rotation = velocity.angle()

	# Cập nhật vệt đuôi trail
	trail_points.push_front(global_position)
	if trail_points.size() > max_trail_points:
		trail_points.pop_back()

	queue_redraw()

	# Tự hủy nếu bay ra ngoài mép màn hình
	var pos = global_position
	if pos.x < -80 or pos.x > 800 or pos.y < -80 or pos.y > 1360:
		queue_free()

## Nhận gia tốc bẻ cong quỹ đạo từ GravityZone
func apply_custom_force(accel: Vector2, delta: float) -> void:
	velocity += accel * delta

func _on_body_entered(body: Node2D) -> void:
	_hit_target(body)

func _hit_target(body: Node2D) -> void:
	if body and is_instance_valid(body) and body.has_method("take_damage"):
		body.take_damage(damage)
		_spawn_hit_spark()
		queue_free()

func _spawn_hit_spark() -> void:
	if not get_parent():
		return
	var p = CPUParticles2D.new()
	p.global_position = global_position
	p.emitting = true
	p.one_shot = true
	p.explosiveness = 1.0
	p.amount = 14
	p.lifetime = 0.30
	p.spread = 180.0
	p.initial_velocity_min = 80.0
	p.initial_velocity_max = 180.0
	p.scale_amount_min = 2.0
	p.scale_amount_max = 4.5
	p.color = bullet_color
	get_parent().add_child(p)
	get_tree().create_timer(0.40).timeout.connect(p.queue_free)

func _draw() -> void:
	# 1. Vẽ vệt đuôi photon phát sáng dày dặn
	if trail_points.size() >= 2:
		var count = trail_points.size()
		for i in range(count - 1):
			var p1 = to_local(trail_points[i])
			var p2 = to_local(trail_points[i + 1])
			var prog = float(i) / float(count)
			var alpha = (1.0 - prog) * 0.85
			var w = (1.0 - prog) * 6.5 + 1.5
			draw_line(p1, p2, Color(bullet_color.r, bullet_color.g, bullet_color.b, alpha), w)
			# Lõi đuôi màu trắng sáng
			draw_line(p1, p2, Color(1.0, 1.0, 1.0, alpha * 0.6), maxf(1.0, w * 0.4))

	# 2. Vầng hào quang photon sáng chói quanh đầu đạn
	draw_circle(Vector2(2.0, 0.0), 12.0, Color(bullet_color.r, bullet_color.g, bullet_color.b, 0.35))
	draw_circle(Vector2(2.0, 0.0), 6.5, Color(bullet_color.r, bullet_color.g, bullet_color.b, 0.65))

	# 3. Đầu đạn mũi tên năng lượng to lớn, sắc nét
	var head_poly: PackedVector2Array = [
		Vector2(16.0, 0.0),
		Vector2(-6.0, -6.5),
		Vector2(-1.5, 0.0),
		Vector2(-6.0, 6.5)
	]
	draw_colored_polygon(head_poly, bullet_color)
	draw_circle(Vector2.ZERO, 4.5, Color.WHITE)
