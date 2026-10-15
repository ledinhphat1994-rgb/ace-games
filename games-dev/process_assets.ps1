Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\lepha\.gemini\antigravity-ide\brain\d12ca50c-2a82-4d6b-89e4-fd7d1d41a204"
$outTexDir = "e:\phát\Ace Games\games-dev\godot-project\assets\textures"
$outSprDir = "e:\phát\Ace Games\games-dev\godot-project\assets\sprites"

if (-not (Test-Path $outTexDir)) { New-Item -ItemType Directory -Path $outTexDir -Force | Out-Null }
if (-not (Test-Path $outSprDir)) { New-Item -ItemType Directory -Path $outSprDir -Force | Out-Null }

# 1. Copy map & sky background
$mapFile = Join-Path $srcDir "floating_td_island_1791697607213.jpg"
$skyFile = Join-Path $srcDir "sky_floating_islands_1791697589167.jpg"

Copy-Item $mapFile (Join-Path $outTexDir "island_map.jpg") -Force
Copy-Item $skyFile (Join-Path $outTexDir "sky_bg.jpg") -Force

function Process-CropWhite {
    param($srcFile, $x, $y, $w, $h, $dstFile, $threshold = 236)
    $bmp = [System.Drawing.Bitmap]::FromFile($srcFile)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bmp.Dispose()

    for ($i = 0; $i -lt $cropped.Width; $i++) {
        for ($j = 0; $j -lt $cropped.Height; $j++) {
            $p = $cropped.GetPixel($i, $j)
            if ($p.R -ge $threshold -and $p.G -ge $threshold -and $p.B -ge $threshold) {
                $cropped.SetPixel($i, $j, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
    $cropped.Save($dstFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Done: $dstFile"
}

function Process-CropBlack {
    param($srcFile, $x, $y, $w, $h, $dstFile, $threshold = 40)
    $bmp = [System.Drawing.Bitmap]::FromFile($srcFile)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bmp.Dispose()

    for ($i = 0; $i -lt $cropped.Width; $i++) {
        for ($j = 0; $j -lt $cropped.Height; $j++) {
            $p = $cropped.GetPixel($i, $j)
            if ($p.R -le $threshold -and $p.G -le $threshold -and $p.B -le $threshold) {
                $cropped.SetPixel($i, $j, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
    $cropped.Save($dstFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Done: $dstFile"
}

# 2. Cắt Tháp (Towers)
$towerPack = Join-Path $srcDir "defense_towers_pack_1791697627490.jpg"
Process-CropWhite $towerPack 30 30 520 490 (Join-Path $outSprDir "tower_plasma_cannon.png")
Process-CropWhite $towerPack 60 510 500 480 (Join-Path $outSprDir "tower_gatling_gun.png")
Process-CropWhite $towerPack 610 290 360 670 (Join-Path $outSprDir "tower_tesla_coil.png")

# 3. Cắt Quái Vật (Enemies)
$enemyPack = Join-Path $srcDir "enemies_pack_sprite_1791697646427.jpg"
Process-CropWhite $enemyPack 60 40 450 480 (Join-Path $outSprDir "enemy_steam_train.png")
Process-CropWhite $enemyPack 530 65 440 420 (Join-Path $outSprDir "enemy_winged_bot.png")
Process-CropWhite $enemyPack 470 450 510 530 (Join-Path $outSprDir "enemy_mech_walker.png")

# 4. Cắt VFX Tia Đạn & Vụ Nổ (Key Black)
$vfxPack = Join-Path $srcDir "vfx_spiral_beam_1791697665584.jpg"
Process-CropBlack $vfxPack 25 60 160 120 (Join-Path $outSprDir "projectile_energy_spiral.png")
Process-CropBlack $vfxPack 335 400 170 170 (Join-Path $outSprDir "explosion_fire_burst.png")

Write-Output "ALL SPRITES EXTRACTED SUCCESSFULLY!"
