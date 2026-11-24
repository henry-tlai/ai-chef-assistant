
from scripts.check_forbidden import find_problems

# Built in pieces so that this file never contains a string that looks like a key.
FAKE_KEY = "AI" + "za" + "x" * 35


def test_blocks_the_env_file():
    # Arrange
    paths = [".env"]

    # Act
    problems = find_problems(paths)

    # Assert
    assert len(problems) == 1


def test_allows_an_env_example_file():
    # Arrange
    paths = [".env.example"]

    # Act
    problems = find_problems(paths)

    # Assert
    assert problems == []


def test_blocks_databases_and_generated_folders():
    # Arrange
    paths = [
        "chef.db",
        "frontend/node_modules/pkg/index.js",
        "__pycache__/db.cpython-313.pyc",
    ]

    # Act
    results = [find_problems([path]) for path in paths]

    # Assert
    assert all(len(problems) == 1 for problems in results)


def test_allows_a_normal_source_file(tmp_path):
    # Arrange
    file_path = tmp_path / "ok.py"
    file_path.write_text("print('hello')")

    # Act
    problems = find_problems([str(file_path)])

    # Assert
    assert problems == []


def test_flags_a_google_api_key(tmp_path):
    # Arrange
    file_path = tmp_path / "config.py"
    file_path.write_text(f"KEY = '{FAKE_KEY}'")

    # Act
    problems = find_problems([str(file_path)])

    # Assert
    assert len(problems) == 1
    assert "API key" in problems[0]
