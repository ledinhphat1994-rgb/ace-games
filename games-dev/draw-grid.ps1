Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "games-dev/godot-project/assets/textures/island_map.jpg"
$outPath = "C:\Users\lepha\.gemini\antigravity-ide\brain\d12ca50c-2a82-4d6b-89e4-fd7d1d41a204\island_grid.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 0, 0), 1)
$penMajor = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 255, 255, 0), 2)
$font = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)

for ($x = 0; $x -lt $bmp.Width; $x += 50) {
    $p = if ($x % 100 -eq 0) { $penMajor } else { $pen }
    $g.DrawLine($p, $x, 0, $x, $bmp.Height)
    if ($x % 100 -eq 0) {
        $g.DrawString($x.ToString(), $font, $brush, [float]($x + 2), 25.0)
        $g.DrawString($x.ToString(), $font, $brush, [float]($x + 2), [float]($bmp.Height - 40))
    }
}
for ($y = 0; $y -lt $bmp.Height; $y += 50) {
    $p = if ($y % 100 -eq 0) { $penMajor } else { $pen }
    $g.DrawLine($p, 0, $y, $bmp.Width, $y)
    if ($y % 100 -eq 0) {
        $g.DrawString($y.ToString(), $font, $brush, 5.0, [float]($y + 2))
        $g.DrawString($y.ToString(), $font, $brush, [float]($bmp.Width - 45), [float]($y + 2))
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose()
$bmp.Dispose()
Write-Host "Grid generated successfully at $outPath"
