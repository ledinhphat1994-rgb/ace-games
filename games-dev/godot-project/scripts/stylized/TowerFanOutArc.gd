class_name TowerFanOutArc
extends Control

## TowerFanOutArc: Vòng cung Hologram xòe quạt 4 thẻ bài mô-đun trụ chiến thuật phía trên nút MUA TRỤ
## Hiệu ứng Spring/Back 60fps, Holo-Tooltip giải mã chữ Sci-Fi và liên kết tia sáng Hologram

signal tower_selected(tower_type: int, cost: int)
signal closed()

var is_open: bool = false
var cards: Array[Button] = []
var arc_radius: float = 185.0
var target_positions: Array[Vector2] = []
var arc_angles: Array[float] = [-135.0, -105.0, -75.0, -45.0] # 4 góc xòe cung bán nguyệt phía trên

var tower_defs: Array[Dictionary] = [
	{
		"type": 0, # GATLING
		"title": "LASER GATLING",
		"cost": 100,
		"accent": Color(0.0, 0.95, 1.0),
		"icon": "res://assets/textures/cards/card_buy_tower.png",
		"desc": "SÁT THƯƠNG: 18 (Ramping)\nTẦM BẮN: 180px | TỐC: 0.10s\nĐẶC TÍNH: Khắc chế bầy quái Swarm"
	},
	{
		"type": 1, # PLASMA
		"title": "PHÁO PLASMA",
		"cost": 60,
		"accent": Color(1.0, 0.45, 0.15),
		"icon": "res://assets/textures/cards/video_style/card_buy_tower.png",
		"desc": "SÁT THƯƠNG: 45 (Nổ AoE)\nTẦM BẮN: 200px | TỐC: 0.65s\nĐẶC TÍNH: Phá Giáp -50% vĩnh viễn"
	},
	{
		"type": 2, # TESLA
		"title": "EMP TESLA COIL",
		"cost": 150,
		"accent": Color(0.75, 0.40, 1.0),
		"icon": "res://assets/textures/cards/video_style/card_bridge_emp.png",
		"desc": "SÁT THƯƠNG: 30 (Sét Chuỗi)\nTẦM BẮN: 160px | TỐC: 0.80s\nĐẶC TÍNH: Tê Liệt Cơ Khí x2.2 & Phá Khiên"
	},
	{
		"type": 3, # COMBAT / SAM
		"title": "COMBAT SAM 3D",
		"cost": 120,
		"accent": Color(0.35, 1.0, 0.65),
		"icon": "res://assets/textures/cards/video_style/card_skill.png",
		"desc": "SÁT THƯƠNG: 80 (Tên Lửa)\nTẦM BẮN: 240px | TỐC: 1.10s\nĐẶC TÍNH: Ưu tiên quái bay Không Kích"
	}
]

var tooltip_panel: PanelContainer = null
var tooltip_label: Label = null
var tooltip_title: Label = null
var decrypt_tween: Tween = null

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_setup_cards()
	_setup_holo_tooltip()
	visible = false

func _setup_cards() -> void:
	for i in range(tower_defs.size()):
		var def = tower_defs[i]
		var btn = Button.new()
		btn.name = "SubTowerCard_%d" % i
		btn.custom_minimum_size = Vector2(116.0, 142.0)
		btn.pivot_offset = Vector2(58.0, 71.0)
		btn.focus_mode = Control.FOCUS_NONE
		btn.flat = true

		# Tính góc và tọa độ đích trên vòng cung
		var rad_angle = deg_to_rad(arc_angles[i])
		var pos = Vector2(cos(rad_angle), sin(rad_angle)) * arc_radius - Vector2(58.0, 71.0)
		target_positions.append(pos)
		btn.position = Vector2(-58.0, -71.0) # Vị trí gốc tâm nút Build

		# Shader holo_card_3d
		var mat = ShaderMaterial.new()
		mat.shader = preload("res://shaders/holo_card_3d.gdshader")
		mat.set_shader_parameter("base_tint", Color(0.04, 0.08, 0.14, 0.92))
		mat.set_shader_parameter("neon_color", def["accent"])
		mat.set_shader_parameter("corner_chamfer", 0.10)
		mat.set_shader_parameter("active_glow", 1.2)

		var rect = TextureRect.new()
		rect.name = "Texture"
		rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if ResourceLoader.exists(def["icon"]):
			rect.texture = load(def["icon"])
		rect.material = mat
		btn.add_child(rect)

		# Nhãn Tên & Giá Vàng phát sáng
		var lbl_vbox = VBoxContainer.new()
		lbl_vbox.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
		lbl_vbox.offset_bottom = -6.0
		lbl_vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
		btn.add_child(lbl_vbox)

		var lbl_title = Label.new()
		lbl_title.text = def["title"]
		lbl_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_title.add_theme_font_size_override("font_size", 10)
		lbl_title.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
		lbl_title.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
		lbl_title.add_theme_constant_override("outline_size", 2)
		lbl_vbox.add_child(lbl_title)

		var lbl_cost = Label.new()
		lbl_cost.text = "%dG" % def["cost"]
		lbl_cost.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_cost.add_theme_font_size_override("font_size", 12)
		lbl_cost.add_theme_color_override("font_color", Color(1.0, 0.85, 0.25))
		lbl_vbox.add_child(lbl_cost)

		# Kết nối sự kiện
		var card_idx = i
		btn.pressed.connect(func():
			tower_selected.emit(def["type"], def["cost"])
			close()
		)

		btn.mouse_entered.connect(func():
			_on_card_hovered(btn, def, rect)
		)
		btn.mouse_exited.connect(func():
			_on_card_unhovered(btn, rect)
		)

		add_child(btn)
		cards.append(btn)

func _setup_holo_tooltip() -> void:
	tooltip_panel = PanelContainer.new()
	tooltip_panel.name = "HoloTooltip"
	tooltip_panel.visible = false
	tooltip_panel.z_index = 40
	tooltip_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.06, 0.12, 0.95)
	sb.border_color = Color(0.0, 0.95, 1.0, 0.90)
	sb.set_border_width_all(1.5)
	sb.set_corner_radius_all(8)
	sb.shadow_size = 10
	sb.shadow_color = Color(0, 0, 0, 0.6)
	tooltip_panel.add_theme_stylebox_override("panel", sb)

	var margin = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_theme_constant_override("margin_bottom", 8)
	tooltip_panel.add_child(margin)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	margin.add_child(vbox)

	tooltip_title = Label.new()
	tooltip_title.add_theme_font_size_override("font_size", 12)
	tooltip_title.add_theme_color_override("font_color", Color(0.0, 0.95, 1.0))
	vbox.add_child(tooltip_title)

	tooltip_label = Label.new()
	tooltip_label.add_theme_font_size_override("font_size", 11)
	tooltip_label.add_theme_color_override("font_color", Color(0.85, 0.90, 0.95))
	vbox.add_child(tooltip_label)

	add_child(tooltip_panel)

func _on_card_hovered(btn: Button, def: Dictionary, rect: TextureRect) -> void:
	var tw = btn.create_tween()
	tw.tween_property(btn, "scale", Vector2(1.12, 1.12), 0.10).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if rect.material is ShaderMaterial:
		rect.material.set_shader_parameter("is_active", true)
		rect.material.set_shader_parameter("active_glow", 2.2)

	_show_decrypting_tooltip(btn.position + Vector2(0.0, -95.0), def["title"], def["desc"])

func _on_card_unhovered(btn: Button, rect: TextureRect) -> void:
	var tw = btn.create_tween()
	tw.tween_property(btn, "scale", Vector2(1.0, 1.0), 0.10).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	if rect.material is ShaderMaterial:
		rect.material.set_shader_parameter("is_active", false)
		rect.material.set_shader_parameter("active_glow", 1.2)

	if tooltip_panel:
		tooltip_panel.visible = false

func _show_decrypting_tooltip(pos: Vector2, title_txt: String, desc_txt: String) -> void:
	if not tooltip_panel: return
	tooltip_panel.position = pos
	tooltip_panel.visible = true

	if decrypt_tween:
		decrypt_tween.kill()

	tooltip_title.text = title_txt
	tooltip_label.text = "[GIẢI MÃ DỮ LIỆU...]"

	# Hiệu ứng chữ giải mã Sci-Fi nhảy ký tự ngẫu nhiên trong 0.12s
	decrypt_tween = create_tween()
	var chars = "#%*@&!$<>~_01"
	for step in range(3):
		decrypt_tween.tween_callback(func():
			var scramble = ""
			for c in desc_txt:
				scramble += chars[randi() % chars.length()] if (c != '\n' and c != ' ') else c
			if tooltip_label:
				tooltip_label.text = scramble
		)
		decrypt_tween.tween_interval(0.03)

	decrypt_tween.tween_callback(func():
		if tooltip_label:
			tooltip_label.text = desc_txt
	)

func open_arc(center_pos: Vector2 = Vector2.ZERO) -> void:
	if center_pos != Vector2.ZERO:
		position = center_pos
	open()

func close_arc() -> void:
	close()

func open() -> void:
	is_open = true
	visible = true
	queue_redraw()

	# Xòe nhanh 4 thẻ theo vòng cung với Stagger delay
	for i in range(cards.size()):
		var btn = cards[i]
		btn.position = Vector2(-58.0, -71.0)
		btn.scale = Vector2(0.2, 0.2)
		btn.modulate = Color(1, 1, 1, 0)

		var tw = btn.create_tween()
		tw.tween_interval(float(i) * 0.03)
		tw.parallel().tween_property(btn, "position", target_positions[i], 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(btn, "scale", Vector2(1.0, 1.0), 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(btn, "modulate", Color(1, 1, 1, 1), 0.18)

func close() -> void:
	if not is_open: return
	is_open = false
	if tooltip_panel:
		tooltip_panel.visible = false

	var tw = create_tween()
	for i in range(cards.size()):
		var btn = cards[i]
		tw.parallel().tween_property(btn, "position", Vector2(-58.0, -71.0), 0.15).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN)
		tw.parallel().tween_property(btn, "scale", Vector2(0.2, 0.2), 0.15)
		tw.parallel().tween_property(btn, "modulate", Color(1, 1, 1, 0), 0.12)

	tw.tween_callback(func():
		visible = false
		closed.emit()
	)

func toggle() -> void:
	if is_open:
		close()
	else:
		open()

func _draw() -> void:
	if not is_open: return
	# Vẽ các tia năng lượng Hologram Cyan nối từ tâm nút Build ra từng thẻ bài con
	for pos in target_positions:
		var card_center = pos + Vector2(58.0, 71.0)
		draw_line(Vector2.ZERO, card_center, Color(0.0, 0.95, 1.0, 0.35), 1.5)
		draw_circle(card_center * 0.5, 2.0, Color(0.0, 0.95, 1.0, 0.65))
