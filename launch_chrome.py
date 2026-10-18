import ctypes
import time
import os

ShellExecuteW = ctypes.windll.shell32.ShellExecuteW
res = ShellExecuteW(
    None,
    'open',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'--remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio\chrome_user_data" --start-maximized https://www.pinterest.com',
    None,
    1  # SW_SHOWNORMAL
)
print('ShellExecuteW code (success if > 32):', res)
