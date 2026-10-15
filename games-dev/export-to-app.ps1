# ==============================================================================
# Script tự động: Xuất bản Game Godot Web và tích hợp vào App Digital Campus
# ==============================================================================

$ErrorActionPreference = 'Stop'

$ProjectRoot = Resolve-Path "$PSScriptRoot\godot-project"
$ExportTargetDir = Resolve-Path "$PSScriptRoot\..\public\games\godot" -ErrorAction SilentlyContinue

if (-not $ExportTargetDir) {
    New-Item -ItemType Directory -Force -Path "$PSScriptRoot\..\public\games\godot" | Out-Null
    $ExportTargetDir = Resolve-Path "$PSScriptRoot\..\public\games\godot"
}

$ExportHtml = Join-Path $ExportTargetDir 'index.html'

Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '🚀 Đang chuẩn bị xuất bản Godot Web vào App Mobile...' -ForegroundColor Cyan
Write-Host "📁 Thư mục dự án: $ProjectRoot" -ForegroundColor DarkGray
Write-Host "📁 Thư mục đích:  $ExportTargetDir" -ForegroundColor DarkGray
Write-Host '========================================================' -ForegroundColor Cyan

# 1. Tìm thực thi Godot
$GodotCmd = Get-Command godot* -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $GodotCmd) {
    Write-Host '❌ Không tìm thấy lệnh godot trong hệ thống!' -ForegroundColor Red
    Write-Host 'Vui lòng cài đặt hoặc thêm Godot vào biến môi trường PATH.' -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tìm thấy Godot: $($GodotCmd.Source)" -ForegroundColor Green

# 2. Kiểm tra Export Templates
$GodotVersion = (& $GodotCmd --version).Trim().Split('.')[0..2] -join '.'
$TemplateDir = "$env:APPDATA\Godot\export_templates\$GodotVersion.stable"
$TemplateZip = "$TemplateDir\web_nothreads_release.zip"

if (-not (Test-Path $TemplateZip)) {
    Write-Host ''
    Write-Host "⚠️ CHÚ Ý: Chưa tìm thấy Export Template Web cho Godot $GodotVersion!" -ForegroundColor Yellow
    Write-Host 'Đang kiểm tra thư mục templates...' -ForegroundColor Cyan
}

# 3. Tiến hành xuất bản Headless
Write-Host '📦 Đang biên dịch Game Godot sang WebAssembly (HTML5)...' -ForegroundColor Yellow

try {
    & $GodotCmd --headless --path "$ProjectRoot" --export-release 'Web' "$ExportHtml"
    Write-Host '✅ Xuất bản Godot hoàn tất!' -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi trong quá trình xuất bản Godot: $_" -ForegroundColor Red
    exit 1
}

# 4. Tích hợp Campus Game Bridge vào index.html
$BridgeSrc = "$PSScriptRoot\bridge\campus-game-bridge.js"
$BridgeDest = Join-Path $ExportTargetDir 'campus-game-bridge.js'

if (Test-Path $BridgeSrc) {
    Copy-Item -Path $BridgeSrc -Destination $BridgeDest -Force
    Write-Host '✅ Đã sao chép Campus Game Bridge vào thư mục xuất bản!' -ForegroundColor Green

    # Chèn thẻ script vào index.html nếu chưa có
    if (Test-Path $ExportHtml) {
        $HtmlContent = Get-Content $ExportHtml -Raw
        if ($HtmlContent -notmatch 'campus-game-bridge\.js') {
            $ScriptTag = '<script src="campus-game-bridge.js"></script>'
            $HtmlContent = $HtmlContent.Replace('<head>', "<head>`n  $ScriptTag")
            Set-Content -Path $ExportHtml -Value $HtmlContent -Encoding UTF8
            Write-Host '✅ Đã nhúng Bridge tự động vào index.html!' -ForegroundColor Green
        }
    }
}

Write-Host ''
Write-Host '🎉 HOÀN TẤT TÍCH HỢP GAME VÀO APP MOBILE!' -ForegroundColor Green
Write-Host '👉 Đường dẫn Web Game: /games/godot/index.html' -ForegroundColor Cyan
Write-Host '👉 App Mobile và Web đều có thể mở chơi ngay lập tức!' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
