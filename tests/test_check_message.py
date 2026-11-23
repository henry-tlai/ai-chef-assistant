from scripts.check_message import check_message


def test_accepts_each_allowed_verb():
    for verb in ["Added", "Changed", "Fixed", "Removed"]:
        assert check_message(f"{verb} a thing in file.py") is None       


def test_rejects_a_lowercase_verb():
    assert check_message("added a thing in file.py") is not None


def test_rejects_other_verbs():
    assert check_message("Updated the chat page") is not None


def test_rejects_a_verb_with_no_description():
    assert check_message("Added") is not None


def test_allows_messages_git_writes_itself():
    assert check_message("Merge branch 'main'") is None
    assert check_message("fixup! Added a thing") is None             


def test_ignores_comment_lines():
    assert check_message("# a comment\nAdded a thing in file.py") is None