class_name TeslaLightningEffect
extends Node2D

## TeslaLightningEffect: Hiệu Ứng Tia Sét Ziczac Đánh Tức Thì & Lan Truyền (Chain Lightning)
## Vẽ các đoạn gấp khúc ngẫu nhiên phát sáng tím neon & lõi trắng chói lòa nối từ đỉnh tháp vào quái vật

var start_pos: Vector2 = Vector2.ZERO
var target_pos: Vector2 = Vector2.ZERO
var chain_targets: Array[Vector2] = []

var _lifetime: float = 0.18
var _current_time: float = 0.0
var _main_branches: Array[PackedVector2Array] = []
var _chain_branches: Array[PackedVector2Array] = []

func _ready() -> void:
	z_index = 8
	var mat = CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	material = mat

func setup(origin: Vector2, primary_target: Vector2, secondary_targets: Array[Vector2] = []) -> void:
	start_pos = origin
	target_pos = primary_target
	chain_targets = secondary_targets

	# Tạo nhánh sét chính nối từ đỉnh tháp tới mục tiêu
	_main_branches.append(_generate_lightning_path(start_pos, target_pos, 16.0, 7))
	_main_branches.append(_generate_lightning_path(start_pos, target_pos, 12.0, 6))

	# Tạo các nhánh sét lan truyền sang quái vật lân cận
	for c_pos in chain_targets:
		_chain_branches.append(_generate_lightning_path(target_pos, c_pos, 14.0, 5))

	queue_redraw()

func _generate_lightning_path(from: Vector2, to: Vector2, roughness: float, segments: int) -> PackedVector2Array:
	var path: PackedVector2Array = []
	path.append(from)

	var dir = (to - from).normalized()
	var normal = Vector2(-dir.y, dir.x)
	var total_dist = from.distance_to(to)
	var seg_len = total_dist / float(segments)

	for i in range(1, segments):
		var base_pt = from + dir * (float(i) * seg_len)
		var offset = normal * randf_range(-roughness, roughness)
		path.append(base_pt + offset)

	path.append(to)
	return path

func _process(delta: float) -> void:
	_current_time += delta
	if _current_time >= _lifetime:
		queue_free()
		return

	# Nhấp nháy rung giật tia sét
	queue_redraw()

func _draw() -> void:
	var alpha = clampf(1.0 - (_current_time / _lifetime), 0.0, 1.0)
	# Bảng màu Sét Tesla & EMP Class S:
	# Lõi Trắng Xanh (0.92, 0.98, 1.0) -> Tím Điện Tử (0.65, 0.35, 1.0)
	var glow_color = Color(0.65, 0.35, 1.0, alpha * 0.85)
	var core_color = Color(0.92, 0.98, 1.0, alpha * 0.98)
	var volt_accent = Color(0.20, 0.85, 1.0, alpha * 0.65)

	# 1. Vẽ các nhánh sét chính (width = 2.0px cho lõi, 5.0px mờ cho hào quang)
	for branch in _main_branches:
		if branch.size() > 1:
			for i in range(branch.size() - 1):
				var p1 = to_local(branch[i])
				var p2 = to_local(branch[i + 1])
				# Lớp hào quang ngoài tím điện tử
				draw_line(p1, p2, glow_color, 5.0)
				draw_line(p1, p2, volt_accent, 3.2)
				# Lõi sét trắng xanh sắc mảnh
				draw_line(p1, p2, core_color, 2.0)

	# 2. Vẽ các nhánh sét lan truyền (Chain Lightning)
	for branch in _chain_branches:
		if branch.size() > 1:
			for i in range(branch.size() - 1):
				var p1 = to_local(branch[i])
				var p2 = to_local(branch[i + 1])
				draw_line(p1, p2, glow_color, 4.0)
				draw_line(p1, p2, core_color, 1.5)

	# 3. Vẽ đốm sáng điện nổ tại các điểm tiếp xúc
	draw_circle(to_local(start_pos), 7.0 * alpha, glow_color)
	draw_circle(to_local(start_pos), 3.5 * alpha, core_color)
	draw_circle(to_local(target_pos), 10.0 * alpha, glow_color)
	draw_circle(to_local(target_pos), 5.0 * alpha, core_color)

	for c_pos in chain_targets:
		draw_circle(to_local(c_pos), 8.0 * alpha, glow_color)
		draw_circle(to_local(c_pos), 4.0 * alpha, core_color)
