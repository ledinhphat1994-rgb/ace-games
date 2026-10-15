class_name HudVectorIcon
extends Control

## HudVectorIcon: Trình kết xuất Biểu tượng Vector Hình học Sắc nét (Không phụ thuộc Font Emoji)
## Giải quyết triệt để 100% lỗi Tofu Hex Boxes trên Godot Web Export

enum Type {
	SCORE_STAR,      # Ngôi sao 5 cánh vàng kim
	HEALTH_HEART,    # Khiên trái tim đỏ hồng ngọc
	GOLD_COIN,       # Đồng xu lục giác / Tinh thể vàng
	WAVE_SWORDS,     # Hai thanh kiếm chéo xanh băng
	SPEED_ARROW_1X,  # 1 Mũi tên xanh cyan
	SPEED_ARROW_2X,  # 2 Mũi tên vàng hổ phách
	CAMERA_RETICLE,  # Vòng ngắm camera đa tầm nhìn
	HARDCORE_FLAME,  # Ngọn lửa thử thách đỏ cam
	TOWER_CANNON,    # Tháp pháo phòng thủ (Bottom Dock)
	SKILL_CHIP,      # Vi mạch công nghệ (Bottom Dock)
	SPELL_BURST,     # Tinh thể ma thuật (Bottom Dock)
	DEFEND_SHIELD,   # Khiên phòng thủ chiến dịch (Bottom Dock)
	LIGHTNING_EMP    # Tia sét bẫy xung điện cầu (Bottom Dock)
}

@export var icon_type: Type = Type.SCORE_STAR:
	set(val):
		icon_type = val
		queue_redraw()

@export var icon_color: Color = Color.WHITE:
	set(val):
		icon_color = val
		queue_redraw()

func _ready() -> void:
	custom_minimum_size = Vector2(20.0, 20.0)
	mouse_filter = MOUSE_FILTER_IGNORE

func _draw() -> void:
	var w = size.x
	var h = size.y
	if w <= 0.0 or h <= 0.0:
		return
	var center = Vector2(w * 0.5, h * 0.5)
	var radius = minf(w, h) * 0.46

	match icon_type:
		Type.SCORE_STAR:
			_draw_star(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.85, 0.20))
		Type.HEALTH_HEART:
			_draw_heart(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.28, 0.36))
		Type.GOLD_COIN:
			_draw_coin(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.82, 0.15))
		Type.WAVE_SWORDS:
			_draw_crossed_swords(center, radius, icon_color if icon_color != Color.WHITE else Color(0.35, 0.88, 1.0))
		Type.SPEED_ARROW_1X:
			_draw_arrow_1x(center, radius, icon_color if icon_color != Color.WHITE else Color(0.35, 0.90, 1.0))
		Type.SPEED_ARROW_2X:
			_draw_arrow_2x(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.78, 0.18))
		Type.CAMERA_RETICLE:
			_draw_reticle(center, radius, icon_color if icon_color != Color.WHITE else Color(0.30, 0.95, 1.0))
		Type.HARDCORE_FLAME:
			_draw_flame(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.38, 0.15))
		Type.TOWER_CANNON:
			_draw_tower_icon(center, radius, icon_color if icon_color != Color.WHITE else Color(0.30, 0.95, 1.0))
		Type.SKILL_CHIP:
			_draw_chip_icon(center, radius, icon_color if icon_color != Color.WHITE else Color(0.30, 1.0, 0.65))
		Type.SPELL_BURST:
			_draw_spell_icon(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.85, 0.25))
		Type.DEFEND_SHIELD:
			_draw_shield_icon(center, radius, icon_color if icon_color != Color.WHITE else Color(1.0, 0.45, 0.35))
		Type.LIGHTNING_EMP:
			_draw_lightning(center, radius, icon_color if icon_color != Color.WHITE else Color(0.25, 0.90, 1.0))

func _draw_star(c: Vector2, r: float, col: Color) -> void:
	var pts = PackedVector2Array()
	var inner_r = r * 0.44
	for i in range(10):
		var ang = -PI * 0.5 + float(i) * (TAU / 10.0)
		var cur_r = r if (i % 2 == 0) else inner_r
		pts.append(c + Vector2(cos(ang), sin(ang)) * cur_r)
	draw_colored_polygon(pts, col)
	var pts_closed = PackedVector2Array(pts)
	pts_closed.append(pts[0])
	draw_polyline(pts_closed, Color(col.r * 1.15, col.g * 1.15, col.b * 1.15, 0.95), 1.4)

func _draw_heart(c: Vector2, r: float, col: Color) -> void:
	var left_c = c + Vector2(-r * 0.38, -r * 0.20)
	var right_c = c + Vector2(r * 0.38, -r * 0.20)
	var circle_r = r * 0.44
	draw_circle(left_c, circle_r, col)
	draw_circle(right_c, circle_r, col)
	var bottom_tip = c + Vector2(0.0, r * 0.90)
	var poly = PackedVector2Array([
		left_c + Vector2(-circle_r * 0.92, circle_r * 0.2),
		right_c + Vector2(circle_r * 0.92, circle_r * 0.2),
		bottom_tip
	])
	draw_colored_polygon(poly, col)
	draw_circle(c + Vector2(-r * 0.25, -r * 0.35), circle_r * 0.32, Color(1.0, 1.0, 1.0, 0.45))

func _draw_coin(c: Vector2, r: float, col: Color) -> void:
	var hex_pts = PackedVector2Array()
	var inner_pts = PackedVector2Array()
	for i in range(6):
		var ang = float(i) * (TAU / 6.0)
		hex_pts.append(c + Vector2(cos(ang), sin(ang)) * r)
		inner_pts.append(c + Vector2(cos(ang), sin(ang)) * (r * 0.65))
	draw_colored_polygon(hex_pts, col)
	var hex_closed = PackedVector2Array(hex_pts)
	hex_closed.append(hex_pts[0])
	draw_polyline(hex_closed, Color(1.0, 0.96, 0.55, 0.95), 1.5)
	var inner_closed = PackedVector2Array(inner_pts)
	inner_closed.append(inner_pts[0])
	draw_colored_polygon(inner_pts, Color(col.r * 0.85, col.g * 0.75, col.b * 0.15))
	draw_circle(c, r * 0.28, Color(1.0, 0.95, 0.60))

func _draw_crossed_swords(c: Vector2, r: float, col: Color) -> void:
	var off = r * 0.80
	# Lưỡi kiếm 1
	draw_line(c + Vector2(-off, -off), c + Vector2(off, off), col, 2.4)
	# Cán & chuôi kiếm 1
	draw_line(c + Vector2(off * 0.55, off * 0.85), c + Vector2(off * 0.85, off * 0.55), Color(1.0, 0.85, 0.3), 2.0)
	# Lưỡi kiếm 2
	draw_line(c + Vector2(off, -off), c + Vector2(-off, off), col, 2.4)
	# Cán & chuôi kiếm 2
	draw_line(c + Vector2(-off * 0.55, off * 0.85), c + Vector2(-off * 0.85, off * 0.55), Color(1.0, 0.85, 0.3), 2.0)
	# Tâm giao kiếm
	draw_circle(c, 3.0, Color(1.0, 1.0, 1.0, 0.9))

func _draw_arrow_1x(c: Vector2, r: float, col: Color) -> void:
	var w_h = r * 0.85
	var tri = PackedVector2Array([
		c + Vector2(-w_h * 0.6, -w_h),
		c + Vector2(w_h * 0.8, 0.0),
		c + Vector2(-w_h * 0.6, w_h)
	])
	draw_colored_polygon(tri, col)

func _draw_arrow_2x(c: Vector2, r: float, col: Color) -> void:
	var w_h = r * 0.80
	var tri1 = PackedVector2Array([
		c + Vector2(-w_h * 0.9, -w_h),
		c + Vector2(0.0, 0.0),
		c + Vector2(-w_h * 0.9, w_h)
	])
	var tri2 = PackedVector2Array([
		c + Vector2(0.0, -w_h),
		c + Vector2(w_h * 0.9, 0.0),
		c + Vector2(0.0, w_h)
	])
	draw_colored_polygon(tri1, col)
	draw_colored_polygon(tri2, col)

func _draw_reticle(c: Vector2, r: float, col: Color) -> void:
	draw_arc(c, r * 0.75, 0.0, TAU, 24, col, 1.8)
	var tick = r * 0.40
	draw_line(c + Vector2(-r, 0.0), c + Vector2(-r + tick, 0.0), col, 2.0)
	draw_line(c + Vector2(r - tick, 0.0), c + Vector2(r, 0.0), col, 2.0)
	draw_line(c + Vector2(0.0, -r), c + Vector2(0.0, -r + tick), col, 2.0)
	draw_line(c + Vector2(0.0, r - tick), c + Vector2(0.0, r), col, 2.0)
	draw_circle(c, 2.4, col)

func _draw_flame(c: Vector2, r: float, col: Color) -> void:
	var flame_pts = PackedVector2Array([
		c + Vector2(0.0, -r),
		c + Vector2(r * 0.6, -r * 0.2),
		c + Vector2(r * 0.7, r * 0.5),
		c + Vector2(r * 0.3, r * 0.9),
		c + Vector2(-r * 0.3, r * 0.9),
		c + Vector2(-r * 0.7, r * 0.5),
		c + Vector2(-r * 0.6, -r * 0.2)
	])
	draw_colored_polygon(flame_pts, col)
	var inner_pts = PackedVector2Array([
		c + Vector2(0.0, -r * 0.4),
		c + Vector2(r * 0.3, 0.0),
		c + Vector2(r * 0.2, r * 0.6),
		c + Vector2(-r * 0.2, r * 0.6),
		c + Vector2(-r * 0.3, 0.0)
	])
	draw_colored_polygon(inner_pts, Color(1.0, 0.92, 0.25))

func _draw_tower_icon(c: Vector2, r: float, col: Color) -> void:
	# Bệ tháp
	draw_rect(Rect2(c.x - r * 0.8, c.y + r * 0.2, r * 1.6, r * 0.6), col)
	# Ụ nòng
	draw_circle(c + Vector2(0.0, r * 0.1), r * 0.50, Color(col.r * 1.1, col.g * 1.1, col.b * 1.1))
	# Nòng súng đôi
	draw_line(c + Vector2(-r * 0.25, r * 0.0), c + Vector2(-r * 0.25, -r * 0.9), col, 3.0)
	draw_line(c + Vector2(r * 0.25, r * 0.0), c + Vector2(r * 0.25, -r * 0.9), col, 3.0)

func _draw_chip_icon(c: Vector2, r: float, col: Color) -> void:
	# Thân chip
	var s = r * 0.75
	draw_rect(Rect2(c.x - s, c.y - s, s * 2.0, s * 2.0), col)
	draw_rect(Rect2(c.x - s * 0.6, c.y - s * 0.6, s * 1.2, s * 1.2), Color(0.05, 0.15, 0.10))
	# Chân chip
	for i in [-0.5, 0.0, 0.5]:
		draw_line(c + Vector2(s * i, -s), c + Vector2(s * i, -r * 1.05), col, 1.8)
		draw_line(c + Vector2(s * i, s), c + Vector2(s * i, r * 1.05), col, 1.8)
		draw_line(c + Vector2(-s, s * i), c + Vector2(-r * 1.05, s * i), col, 1.8)
		draw_line(c + Vector2(s, s * i), c + Vector2(r * 1.05, s * i), col, 1.8)

func _draw_spell_icon(c: Vector2, r: float, col: Color) -> void:
	# Tinh thể ma thuật 4 cánh
	var pts = PackedVector2Array([
		c + Vector2(0.0, -r),
		c + Vector2(r * 0.45, 0.0),
		c + Vector2(0.0, r),
		c + Vector2(-r * 0.45, 0.0)
	])
	draw_colored_polygon(pts, col)
	draw_circle(c, r * 0.28, Color(1.0, 1.0, 1.0, 0.95))
	for ang in [PI * 0.25, PI * 0.75, PI * 1.25, PI * 1.75]:
		var spark = c + Vector2(cos(ang), sin(ang)) * (r * 0.85)
		draw_circle(spark, 2.2, Color(1.0, 0.95, 0.4))

func _draw_shield_icon(c: Vector2, r: float, col: Color) -> void:
	var s_pts = PackedVector2Array([
		c + Vector2(-r * 0.75, -r * 0.8),
		c + Vector2(r * 0.75, -r * 0.8),
		c + Vector2(r * 0.85, 0.0),
		c + Vector2(0.0, r * 0.95),
		c + Vector2(-r * 0.85, 0.0)
	])
	draw_colored_polygon(s_pts, col)
	var s_closed = PackedVector2Array(s_pts)
	s_closed.append(s_pts[0])
	draw_polyline(s_closed, Color(1.0, 0.9, 0.8, 0.9), 1.6)
	draw_line(c + Vector2(0.0, -r * 0.6), c + Vector2(0.0, r * 0.6), Color(1.0, 1.0, 1.0, 0.85), 2.0)

func _draw_lightning(c: Vector2, r: float, col: Color) -> void:
	var pts = PackedVector2Array([
		c + Vector2(r * 0.15, -r * 0.90),
		c + Vector2(-r * 0.55, -r * 0.05),
		c + Vector2(-r * 0.05, -r * 0.05),
		c + Vector2(-r * 0.25, r * 0.90),
		c + Vector2(r * 0.55, 0.05),
		c + Vector2(r * 0.05, 0.05)
	])
	draw_colored_polygon(pts, col)
	var pts_closed = PackedVector2Array(pts)
	pts_closed.append(pts[0])
	draw_polyline(pts_closed, Color(1.0, 1.0, 1.0, 0.9), 1.5)
