class_name Motion3DStudio
extends Node3D

## Motion3DStudio: Phòng Trình Diễn Hoạt Ảnh 3D Motion Capture
## Tích hợp toàn bộ 85 clip chuyển động chuyên nghiệp từ ActionForge MoCap:
## - Bước đi (Walk)
## - Chạy bộ (Jog)
## - Nước rút (Sprint)
## - Quái vật Zombie (Zombie Walk)
## - Bị bắn giật lùi (Hit Knockback)
## - Ngã gục chết (Death)
## - Đứng nghỉ ngơi (Idle)

const CLIPS = {
	"1. Bước Đi (Walk)": "res://assets/motions/walk_loop_inplace.glb",
	"2. Chạy Bộ (Jog)": "res://assets/motions/jog_fwd_loop_inplace.glb",
	"3. Nước Rút (Sprint)": "res://assets/motions/sprint_loop_inplace.glb",
	"4. Quái Zombie": "res://assets/motions/zombie_walk_fwd_loop_inplace.glb",
	"5. Bị Bắn Lùi": "res://assets/motions/hit_knockback_inplace.glb",
	"6. Ngã Gục (Death)": "res://assets/motions/death01_inplace.glb",
	"7. Đứng Thở (Idle)": "res://assets/motions/idle_loop_inplace.glb"
}

var _current_model_node: Node3D = null
var _current_anim_player: AnimationPlayer = null
var _turntable_speed: float = 0.35
var _is_turntable_active: bool = true

@onready var character_mount: Node3D = $CharacterMount
@onready var camera_pivot: Node3D = $CameraPivot
@onready var button_container: HBoxContainer = $UI/HUD/ClipBar/ButtonContainer
@onready var label_clip_name: Label = $UI/HUD/ClipBar/LabelCurrentClip

func _ready() -> void:
	_create_ui_buttons()
	play_clip("1. Bước Đi (Walk)")

func _process(delta: float) -> void:
	if _is_turntable_active and camera_pivot:
		camera_pivot.rotation.y += _turntable_speed * delta

func _create_ui_buttons() -> void:
	if not button_container:
		return
	for child in button_container.get_children():
		child.queue_free()

	for clip_name in CLIPS.keys():
		var btn = Button.new()
		btn.text = clip_name
		btn.custom_minimum_size = Vector2(110, 36)
		btn.add_theme_font_size_override("font_size", 13)
		btn.pressed.connect(func(): play_clip(clip_name))
		button_container.add_child(btn)

func play_clip(clip_name: String) -> void:
	if not CLIPS.has(clip_name):
		return

	if label_clip_name:
		label_clip_name.text = "ĐANG PHÁT: " + clip_name

	if _current_model_node:
		_current_model_node.queue_free()
		_current_model_node = null

	var glb_path = CLIPS[clip_name]
	var packed_scene = load(glb_path) as PackedScene
	if not packed_scene:
		return

	_current_model_node = packed_scene.instantiate()
	character_mount.add_child(_current_model_node)

	# Tìm AnimationPlayer trong scene vừa instantiate
	_current_anim_player = _find_animation_player(_current_model_node)
	if _current_anim_player:
		var anim_list = _current_anim_player.get_animation_list()
		if anim_list.size() > 0:
			var anim_name = anim_list[0]
			var anim = _current_anim_player.get_animation(anim_name)
			if anim and not clip_name.contains("Death") and not clip_name.contains("Bắn"):
				anim.loop_mode = Animation.LOOP_LINEAR
			_current_anim_player.play(anim_name)

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var found = _find_animation_player(child)
		if found:
			return found
	return null

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_1: play_clip("1. Bước Đi (Walk)")
			KEY_2: play_clip("2. Chạy Bộ (Jog)")
			KEY_3: play_clip("3. Nước Rút (Sprint)")
			KEY_4: play_clip("4. Quái Zombie")
			KEY_5: play_clip("5. Bị Bắn Lùi")
			KEY_6: play_clip("6. Ngã Gục (Death)")
			KEY_7: play_clip("7. Đứng Thở (Idle)")
			KEY_SPACE:
				_is_turntable_active = not _is_turntable_active
