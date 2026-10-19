class_name SciFiCardTooltipHUD
extends PanelContainer

## SciFiCardTooltipHUD: Bảng Hồ Sơ Tác Chiến Hologram 2026 (Tactical Dossier Tooltip)
## Tích hợp vạch chỉ số Triple-Gauge neon, huy hiệu phân lớp mecha,
## hiệu ứng giải mã ký tự Sci-Fi scrambled decode và tự động chống tràn viewport

var lbl_badge: Label = null
var lbl_title: Label = null
var lbl_desc: Label = null
var lbl_cost: Label = null
var lbl_hotkey: Label = null

var bar_dmg_fill: ColorRect = null
var lbl_dmg_val: Label = null
var bar_spd_fill: ColorRect = null
var lbl_spd_val: Label = null
var bar_rng_fill: ColorRect = null
var lbl_rng_val: Label = null

var tags_container: HBoxContainer = null
var decode_tween: Tween = null
var is_active_showing: bool = false
var accent_neon: Color = Color(0.0, 0.95, 1.0)
var target_desc_text: String = ""

func _init() -> void:
	name = "SciFiCardTooltipHUD"
	z_index = 50
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false
	custom_minimum_size = Vector2(290.0, 195.0)

func _ready() -> void:
	_build_ui()

func _build_ui() -> void:
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.06, 0.11, 0.96)
	sb.border_color = Color(0.0, 0.95, 1.0, 0.85)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(10)
	sb.shadow_size = 18
	sb.shadow_color = Color(0.0, 0.15, 0.30, 0.65)
	sb.shadow_offset = Vector2(0, 4)
	add_theme_stylebox_override("panel", sb)

	var margin = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 14)
	margin.add_theme_constant_override("margin_right", 14)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	add_child(margin)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	margin.add_child(vbox)

	# 1. Hàng Tiêu Đề & Badge Phân Lớp
	var top_row = HBoxContainer.new()
	top_row.add_theme_constant_override("separation", 8)
	vbox.add_child(top_row)

	lbl_badge = Label.new()
	lbl_badge.add_theme_font_size_override("font_size", 9)
	lbl_badge.add_theme_color_override("font_color", Color(0.0, 0.95, 1.0))
	lbl_badge.text = "[ KHÍ TÀI ]"
	top_row.add_child(lbl_badge)

	var spacer_top = Control.new()
	spacer_top.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_row.add_child(spacer_top)

	lbl_cost = Label.new()
	lbl_cost.add_theme_font_size_override("font_size", 11)
	lbl_cost.add_theme_color_override("font_color", Color(1.0, 0.85, 0.25))
	lbl_cost.text = "🪙 100G"
	top_row.add_child(lbl_cost)

	lbl_title = Label.new()
	lbl_title.add_theme_font_size_override("font_size", 13)
	lbl_title.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	lbl_title.add_theme_color_override("font_outline_color", Color(0.02, 0.04, 0.08, 0.95))
	lbl_title.add_theme_constant_override("outline_size", 2)
	lbl_title.text = "THÁP GATLING LASER"
	vbox.add_child(lbl_title)

	var div = ColorRect.new()
	div.custom_minimum_size = Vector2(0, 1.5)
	div.color = Color(0.0, 0.85, 1.0, 0.5)
	vbox.add_child(div)

	# 2. Vạch Chỉ Số Triple-Gauge
	var gauges_box = VBoxContainer.new()
	gauges_box.add_theme_constant_override("separation", 4)
	vbox.add_child(gauges_box)

	bar_dmg_fill = _create_gauge_row(gauges_box, "⚔️ SÁT THƯƠNG", Color(1.0, 0.35, 0.30))
	bar_spd_fill = _create_gauge_row(gauges_box, "⚡ TỐC ĐỘ BẮN", Color(1.0, 0.80, 0.20))
	bar_rng_fill = _create_gauge_row(gauges_box, "🎯 TẦM TÁC CHIẾN", Color(0.0, 0.95, 1.0))

	# 3. Phân Tích Chiến Lược (Description)
	lbl_desc = Label.new()
	lbl_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	lbl_desc.add_theme_font_size_override("font_size", 10)
	lbl_desc.add_theme_color_override("font_color", Color(0.85, 0.92, 0.98))
	lbl_desc.text = "Đang tải dữ liệu hồ sơ..."
	vbox.add_child(lbl_desc)

	# 4. Hàng Footer Phím Tắt & Thẻ Khắc Chế
	var bot_row = HBoxContainer.new()
	bot_row.add_theme_constant_override("separation", 6)
	vbox.add_child(bot_row)

	tags_container = HBoxContainer.new()
	tags_container.add_theme_constant_override("separation", 4)
	bot_row.add_child(tags_container)

	var spacer_bot = Control.new()
	spacer_bot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bot_row.add_child(spacer_bot)

	lbl_hotkey = Label.new()
	lbl_hotkey.add_theme_font_size_override("font_size", 9)
	lbl_hotkey.add_theme_color_override("font_color", Color(0.4, 0.85, 1.0))
	lbl_hotkey.text = "[SPACE]"
	bot_row.add_child(lbl_hotkey)

func _create_gauge_row(parent: VBoxContainer, label_text: String, fill_color: Color) -> ColorRect:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	parent.add_child(row)

	var lbl = Label.new()
	lbl.custom_minimum_size = Vector2(95.0, 0)
	lbl.add_theme_font_size_override("font_size", 9)
	lbl.add_theme_color_override("font_color", Color(0.70, 0.80, 0.90))
	lbl.text = label_text
	row.add_child(lbl)

	var bg_bar = ColorRect.new()
	bg_bar.custom_minimum_size = Vector2(140.0, 6.0)
	bg_bar.color = Color(0.08, 0.12, 0.18, 0.90)
	bg_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(bg_bar)

	var fill_bar = ColorRect.new()
	fill_bar.custom_minimum_size = Vector2(70.0, 6.0)
	fill_bar.color = fill_color
	bg_bar.add_child(fill_bar)

	return fill_bar

## Hiển thị Dossier Tooltip phía trên nút card
func inspect_card(origin_node: Control, data: Dictionary) -> void:
	if not origin_node: return
	_apply_data(data)

	visible = true
	is_active_showing = true
	modulate = Color(1, 1, 1, 0)

	# Tính toán vị trí căn giữa phía trên card
	var card_rect = origin_node.get_global_rect()
	var tooltip_w = custom_minimum_size.x
	var tooltip_h = custom_minimum_size.y

	var target_x = card_rect.position.x + (card_rect.size.x - tooltip_w) * 0.5
	var target_y = card_rect.position.y - tooltip_h - 10.0

	# Viewport clamping chống tràn mép
	var vp_size = get_viewport_rect().size
	target_x = clampf(target_x, 16.0, vp_size.x - tooltip_w - 16.0)
	if target_y < 16.0:
		target_y = card_rect.position.y + card_rect.size.y + 10.0 # Nếu sát đỉnh thì đẩy xuống dưới

	global_position = Vector2(target_x, target_y + 8.0)

	var tw = create_tween()
	tw.tween_property(self, "modulate:a", 1.0, 0.14)
	tw.parallel().tween_property(self, "global_position:y", target_y, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

	_run_decode_animation(target_desc_text)

func dismiss() -> void:
	if not is_active_showing: return
	is_active_showing = false
	if decode_tween: decode_tween.kill()

	var tw = create_tween()
	tw.tween_property(self, "modulate:a", 0.0, 0.10)
	tw.tween_callback(func():
		visible = false
	)

func _apply_data(d: Dictionary) -> void:
	accent_neon = d.get("accent", Color(0.0, 0.95, 1.0))
	var sb = get_theme_stylebox("panel") as StyleBoxFlat
	if sb:
		sb.border_color = accent_neon

	if lbl_badge:
		lbl_badge.text = d.get("badge", "[ KHÍ TÀI ]")
		lbl_badge.add_theme_color_override("font_color", accent_neon)

	if lbl_title:
		lbl_title.text = d.get("title", "")

	if lbl_cost:
		var c = d.get("cost", "")
		lbl_cost.text = "🪙 " + str(c) if c != "" else ""

	if lbl_hotkey:
		lbl_hotkey.text = d.get("hotkey", "")

	target_desc_text = d.get("desc", "")

	# Cập nhật thanh đo chỉ số
	var dmg_ratio = clampf(d.get("dmg_ratio", 0.65), 0.05, 1.0)
	var spd_ratio = clampf(d.get("spd_ratio", 0.50), 0.05, 1.0)
	var rng_ratio = clampf(d.get("rng_ratio", 0.70), 0.05, 1.0)

	if bar_dmg_fill: bar_dmg_fill.custom_minimum_size.x = 140.0 * dmg_ratio
	if bar_spd_fill: bar_spd_fill.custom_minimum_size.x = 140.0 * spd_ratio
	if bar_rng_fill: bar_rng_fill.custom_minimum_size.x = 140.0 * rng_ratio

func _run_decode_animation(full_text: String) -> void:
	if not lbl_desc: return
	if decode_tween: decode_tween.kill()

	decode_tween = create_tween()
	var chars = "#%*@&!$<>~_01"
	for step in range(3):
		decode_tween.tween_callback(func():
			var scramble = ""
			for c in full_text:
				scramble += chars[randi() % chars.length()] if (c != '\n' and c != ' ') else c
			if lbl_desc:
				lbl_desc.text = scramble
		)
		decode_tween.tween_interval(0.025)

	decode_tween.tween_callback(func():
		if lbl_desc:
			lbl_desc.text = full_text
	)
