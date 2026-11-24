
from scripts.check_message import check_message


def test_accepts_each_allowed_verb():
    # Arrange
    allowed_verbs = ["Added", "Changed", "Fixed", "Removed"]

    # Act
    results = [
        check_message(f"{verb} a thing in file.py")
        for verb in allowed_verbs
    ]

    # Assert
    assert results == [None, None, None, None]


def test_rejects_a_lowercase_verb():
    # Arrange
    message = "added a thing in file.py"

    # Act
    result = check_message(message)

    # Assert
    assert result is not None


def test_rejects_other_verbs():
    # Arrange
    message = "Updated the chat page"

    # Act
    result = check_message(message)

    # Assert
    assert result is not None


def test_rejects_a_verb_with_no_description():
    # Arrange
    message = "Added"

    # Act
    result = check_message(message)

    # Assert
    assert result is not None


def test_allows_messages_git_writes_itself():
    # Arrange
    messages = [
        "Merge branch 'main'",
        "fixup! Added a thing",
    ]

    # Act
    results = [check_message(message) for message in messages]

    # Assert
    assert results == [None, None]


def test_ignores_comment_lines():
    # Arrange
    message = "# a comment\nAdded a thing in file.py"

    # Act
    result = check_message(message)

    # Assert
    assert result is None
