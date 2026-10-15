Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "games-dev/godot-project/assets/textures/island_map.jpg"
$outPath = "C:\Users\lepha\.gemini\antigravity-ide\brain\d12ca50c-2a82-4d6b-89e4-fd7d1d41a204\pads_annotated.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::LimeGreen, 3)
$font = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)

$testPads = @(
    @{x=350; y=365; id="P0_Top"},
    @{x=245; y=395; id="P1_TopLeft"},
    @{x=280; y=465; id="P2_MidLeft"},
    @{x=375; y=420; id="P3_CenterU"},
    @{x=515; y=395; id="P4_TopRight"},
    @{x=570; y=490; id="P5_RidgeRight"},
    @{x=500; y=530; id="P6_SlopeRight"},
    @{x=590; y=610; id="P7_CaveFront"},
    @{x=215; y=740; id="P8_Windmill"},
    @{x=280; y=820; id="P9_BottomLeft"},
    @{x=345; y=870; id="P10_BottomMid"},
    @{x=475; y=840; id="P11_BottomRight"},
    @{x=570; y=880; id="P12_FarRight"},
    @{x=420; y=945; id="P13_IslandEdge"}
)

foreach ($p in $testPads) {
    $r = 25
    $g.DrawEllipse($pen, [float]($p.x - $r), [float]($p.y - $r), [float]($r * 2), [float]($r * 2))
    $g.FillEllipse($brush, [float]($p.x - 4), [float]($p.y - 4), 8.0, 8.0)
    $g.DrawString($p.id, $font, $brush, [float]($p.x + 12), [float]($p.y - 12))
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$bmp.Dispose()
Write-Host "New annotated pads generated!"
