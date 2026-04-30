import pickle
import sqlite3
from backend.main import MODEL_PATH, DB_PATH

print('MODEL_PATH', MODEL_PATH, 'exists', MODEL_PATH.exists())
print('DB_PATH', DB_PATH, 'parent exists', DB_PATH.parent.exists())

with open(MODEL_PATH, 'rb') as f:
    m = pickle.load(f)
print('pickle loaded', type(m))
print('keys', list(m.keys()) if hasattr(m, 'keys') else 'no keys')

conn = sqlite3.connect(str(DB_PATH))
print('sqlite version', sqlite3.sqlite_version)
cur = conn.cursor()
cur.execute('select sqlite_version()')
print('sqlite ok', cur.fetchone())
conn.close()
