"""Kiểm chứng migration 79 trên bản sao SQLite, tuyệt đối không ghi D1 remote.
Chạy: python cong-cu/qa-reset-tai-khoan.py <D1-export.sql>
"""
from pathlib import Path
import json
import sqlite3
import sys

root = Path(__file__).resolve().parent.parent
db = sqlite3.connect(':memory:')
db.executescript(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
db.execute('PRAGMA foreign_keys = ON')
sql = (root / 'co-so-du-lieu/79-reset-du-lieu-giu-tai-khoan.sql').read_text(encoding='utf-8')
invalid_db = sqlite3.connect(':memory:')
invalid_db.executescript(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
invalid_db.execute("DELETE FROM tai_khoan_campus WHERE ten_dang_nhap='ledinhphat'")
invalid_db.commit()
invalid_before = list(invalid_db.iterdump())
try:
    invalid_db.executescript(sql)
    raise AssertionError('Reset must stop if owner account is missing')
except sqlite3.OperationalError:
    assert list(invalid_db.iterdump()) == invalid_before, 'Guard failure changed data'
invalid_db.close()
keep = {'tai_khoan_campus', 'lop', 'ma_dang_nhap', 'giao_vien_lop', '_migrations'}
tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
if not db.execute("SELECT 1 FROM tai_khoan_campus WHERE ten_dang_nhap='ledinhphat'").fetchone():
    db.execute("INSERT INTO tai_khoan_campus (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro) VALUES ('ledinhphat', 'QA Owner', 'local-only', 'local-only', 'teacher')")

def accounts():
    cols = [r[1] for r in db.execute('PRAGMA table_info(tai_khoan_campus)')]
    return {r[0]: dict(zip(cols, r)) for r in db.execute('SELECT * FROM tai_khoan_campus ORDER BY id')}
before = accounts()
auth_before = {t: db.execute(f'SELECT * FROM "{t}" ORDER BY 1').fetchall() for t in ['giao_vien_lop', '_migrations']}
teachers_before = db.execute("SELECT * FROM ma_dang_nhap WHERE vai_tro='teacher' ORDER BY lop_id").fetchall()
counts = {t: db.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0] for t in tables if t not in keep}
db.commit()
db.executescript(sql)
after = accounts()
assert before.keys() == after.keys(), 'Account ids changed'
for key, old in before.items():
    expected = dict(old, hoc_sinh_id=None)
    if old['ten_dang_nhap'] == 'ledinhphat':
        expected.update(la_admin_truong=1, vai_tro='teacher', teacher_pending=0)
    assert after[key] == expected, f'Unexpected account change: {key}'
for t in counts:
    assert db.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0] == 0, f'Not empty: {t}'
for t, rows in auth_before.items():
    assert db.execute(f'SELECT * FROM "{t}" ORDER BY 1').fetchall() == rows, f'Auth metadata changed: {t}'
assert db.execute("SELECT * FROM ma_dang_nhap WHERE vai_tro='teacher' ORDER BY lop_id").fetchall() == teachers_before
assert db.execute('PRAGMA foreign_key_check').fetchall() == [], 'Dangling foreign key after reset'
db.executescript(sql)
assert accounts() == after, 'Second run must be idempotent'
print(json.dumps({'ok': True, 'tables_cleared': len(counts), 'previously_nonempty': sum(n > 0 for n in counts.values()),
    'rows_cleared': sum(counts.values()), 'accounts_preserved': len(before), 'passwords_preserved': True,
    'teacher_auth_preserved': True, 'foreign_keys_valid': True, 'idempotent': True, 'missing_owner_guard': True}))
