import json
import sqlite3
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "db" / "portal.db"
SCHEMA_PATH = BASE_DIR / "db" / "schema.sql"


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def json_response(handler: SimpleHTTPRequestHandler, payload, status=HTTPStatus.OK):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class PortalHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/actors":
            self.handle_create_actor()
            return
        if self.path == "/api/availability":
            self.handle_save_availability()
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def handle_create_actor(self):
        length = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(length) or "{}")
        name = (payload.get("name") or "").strip()
        role = (payload.get("role") or "").strip()

        if not name or not role:
            json_response(self, {"error": "name and role are required"}, HTTPStatus.BAD_REQUEST)
            return

        with sqlite3.connect(DB_PATH) as connection:
            cursor = connection.cursor()
            cursor.execute(
                "INSERT INTO actors (full_name, role_name) VALUES (?, ?)",
                (name, role),
            )
            connection.commit()
            actor_id = cursor.lastrowid

        json_response(self, {"id": actor_id, "name": name, "role": role})

    def handle_save_availability(self):
        length = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(length) or "{}")
        changes = payload.get("changes", [])

        if not isinstance(changes, list):
            json_response(self, {"error": "changes must be a list"}, HTTPStatus.BAD_REQUEST)
            return

        with sqlite3.connect(DB_PATH) as connection:
            cursor = connection.cursor()
            status_ids = {
                row[0]: row[1]
                for row in cursor.execute("SELECT code, id FROM availability_statuses")
            }
            updates = 0
            for change in changes:
                actor_id = change.get("actorId")
                date = change.get("date")
                status = change.get("status")
                status_id = status_ids.get(status)
                if not actor_id or not date or not status_id:
                    continue
                cursor.execute(
                    """
                    INSERT INTO actor_availability (actor_id, date, status_id)
                    VALUES (?, ?, ?)
                    ON CONFLICT(actor_id, date)
                    DO UPDATE SET status_id = excluded.status_id, updated_at = CURRENT_TIMESTAMP
                    """,
                    (actor_id, date, status_id),
                )
                updates += 1
            connection.commit()

        json_response(self, {"updated": updates})


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), PortalHandler)
    print("Serving on http://0.0.0.0:8000")
    server.serve_forever()
