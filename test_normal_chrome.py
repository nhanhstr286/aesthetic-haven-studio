import subprocess

# Run Chrome directly without any special flags
cmd = [r'C:\Program Files\Google\Chrome\Application\chrome.exe', 'https://www.google.com']
p = subprocess.Popen(cmd)
print('Started normal Chrome, PID:', p.pid)
