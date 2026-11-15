import re
import sys

# Paths that must never be committed.
BANNED = [
    r"(^|/)\.env$",
    r"\.db$",
    r"(^|/)node_modules/",
    r"(^|/)__pycache__/",
    r"(^|/)\.pytest_cache/",
    r"(^|/)venv/",
    r"(^|/)\.next/",
    r"(^|/)\.DS_Store/",
]

# Google API keys start with AIza followed by 35 more characters.
KEY = re.compile(r"AIza[0-9A-Za-z_\-]{35}")


def find_problems(paths):
    problems = []
    for path in paths:
        path = path.replace("\\", "/")   
        if any(re.search(pattern, path) for pattern in BANNED):
            problems.append(f"{path}: should not be committed")
            continue
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except (UnicodeDecodeError, OSError):
            continue                          
        if KEY.search(text):
            problems.append(f"{path}: looks like a Google API key")
    return problems


if __name__ == "__main__":
    found = find_problems(sys.argv[1:])
    if found:
        print("\n".join(found))
        sys.exit(1)                         