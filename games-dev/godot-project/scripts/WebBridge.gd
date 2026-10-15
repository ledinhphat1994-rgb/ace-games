extends Node

## WebBridge: Cầu nối hai chiều giữa Godot và Ứng dụng Mobile / Web Ace Games
## Hỗ trợ Rung Haptic di động, gửi điểm số, hiển thị Toast, nhận diện thiết bị và thoát game.

@warning_ignore("unused_signal")
signal user_info_received(info: Dictionary)
@warning_ignore("unused_signal")
signal game_paused_by_app()
@warning_ignore("unused_signal")
signal game_resumed_by_app()

var _is_web: bool = false
var _js_bridge = null
var _user_cache: Dictionary = {
	"id": "player_ace",
	"name": "Người chơi Ace Games",
	"role": "player"
}

func _ready() -> void:
	_is_web = OS.has_feature("web")
	if _is_web:
		print("[WebBridge] Đang chạy trên môi trường Web / WebView Mobile.")
		if ClassDB.class_exists("JavaScriptBridge"):
			_js_bridge = JavaScriptBridge.get_interface("AceGamesBridge")
			if _js_bridge == null:
				_js_bridge = JavaScriptBridge.get_interface("DigitalCampusBridge")
			if _js_bridge != null:
				print("[WebBridge] Đã kết nối thành công với AceGamesBridge!")
				_sync_user_info_from_web()
			else:
				print("[WebBridge] Chưa tìm thấy AceGamesBridge trên window (chạy độc lập).")
	else:
		print("[WebBridge] Đang chạy trong Godot Editor / Nền tảng Native (Chế độ mô phỏng).")

## Kiểm tra người chơi có đang dùng điện thoại di động / tablet hay không
func is_mobile() -> bool:
	if _is_web and _js_bridge != null:
		return bool(_js_bridge.isMobile())
	return OS.has_feature("mobile") or OS.has_feature("android") or OS.has_feature("ios")

## Gửi lệnh rung phản hồi xúc giác (Haptic Feedback) lên thiết bị di động
## Các kiểu pattern hỗ trợ: "selection", "light", "medium", "heavy", "success", "warning", "error"
func trigger_haptic(pattern: String = "medium") -> void:
	if _is_web and _js_bridge != null:
		_js_bridge.triggerHaptic(pattern)
	else:
		print("[WebBridge Haptic] Rung mô phỏng:", pattern)

## Gửi điểm số về hệ thống xếp hạng và CSDL lớp học
func submit_score(score: int, metadata: Dictionary = {}) -> void:
	if _is_web and _js_bridge != null:
		var meta_json = JSON.stringify(metadata)
		_js_bridge.submitScore(score, meta_json)
	else:
		print("[WebBridge Score] Điểm gửi:", score, "Dữ liệu:", metadata)

## Hiển thị thông báo Toast đẹp mắt lên giao diện App (Sonner Toast)
## Các kiểu variant: "info", "success", "error", "warning"
func show_toast(message: String, variant: String = "info") -> void:
	if _is_web and _js_bridge != null:
		_js_bridge.showToast(message, variant)
	else:
		print("[WebBridge Toast] [" + variant.to_upper() + "] " + message)

## Yêu cầu đóng game để quay về sảnh hoặc giao diện chính của App
func exit_game() -> void:
	trigger_haptic("light")
	if _is_web and _js_bridge != null:
		_js_bridge.closeGame()
	else:
		print("[WebBridge Exit] Yêu cầu thoát game!")

## Lấy thông tin người dùng đang đăng nhập
func get_user_info() -> Dictionary:
	return _user_cache

## Tiện ích lấy nhanh tên học sinh
func get_student_name() -> String:
	return str(_user_cache.get("name", "Học sinh 10A7"))

## Tiện ích lấy nhanh ID học sinh
func get_student_id() -> String:
	return str(_user_cache.get("id", "student_10a7"))

func _sync_user_info_from_web() -> void:
	if _is_web and _js_bridge != null:
		var raw_user = _js_bridge.getUserInfo()
		if raw_user != null:
			var json = JSON.new()
			if json.parse(str(raw_user)) == OK and typeof(json.data) == TYPE_DICTIONARY:
				_user_cache = json.data
				emit_signal("user_info_received", _user_cache)
