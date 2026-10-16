"""Run with: python3 account4/tests/test_migrations.py
Uses in-memory SQLite; never touches Cloudflare or production data.
"""
from pathlib import Path
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1] / "migrations"
HASH = "a" * 64

class ReleaseMigrationTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        for path in sorted(ROOT.glob("*.sql")):
            self.db.executescript(path.read_text())
        self.db.execute("INSERT INTO control_clients(id,display_name,slug,created_by) VALUES ('c','Client','client','owner')")
        self.db.execute("INSERT INTO control_client_sites(id,client_id,name,hostname) VALUES ('s','c','Site','site.example')")
        self.db.execute("INSERT INTO control_client_releases(id,site_id,artifact_sha256,status,submitted_by) VALUES ('r','s',?,'draft','owner')",(HASH,))

    def change(self, status, **fields):
        columns = ["status=?"] + [f"{name}=?" for name in fields]
        values = [status, *fields.values(), "r"]
        self.db.execute(f"UPDATE control_client_releases SET {','.join(columns)} WHERE id=?", values)

    def test_direct_approval_is_blocked(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.change("approved", approved_by="owner", approved_at="2026-10-16")

    def test_approval_generates_exactly_one_audit(self):
        self.change("building")
        self.change("preview")
        self.change("approved", approved_by="owner", approved_at="2026-10-16")
        rows = self.db.execute("SELECT actor_user_id,action,detail_json FROM control_client_audit").fetchall()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][0:2], ("owner", "release.approved"))
        self.assertIn(HASH, rows[0][2])

    def test_approved_artifact_is_immutable(self):
        self.change("building")
        self.change("preview")
        self.change("approved", approved_by="owner", approved_at="2026-10-16")
        with self.assertRaises(sqlite3.IntegrityError):
            self.change("deploying", artifact_sha256="b"*64)

    def test_approval_requires_owner_identity(self):
        self.change("building")
        self.change("preview")
        with self.assertRaises(sqlite3.IntegrityError):
            self.change("approved", approved_by=None, approved_at="2026-10-16")

    def test_cannot_skip_build_or_preview(self):
        for state in ("preview", "deploying", "deployed"):
            with self.subTest(state=state), self.assertRaises(sqlite3.IntegrityError):
                self.change(state)

    def test_rejected_release_cannot_be_approved(self):
        self.change("building")
        self.change("preview")
        self.change("rejected")
        with self.assertRaises(sqlite3.IntegrityError):
            self.change("approved", approved_by="owner", approved_at="2026-10-16")

    def test_deployment_requires_approval(self):
        self.change("building")
        self.change("preview")
        with self.assertRaises(sqlite3.IntegrityError):
            self.change("deploying")
        self.change("approved", approved_by="owner", approved_at="2026-10-16")
        self.change("deploying")
        self.change("deployed")
        self.assertEqual(self.db.execute("SELECT status FROM control_client_releases WHERE id='r'").fetchone()[0],"deployed")

    def test_cannot_replace_approved_identity(self):
        self.change("building")
        self.change("preview")
        self.change("approved", approved_by="owner", approved_at="2026-10-16")
        with self.assertRaises(sqlite3.IntegrityError):
            self.change("deploying", approved_by="other")

    def tearDown(self):
        self.db.close()

if __name__ == "__main__":
    unittest.main()
