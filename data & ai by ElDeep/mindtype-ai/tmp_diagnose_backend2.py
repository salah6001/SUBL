import pickle
import sqlite3
import numpy as np
import scipy
import sklearn
from backend.main import MODEL_PATH, DB_PATH

print('numpy', np.__version__)
print('scipy', scipy.__version__)
print('sklearn', sklearn.__version__)
print('MODEL_PATH', MODEL_PATH, 'exists', MODEL_PATH.exists())

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
