class_name FsmStateMachine
extends Node

## FsmStateMachine: Bộ điều phối máy trạng thái hữu hạn (FSM) cho Godot 4
## Tự động đăng ký các FsmState con, chuyển đổi trạng thái an toàn và chuyển tiếp delta.

signal state_changed(old_state_name: String, new_state_name: String)

const StateScript = preload("State.gd")

@export var initial_state: Node

var current_state: Node = null
var states: Dictionary = {}

func _ready() -> void:
	# Tự động tìm và lưu toàn bộ Node con thuộc lớp FsmState
	for child in get_children():
		if child is StateScript:
			states[child.name.to_lower()] = child
			if child.has_signal("transitioned"):
				child.transitioned.connect(change_state)

	if initial_state:
		if initial_state.has_method("enter"):
			initial_state.enter()
		current_state = initial_state
	elif get_child_count() > 0 and get_child(0) is StateScript:
		current_state = get_child(0)
		if current_state.has_method("enter"):
			current_state.enter()

func _process(delta: float) -> void:
	if current_state and current_state.has_method("update"):
		current_state.update(delta)

func _physics_process(delta: float) -> void:
	if current_state and current_state.has_method("physics_update"):
		current_state.physics_update(delta)

## Chuyển sang trạng thái mới theo tên
func change_state(new_state_name: String) -> void:
	var target_key: String = new_state_name.to_lower()
	var new_state: Node = states.get(target_key)

	if not new_state or new_state == current_state:
		return

	var old_name: String = String(current_state.name) if current_state else ""
	if current_state and current_state.has_method("exit"):
		current_state.exit()

	current_state = new_state
	if current_state and current_state.has_method("enter"):
		current_state.enter()
	emit_signal("state_changed", old_name, String(new_state.name))
