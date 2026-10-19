class_name HexHoloGridLayer
extends Node2D

## HexHoloGridLayer: Hiển thị lưới lục giác phát sáng (Hexagonal Holo-Grid) trên các ô đất trống
## Tôn trọng phối cảnh Isometric 2.5D và chuẩn tiếp đất Ycontact = 0

var pads: Array[Vector2] = []
var occupied_pad_indices: Array[int] = []
var hovered_pad_idx: int = -1
var is_active: bool = false
var hex_radius: float = 30.0

var color_available: Color = Color(0.0, 0.95, 1.0, 0.75) # Neon Cyan
var color_hovered: Color = Color(0.0, 1.0, 0.55, 0.95)   # Neon Emerald
var color_occupied: Color = Color(1.0, 0.25, 0.25, 0.35)  # Faint Red

var _pulse_timer: float = 0.0

func _ready() -> void:
	z_index = -1 # Nằm ngay trên bản đồ nền, dưới các tháp và quái vật
	set_process(false)

func set_pads(build_pads: Array[Vector2]) -> void:
	pads = build_pads
	queue_redraw()

func set_occupied(indices: Array[int]) -> void:
	occupied_pad_indices = indices
	queue_redraw()

func set_hovered_pad(idx: int) -> void:
	if hovered_pad_idx != idx:
		hovered_pad_idx = idx
		queue_redraw()

func activate(active: bool) -> void:
	is_active = active
	visible = active
	set_process(active)
	queue_redraw()

func show_grid(build_pads: Array[Vector2] = []) -> void:
	if not build_pads.is_empty():
		pads = build_pads
	activate(true)

func hide_grid() -> void:
	activate(false)

func _process(delta: float) -> void:
	_pulse_timer += delta * 4.0
	queue_redraw()

func _draw() -> void:
	if not is_active:
		return

	var pulse = sin(_pulse_timer) * 0.18 + 0.82

	for i in range(pads.size()):
		var center = pads[i]
		var is_occ = (i in occupied_pad_indices)
		var is_hov = (i == hovered_pad_idx and not is_occ)

		var col = color_hovered if is_hov else (color_occupied if is_occ else color_available)
		var rad = (hex_radius * 1.15) if is_hov else hex_radius

		# Tính 6 đỉnh của hình lục giác Isometric (dẹt theo trục Y tỷ lệ 0.52)
		var hex_pts = PackedVector2Array()
		for v in range(6):
			var a = (float(v) * PI / 3.0) + (PI / 6.0)
			var pt = center + Vector2(cos(a) * rad, sin(a) * rad * 0.52)
			hex_pts.append(pt)

		# 1. Mặt phẳng lục giác mờ bán trong suốt
		var fill_col = Color(col.r, col.g, col.b, (0.28 * pulse) if is_hov else (0.10 * pulse))
		draw_colored_polygon(hex_pts, fill_col)

		# 2. Khung viền lục giác phát sáng
		var line_col = Color(col.r, col.g, col.b, (1.0 * pulse) if is_hov else (0.75 * pulse))
		var line_w = 2.5 if is_hov else 1.5
		var closed_hex = hex_pts.duplicate()
		closed_hex.append(hex_pts[0])
		draw_polyline(closed_hex, line_col, line_w)

		# 3. Ký hiệu tâm mạch điện (Central Core Dot)
		var dot_rad = 4.5 if is_hov else 3.0
		draw_circle(center, dot_rad, Color(col.r, col.g, col.b, 0.90))

		# 4. Khi hover: Vẽ thêm các tai chốt định vị (Corner Locking Reticles)
		if is_hov:
			for pt in hex_pts:
				var dir = (pt - center).normalized()
				draw_line(pt, pt + dir * 6.0, Color(1.0, 1.0, 1.0, 0.95), 2.0)
