# Kapisko local instance server (stdlib only, no dependencies).
#
# Serves the static web app AND a tiny JSON state mirror the app uses to know
# when it has been reset. Learner data still lives in the browser's
# localStorage (ADR-0002, ADR-0007): the mirror file is only a "has this
# instance been used?" flag kept OUTSIDE the repository (in ~/.kapisko), so a
# ./reset from the terminal can reliably force a fresh boot.
#
# Usage:  python3 apps/web/server.py [port]     (default port 8000)

import hashlib
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(
    os.path.expanduser("~"),
    ".kapisko",
    "state-"
    + hashlib.sha256(os.path.realpath(ROOT).encode()).hexdigest()[:16]
    + ".json",
)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # --- helpers ---------------------------------------------------------

    def end_headers(self):
        # No long-lived caching for a local instance server: never let a
        # browser serve a stale asset (e.g. a swapped-out audio clip) from its
        # HTTP cache. Last-Modified + If-Modified-Since still allow 304s.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > 50 * 1024 * 1024:
            raise ValueError("body too large")
        return self.rfile.read(length)

    # --- /api/state ------------------------------------------------------

    def _state(self):
        if not os.path.exists(STATE_FILE):
            self._json({"exists": False})
            return
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._json({"exists": True, "data": data})
        except Exception:
            self._json({"exists": False})

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._state()
            return
        super().do_GET()

    def do_PUT(self):
        if self.path.startswith("/api/state"):
            try:
                raw = self._read_body()
                json.loads(raw)  # validate before persisting
                os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
                tmp = STATE_FILE + ".tmp"
                with open(tmp, "wb") as f:
                    f.write(raw)
                os.replace(tmp, STATE_FILE)
                self._json({"ok": True})
            except Exception:
                self._json({"ok": False, "error": "bad request"}, 400)
            return
        self.send_error(405)

    def do_DELETE(self):
        if self.path.startswith("/api/state"):
            try:
                if os.path.exists(STATE_FILE):
                    os.remove(STATE_FILE)
                self._json({"ok": True})
            except Exception:
                self._json({"ok": False}, 500)
            return
        self.send_error(405)

    # Serve one file at a time (matches python3 -m http.server behaviour).
    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    print(
        f"Kapisko instance server: http://localhost:{port}/  (state: {STATE_FILE})",
        flush=True,
    )
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
