class_name GravityZone
extends Area2D

## GravityZone: Vùng tác động trường lực / phản trọng lực trong Tower Defense
## Kế thừa Area2D, liên tục tác động gia tốc lên các CharacterBody2D và RigidBody2D đi vào vùng.

enum ForceType {
	DIRECTIONAL,  ## Lực theo hướng cố định (ví dụ: đẩy lên trên, thổi ngang)
	RADIAL_REPULSE, ## Lực phản trọng lực đẩy tỏa tròn từ tâm ra ngoài
	RADIAL_ATTRACT  ## Lực hố đen hút về tâm
}

@export var force_type: ForceType = ForceType.DIRECTIONAL
@export var force_strength: float = 750.0 ## Cường độ gia tốc (pixel/s^2)
@export var force_direction: Vector2 = Vector2.UP ## Hướng đẩy nếu là DIRECTIONAL (Mặc định: Phản trọng lực đẩy lên)
@export var zone_radius: float = 140.0 ## Bán kính vùng tác động
@export var field_color: Color = Color(0.2, 0.8, 1.0, 0.25) ## Màu hiển thị của trường lực

var affected_bodies: Array[CharacterBody2D] = []
var _animation_pulse: float = 0.0
@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

	# Đảm bảo CollisionShape2D khớp với bán kính
	var col = get_node_or_null("CollisionShape2D")
	if col and col.shape is CircleShape2D:
		col.shape.radius = zone_radius

	queue_redraw()

func _physics_process(delta: float) -> void:
	_animation_pulse += delta * 3.5
	if _animation_pulse > TAU:
		_animation_pulse -= TAU
	queue_redraw()

	if affected_bodies.is_empty():
		return

	for body in affected_bodies:
		if not is_instance_valid(body):
			continue

		var accel: Vector2 = Vector2.ZERO

		match force_type:
			ForceType.DIRECTIONAL:
				accel = force_direction.normalized() * force_strength

			ForceType.RADIAL_REPULSE:
				var diff = body.global_position - global_position
				var dist = diff.length()
				if dist > 0.001:
					# Lực mạnh hơn ở gần tâm (Anti-gravity repulsion)
					var factor = clampf(1.0 - (dist / zone_radius), 0.2, 1.5)
					accel = diff.normalized() * (force_strength * factor)

			ForceType.RADIAL_ATTRACT:
				var diff = global_position - body.global_position
				var dist = diff.length()
				if dist > 0.001:
					# Khi đến rất gần tâm hố đen (< 30px), hút thẳng vào điểm kỳ dị và tiêu biến
					if dist < 30.0 and body.has_method("absorb_into_singularity"):
						body.absorb_into_singularity(global_position)
						continue

					var factor = clampf(1.0 - (dist / zone_radius * 0.5), 0.3, 1.5)
					accel = diff.normalized() * (force_strength * factor)

		# Tác động trực tiếp lên vận tốc của CharacterBody2D
		if body.has_method("apply_custom_force"):
			body.apply_custom_force(accel, delta)
		elif "velocity" in body:
			body.velocity += accel * delta

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D and not affected_bodies.has(body):
		affected_bodies.append(body)
		# Rung phản hồi xúc giác nhẹ khi hạt đi vào trường lực
		if web_bridge:
			web_bridge.trigger_haptic("light")

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		affected_bodies.erase(body)

func _draw() -> void:
	# 1. Vẽ vòng tròn vùng trường lực bán trong suốt
	draw_circle(Vector2.ZERO, zone_radius, field_color)

	# 2. Vẽ viền phát sáng nhịp đập (pulse effect)
	var pulse_radius = zone_radius + sin(_animation_pulse) * 4.0
	var border_color = Color(field_color.r, field_color.g, field_color.b, 0.8)
	draw_arc(Vector2.ZERO, pulse_radius, 0.0, TAU, 48, border_color, 2.5)

	# 3. Vẽ mũi tên trực quan thể hiện hướng phản trọng lực
	if force_type == ForceType.DIRECTIONAL:
		var dir = force_direction.normalized()
		var start_pt = -dir * (zone_radius * 0.45)
		var end_pt = dir * (zone_radius * 0.45)
		draw_line(start_pt, end_pt, Color(1, 1, 1, 0.85), 3.0)
		# Mũi tên nhọn
		var arrow_left = end_pt - dir.rotated(0.5) * 16.0
		var arrow_right = end_pt - dir.rotated(-0.5) * 16.0
		draw_line(end_pt, arrow_left, Color(1, 1, 1, 0.85), 3.0)
		draw_line(end_pt, arrow_right, Color(1, 1, 1, 0.85), 3.0)
	else:
		# Hiệu ứng sóng tỏa tròn cho Radial Repulse
		var ripple_r = fmod(_animation_pulse * 25.0, zone_radius)
		draw_arc(Vector2.ZERO, ripple_r, 0.0, TAU, 32, Color(1, 1, 1, 0.4), 1.5)
