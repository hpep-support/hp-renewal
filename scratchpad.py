import sqlite3
import json

conn = sqlite3.connect('backend/sql_app.db')
cursor = conn.cursor()
cursor.execute("SELECT id, extracted_entities FROM contexts WHERE community_id=3 ORDER BY id DESC LIMIT 1;")
row = cursor.fetchone()
if row:
    print(f"ID: {row[0]}")
    print(f"Len: {len(row[1]) if row[1] else 0}")
