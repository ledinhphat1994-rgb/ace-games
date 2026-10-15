extends "../../addons/gut/test.gd"

## Test Suite cho Hệ thống Nguyên mẫu 3D Low-Poly & Multi-Perspective Camera

const CameraController3DClass = preload("../../scripts/3d/CameraController3D.gd")
const FloatingIslandProceduralClass = preload("../../scripts/3d/FloatingIslandProcedural.gd")
const Tower3DClass = preload("../../scripts/3d/Tower3D.gd")
const Enemy3DClass = preload("../../scripts/3d/Enemy3D.gd")

func test_camera_controller_modes() -> void:
	var cam_ctrl = CameraController3DClass.new()
	add_child_autofree(cam_ctrl)

	assert_eq(cam_ctrl.current_mode, CameraController3DClass.CameraMode.TACTICAL, "Góc nhìn mặc định phải là Tactical")

	# Test chuyển mode luân phiên
	cam_ctrl.toggle_camera_mode()
	# Vì chưa có tháp được gán nên TURRET sẽ an toàn fallback về TACTICAL
	assert_true(cam_ctrl.current_mode == CameraController3DClass.CameraMode.TURRET or cam_ctrl.current_mode == CameraController3DClass.CameraMode.TACTICAL)

	# Gán tháp và test Turret Mode
	var dummy_tower = Node3D.new()
	add_child_autofree(dummy_tower)
	cam_ctrl.set_camera_mode(CameraController3DClass.CameraMode.TURRET, dummy_tower)
	assert_eq(cam_ctrl.current_mode, CameraController3DClass.CameraMode.TURRET, "Phải chuyển sang Turret Mode khi có tháp")

	# Test Top-Down Mode
	cam_ctrl.set_camera_mode(CameraController3DClass.CameraMode.TOP_DOWN)
	assert_eq(cam_ctrl.current_mode, CameraController3DClass.CameraMode.TOP_DOWN, "Phải chuyển sang Top-Down Mode")

func test_floating_island_and_build_spots() -> void:
	var island = FloatingIslandProceduralClass.new()
	add_child_autofree(island)

	assert_gt(FloatingIslandProceduralClass.BUILD_SPOTS.size(), 0, "Phải có danh sách vị trí bệ đặt tháp")
	assert_not_null(island.path_3d, "Đảo bay phải sinh ra đường ray Path3D cho quái vật")
	assert_gt(island.path_3d.curve.get_point_count(), 2, "Đường cong Path3D phải có nhiều điểm uốn lượn")

func test_enemy3d_and_tower3d_interaction() -> void:
	var enemy = Enemy3DClass.new()
	add_child_autofree(enemy)
	assert_eq(enemy.current_hp, enemy.max_hp, "Quái phải có đầy đủ máu ban đầu")

	# Nhận sát thương
	enemy.take_damage(20.0)
	assert_eq(enemy.current_hp, enemy.max_hp - 20.0, "Máu quái phải giảm sau khi nhận sát thương")

	# Khởi tạo tháp
	var tower = Tower3DClass.new()
	add_child_autofree(tower)
	assert_gt(tower.attack_range, 0.0, "Tháp 3D phải có tầm bắn dương")
	assert_not_null(tower.turret_head, "Tháp 3D phải có nòng súng TurretHead")
