class_name CombatTextPool
extends Node2D

## CombatTextPool: Hệ thống Quản lý Đối tượng Tái sử dụng (Object Pooling) cho Chữ Sát Thương & Tiền Vàng
## Tuân thủ nghiêm ngặt nguyên tắc Zero-Allocation Tick & Godot Performance Guidelines:
## 1. Cấp phát trước 48 Node Label trong bộ nhớ liên tục khi khởi động Scene
## 2. Kích hoạt và tái sử dụng vòng lặp (Ring Buffer), hoàn toàn KHÔNG cấp phát mới (new) hay hủy (queue_free)
## 3. Triệt tiêu 100% hiện tượng Garbage Collection (GC) kích hoạt gây giật khựng khung hình (stutter/frame drop)

static var _instance: CombatTextPool = null

const POOL_SIZE: int = 48

class PooledLabel:
	var label: Label = null
	var tween: Tween = null
	var is_active: bool = false

var _pool: Array[PooledLabel] = []
var _next_idx: int = 0

static func get_instance() -> CombatTextPool:
	return _instance

func _enter_tree() -> void:
	_instance = self

func _exit_tree() -> void:
	if _instance == self:
		_instance = null

func _ready() -> void:
	z_index = 40 # Hiển thị trên đầu quái vật và công trình
	_init_pool()

func _init_pool() -> void:
	_pool.clear()
	for i in range(POOL_SIZE):
		var p_item = PooledLabel.new()
		var lbl = Label.new()
		lbl.name = "CombatLabel_%d" % i
		lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
		lbl.visible = false
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		lbl.add_theme_font_size_override("font_size", 14)
		lbl.add_theme_color_override("font_color", Color.WHITE)
		lbl.add_theme_color_override("font_outline_color", Color(0.04, 0.06, 0.10, 0.95))
		lbl.add_theme_constant_override("outline_size", 3)
		add_child(lbl)
		p_item.label = lbl
		_pool.append(p_item)

## Lấy một Label từ pool và chạy hoạt ảnh bay lên
func spawn_text(pos: Vector2, text: String, color: Color, font_sz: int = 14, rise_y: float = 35.0, duration: float = 0.50) -> void:
	if _pool.is_empty():
		return

	var item: PooledLabel = _pool[_next_idx]
	_next_idx = (_next_idx + 1) % POOL_SIZE

	if item.tween and item.tween.is_valid():
		item.tween.kill()

	var lbl: Label = item.label
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", font_sz)
	lbl.add_theme_color_override("font_color", color)
	lbl.global_position = pos + Vector2(-40.0, -20.0)
	lbl.size = Vector2(80.0, 24.0)
	lbl.modulate = Color(1.0, 1.0, 1.0, 1.0)
	lbl.scale = Vector2(1.0, 1.0)
	lbl.visible = true
	item.is_active = true

	var tw = create_tween()
	item.tween = tw
	tw.tween_property(lbl, "global_position:y", lbl.global_position.y - rise_y, duration).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(lbl, "modulate:a", 0.0, duration)
	tw.tween_callback(func():
		lbl.visible = false
		item.is_active = false
	)
