class_name FlyingCreditParticle
extends Node2D

## FlyingCreditParticle: Khối Năng Lượng / Vàng bay theo đường cong Bezier từ Cổng lên HUD
## Kích hoạt khi bấm GỌI ĐỢT (Call Wave), tạo cảm giác phần thưởng trực quan cực đã

var p0: Vector2 = Vector2.ZERO # Cổng xuất phát
var p1: Vector2 = Vector2.ZERO # Điểm cực đại vòng cung
var p2: Vector2 = Vector2.ZERO # Đích đến (Bảng Vàng trên HUD)
var duration: float = 0.55
var _time: float = 0.0
var on_reached: Callable = Callable()

var credit_color: Color = Color(1.0, 0.85, 0.25, 1.0)
var trail_history: Array[Vector2] = []
var max_trail_len: int = 12

func _ready() -> void:
	z_index = 35 # Hiển thị trên đầu mọi thực thể map

func setup(start_pos: Vector2, target_pos: Vector2, arc_height: float, callback: Callable) -> void:
	p0 = start_pos
	p2 = target_pos
	# Điểm uốn Bezier cong cao lên trời
	var mid = (p0 + p2) * 0.5
	p1 = mid + Vector2(randf_range(-40.0, 40.0), -arc_height)
	on_reached = callback
	global_position = p0
	_time = 0.0

func launch(start_pos: Vector2, ctrl_pos: Vector2, target_pos: Vector2, custom_duration: float = 0.55, callback: Callable = Callable()) -> void:
	p0 = start_pos
	p1 = ctrl_pos
	p2 = target_pos
	duration = custom_duration
	on_reached = callback
	global_position = p0
	_time = 0.0

func _process(delta: float) -> void:
	_time += delta
	var t = clampf(_time / duration, 0.0, 1.0)

	# Quadratic Bezier formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
	var one_minus_t = 1.0 - t
	var current_pos = (one_minus_t * one_minus_t * p0) + (2.0 * one_minus_t * t * p1) + (t * t * p2)
	global_position = current_pos

	trail_history.push_front(current_pos)
	if trail_history.size() > max_trail_len:
		trail_history.pop_back()

	queue_redraw()

	if t >= 1.0:
		if on_reached.is_valid():
			on_reached.call()
		queue_free()

func _draw() -> void:
	# 1. Vẽ đuôi hạt năng lượng (Energy Trail)
	var trail_count = trail_history.size()
	for i in range(trail_count):
		var tr_pos = to_local(trail_history[i])
		var tr_alpha = (1.0 - float(i) / float(trail_count)) * 0.65
		var tr_rad = (1.0 - float(i) / float(trail_count)) * 4.5 + 1.0
		var tr_col = Color(credit_color.r, credit_color.g, credit_color.b, tr_alpha)
		draw_circle(tr_pos, tr_rad, tr_col)

	# 2. Khối Lõi Credit Lục Giác / Kim Cương phát sáng
	var pulse = sin(_time * 20.0) * 0.2 + 0.9
	var core_rad = 6.5 * pulse

	# Halo tỏa sáng
	draw_circle(Vector2.ZERO, core_rad * 2.2, Color(credit_color.r, credit_color.g, credit_color.b, 0.25))
	draw_circle(Vector2.ZERO, core_rad * 1.5, Color(1.0, 0.95, 0.50, 0.55))

	# Lõi Trắng/Vàng năng lượng
	var pts = PackedVector2Array([
		Vector2(0, -core_rad),
		Vector2(core_rad * 0.866, -core_rad * 0.5),
		Vector2(core_rad * 0.866, core_rad * 0.5),
		Vector2(0, core_rad),
		Vector2(-core_rad * 0.866, core_rad * 0.5),
		Vector2(-core_rad * 0.866, -core_rad * 0.5)
	])
	draw_colored_polygon(pts, Color(1.0, 1.0, 0.85, 0.95))
	draw_polyline(pts, Color(credit_color.r, credit_color.g, credit_color.b, 1.0), 1.5)
