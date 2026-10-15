Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "games-dev/godot-project/assets/textures/island_map.jpg"
$outPath = "public/pads_check.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::LimeGreen, 3)
$font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)

# Tọa độ thực tế đo chính xác trên island_map.jpg (768x1376)
$exactPads = @(
    @{x=350; y=288; id="P0_Top"},
    @{x=246; y=330; id="P1_TopLeft"},
    @{x=278; y=408; id="P2_MidLeft"},
    @{x=372; y=355; id="P3_CenterU"},
    @{x=516; y=330; id="P4_TopRight"},
    @{x=568; y=424; id="P5_RidgeRight"},
    @{x=498; y=466; id="P6_SlopeRight"},
    @{x=586; y=542; id="P7_CaveFront"},
    @{x=212; y=666; id="P8_Windmill"},
    @{x=278; y=746; id="P9_BottomLeft"},
    @{x=342; y=798; id="P10_BottomMid"},
    @{x=466; y=772; id="P11_BottomRight"},
    @{x=562; y=812; id="P12_FarRight"},
    @{x=416; y=878; id="P13_IslandEdge"}
)

foreach ($p in $exactPads) {
    $r = 24
    $g.DrawEllipse($pen, [float]($p.x - $r), [float]($p.y - $r), [float]($r * 2), [float]($r * 2))
    $g.FillEllipse($brush, [float]($p.x - 3), [float]($p.y - 3), 6.0, 6.0)
    $g.DrawString($p.id, $font, $brush, [float]($p.x + 14), [float]($p.y - 10))

    # In ra tọa độ Game World tương ứng
    $xw = [Math]::Round(360 + ($p.x - 384) * 0.9375)
    $yw = [Math]::Round(640 + ($p.y - 688) * 0.9375)
    Write-Host "Vector2($xw.0, $yw.0), // $($p.id) (tex: $($p.x), $($p.y))"
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$bmp.Dispose()
Write-Host "Saved checked pads to $outPath"
