# Script dọn dẹp các tiến trình zombie (node, workerd) chạy ngầm gây nghẽn CPU trên Windows
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'SilentlyContinue'
$agyPids = (Get-Process -Name "Antigravity IDE", "code", "devenv" -ErrorAction SilentlyContinue).Id

$runningProcesses = Get-Process -ErrorAction SilentlyContinue
$runningPids = $runningProcesses.Id

$zombies = Get-CimInstance Win32_Process -Filter "Name = 'node.exe' or Name = 'workerd.exe'" | Where-Object {
    $cmd = $_.CommandLine
    $procPid = $_.ProcessId
    $parentPid = $_.ParentProcessId
    $parentAlive = $runningPids -contains $parentPid

    # Tuyệt đối không tắt Vite dev server đang chạy để phục vụ test web localhost:5173
    if ($cmd -like "*vite*" -or $cmd -like "*npm run dev*") {
        return $false
    }

    # Tuyệt đối không tắt workerd nếu tiến trình cha (Vite dev server) vẫn đang hoạt động
    if ($_.Name -eq "workerd.exe" -and $parentAlive) {
        return $false
    }

    $procPid -ne $PID -and (
        $cmd -like "*mcp-server*" -or
        $cmd -like "*chrome-devtools-mcp*" -or
        $cmd -like "*context7-mcp*" -or
        $cmd -like "*mcp-git*" -or
        $cmd -like "*server-sequential-thinking*" -or
        $cmd -like "*server-memory*" -or
        $cmd -like "*server-filesystem*" -or
        $cmd -like "*ms-playwright-go*" -or
        ($_.Name -eq "workerd.exe" -and -not $parentAlive) -or
        ($cmd -like "*vitest*" -and -not $parentAlive)
    )
}

$count = 0
foreach ($z in $zombies) {
    try {
        Stop-Process -Id $z.ProcessId -Force -ErrorAction SilentlyContinue
        $count++
        Write-Output "[OK] Da tat zombie PID $($z.ProcessId): $($z.ProcessName)"
    } catch {}
}

$cpuObj = Get-CimInstance Win32_Processor
$load = if ($cpuObj -is [array]) { [int]($cpuObj | Measure-Object -Property LoadPercentage -Average).Average } else { [int]$cpuObj.LoadPercentage }
Write-Output "[HOAN TAT] Da don dep $count tien trinh zombie. Muc tai CPU hien tai: $load%"
