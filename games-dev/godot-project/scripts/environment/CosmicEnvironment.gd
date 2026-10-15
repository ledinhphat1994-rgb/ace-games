class_name CosmicEnvironment
extends Node2D

## CosmicEnvironment: Quản lý Bản đồ Chiến trường & Quang cảnh Vũ trụ Chi tiết
## Tích hợp:
## 1. Cổng Dịch Chuyển Không Gian (Warp Gate Portal) tại điểm xuất phát quái vật
## 2. Trạm Căn Cứ Phòng Thủ Lõi Năng Lượng (Citadel Defense Core) tại đích đến
## 3. Hành Lang Bay Từ Trường (Hyperlane Highway Conduit) với mũi tên dòng chảy
## 4. 6 Bệ Đặt Trụ Chiến Thuật Bát Giác (Tactical Hardpoint Build Pads) có đèn báo vi mạch
## 5. Quang cảnh Tiểu Hành Tinh (Floating Asteroids) & Vệ Tinh Trinh Sát (Orbital Beacon)

# Tọa độ 6 bệ đặt trụ chiến thuật dọc 2 bên hành lang bay
const BUILD_PADS: Array[Vector2] = [
	Vector2(200.0, 360.0),
	Vector2(360.0, 330.0),
	Vector2(520.0, 360.0),
	Vector2(200.0, 680.0),
	Vector2(360.0, 710.0),
	Vector2(520.0, 680.0)
]

const WARP_GATE_POS = Vector2(60.0, 520.0)
const CITADEL_CORE_POS = Vector2(675.0, 520.0)

# Trạng thái chuyển động của quang cảnh
var _time_elapsed: float = 0.0
var _warp_spin: float = 0.0
var _conduit_flow: float = 0.0
var _core_pulse: float = 0.0
var shield_hit_flash: float = 0.0

# Dữ liệu tiểu hành tinh vũ trụ trôi nổi tự nhiên
var _asteroids: Array[Dictionary] = [
	{
		"base_pos": Vector2(110.0, 240.0),
		"radius": 22.0,
		"rot": 0.4,
		"rot_speed": 0.15,
		"shape": PackedVector2Array([
			Vector2(-18, -12), Vector2(-4, -20), Vector2(14, -16),
			Vector2(22, 2), Vector2(12, 18), Vector2(-10, 20), Vector2(-22, 6)
		]),
		"craters": [Vector2(-6, -6), Vector2(6, 6), Vector2(-8, 8)]
	},
	{
		"base_pos": Vector2(600.0, 250.0),
		"radius": 28.0,
		"rot": 1.2,
		"rot_speed": -0.12,
		"shape": PackedVector2Array([
			Vector2(-24, -16), Vector2(0, -26), Vector2(22, -18),
			Vector2(28, 6), Vector2(18, 24), Vector2(-8, 26), Vector2(-26, 8)
		]),
		"craters": [Vector2(4, -8), Vector2(-10, 2), Vector2(10, 10)]
	},
	{
		"base_pos": Vector2(130.0, 800.0),
		"radius": 18.0,
		"rot": 2.1,
		"rot_speed": 0.18,
		"shape": PackedVector2Array([
			Vector2(-14, -10), Vector2(2, -16), Vector2(16, -8),
			Vector2(18, 8), Vector2(6, 16), Vector2(-12, 14), Vector2(-18, 0)
		]),
		"craters": [Vector2(-3, -2), Vector2(5, 5)]
	},
	{
		"base_pos": Vector2(590.0, 810.0),
		"radius": 24.0,
		"rot": 0.8,
		"rot_speed": -0.16,
		"shape": PackedVector2Array([
			Vector2(-20, -12), Vector2(-2, -22), Vector2(18, -14),
			Vector2(24, 4), Vector2(14, 20), Vector2(-6, 22), Vector2(-22, 4)
		]),
		"craters": [Vector2(0, -6), Vector2(-8, 6), Vector2(8, 4)]
	}
]

# Tham chiếu tới danh sách tháp đang có trên sân
var towers_container_ref: Node2D = null

func _ready() -> void:
	z_index = -1 # Luôn nằm bên dưới các tháp, đạn và quái vật

func _process(delta: float) -> void:
	_time_elapsed += delta
	_warp_spin += delta * 2.2
	if _warp_spin > TAU:
		_warp_spin -= TAU

	_conduit_flow += delta * 60.0
	if _conduit_flow > 80.0:
		_conduit_flow -= 80.0

	_core_pulse += delta * 3.5
	if _core_pulse > TAU:
		_core_pulse -= TAU

	if shield_hit_flash > 0.0:
		shield_hit_flash = maxf(0.0, shield_hit_flash - delta * 3.5)

	# Xoay các tiểu hành tinh
	for ast in _asteroids:
		ast["rot"] += ast["rot_speed"] * delta

	queue_redraw()

## Kích hoạt hiệu ứng cảnh báo khi căn cứ bị quái vật xâm nhập mất máu
func trigger_base_damage_feedback() -> void:
	shield_hit_flash = 1.0
	queue_redraw()

## Tìm kiếm bệ đặt trụ gần nhất để hỗ trợ Magnetic Snap
func get_nearest_pad(pos: Vector2, max_dist: float = 48.0) -> Vector2:
	var nearest = Vector2.ZERO
	var min_d = max_dist
	for pad in BUILD_PADS:
		var d = pos.distance_to(pad)
		if d < min_d:
			min_d = d
			nearest = pad
	return nearest

func _draw() -> void:
	# 1. Vẽ Quang Cảnh Vũ Trụ Sâu (Deep Space Celestial Scenery)
	_draw_deep_space_scenery()

	# 2. Vẽ Hành Lang Năng Lượng Vũ Trụ (Hyperlane Conduit)
	_draw_hyperlane_conduit()

	# 3. Vẽ 6 Bệ Đặt Trụ Chiến Thuật (Tactical Build Pads)
	_draw_tactical_build_pads()

	# 4. Vẽ Cổng Dịch Chuyển Không Gian Xuất Phát (Warp Gate Portal)
	_draw_warp_gate()

	# 5. Vẽ Căn Cứ Phòng Thủ Lõi Năng Lượng (Citadel Defense Core)
	_draw_citadel_base()

# ========================================================
# 1. QUANG CẢNH VŨ TRỤ SÂU & TIỂU HÀNH TINH
# ========================================================
func _draw_deep_space_scenery() -> void:
	# Lưới tọa độ chiến thuật mờ ảo (Tactical Grid Lines)
	var grid_col = Color(0.12, 0.28, 0.48, 0.12)
	for x in [120.0, 240.0, 360.0, 480.0, 600.0]:
		draw_line(Vector2(x, 210.0), Vector2(x, 880.0), grid_col, 1.0)
	for y in [300.0, 440.0, 600.0, 740.0]:
		draw_line(Vector2(40.0, y), Vector2(680.0, y), grid_col, 1.0)

	# Các tiểu hành tinh đá trôi nổi
	for ast in _asteroids:
		var center = ast["base_pos"] + Vector2(sin(_time_elapsed * 0.5 + ast["rot"]) * 4.0, cos(_time_elapsed * 0.4 + ast["rot"]) * 3.0)
		var rot = ast["rot"]
		var rotated_shape = PackedVector2Array()
		for pt in ast["shape"]:
			rotated_shape.append(center + pt.rotated(rot))

		# Thân đá tiểu hành tinh
		draw_colored_polygon(rotated_shape, Color(0.08, 0.12, 0.18, 0.92))
		var border_pts = rotated_shape.duplicate()
		border_pts.append(rotated_shape[0])
		draw_polyline(border_pts, Color(0.24, 0.36, 0.52, 0.5), 1.4, true)

		# Các miệng hố thiên thạch (Craters)
		for cr in ast["craters"]:
			var cr_pos = center + cr.rotated(rot)
			draw_circle(cr_pos, 3.2, Color(0.04, 0.06, 0.1, 0.9))
			draw_arc(cr_pos, 3.2, 0, TAU, 12, Color(0.2, 0.32, 0.48, 0.35), 1.0)

	# Vệ tinh trinh sát không gian mini (Recon Beacon Drone) ở góc trên
	var beacon_pos = Vector2(480.0, 225.0) + Vector2(cos(_time_elapsed * 0.6) * 16.0, sin(_time_elapsed * 0.4) * 8.0)
	draw_circle(beacon_pos, 5.0, Color(0.15, 0.25, 0.38, 0.9))
	draw_circle(beacon_pos, 2.5, Color(0.4, 0.85, 1.0, 0.8))
	draw_line(beacon_pos + Vector2(-8, 0), beacon_pos + Vector2(8, 0), Color(0.3, 0.7, 1.0, 0.7), 1.5)
	# Đèn chớp tín hiệu
	var blink = fmod(_time_elapsed * 2.0, 1.0)
	if blink < 0.35:
		draw_circle(beacon_pos + Vector2(0, -6), 2.0, Color(1.0, 0.2, 0.3, 0.9))

# ========================================================
# 2. HÀNH LANG NĂNG LƯỢNG VŨ TRỤ (HYPERLANE CONDUIT)
# ========================================================
func _draw_hyperlane_conduit() -> void:
	var top_y = 440.0
	var bot_y = 600.0
	var start_x = 75.0
	var end_x = 660.0

	# 1. Nền luồng năng lượng phát quang dịu (Energy Flow Ambient)
	var conduit_bg: PackedVector2Array = [
		Vector2(start_x, top_y),
		Vector2(end_x, top_y),
		Vector2(end_x, bot_y),
		Vector2(start_x, bot_y)
	]
	draw_colored_polygon(conduit_bg, Color(0.02, 0.09, 0.18, 0.30))

	# 2. Hai đường ray từ trường bảo vệ biên (Boundary Rails)
	var rail_col = Color(0.18, 0.65, 0.95, 0.55)
	draw_line(Vector2(start_x, top_y), Vector2(end_x, top_y), rail_col, 2.0)
	draw_line(Vector2(start_x, bot_y), Vector2(end_x, bot_y), rail_col, 2.0)

	# Các điểm mốc định vị lượng tử dọc theo đường ray
	var step_x = 55.0
	var cur_x = start_x + 30.0
	while cur_x < end_x - 30.0:
		draw_line(Vector2(cur_x, top_y - 4.0), Vector2(cur_x, top_y + 4.0), Color(0.4, 0.85, 1.0, 0.7), 1.8)
		draw_line(Vector2(cur_x, bot_y - 4.0), Vector2(cur_x, bot_y + 4.0), Color(0.4, 0.85, 1.0, 0.7), 1.8)
		cur_x += step_x

	# 3. Trục trung tâm dẫn hướng (Central Axis)
	draw_line(Vector2(start_x, 520.0), Vector2(end_x, 520.0), Color(0.15, 0.35, 0.55, 0.25), 1.2)

	# 4. Các mũi tên Chevron di chuyển dẫn luồng bay (Flow Chevrons)
	var chev_x = start_x + _conduit_flow
	while chev_x < end_x - 40.0:
		var alpha = sin((chev_x - start_x) / (end_x - start_x) * PI) * 0.45
		var chev_col = Color(0.2, 0.8, 1.0, alpha)
		var pts: PackedVector2Array = [
			Vector2(chev_x - 10.0, 508.0),
			Vector2(chev_x, 520.0),
			Vector2(chev_x - 10.0, 532.0)
		]
		draw_polyline(pts, chev_col, 2.2, true)
		chev_x += 80.0

# ========================================================
# 3. SÁU BỆ ĐẶT TRỤ CHIẾN THUẬT (TACTICAL BUILD PADS)
# ========================================================
func _draw_tactical_build_pads() -> void:
	for pad_pos in BUILD_PADS:
		var has_tower = _is_tower_on_pad(pad_pos)

		# Kích thước đài bệ bát giác
		var outer_r = 44.0
		var inner_r = 34.0

		# Đa giác bát giác ngoài
		var outer_pts = _generate_regular_polygon(pad_pos, outer_r, 8, PI / 8.0)
		var inner_pts = _generate_regular_polygon(pad_pos, inner_r, 8, PI / 8.0)

		# Màu nền bệ
		var base_color = Color(0.04, 0.08, 0.16, 0.92) if not has_tower else Color(0.06, 0.14, 0.24, 0.95)
		draw_colored_polygon(outer_pts, base_color)

		# Viền ngoài
		var border_color = Color(0.2, 0.7, 0.85, 0.7) if has_tower else Color(0.18, 0.35, 0.52, 0.5)
		var border_closed = outer_pts.duplicate()
		border_closed.append(outer_pts[0])
		draw_polyline(border_closed, border_color, 2.0, true)

		# Viền bát giác trong và rãnh vi mạch
		var inner_closed = inner_pts.duplicate()
		inner_closed.append(inner_pts[0])
		var inner_color = Color(0.0, 0.95, 1.0, 0.4) if has_tower else Color(0.15, 0.28, 0.42, 0.3)
		draw_polyline(inner_closed, inner_color, 1.2, true)

		# 4 Rãnh mạch vi điện tử phát sáng nối từ góc vào tâm
		var trace_color = Color(0.2, 0.85, 1.0, 0.65) if has_tower else Color(0.18, 0.38, 0.55, 0.35)
		for i in range(4):
			var ang = float(i) * (PI / 2.0) + (PI / 8.0)
			var p_outer = pad_pos + Vector2(cos(ang) * (outer_r - 2.0), sin(ang) * (outer_r - 2.0))
			var p_inner = pad_pos + Vector2(cos(ang) * 14.0, sin(ang) * 14.0)
			draw_line(p_outer, p_inner, trace_color, 1.5)

		# Tâm bệ: Vòng kết nối từ tính (Magnetic Socket Core)
		var pulse_glow = 1.0 + sin(_time_elapsed * 3.0 + pad_pos.x * 0.05) * 0.15
		if has_tower:
			draw_circle(pad_pos, 16.0 * pulse_glow, Color(0.0, 0.9, 1.0, 0.15))
			draw_arc(pad_pos, 14.0, 0, TAU, 24, Color(0.2, 0.95, 1.0, 0.75), 1.8)
			draw_circle(pad_pos, 4.0, Color(0.3, 1.0, 0.8, 0.9))
		else:
			draw_arc(pad_pos, 12.0, 0, TAU, 20, Color(0.22, 0.45, 0.65, 0.45), 1.2)
			draw_circle(pad_pos, 2.5, Color(0.3, 0.6, 0.8, 0.4))

		# 4 Chốt khóa neo cơ khí ở 4 góc đối xứng
		for k in range(4):
			var clamp_ang = float(k) * (PI / 2.0) + (PI / 4.0)
			var c_pt = pad_pos + Vector2(cos(clamp_ang) * (outer_r - 5.0), sin(clamp_ang) * (outer_r - 5.0))
			draw_circle(c_pt, 2.8, Color(0.3, 0.5, 0.7, 0.8))

func _is_tower_on_pad(pad_pos: Vector2) -> bool:
	if not towers_container_ref:
		return false
	for t in towers_container_ref.get_children():
		if is_instance_valid(t) and t is Node2D:
			if pad_pos.distance_to(t.global_position) < 32.0:
				return true
	return false

# ========================================================
# 4. CỔNG DỊCH CHUYỂN KHÔNG GIAN (WARP GATE PORTAL)
# ========================================================
func _draw_warp_gate() -> void:
	var pos = WARP_GATE_POS

	# Lớp hố xoáy chân không sâu thẳm
	draw_circle(pos, 38.0, Color(0.02, 0.04, 0.1, 0.95))
	draw_circle(pos, 28.0, Color(0.02, 0.18, 0.32, 0.85))

	# Vòng xoáy năng lượng bên trong
	var vortex_r = 20.0 + sin(_warp_spin * 2.0) * 2.5
	draw_circle(pos, vortex_r, Color(0.0, 0.75, 1.0, 0.35))
	draw_circle(pos, 8.0, Color(0.7, 0.95, 1.0, 0.9))

	# 2 Vòng răng cưa/nan hoa năng lượng xoay ngược chiều nhau
	# Vòng ngoài
	var outer_r = 36.0
	draw_arc(pos, outer_r, 0, TAU, 32, Color(0.2, 0.75, 1.0, 0.65), 2.2)
	for i in range(6):
		var ang = _warp_spin + float(i) * (TAU / 6.0)
		var p1 = pos + Vector2(cos(ang) * (outer_r - 6.0), sin(ang) * (outer_r - 6.0))
		var p2 = pos + Vector2(cos(ang) * (outer_r + 6.0), sin(ang) * (outer_r + 6.0))
		draw_line(p1, p2, Color(0.4, 0.9, 1.0, 0.9), 2.0)

	# Vòng trong xoay ngược
	var inner_r = 24.0
	draw_arc(pos, inner_r, 0, TAU, 28, Color(0.5, 0.2, 1.0, 0.6), 1.8)
	for j in range(4):
		var iang = -_warp_spin * 1.4 + float(j) * (TAU / 4.0)
		var ip1 = pos + Vector2(cos(iang) * (inner_r - 4.0), sin(iang) * (inner_r - 4.0))
		var ip2 = pos + Vector2(cos(iang) * (inner_r + 4.0), sin(iang) * (inner_r + 4.0))
		draw_line(ip1, ip2, Color(0.8, 0.4, 1.0, 0.85), 1.8)

	# 4 Pylon phát xạ từ trường định vị (Emitter Pylons)
	for k in range(4):
		var p_ang = float(k) * (PI / 2.0) + (PI / 4.0)
		var p_base = pos + Vector2(cos(p_ang) * 44.0, sin(p_ang) * 44.0)
		var p_tip = pos + Vector2(cos(p_ang) * 52.0, sin(p_ang) * 52.0)
		draw_line(p_base, p_tip, Color(0.15, 0.55, 0.85, 0.9), 3.0)
		draw_circle(p_tip, 2.5, Color(0.3, 0.9, 1.0, 0.95))

# ========================================================
# 5. CĂN CỨ PHÒNG THỦ LÕI NĂNG LƯỢNG (CITADEL BASE CORE)
# ========================================================
func _draw_citadel_base() -> void:
	var pos = CITADEL_CORE_POS

	# Màu sắc dựa trên cảnh báo sát thương
	var is_alert = shield_hit_flash > 0.0
	var shield_color = Color(1.0, 0.2, 0.25, 0.75) if is_alert else Color(0.2, 0.85, 1.0, 0.55)
	var shield_fill = Color(1.0, 0.1, 0.2, 0.25) if is_alert else Color(0.05, 0.25, 0.45, 0.22)

	# 1. Bán cầu vòm khiên từ trường lục giác bảo vệ căn cứ (Forcefield Dome)
	var dome_radius = 48.0 + (sin(_core_pulse * 2.0) * 2.0 if not is_alert else sin(_time_elapsed * 25.0) * 4.0)
	var dome_pts = _generate_arc_points(pos, dome_radius, -PI * 0.5, PI * 0.5, 24)
	dome_pts.insert(0, pos)
	draw_colored_polygon(dome_pts, shield_fill)
	draw_polyline(dome_pts, shield_color, 2.4, true)

	# Các mắt lưới lục giác khiên chắn
	for k in range(3):
		var hex_r = 18.0 + float(k) * 12.0
		draw_arc(pos, hex_r, -PI * 0.45, PI * 0.45, 16, Color(shield_color.r, shield_color.g, shield_color.b, 0.35), 1.2)

	# 2. Tháp chỉ huy & Cấu trúc cơ khí căn cứ hình bán nguyệt dày dặn
	var base_hull: PackedVector2Array = [
		pos + Vector2(0, -36.0),
		pos + Vector2(24.0, -28.0),
		pos + Vector2(36.0, 0.0),
		pos + Vector2(24.0, 28.0),
		pos + Vector2(0, 36.0)
	]
	draw_colored_polygon(base_hull, Color(0.06, 0.12, 0.22, 0.95))
	var hull_closed = base_hull.duplicate()
	hull_closed.append(pos + Vector2(0, -36.0))
	draw_polyline(hull_closed, Color(0.3, 0.65, 0.95, 0.85), 2.0, true)

	# 3. Lõi lò phản ứng Ark Reactor ở tâm
	var ark_pulse = 1.0 + sin(_core_pulse * 4.0) * 0.18
	draw_circle(pos + Vector2(10.0, 0.0), 14.0 * ark_pulse, Color(0.1, 0.95, 1.0, 0.35))
	draw_circle(pos + Vector2(10.0, 0.0), 8.0 * ark_pulse, Color(0.3, 1.0, 0.9, 0.85) if not is_alert else Color(1.0, 0.4, 0.3, 0.9))
	draw_circle(pos + Vector2(10.0, 0.0), 3.5, Color.WHITE)

	# 2 Ăng-ten lượng tử tiếp nhận thông tin viễn thông
	var ant_top = pos + Vector2(18.0, -38.0)
	var ant_bot = pos + Vector2(18.0, 38.0)
	draw_line(pos + Vector2(8.0, -28.0), ant_top, Color(0.3, 0.7, 1.0, 0.8), 2.0)
	draw_line(pos + Vector2(8.0, 28.0), ant_bot, Color(0.3, 0.7, 1.0, 0.8), 2.0)
	draw_circle(ant_top, 2.5, Color(0.4, 1.0, 0.8, 0.95))
	draw_circle(ant_bot, 2.5, Color(0.4, 1.0, 0.8, 0.95))

# ========================================================
# HÀM TOÁN HỌC HỖ TRỢ VẼ HÌNH
# ========================================================
func _generate_regular_polygon(center: Vector2, radius: float, sides: int, start_angle: float = 0.0) -> PackedVector2Array:
	var pts = PackedVector2Array()
	var angle_step = TAU / float(sides)
	for i in range(sides):
		var ang = start_angle + float(i) * angle_step
		pts.append(center + Vector2(cos(ang) * radius, sin(ang) * radius))
	return pts

func _generate_arc_points(center: Vector2, radius: float, from_angle: float, to_angle: float, segments: int) -> PackedVector2Array:
	var pts = PackedVector2Array()
	var step = (to_angle - from_angle) / float(segments)
	for i in range(segments + 1):
		var ang = from_angle + float(i) * step
		pts.append(center + Vector2(cos(ang) * radius, sin(ang) * radius))
	return pts
