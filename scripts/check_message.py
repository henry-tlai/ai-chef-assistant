import re
import sys

ALLOWED_VERBS = ("Added", "Changed", "Fixed", "Removed")

# Messages Git writes itself, which should not be rejected.
AUTOMATIC = ("Merge ", "Revert ", "fixup! ", "squash! ")


def check_message(message):
    """Return None if the message is fine, or a string explaining the problem."""
    lines = [line for line in message.splitlines() if not line.startswith("#")]
    first = lines[0].strip() if lines else ""

    if first.startswith(AUTOMATIC):
        return None
    if re.match(rf"^({'|'.join(ALLOWED_VERBS)}) \S", first):     
        return None
    return "Commit message must start with Added, Changed, Fixed, or Removed, followed by a description."


if __name__ == "__main__":
    with open(sys.argv[1], encoding="utf-8") as f:
        problem = check_message(f.read())
    if problem:
        print(problem)
        sys.exit(1)                                         