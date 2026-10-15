Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "games-dev/godot-project/assets/textures/island_map.jpg"
$outPath = "public/pads_check2.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::LimeGreen, 3)
$font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)

# Dịch chuyển Y xuống +70px để vào đúng tâm bệ đá thực tế trên ảnh
$exactPads = @(
    @{x=350; y=288 + 72; id="P0_Top"},
    @{x=246; y=330 + 72; id="P1_TopLeft"},
    @{x=278; y=408 + 72; id="P2_MidLeft"},
    @{x=372; y=355 + 72; id="P3_CenterU"},
    @{x=516; y=330 + 72; id="P4_TopRight"},
    @{x=568; y=424 + 72; id="P5_RidgeRight"},
    @{x=498; y=466 + 72; id="P6_SlopeRight"},
    @{x=586; y=542 + 72; id="P7_CaveFront"},
    @{x=212; y=666 + 74; id="P8_Windmill"},
    @{x=278; y=746 + 74; id="P9_BottomLeft"},
    @{x=342; y=798 + 74; id="P10_BottomMid"},
    @{x=466; y=772 + 74; id="P11_BottomRight"},
    @{x=562; y=812 + 74; id="P12_FarRight"},
    @{x=416; y=878 + 74; id="P13_IslandEdge"}
)

foreach ($p in $exactPads) {
    $r = 26
    $g.DrawEllipse($pen, [float]($p.x - $r), [float]($p.y - $r), [float]($r * 2), [float]($r * 2))
    $g.FillEllipse($brush, [float]($p.x - 3), [float]($p.y - 3), 6.0, 6.0)
    $g.DrawString($p.id, $font, $brush, [float]($p.x + 14), [float]($p.y - 10))

    $xw = [Math]::Round(360 + ($p.x - 384) * 0.9375)
    $yw = [Math]::Round(640 + ($p.y - 688) * 0.9375)
    Write-Host "Vector2($xw.0, $yw.0), // $($p.id)"
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$bmp.Dispose()
Write-Host "Saved pads_check2.jpg"
