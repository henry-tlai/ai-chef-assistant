from scripts.check_forbidden import find_problems

# Built in pieces so that this file never contains a string that looks like a key.
FAKE_KEY = "AI" + "za" + "x" * 35


def test_blocks_the_env_file():
    assert len(find_problems([".env"])) == 1


def test_allows_an_env_example_file():
    assert find_problems([".env.example"]) == []


def test_blocks_databases_and_generated_folders():
    for path in ["chef.db", "frontend/node_modules/pkg/index.js", "__pycache__/db.cpython-313.pyc"]:
        assert len(find_problems([path])) == 1         


def test_allows_a_normal_source_file(tmp_path):
    f = tmp_path / "ok.py"
    f.write_text("print('hello')")
    assert find_problems([str(f)]) == []                


def test_flags_a_google_api_key(tmp_path):
    f = tmp_path / "config.py"
    f.write_text(f"KEY = '{FAKE_KEY}'")
    problems = find_problems([str(f)])
    assert len(problems) == 1
    assert "API key" in problems[0]