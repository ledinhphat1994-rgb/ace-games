class_name TrajectoryPredictor
extends RefCounted

## TrajectoryPredictor: Dự báo quỹ đạo vật thể khi chịu gia tốc trường trọng lực
## Thuật toán tích phân Euler mô phỏng trước đường bay nhiều bước (Simulated Path)
## Hỗ trợ vẽ đường ngắm đạn trước khi bắn hoặc hiển thị đường đi tương lai của quái.

static func calculate_path(start_pos: Vector2, initial_velocity: Vector2, gravity_center: Vector2, gravity_strength: float, steps: int = 24, delta_step: float = 0.04) -> PackedVector2Array:
	var path: PackedVector2Array = PackedVector2Array()
	var current_pos: Vector2 = start_pos
	var current_vel: Vector2 = initial_velocity

	path.append(current_pos)
	for i in range(steps):
		var to_center: Vector2 = gravity_center - current_pos
		var dist_sq: float = maxf(to_center.length_squared(), 1200.0)
		var accel: Vector2 = to_center.normalized() * (gravity_strength / dist_sq)

		current_vel += accel * delta_step
		current_pos += current_vel * delta_step
		path.append(current_pos)

	return path
