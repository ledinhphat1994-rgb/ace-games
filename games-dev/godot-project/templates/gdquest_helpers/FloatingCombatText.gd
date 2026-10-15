class_name FloatingCombatText
extends Node2D

## FloatingCombatText: Hiệu ứng chữ số sát thương / tiền thưởng bay lên (Combat Text)
## Lấy cảm hứng từ các demo mẫu của GDQuest. Tự động sinh label, trôi lên và mờ dần bằng Tween.

static func spawn(parent: Node, pos: Vector2, text: String, color: Color = Color(1.0, 0.85, 0.2)) -> void:
	if not parent:
		return

	var label = Label.new()
	label.text = text
	label.global_position = pos + Vector2(-30, -20)
	label.modulate = color
	label.add_theme_font_size_override("font_size", 20)
	label.z_index = 50

	parent.add_child(label)

	# Tạo hoạt ảnh Tween trôi lên và mờ dần trong 0.65 giây
	var tween = label.create_tween()
	tween.set_parallel(true)
	tween.tween_property(label, "position:y", label.position.y - 45.0, 0.65).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(label, "modulate:a", 0.0, 0.65).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.chain().tween_callback(label.queue_free)
