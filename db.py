import sqlite3
from contextlib import contextmanager

DB_PATH = "chef.db"

@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)

    try:
        with conn:
            yield conn
    finally:
        conn.close()


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                recipe TEXT NOT NULL,
                recipe_json TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                content TEXT NOT NULL
            )
        """)

def save_favorite(title, recipe, recipe_json=None):
    with get_connection() as conn:
        # Prevent two save requests from inserting the same title at once.
        conn.execute("BEGIN IMMEDIATE")

        existing = conn.execute(
            """
            SELECT 1
            FROM favorites
            WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))
            LIMIT 1
            """,
            (title,),
        ).fetchone()

        if existing:
            return False

        conn.execute(
            """
            INSERT INTO favorites (title, recipe, recipe_json)
            VALUES (?, ?, ?)
            """,
            (title, recipe, recipe_json),
        )

    return True

def list_favorites():
    with get_connection() as conn:
        rows = conn.execute("SELECT id, title FROM favorites").fetchall()
    return rows

def get_favorite(favorite_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT title, recipe FROM favorites WHERE id = ?",   
            (favorite_id,),                                              
        ).fetchone()
    return row

def get_favorite_record(favorite_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, title, recipe, recipe_json FROM favorites WHERE id = ?",    
            (favorite_id,),
        ).fetchone()
    return row

def delete_favorite(favorite_id):
    with get_connection() as conn:
        cur = conn.execute(
            "DELETE FROM favorites WHERE id = ?",
            (favorite_id,),
        )
    return cur.rowcount > 0

def find_favorite(query):
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT title, recipe, recipe_json
            FROM favorites
            WHERE LOWER(title) LIKE ?
            """,
            (f"%{query}%".lower(),),
        ).fetchall()
    return rows

def save_messages(session_id, json_messages):
    with get_connection() as conn:
        conn.executemany(
            "INSERT INTO messages (session_id, content) VALUES (?, ?)",
            [(session_id, m) for m in json_messages],
        )

def load_messages(session_id):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT content FROM messages WHERE session_id = ? ORDER BY id",   
            (session_id,),
        ).fetchall()
    return [row[0] for row in rows]

def list_conversations():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT m.session_id, m.content
            FROM messages m
            JOIN (
                SELECT session_id, MIN(id) AS first_id, MAX(id) AS last_id
                FROM messages
                GROUP BY session_id                
            ) g ON m.id = g.first_id
            ORDER BY g.last_id DESC           
        """).fetchall()
    return rows

def delete_conversation(session_id):
    with get_connection() as conn:
        cur = conn.execute(
            "DELETE FROM messages WHERE session_id = ?", 
            (session_id,),
        )
    return cur.rowcount > 0

if __name__ == "__main__":
    init_db()