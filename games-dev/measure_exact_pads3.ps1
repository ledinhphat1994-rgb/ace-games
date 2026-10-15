Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "games-dev/godot-project/assets/textures/island_map.jpg"
$outPath = "public/pads_check3.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Cyan, 3)
$font = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)

# Tinh chỉnh từng bệ đá:
$perfectPads = @(
    @{x=356; y=358; id="P0_Top"},
    @{x=246; y=398; id="P1_TopLeft"},
    @{x=278; y=480; id="P2_MidLeft"},
    @{x=372; y=424; id="P3_CenterU"},
    @{x=516; y=402; id="P4_TopRight"},
    @{x=650; y=532; id="P5_RoadBeforeBridge"},
    @{x=748; y=624; id="P6_BelowRidge"}, # kiểm tra
    @{x=608; y=608; id="P7_CaveFront"},
    @{x=212; y=738; id="P8_Windmill"},
    @{x=278; y=820; id="P9_BottomLeft"},
    @{x=342; y=872; id="P10_BottomMid"},
    @{x=466; y=846; id="P11_BottomRight"},
    @{x=562; y=886; id="P12_FarRight"},
    @{x=416; y=952; id="P13_IslandEdge"}
)

foreach ($p in $perfectPads) {
    $r = 26
    $g.DrawEllipse($pen, [float]($p.x - $r), [float]($p.y - $r), [float]($r * 2), [float]($r * 2))
    $g.FillEllipse($brush, [float]($p.x - 3), [float]($p.y - 3), 6.0, 6.0)
    $g.DrawString($p.id, $font, $brush, [float]($p.x + 14), [float]($p.y - 10))
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$bmp.Dispose()
Write-Host "Saved pads_check3.jpg"
