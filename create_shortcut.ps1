$desktop = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop", "Chrome_Pinterest.lnk")
$workspaceShortcut = "C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio\Chrome_Pinterest.lnk"

$WshShell = New-Object -ComObject WScript.Shell

# Desktop shortcut
$Shortcut = $WshShell.CreateShortcut($desktop)
$Shortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut.Arguments = '--remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio\chrome_user_data" https://www.pinterest.com'
$Shortcut.WorkingDirectory = "C:\Program Files\Google\Chrome\Application"
$Shortcut.Save()

# Workspace shortcut
$Shortcut2 = $WshShell.CreateShortcut($workspaceShortcut)
$Shortcut2.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut2.Arguments = '--remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio\chrome_user_data" https://www.pinterest.com'
$Shortcut2.WorkingDirectory = "C:\Program Files\Google\Chrome\Application"
$Shortcut2.Save()

Write-Host "Created shortcuts successfully at:"
Write-Host $desktop
Write-Host $workspaceShortcut
