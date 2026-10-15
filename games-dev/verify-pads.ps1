Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "games-dev/godot-project/assets/textures/island_map.jpg"
$outPath = "C:\Users\lepha\.gemini\antigravity-ide\brain\d12ca50c-2a82-4d6b-89e4-fd7d1d41a204\pads_verified.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 255, 0), 3)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 0, 0))

# Tọa độ chuẩn sau khi chỉnh đúng cột X
$pads = @(
    @{x=350; y=265; name="0_top"},
    @{x=245; y=295; name="1_top_left"},
    @{x=275; y=365; name="2_mid_left"},
    @{x=375; y=320; name="3_center_u"},
    @{x=515; y=295; name="4_top_right"},
    @{x=580; y=390; name="5_ridge_right"},
    @{x=510; y=430; name="6_mid_slope"},
    @{x=590; y=490; name="7_cave_front"},
    @{x=220; y=540; name="8_windmill"},
    @{x=285; y=610; name="9_bottom_left"},
    @{x=350; y=660; name="10_bottom_mid"},
    @{x=480; y=635; name="11_bottom_right"},
    @{x=575; y=675; name="12_far_right"},
    @{x=420; y=735; name="13_island_edge"}
)

foreach ($p in $pads) {
    $r = 26
    $g.DrawEllipse($pen, [float]($p.x - $r), [float]($p.y - $r), [float]($r * 2), [float]($r * 2))
    $g.FillEllipse($brush, [float]($p.x - 5), [float]($p.y - 5), 10.0, 10.0)
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$bmp.Dispose()
Write-Host "Re-checked pads overlay!"
