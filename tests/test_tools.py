import tools
import json
import db


def test_get_favorite_no_match(temp_db):
    result = tools.get_favorite("pizza")
    assert "No favorite found" in result

def test_get_favorite_multiple_matches(temp_db):
    tools.save_favorite("Chicken Soup", ["broth"], ["Boil"])
    tools.save_favorite("Chicken Curry", ["curry paste"], ["Simmer"])
    result = tools.get_favorite("chicken")
    assert "Several favorites match" in result


def test_get_favorite_single_match(temp_db):
    tools.save_favorite("Garlic Herb Steak", ["steak"], ["Sear it"])
    result = tools.get_favorite("steak")
    assert "1. Sear it" in result 

def test_save_favorite_stores_the_steps_separately(temp_db):
    tools.save_favorite("Toast", ["2 slices bread"], ["Toast it", "Butter it"])
    record = db.get_favorite_record(db.list_favorites()[0][0])
    data = json.loads(record[3])
    assert [s["text"] for s in data["steps"]] == ["Toast it", "Butter it"]


def test_save_favorite_rejects_a_recipe_with_no_steps(temp_db):
    result = tools.save_favorite("Empty", ["air"], [])
    assert "at least one step" in result
    assert db.list_favorites() == []                        