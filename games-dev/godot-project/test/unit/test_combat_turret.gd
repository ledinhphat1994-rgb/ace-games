extends "../../addons/gut/test.gd"

## Test Suite: Kiểm Thử Toàn Diện Tháp Pháo 3D (Combat Turret GLB)
## Đảm bảo:
## 1. Load và khởi tạo mô hình combat_turret.glb
## 2. Rule 4 & 12 Ground Contact Invariant: Tiếp đất phẳng phiu tại Y = 0.0
## 3. Hoạt ảnh Action & IDLE
## 4. Bám đuổi mục tiêu và khai hỏa luân phiên nòng đôi

const GLB_PATH = "res://assets/models/towers/combat_turret.glb"
const CombatTurret3DClass = preload("res://scripts/towers/CombatTurret3D.gd")
const CombatTurretStudioClass = preload("res://scripts/towers/CombatTurretStudio.gd")
const Enemy3DClass = preload("res://scripts/3d/Enemy3D.gd")

func test_glb_asset_integrity() -> void:
	var packed = load(GLB_PATH) as PackedScene
	assert_not_null(packed, "File combat_turret.glb phải load được thành công")

func test_combat_turret_3d_lifecycle_and_ground_contact() -> void:
	var turret = CombatTurret3DClass.new()
	add_child_autofree(turret)

	assert_not_null(turret.model_root, "Turret phải có model_root")
	assert_eq(turret.model_root.position.y, 0.0, "Rule 4/12 Ground Contact: model_root phải ở Y=0.0")
	assert_not_null(turret._skeleton, "Turret phải tìm thấy Skeleton3D")
	assert_not_null(turret._anim_player, "Turret phải có AnimationPlayer")
	assert_gt(turret.attack_range, 0.0, "Tầm bắn phải lớn hơn 0")
	assert_gt(turret.base_damage, 0.0, "Sát thương phải lớn hơn 0")

	# Kiểm tra tọa độ 2 đầu nòng súng
	var muzzle_left = turret.get_muzzle_global_position(false)
	var muzzle_right = turret.get_muzzle_global_position(true)
	gut.p("Muzzle Left: " + str(muzzle_left))
	gut.p("Muzzle Right: " + str(muzzle_right))
	assert_gt(muzzle_left.y, 0.5, "Nòng súng trái phải nằm trên cao cách mặt đất > 0.5m")
	assert_gt(muzzle_right.y, 0.5, "Nòng súng phải phải nằm trên cao cách mặt đất > 0.5m")

func test_combat_turret_aiming_and_firing() -> void:
	var turret = CombatTurret3DClass.new()
	add_child_autofree(turret)
	turret.position = Vector3(0.0, 0.0, 0.0)

	# Tạo quái vật mục tiêu tại hướng (5, 0, 5)
	var enemy = Enemy3DClass.new()
	enemy.add_to_group("enemies_3d")
	enemy.position = Vector3(5.0, 0.0, 5.0)
	enemy.max_hp = 100.0
	enemy.current_hp = 100.0
	add_child_autofree(enemy)

	# Giả lập thời gian delta để tháp xoay và ngắm
	turret._update_target_and_aim(0.2)

	assert_not_null(turret.current_target, "Tháp phải phát hiện mục tiêu trong tầm bắn")
	assert_eq(turret.current_target, enemy, "Mục tiêu phải là quái vật vừa tạo")

	# Khai hỏa
	var hp_before = enemy.current_hp
	turret._fire_at(enemy)
	assert_lt(enemy.current_hp, hp_before, "Máu quái vật phải giảm sau phát bắn")

func test_combat_turret_studio_scene() -> void:
	var studio_scene = load("res://scenes/towers/CombatTurretStudio.tscn") as PackedScene
	assert_not_null(studio_scene, "Scene CombatTurretStudio.tscn phải tồn tại")

	var studio = studio_scene.instantiate() as Node3D
	add_child_autofree(studio)

	assert_not_null(studio.turret_instance, "Studio phải tự động tạo turret_instance")
	assert_not_null(studio.camera_pivot, "Studio phải có CameraPivot")
	assert_eq(studio.turret_instance.position.y, 0.0, "Turret trong Studio phải tiếp đất sát mặt bệ Y=0.0")

func test_animated_tower_25d_combat_turret() -> void:
	var tower = AnimatedTower.new()
	tower.setup(AnimatedTower.TowerType.COMBAT_TURRET)
	add_child_autofree(tower)

	assert_eq(tower.tower_type, AnimatedTower.TowerType.COMBAT_TURRET, "Tower type phải là COMBAT_TURRET")
	assert_not_null(tower.sprite_base, "Tháp 2.5D phải có sprite_base")
	assert_not_null(tower.sprite_head, "Tháp 2.5D phải có sprite_head")
	assert_not_null(tower._vp_combat, "Tháp phải khởi tạo 3D SubViewport để render mô hình 3D thực tế")
	assert_eq(tower._vp_combat.size, Vector2i(512, 512), "SubViewport phải có kích thước 512x512 để bao quát 360 độ không bị cắt hình")
	assert_true(tower._vp_combat.own_world_3d, "SubViewport phải có own_world_3d độc lập")
	assert_true(tower._vp_combat.transparent_bg, "SubViewport phải trong suốt để nền đảo hiển thị")
	assert_eq(AnimatedTower.get_tower_name(AnimatedTower.TowerType.COMBAT_TURRET), "THÁP PHÁO CHIẾN ĐẤU (3D)")

	# 1. KIỂM TRA TIẾP ĐẤT SÁT BỆ (Rule 4 Ground Contact Invariant)
	assert_eq(tower._turret_mount_pos, Vector2(0.0, 10.3), "Mount position phải ở (0, 10.3) để chân đế tiếp đất phẳng phiu sát bệ đá")
	assert_false(tower.sprite_base.visible, "sprite_base phải ẩn vì mô hình 3D đã có chân đế cơ giới nguyên khối")

	# 2. KIỂM TRA ĐẦU NÒNG SÚNG (Muzzle Tip)
	var muzzle_pos = tower.get_muzzle_local_pos()
	gut.p("Muzzle local pos: " + str(muzzle_pos))
	assert_ne(muzzle_pos, Vector2.ZERO, "Đầu nòng súng phải tính toán được tọa độ từ 3D unproject")

	# 3. KIỂM TRA THÂN Ụ SÚNG CỐ ĐỊNH KHI BẮN (Zero Body Jerk)
	var dummy_target = Node2D.new()
	add_child_autofree(dummy_target)
	dummy_target.position = Vector2(100.0, 0.0)

	var head_pos_before = tower.sprite_head.position
	tower._aim_dir = Vector2.RIGHT
	tower._fire_combat(dummy_target)

	assert_eq(tower.sprite_head.position, head_pos_before, "Thân ụ súng PHẢI CỐ ĐỊNH 100%, tuyệt đối không bị dựt hay dịch chuyển khi bắn")
	assert_eq(tower._recoil_offset, Vector2.ZERO, "Thân ụ súng không dùng _recoil_offset gây rung lắc")
	assert_lt(tower._recoil_slide, 0.0, "Nòng pháo 3D phải thụt lùi giật nảy trong trục nòng")

	# Sau khi nảy hồi phục
	tower._process(0.25)
	assert_eq(tower.sprite_head.position, head_pos_before, "Sau hồi phục, thân súng vẫn đứng yên tại vị trí ban đầu")
	assert_almost_eq(tower._recoil_slide, 0.0, 0.05, "Nòng pháo 3D phải nảy hồi phục về vị trí cân bằng")

	# 4. KIỂM TRA XOAY 360 ĐỘ LIÊN TỤC TỪNG ĐỘ MỘT
	assert_not_null(tower._skel_combat, "Skeleton3D phải tồn tại")
	assert_gt(tower._bone_mane, -1, "Phải tìm thấy xương ManeRotate_00 để xoay 360 độ")
	for deg in [1.0, 37.0, 89.0, 154.0, 273.0, 359.0]:
		var target_node = Node2D.new()
		add_child_autofree(target_node)
		var rad = deg_to_rad(deg)
		target_node.global_position = tower.global_position + Vector2(cos(rad), sin(rad) * 0.5) * 150.0
		tower.current_target = target_node
		tower._update_combat_aim_and_fire(0.2)
		assert_gt(tower.get_muzzle_local_pos().length(), 0.0, "Đầu nòng súng tại góc " + str(deg) + "° phải tính toán được")
