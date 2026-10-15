# Tham chiếu nhanh mã nguồn WebBridge cho Godot
# File gốc nằm tại: res://scripts/WebBridge.gd

extends Node

@warning_ignore("unused_signal")
signal user_info_received(info: Dictionary)

var _is_web: bool = false
var _js_bridge = null

func _ready() -> void:
	_is_web = OS.has_feature("web")
	if _is_web and ClassDB.class_exists("JavaScriptBridge"):
		_js_bridge = JavaScriptBridge.get_interface("DigitalCampusBridge")

func trigger_haptic(pattern: String = "medium") -> void:
	if _is_web and _js_bridge != null:
		_js_bridge.triggerHaptic(pattern)
	else:
		print("[WebBridge] Rung:", pattern)

func submit_score(score: int, metadata: Dictionary = {}) -> void:
	if _is_web and _js_bridge != null:
		_js_bridge.submitScore(score, JSON.stringify(metadata))
	else:
		print("[WebBridge] Điểm:", score, metadata)

func exit_game() -> void:
	if _is_web and _js_bridge != null:
		_js_bridge.closeGame()
	else:
		print("[WebBridge] Thoát")
