Add-Type -AssemblyName System.Drawing

Get-ChildItem 'games-dev/godot-project/assets/sprites/*.png' | ForEach-Object {
    $bmp = New-Object System.Drawing.Bitmap($_.FullName)
    $minY = $bmp.Height; $maxY = 0; $minX = $bmp.Width; $maxX = 0
    for ($y = 0; $y -lt $bmp.Height; $y += 2) {
        for ($x = 0; $x -lt $bmp.Width; $x += 2) {
            if ($bmp.GetPixel($x, $y).A -gt 15) {
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
            }
        }
    }
    $bottomPadding = $bmp.Height - 1 - $maxY
    Write-Host "$($_.Name): Size=$($bmp.Width)x$($bmp.Height), VisibleY=$minY..$maxY, BottomPadding=$bottomPadding"
    $bmp.Dispose()
}
