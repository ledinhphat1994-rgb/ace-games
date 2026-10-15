class_name ProceduralAudioGenerator
extends RefCounted

## ProceduralAudioGenerator: Bộ sinh âm thanh Sci-Fi thời gian thực (Zero-Asset Audio)
## Tạo sóng Sine, Square, Noise và xuất ra AudioStreamWAV độc lập hoàn toàn.
## Không cần bất kỳ file MP3/WAV ngoài nào, tải tức thì và tối ưu dung lượng WebAssembly.

const SAMPLE_RATE: int = 22050

## Sinh âm thanh tiếng bắn Laser (tần số quét giảm dần)
static func generate_laser_sound(start_freq: float = 880.0, end_freq: float = 140.0, duration: float = 0.18) -> AudioStreamWAV:
	var total_samples: int = int(SAMPLE_RATE * duration)
	var byte_data: PackedByteArray = PackedByteArray()
	byte_data.resize(total_samples)

	var phase: float = 0.0
	for i in range(total_samples):
		var t: float = float(i) / float(total_samples)
		var current_freq: float = lerpf(start_freq, end_freq, t * t)
		phase += TAU * current_freq / float(SAMPLE_RATE)

		# Sóng kết hợp Sine và Triangle
		var sample: float = sin(phase) * 0.7 + (2.0 * abs(fmod(phase / TAU, 1.0) - 0.5) - 0.5) * 0.3
		var envelope: float = 1.0 - t
		var val_8bit: int = clampi(int((sample * envelope * 0.85 + 1.0) * 127.5), 0, 255)
		byte_data[i] = val_8bit

	return _create_wav_stream(byte_data)

## Sinh âm thanh tiếng Nổ (White noise có suy giảm)
static func generate_explosion_sound(duration: float = 0.35) -> AudioStreamWAV:
	var total_samples: int = int(SAMPLE_RATE * duration)
	var byte_data: PackedByteArray = PackedByteArray()
	byte_data.resize(total_samples)

	var last_noise: float = 0.0
	for i in range(total_samples):
		var t: float = float(i) / float(total_samples)
		var raw_noise: float = randf_range(-1.0, 1.0)
		# Bộ lọc thông thấp đơn giản để làm dày tiếng nổ
		last_noise = lerpf(last_noise, raw_noise, 0.35)

		var envelope: float = pow(1.0 - t, 2.0)
		var val_8bit: int = clampi(int((last_noise * envelope * 0.95 + 1.0) * 127.5), 0, 255)
		byte_data[i] = val_8bit

	return _create_wav_stream(byte_data)

## Sinh âm thanh nhặt Vàng (Hai nốt Arpeggio vút lên)
static func generate_coin_sound() -> AudioStreamWAV:
	var duration: float = 0.16
	var total_samples: int = int(SAMPLE_RATE * duration)
	var byte_data: PackedByteArray = PackedByteArray()
	byte_data.resize(total_samples)

	var phase: float = 0.0
	var mid_sample: int = int(float(total_samples) / 2.0)

	for i in range(total_samples):
		var freq: float = 987.77 if i < mid_sample else 1318.51 # Note B5 -> E6
		phase += TAU * freq / float(SAMPLE_RATE)

		var sample: float = sin(phase)
		var sub_t: float = float(i % mid_sample) / float(mid_sample)
		var envelope: float = 1.0 - sub_t
		var val_8bit: int = clampi(int((sample * envelope * 0.75 + 1.0) * 127.5), 0, 255)
		byte_data[i] = val_8bit

	return _create_wav_stream(byte_data)

## Sinh âm thanh Trọng Lực chuyển chế độ (Sóng Sine trầm ấm 65Hz)
static func generate_gravity_pulse_sound(duration: float = 0.28) -> AudioStreamWAV:
	var total_samples: int = int(SAMPLE_RATE * duration)
	var byte_data: PackedByteArray = PackedByteArray()
	byte_data.resize(total_samples)

	var phase: float = 0.0
	for i in range(total_samples):
		var t: float = float(i) / float(total_samples)
		var freq: float = lerpf(65.0, 110.0, sin(t * PI))
		phase += TAU * freq / float(SAMPLE_RATE)

		var sample: float = sin(phase)
		var envelope: float = sin(t * PI) # Phồng ở giữa, êm ở hai đầu
		var val_8bit: int = clampi(int((sample * envelope * 0.9 + 1.0) * 127.5), 0, 255)
		byte_data[i] = val_8bit

	return _create_wav_stream(byte_data)

## Đóng gói mảng byte thành đối tượng AudioStreamWAV chuẩn Godot 4
static func _create_wav_stream(data: PackedByteArray) -> AudioStreamWAV:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = SAMPLE_RATE
	stream.stereo = false
	stream.data = data
	return stream
