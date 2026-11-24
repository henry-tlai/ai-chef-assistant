
import db


def test_save_and_list_favorites(temp_db):
    # Arrange
    db.save_favorite("Garlic Chicken", "1. Cook it")

    # Act
    rows = db.list_favorites()

    # Assert
    assert len(rows) == 1
    assert rows[0][1] == "Garlic Chicken"


def test_find_favorite_ignores_case(temp_db):
    # Arrange
    db.save_favorite("Garlic Herb Steak", "1. Sear it")

    # Act
    results = db.find_favorite("STEAK")
    missing_results = db.find_favorite("zzz")

    # Assert
    assert len(results) == 1
    assert missing_results == []


def test_delete_favorite(temp_db):
    # Arrange
    db.save_favorite("Test dish", "1. Do a thing")
    favorite_id = db.list_favorites()[0][0]

    # Act
    deleted = db.delete_favorite(favorite_id)
    deleted_again = db.delete_favorite(favorite_id)

    # Assert
    assert deleted is True
    assert deleted_again is False


def test_messages_come_back_in_order(temp_db):
    # Arrange
    db.save_messages("s1", ["first", "second", "third"])

    # Act
    messages = db.load_messages("s1")

    # Assert
    assert messages == ["first", "second", "third"]


def test_delete_conversation(temp_db):
    # Arrange
    db.save_messages("s1", ["first", "second", "third"])
    db.save_messages("s2", ["fourth", "fifth", "sixth"])

    # Act
    deleted_messages = db.delete_conversation("s1")
    remaining_messages = db.load_messages("s1")

    # Assert
    assert deleted_messages is True
    assert remaining_messages == []


def test_get_favorite_record(temp_db):
    # Arrange
    db.save_favorite(
        "Garlic Chicken",
        "1. Cook chicken",
        '{"title": "Garlic Chicken"}',
    )
    favorite_id = db.list_favorites()[0][0]

    # Act
    row = db.get_favorite_record(favorite_id)

    # Assert
    assert row is not None
    assert row[0] == favorite_id
    assert row[1] == "Garlic Chicken"
    assert row[2] == "1. Cook chicken"
    assert row[3] == '{"title": "Garlic Chicken"}'


def test_get_favorite_record_returns_none_when_missing(temp_db):
    # Arrange
    missing_favorite_id = 999

    # Act
    row = db.get_favorite_record(missing_favorite_id)

    # Assert
    assert row is None
