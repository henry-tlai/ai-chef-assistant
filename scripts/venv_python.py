import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
candidates = [
    root / "venv" / "Scripts" / "python.exe",   # Windows
    root / "venv" / "bin" / "python",           # Mac and Linux
]

for python in candidates:
    if python.exists():
        sys.exit(subprocess.call([str(python), *sys.argv[1:]]))

print("No virtual environment found in ./venv. Create one and install requirements-dev.txt.")
sys.exit(1)