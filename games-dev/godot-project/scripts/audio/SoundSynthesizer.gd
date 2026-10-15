class_name SoundSynthesizer
extends Node

## SoundSynthesizer: Hệ thống Âm thanh Trung thực Từ Video & Bộ tổng hợp Procedural
## Tích hợp âm thanh thực tế từ Video:
## 1. Tiếng súng máy Gatling đanh thép giòn tan (4 biến thể ngẫu nhiên chống đơn điệu)
## 2. Tiếng mâm xoay cơ khí / servo turret khi quay ngắm mục tiêu
## 3. Tiếng vỏ đạn đồng va chạm mặt đất khi văng ra
## 4. Bộ tổng hợp Procedural hỗ trợ hiệu ứng Plasma, Tesla và UI

const SndGatling1 = preload("res://assets/audio/gatling_shot_1.wav")
const SndGatling2 = preload("res://assets/audio/gatling_shot_2.wav")
const SndGatling3 = preload("res://assets/audio/gatling_shot_3.wav")
const SndGatling4 = preload("res://assets/audio/gatling_shot_4.wav")
const SndTurretSwivel = preload("res://assets/audio/turret_swivel.wav")
const SndCasingDrop = preload("res://assets/audio/casing_drop.wav")

static var _shared_instance: SoundSynthesizer = null
static var _is_adding_to_root: bool = false

## Lấy hoặc tạo duy nhất 1 node SoundSynthesizer trên SceneTree để chia sẻ toàn cục
static func get_shared(caller: Node = null) -> SoundSynthesizer:
	if is_instance_valid(_shared_instance) and _shared_instance.is_inside_tree():
		return _shared_instance

	var root: Node = null
	if caller and is_instance_valid(caller) and caller.is_inside_tree():
		root = caller.get_tree().root
	elif Engine.get_main_loop() is SceneTree:
		var st = Engine.get_main_loop() as SceneTree
		if st and st.root:
			root = st.root

	if root:
		var existing = root.get_node_or_null("SharedSoundSynth")
		if existing is SoundSynthesizer:
			_shared_instance = existing
			return _shared_instance
		if not is_instance_valid(_shared_instance):
			_shared_instance = SoundSynthesizer.new()
			_shared_instance.name = "SharedSoundSynth"
		if not _shared_instance.is_inside_tree() and _shared_instance.get_parent() == null and not _is_adding_to_root:
			_is_adding_to_root = true
			root.add_child.call_deferred(_shared_instance)
		return _shared_instance

	if not is_instance_valid(_shared_instance):
		_shared_instance = SoundSynthesizer.new()
		_shared_instance.name = "SharedSoundSynth"
	return _shared_instance

func _attach_to_tree_if_needed() -> void:
	if is_inside_tree() or get_parent() != null or _is_adding_to_root:
		return
	var loop = Engine.get_main_loop()
	if loop is SceneTree:
		var root = (loop as SceneTree).root
		if root and not is_inside_tree() and get_parent() == null and not _is_adding_to_root:
			_is_adding_to_root = true
			root.add_child.call_deferred(self)


var _shot_players: Array[AudioStreamPlayer] = []
var _shot_idx: int = 0
var _swivel_player: AudioStreamPlayer = null
var _casing_player: AudioStreamPlayer = null
var _last_swivel_time: float = 0.0
var _is_setup: bool = false

# Procedural Generator cho Plasma / Tesla
var _synth_player: AudioStreamPlayer
var _generator: AudioStreamGenerator
var _playback: AudioStreamGeneratorPlayback
var _mix_rate: float = 22050.0

func _enter_tree() -> void:
	_is_adding_to_root = false
	_ensure_setup()
	if is_inside_tree() and is_instance_valid(_synth_player) and not _synth_player.playing:
		_synth_player.play()
		_playback = _synth_player.get_stream_playback() as AudioStreamGeneratorPlayback

func _ready() -> void:
	_ensure_setup()
	if is_inside_tree() and is_instance_valid(_synth_player) and not _synth_player.playing:
		_synth_player.play()
		_playback = _synth_player.get_stream_playback() as AudioStreamGeneratorPlayback

func _ensure_setup() -> void:
	if _is_setup:
		return
	_is_setup = true

	# 1. Pool 8 players chuyên dụng cho đạn Gatling bắn liên thanh cực nhanh không bị ngắt tiếng
	for i in range(8):
		var p = AudioStreamPlayer.new()
		p.bus = &"Master"
		if "playback_type" in p:
			p.playback_type = 1
		add_child(p)
		_shot_players.append(p)

	# 2. Player âm thanh mâm xoay servo từ video
	_swivel_player = AudioStreamPlayer.new()
	_swivel_player.bus = &"Master"
	_swivel_player.stream = SndTurretSwivel
	_swivel_player.volume_db = -6.0
	if "playback_type" in _swivel_player:
		_swivel_player.playback_type = 1
	add_child(_swivel_player)

	# 3. Player âm thanh vỏ đạn rơi từ video
	_casing_player = AudioStreamPlayer.new()
	_casing_player.bus = &"Master"
	_casing_player.stream = SndCasingDrop
	_casing_player.volume_db = -4.0
	if "playback_type" in _casing_player:
		_casing_player.playback_type = 1
	add_child(_casing_player)

	# 4. Synthesizer cho Plasma và Tesla
	_synth_player = AudioStreamPlayer.new()
	_generator = AudioStreamGenerator.new()
	_generator.mix_rate = _mix_rate
	_generator.buffer_length = 0.25
	_synth_player.stream = _generator
	_synth_player.bus = &"Master"
	if "playback_type" in _synth_player:
		_synth_player.playback_type = 1
	add_child(_synth_player)
	if is_inside_tree():
		_synth_player.play()
		_playback = _synth_player.get_stream_playback() as AudioStreamGeneratorPlayback

## 1. Súng máy Gatling: Tiếng súng thực tế trích xuất trực tiếp từ video
func play_gatling_shot() -> void:
	_attach_to_tree_if_needed()
	if not is_inside_tree():
		return
	if not _shot_players.is_empty():
		var p = _shot_players[_shot_idx]
		_shot_idx = (_shot_idx + 1) % _shot_players.size()
		var samples = [SndGatling1, SndGatling2, SndGatling3, SndGatling4]
		p.stream = samples[randi() % samples.size()]
		p.pitch_scale = randf_range(0.96, 1.05)
		p.volume_db = randf_range(-1.0, 1.0)
		p.play()
	else:
		_synthesize_sweep(1450.0, 260.0, 0.045, 0.26)

## 2. Mâm xoay cơ khí Turret Swivel từ video
func play_turret_swivel() -> void:
	_attach_to_tree_if_needed()
	if not is_inside_tree():
		return
	var now = Time.get_ticks_msec() / 1000.0
	if now - _last_swivel_time > 0.75:
		_last_swivel_time = now
		if _swivel_player and not _swivel_player.playing:
			_swivel_player.pitch_scale = randf_range(0.95, 1.05)
			_swivel_player.play()

## 3. Vỏ đạn kim loại va chạm từ video
func play_casing_drop() -> void:
	_attach_to_tree_if_needed()
	if not is_inside_tree():
		return
	if _casing_player:
		_casing_player.pitch_scale = randf_range(0.92, 1.10)
		_casing_player.play()


## 4. Pháo Plasma: Nạp năng lượng & Bắn cầu ion
func play_plasma_charge() -> void:
	_synthesize_sweep(180.0, 720.0, 0.24, 0.35)

func play_plasma_shot() -> void:
	_synthesize_sweep(850.0, 95.0, 0.26, 0.55)

func play_plasma_blast() -> void:
	_synthesize_sweep(760.0, 65.0, 0.32, 0.65)

## 5. Tháp Tesla: Phóng điện sét
func play_tesla_zap() -> void:
	_synthesize_sweep(1900.0, 110.0, 0.16, 0.48)

func play_tesla_lightning() -> void:
	_synthesize_sweep(2200.0, 85.0, 0.20, 0.55)

## 6. Hiệu ứng va chạm & Quái chết
func play_hit() -> void:
	_synthesize_sweep(340.0, 95.0, 0.06, 0.28)

func play_enemy_death() -> void:
	_synthesize_sweep(260.0, 42.0, 0.28, 0.55)

## 7. Kỹ năng & Thăng cấp
func play_emp_shockwave() -> void:
	_synthesize_sweep(1500.0, 450.0, 0.35, 0.55)

func play_blackhole_overload() -> void:
	_synthesize_sweep(65.0, 30.0, 0.65, 0.70)

func play_upgrade() -> void:
	_synthesize_sweep(440.0, 880.0, 0.25, 0.45)

func play_sell() -> void:
	_synthesize_sweep(350.0, 700.0, 0.15, 0.35)

func play_ui_tap() -> void:
	_synthesize_sweep(520.0, 680.0, 0.04, 0.22)

func play_frost_zap() -> void:
	_synthesize_sweep(1200.0, 1800.0, 0.22, 0.38)

func play_emp_shock() -> void:
	_synthesize_sweep(240.0, 80.0, 0.35, 0.55)

func play_plasma_cannon() -> void:
	play_plasma_blast()

## 8. Tiếng bước chân cơ khí Mech Walker dậm đất
func play_mech_step() -> void:
	_synthesize_sweep(130.0, 48.0, 0.07, 0.18)

func _synthesize_sweep(start_freq: float, end_freq: float, duration: float, volume: float) -> void:
	_attach_to_tree_if_needed()
	if not is_inside_tree():
		return
	if not _is_setup:
		_ensure_setup()
	if not _playback:
		if _synth_player and not _synth_player.playing and is_inside_tree():
			_synth_player.play()
		if _synth_player:
			_playback = _synth_player.get_stream_playback() as AudioStreamGeneratorPlayback
		if not _playback:
			return

	var frames_to_push = int(_mix_rate * duration)
	var available = _playback.get_frames_available()
	frames_to_push = mini(frames_to_push, available)
	if frames_to_push <= 0:
		return

	var phase: float = 0.0
	for i in range(frames_to_push):
		var t = float(i) / float(frames_to_push)
		var current_freq = lerpf(start_freq, end_freq, t)
		var amp = (1.0 - t) * volume
		phase += (current_freq / _mix_rate) * TAU
		if phase > TAU:
			phase -= TAU
		var sample = sin(phase) * amp
		_playback.push_frame(Vector2(sample, sample))
