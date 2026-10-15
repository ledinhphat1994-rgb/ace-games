class_name MainStylized
extends Node2D

## MainStylized: Chiến Trường Đảo Bay Hoạt Họa 2.5D Cao Cấp & Đa Tầm Nhìn
## Tích hợp:
## 1. Tọa độ chính xác 100% từng bệ đá tròn và con đường cát uốn lượn qua cầu đá
## 2. Camera Đa Tầm Nhìn (StylizedCameraController): Cận Cảnh Chiến Thuật Siêu Nét, Toàn Cảnh Đảo, Theo Dõi Quái
## 3. Hệ thống Nâng Cấp (Lv1 -> Lv2 -> Lv3 Cực Phẩm) và Bán Tháp hoàn lại 70% vàng
## 4. Hệ thống Đạn có vệt sáng Neon, va chạm nổ hạt lửa và sát thương bay lên
## 5. Quái vật bước đi nhịp nhàng, nổ tung và thưởng vàng khi chết
## 6. Âm thanh Procedural sống động (súng bắn, đạn trúng, quái chết, nâng cấp)

const TowerClass = preload("res://scripts/stylized/AnimatedTower.gd")
const EnemyClass = preload("res://scripts/stylized/AnimatedEnemy.gd")
const CameraClass = preload("res://scripts/stylized/StylizedCameraController.gd")
const SoundSynthClass = preload("res://scripts/audio/SoundSynthesizer.gd")
const HudVectorIcon = preload("res://scripts/stylized/HudVectorIcon.gd")

# Card Tháp Pháo chân thực, sắc nét 100% (Render từ mô hình tháp thật)
const CardGatling = preload("res://assets/textures/cards/card_gatling.png")
const CardPlasma = preload("res://assets/textures/cards/card_plasma.png")
const CardTesla = preload("res://assets/textures/cards/card_tesla.png")
const CardSAM = preload("res://assets/textures/cards/card_sam.png")
const CardFrost = preload("res://assets/textures/cards/card_frost.png")

# Icon Nút Bottom Bar
const IconBtnTower = preload("res://assets/textures/cards/btn_hud_tower.png")
const IconBtnSkill = preload("res://assets/textures/cards/btn_hud_skill.png")
const IconBtnSpell = preload("res://assets/textures/cards/btn_hud_spell.png")
const IconBtnWave = preload("res://assets/textures/cards/btn_hud_wave.png")

# Icon Kỹ Năng Khoa Học
const IconSkillR1 = preload("res://assets/textures/skills/skill_range_1.png")
const IconSkillR2 = preload("res://assets/textures/skills/skill_range_2.png")
const IconSkillR3 = preload("res://assets/textures/skills/skill_range_3.png")

const IconSkillD1 = preload("res://assets/textures/skills/skill_dmg_1.png")
const IconSkillD2 = preload("res://assets/textures/skills/skill_dmg_2.png")
const IconSkillD3 = preload("res://assets/textures/skills/skill_dmg_3.png")

const IconSkillS1 = preload("res://assets/textures/skills/skill_spd_1.png")
const IconSkillS2 = preload("res://assets/textures/skills/skill_spd_2.png")
const IconSkillS3 = preload("res://assets/textures/skills/skill_spd_3.png")

# Phép Thuật
const IconSpellLightning = preload("res://assets/textures/skills/spell_lightning.png")
const IconSpellFreeze = preload("res://assets/textures/skills/spell_freeze.png")
const IconSpellMeteor = preload("res://assets/textures/skills/spell_meteor.png")

# 2.5D Vi Mạch Năng Lượng / Conduits
const ConduitRange = preload("res://assets/textures/skills/conduit_range.png")
const ConduitDamage = preload("res://assets/textures/skills/conduit_dmg.png")
const ConduitSpeed = preload("res://assets/textures/skills/conduit_spd.png")

# Sprite Trụ cho Preview Đặt Tháp Tạm Thời 2.5D
const TexGatlingBase = preload("res://assets/sprites/tower_gatling_base.png")
const TexGatlingTurretDir0 = preload("res://assets/sprites/towers/gatling/gatling_dir_0.png")
const TexPlasmaBase = preload("res://assets/sprites/tower_plasma_base.png")
const TexPlasmaTurretDir0 = preload("res://assets/sprites/towers/plasma/plasma_dir_0.png")
const TexTesla = preload("res://assets/sprites/tower_tesla_coil.png")
const TexPlacementMask = preload("res://assets/textures/placement_mask.png")

var placement_mask_image: Image = null


# Tọa độ tim đường mòn uốn lượn chính xác 100% theo nét vẽ tay trên bản đồ (Chiến trường Đại Lục 1376x768)
const PATH_WAYPOINTS: Array[Vector2] = [
	Vector2(145.0, 400.0), # W0: Thềm đá trước Cổng Portal huyền bí phía Tây
	Vector2(190.0, 415.0), # W1: Tim đường đất ngay trước thềm portal
	Vector2(245.0, 440.0), # W2: Tim đường đất bắt đầu lượn vòng cung
	Vector2(295.0, 470.0), # W3: Giữa lòng đường đất ven rặng thông trên
	Vector2(350.0, 495.0), # W4: Giữa lòng đường đất khúc trũng trước bờ suối
	Vector2(400.0, 485.0), # W5: Tim đường dẫn hướng thẳng vào mố cầu phía Tây (tránh ngọn cây)
	Vector2(440.0, 460.0), # W6: Lên sàn Cầu Đá vượt thác (qua trụ cờ đỏ Tây)
	Vector2(480.0, 425.0), # W7: Đỉnh vòm sàn Cầu Đá cổ kính (chính giữa 2 lan can)
	Vector2(525.0, 400.0), # W8: Xuống dốc sàn Cầu Đá phía Đông (chính giữa 2 trụ cờ)
	Vector2(575.0, 385.0), # W9: Tim đường đất nối từ đầu cầu ra bình nguyên
	Vector2(635.0, 388.0), # W10: Giữa khe hàng rào cọc gỗ tiền đồn
	Vector2(695.0, 395.0), # W11: Tim đường bằng trước tháp canh đá
	Vector2(755.0, 395.0), # W12: Qua khe mở giữa 2 hàng cọc gỗ phòng thủ thứ hai
	Vector2(815.0, 398.0), # W13: Giữa hai tháp thành kiểm soát
	Vector2(880.0, 415.0), # W14: Bắt đầu vào đại lộ lát đá cuội ven bờ hồ
	Vector2(950.0, 424.0), # W15: Tim đường đá cuội uốn lượn ven mặt nước
	Vector2(1015.0, 418.0), # W16: Đáy khúc cua đại lộ đá cuội
	Vector2(1060.0, 392.0), # W17: Khúc cua dốc đá cuội hướng lên lối vào pháo đài
	Vector2(1095.0, 365.0), # W18: Giữa hai cột cờ hiệu dẫn vào cầu dốc đá
	Vector2(1140.0, 338.0), # W19: Chính giữa tim sàn dốc đá dẫn vào cửa thành
	Vector2(1178.0, 312.0)  # W20: Cửa Vòm Gỗ Pháo Đài Hoàng Gia
]

# Tọa độ chính xác 100% của 14 vị trí bệ đá phòng thủ trên đại lục chiến trường (chuẩn thảm cỏ, không rơi xuống nước hay lòng đường)
const BUILD_PADS: Array[Vector2] = [
	Vector2(250.0, 260.0), # Pad 0: Cao nguyên rừng thông Tây Bắc
	Vector2(370.0, 285.0), # Pad 1: Bờ đồi phía trên dòng suối Tây
	Vector2(520.0, 285.0), # Pad 2: Mỏm đá hoa cương trung tâm Bắc
	Vector2(580.0, 335.0), # Pad 3: Vọng gác sau lưng tháp canh đá
	Vector2(880.0, 360.0), # Pad 4: Thảo nguyên ven hồ nước Đông Bắc
	Vector2(970.0, 360.0), # Pad 5: Bờ vịnh cối xay gió
	Vector2(640.0, 435.0), # Pad 6: Bình nguyên cao giữa 2 khúc cua tử địa
	Vector2(730.0, 435.0), # Pad 7: Thềm cỏ kiểm soát cung đường chính
	Vector2(1090.0, 435.0), # Pad 8: Bậc thềm trước tiền đồn lâu đài
	Vector2(850.0, 460.0), # Pad 9: Cung đường đón lõng trước cổng thành
	Vector2(1000.0, 460.0), # Pad 10: Vọng lâu trước hào thành lâu đài
	Vector2(700.0, 510.0), # Pad 11: Thảo nguyên hạ lưu trung tâm
	Vector2(640.0, 560.0), # Pad 12: Đồi cỏ phía Nam bao quát cầu đá
	Vector2(1180.0, 585.0)  # Pad 13: Thềm quan sát pháo đài Đông Nam
]

# Ô Địa hình Chiến thuật Đặc biệt (Tactical Buff Pads)
const OVERWATCH_PAD_IDX: int = 3       # Ô Cao Điểm (+15% Tầm bắn)
const POWER_CONDUIT_PAD_IDX: int = 9   # Ô Mạch Năng Lượng (+15% Tốc độ bắn)
var game_speed: float = 1.0

# Kinh tế & trận đấu
var base_health: int = 20
var max_health: int = 20
var gold: int = 350
var score: int = 335
var current_wave: int = 0
var is_wave_active: bool = false
var is_game_over: bool = false
var is_victory: bool = false
const MAX_WAVES: int = 10
var _enemies_remaining: int = 0
var _spawn_timer: float = 0.0

# Bệ & Tháp đang được tương tác
var selected_pad_idx: int = -1
var selected_tower: AnimatedTower = null

# Chế độ Đặt Trụ Tự Do (Freeform Tower Placement)
var is_placing_tower: bool = false
var placing_tower_type: int = TowerClass.TowerType.GATLING_GUN
var placing_cost: int = 100
var placing_range: float = 230.0
var placement_preview_pos: Vector2 = Vector2.ZERO
var is_placement_valid: bool = false
var targeted_build_pos: Vector2 = Vector2.ZERO
var _js_callbacks: Array = []

# Node tham chiếu

@onready var island_sprite: Sprite2D = $IslandContainer/IslandSprite
@onready var towers_container: Node2D = $TowersContainer
@onready var enemies_container: Node2D = $EnemiesContainer
@onready var camera_ctrl: StylizedCameraController = $StylizedCamera

# UI References
@onready var label_score: Label = $UI/HUD/ScoreBox/Margin/HBox/LabelScoreVal
@onready var label_health: Label = get_node_or_null("UI/HUD/HealthBox/Margin/HBox/LabelHealthVal")
var health_progress_bar: ProgressBar = null
@onready var label_wave: Label = $UI/HUD/WaveBox/Margin/HBox/LabelWaveVal
@onready var label_gold: Label = $UI/HUD/WaveBox/Margin/HBox/LabelGoldVal
@onready var label_wave_intel: Label = get_node_or_null("UI/HUD/WaveIntelBox/Margin/LabelWaveIntel")
@onready var label_record: Label = get_node_or_null("UI/HUD/RecordBox/Margin/LabelRecord")
@onready var btn_camera_mode: Button = $UI/HUD/BtnCameraMode
@onready var btn_speed: Button = get_node_or_null("UI/HUD/BtnSpeed")

# Bottom Bar (Thanh điều khiển đáy màn hình)
@onready var bottom_bar: PanelContainer = $UI/HUD/BottomBar
@onready var btn_build: Button = $UI/HUD/BottomBar/Margin/HBox/BtnBuild
@onready var btn_skill_tree: Button = $UI/HUD/BottomBar/Margin/HBox/BtnSkillTree
@onready var btn_spell: Button = $UI/HUD/BottomBar/Margin/HBox/BtnSpell
@onready var btn_next_wave: Button = $UI/HUD/BottomBar/Margin/HBox/BtnNextWave

# Quick Tower Tray (Khay Mua Tháp Nhanh - 3 loại vũ khí chuẩn)
@onready var quick_tower_tray: PanelContainer = $UI/HUD/QuickTowerTray
@onready var btn_quick_gatling: Button = $UI/HUD/QuickTowerTray/Margin/HBox/BtnQuickGatling
@onready var btn_quick_plasma: Button = $UI/HUD/QuickTowerTray/Margin/HBox/BtnQuickPlasma
@onready var btn_quick_tesla: Button = $UI/HUD/QuickTowerTray/Margin/HBox/BtnQuickTesla
var btn_quick_sam: Button = null
var btn_quick_frost: Button = null
@onready var btn_close_tower_tray: Button = $UI/HUD/QuickTowerTray/Margin/HBox/BtnCloseTowerTray

# Quick Spell Tray (Khay Phép Thuật Nhanh)
@onready var quick_spell_tray: PanelContainer = $UI/HUD/QuickSpellTray
@onready var btn_spell_lightning: Button = $UI/HUD/QuickSpellTray/Margin/HBox/BtnSpellLightning
@onready var btn_spell_freeze: Button = $UI/HUD/QuickSpellTray/Margin/HBox/BtnSpellFreeze
@onready var btn_spell_meteor: Button = $UI/HUD/QuickSpellTray/Margin/HBox/BtnSpellMeteor
@onready var btn_close_spell_tray: Button = $UI/HUD/QuickSpellTray/Margin/HBox/BtnCloseSpellTray

# Skill Tree Modal (Cây Kỹ Năng & Vi Mạch Hoạt Tính 2.5D)
@onready var skill_tree_modal: Control = $UI/SkillTreeModal
@onready var btn_close_skill_tree: Button = $UI/SkillTreeModal/Card/Margin/VBox/HeaderHBox/BtnCloseSkillTree
@onready var lbl_gold_skill: Label = $UI/SkillTreeModal/Card/Margin/VBox/GoldBanner/Margin/HBox/LabelGoldSkill
@onready var lbl_current_bonuses: Label = $UI/SkillTreeModal/Card/Margin/VBox/GoldBanner/Margin/HBox/LabelCurrentBonuses

@onready var btn_skill_r1: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColRange/BtnSkillR1
@onready var arrow_r1: TextureRect = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColRange/ArrowR1
@onready var btn_skill_r2: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColRange/BtnSkillR2
@onready var arrow_r2: TextureRect = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColRange/ArrowR2
@onready var btn_skill_r3: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColRange/BtnSkillR3

@onready var btn_skill_d1: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColDamage/BtnSkillD1
@onready var arrow_d1: TextureRect = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColDamage/ArrowD1
@onready var btn_skill_d2: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColDamage/BtnSkillD2
@onready var arrow_d2: TextureRect = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColDamage/ArrowD2
@onready var btn_skill_d3: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColDamage/BtnSkillD3

@onready var btn_skill_s1: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColSpeed/BtnSkillS1
@onready var arrow_s1: TextureRect = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColSpeed/ArrowS1
@onready var btn_skill_s2: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColSpeed/BtnSkillS2
@onready var arrow_s2: TextureRect = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColSpeed/ArrowS2
@onready var btn_skill_s3: Button = $UI/SkillTreeModal/Card/Margin/VBox/ColumnsHBox/ColSpeed/BtnSkillS3

@onready var lbl_inspector_title: Label = $UI/SkillTreeModal/Card/Margin/VBox/InspectorPanel/Margin/VBox/InspectorTitle
@onready var lbl_inspector_desc: Label = $UI/SkillTreeModal/Card/Margin/VBox/InspectorPanel/Margin/VBox/InspectorDesc
@onready var btn_upgrade_skill: Button = $UI/SkillTreeModal/Card/Margin/VBox/InspectorPanel/Margin/VBox/InspectorHBox/BtnUpgradeSkill
@onready var btn_reset_skill_branch: Button = $UI/SkillTreeModal/Card/Margin/VBox/InspectorPanel/Margin/VBox/InspectorHBox/BtnResetSkillBranch

# Popup chọn loại tháp để xây mới
@onready var build_popup: Control = $UI/BuildPopup
@onready var btn_close_build: Button = $UI/BuildPopup/Panel/BtnClosePopup
@onready var btn_tab_scifi: Button = $UI/BuildPopup/Panel/HBoxTabs/BtnTabSciFi
@onready var btn_tab_arcane: Button = $UI/BuildPopup/Panel/HBoxTabs/BtnTabArcane
@onready var btn_tab_bio: Button = $UI/BuildPopup/Panel/HBoxTabs/BtnTabBio
@onready var btn_tab_divine: Button = $UI/BuildPopup/Panel/HBoxTabs/BtnTabDivine

@onready var hbox_scifi: HBoxContainer = $UI/BuildPopup/Panel/HBoxSciFi
@onready var hbox_arcane: HBoxContainer = $UI/BuildPopup/Panel/HBoxArcane
@onready var hbox_bio: HBoxContainer = $UI/BuildPopup/Panel/HBoxBio
@onready var hbox_divine: HBoxContainer = $UI/BuildPopup/Panel/HBoxDivine

@onready var btn_opt_gatling: Button = $UI/BuildPopup/Panel/HBoxSciFi/BtnGatling
@onready var btn_opt_plasma: Button = $UI/BuildPopup/Panel/HBoxSciFi/BtnPlasma
@onready var btn_opt_tesla: Button = $UI/BuildPopup/Panel/HBoxSciFi/BtnTesla
@onready var btn_opt_sam: Button = $UI/BuildPopup/Panel/HBoxSciFi/BtnSam

@onready var btn_opt_frost: Button = $UI/BuildPopup/Panel/HBoxArcane/BtnFrost
@onready var btn_opt_magma: Button = $UI/BuildPopup/Panel/HBoxArcane/BtnMagma
@onready var btn_opt_void: Button = $UI/BuildPopup/Panel/HBoxArcane/BtnVoid

@onready var btn_opt_spore: Button = $UI/BuildPopup/Panel/HBoxBio/BtnSpore
@onready var btn_opt_pylon: Button = $UI/BuildPopup/Panel/HBoxDivine/BtnPylon

# Popup Nâng cấp / Bán tháp tại chỗ
@onready var upgrade_popup: Control = $UI/UpgradePopup
@onready var lbl_tower_name: Label = $UI/UpgradePopup/Panel/VBox/TowerName
@onready var lbl_damage_stats: Label = get_node_or_null("UI/UpgradePopup/Panel/VBox/DamageStats")
@onready var lbl_perk_badge: Label = get_node_or_null("UI/UpgradePopup/Panel/VBox/PerkBadge")
@onready var btn_target_priority: Button = get_node_or_null("UI/UpgradePopup/Panel/VBox/BtnTargetPriority")
@onready var btn_upgrade_tower: Button = $UI/UpgradePopup/Panel/VBox/HBoxActions/BtnUpgrade
@onready var btn_sell_tower: Button = $UI/UpgradePopup/Panel/VBox/HBoxActions/BtnSell
@onready var btn_close_upgrade: Button = $UI/UpgradePopup/Panel/BtnCloseUpgrade
@onready var btn_overclock_tower: Button = get_node_or_null("UI/UpgradePopup/Panel/VBox/HBoxActions/BtnOverclock")
@onready var btn_hardcore: Button = get_node_or_null("UI/HUD/BtnHardcore")

# Sprint 8: Boss Raid Banner (Thanh Máu Boss Trung Tâm)
@onready var boss_raid_banner: Control = get_node_or_null("UI/HUD/BossRaidBanner")
var lbl_boss_name: Label = null
var lbl_boss_hp_val: Label = null
var bar_boss_hp: ProgressBar = null
var bar_boss_shield: ProgressBar = null

# Sprint 8: Victory / Defeat Tactical Modal (Bảng Tổng Kết Trận Đấu 3 Sao)
@onready var victory_defeat_modal: Control = get_node_or_null("UI/VictoryDefeatModal")
var lbl_modal_title: Label = null
var lbl_modal_subtitle: Label = null
var modal_stars: Array[Control] = []
var lbl_mvp_details: Label = null
var lbl_records_stats: Label = null
var btn_restart_modal: Button = null
var btn_hardcore_modal: Button = null
var btn_endless_modal: Button = null

# Sprint 9: Nút Bật/Tắt Âm Thanh [M] & Trạng Thái Mute
var btn_sound_toggle: Button = null
var is_sound_muted: bool = false

# Sprint 9: Chế Độ Vô Tận (Endless Survival Wave 11+)
var is_endless_mode: bool = false
var highest_endless_wave: int = 0

# Sprint 9: 3 Huy Hiệu Chiến Công (Tactical Medals)
var medal_boss_hunter: bool = false       # [THỢ SĂN BOSS]: Ngắt chiêu Boss thành công bằng EMP/Tesla
var medal_combo_master: bool = false      # [ĐẠI SƯ PHỐI HỢP]: Kích hoạt >= 10 lần phản ứng Combo trong 1 trận
var medal_flawless_fortress: bool = false # [PHÁO ĐÀI BẤT DIỆT]: Hoàn thành Wave 10 với 20/20 máu căn cứ
var combo_reaction_count: int = 0         # Đếm số lần phản ứng combo (Sốc Nhiệt/Quá Tải)

# Sprint 6: Bão Từ Trường Ion & Chế Độ Thử Thách
var is_ion_storm_active: bool = false
var is_hardcore_mode: bool = false
var hardcore_cleared: bool = false

@onready var web_bridge: Node = get_node_or_null("/root/WebBridge")
var sound_synth: SoundSynthesizer = null

var _idle_time: float = 0.0
var supply_pods: Array[Dictionary] = []

# Kỷ Lục Trận Đấu (Campaign Records ConfigFile)
var best_stars: int = 0
var highest_wave: int = 0
var best_mvp_damage: int = 0
const RECORDS_CFG_PATH: String = "user://ace_island_records.cfg"

# Bẫy Xung Điện Trên Cầu (Bridge EMP Trap)
const BRIDGE_EMP_POS: Vector2 = Vector2(480.0, 425.0)
const BRIDGE_EMP_COST: int = 35
const BRIDGE_EMP_COOLDOWN: float = 16.0
const BRIDGE_EMP_RADIUS: float = 145.0
var bridge_emp_timer: float = 0.0
var _bridge_emp_shockwave_radius: float = 0.0
var _bridge_emp_shockwave_alpha: float = 0.0

# Dữ liệu Cây Kỹ Năng / Vi Mạch Hoạt Tính (Kingdom Rush Skill Tree)
var skill_tier_range: int = 0
var skill_tier_damage: int = 0
var skill_tier_speed: int = 0
var selected_skill_branch: String = "damage"
var selected_skill_tier: int = 1

const SKILL_DATA: Dictionary = {
	"range": {
		"name": "TẦM BẮN & CHÍNH XÁC",
		"icon": "RADAR",
		1: {"title": "T1: RADAR SƠ CẤP", "cost": 100, "bonus": 0.15, "desc": "Cảm biến sóng siêu âm giúp mọi tháp phát hiện mục tiêu xa hơn +15%."},
		2: {"title": "T2: QUANG HỌC AI", "cost": 180, "bonus": 0.30, "desc": "Kính ngắm laser AI dẫn đường tầm xa, mở rộng tầm phủ sóng lên +30%."},
		3: {"title": "T3: VI TỬ VỆ TINH", "cost": 280, "bonus": 0.50, "desc": "Định vị vệ tinh quỹ đạo toàn cầu, tăng tầm bắn vũ bão lên +50%!"}
	},
	"damage": {
		"name": "SÁT THƯƠNG & XUYÊN GIÁP",
		"icon": "CANNON",
		1: {"title": "T1: THUỐC SÚNG ĐẬM", "cost": 120, "bonus": 0.20, "desc": "Cường hóa thuốc phóng động năng, tăng +20% toàn bộ sát thương đạn."},
		2: {"title": "T2: ĐẠN VONFRAM", "cost": 200, "bonus": 0.40, "desc": "Lõi đầu đạn hợp kim Vonfram xuyên phá giáp quái vật, tăng +40% sát thương."},
		3: {"title": "T3: HẠT PHẢN VẬT", "cost": 320, "bonus": 0.70, "desc": "Khai thác phản vật chất nổ nguyên tử hủy diệt, tăng khủng khiếp +70% sát thương!"}
	},
	"speed": {
		"name": "TỐC ĐỘ BẮN & HỒI CHIÊU",
		"icon": "HYPER",
		1: {"title": "T1: BĂNG NẠP NHANH", "cost": 110, "bonus": 0.20, "desc": "Ổ tiếp đạn thủy lực tự động, tăng +20% tốc độ xả đạn của toàn bộ tháp."},
		2: {"title": "T2: NỒNG TẢN NHIỆT", "cost": 190, "bonus": 0.45, "desc": "Ống tản nhiệt heli lỏng chống quá nhiệt, tăng vọt +45% tốc độ bắn."},
		3: {"title": "T3: QUÁ TẢI HYPER", "cost": 300, "bonus": 0.80, "desc": "Đẩy công suất máy phát lên cực hạn Hyper-Drive, tăng siêu tốc +80% tốc bắn!"}
	}
}

func _ready() -> void:
	if TexPlacementMask:
		placement_mask_image = TexPlacementMask.get_image()

	sound_synth = SoundSynthesizer.get_shared(self)

	load_records()
	_update_hud()

	# Thiết lập biểu tượng Logo trực quan cho Bottom Bar và Khay phím tắt
	_setup_button_icons()

	# Kết nối sự kiện Bottom Bar
	if btn_next_wave: btn_next_wave.pressed.connect(_on_btn_next_wave_pressed)
	if btn_build: btn_build.pressed.connect(_on_btn_build_pressed)
	if btn_skill_tree: btn_skill_tree.pressed.connect(_on_btn_skill_tree_pressed)
	if btn_spell: btn_spell.pressed.connect(_on_btn_spell_pressed)

	if btn_camera_mode and camera_ctrl:
		btn_camera_mode.pressed.connect(_on_btn_camera_mode_pressed)
		btn_camera_mode.text = camera_ctrl.get_mode_display_name()

	if btn_speed:
		btn_speed.pressed.connect(_on_btn_speed_pressed)
		btn_speed.text = "1X"

	# Kết nối sự kiện Quick Tower Tray
	if btn_quick_gatling: btn_quick_gatling.pressed.connect(func(): _on_quick_tower_selected(TowerClass.TowerType.GATLING_GUN, 100))
	if btn_quick_plasma: btn_quick_plasma.pressed.connect(func(): _on_quick_tower_selected(TowerClass.TowerType.PLASMA_CANNON, 60))
	if btn_quick_tesla: btn_quick_tesla.pressed.connect(func(): _on_quick_tower_selected(TowerClass.TowerType.TESLA_COIL, 150))
	if btn_quick_sam: btn_quick_sam.pressed.connect(func(): _on_quick_tower_selected(TowerClass.TowerType.SAM_BATTERY, 120))
	if btn_quick_frost: btn_quick_frost.pressed.connect(func(): _on_quick_tower_selected(TowerClass.TowerType.FROST_SPIRE, 90))
	if btn_close_tower_tray: btn_close_tower_tray.pressed.connect(func(): quick_tower_tray.visible = false)

	# Kết nối sự kiện Quick Spell Tray
	if btn_spell_lightning: btn_spell_lightning.pressed.connect(_cast_spell_lightning)
	if btn_spell_freeze: btn_spell_freeze.pressed.connect(_cast_spell_freeze)
	if btn_spell_meteor: btn_spell_meteor.pressed.connect(_cast_spell_meteor)
	if btn_close_spell_tray: btn_close_spell_tray.pressed.connect(func(): quick_spell_tray.visible = false)

	# Kết nối sự kiện Skill Tree Modal
	if btn_close_skill_tree: btn_close_skill_tree.pressed.connect(func(): skill_tree_modal.visible = false)
	var backdrop_skill = $UI/SkillTreeModal/Backdrop
	if backdrop_skill:
		backdrop_skill.gui_input.connect(func(event: InputEvent):
			if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
				skill_tree_modal.visible = false
		)
	if btn_skill_r1: btn_skill_r1.pressed.connect(func(): _select_skill("range", 1))
	if btn_skill_r2: btn_skill_r2.pressed.connect(func(): _select_skill("range", 2))
	if btn_skill_r3: btn_skill_r3.pressed.connect(func(): _select_skill("range", 3))

	if btn_skill_d1: btn_skill_d1.pressed.connect(func(): _select_skill("damage", 1))
	if btn_skill_d2: btn_skill_d2.pressed.connect(func(): _select_skill("damage", 2))
	if btn_skill_d3: btn_skill_d3.pressed.connect(func(): _select_skill("damage", 3))

	if btn_skill_s1: btn_skill_s1.pressed.connect(func(): _select_skill("speed", 1))
	if btn_skill_s2: btn_skill_s2.pressed.connect(func(): _select_skill("speed", 2))
	if btn_skill_s3: btn_skill_s3.pressed.connect(func(): _select_skill("speed", 3))

	if btn_upgrade_skill: btn_upgrade_skill.pressed.connect(_on_btn_upgrade_skill_pressed)
	if btn_reset_skill_branch: btn_reset_skill_branch.pressed.connect(_on_btn_reset_skills_pressed)

	# Chuyển đổi Tab Phân Hệ (BuildPopup nâng cao)
	if btn_tab_scifi: btn_tab_scifi.pressed.connect(func(): _switch_faction_tab(0))
	if btn_tab_arcane: btn_tab_arcane.pressed.connect(func(): _switch_faction_tab(1))
	if btn_tab_bio: btn_tab_bio.pressed.connect(func(): _switch_faction_tab(2))
	if btn_tab_divine: btn_tab_divine.pressed.connect(func(): _switch_faction_tab(3))

	# Nút trong Build Popup - Hệ Cơ Khí (Sci-Fi)
	if btn_opt_gatling: btn_opt_gatling.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.GATLING_GUN, 100))
	if btn_opt_plasma: btn_opt_plasma.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.PLASMA_CANNON, 60))
	if btn_opt_tesla: btn_opt_tesla.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.TESLA_COIL, 150))
	if btn_opt_sam: btn_opt_sam.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.SAM_BATTERY, 120))

	# Nút trong Build Popup - Hệ Phép Thuật (Arcane)
	if btn_opt_frost: btn_opt_frost.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.FROST_SPIRE, 90))
	if btn_opt_magma: btn_opt_magma.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.MAGMA_MONOLITH, 110))
	if btn_opt_void: btn_opt_void.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.VOID_OBELISK, 140))

	# Nút trong Build Popup - Hệ Sinh Học (Bio)
	if btn_opt_spore: btn_opt_spore.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.SPORE_SPITTER, 80))

	# Nút trong Build Popup - Hệ Tâm Linh (Divine)
	if btn_opt_pylon: btn_opt_pylon.pressed.connect(func(): _on_select_tower_type(TowerClass.TowerType.PYLON_BUFFER, 130))

	if btn_close_build: btn_close_build.pressed.connect(func(): build_popup.visible = false)

	# Nút trong Upgrade Popup
	if btn_target_priority: btn_target_priority.pressed.connect(_on_btn_target_priority_pressed)
	if btn_upgrade_tower: btn_upgrade_tower.pressed.connect(_on_btn_upgrade_tower_pressed)
	if btn_sell_tower: btn_sell_tower.pressed.connect(_on_btn_sell_tower_pressed)
	if btn_close_upgrade: btn_close_upgrade.pressed.connect(_close_upgrade_popup)

	# Sprint 6: Dynamic Setup for BtnOverclock in UpgradePopup
	if not btn_overclock_tower and upgrade_popup:
		var hbox_act = upgrade_popup.get_node_or_null("Panel/VBox/HBoxActions")
		if hbox_act:
			btn_overclock_tower = Button.new()
			btn_overclock_tower.name = "BtnOverclock"
			btn_overclock_tower.custom_minimum_size = Vector2(88, 48)
			btn_overclock_tower.add_theme_font_size_override("font_size", 11)
			btn_overclock_tower.add_theme_color_override("font_color", Color(0.2, 0.95, 1.0))
			btn_overclock_tower.text = "QUÁ TẢI (25G)"
			var sb_oc = StyleBoxFlat.new()
			sb_oc.bg_color = Color(0.06, 0.12, 0.20, 0.94)
			sb_oc.set_border_width_all(1.5)
			sb_oc.border_color = Color(0.2, 0.85, 1.0, 0.75)
			sb_oc.set_corner_radius_all(8)
			sb_oc.shadow_size = 4
			sb_oc.shadow_color = Color(0, 0, 0, 0.40)
			btn_overclock_tower.add_theme_stylebox_override("normal", sb_oc)
			hbox_act.add_child(btn_overclock_tower)
			hbox_act.move_child(btn_overclock_tower, 1)

	if upgrade_popup:
		var up_panel = upgrade_popup.get_node_or_null("Panel") as Panel
		if up_panel:
			var sb_up = StyleBoxFlat.new()
			sb_up.bg_color = Color(0.06, 0.09, 0.16, 0.90)
			sb_up.set_border_width_all(1.5)
			sb_up.border_color = Color(0.25, 0.75, 1.0, 0.70)
			sb_up.set_corner_radius_all(10)
			sb_up.shadow_size = 8
			sb_up.shadow_color = Color(0, 0, 0, 0.45)
			sb_up.shadow_offset = Vector2(0, 4)
			up_panel.add_theme_stylebox_override("panel", sb_up)

	if btn_overclock_tower:
		btn_overclock_tower.pressed.connect(_on_btn_overclock_pressed)

	# Sprint 6: Dynamic Setup for BtnHardcore on HUD
	if not btn_hardcore and has_node("UI/HUD"):
		btn_hardcore = Button.new()
		btn_hardcore.name = "BtnHardcore"
		btn_hardcore.position = Vector2(292.0, 74.0)
		btn_hardcore.size = Vector2(126.0, 36.0)
		btn_hardcore.add_theme_font_size_override("font_size", 13)
		btn_hardcore.add_theme_color_override("font_color", Color(1.0, 0.35, 0.25))
		btn_hardcore.text = "THỬ THÁCH"
		$UI/HUD.add_child(btn_hardcore)

	if btn_hardcore:
		btn_hardcore.pressed.connect(toggle_hardcore_mode)
		_update_hardcore_button_style()

	# Cập nhật style HUD & Button Icons lần cuối để bao phủ tất cả nút động
	_setup_hud_ui()

	# Sprint 8: Khởi tạo Boss Raid Banner và Modal Tổng Kết Chiến Trận
	_setup_boss_raid_banner()
	_setup_victory_defeat_modal()

	if build_popup: build_popup.visible = false
	if upgrade_popup: upgrade_popup.visible = false
	if quick_tower_tray: quick_tower_tray.visible = false
	if quick_spell_tray: quick_spell_tray.visible = false
	if skill_tree_modal: skill_tree_modal.visible = false
	if boss_raid_banner: boss_raid_banner.visible = false
	if victory_defeat_modal: victory_defeat_modal.visible = false

	_apply_tech_multipliers()
	_refresh_skill_tree_ui()

	if web_bridge:
		web_bridge.show_toast("Chào mừng đến Đảo Bay 2.5D! Khám phá Cây Kỹ Năng & Phép Thuật.", "info")

	# Expose helper cho web / automation (Lưu vào mảng _js_callbacks để giữ tham chiếu không bị Garbage Collection thu hồi)
	if OS.has_feature("web") and ClassDB.class_exists("JavaScriptBridge"):
		var win = JavaScriptBridge.get_interface("window")
		if win:
			var cb_build = JavaScriptBridge.create_callback(func(args):
				var type: int = int(str(args[0])) if args.size() > 0 else 1
				var x: float = float(str(args[1])) if args.size() > 1 else 640.0
				var y: float = float(str(args[2])) if args.size() > 2 else 435.0
				_build_tower_at_position(Vector2(x, y), type, true)
			)
			_js_callbacks.append(cb_build)
			win.buildTower = cb_build

			var cb_wave = JavaScriptBridge.create_callback(func(args):
				_on_btn_next_wave_pressed()
			)
			_js_callbacks.append(cb_wave)
			win.nextWave = cb_wave

			var cb_spawn = JavaScriptBridge.create_callback(func(args):
				_spawn_enemy_for_wave()
			)
			_js_callbacks.append(cb_spawn)
			win.spawnEnemy = cb_spawn

			var cb_cam = JavaScriptBridge.create_callback(func(args):
				_on_btn_camera_mode_pressed()
			)
			_js_callbacks.append(cb_cam)
			win.toggleCamera = cb_cam

			var cb_clear = JavaScriptBridge.create_callback(func(args):
				for t in towers_container.get_children():
					t.queue_free()
			)
			_js_callbacks.append(cb_clear)
			win.clearTowers = cb_clear

			var cb_boss = JavaScriptBridge.create_callback(func(args):
				var enemy = EnemyClass.new()
				enemy.add_to_group("animated_enemies")
				enemy.setup(EnemyClass.EnemyType.MECH_WALKER, PATH_WAYPOINTS, 1.0, EnemyClass.EnemyVariant.BOSS)
				enemies_container.add_child(enemy)
				_update_boss_raid_banner()
			)
			_js_callbacks.append(cb_boss)
			win.spawnBoss = cb_boss

			var cb_skill = JavaScriptBridge.create_callback(func(args):
				print("[Godot] openSkillTree called! modal: ", skill_tree_modal)
				_on_btn_skill_tree_pressed()
			)
			_js_callbacks.append(cb_skill)
			win.openSkillTree = cb_skill

			var cb_tray = JavaScriptBridge.create_callback(func(args):
				print("[Godot] openTowerTray called! tray: ", quick_tower_tray)
				_on_btn_build_pressed()
			)
			_js_callbacks.append(cb_tray)
			win.openTowerTray = cb_tray

			var cb_speed = JavaScriptBridge.create_callback(func(args):
				_on_btn_speed_pressed()
			)
			_js_callbacks.append(cb_speed)
			win.toggleSpeed = cb_speed

			var cb_emp = JavaScriptBridge.create_callback(func(args):
				activate_bridge_emp()
			)
			_js_callbacks.append(cb_emp)
			win.activateBridgeEMP = cb_emp

			var cb_hardcore = JavaScriptBridge.create_callback(func(args):
				toggle_hardcore_mode()
			)
			_js_callbacks.append(cb_hardcore)
			win.toggleHardcore = cb_hardcore

			var cb_overclock = JavaScriptBridge.create_callback(func(args):
				_on_btn_overclock_pressed()
			)
			_js_callbacks.append(cb_overclock)
			win.activateOverclock = cb_overclock




	# Đặt sẵn 2 tháp phòng thủ mẫu trên thềm cỏ chiến thuật (Pad 6 & Pad 7) vững chãi sát mặt đất
	_build_tower_at_position(BUILD_PADS[6], TowerClass.TowerType.GATLING_GUN, true)
	_build_tower_at_position(BUILD_PADS[7], TowerClass.TowerType.PLASMA_CANNON, true)

	# Tự động khởi động Đợt 1 sau 1.2s để người chơi thấy quái xuất trận ngay
	get_tree().create_timer(1.2).timeout.connect(func():
		if not is_wave_active and current_wave == 0:
			_on_btn_next_wave_pressed()
	)

func _exit_tree() -> void:
	Engine.time_scale = 1.0

func _process(delta: float) -> void:
	_idle_time += delta
	if bridge_emp_timer > 0.0:
		bridge_emp_timer = maxf(0.0, bridge_emp_timer - delta)

	# Khóa cố định đại lục chiến trường 1376x768 vững chãi tại tâm và phóng nhẹ để xóa mép cắt dọc
	if island_sprite:
		island_sprite.position = Vector2(688.0, 384.0)
		island_sprite.scale = Vector2(1.075, 1.075)

	# Cập nhật thời gian tồn tại của Hòm Tiếp Tế Năng Lượng
	var p_idx = supply_pods.size() - 1
	while p_idx >= 0:
		supply_pods[p_idx]["time_left"] -= delta
		if supply_pods[p_idx]["time_left"] <= 0.0:
			collect_supply_pod(p_idx, true)
		p_idx -= 1

	# Nhịp sinh quái
	if is_wave_active and _enemies_remaining > 0:
		_spawn_timer -= delta
		if _spawn_timer <= 0.0:
			_spawn_timer = 1.15
			_enemies_remaining -= 1
			_spawn_enemy_for_wave()

	# Dọn sạch đợt quái
	if is_wave_active and _enemies_remaining <= 0:
		var enemies = get_tree().get_nodes_in_group("animated_enemies")
		if enemies.is_empty():
			is_wave_active = false
			is_ion_storm_active = false
			EnemyClass.is_ion_storm_active = false
			var wave_gold = 50 + current_wave * 20
			if is_hardcore_mode:
				wave_gold = int(float(wave_gold) * 1.30)
			gold += wave_gold
			score += 150
			_process_pylon_tier3_wave_rewards()
			_update_hud()

			if current_wave >= MAX_WAVES and not is_endless_mode:
				is_victory = true
				if base_health >= max_health:
					unlock_medal("flawless_fortress", "PHÁO ĐÀI BẤT DIỆT", "Hoàn thành Wave 10 với trọn vẹn 20/20 máu căn cứ!")
				var summary = get_battle_summary()
				_show_victory_defeat_modal(true, summary)
				btn_next_wave.disabled = false
				if is_hardcore_mode:
					_set_button_dock_label(btn_next_wave, "KỶ LỤC THỬ THÁCH", "[N]")
				else:
					_set_button_dock_label(btn_next_wave, "CHIẾN THẮNG %s" % summary["rating_title"], "[N]")
				if sound_synth:
					sound_synth.play_victory_fanfare()
				if web_bridge:
					web_bridge.submit_score(score, {
						"wave": current_wave,
						"mode": "stylized_25d",
						"victory": true,
						"stars": summary["stars"],
						"mvp": summary["mvp_info"]
					})
					web_bridge.show_toast("CHIẾN DỊCH HOÀN THÀNH: %s! MVP: %s" % [summary["rating_title"], summary["mvp_info"]], "success")
					web_bridge.trigger_haptic("success")
			else:
				if is_endless_mode:
					highest_endless_wave = maxi(highest_endless_wave, current_wave)
					save_records(best_stars, highest_wave, best_mvp_damage, is_hardcore_mode)
				btn_next_wave.disabled = false
				var next_lbl = ("WAVE %d VÔ TẬN" % (current_wave + 1)) if is_endless_mode else "GỌI ĐỢT"
				_set_button_dock_label(btn_next_wave, next_lbl, "[N]")
				if web_bridge:
					web_bridge.show_toast("Chiến thắng Wave %d! Thưởng +%d Vàng & +150 Điểm." % [current_wave, wave_gold], "success")
					web_bridge.trigger_haptic("success")

	# Cập nhật tọa độ xem trước khi đang đặt trụ tự do
	if is_placing_tower:
		var cur_mouse = get_global_mouse_position()
		if cur_mouse != placement_preview_pos:
			placement_preview_pos = cur_mouse
			is_placement_valid = _is_valid_build_position(placement_preview_pos)

	# Cập nhật Boss Raid Banner theo Boss Mech trên chiến trường
	_update_boss_raid_banner()

	queue_redraw()

func _dist_point_to_segment(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab = b - a
	var len_sq = ab.length_squared()
	if len_sq == 0.0:
		return p.distance_to(a)
	var t = clampf((p - a).dot(ab) / len_sq, 0.0, 1.0)
	var proj = a + t * ab
	return p.distance_to(proj)

func _is_valid_build_position(pos: Vector2) -> bool:
	# 1. Nằm trong phạm vi bờ đất của đại lục chiến trường (1376x768)
	if pos.x < 60.0 or pos.x > 1316.0 or pos.y < 120.0 or pos.y > 700.0:
		return false

	# 2. Kiểm tra mặt bằng cỏ xanh vừa kích thước chân trụ (Pixel-perfect Placement Mask)
	if placement_mask_image:
		var px = clampi(int(pos.x), 0, placement_mask_image.get_width() - 1)
		var py = clampi(int(pos.y), 0, placement_mask_image.get_height() - 1)
		if placement_mask_image.get_pixel(px, py).r < 0.5:
			return false

		# Kiểm tra an toàn nhẹ quanh tâm chân đế để trụ không bị đặt lấn vào vùng cấm
		var check_offsets = [
			Vector2(-6.0, 0.0), Vector2(6.0, 0.0),
			Vector2(0.0, -4.0), Vector2(0.0, 4.0)
		]
		for off in check_offsets:
			var cx = clampi(int(pos.x + off.x), 0, placement_mask_image.get_width() - 1)
			var cy = clampi(int(pos.y + off.y), 0, placement_mask_image.get_height() - 1)
			if placement_mask_image.get_pixel(cx, cy).r < 0.5:
				return false
	else:
		# Fallback nếu chưa tải mask
		for i in range(PATH_WAYPOINTS.size() - 1):
			var d = _dist_point_to_segment(pos, PATH_WAYPOINTS[i], PATH_WAYPOINTS[i + 1])
			if d < 36.0:
				return false

	# 3. Khoảng cách an toàn tới các tháp hiện có (chống chồng chéo chân trụ)
	for t in towers_container.get_children():
		if is_instance_valid(t) and t is AnimatedTower:
			if pos.distance_to(t.global_position) < 46.0:
				return false

	return true

func _draw_soft_cloud_vignette() -> void:
	# Tối ưu 60 FPS: Thay vì vẽ 42 vòng tròn bán trong suốt đè nhau mỗi frame gây GPU overdraw,
	# sử dụng 3 dải đa giác gradient nhẹ ôm sát 2 viền và đáy đảo + 2 cụm mây nhẹ bồng bềnh.

	# 1. Dải mây viền trái (x: -10..105, y: 360..780)
	var pts_left = PackedVector2Array([
		Vector2(-10.0, 360.0), Vector2(105.0, 360.0),
		Vector2(105.0, 780.0), Vector2(-10.0, 780.0)
	])
	var col_left = PackedColorArray([
		Color(0.92, 0.96, 1.0, 0.40), Color(0.92, 0.96, 1.0, 0.0),
		Color(0.92, 0.96, 1.0, 0.0), Color(0.92, 0.96, 1.0, 0.40)
	])
	draw_polygon(pts_left, col_left)

	# 2. Dải mây viền phải (x: 1270..1386, y: 340..780)
	var pts_right = PackedVector2Array([
		Vector2(1270.0, 340.0), Vector2(1386.0, 340.0),
		Vector2(1386.0, 780.0), Vector2(1270.0, 780.0)
	])
	var col_right = PackedColorArray([
		Color(0.92, 0.96, 1.0, 0.0), Color(0.92, 0.96, 1.0, 0.40),
		Color(0.92, 0.96, 1.0, 0.40), Color(0.92, 0.96, 1.0, 0.0)
	])
	draw_polygon(pts_right, col_right)

	# 3. Dải mây viền đáy đại lục (y: 720..780)
	var pts_bottom = PackedVector2Array([
		Vector2(0.0, 720.0), Vector2(1376.0, 720.0),
		Vector2(1376.0, 780.0), Vector2(0.0, 780.0)
	])
	var col_bottom = PackedColorArray([
		Color(0.90, 0.95, 1.0, 0.0), Color(0.90, 0.95, 1.0, 0.0),
		Color(0.90, 0.95, 1.0, 0.45), Color(0.90, 0.95, 1.0, 0.45)
	])
	draw_polygon(pts_bottom, col_bottom)

	# 4. Hai cụm mây nhẹ bồng bềnh 2 bên rìa tạo chiều sâu không gian
	var puff_left = Vector2(40.0, 580.0 + sin(_idle_time * 0.5) * 6.0)
	draw_circle(puff_left, 55.0, Color(0.94, 0.97, 1.0, 0.20))
	var puff_right = Vector2(1335.0, 560.0 + cos(_idle_time * 0.4) * 6.0)
	draw_circle(puff_right, 55.0, Color(0.94, 0.97, 1.0, 0.20))

func _draw_environmental_fx() -> void:
	# 1. THÁC NƯỚC & DÒNG SUỐI XANH ĐỔ XUỐNG VỰC (x ~ 335..365, y ~ 560..665)
	# Khớp 100% với lòng khe suối của IslandSprite sau khi scale 1.075
	var stream_start = Vector2(352.0, 560.0)
	var stream_crest = Vector2(346.0, 605.0)
	var stream_plunge = Vector2(338.0, 662.0)
	var foam_pulse = sin(_idle_time * 8.0) * 2.2

	# Vệt dòng nước chảy lấp lánh trong lòng suối đá
	draw_line(stream_start, stream_crest, Color(0.70, 0.92, 1.0, 0.45), 3.5)
	draw_circle(stream_crest, 6.0 + foam_pulse * 0.4, Color(1.0, 1.0, 1.0, 0.80))

	# Bọt nước và tia nước đổ dốc từ mép đá xuống vực thẳm
	draw_circle(stream_plunge, 8.5 + foam_pulse, Color(1.0, 1.0, 1.0, 0.78))
	draw_circle(stream_plunge + Vector2(-5.0, -3.0), 6.5 - foam_pulse * 0.4, Color(0.85, 0.95, 1.0, 0.65))
	draw_circle(stream_plunge + Vector2(5.0, -3.0), 6.5 + foam_pulse * 0.4, Color(0.85, 0.95, 1.0, 0.65))
	for i in range(5):
		var phase = fmod(_idle_time * 3.4 + float(i) * 0.22, 1.0)
		var drop_y = lerpf(0.0, 57.0, phase)
		var drop_x = lerpf(4.0, -4.0, phase) + sin(phase * 4.0 + float(i)) * 2.5
		var drop_alpha = (1.0 - phase) * 0.85
		var p = stream_crest + Vector2(drop_x, drop_y)
		draw_circle(p, lerpf(4.0, 2.0, phase), Color(0.92, 0.98, 1.0, drop_alpha))
		draw_line(p - Vector2(0.0, 6.0), p, Color(1.0, 1.0, 1.0, drop_alpha * 0.8), 2.2)

	# 2. GỢN SÓNG LẤP LÁNH TRÊN MẶT HỒ GẦN BẾN CẢNG (Lake Ripples & Sparkles)
	var lake_center = Vector2(730.0, 180.0)
	for i in range(3):
		var wave_phase = fmod(_idle_time * 0.45 + float(i) * 0.33, 1.0)
		var rx = lerpf(8.0, 42.0, wave_phase)
		var ry = rx * 0.42
		var w_alpha = sin(wave_phase * PI) * 0.40
		var pts = PackedVector2Array()
		for seg in range(25):
			var a = float(seg) * TAU / 24.0
			pts.append(lake_center + Vector2(cos(a) * rx, sin(a) * ry))
		draw_polyline(pts, Color(0.65, 0.92, 1.0, w_alpha), 1.5)
	for j in range(3):
		var sp_x = lake_center.x + cos(_idle_time * 1.5 + float(j) * 2.1) * 22.0
		var sp_y = lake_center.y + sin(_idle_time * 1.5 + float(j) * 2.1) * 8.0
		var sp_alpha = maxf(0.0, sin(_idle_time * 3.0 + float(j) * 1.7)) * 0.75
		draw_circle(Vector2(sp_x, sp_y), 2.2, Color(1.0, 1.0, 1.0, sp_alpha))

	# 3. CÁNH QUẠT ÁNH SÁNG XOAY NHẸ TẠI TÂM 3 CỐI XAY GIÓ (Windmills - Đồi Đông Bắc)
	# Tọa độ pixel chính xác trên IslandSprite (scale 1.075):
	# - Cối xay 1 (Mái Cam, Trái): Vector2(835.0, 108.0), cánh quạt 28px
	# - Cối xay 2 (Mái Lam, Giữa): Vector2(928.0, 90.0), cánh quạt 28px
	# - Cối xay 3 (Mái Tím, Phải): Vector2(1005.0, 101.0), cánh quạt 24px
	var windmills = [
		{"pos": Vector2(835.0, 108.0), "spd": 1.1, "len": 28.0},
		{"pos": Vector2(928.0, 90.0), "spd": 0.95, "len": 28.0},
		{"pos": Vector2(1005.0, 101.0), "spd": 1.25, "len": 24.0}
	]
	for wm in windmills:
		var base_rot = _idle_time * wm.spd
		var w_pos = wm.pos
		var w_len = wm.len
		for b in range(4):
			var a = base_rot + float(b) * (PI * 0.5)
			var tip = w_pos + Vector2(cos(a), sin(a)) * w_len
			draw_line(w_pos, tip, Color(0.95, 0.92, 0.85, 0.85), 2.2)
		draw_circle(w_pos, 3.2, Color(0.35, 0.20, 0.12, 0.95))
		draw_circle(w_pos, 1.6, Color(0.95, 0.85, 0.65, 0.95))

	# 4. VÒNG XOÁY CỔ NGỮ TÍM QUAY TRÒN TRONG CỔNG DỊCH CHUYỂN (Portal Vortex)
	var portal_pos = Vector2(115.0, 395.0)
	var portal_rot = _idle_time * 2.2
	var p_glow = 0.5 + 0.5 * sin(_idle_time * 4.0)
	draw_circle(portal_pos, 24.0, Color(0.55, 0.15, 0.85, 0.20 + 0.10 * p_glow))
	for ring in range(3):
		var r_rad = 10.0 + float(ring) * 6.5
		var r_dir = 1.0 if ring % 2 == 0 else -1.0
		var r_rot = portal_rot * r_dir + float(ring) * 0.8
		draw_arc(portal_pos, r_rad, r_rot, r_rot + PI * 1.35, 20, Color(0.75, 0.35, 1.0, 0.65), 1.8)
	draw_circle(portal_pos, 5.0, Color(0.95, 0.85, 1.0, 0.85))

func _draw_tactical_range_ring(tower: AnimatedTower) -> void:
	var t_pos = tower.global_position
	var eff_range = tower.get_effective_range()
	var rx = eff_range
	var ry = eff_range * 0.55 # Tỷ lệ Isometric 2.5D
	var rot_offset = _idle_time * 0.4
	var total_segments = 48
	for s in range(total_segments):
		if s % 2 == 0:
			var a1 = rot_offset + float(s) * TAU / float(total_segments)
			var a2 = rot_offset + float(s + 1) * TAU / float(total_segments)
			var pts = PackedVector2Array()
			var sub_divs = 4
			for k in range(sub_divs + 1):
				var a = lerpf(a1, a2, float(k) / float(sub_divs))
				pts.append(t_pos + Vector2(cos(a) * rx, sin(a) * ry))
			draw_polyline(pts, Color(0.2, 0.95, 1.0, 0.30), 4.0)
			draw_polyline(pts, Color(0.2, 0.95, 1.0, 0.85), 1.8)
	var pad_poly = PackedVector2Array()
	for p in range(24):
		var pa = float(p) * TAU / 24.0
		pad_poly.append(t_pos + Vector2(cos(pa) * 32.0, sin(pa) * 16.0))
	draw_colored_polygon(pad_poly, Color(0.2, 0.9, 1.0, 0.12))
	draw_polyline(pad_poly, Color(0.2, 0.9, 1.0, 0.45), 1.5)

func _draw_placement_preview() -> void:
	var pos = placement_preview_pos

	# 1. VÒNG BÁN KÍNH TẦM BẮN (RANGE CIRCLE)
	var stroke_color = Color(0.2, 0.95, 0.45, 0.70) if is_placement_valid else Color(1.0, 0.25, 0.25, 0.75)
	var fill_color = Color(0.15, 0.85, 0.4, 0.08) if is_placement_valid else Color(0.9, 0.15, 0.15, 0.08)
	draw_circle(pos, placing_range, fill_color)
	draw_arc(pos, placing_range, 0.0, TAU, 64, stroke_color, 2.0, true)

	# 2. CHÂN TRỤ TIẾP XÚC ĐẤT 2.5D (ISOMETRIC BASE FOOTPRINT RING)
	var foot_rx = 26.0
	var foot_ry = 14.0

	if is_placement_valid:
		# VỊ TRÍ HỢP LỆ (XANH LÁ)
		_draw_isometric_ellipse(pos, foot_rx, foot_ry, Color(0.1, 0.85, 0.35, 0.32))
		_draw_isometric_ellipse_outline(pos, foot_rx, foot_ry, Color(0.2, 1.0, 0.45, 0.95), 2.5)
		_draw_isometric_ellipse_outline(pos, foot_rx + 6.0, foot_ry + 3.0, Color(0.15, 0.9, 0.4, 0.45), 1.5)
		draw_line(pos + Vector2(-foot_rx - 8.0, 0.0), pos + Vector2(-foot_rx, 0.0), Color(0.2, 1.0, 0.45, 0.9), 2.0)
		draw_line(pos + Vector2(foot_rx, 0.0), pos + Vector2(foot_rx + 8.0, 0.0), Color(0.2, 1.0, 0.45, 0.9), 2.0)
		draw_line(pos + Vector2(0.0, -foot_ry - 6.0), pos + Vector2(0.0, -foot_ry), Color(0.2, 1.0, 0.45, 0.9), 2.0)
		draw_line(pos + Vector2(0.0, foot_ry), pos + Vector2(0.0, foot_ry + 6.0), Color(0.2, 1.0, 0.45, 0.9), 2.0)
	else:
		# VỊ TRÍ KHÔNG HỢP LỆ (ĐỎ RỰC)
		_draw_isometric_ellipse(pos, foot_rx, foot_ry, Color(0.85, 0.15, 0.15, 0.35))
		_draw_isometric_ellipse_outline(pos, foot_rx, foot_ry, Color(1.0, 0.2, 0.2, 0.95), 2.5)
		draw_line(pos + Vector2(-16.0, -9.0), pos + Vector2(16.0, 9.0), Color(1.0, 0.2, 0.2, 0.95), 3.0)

	# 3. TRỤ TẠM THỜI (SEMI-TRANSPARENT GHOST TOWER SPRITE)
	var ghost_modulate = Color(0.9, 1.0, 0.9, 0.78) if is_placement_valid else Color(1.0, 0.35, 0.35, 0.65)

	match placing_tower_type:
		TowerClass.TowerType.GATLING_GUN:
			var scale_g = 0.200
			var mount_offset = Vector2(0.0, -28.0)
			var base_dest = Rect2(pos + mount_offset - Vector2(320.0, 320.0) * scale_g, Vector2(640.0, 640.0) * scale_g)
			draw_texture_rect(TexGatlingBase, base_dest, false, ghost_modulate)
			draw_texture_rect(TexGatlingTurretDir0, base_dest, false, ghost_modulate)

		TowerClass.TowerType.PLASMA_CANNON:
			var scale_p = 0.185
			var mount_offset = Vector2(-9.3, -27.6)
			var base_dest = Rect2(pos + mount_offset - Vector2(320.0, 320.0) * scale_p, Vector2(640.0, 640.0) * scale_p)
			draw_texture_rect(TexPlasmaBase, base_dest, false, ghost_modulate)
			draw_texture_rect(TexPlasmaTurretDir0, base_dest, false, ghost_modulate)

		TowerClass.TowerType.TESLA_COIL:
			var scale_t = 0.150
			var base_dest = Rect2(pos + Vector2(-2.4, -43.65) - Vector2(180.0, 335.0) * scale_t, Vector2(360.0, 670.0) * scale_t)
			draw_texture_rect(TexTesla, base_dest, false, ghost_modulate)

	# 4. NHÃN TRẠNG THÁI NỔI (STATUS BADGE)
	var badge_pos = pos + Vector2(0.0, -85.0)
	var badge_w = 230.0
	var badge_h = 26.0
	var badge_rect = Rect2(badge_pos - Vector2(badge_w * 0.5, badge_h * 0.5), Vector2(badge_w, badge_h))

	if is_placement_valid:
		draw_rect(badge_rect, Color(0.04, 0.18, 0.08, 0.88), true)
		draw_rect(badge_rect, Color(0.2, 0.95, 0.45, 0.9), false, 1.5)
		draw_string(ThemeDB.fallback_font, badge_pos + Vector2(-92.0, 5.0), "[V] BẤM ĐỂ ĐẶT TRỤ (%dG)" % placing_cost, HORIZONTAL_ALIGNMENT_CENTER, -1, 13, Color(0.3, 1.0, 0.5))
	else:
		draw_rect(badge_rect, Color(0.22, 0.04, 0.04, 0.88), true)
		draw_rect(badge_rect, Color(1.0, 0.25, 0.25, 0.9), false, 1.5)
		draw_string(ThemeDB.fallback_font, badge_pos + Vector2(-102.0, 5.0), "[X] KHÔNG THỂ ĐẶT Ở ĐÂY", HORIZONTAL_ALIGNMENT_CENTER, -1, 13, Color(1.0, 0.4, 0.4))

func _draw_isometric_ellipse(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var pts = PackedVector2Array()
	var n = 24
	for i in range(n):
		var theta = i * TAU / n
		pts.append(center + Vector2(cos(theta) * rx, sin(theta) * ry))
	draw_colored_polygon(pts, color)

func _draw_isometric_ellipse_outline(center: Vector2, rx: float, ry: float, color: Color, width: float) -> void:
	var pts = PackedVector2Array()
	var n = 28
	for i in range(n):
		var theta = i * TAU / n
		pts.append(center + Vector2(cos(theta) * rx, sin(theta) * ry))
	pts.append(pts[0])
	draw_polyline(pts, color, width, true)

func _draw_hexagon(center: Vector2, radius: float, stroke_color: Color, fill_color: Color, width: float = 2.0) -> void:
	var pts = PackedVector2Array()
	for i in range(6):
		var ang = i * TAU / 6.0 - PI / 6.0
		pts.append(center + Vector2(cos(ang) * radius, sin(ang) * radius * 0.60))
	if fill_color.a > 0.0:
		draw_colored_polygon(pts, fill_color)
	pts.append(pts[0])
	draw_polyline(pts, stroke_color, width, true)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if victory_defeat_modal and victory_defeat_modal.visible:
			if event.keycode == KEY_R:
				_restart_game()
				get_viewport().set_input_as_handled()
				return
			elif event.keycode == KEY_H:
				_on_btn_hardcore_modal_pressed()
				get_viewport().set_input_as_handled()
				return
			elif event.keycode == KEY_C:
				if btn_endless_modal and btn_endless_modal.visible:
					_on_btn_endless_modal_pressed()
					get_viewport().set_input_as_handled()
					return

		if event.keycode == KEY_SPACE:
			_on_btn_speed_pressed()
			get_viewport().set_input_as_handled()
			return
		elif event.keycode == KEY_M:
			toggle_sound()
			get_viewport().set_input_as_handled()
			return
		elif event.keycode == KEY_R and (is_game_over or is_victory):
			_restart_game()
			get_viewport().set_input_as_handled()
			return
		elif event.keycode == KEY_W:
			if btn_next_wave and btn_next_wave.visible and not btn_next_wave.disabled:
				call_wave_early()
				get_viewport().set_input_as_handled()
				return
		elif event.keycode == KEY_ENTER:
			if btn_next_wave and btn_next_wave.visible and not btn_next_wave.disabled:
				_on_btn_next_wave_pressed()
				get_viewport().set_input_as_handled()
				return
		elif event.keycode == KEY_E:
			activate_bridge_emp()
			get_viewport().set_input_as_handled()
			return
		elif event.keycode == KEY_Q:
			if selected_tower and is_instance_valid(selected_tower):
				_on_btn_overclock_pressed()
				get_viewport().set_input_as_handled()
				return
		elif event.keycode == KEY_H:
			toggle_hardcore_mode()
			get_viewport().set_input_as_handled()
			return
		elif event.keycode == KEY_ESCAPE:
			if is_placing_tower:
				is_placing_tower = false
				queue_redraw()
				if web_bridge: web_bridge.show_toast("Đã hủy đặt tháp.", "info")
				get_viewport().set_input_as_handled()
				return
			var closed_any = false
			if upgrade_popup and upgrade_popup.visible:
				_close_upgrade_popup()
				closed_any = true
			if build_popup and build_popup.visible:
				build_popup.visible = false
				closed_any = true
			if skill_tree_modal and skill_tree_modal.visible:
				skill_tree_modal.visible = false
				closed_any = true
			if quick_tower_tray and quick_tower_tray.visible:
				quick_tower_tray.visible = false
				closed_any = true
			if quick_spell_tray and quick_spell_tray.visible:
				quick_spell_tray.visible = false
				closed_any = true
			if closed_any:
				get_viewport().set_input_as_handled()
				return

	if is_placing_tower:
		if event is InputEventMouseMotion:
			placement_preview_pos = get_global_mouse_position()
			is_placement_valid = _is_valid_build_position(placement_preview_pos)
			queue_redraw()
		elif event is InputEventMouseButton or event is InputEventScreenTouch:
			if event.is_pressed():
				if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT:
					is_placing_tower = false
					queue_redraw()
					if web_bridge: web_bridge.show_toast("Đã hủy đặt tháp.", "info")
					return
				placement_preview_pos = get_global_mouse_position()
				is_placement_valid = _is_valid_build_position(placement_preview_pos)
				if is_placement_valid:
					if gold >= placing_cost:
						gold -= placing_cost
						_build_tower_at_position(placement_preview_pos, placing_tower_type, false)
						_update_hud()
						is_placing_tower = false
						queue_redraw()
					else:
						if web_bridge:
							web_bridge.show_toast("Không đủ vàng! Cần %dG." % placing_cost, "warning")
							web_bridge.trigger_haptic("selection")
				else:
					if web_bridge:
						web_bridge.show_toast("Vị trí không hợp lệ! Hãy đặt trên thảm cỏ xanh vừa chân trụ.", "warning")
						web_bridge.trigger_haptic("selection")
					queue_redraw()
		return

	if event is InputEventMouseButton or event is InputEventScreenTouch:
		if event.is_pressed():
			var touch_pos = get_global_mouse_position()
			_check_touch_interaction(touch_pos)

func _check_touch_interaction(pos: Vector2) -> void:
	# 0a. Kiểm tra chạm vào Bẫy Xung Điện Trên Cầu (Bridge EMP Node)
	if pos.distance_to(BRIDGE_EMP_POS) <= 42.0:
		activate_bridge_emp()
		return

	# 0b. Kiểm tra chạm vào Hòm Tiếp Tế Năng Lượng (Supply Pod)
	for i in range(supply_pods.size()):
		if pos.distance_to(supply_pods[i]["pos"]) <= supply_pods[i]["radius"] + 14.0:
			collect_supply_pod(i, false)
			return

	# 1. Kiểm tra có chạm vào Tháp đã dựng không -> Mở menu nâng cấp / bán
	for t in towers_container.get_children():
		if is_instance_valid(t) and t is AnimatedTower:
			if pos.distance_to(t.global_position) <= 38.0:
				_open_upgrade_popup(t)
				if web_bridge:
					web_bridge.trigger_haptic("selection")
				return

	# Bấm chuột trái/chạm ra ngoài bản đồ -> Đóng các menu/khay đang mở (TUYỆT ĐỐI KHÔNG tự động hiện bảng mua trụ)
	if upgrade_popup and upgrade_popup.visible:
		_close_upgrade_popup()
	if quick_tower_tray and quick_tower_tray.visible:
		quick_tower_tray.visible = false
	if quick_spell_tray and quick_spell_tray.visible:
		quick_spell_tray.visible = false
	if build_popup and build_popup.visible:
		build_popup.visible = false


func _switch_faction_tab(tab_idx: int) -> void:
	if hbox_scifi: hbox_scifi.visible = (tab_idx == 0)
	if hbox_arcane: hbox_arcane.visible = (tab_idx == 1)
	if hbox_bio: hbox_bio.visible = (tab_idx == 2)
	if hbox_divine: hbox_divine.visible = (tab_idx == 3)
	if web_bridge:
		web_bridge.trigger_haptic("selection")

func _open_build_popup_at(pad_pos: Vector2) -> void:
	if upgrade_popup: upgrade_popup.visible = false
	if build_popup:
		var popup_w = 600.0
		var screen_pos = get_viewport().get_canvas_transform() * pad_pos
		var target_x = clampf(screen_pos.x - popup_w * 0.5, 10.0, 720.0 - popup_w - 10.0)
		var target_y = clampf(screen_pos.y - 230.0, 140.0, 940.0)
		build_popup.position = Vector2(target_x, target_y)
		build_popup.visible = true

func _on_select_tower_type(type: int, cost: int) -> void:
	build_popup.visible = false
	if gold < cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG." % cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	# Nếu người chơi đã bấm chọn vị trí trên bản đồ từ trước
	if targeted_build_pos != Vector2.ZERO and _is_valid_build_position(targeted_build_pos):
		gold -= cost
		_build_tower_at_position(targeted_build_pos, type, false)
		targeted_build_pos = Vector2.ZERO
		_update_hud()
		return

	# Kích hoạt chế độ kéo thả / chọn vị trí đặt tự do
	is_placing_tower = true
	placing_tower_type = type
	placing_cost = cost
	match type:
		TowerClass.TowerType.PLASMA_CANNON: placing_range = 240.0
		TowerClass.TowerType.GATLING_GUN: placing_range = 230.0
		TowerClass.TowerType.TESLA_COIL: placing_range = 220.0
		TowerClass.TowerType.SAM_BATTERY: placing_range = 320.0
		TowerClass.TowerType.FROST_SPIRE: placing_range = 200.0
		TowerClass.TowerType.MAGMA_MONOLITH: placing_range = 220.0
		TowerClass.TowerType.VOID_OBELISK: placing_range = 250.0
		TowerClass.TowerType.SPORE_SPITTER: placing_range = 210.0
		TowerClass.TowerType.PYLON_BUFFER: placing_range = 180.0
	placing_range *= TowerClass.tech_range_mult
	placement_preview_pos = get_global_mouse_position()
	is_placement_valid = _is_valid_build_position(placement_preview_pos)
	queue_redraw()
	if web_bridge:
		web_bridge.show_toast("Chạm hoặc kéo vào vị trí trên đảo để dựng tháp!", "info")

func _build_tower_at_position(pos: Vector2, type: int, free_build: bool) -> AnimatedTower:
	var tower = TowerClass.new()
	tower.setup(type)
	tower.global_position = pos

	# Áp dụng hiệu ứng cường hóa địa hình (Tactical Buff Pads) nếu đặt trên hoặc sát ô đặc biệt
	if pos.distance_to(BUILD_PADS[OVERWATCH_PAD_IDX]) < 25.0:
		tower.pad_range_mult = 1.15
	elif pos.distance_to(BUILD_PADS[POWER_CONDUIT_PAD_IDX]) < 25.0:
		tower.pad_speed_mult = 1.15

	towers_container.add_child(tower)

	# Hiệu ứng mọc nảy tháp (Pop-in)
	tower.scale = Vector2.ZERO
	var tween = tower.create_tween()
	tween.tween_property(tower, "scale", Vector2(1.0, 1.0), 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

	if not free_build and web_bridge:
		var t_name = AnimatedTower.get_tower_name(type)
		web_bridge.show_toast("Đã dựng %s thành công!" % t_name, "success")
		web_bridge.trigger_haptic("medium")

	return tower

func _build_tower_at_pad(pad_idx: int, type: int, free_build: bool) -> void:
	if pad_idx >= 0 and pad_idx < BUILD_PADS.size():
		var pad_pos = BUILD_PADS[pad_idx]
		# Đảm bảo vị trí bệ đá nằm trên thảm cỏ xanh hợp lệ (không bao giờ đặt trên sông/đường)
		if not _is_valid_build_position(pad_pos) and not free_build:
			return
		# Xóa tháp cũ nếu có
		for t in towers_container.get_children():
			if is_instance_valid(t) and t.global_position.distance_to(pad_pos) < 25.0:
				t.queue_free()
		_build_tower_at_position(pad_pos, type, free_build)

## Quản lý Nâng Cấp / Bán Tháp
func _open_upgrade_popup(tower: AnimatedTower) -> void:
	if build_popup: build_popup.visible = false
	selected_tower = tower
	tower.is_selected = true

	var t_name = AnimatedTower.get_tower_name(tower.tower_type)
	var t_attr = AnimatedTower.get_tower_tactics(tower.tower_type)

	var buff_desc = ""
	if tower.pad_range_mult > 1.0:
		buff_desc += " [CAO ĐIỂM +15% TẦM]"
	if tower.pad_speed_mult > 1.0:
		buff_desc += " [NĂNG LƯỢNG +15% TỐC]"
	if tower._buff_decay_timer > 0.0:
		buff_desc += " [PYLON +15% DMG]"
	if buff_desc != "":
		lbl_tower_name.text = "%s (LV %d)%s\n%s" % [t_name, tower.level, buff_desc, t_attr]
	else:
		lbl_tower_name.text = "%s (LV %d)\n%s" % [t_name, tower.level, t_attr]

	var dmg_str = format_number(tower.total_damage_dealt)
	var stats_str = "Sát thương: %s | Tiêu diệt: %d" % [dmg_str, tower.kill_count]
	if lbl_damage_stats:
		lbl_damage_stats.text = stats_str
		lbl_damage_stats.visible = true
	else:
		lbl_tower_name.text += "\n" + stats_str

	if lbl_perk_badge:
		if tower.level >= 3:
			lbl_perk_badge.text = tower.get_tier3_perk_name()
			lbl_perk_badge.visible = true
		else:
			lbl_perk_badge.text = ""
			lbl_perk_badge.visible = false

	if btn_target_priority:
		btn_target_priority.text = "MỤC TIÊU: %s" % tower.get_target_priority_name()

	if tower.can_upgrade():
		var up_cost = tower.get_upgrade_cost()
		btn_upgrade_tower.text = "NÂNG CẤP (%dG)" % up_cost
		btn_upgrade_tower.disabled = (gold < up_cost)
	else:
		btn_upgrade_tower.text = "[MAX] CỰC PHẨM"
		btn_upgrade_tower.disabled = true

	var is_between_waves = not is_wave_active
	var sell_val = tower.get_sell_value(is_between_waves)
	btn_sell_tower.text = "BÁN (%dG)" % sell_val
	btn_sell_tower.add_theme_font_size_override("font_size", 11)
	btn_upgrade_tower.add_theme_font_size_override("font_size", 11)

	if btn_overclock_tower:
		btn_overclock_tower.add_theme_font_size_override("font_size", 11)
		if tower.can_overclock():
			btn_overclock_tower.text = "QUÁ TẢI (25G)"
			btn_overclock_tower.disabled = (gold < 25)
		else:
			btn_overclock_tower.text = "HỒI: %ds" % int(ceilf(tower.overclock_cooldown))
			btn_overclock_tower.disabled = true

	# Đặt UpgradePopup ở Góc Dưới Bên Phải (phía trên thanh Bottom Dock, vùng bãi cỏ yên tĩnh bên phải x=990, y=370)
	# Thu gọn chiều rộng popup xuống 330px, hoàn toàn không che đường đi của quái vật hay cổng portal
	upgrade_popup.size = Vector2(330.0, 260.0)
	upgrade_popup.position = Vector2(990.0, 370.0)
	upgrade_popup.visible = true
	queue_redraw()

func _on_btn_target_priority_pressed() -> void:
	if not selected_tower:
		return
	selected_tower.cycle_target_priority()
	if btn_target_priority:
		btn_target_priority.text = "MỤC TIÊU: %s" % selected_tower.get_target_priority_name()
	_open_upgrade_popup(selected_tower)
	if web_bridge:
		web_bridge.show_toast("Ưu tiên mục tiêu: %s" % selected_tower.get_target_priority_name(), "info")
		web_bridge.trigger_haptic("selection")

func _on_btn_speed_pressed() -> void:
	if is_equal_approx(game_speed, 1.0):
		game_speed = 2.0
		Engine.time_scale = 2.0
		if web_bridge:
			web_bridge.show_toast("Tốc độ trận đấu: 2X", "info")
			web_bridge.trigger_haptic("selection")
	else:
		game_speed = 1.0
		Engine.time_scale = 1.0
		if web_bridge:
			web_bridge.show_toast("Tốc độ trận đấu: 1X", "info")
			web_bridge.trigger_haptic("selection")
	_update_speed_button_style()

func _close_upgrade_popup() -> void:
	if selected_tower:
		selected_tower.is_selected = false
		selected_tower = null
	if upgrade_popup:
		upgrade_popup.visible = false
	queue_redraw()

func _on_btn_upgrade_tower_pressed() -> void:
	if not selected_tower or not selected_tower.can_upgrade():
		return

	var cost = selected_tower.get_upgrade_cost()
	if gold < cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG." % cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	gold -= cost
	selected_tower.upgrade()
	_update_hud()
	_open_upgrade_popup(selected_tower)

	if web_bridge:
		web_bridge.show_toast("Tháp đã thăng cấp Lv %d!" % selected_tower.level, "success")
		web_bridge.trigger_haptic("medium")

func _on_btn_overclock_pressed() -> void:
	if not selected_tower or not is_instance_valid(selected_tower):
		return
	if not selected_tower.can_overclock():
		if web_bridge:
			web_bridge.show_toast("Tháp đang hồi chiêu Quá Tải! Còn %ds." % int(ceilf(selected_tower.overclock_cooldown)), "warning")
			web_bridge.trigger_haptic("selection")
		return
	if gold < 25:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần 25G để kích hoạt Quá Tải.", "warning")
			web_bridge.trigger_haptic("selection")
		return

	gold -= 25
	selected_tower.activate_overclock()
	_update_hud()
	_open_upgrade_popup(selected_tower)
	if sound_synth:
		sound_synth.play_upgrade()
	if web_bridge:
		web_bridge.show_toast("KÍCH HOẠT QUÁ TẢI! +40% Tốc bắn & +15% Tầm bắn (6s)!", "success")
		web_bridge.trigger_haptic("heavy")

func _on_btn_sell_tower_pressed() -> void:
	if not selected_tower:
		return

	var is_between_waves = not is_wave_active
	var sell_val = selected_tower.get_sell_value(is_between_waves)
	gold += sell_val
	_update_hud()

	if sound_synth:
		sound_synth.play_sell()

	selected_tower.queue_free()
	_close_upgrade_popup()

	if web_bridge:
		web_bridge.show_toast("Đã bán tháp! Nhận lại +%dG%s." % [sell_val, " (Hoàn 85% giữa đợt)" if is_between_waves else ""], "info")
		web_bridge.trigger_haptic("medium")

## Điều khiển Camera góc nhìn
func _on_btn_camera_mode_pressed() -> void:
	if camera_ctrl:
		var mode_name = camera_ctrl.cycle_camera_mode()
		btn_camera_mode.text = mode_name
		if web_bridge:
			web_bridge.show_toast("Góc nhìn: %s" % mode_name, "info")
			web_bridge.trigger_haptic("selection")

func call_wave_early() -> bool:
	if is_wave_active or is_game_over or is_victory:
		return false
	gold += 15
	score += 150
	_spawn_floating_map_text("+15G TIÊN PHONG!", Vector2(688.0, 360.0), Color(1.0, 0.85, 0.2))
	if sound_synth:
		sound_synth.play_sell()
	if web_bridge:
		web_bridge.show_toast("+15G TIÊN PHONG! Gọi Wave sớm.", "success")
		web_bridge.trigger_haptic("medium")
	_on_btn_next_wave_pressed()
	return true

func toggle_hardcore_mode() -> bool:
	if is_wave_active:
		if web_bridge:
			web_bridge.show_toast("Không thể đổi chế độ khi đang giao tranh!", "warning")
			web_bridge.trigger_haptic("selection")
		return is_hardcore_mode

	is_hardcore_mode = not is_hardcore_mode
	_update_hardcore_button_style()

	if is_hardcore_mode:
		if web_bridge:
			web_bridge.show_toast("ĐÃ BẬT CHẾ ĐỘ THỬ THÁCH (HARDCORE)! Máu +25%, Quái +2, Thưởng +30% Vàng.", "warning")
			web_bridge.trigger_haptic("heavy")
	else:
		if web_bridge:
			web_bridge.show_toast("Đã tắt Chế độ Thử Thách. Trở về chế độ Tiêu Chuẩn.", "info")
			web_bridge.trigger_haptic("selection")

	_update_hud()
	queue_redraw()
	return is_hardcore_mode

func _on_btn_next_wave_pressed() -> void:
	if is_game_over or (is_victory and not is_endless_mode):
		_restart_game()
		return
	if is_wave_active:
		return
	current_wave += 1
	is_wave_active = true

	# Sprint 6: Sự kiện Bão Từ Trường Ion ở Wave 7 & Wave 9
	is_ion_storm_active = (current_wave == 7 or current_wave == 9)
	EnemyClass.is_ion_storm_active = is_ion_storm_active
	if is_ion_storm_active and web_bridge:
		web_bridge.show_toast("BÃO TỪ TRƯỜNG ION! Sát thương Điện +25%, Cooldown Bẫy Cầu 10s!", "warning")
		web_bridge.trigger_haptic("heavy")

	# Sprint 6: Chế độ Thử Thách tăng thêm 2 quái mỗi đợt
	_enemies_remaining = 4 + current_wave * 2 + (2 if is_hardcore_mode else 0)
	_spawn_timer = 0.3
	btn_next_wave.disabled = true
	_set_button_dock_label(btn_next_wave, "DEFENDING...", "[PHÒNG THỦ]")

	# Thả Hòm Tiếp Tế ở các Wave chẵn (Wave 2, 4, 6, 8 và Endless Wave chẵn)
	if current_wave in [2, 4, 6, 8] or (is_endless_mode and current_wave % 2 == 0):
		spawn_supply_pod()

	_update_hud()

	if web_bridge:
		web_bridge.trigger_haptic("medium")

func _restart_game(keep_hardcore: bool = false) -> void:
	base_health = max_health
	gold = 350
	score = 335
	current_wave = 0
	is_game_over = false
	is_victory = false
	is_endless_mode = false
	combo_reaction_count = 0
	is_wave_active = false
	is_ion_storm_active = false
	EnemyClass.is_ion_storm_active = false
	if not keep_hardcore:
		is_hardcore_mode = false
	if btn_hardcore:
		_update_hardcore_button_style()
	_enemies_remaining = 0
	_spawn_timer = 0.0
	supply_pods.clear()
	bridge_emp_timer = 0.0
	_bridge_emp_shockwave_alpha = 0.0

	# Đóng toàn bộ popup và tray giao diện
	if upgrade_popup: upgrade_popup.visible = false
	if build_popup: build_popup.visible = false
	if quick_tower_tray: quick_tower_tray.visible = false
	if quick_spell_tray: quick_spell_tray.visible = false
	if skill_tree_modal: skill_tree_modal.visible = false
	if victory_defeat_modal: victory_defeat_modal.visible = false
	if boss_raid_banner: boss_raid_banner.visible = false
	selected_tower = null
	selected_pad_idx = -1
	is_placing_tower = false

	# Xóa toàn bộ quái hiện có
	for e in enemies_container.get_children():
		enemies_container.remove_child(e)
		e.free()

	# Xóa toàn bộ tháp hiện có
	for t in towers_container.get_children():
		towers_container.remove_child(t)
		t.free()

	# Reset Cây Kỹ Năng Công Nghệ
	skill_tier_range = 0
	skill_tier_damage = 0
	skill_tier_speed = 0
	selected_skill_branch = "range"
	selected_skill_tier = 1
	game_speed = 1.0
	Engine.time_scale = 1.0
	_update_speed_button_style()
	_apply_tech_multipliers()
	_refresh_skill_tree_ui()

	# Dựng lại 2 tháp mẫu mặc định tại Pad 6 và Pad 7 vững chãi sát mặt đất
	_build_tower_at_position(BUILD_PADS[6], TowerClass.TowerType.GATLING_GUN, true)
	_build_tower_at_position(BUILD_PADS[7], TowerClass.TowerType.PLASMA_CANNON, true)

	btn_next_wave.disabled = false
	_set_button_dock_label(btn_next_wave, "BẮT ĐẦU WAVE 1", "[N]")
	_update_hud()

	# Tự động kích hoạt Wave 1
	_on_btn_next_wave_pressed()

	if web_bridge:
		web_bridge.show_toast("Đã khởi tạo lại trận đấu!", "info")
		web_bridge.trigger_haptic("medium")

func _get_enemy_type_for_seed(seed_val: int) -> int:
	var enemy_seed = seed_val % 3
	match enemy_seed:
		0: return EnemyClass.EnemyType.MECH_WALKER      # Robot Cỗ Máy Bọc Thép (Heavy Mech)
		1: return EnemyClass.EnemyType.STEAM_TRAIN       # Xe Lửa Hơi Nước Cơ Khí (Mechanical)
		2: return EnemyClass.EnemyType.WINGED_BOT        # Chim Máy / Drone Bay (Aerial)
		_: return EnemyClass.EnemyType.MECH_WALKER

func _spawn_enemy_for_wave() -> void:
	var enemy = EnemyClass.new()
	enemy.add_to_group("animated_enemies")

	var is_boss_spawn = (current_wave in [5, 10] and _enemies_remaining == 0)
	var is_endless_twin_boss = (is_endless_mode and current_wave > 10 and current_wave % 5 == 0 and _enemies_remaining in [0, 1])
	var variant = EnemyClass.EnemyVariant.NORMAL
	var e_type = _get_enemy_type_for_seed(_enemies_remaining + current_wave)

	if is_boss_spawn or is_endless_twin_boss:
		variant = EnemyClass.EnemyVariant.BOSS
		e_type = EnemyClass.EnemyType.MECH_WALKER # Boss luôn là Mech Walker khổng lồ
		if sound_synth and (is_boss_spawn or _enemies_remaining == 1):
			sound_synth.play_boss_warning()
		if web_bridge and (is_boss_spawn or _enemies_remaining == 1):
			var toast_msg = "CẢNH BÁO: ĐỘI HÌNH BOSS KÉP (TWIN BOSS MECHS) XUẤT HIỆN!" if is_endless_twin_boss else "CẢNH BÁO: BOSS MECH XUẤT HIỆN!"
			web_bridge.show_toast(toast_msg, "error")
			web_bridge.trigger_haptic("heavy")
	elif is_endless_mode and current_wave > 10 and current_wave % 5 == 0:
		# Đội hình hộ tống Boss Kép: AIR_DRONE và SUPPORT
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (_enemies_remaining % 2 == 0) else EnemyClass.EnemyVariant.SUPPORT
	elif current_wave == 1:
		variant = EnemyClass.EnemyVariant.NORMAL
	elif current_wave == 2:
		variant = EnemyClass.EnemyVariant.SCOUT if (_enemies_remaining % 2 == 0) else EnemyClass.EnemyVariant.NORMAL
	elif current_wave == 3:
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (_enemies_remaining % 2 == 0) else EnemyClass.EnemyVariant.SCOUT
	elif current_wave == 4:
		var r4 = _enemies_remaining % 3
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (r4 == 1) else (EnemyClass.EnemyVariant.SUPPORT if (r4 == 0) else EnemyClass.EnemyVariant.ARMORED)
	elif current_wave == 5:
		variant = EnemyClass.EnemyVariant.SUPPORT if (_enemies_remaining % 2 == 0) else EnemyClass.EnemyVariant.ARMORED
	elif current_wave == 6:
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (_enemies_remaining % 2 == 0) else EnemyClass.EnemyVariant.SUPPORT
	elif current_wave == 7:
		var r = (_enemies_remaining + current_wave) % 4
		match r:
			0: variant = EnemyClass.EnemyVariant.ARMORED
			1: variant = EnemyClass.EnemyVariant.AIR_DRONE
			2: variant = EnemyClass.EnemyVariant.SUPPORT
			_: variant = EnemyClass.EnemyVariant.SCOUT
	elif current_wave == 8:
		var r8 = _enemies_remaining % 3
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (r8 == 0) else (EnemyClass.EnemyVariant.SUPPORT if (r8 == 1) else EnemyClass.EnemyVariant.ARMORED)
	elif current_wave == 9:
		var r9 = _enemies_remaining % 3
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (r9 == 0) else (EnemyClass.EnemyVariant.SUPPORT if (r9 == 1) else EnemyClass.EnemyVariant.SCOUT)
	elif current_wave == 10:
		variant = EnemyClass.EnemyVariant.AIR_DRONE if (_enemies_remaining % 2 == 0) else EnemyClass.EnemyVariant.ARMORED
	else:
		var r = (_enemies_remaining + current_wave) % 5
		match r:
			0: variant = EnemyClass.EnemyVariant.NORMAL
			1: variant = EnemyClass.EnemyVariant.SCOUT
			2: variant = EnemyClass.EnemyVariant.ARMORED
			3: variant = EnemyClass.EnemyVariant.SUPPORT
			_: variant = EnemyClass.EnemyVariant.AIR_DRONE

	var wave_mult = 1.0 + float(current_wave) * 0.25
	if is_endless_mode and current_wave > 10:
		wave_mult *= pow(1.16, float(current_wave - 10))
	if is_hardcore_mode:
		wave_mult *= 1.25 # Hardcore Mode: Máu quái tăng +25%

	enemy.setup(e_type, PATH_WAYPOINTS, wave_mult, variant)

	# Sprint 6: Bão Từ Trường Ion tăng nhẹ +15% lượng khiên khởi điểm cho quái SUPPORT và AIR_DRONE
	if is_ion_storm_active and (variant == EnemyClass.EnemyVariant.SUPPORT or variant == EnemyClass.EnemyVariant.AIR_DRONE):
		if enemy.max_shield <= 0.0:
			enemy.max_shield = 40.0
		enemy.max_shield *= 1.15
		enemy.current_shield = enemy.max_shield

	enemy.enemy_died.connect(_on_enemy_killed)
	enemy.enemy_escaped.connect(_on_enemy_escaped)
	enemies_container.add_child(enemy)

func _on_enemy_killed(_enemy: Node2D, reward: int) -> void:
	gold += reward
	score += reward * 12
	_update_hud()

	# Quái Armored hoặc Boss Mech chết có xác suất rơi Hòm Tiếp Tế
	if is_instance_valid(_enemy):
		var is_armored = _enemy.get("variant") == EnemyClass.EnemyVariant.ARMORED
		var is_b = _enemy.get("is_boss")
		if is_b or (is_armored and randf() < 0.65):
			spawn_supply_pod(_enemy.global_position)

func _on_enemy_escaped(_enemy: Node2D) -> void:
	if is_game_over:
		return
	base_health = maxi(0, base_health - 1)
	_update_hud()
	if base_health <= 0:
		is_game_over = true
		is_wave_active = false
		_enemies_remaining = 0
		var summary = get_battle_summary()
		_show_victory_defeat_modal(false, summary)
		btn_next_wave.disabled = false
		_set_button_dock_label(btn_next_wave, "CHƠI LẠI", "[SPACE]")
		if web_bridge:
			web_bridge.submit_score(score, {
				"wave": current_wave,
				"mode": "stylized_25d",
				"victory": false,
				"stars": summary["stars"],
				"mvp": summary["mvp_info"]
			})
			web_bridge.show_toast("CĂN CỨ THẤT THỦ! ĐÁNH GIÁ: %s | MVP: %s" % [summary["rating_title"], summary["mvp_info"]], "error")
			web_bridge.trigger_haptic("heavy")
	else:
		if web_bridge:
			web_bridge.show_toast("QUÁI XÂM NHẬP CĂN CỨ! -1 MÁU", "warning")
			web_bridge.trigger_haptic("heavy")

func _on_btn_build_pressed() -> void:
	# Đóng các tray và popup khác
	if upgrade_popup: upgrade_popup.visible = false
	if skill_tree_modal: skill_tree_modal.visible = false
	if quick_spell_tray: quick_spell_tray.visible = false
	if build_popup: build_popup.visible = false

	# Bật/tắt khay chọn trụ nhanh
	if quick_tower_tray:
		quick_tower_tray.visible = not quick_tower_tray.visible
		if web_bridge and quick_tower_tray.visible:
			web_bridge.trigger_haptic("selection")

func _on_quick_tower_selected(type: int, cost: int) -> void:
	if quick_tower_tray:
		quick_tower_tray.visible = false
	targeted_build_pos = Vector2.ZERO
	_on_select_tower_type(type, cost)
	if web_bridge and is_placing_tower:
		var t_name = AnimatedTower.get_tower_name(type)
		web_bridge.show_toast("Đang đặt %s: Bấm vào thảm cỏ để dựng tháp!" % t_name, "info")
		web_bridge.trigger_haptic("selection")

func _on_btn_spell_pressed() -> void:
	# Đóng các tray và popup khác
	if upgrade_popup: upgrade_popup.visible = false
	if skill_tree_modal: skill_tree_modal.visible = false
	if quick_tower_tray: quick_tower_tray.visible = false
	if build_popup: build_popup.visible = false

	# Bật/tắt khay phép thuật nhanh
	if quick_spell_tray:
		quick_spell_tray.visible = not quick_spell_tray.visible
		if web_bridge and quick_spell_tray.visible:
			web_bridge.trigger_haptic("selection")

func _cast_spell_lightning() -> void:
	var spell_cost = 80
	if gold < spell_cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG để gọi Sấm Sét." % spell_cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	gold -= spell_cost
	_update_hud()
	if quick_spell_tray: quick_spell_tray.visible = false

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e.has_method("take_damage"):
			e.take_damage(65.0, EnemyClass.DamageType.ELECTRO_EMP)

	if sound_synth:
		sound_synth.play_tesla_zap()

	if web_bridge:
		web_bridge.show_toast("BÃO SẤM SÉT! ĐÃ SỐC ĐIỆN 65 SÁT THƯƠNG TOÀN MAP!", "info")
		web_bridge.trigger_haptic("heavy")

func _cast_spell_freeze() -> void:
	var spell_cost = 100
	if gold < spell_cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG để gọi Bão Băng." % spell_cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	gold -= spell_cost
	_update_hud()
	if quick_spell_tray: quick_spell_tray.visible = false

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e.has_method("freeze"):
			e.freeze(3.5)

	if sound_synth:
		sound_synth.play_frost_zap()

	if web_bridge:
		web_bridge.show_toast("ĐÓNG BĂNG TOÀN DIỆN! TÊ LIỆT TOÀN BỘ QUÁI 3.5 GIÂY!", "info")
		web_bridge.trigger_haptic("heavy")

func _cast_spell_meteor() -> void:
	var spell_cost = 120
	if gold < spell_cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG để gọi Thiên Thạch." % spell_cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	gold -= spell_cost
	_update_hud()
	if quick_spell_tray: quick_spell_tray.visible = false

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	for e in enemies:
		if is_instance_valid(e) and e.has_method("take_damage"):
			e.take_damage(125.0, EnemyClass.DamageType.THERMAL_PLASMA)

	if sound_synth:
		sound_synth.play_plasma_cannon()

	if web_bridge:
		web_bridge.show_toast("MƯA THIÊN THẠCH! BÙNG NỔ 125 SÁT THƯƠNG DIỆN RỘNG!", "info")
		web_bridge.trigger_haptic("heavy")

func _on_btn_skill_tree_pressed() -> void:
	# Đóng các tray và popup khác
	if upgrade_popup: upgrade_popup.visible = false
	if quick_tower_tray: quick_tower_tray.visible = false
	if quick_spell_tray: quick_spell_tray.visible = false
	if build_popup: build_popup.visible = false

	if skill_tree_modal:
		skill_tree_modal.visible = not skill_tree_modal.visible
		if skill_tree_modal.visible:
			_refresh_skill_tree_ui()
			if web_bridge:
				web_bridge.trigger_haptic("selection")

func _select_skill(branch: String, tier: int) -> void:
	selected_skill_branch = branch
	selected_skill_tier = tier
	_refresh_skill_tree_ui()
	if sound_synth:
		sound_synth.play_ui_tap()

func _get_range_bonus_for_tier(t: int) -> float:
	match t:
		1: return 0.15
		2: return 0.30
		3: return 0.50
		_: return 0.0

func _get_damage_bonus_for_tier(t: int) -> float:
	match t:
		1: return 0.20
		2: return 0.40
		3: return 0.70
		_: return 0.0

func _get_speed_bonus_for_tier(t: int) -> float:
	match t:
		1: return 0.20
		2: return 0.45
		3: return 0.80
		_: return 0.0

func _apply_tech_multipliers() -> void:
	TowerClass.tech_range_mult = 1.0 + _get_range_bonus_for_tier(skill_tier_range)
	TowerClass.tech_damage_mult = 1.0 + _get_damage_bonus_for_tier(skill_tier_damage)
	TowerClass.tech_speed_mult = 1.0 + _get_speed_bonus_for_tier(skill_tier_speed)

func _get_current_tier_for_branch(branch: String) -> int:
	match branch:
		"range": return skill_tier_range
		"damage": return skill_tier_damage
		"speed": return skill_tier_speed
		_: return 0

func _refresh_skill_tree_ui() -> void:
	if not is_inside_tree() or not skill_tree_modal:
		return

	if lbl_gold_skill:
		lbl_gold_skill.text = "NGÂN SÁCH HIỆN CÓ: %d VÀNG" % gold

	var r_pct = int(_get_range_bonus_for_tier(skill_tier_range) * 100.0)
	var d_pct = int(_get_damage_bonus_for_tier(skill_tier_damage) * 100.0)
	var s_pct = int(_get_speed_bonus_for_tier(skill_tier_speed) * 100.0)
	if lbl_current_bonuses:
		lbl_current_bonuses.text = "TẦM: +%d%% | DMG: +%d%% | TỐC: +%d%%" % [r_pct, d_pct, s_pct]

	# Cập nhật trạng thái từng nút theo cấp độ
	_update_skill_button_state(btn_skill_r1, "range", 1, "RADAR SƠ CẤP", "+15% Tầm Bắn", 100)
	_update_skill_button_state(btn_skill_r2, "range", 2, "QUANG HỌC AI", "+30% Tầm Bắn", 180)
	_update_skill_button_state(btn_skill_r3, "range", 3, "VI TỬ VỆ TINH", "+50% Tầm Bắn", 280)

	_update_skill_button_state(btn_skill_d1, "damage", 1, "THUỐC SÚNG ĐẬM", "+20% Damage", 120)
	_update_skill_button_state(btn_skill_d2, "damage", 2, "ĐẠN VONFRAM", "+40% Damage", 200)
	_update_skill_button_state(btn_skill_d3, "damage", 3, "HẠT PHẢN VẬT", "+70% Damage", 320)

	_update_skill_button_state(btn_skill_s1, "speed", 1, "BĂNG NẠP NHANH", "+20% Tốc Bắn", 110)
	_update_skill_button_state(btn_skill_s2, "speed", 2, "NỒNG TẢN NHIỆT", "+45% Tốc Bắn", 190)
	_update_skill_button_state(btn_skill_s3, "speed", 3, "QUÁ TẢI HYPER", "+80% Tốc Bắn", 300)

	# Cập nhật độ sáng vi mạch năng lượng 2.5D kết nối các Tier
	if arrow_r1: arrow_r1.modulate = Color(1.0, 1.0, 1.0, 1.0) if skill_tier_range >= 1 else Color(0.4, 0.55, 0.7, 0.35)
	if arrow_r2: arrow_r2.modulate = Color(1.0, 1.0, 1.0, 1.0) if skill_tier_range >= 2 else Color(0.4, 0.55, 0.7, 0.35)
	if arrow_d1: arrow_d1.modulate = Color(1.0, 1.0, 1.0, 1.0) if skill_tier_damage >= 1 else Color(0.5, 0.4, 0.4, 0.35)
	if arrow_d2: arrow_d2.modulate = Color(1.0, 1.0, 1.0, 1.0) if skill_tier_damage >= 2 else Color(0.5, 0.4, 0.4, 0.35)
	if arrow_s1: arrow_s1.modulate = Color(1.0, 1.0, 1.0, 1.0) if skill_tier_speed >= 1 else Color(0.5, 0.5, 0.35, 0.35)
	if arrow_s2: arrow_s2.modulate = Color(1.0, 1.0, 1.0, 1.0) if skill_tier_speed >= 2 else Color(0.5, 0.5, 0.35, 0.35)

	# Cập nhật Inspector Card
	var branch_info = SKILL_DATA.get(selected_skill_branch, {})
	var tier_info = branch_info.get(selected_skill_tier, {})
	var curr_tier = _get_current_tier_for_branch(selected_skill_branch)

	if lbl_inspector_title:
		lbl_inspector_title.text = "%s - %s" % [branch_info.get("name", ""), tier_info.get("title", "")]

	if lbl_inspector_desc:
		lbl_inspector_desc.text = tier_info.get("desc", "")

	if btn_upgrade_skill:
		if curr_tier >= selected_skill_tier:
			btn_upgrade_skill.text = "[ĐÃ MỞ KHÓA CẤP NÀY]"
			btn_upgrade_skill.disabled = true
		elif selected_skill_tier == curr_tier + 1:
			var cost = tier_info.get("cost", 100)
			btn_upgrade_skill.text = "NÂNG CẤP NGAY (%dG)" % cost
			btn_upgrade_skill.disabled = (gold < cost)
		else:
			btn_upgrade_skill.text = "CẦN MỞ TIER %d TRƯỚC" % (selected_skill_tier - 1)
			btn_upgrade_skill.disabled = true

	if btn_reset_skill_branch:
		var total_spent = _calculate_total_skills_cost()
		btn_reset_skill_branch.text = "TẨY ĐIỂM (+%dG)" % total_spent
		btn_reset_skill_branch.disabled = (total_spent == 0)

func _update_skill_button_state(btn: Button, branch: String, tier: int, title: String, bonus: String, cost: int) -> void:
	if not btn: return
	var curr_tier = _get_current_tier_for_branch(branch)
	var is_selected = (selected_skill_branch == branch and selected_skill_tier == tier)

	btn.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.expand_icon = true

	var col_branch: Color
	match branch:
		"range": col_branch = Color(0.0, 0.92, 1.0, 1.0)
		"damage": col_branch = Color(1.0, 0.32, 0.28, 1.0)
		"speed": col_branch = Color(1.0, 0.82, 0.15, 1.0)
		_: col_branch = Color(1.0, 1.0, 1.0, 1.0)

	var sb = StyleBoxFlat.new()
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.set_border_width_all(2)

	if is_selected:
		sb.bg_color = Color(0.10, 0.18, 0.30, 0.95)
		sb.border_color = Color(col_branch.r, col_branch.g, col_branch.b, 1.0)
	elif curr_tier >= tier:
		sb.bg_color = Color(0.08, 0.15, 0.26, 0.90)
		sb.border_color = Color(col_branch.r * 0.75, col_branch.g * 0.75, col_branch.b * 0.75, 0.85)
	elif tier == curr_tier + 1:
		sb.bg_color = Color(0.06, 0.11, 0.20, 0.85)
		sb.border_color = Color(0.70, 0.80, 0.95, 0.65)
	else:
		sb.bg_color = Color(0.04, 0.08, 0.14, 0.65)
		sb.border_color = Color(0.25, 0.35, 0.48, 0.35)

	btn.add_theme_stylebox_override("normal", sb)
	btn.add_theme_stylebox_override("hover", sb)
	btn.add_theme_stylebox_override("pressed", sb)
	btn.add_theme_stylebox_override("focus", sb)

	if curr_tier >= tier:
		btn.text = " T%d: %s\n %s\n [ĐÃ MỞ]" % [tier, title, bonus]
		btn.modulate = Color(1.0, 1.0, 1.0, 1.0)
	elif tier == curr_tier + 1:
		btn.text = " T%d: %s\n %s\n GIÁ: %dG" % [tier, title, bonus, cost]
		btn.modulate = Color(1.15, 1.15, 1.1, 1.0)
	else:
		btn.text = " T%d: %s\n %s\n KHÓA: CẦN T%d" % [tier, title, bonus, tier - 1]
		btn.modulate = Color(0.65, 0.68, 0.78, 0.75)


func _calculate_total_skills_cost() -> int:
	var total: int = 0
	for t in range(1, skill_tier_range + 1):
		total += SKILL_DATA["range"][t]["cost"]
	for t in range(1, skill_tier_damage + 1):
		total += SKILL_DATA["damage"][t]["cost"]
	for t in range(1, skill_tier_speed + 1):
		total += SKILL_DATA["speed"][t]["cost"]
	return total

func _on_btn_upgrade_skill_pressed() -> void:
	var curr_tier = _get_current_tier_for_branch(selected_skill_branch)
	if selected_skill_tier != curr_tier + 1:
		return

	var branch_info = SKILL_DATA.get(selected_skill_branch, {})
	var tier_info = branch_info.get(selected_skill_tier, {})
	var cost = tier_info.get("cost", 100)

	if gold < cost:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng để nâng cấp kỹ năng! Cần %dG." % cost, "warning")
			web_bridge.trigger_haptic("selection")
		return

	gold -= cost
	match selected_skill_branch:
		"range": skill_tier_range = selected_skill_tier
		"damage": skill_tier_damage = selected_skill_tier
		"speed": skill_tier_speed = selected_skill_tier

	_apply_tech_multipliers()
	_update_hud()
	_refresh_skill_tree_ui()

	if sound_synth:
		sound_synth.play_upgrade()

	if web_bridge:
		web_bridge.show_toast("Thành công! Đã nâng %s lên Tier %d." % [branch_info.get("name", ""), selected_skill_tier], "success")
		web_bridge.trigger_haptic("medium")

func _on_btn_reset_skills_pressed() -> void:
	var total_refund = _calculate_total_skills_cost()
	if total_refund <= 0:
		return

	gold += total_refund
	skill_tier_range = 0
	skill_tier_damage = 0
	skill_tier_speed = 0

	_apply_tech_multipliers()
	_update_hud()
	_refresh_skill_tree_ui()

	if sound_synth:
		sound_synth.play_sell()

	if web_bridge:
		web_bridge.show_toast("Đã tẩy toàn bộ kỹ năng! Hoàn lại 100% (+" + str(total_refund) + "G).", "info")
		web_bridge.trigger_haptic("medium")

func _set_button_dock_label(btn: Button, title_text: String, hotkey_text: String = "") -> void:
	if not btn: return
	btn.text = title_text
	var title_lbl = btn.find_child("Title", true, false) as Label
	if title_lbl:
		title_lbl.text = title_text
	if hotkey_text != "":
		var hotkey_lbl = btn.find_child("Hotkey", true, false) as Label
		if hotkey_lbl:
			hotkey_lbl.text = hotkey_text

func _update_speed_button_style() -> void:
	if not btn_speed: return
	var is_2x = (Engine.time_scale > 1.0)
	var col_border = Color(1.0, 0.78, 0.18, 0.95) if is_2x else Color(0.35, 0.85, 1.0, 0.65)
	var col_bg = Color(0.18, 0.12, 0.05, 0.95) if is_2x else Color(0.06, 0.09, 0.16, 0.92)
	var sb = StyleBoxFlat.new()
	sb.bg_color = col_bg
	sb.set_border_width_all(2)
	sb.border_color = col_border
	sb.set_corner_radius_all(16)
	sb.shadow_size = 4
	sb.shadow_color = Color(0, 0, 0, 0.40)
	btn_speed.add_theme_stylebox_override("normal", sb)
	btn_speed.add_theme_color_override("font_color", Color(1.0, 0.85, 0.25) if is_2x else Color(0.35, 0.88, 1.0))
	btn_speed.text = "2X" if is_2x else "1X"

func _update_hardcore_button_style() -> void:
	if not btn_hardcore: return
	var col_border = Color(1.0, 0.35, 0.20, 0.95) if is_hardcore_mode else Color(0.85, 0.30, 0.20, 0.60)
	var col_bg = Color(0.22, 0.06, 0.05, 0.95) if is_hardcore_mode else Color(0.06, 0.09, 0.16, 0.92)
	var sb = StyleBoxFlat.new()
	sb.bg_color = col_bg
	sb.set_border_width_all(2)
	sb.border_color = col_border
	sb.set_corner_radius_all(16)
	sb.shadow_size = 4
	sb.shadow_color = Color(0, 0, 0, 0.40)
	btn_hardcore.add_theme_stylebox_override("normal", sb)
	btn_hardcore.add_theme_color_override("font_color", Color(1.0, 0.45, 0.30) if is_hardcore_mode else Color(0.85, 0.60, 0.55))
	btn_hardcore.text = "THỬ THÁCH: BẬT" if is_hardcore_mode else "THỬ THÁCH"

func _update_sound_button_style() -> void:
	if not btn_sound_toggle: return
	var col_border = Color(0.85, 0.35, 0.35, 0.90) if is_sound_muted else Color(0.35, 0.85, 1.0, 0.70)
	var col_bg = Color(0.18, 0.06, 0.08, 0.95) if is_sound_muted else Color(0.06, 0.09, 0.16, 0.92)
	var sb = StyleBoxFlat.new()
	sb.bg_color = col_bg
	sb.set_border_width_all(2)
	sb.border_color = col_border
	sb.set_corner_radius_all(16)
	sb.shadow_size = 4
	sb.shadow_color = Color(0, 0, 0, 0.40)
	btn_sound_toggle.add_theme_stylebox_override("normal", sb)
	btn_sound_toggle.add_theme_color_override("font_color", Color(1.0, 0.55, 0.55) if is_sound_muted else Color(0.40, 0.90, 1.0))
	btn_sound_toggle.text = "TẮT ÂM [M]" if is_sound_muted else "ÂM THANH [M]"

func toggle_sound() -> void:
	if sound_synth:
		is_sound_muted = sound_synth.toggle_mute()
	else:
		is_sound_muted = not is_sound_muted
		var master_bus = AudioServer.get_bus_index(&"Master")
		if master_bus >= 0:
			AudioServer.set_bus_mute(master_bus, is_sound_muted)
	_update_sound_button_style()
	if web_bridge:
		web_bridge.show_toast("Âm thanh: %s [M]" % ("TẮT" if is_sound_muted else "BẬT"), "info")
		web_bridge.trigger_haptic("selection")

func unlock_medal(key: String, title: String, description: String) -> void:
	var newly_unlocked = false
	if key == "boss_hunter" and not medal_boss_hunter:
		medal_boss_hunter = true
		newly_unlocked = true
	elif key == "combo_master" and not medal_combo_master:
		medal_combo_master = true
		newly_unlocked = true
	elif key == "flawless_fortress" and not medal_flawless_fortress:
		medal_flawless_fortress = true
		newly_unlocked = true

	if newly_unlocked:
		save_records(best_stars, highest_wave, best_mvp_damage, is_hardcore_mode)
		if sound_synth:
			sound_synth.play_upgrade()
		if web_bridge:
			web_bridge.show_toast("🏆 HUY HIỆU: [%s] — %s" % [title, description], "success")
			web_bridge.trigger_haptic("heavy")
		_update_hud()

func notify_boss_interrupted() -> void:
	unlock_medal("boss_hunter", "THỢ SĂN BOSS", "Ngắt chiêu Boss thành công bằng EMP/Tesla!")

func notify_combo_reaction() -> void:
	combo_reaction_count += 1
	if combo_reaction_count >= 10:
		unlock_medal("combo_master", "ĐẠI SƯ PHỐI HỢP", "Kích hoạt >= 10 lần phản ứng Combo trong 1 trận!")

func _style_dock_button(btn: Button, title: String, hotkey: String, accent_color: Color, icon_type: int) -> void:
	if not btn: return
	btn.custom_minimum_size = Vector2(175.0, 56.0)
	btn.text = title
	btn.icon = null

	var make_btn_sb = func(bg_c: Color, border_c: Color, shadow_s: int = 4) -> StyleBoxFlat:
		var sb = StyleBoxFlat.new()
		sb.bg_color = bg_c
		sb.set_border_width_all(1.5)
		sb.border_color = border_c
		sb.set_corner_radius_all(10)
		sb.shadow_size = shadow_s
		sb.shadow_color = Color(0, 0, 0, 0.40)
		sb.shadow_offset = Vector2(0, 2)
		return sb

	btn.add_theme_stylebox_override("normal", make_btn_sb.call(Color(0.07, 0.10, 0.16, 0.92), accent_color * Color(1, 1, 1, 0.45)))
	btn.add_theme_stylebox_override("hover", make_btn_sb.call(Color(0.11, 0.16, 0.25, 0.96), accent_color * Color(1, 1, 1, 0.95), 8))
	btn.add_theme_stylebox_override("pressed", make_btn_sb.call(Color(0.05, 0.08, 0.12, 0.98), accent_color))
	btn.add_theme_stylebox_override("disabled", make_btn_sb.call(Color(0.04, 0.06, 0.09, 0.80), Color(0.25, 0.30, 0.38, 0.35), 0))

	# Ẩn hoàn toàn chữ mặc định của Button gốc để không bị đè lên nhãn tùy biến DockContent
	btn.add_theme_color_override("font_color", Color(0, 0, 0, 0.0))
	btn.add_theme_color_override("font_hover_color", Color(0, 0, 0, 0.0))
	btn.add_theme_color_override("font_pressed_color", Color(0, 0, 0, 0.0))
	btn.add_theme_color_override("font_disabled_color", Color(0, 0, 0, 0.0))
	btn.add_theme_color_override("font_focus_color", Color(0, 0, 0, 0.0))

	# Khung nội dung bên trong
	var content = btn.get_node_or_null("DockContent") as HBoxContainer
	if not content:
		content = HBoxContainer.new()
		content.name = "DockContent"
		content.mouse_filter = Control.MOUSE_FILTER_IGNORE
		content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		content.alignment = BoxContainer.ALIGNMENT_CENTER
		content.add_theme_constant_override("separation", 10)
		btn.add_child(content)

		# Khung Icon 38x38px bo góc 8px
		var icon_box = PanelContainer.new()
		icon_box.name = "IconFrame"
		icon_box.custom_minimum_size = Vector2(38, 38)
		icon_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var sb_ib = StyleBoxFlat.new()
		sb_ib.bg_color = Color(0.04, 0.06, 0.10, 0.85)
		sb_ib.set_corner_radius_all(8)
		sb_ib.set_border_width_all(1)
		sb_ib.border_color = accent_color * Color(1, 1, 1, 0.50)
		icon_box.add_theme_stylebox_override("panel", sb_ib)

		var icon = HudVectorIcon.new()
		icon.name = "VectorIcon"
		icon.custom_minimum_size = Vector2(24, 24)
		icon.icon_type = icon_type
		icon.icon_color = accent_color
		icon.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
		icon_box.add_child(icon)
		content.add_child(icon_box)

		# Nhãn tên lệnh & Phím tắt
		var vbox = VBoxContainer.new()
		vbox.name = "LabelsVBox"
		vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		vbox.add_theme_constant_override("separation", 1)

		var lbl_t = Label.new()
		lbl_t.name = "Title"
		lbl_t.text = title
		lbl_t.add_theme_font_size_override("font_size", 14)
		lbl_t.add_theme_color_override("font_color", accent_color)
		lbl_t.add_theme_color_override("font_outline_color", Color(0.04, 0.05, 0.08, 0.95))
		lbl_t.add_theme_constant_override("outline_size", 3)
		vbox.add_child(lbl_t)

		var lbl_h = Label.new()
		lbl_h.name = "Hotkey"
		lbl_h.text = hotkey
		lbl_h.add_theme_font_size_override("font_size", 10)
		lbl_h.add_theme_color_override("font_color", Color(0.60, 0.70, 0.82, 0.90))
		vbox.add_child(lbl_h)

		content.add_child(vbox)

func _setup_hud_ui() -> void:
	var hud = get_node_or_null("UI/HUD")
	if not hud:
		return

	var make_glass_box = func(border_col: Color, corner_rad: int = 10) -> StyleBoxFlat:
		var sb = StyleBoxFlat.new()
		sb.bg_color = Color(0.06, 0.09, 0.15, 0.94)
		sb.set_border_width_all(2)
		sb.border_color = border_col
		sb.set_corner_radius_all(corner_rad)
		sb.shadow_size = 8
		sb.shadow_color = Color(0, 0, 0, 0.50)
		sb.shadow_offset = Vector2(0, 4)
		sb.content_margin_left = 14
		sb.content_margin_right = 14
		sb.content_margin_top = 8
		sb.content_margin_bottom = 8
		return sb

	# 1. SCORE BOX
	var score_box = hud.get_node_or_null("ScoreBox") as PanelContainer
	if score_box:
		score_box.add_theme_stylebox_override("panel", make_glass_box.call(Color(1.0, 0.82, 0.25, 0.70)))
		score_box.position = Vector2(30.0, 18.0)
		score_box.size = Vector2(175.0, 52.0)
		var s_hbox = score_box.get_node_or_null("Margin/HBox") as HBoxContainer
		if s_hbox:
			var title_lbl = s_hbox.get_node_or_null("LabelScoreTitle") as Label
			if title_lbl:
				title_lbl.text = "ĐIỂM:"
			if not s_hbox.has_node("IconScore"):
				var icon = HudVectorIcon.new()
				icon.name = "IconScore"
				icon.custom_minimum_size = Vector2(22, 22)
				icon.icon_type = HudVectorIcon.Type.SCORE_STAR
				icon.icon_color = Color(1.0, 0.85, 0.2)
				s_hbox.add_child(icon)
				s_hbox.move_child(icon, 0)

	# 2. HEALTH BOX VỚI THANH MÁU TRỰC QUAN
	var health_box = hud.get_node_or_null("HealthBox") as PanelContainer
	if health_box:
		health_box.add_theme_stylebox_override("panel", make_glass_box.call(Color(1.0, 0.28, 0.36, 0.70)))
		health_box.position = Vector2(215.0, 18.0)
		health_box.size = Vector2(195.0, 52.0)
		var h_margin = health_box.get_node_or_null("Margin") as MarginContainer
		if h_margin:
			var old_hbox = h_margin.get_node_or_null("HBox")
			if old_hbox and not h_margin.has_node("HealthVBox"):
				var vbox = VBoxContainer.new()
				vbox.name = "HealthVBox"
				vbox.add_theme_constant_override("separation", 3)
				h_margin.remove_child(old_hbox)
				vbox.add_child(old_hbox)
				h_margin.add_child(vbox)

				var h_title = old_hbox.get_node_or_null("LabelHealthTitle") as Label
				if h_title:
					h_title.text = "MÁU:"
				if not old_hbox.has_node("IconHealth"):
					var icon = HudVectorIcon.new()
					icon.name = "IconHealth"
					icon.custom_minimum_size = Vector2(20, 20)
					icon.icon_type = HudVectorIcon.Type.HEALTH_HEART
					icon.icon_color = Color(1.0, 0.28, 0.36)
					old_hbox.add_child(icon)
					old_hbox.move_child(icon, 0)

				health_progress_bar = ProgressBar.new()
				health_progress_bar.name = "HealthProgressBar"
				health_progress_bar.custom_minimum_size = Vector2(165, 5)
				health_progress_bar.max_value = max_health
				health_progress_bar.value = base_health
				health_progress_bar.show_percentage = false

				var pb_bg = StyleBoxFlat.new()
				pb_bg.bg_color = Color(0.04, 0.06, 0.10, 0.90)
				pb_bg.set_corner_radius_all(3)
				health_progress_bar.add_theme_stylebox_override("background", pb_bg)

				var pb_fill = StyleBoxFlat.new()
				pb_fill.bg_color = Color(0.2, 0.95, 0.40, 0.95)
				pb_fill.set_corner_radius_all(3)
				health_progress_bar.add_theme_stylebox_override("fill", pb_fill)

				vbox.add_child(health_progress_bar)

	# 3. WAVE & GOLD BOX (Cụm trên phải tách 2 ngăn rõ rệt)
	var wave_box = hud.get_node_or_null("WaveBox") as PanelContainer
	if wave_box:
		wave_box.add_theme_stylebox_override("panel", make_glass_box.call(Color(0.35, 0.75, 0.95, 0.70)))
		wave_box.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
		wave_box.offset_left = -380.0
		wave_box.offset_top = 18.0
		wave_box.offset_right = -30.0
		wave_box.offset_bottom = 68.0

		var w_hbox = wave_box.get_node_or_null("Margin/HBox") as HBoxContainer
		if w_hbox:
			w_hbox.add_theme_constant_override("separation", 8)
			var w_title = w_hbox.get_node_or_null("LabelWaveTitle") as Label
			if w_title:
				w_title.text = "ĐỢT:"
				w_title.add_theme_color_override("font_color", Color(0.35, 0.88, 1.0))

			if not w_hbox.has_node("IconWave"):
				var icon_w = HudVectorIcon.new()
				icon_w.name = "IconWave"
				icon_w.custom_minimum_size = Vector2(22, 22)
				icon_w.icon_type = HudVectorIcon.Type.WAVE_SWORDS
				icon_w.icon_color = Color(0.35, 0.88, 1.0)
				w_hbox.add_child(icon_w)
				w_hbox.move_child(icon_w, 0)

			# Vạch phân cách giữa Đợt và Vàng
			if not w_hbox.has_node("WaveGoldDivider"):
				var div = ColorRect.new()
				div.name = "WaveGoldDivider"
				div.custom_minimum_size = Vector2(2, 26)
				div.color = Color(0.25, 0.45, 0.65, 0.60)
				w_hbox.add_child(div)
				var g_title = w_hbox.get_node_or_null("LabelGoldTitle")
				if g_title:
					w_hbox.move_child(div, g_title.get_index())

			var g_title_lbl = w_hbox.get_node_or_null("LabelGoldTitle") as Label
			if g_title_lbl:
				g_title_lbl.text = "VÀNG:"
				g_title_lbl.add_theme_color_override("font_color", Color(1.0, 0.82, 0.15))

			if not w_hbox.has_node("IconGold"):
				var icon_g = HudVectorIcon.new()
				icon_g.name = "IconGold"
				icon_g.custom_minimum_size = Vector2(22, 22)
				icon_g.icon_type = HudVectorIcon.Type.GOLD_COIN
				icon_g.icon_color = Color(1.0, 0.82, 0.15)
				w_hbox.add_child(icon_g)
				var g_lbl = w_hbox.get_node_or_null("LabelGoldTitle")
				if g_lbl:
					w_hbox.move_child(icon_g, g_lbl.get_index())

			if label_gold:
				label_gold.add_theme_color_override("font_color", Color(1.0, 0.90, 0.35))
				label_gold.add_theme_font_size_override("font_size", 22)

	# 4. WAVE INTEL BOX (Dải băng tình báo chiến thuật)
	var intel_box = hud.get_node_or_null("WaveIntelBox") as PanelContainer
	if intel_box:
		var sb_intel = StyleBoxFlat.new()
		sb_intel.bg_color = Color(0.06, 0.09, 0.15, 0.92)
		sb_intel.set_border_width_all(1.5)
		sb_intel.border_color = Color(0.25, 0.65, 0.90, 0.55)
		sb_intel.set_corner_radius_all(8)
		sb_intel.shadow_size = 6
		sb_intel.shadow_color = Color(0, 0, 0, 0.35)
		sb_intel.shadow_offset = Vector2(0, 2)
		sb_intel.content_margin_left = 12
		sb_intel.content_margin_right = 12
		sb_intel.content_margin_top = 4
		sb_intel.content_margin_bottom = 4
		intel_box.add_theme_stylebox_override("panel", sb_intel)
		intel_box.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
		intel_box.offset_left = -400.0
		intel_box.offset_top = 74.0
		intel_box.offset_right = -30.0
		intel_box.offset_bottom = 112.0

	# 5. NÚT PILL CAMERA, TỐC ĐỘ, THỬ THÁCH
	var make_pill_style = func(border_col: Color, bg_col: Color = Color(0.06, 0.09, 0.16, 0.92)) -> StyleBoxFlat:
		var sb = StyleBoxFlat.new()
		sb.bg_color = bg_col
		sb.set_border_width_all(2)
		sb.border_color = border_col
		sb.set_corner_radius_all(16)
		sb.shadow_size = 4
		sb.shadow_color = Color(0, 0, 0, 0.40)
		sb.shadow_offset = Vector2(0, 2)
		return sb

	if btn_camera_mode:
		btn_camera_mode.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		btn_camera_mode.position = Vector2(24.0, 74.0)
		btn_camera_mode.size = Vector2(178.0, 36.0)
		btn_camera_mode.custom_minimum_size = Vector2(178.0, 36.0)
		btn_camera_mode.add_theme_font_size_override("font_size", 12)
		btn_camera_mode.add_theme_stylebox_override("normal", make_pill_style.call(Color(0.3, 0.85, 1.0, 0.65)))
		btn_camera_mode.add_theme_stylebox_override("hover", make_pill_style.call(Color(0.3, 0.95, 1.0, 0.95), Color(0.10, 0.15, 0.24, 0.96)))
		btn_camera_mode.add_theme_stylebox_override("pressed", make_pill_style.call(Color(0.2, 0.75, 0.90, 1.0), Color(0.04, 0.07, 0.12, 0.98)))

	if btn_speed:
		btn_speed.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		btn_speed.position = Vector2(208.0, 74.0)
		btn_speed.size = Vector2(68.0, 36.0)
		btn_speed.custom_minimum_size = Vector2(68.0, 36.0)
		btn_speed.add_theme_font_size_override("font_size", 14)
		_update_speed_button_style()

	if btn_hardcore:
		btn_hardcore.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		btn_hardcore.position = Vector2(282.0, 74.0)
		btn_hardcore.size = Vector2(120.0, 36.0)
		btn_hardcore.custom_minimum_size = Vector2(120.0, 36.0)
		btn_hardcore.add_theme_font_size_override("font_size", 12)
		_update_hardcore_button_style()

	if not btn_sound_toggle and hud:
		btn_sound_toggle = Button.new()
		btn_sound_toggle.name = "BtnSoundToggle"
		hud.add_child(btn_sound_toggle)

	if btn_sound_toggle:
		btn_sound_toggle.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		btn_sound_toggle.position = Vector2(408.0, 74.0)
		btn_sound_toggle.size = Vector2(104.0, 36.0)
		btn_sound_toggle.custom_minimum_size = Vector2(104.0, 36.0)
		btn_sound_toggle.add_theme_font_size_override("font_size", 12)
		_update_sound_button_style()
		if not btn_sound_toggle.pressed.is_connected(toggle_sound):
			btn_sound_toggle.pressed.connect(toggle_sound)

	# 6. RECORD BOX
	var rec_box = hud.get_node_or_null("RecordBox") as PanelContainer
	if rec_box:
		rec_box.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		rec_box.position = Vector2(24.0, 118.0)
		rec_box.size = Vector2(240.0, 32.0)
		var sb_rec = StyleBoxFlat.new()
		sb_rec.bg_color = Color(0.05, 0.08, 0.14, 0.88)
		sb_rec.set_border_width_all(1.5)
		sb_rec.border_color = Color(1.0, 0.80, 0.25, 0.45)
		sb_rec.set_corner_radius_all(8)
		sb_rec.shadow_size = 4
		sb_rec.shadow_color = Color(0, 0, 0, 0.30)
		sb_rec.content_margin_left = 10
		sb_rec.content_margin_right = 10
		sb_rec.content_margin_top = 4
		sb_rec.content_margin_bottom = 4
		rec_box.add_theme_stylebox_override("panel", sb_rec)
		rec_box.position = Vector2(30.0, 118.0)
		rec_box.size = Vector2(388.0, 32.0)

	# 7. BOTTOM COMMAND DOCK
	if bottom_bar:
		var sb_bar = StyleBoxFlat.new()
		sb_bar.bg_color = Color(0.05, 0.08, 0.13, 0.95)
		sb_bar.border_width_top = 2
		sb_bar.border_color = Color(0.35, 0.75, 0.95, 0.70)
		sb_bar.border_width_left = 1
		sb_bar.border_width_right = 1
		sb_bar.border_width_bottom = 0
		sb_bar.corner_radius_top_left = 18
		sb_bar.corner_radius_top_right = 18
		sb_bar.shadow_size = 12
		sb_bar.shadow_color = Color(0, 0, 0, 0.55)
		sb_bar.shadow_offset = Vector2(0, -4)
		bottom_bar.add_theme_stylebox_override("panel", sb_bar)
		bottom_bar.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
		bottom_bar.offset_left = 280.0
		bottom_bar.offset_right = -280.0
		bottom_bar.offset_top = -80.0
		bottom_bar.offset_bottom = -8.0

		var b_margin = bottom_bar.get_node_or_null("Margin") as MarginContainer
		if b_margin:
			b_margin.add_theme_constant_override("margin_left", 14)
			b_margin.add_theme_constant_override("margin_right", 14)
			b_margin.add_theme_constant_override("margin_top", 8)
			b_margin.add_theme_constant_override("margin_bottom", 8)
			var b_hbox = b_margin.get_node_or_null("HBox") as HBoxContainer
			if b_hbox:
				b_hbox.add_theme_constant_override("separation", 12)

		_style_dock_button(btn_build, "MUA TRỤ", "[SPACE]", Color(0.30, 0.95, 1.0), HudVectorIcon.Type.TOWER_CANNON)
		_style_dock_button(btn_skill_tree, "KỸ NĂNG", "[W]", Color(0.35, 1.0, 0.65), HudVectorIcon.Type.SKILL_CHIP)
		_style_dock_button(btn_spell, "PHÉP THUẬT", "[E]", Color(1.0, 0.85, 0.25), HudVectorIcon.Type.SPELL_BURST)
		_style_dock_button(btn_next_wave, "GỌI ĐỢT", "[N]", Color(1.0, 0.42, 0.35), HudVectorIcon.Type.DEFEND_SHIELD)

	# 8. THIẾT LẬP QUICK TRAYS & CARDS
	_setup_tray_icons()

func _setup_button_icons() -> void:
	_setup_hud_ui()

func _setup_boss_raid_banner() -> void:
	if not boss_raid_banner and has_node("UI/HUD"):
		boss_raid_banner = PanelContainer.new()
		boss_raid_banner.name = "BossRaidBanner"
		boss_raid_banner.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		boss_raid_banner.offset_left = 468.0
		boss_raid_banner.offset_top = 14.0
		boss_raid_banner.offset_right = 908.0
		boss_raid_banner.offset_bottom = 58.0
		boss_raid_banner.custom_minimum_size = Vector2(440.0, 44.0)
		boss_raid_banner.z_index = 10
		$UI/HUD.add_child(boss_raid_banner)

	if not boss_raid_banner:
		return

	# Style panel viền đỏ cam phát sáng chuẩn boss raid
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.08, 0.12, 0.94)
	sb.border_color = Color(1.0, 0.35, 0.15, 0.95)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(6)
	sb.shadow_color = Color(1.0, 0.25, 0.05, 0.35)
	sb.shadow_size = 4
	boss_raid_banner.add_theme_stylebox_override("panel", sb)

	var margin = boss_raid_banner.get_node_or_null("Margin")
	if not margin:
		margin = MarginContainer.new()
		margin.name = "Margin"
		margin.add_theme_constant_override("margin_left", 12)
		margin.add_theme_constant_override("margin_right", 12)
		margin.add_theme_constant_override("margin_top", 4)
		margin.add_theme_constant_override("margin_bottom", 4)
		boss_raid_banner.add_child(margin)

	var vbox = margin.get_node_or_null("VBox")
	if not vbox:
		vbox = VBoxContainer.new()
		vbox.name = "VBox"
		vbox.add_theme_constant_override("separation", 3)
		margin.add_child(vbox)

	var header = vbox.get_node_or_null("Header")
	if not header:
		header = HBoxContainer.new()
		header.name = "Header"
		header.add_theme_constant_override("separation", 8)
		vbox.add_child(header)

		var icon = HudVectorIcon.new()
		icon.name = "BossIcon"
		icon.custom_minimum_size = Vector2(16, 16)
		icon.icon_type = HudVectorIcon.Type.HARDCORE_FLAME
		icon.icon_color = Color(1.0, 0.35, 0.15)
		header.add_child(icon)

		lbl_boss_name = Label.new()
		lbl_boss_name.name = "LabelBossName"
		lbl_boss_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lbl_boss_name.add_theme_font_size_override("font_size", 12)
		lbl_boss_name.add_theme_color_override("font_color", Color(1.0, 0.40, 0.20))
		lbl_boss_name.text = "[CẢNH BÁO] BOSS MECH KHỔNG LỒ"
		header.add_child(lbl_boss_name)

		lbl_boss_hp_val = Label.new()
		lbl_boss_hp_val.name = "LabelBossHPVal"
		lbl_boss_hp_val.add_theme_font_size_override("font_size", 11)
		lbl_boss_hp_val.add_theme_color_override("font_color", Color(1.0, 0.90, 0.85))
		lbl_boss_hp_val.text = "1000 / 1000"
		header.add_child(lbl_boss_hp_val)
	else:
		lbl_boss_name = header.get_node_or_null("LabelBossName")
		lbl_boss_hp_val = header.get_node_or_null("LabelBossHPVal")

	var bars = vbox.get_node_or_null("Bars")
	if not bars:
		bars = Control.new()
		bars.name = "Bars"
		bars.custom_minimum_size = Vector2(0, 14)
		vbox.add_child(bars)

		bar_boss_hp = ProgressBar.new()
		bar_boss_hp.name = "BarBossHp"
		bar_boss_hp.set_anchors_preset(Control.PRESET_FULL_RECT)
		bar_boss_hp.show_percentage = false
		var sb_hp_bg = StyleBoxFlat.new()
		sb_hp_bg.bg_color = Color(0.12, 0.04, 0.05, 0.85)
		sb_hp_bg.set_corner_radius_all(3)
		var sb_hp_fill = StyleBoxFlat.new()
		sb_hp_fill.bg_color = Color(0.95, 0.18, 0.25, 1.0)
		sb_hp_fill.set_corner_radius_all(3)
		bar_boss_hp.add_theme_stylebox_override("background", sb_hp_bg)
		bar_boss_hp.add_theme_stylebox_override("fill", sb_hp_fill)
		bars.add_child(bar_boss_hp)

		bar_boss_shield = ProgressBar.new()
		bar_boss_shield.name = "BarBossShield"
		bar_boss_shield.set_anchors_preset(Control.PRESET_FULL_RECT)
		bar_boss_shield.show_percentage = false
		bar_boss_shield.visible = false
		var sb_s_bg = StyleBoxEmpty.new()
		var sb_s_fill = StyleBoxFlat.new()
		sb_s_fill.bg_color = Color(0.20, 0.85, 1.0, 0.80)
		sb_s_fill.set_corner_radius_all(3)
		bar_boss_shield.add_theme_stylebox_override("background", sb_s_bg)
		bar_boss_shield.add_theme_stylebox_override("fill", sb_s_fill)
		bars.add_child(bar_boss_shield)
	else:
		bar_boss_hp = bars.get_node_or_null("BarBossHp")
		bar_boss_shield = bars.get_node_or_null("BarBossShield")

	boss_raid_banner.visible = false

func _update_boss_raid_banner() -> void:
	if not boss_raid_banner:
		return
	var active_boss: AnimatedEnemy = null
	if enemies_container:
		for e in enemies_container.get_children():
			if is_instance_valid(e) and e is AnimatedEnemy and e.is_boss and not e._is_dead:
				active_boss = e
				break
	if active_boss:
		boss_raid_banner.visible = true
		if lbl_boss_name:
			if active_boss.is_jamming:
				lbl_boss_name.text = "[CẢNH BÁO] BOSS MECH: [ĐANG TÍCH XUNG NHIỄU!]"
			elif active_boss._overdrive_triggered:
				lbl_boss_name.text = "[CẢNH BÁO] BOSS MECH: [OVERDRIVE!]"
			else:
				lbl_boss_name.text = "[CẢNH BÁO] BOSS MECH KHỔNG LỒ"

		if bar_boss_hp:
			bar_boss_hp.max_value = active_boss.max_hp
			bar_boss_hp.value = active_boss.current_hp

		if bar_boss_shield:
			if active_boss.max_shield > 0.0 and active_boss.current_shield > 0.0:
				bar_boss_shield.visible = true
				bar_boss_shield.max_value = active_boss.max_shield
				bar_boss_shield.value = active_boss.current_shield
				if lbl_boss_hp_val:
					lbl_boss_hp_val.text = "%d / %d (Khiên: %d)" % [int(active_boss.current_hp), int(active_boss.max_hp), int(active_boss.current_shield)]
			else:
				bar_boss_shield.visible = false
				if lbl_boss_hp_val:
					lbl_boss_hp_val.text = "%d / %d" % [int(active_boss.current_hp), int(active_boss.max_hp)]
	else:
		boss_raid_banner.visible = false

func _setup_victory_defeat_modal() -> void:
	if not victory_defeat_modal and has_node("UI"):
		victory_defeat_modal = PanelContainer.new()
		victory_defeat_modal.name = "VictoryDefeatModal"
		victory_defeat_modal.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
		victory_defeat_modal.offset_left = 448.0
		victory_defeat_modal.offset_top = 214.0
		victory_defeat_modal.offset_right = 928.0
		victory_defeat_modal.offset_bottom = 554.0
		victory_defeat_modal.custom_minimum_size = Vector2(480.0, 340.0)
		victory_defeat_modal.z_index = 50
		$UI.add_child(victory_defeat_modal)

	if not victory_defeat_modal:
		return

	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.09, 0.16, 0.96)
	sb.border_color = Color(1.0, 0.85, 0.25, 0.90)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(12)
	sb.shadow_size = 16
	sb.shadow_color = Color(0, 0, 0, 0.65)
	victory_defeat_modal.add_theme_stylebox_override("panel", sb)

	var margin = victory_defeat_modal.get_node_or_null("Margin")
	if not margin:
		margin = MarginContainer.new()
		margin.name = "Margin"
		margin.add_theme_constant_override("margin_left", 20)
		margin.add_theme_constant_override("margin_right", 20)
		margin.add_theme_constant_override("margin_top", 18)
		margin.add_theme_constant_override("margin_bottom", 18)
		victory_defeat_modal.add_child(margin)

	var vbox = margin.get_node_or_null("VBox")
	if not vbox:
		vbox = VBoxContainer.new()
		vbox.name = "VBox"
		vbox.add_theme_constant_override("separation", 10)
		margin.add_child(vbox)

		# 1. Header (Tiêu đề lớn + phụ đề)
		lbl_modal_title = Label.new()
		lbl_modal_title.name = "LabelModalTitle"
		lbl_modal_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_modal_title.add_theme_font_size_override("font_size", 20)
		lbl_modal_title.add_theme_color_override("font_color", Color(1.0, 0.85, 0.20))
		lbl_modal_title.text = "CHIẾN THẮNG CHIẾN DỊCH!"
		vbox.add_child(lbl_modal_title)

		lbl_modal_subtitle = Label.new()
		lbl_modal_subtitle.name = "LabelModalSubtitle"
		lbl_modal_subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_modal_subtitle.add_theme_font_size_override("font_size", 13)
		lbl_modal_subtitle.add_theme_color_override("font_color", Color(0.85, 0.90, 0.95))
		lbl_modal_subtitle.text = "ĐÁNH GIÁ: 3 SAO (Hoàn Hảo)"
		vbox.add_child(lbl_modal_subtitle)

		# 2. Hàng 3 Ngôi Sao (36x36px)
		var stars_hbox = HBoxContainer.new()
		stars_hbox.name = "StarsHBox"
		stars_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
		stars_hbox.add_theme_constant_override("separation", 16)
		vbox.add_child(stars_hbox)

		modal_stars.clear()
		for i in range(3):
			var star = HudVectorIcon.new()
			star.name = "Star_%d" % (i + 1)
			star.custom_minimum_size = Vector2(36, 36)
			star.icon_type = HudVectorIcon.Type.SCORE_STAR
			star.icon_color = Color(1.0, 0.85, 0.20)
			stars_hbox.add_child(star)
			modal_stars.append(star)

		# 3. Thẻ MVP Tower
		var mvp_panel = PanelContainer.new()
		mvp_panel.name = "MVPPanel"
		var sb_mvp = StyleBoxFlat.new()
		sb_mvp.bg_color = Color(0.04, 0.07, 0.12, 0.85)
		sb_mvp.set_border_width_all(1)
		sb_mvp.border_color = Color(0.25, 0.70, 1.0, 0.45)
		sb_mvp.set_corner_radius_all(8)
		mvp_panel.add_theme_stylebox_override("panel", sb_mvp)
		vbox.add_child(mvp_panel)

		var mvp_margin = MarginContainer.new()
		mvp_margin.name = "MVPMargin"
		mvp_margin.add_theme_constant_override("margin_left", 12)
		mvp_margin.add_theme_constant_override("margin_right", 12)
		mvp_margin.add_theme_constant_override("margin_top", 6)
		mvp_margin.add_theme_constant_override("margin_bottom", 6)
		mvp_panel.add_child(mvp_margin)

		var mvp_vbox = VBoxContainer.new()
		mvp_vbox.name = "MVPVBox"
		mvp_vbox.add_theme_constant_override("separation", 2)
		mvp_margin.add_child(mvp_vbox)

		var lbl_mvp_badge = Label.new()
		lbl_mvp_badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_mvp_badge.add_theme_font_size_override("font_size", 11)
		lbl_mvp_badge.add_theme_color_override("font_color", Color(0.35, 0.85, 1.0))
		lbl_mvp_badge.text = "THÁP CHIẾN CÔNG CAO NHẤT (MVP TOWER)"
		mvp_vbox.add_child(lbl_mvp_badge)

		lbl_mvp_details = Label.new()
		lbl_mvp_details.name = "LabelMVPDetails"
		lbl_mvp_details.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_mvp_details.add_theme_font_size_override("font_size", 13)
		lbl_mvp_details.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
		lbl_mvp_details.text = "Chưa có tháp nào tham chiến"
		mvp_vbox.add_child(lbl_mvp_details)

		# 4. Kỷ Lục Trận Đấu
		lbl_records_stats = Label.new()
		lbl_records_stats.name = "LabelRecordsStats"
		lbl_records_stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_records_stats.add_theme_font_size_override("font_size", 11)
		lbl_records_stats.add_theme_color_override("font_color", Color(0.75, 0.82, 0.92))
		lbl_records_stats.text = "Điểm số: 0  |  Kỷ lục Sao: 0★  |  MVP Kỷ lục: 0"
		vbox.add_child(lbl_records_stats)

		# 5. Nút bấm Chơi Lại [R], Tiếp Tục Vô Tận [C], & Thử Thách [H]
		var btns_hbox = HBoxContainer.new()
		btns_hbox.name = "ButtonsHBox"
		btns_hbox.add_theme_constant_override("separation", 10)
		vbox.add_child(btns_hbox)

		btn_restart_modal = Button.new()
		btn_restart_modal.name = "BtnRestartModal"
		btn_restart_modal.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn_restart_modal.custom_minimum_size = Vector2(0, 42)
		btn_restart_modal.add_theme_font_size_override("font_size", 12)
		btn_restart_modal.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
		btn_restart_modal.text = "CHƠI LẠI [R]"
		var sb_btn_rst = StyleBoxFlat.new()
		sb_btn_rst.bg_color = Color(0.08, 0.18, 0.12, 0.95)
		sb_btn_rst.set_border_width_all(1)
		sb_btn_rst.border_color = Color(0.3, 1.0, 0.5, 0.8)
		sb_btn_rst.set_corner_radius_all(6)
		btn_restart_modal.add_theme_stylebox_override("normal", sb_btn_rst)
		btns_hbox.add_child(btn_restart_modal)

		btn_endless_modal = Button.new()
		btn_endless_modal.name = "BtnEndlessModal"
		btn_endless_modal.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn_endless_modal.custom_minimum_size = Vector2(0, 42)
		btn_endless_modal.add_theme_font_size_override("font_size", 12)
		btn_endless_modal.add_theme_color_override("font_color", Color(1.0, 0.85, 0.25))
		btn_endless_modal.text = "TIẾP TỤC VÔ TẬN [C]"
		var sb_btn_end = StyleBoxFlat.new()
		sb_btn_end.bg_color = Color(0.18, 0.10, 0.24, 0.95)
		sb_btn_end.set_border_width_all(1)
		sb_btn_end.border_color = Color(0.9, 0.65, 1.0, 0.85)
		sb_btn_end.set_corner_radius_all(6)
		btn_endless_modal.add_theme_stylebox_override("normal", sb_btn_end)
		btns_hbox.add_child(btn_endless_modal)

		btn_hardcore_modal = Button.new()
		btn_hardcore_modal.name = "BtnHardcoreModal"
		btn_hardcore_modal.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn_hardcore_modal.custom_minimum_size = Vector2(0, 42)
		btn_hardcore_modal.add_theme_font_size_override("font_size", 12)
		btn_hardcore_modal.add_theme_color_override("font_color", Color(1.0, 0.55, 0.3))
		btn_hardcore_modal.text = "THỬ THÁCH [H]"
		var sb_btn_hc = StyleBoxFlat.new()
		sb_btn_hc.bg_color = Color(0.18, 0.10, 0.08, 0.95)
		sb_btn_hc.set_border_width_all(1)
		sb_btn_hc.border_color = Color(1.0, 0.45, 0.25, 0.8)
		sb_btn_hc.set_corner_radius_all(6)
		btn_hardcore_modal.add_theme_stylebox_override("normal", sb_btn_hc)
		btns_hbox.add_child(btn_hardcore_modal)
	else:
		lbl_modal_title = vbox.get_node_or_null("LabelModalTitle")
		lbl_modal_subtitle = vbox.get_node_or_null("LabelModalSubtitle")
		lbl_records_stats = vbox.get_node_or_null("LabelRecordsStats")
		var s_box = vbox.get_node_or_null("StarsHBox")
		if s_box:
			modal_stars.clear()
			for child in s_box.get_children():
				if child is HudVectorIcon:
					modal_stars.append(child)
		var mvp_p = vbox.get_node_or_null("MVPPanel")
		if mvp_p:
			lbl_mvp_details = mvp_p.get_node_or_null("MVPMargin/MVPVBox/LabelMVPDetails")
		var b_box = vbox.get_node_or_null("ButtonsHBox")
		if b_box:
			btn_restart_modal = b_box.get_node_or_null("BtnRestartModal")
			btn_endless_modal = b_box.get_node_or_null("BtnEndlessModal")
			btn_hardcore_modal = b_box.get_node_or_null("BtnHardcoreModal")

	if btn_restart_modal and not btn_restart_modal.pressed.is_connected(_restart_game):
		btn_restart_modal.pressed.connect(_restart_game)
	if btn_endless_modal and not btn_endless_modal.pressed.is_connected(_on_btn_endless_modal_pressed):
		btn_endless_modal.pressed.connect(_on_btn_endless_modal_pressed)
	if btn_hardcore_modal and not btn_hardcore_modal.pressed.is_connected(_on_btn_hardcore_modal_pressed):
		btn_hardcore_modal.pressed.connect(_on_btn_hardcore_modal_pressed)

	victory_defeat_modal.visible = false

func _show_victory_defeat_modal(is_win: bool, summary: Dictionary) -> void:
	if not victory_defeat_modal:
		return
	victory_defeat_modal.visible = true

	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.09, 0.16, 0.96)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(12)
	sb.shadow_size = 16
	sb.shadow_color = Color(0, 0, 0, 0.65)

	if is_win:
		sb.border_color = Color(1.0, 0.85, 0.25, 0.90)
		if lbl_modal_title:
			lbl_modal_title.text = "CHIẾN THẮNG CHIẾN DỊCH!"
			lbl_modal_title.add_theme_color_override("font_color", Color(1.0, 0.85, 0.20))
		if lbl_modal_subtitle:
			lbl_modal_subtitle.text = "ĐÁNH GIÁ CHIẾN THUẬT: %s" % summary.get("rating_title", "3 SAO")
	else:
		sb.border_color = Color(1.0, 0.30, 0.30, 0.90)
		if lbl_modal_title:
			lbl_modal_title.text = "PHÒNG TUYẾN THẤT THỦ!"
			lbl_modal_title.add_theme_color_override("font_color", Color(1.0, 0.30, 0.30))
		if lbl_modal_subtitle:
			lbl_modal_subtitle.text = "Căn cứ bị phá hủy tại Đợt %d / %d" % [current_wave, MAX_WAVES]
	victory_defeat_modal.add_theme_stylebox_override("panel", sb)

	var star_count = summary.get("stars", 1) if is_win else 0
	for i in range(modal_stars.size()):
		var star_icon = modal_stars[i]
		if is_win and (i + 1) <= star_count:
			star_icon.icon_color = Color(1.0, 0.85, 0.20)
		else:
			star_icon.icon_color = Color(0.25, 0.28, 0.35, 0.70)
		star_icon.queue_redraw()

	var mvp_tower = summary.get("mvp_tower", null) as AnimatedTower
	if lbl_mvp_details:
		if mvp_tower and is_instance_valid(mvp_tower):
			var t_name = AnimatedTower.get_tower_name(mvp_tower.tower_type)
			lbl_mvp_details.text = "%s (Lv.%d) — %s Sát thương | %d Quái hạ gục" % [
				t_name, mvp_tower.level, format_number(mvp_tower.total_damage_dealt), mvp_tower.kill_count
			]
		else:
			lbl_mvp_details.text = summary.get("mvp_info", "Chưa có tháp nào tham chiến")

	if btn_endless_modal:
		btn_endless_modal.visible = is_win

	if lbl_records_stats:
		var medals_count = (1 if medal_boss_hunter else 0) + (1 if medal_combo_master else 0) + (1 if medal_flawless_fortress else 0)
		var endless_str = "  |  Vô Tận: W%d" % highest_endless_wave if highest_endless_wave > 0 else ""
		var medal_str = "  |  Huy Hiệu: 🏅%d/3" % medals_count
		lbl_records_stats.text = "Điểm trận này: %s  |  Kỷ lục: %d★  |  MVP Kỷ lục: %s%s%s" % [
			format_number(summary.get("final_score", score)),
			summary.get("best_stars", best_stars),
			format_number(summary.get("best_mvp_damage", best_mvp_damage)),
			endless_str,
			medal_str
		]

func _on_btn_endless_modal_pressed() -> void:
	is_endless_mode = true
	is_victory = false
	if victory_defeat_modal:
		victory_defeat_modal.visible = false
	btn_next_wave.disabled = false
	_set_button_dock_label(btn_next_wave, "WAVE %d VÔ TẬN" % (current_wave + 1), "[N]")
	if web_bridge:
		web_bridge.show_toast("ĐÃ KÍCH HOẠT CHẾ ĐỘ VÔ TẬN (ENDLESS SURVIVAL WAVE 11+)!", "warning")
		web_bridge.trigger_haptic("heavy")
	_update_hud()

func _on_btn_hardcore_modal_pressed() -> void:
	is_wave_active = false
	is_hardcore_mode = true
	_restart_game(true)

func _setup_tray_icons() -> void:
	if btn_quick_gatling:
		btn_quick_gatling.icon = CardGatling
		btn_quick_gatling.expand_icon = true
		btn_quick_gatling.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		btn_quick_gatling.text = ""
	if btn_quick_plasma:
		btn_quick_plasma.icon = CardPlasma
		btn_quick_plasma.expand_icon = true
		btn_quick_plasma.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		btn_quick_plasma.text = ""
	if btn_quick_tesla:
		btn_quick_tesla.icon = CardTesla
		btn_quick_tesla.expand_icon = true
		btn_quick_tesla.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		btn_quick_tesla.text = ""

	if btn_spell_lightning:
		btn_spell_lightning.icon = IconSpellLightning
		btn_spell_lightning.expand_icon = true
		btn_spell_lightning.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	if btn_spell_freeze:
		btn_spell_freeze.icon = IconSpellFreeze
		btn_spell_freeze.expand_icon = true
		btn_spell_freeze.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	if btn_spell_meteor:
		btn_spell_meteor.icon = IconSpellMeteor
		btn_spell_meteor.expand_icon = true
		btn_spell_meteor.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT

	if btn_skill_r1: btn_skill_r1.icon = IconSkillR1; btn_skill_r1.expand_icon = true
	if btn_skill_r2: btn_skill_r2.icon = IconSkillR2; btn_skill_r2.expand_icon = true
	if btn_skill_r3: btn_skill_r3.icon = IconSkillR3; btn_skill_r3.expand_icon = true

	if btn_skill_d1: btn_skill_d1.icon = IconSkillD1; btn_skill_d1.expand_icon = true
	if btn_skill_d2: btn_skill_d2.icon = IconSkillD2; btn_skill_d2.expand_icon = true
	if btn_skill_d3: btn_skill_d3.icon = IconSkillD3; btn_skill_d3.expand_icon = true

	if btn_skill_s1: btn_skill_s1.icon = IconSkillS1; btn_skill_s1.expand_icon = true
	if btn_skill_s2: btn_skill_s2.icon = IconSkillS2; btn_skill_s2.expand_icon = true
	if btn_skill_s3: btn_skill_s3.icon = IconSkillS3; btn_skill_s3.expand_icon = true

	if arrow_r1: arrow_r1.texture = ConduitRange
	if arrow_r2: arrow_r2.texture = ConduitRange
	if arrow_d1: arrow_d1.texture = ConduitDamage
	if arrow_d2: arrow_d2.texture = ConduitDamage
	if arrow_s1: arrow_s1.texture = ConduitSpeed
	if arrow_s2: arrow_s2.texture = ConduitSpeed



func get_wave_intel(wave_idx: int) -> String:
	var prefix = ""
	if is_endless_mode or wave_idx > 10:
		prefix = "[VÔ TẬN] | "
	elif is_hardcore_mode:
		prefix = "[THỬ THÁCH] | "
	var base_intel = ""
	match wave_idx:
		1:
			base_intel = "ĐỢT 1: [Cơ Bản]"
		2:
			base_intel = "ĐỢT 2: [Trinh Sát] + [Cơ Bản]"
		3:
			base_intel = "ĐỢT 3: [Trinh Sát] + [Không Kích]"
		4:
			base_intel = "ĐỢT 4: [Không Kích] + [Hộ Vệ] + [Giáp Nặng]"
		5:
			base_intel = "ĐỢT 5: [BOSS MECH KHỔNG LỒ] + [Hộ Vệ]"
		6:
			base_intel = "ĐỢT 6: [Không Kích] + [Hộ Vệ Mech]"
		7:
			base_intel = "ĐỢT 7: [Quân Đoàn Hỗn Hợp] + [Không Kích] + [Bão Ion]"
		8:
			base_intel = "ĐỢT 8: [Không Kích] + [Giáp Nặng]"
		9:
			base_intel = "ĐỢT 9: [Không Kích] + [Hộ Vệ] + [Bão Ion]"
		10:
			base_intel = "ĐỢT 10: [BOSS CUỐI MECH OVERDRIVE] + [Không Kích]"
		_:
			if wave_idx % 5 == 0:
				base_intel = "ĐỢT %d [VÔ TẬN]: [BOSS KÉP TWIN MECHS] + [Không Kích] + [Hộ Vệ]" % wave_idx
			else:
				var scale_pct = int((pow(1.16, float(wave_idx - 10)) - 1.0) * 100.0)
				base_intel = "ĐỢT %d [VÔ TẬN]: [Quân Đoàn Cực Hạn (+%d%% Máu/Giáp)]" % [wave_idx, scale_pct]
	return prefix + base_intel

func format_number(n: int) -> String:
	var s = str(n)
	var res = ""
	var count = 0
	for i in range(s.length() - 1, -1, -1):
		res = s[i] + res
		count += 1
		if count % 3 == 0 and i > 0:
			res = "," + res
	return res

func calculate_star_rating() -> Dictionary:
	var stars: int = 1
	var title: String = "1 SAO (Sống Sót)"
	if base_health >= 18:
		stars = 3
		title = "3 SAO (Hoàn Hảo)"
	elif base_health >= 10:
		stars = 2
		title = "2 SAO (Tốt)"
	else:
		stars = 1
		title = "1 SAO (Sống Sót)"
	return {"stars": stars, "title": title}

func get_mvp_tower() -> AnimatedTower:
	var mvp: AnimatedTower = null
	var max_dmg: int = -1
	for t in towers_container.get_children():
		if is_instance_valid(t) and t is AnimatedTower:
			if t.total_damage_dealt > max_dmg:
				max_dmg = t.total_damage_dealt
				mvp = t
	return mvp

func get_battle_summary() -> Dictionary:
	var rating = calculate_star_rating()
	var mvp = get_mvp_tower()
	var mvp_info = ""
	var mvp_dmg = 0
	if mvp:
		var t_name = AnimatedTower.get_tower_name(mvp.tower_type)
		mvp_dmg = mvp.total_damage_dealt
		mvp_info = "%s tại (%.0f, %.0f) - %s Sát Thương (Hạ %d quái)" % [
			t_name, mvp.global_position.x, mvp.global_position.y,
			format_number(mvp.total_damage_dealt), mvp.kill_count
		]
	else:
		mvp_info = "Chưa có tháp nào tham chiến"

	if is_hardcore_mode:
		rating["title"] += " [KỶ LỤC THỬ THÁCH]"
		hardcore_cleared = true

	save_records(rating["stars"], current_wave, mvp_dmg, is_hardcore_mode)

	return {
		"stars": rating["stars"],
		"rating_title": rating["title"],
		"mvp_tower": mvp,
		"mvp_info": mvp_info,
		"final_score": score,
		"health": base_health,
		"wave": current_wave,
		"best_stars": best_stars,
		"highest_wave": highest_wave,
		"best_mvp_damage": best_mvp_damage,
		"hardcore_cleared": hardcore_cleared
	}

func load_records() -> void:
	var cfg = ConfigFile.new()
	var err = cfg.load(RECORDS_CFG_PATH)
	if err == OK:
		best_stars = cfg.get_value("records", "best_stars", 0)
		highest_wave = cfg.get_value("records", "highest_wave", 0)
		highest_endless_wave = cfg.get_value("records", "highest_endless_wave", 0)
		best_mvp_damage = cfg.get_value("records", "best_mvp_damage", 0)
		hardcore_cleared = cfg.get_value("records", "hardcore_cleared", false)
		medal_boss_hunter = cfg.get_value("medals", "boss_hunter", false)
		medal_combo_master = cfg.get_value("medals", "combo_master", false)
		medal_flawless_fortress = cfg.get_value("medals", "flawless_fortress", false)
	_update_record_label()

func save_records(stars: int, wave_num: int, mvp_dmg: int, is_hardcore: bool = false) -> void:
	best_stars = maxi(best_stars, stars)
	highest_wave = maxi(highest_wave, wave_num)
	if is_endless_mode and wave_num > 10:
		highest_endless_wave = maxi(highest_endless_wave, wave_num)
	best_mvp_damage = maxi(best_mvp_damage, mvp_dmg)
	if is_hardcore:
		hardcore_cleared = true
	var cfg = ConfigFile.new()
	cfg.set_value("records", "best_stars", best_stars)
	cfg.set_value("records", "highest_wave", highest_wave)
	cfg.set_value("records", "highest_endless_wave", highest_endless_wave)
	cfg.set_value("records", "best_mvp_damage", best_mvp_damage)
	cfg.set_value("records", "hardcore_cleared", hardcore_cleared)
	cfg.set_value("medals", "boss_hunter", medal_boss_hunter)
	cfg.set_value("medals", "combo_master", medal_combo_master)
	cfg.set_value("medals", "flawless_fortress", medal_flawless_fortress)
	cfg.save(RECORDS_CFG_PATH)
	_update_record_label()

func _update_record_label() -> void:
	if label_record:
		var hc_badge = " | THỬ THÁCH" if hardcore_cleared else ""
		var endless_badge = " | VÔ TẬN: W%d" % highest_endless_wave if highest_endless_wave > 0 else ""
		var m_cnt = (1 if medal_boss_hunter else 0) + (1 if medal_combo_master else 0) + (1 if medal_flawless_fortress else 0)
		var m_badge = " | 🏅%d/3" % m_cnt if m_cnt > 0 else ""
		label_record.text = "KỶ LỤC: %d SAO | MVP: %s DMG%s%s%s" % [best_stars, format_number(best_mvp_damage), hc_badge, endless_badge, m_badge]

func activate_bridge_emp() -> bool:
	if bridge_emp_timer > 0.0:
		if web_bridge:
			web_bridge.show_toast("Bẫy Cầu đang hồi chiêu! Còn %ds." % int(ceilf(bridge_emp_timer)), "warning")
			web_bridge.trigger_haptic("selection")
		return false
	if gold < BRIDGE_EMP_COST:
		if web_bridge:
			web_bridge.show_toast("Không đủ vàng! Cần %dG để kích hoạt Bẫy Cầu." % BRIDGE_EMP_COST, "warning")
			web_bridge.trigger_haptic("selection")
		return false

	gold -= BRIDGE_EMP_COST
	# Bão Từ Trường Ion giảm thời gian hồi chiêu Bẫy Cầu xuống 10s thay vì 16s
	var max_cd = 10.0 if is_ion_storm_active else BRIDGE_EMP_COOLDOWN
	bridge_emp_timer = max_cd
	_update_hud()

	# Hiệu ứng lan tỏa sóng xung kích trên mặt cầu
	_bridge_emp_shockwave_radius = 20.0
	_bridge_emp_shockwave_alpha = 1.0
	var tw = create_tween()
	tw.tween_property(self, "_bridge_emp_shockwave_radius", BRIDGE_EMP_RADIUS, 0.45).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(self, "_bridge_emp_shockwave_alpha", 0.0, 0.45)

	if sound_synth:
		if sound_synth.has_method("play_emp_shock"):
			sound_synth.play_emp_shock()
		else:
			sound_synth.play_tesla_zap()
	if web_bridge:
		var toast_msg = "KÍCH HOẠT BẪY CẦU (BÃO ION +25% DMG / COOLDOWN 10S)!" if is_ion_storm_active else "KÍCH HOẠT BẪY CẦU! Toàn bộ quái trên cầu bị tê liệt 2.5s!"
		web_bridge.show_toast(toast_msg, "success")
		web_bridge.trigger_haptic("heavy")

	var enemies = get_tree().get_nodes_in_group("animated_enemies")
	var emp_dmg = 80.0 * (1.25 if is_ion_storm_active else 1.0)
	for e in enemies:
		if is_instance_valid(e) and not e.is_queued_for_deletion() and not e.get("_is_dead"):
			if BRIDGE_EMP_POS.distance_to(e.global_position) <= BRIDGE_EMP_RADIUS:
				if "current_shield" in e and e.current_shield > 0.0:
					e.current_shield *= 0.50
				var shield_save = e.current_shield if "current_shield" in e else 0.0

				# Nếu Boss Mech đang tích tụ xung nhiễu -> ngắt chiêu lập tức!
				if e.get("is_boss") and e.get("is_jamming") and e.has_method("interrupt_jamming"):
					e.interrupt_jamming()

				if e.has_method("take_damage"):
					e.take_damage(emp_dmg, EnemyClass.DamageType.TRUE_DAMAGE)
				if "current_shield" in e:
					e.current_shield = shield_save
				if e.has_method("apply_slow"):
					e.apply_slow(0.55, 2.5)
				elif e.has_method("apply_emp_paralyze"):
					e.apply_emp_paralyze(2.5)
				if e.has_method("_spawn_combat_text"):
					e._spawn_combat_text("EMP TÊ LIỆT!", Color(0.2, 0.95, 1.0))

	queue_redraw()
	return true

func _process_pylon_tier3_wave_rewards() -> void:
	for t in towers_container.get_children():
		if is_instance_valid(t) and t is AnimatedTower:
			if t.tower_type == TowerClass.TowerType.PYLON_BUFFER and t.level >= 3:
				gold += 25
				score += 250
				_spawn_floating_map_text("+25G PYLON!", t.global_position + Vector2(0.0, -50.0), Color(1.0, 0.9, 0.2))
				if sound_synth:
					sound_synth.play_sell()
				if web_bridge:
					web_bridge.show_toast("LÕI THỊNH VƯỢNG: +25G từ Đền Pylon Cấp 3!", "success")

func spawn_supply_pod(pos: Vector2 = Vector2.ZERO) -> Dictionary:
	var spawn_pos = pos
	if spawn_pos == Vector2.ZERO:
		var candidate_pads: Array[Vector2] = []
		for p in BUILD_PADS:
			var occupied = false
			for t in towers_container.get_children():
				if is_instance_valid(t) and t.global_position.distance_to(p) < 30.0:
					occupied = true
					break
			for pod in supply_pods:
				if pod["pos"].distance_to(p) < 30.0:
					occupied = true
					break
			if not occupied:
				candidate_pads.append(p)
		if candidate_pads.size() > 0:
			spawn_pos = candidate_pads[randi() % candidate_pads.size()]
		else:
			spawn_pos = Vector2(randf_range(350.0, 950.0), randf_range(280.0, 520.0))

	var pod = {
		"id": randi(),
		"pos": spawn_pos,
		"time_left": 8.0,
		"max_time": 8.0,
		"reward": 45,
		"radius": 22.0
	}
	supply_pods.append(pod)
	if sound_synth:
		sound_synth.play_ui_tap()
	if web_bridge:
		web_bridge.show_toast("📦 HÒM TIẾP TẾ NĂNG LƯỢNG (+45G) ĐÃ XUẤT HIỆN!", "info")
	queue_redraw()
	return pod

func collect_supply_pod(pod_idx: int, is_auto: bool = false) -> int:
	if pod_idx < 0 or pod_idx >= supply_pods.size():
		return 0
	var pod = supply_pods[pod_idx]
	var gained = pod["reward"] if not is_auto else int(pod["reward"] * 0.5)
	gold += gained
	score += gained * 10
	_update_hud()

	var txt = "+%d GOLD!" % gained if not is_auto else "+%d GOLD (TỰ THU)" % gained
	var col = Color(1.0, 0.9, 0.2) if not is_auto else Color(0.85, 0.85, 0.85)
	_spawn_floating_map_text(txt, pod["pos"] + Vector2(0.0, -15.0), col)

	if sound_synth:
		sound_synth.play_sell()
	if web_bridge:
		web_bridge.show_toast("Đã thu thập Hòm Tiếp Tế: +%dG" % gained, "success")
		web_bridge.trigger_haptic("medium")

	supply_pods.remove_at(pod_idx)
	queue_redraw()
	return gained

func _spawn_floating_map_text(txt: String, pos: Vector2, col: Color) -> void:
	if not is_inside_tree() or not get_tree() or not get_tree().current_scene:
		return
	var label = Label.new()
	label.text = txt
	label.add_theme_font_size_override("font_size", 18)
	label.add_theme_color_override("font_color", col)
	label.add_theme_color_override("font_outline_color", Color(0.1, 0.08, 0.05, 0.95))
	label.add_theme_constant_override("outline_size", 4)
	label.global_position = pos + Vector2(-30.0, -20.0)
	label.z_index = 35
	add_child(label)

	var tween_l = label.create_tween()
	tween_l.tween_property(label, "global_position:y", label.global_position.y - 35.0, 0.65).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween_l.parallel().tween_property(label, "modulate:a", 0.0, 0.65)
	tween_l.tween_callback(label.queue_free)

func _update_hud() -> void:
	if label_score: label_score.text = "%d" % score
	if label_wave:
		if is_endless_mode:
			label_wave.text = "∞ W%d" % maxi(1, current_wave)
		else:
			label_wave.text = "%d" % maxi(1, current_wave)
	if label_gold: label_gold.text = format_number(gold)
	if label_health:
		label_health.text = "%d/%d" % [base_health, max_health]
		if base_health <= 5:
			label_health.add_theme_color_override("font_color", Color(1.0, 0.25, 0.25, 1.0))
		else:
			label_health.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0, 1.0))
	if health_progress_bar:
		health_progress_bar.max_value = float(max_health)
		health_progress_bar.value = float(base_health)
		var ratio = float(base_health) / float(maxi(1, max_health))
		var fill_sb = health_progress_bar.get_theme_stylebox("fill") as StyleBoxFlat
		if fill_sb:
			if ratio > 0.5:
				fill_sb.bg_color = Color(0.2, 0.95, 0.40, 0.95)
			elif ratio > 0.25:
				fill_sb.bg_color = Color(1.0, 0.85, 0.20, 0.95)
			else:
				fill_sb.bg_color = Color(1.0, 0.25, 0.30, 0.95)
	if label_wave_intel:
		var target_wave = current_wave if is_wave_active else maxi(1, current_wave + 1)
		label_wave_intel.text = get_wave_intel(target_wave)
	_update_record_label()
	_update_sound_button_style()
	if skill_tree_modal and skill_tree_modal.visible:
		_refresh_skill_tree_ui()

	if base_health <= 0 and not is_game_over:
		is_game_over = true
		is_wave_active = false
		_enemies_remaining = 0
		var summary = get_battle_summary()
		_show_victory_defeat_modal(false, summary)
		if btn_next_wave:
			btn_next_wave.disabled = false
			_set_button_dock_label(btn_next_wave, "CHƠI LẠI", "[SPACE]")

func _draw() -> void:
	# 0. Vẽ ký hiệu phát sáng tinh tế cho 2 Ô Địa hình Chiến thuật Đặc biệt
	var p_overwatch = BUILD_PADS[OVERWATCH_PAD_IDX]
	var p_conduit = BUILD_PADS[POWER_CONDUIT_PAD_IDX]
	var pulse = 0.5 + 0.5 * sin(_idle_time * 3.0)

	# Ô Cao Điểm (Overwatch Pad - Cyan: +15% Tầm bắn)
	var col_ow_fill = Color(0.1, 0.8, 1.0, 0.12 + 0.05 * pulse)
	var col_ow_stroke = Color(0.1, 0.9, 1.0, 0.65 + 0.30 * pulse)
	_draw_isometric_ellipse(p_overwatch, 28.0, 15.0, col_ow_fill)
	_draw_isometric_ellipse_outline(p_overwatch, 28.0, 15.0, col_ow_stroke, 1.8)
	_draw_isometric_ellipse_outline(p_overwatch, 34.0, 18.0, Color(0.1, 0.9, 1.0, 0.25 * pulse), 1.0)
	# Tâm hình học: Dấu + thanh mảnh thay vì vòng tròn số 0
	draw_line(p_overwatch + Vector2(-5.0, 0.0), p_overwatch + Vector2(5.0, 0.0), col_ow_stroke, 1.5)
	draw_line(p_overwatch + Vector2(0.0, -3.0), p_overwatch + Vector2(0.0, 3.0), col_ow_stroke, 1.5)

	# Ô Mạch Năng Lượng (Power Conduit Pad - Vàng Hổ Phách: +15% Tốc độ bắn)
	var col_cd_fill = Color(1.0, 0.75, 0.1, 0.12 + 0.05 * pulse)
	var col_cd_stroke = Color(1.0, 0.82, 0.15, 0.65 + 0.30 * pulse)
	_draw_isometric_ellipse(p_conduit, 28.0, 15.0, col_cd_fill)
	_draw_isometric_ellipse_outline(p_conduit, 28.0, 15.0, col_cd_stroke, 1.8)
	_draw_isometric_ellipse_outline(p_conduit, 34.0, 18.0, Color(1.0, 0.82, 0.15, 0.25 * pulse), 1.0)
	# Tâm hình học: Dấu + thanh mảnh thay vì vòng tròn số 0
	draw_line(p_conduit + Vector2(-5.0, 0.0), p_conduit + Vector2(5.0, 0.0), col_cd_stroke, 1.5)
	draw_line(p_conduit + Vector2(0.0, -3.0), p_conduit + Vector2(0.0, 3.0), col_cd_stroke, 1.5)

	# Vẽ Đế Cổ Ngữ Isometric (Tactical Pad Rune) cho tất cả ô đặt trụ trống khi mở khay mua tháp
	var show_build_runes = is_placing_tower or (quick_tower_tray and quick_tower_tray.visible) or (build_popup and build_popup.visible)
	if show_build_runes:
		var rune_pulse = 0.5 + 0.5 * sin(_idle_time * 4.0)
		for i in range(BUILD_PADS.size()):
			if i == OVERWATCH_PAD_IDX or i == POWER_CONDUIT_PAD_IDX:
				continue
			var p = BUILD_PADS[i]
			var occupied = false
			for t in towers_container.get_children():
				if is_instance_valid(t) and t.global_position.distance_to(p) < 25.0:
					occupied = true
					break
			if not occupied:
				var col_rune_fill = Color(0.15, 0.65, 0.95, 0.18 + 0.08 * rune_pulse)
				var col_rune_stroke = Color(0.3, 0.85, 1.0, 0.60 + 0.30 * rune_pulse)
				_draw_isometric_ellipse(p, 26.0, 14.0, col_rune_fill)
				_draw_isometric_ellipse_outline(p, 26.0, 14.0, col_rune_stroke, 1.6)
				_draw_isometric_ellipse_outline(p, 31.0, 16.5, Color(0.3, 0.85, 1.0, 0.20 * rune_pulse), 1.0)
				draw_line(p + Vector2(-4.0, 0.0), p + Vector2(4.0, 0.0), Color(0.4, 0.9, 1.0, 0.85), 1.4)
				draw_line(p + Vector2(0.0, -2.5), p + Vector2(0.0, 2.5), Color(0.4, 0.9, 1.0, 0.85), 1.4)

	# 0b. Vẽ Hòm Tiếp Tế Năng Lượng (Tactical Supply Drop)
	for pod in supply_pods:
		var p_pos = pod["pos"]
		var t_ratio = clampf(pod["time_left"] / pod["max_time"], 0.0, 1.0)
		var pulse_p = 0.5 + 0.5 * sin(_idle_time * 6.0)

		# Vòng hào quang tiếp tế isometric
		_draw_isometric_ellipse(p_pos, 22.0, 12.0, Color(0.1, 0.85, 0.35, 0.22 + 0.12 * pulse_p))
		_draw_isometric_ellipse_outline(p_pos, 22.0 + 2.0 * pulse_p, 12.0 + 1.0 * pulse_p, Color(1.0, 0.85, 0.2, 0.90), 2.0)
		_draw_isometric_ellipse_outline(p_pos, 14.0, 8.0, Color(0.2, 0.95, 0.45, 0.95), 2.2)

		# Nhãn text "+45G [TIẾP TẾ]"
		draw_string(ThemeDB.fallback_font, p_pos + Vector2(-36.0, -22.0), "+45G [TIẾP TẾ]", HORIZONTAL_ALIGNMENT_CENTER, -1, 12, Color(1.0, 0.92, 0.25))

		# Thanh đếm ngược thời gian tồn tại
		var bar_w = 32.0
		var bar_y = p_pos.y + 16.0
		draw_rect(Rect2(p_pos.x - bar_w * 0.5 - 1.0, bar_y - 1.0, bar_w + 2.0, 5.0), Color(0.08, 0.10, 0.14, 0.85))
		draw_rect(Rect2(p_pos.x - bar_w * 0.5, bar_y, bar_w * t_ratio, 3.0), Color(0.2, 0.95, 0.45, 0.95))

	# 0c. Vẽ Nút Bẫy Xung Điện Trên Cầu (Bridge EMP Generator)
	var emp_pulse = 0.5 + 0.5 * sin(_idle_time * 4.0)
	var emp_ready = (bridge_emp_timer <= 0.0)
	var col_emp_stroke = Color(0.1, 0.9, 1.0, 0.70 + 0.30 * emp_pulse) if emp_ready else Color(0.6, 0.6, 0.65, 0.45)
	var col_emp_fill = Color(0.05, 0.4, 0.8, 0.15 + 0.10 * emp_pulse) if emp_ready else Color(0.1, 0.1, 0.15, 0.15)

	_draw_hexagon(BRIDGE_EMP_POS, 32.0, col_emp_stroke, col_emp_fill, 2.2)
	# Khung nền kính đen mờ dưới nhãn Bẫy Cầu
	var emp_label_box = Rect2(BRIDGE_EMP_POS.x - 70.0, BRIDGE_EMP_POS.y - 36.0, 140.0, 20.0)
	draw_rect(emp_label_box, Color(0.04, 0.07, 0.12, 0.85))
	draw_rect(emp_label_box, Color(0.2, 0.85, 1.0, 0.50 if emp_ready else 0.25), false, 1.0)
	if emp_ready:
		_draw_hexagon(BRIDGE_EMP_POS, 38.0 + 4.0 * emp_pulse, Color(0.2, 0.95, 1.0, 0.35 * emp_pulse), Color.TRANSPARENT, 1.5)
		draw_string(ThemeDB.fallback_font, BRIDGE_EMP_POS + Vector2(-54.0, -22.0), "BẪY CẦU [E]: 35G", HORIZONTAL_ALIGNMENT_CENTER, -1, 12, Color(0.2, 0.95, 1.0))
	else:
		draw_string(ThemeDB.fallback_font, BRIDGE_EMP_POS + Vector2(-50.0, -22.0), "HỒI CHIÊU: %ds" % int(ceilf(bridge_emp_timer)), HORIZONTAL_ALIGNMENT_CENTER, -1, 11, Color(0.7, 0.75, 0.8))

	# Sóng xung kích phát nổ trên cầu khi kích hoạt EMP
	if _bridge_emp_shockwave_alpha > 0.01:
		draw_arc(BRIDGE_EMP_POS, _bridge_emp_shockwave_radius, 0, TAU, 36, Color(0.2, 0.95, 1.0, _bridge_emp_shockwave_alpha), 3.0)
		_draw_isometric_ellipse(BRIDGE_EMP_POS, _bridge_emp_shockwave_radius, _bridge_emp_shockwave_radius * 0.5, Color(0.2, 0.9, 1.0, _bridge_emp_shockwave_alpha * 0.25))

	# 0d. Hiệu ứng Lò phản ứng / Căn cứ Hỏa Lực cuối đường (Base Core / Reactor Visuals)
	var base_core_pos = PATH_WAYPOINTS[PATH_WAYPOINTS.size() - 1]
	var core_pulse = 0.5 + 0.5 * sin(_idle_time * 5.0)
	var is_critical = (base_health < 10)
	var core_stroke = Color(1.0, 0.20, 0.15, 0.70 + 0.30 * core_pulse) if is_critical else Color(0.2, 0.75, 1.0, 0.50 + 0.30 * core_pulse)
	var core_fill = Color(0.8, 0.1, 0.1, 0.12 + 0.10 * core_pulse) if is_critical else Color(0.1, 0.5, 0.9, 0.10 + 0.08 * core_pulse)
	_draw_isometric_ellipse(base_core_pos, 36.0, 18.0, core_fill)
	_draw_isometric_ellipse_outline(base_core_pos, 36.0, 18.0, core_stroke, 2.2)
	_draw_isometric_ellipse_outline(base_core_pos, 44.0 + 4.0 * core_pulse, 22.0 + 2.0 * core_pulse, Color(core_stroke.r, core_stroke.g, core_stroke.b, 0.35 * core_pulse), 1.2)
	if is_critical:
		draw_string(ThemeDB.fallback_font, base_core_pos + Vector2(-54.0, -28.0), "QUÁ NHIỆT CĂN CỨ!", HORIZONTAL_ALIGNMENT_CENTER, -1, 11, Color(1.0, 0.3, 0.25))

	# 0e. Hiệu ứng Bão Từ Trường Ion ở Wave 7 & 9
	if is_ion_storm_active:
		var storm_pulse = 0.5 + 0.5 * sin(_idle_time * 6.0)
		draw_rect(Rect2(2, 2, 1372, 764), Color(0.4, 0.25, 0.95, 0.25 + 0.15 * storm_pulse), false, 4.0)
		draw_rect(Rect2(6, 6, 1364, 756), Color(0.2, 0.85, 1.0, 0.12 * storm_pulse), false, 2.0)
		draw_string(ThemeDB.fallback_font, Vector2(540.0, 52.0), "BÃO TỪ TRƯỜNG ION ĐANG HOẠT ĐỘNG", HORIZONTAL_ALIGNMENT_CENTER, -1, 14, Color(0.4, 0.9, 1.0, 0.85 + 0.15 * storm_pulse))

	# 0f. Lớp phủ mây mờ che mép cắt ảnh đảo 2 bên rìa và đáy đại lục (Procedural Soft Cloud Vignette)
	_draw_soft_cloud_vignette()

	# 0g. Hiệu ứng Môi trường Sống động (Thác nước, Gợn sóng hồ bến cảng, 3 Cối xay gió, Vòng xoáy portal)
	_draw_environmental_fx()

	# 1. Vẽ Vòng Tầm Bắn Chiến Thuật Isometric nét đứt phát sáng màu Xanh Cyan khi chọn trụ
	if is_instance_valid(selected_tower):
		_draw_tactical_range_ring(selected_tower)

	# 2. Hiển thị chế độ đặt trụ tự do (Placement Mode Preview 2.5D)
	if is_placing_tower:
		_draw_placement_preview()
