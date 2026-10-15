class_name TestParticle
extends CharacterBody2D

## TestParticle: Hạt / Đơn vị kẻ địch thử nghiệm bị bẻ cong quỹ đạo trong Tower Defense
## Kế thừa CharacterBody2D, có vệt đuôi phát sáng (Trail) để nhìn rõ đường cong trọng lực.

@export var initial_speed: float = 340.0
@export var initial_direction: Vector2 = Vector2.RIGHT
@export var max_trail_points: int = 35
@export var particle_color: Color = Color(0.98, 0.45, 0.2, 1.0) ## Màu hạt cam rực rỡ

var trail_points: Array[Vector2] = []
var alive_time: float = 0.0

func _ready() -> void:
	velocity = initial_direction.normalized() * initial_speed

func _physics_process(delta: float) -> void:
	alive_time += delta

	# Di chuyển theo vật lý chuẩn của Godot 4
	move_and_slide()

	# Cập nhật lịch sử tọa độ để vẽ vệt quỹ đạo uốn cong
	trail_points.push_front(global_position)
	if trail_points.size() > max_trail_points:
		trail_points.pop_back()

	queue_redraw()

	# Tự hủy nếu bay quá xa khỏi màn hình
	if global_position.x > 820 or global_position.x < -100 or global_position.y < -150 or global_position.y > 1400:
		queue_free()

## Nhận lực gia tốc từ GravityZone
func apply_custom_force(accel: Vector2, delta: float) -> void:
	velocity += accel * delta

func _draw() -> void:
	# 1. Vẽ hạt nhân trung tâm
	draw_circle(Vector2.ZERO, 9.0, particle_color)
	draw_circle(Vector2.ZERO, 4.0, Color.WHITE)

	# 2. Vẽ vệt đuôi phát sáng thể hiện quỹ đạo bị uốn cong
	if trail_points.size() >= 2:
		for i in range(trail_points.size() - 1):
			var p1 = to_local(trail_points[i])
			var p2 = to_local(trail_points[i + 1])
			var progress = float(i) / float(trail_points.size())
			var alpha = (1.0 - progress) * 0.75
			var width = (1.0 - progress) * 6.0 + 1.5
			var col = Color(particle_color.r, particle_color.g, particle_color.b, alpha)
			draw_line(p1, p2, col, width)
