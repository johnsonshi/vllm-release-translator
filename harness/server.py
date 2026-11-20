"""
Local HTTP Server and Static Bundle Builder for the vLLM & Kubernetes
Release Translation Portal + Human-in-the-Loop Approval Queue.
"""

from __future__ import annotations

import datetime as dt
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parent.parent
RESULTS_DIR = REPO_ROOT / "results"
SITE_DIR = REPO_ROOT / "site"
REVIEW_QUEUE_FILE = REPO_ROOT / "review_queue" / "state.json"


def build_site_bundle() -> dict[str, Any]:
    """
    Aggregates all generated vLLM and Kubernetes briefs, the A/B evaluation
    summary, and the current review queue state into `site/data.json` (and
    `site/data.js` so `site/index.html` works both over HTTP and `file://`).
    """
    SITE_DIR.mkdir(parents=True, exist_ok=True)

    vllm_dir = RESULTS_DIR / "generated" / "vllm"
    k8s_dir = RESULTS_DIR / "generated" / "kubernetes"
    ab_file = RESULTS_DIR / "ab_evals" / "summary.json"

    vllm_items = [json.loads(p.read_text()) for p in sorted(vllm_dir.glob("*.json"), reverse=True)]
    k8s_items = [json.loads(p.read_text()) for p in sorted(k8s_dir.glob("*.json"), reverse=True)]
    ab_summary = json.loads(ab_file.read_text()) if ab_file.exists() else {}
    review_state = json.loads(REVIEW_QUEUE_FILE.read_text()) if REVIEW_QUEUE_FILE.exists() else {"items": [], "counts": {}}

    # Sort so weekly edition is at the top, followed by newest version first
    def _sort_key(x: dict[str, Any]) -> tuple[int, str]:
        return (1 if x.get("is_weekly") else 0, x.get("version", ""))

    vllm_items.sort(key=_sort_key, reverse=True)
    k8s_items.sort(key=_sort_key, reverse=True)

    bundle = {
        "built_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "vllm_guides": vllm_items,
        "kubernetes_guides": k8s_items,
        "ab_eval_summary": ab_summary,
        "review_queue": review_state,
    }
    (SITE_DIR / "data.json").write_text(json.dumps(bundle, indent=2))
    (SITE_DIR / "data.js").write_text("window.__RELEASE_TRANSLATOR_DATA__ = " + json.dumps(bundle) + ";\n")
    return bundle


def record_review_decision(item_id: str, status: str, note: str = "") -> dict[str, Any]:
    """
    Updates the approval status (`approved`, `disapproved`, `pending_review`)
    for a release or weekly brief in `review_queue/state.json` and rebuilds the site bundle.
    """
    if status not in ("approved", "disapproved", "pending_review"):
        raise ValueError(f"Invalid review status: {status}")

    if not REVIEW_QUEUE_FILE.exists():
        raise FileNotFoundError(f"Review queue file not found: {REVIEW_QUEUE_FILE}")

    state = json.loads(REVIEW_QUEUE_FILE.read_text())
    now_iso = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    matched = None
    for item in state.get("items", []):
        if item["id"] == item_id or item["version"] == item_id:
            item["status"] = status
            item["reviewer_note"] = note
            item["updated_at"] = now_iso
            matched = item
            break

    if matched is None:
        raise KeyError(f"Item '{item_id}' not found in review queue")

    items = state.get("items", [])
    state["counts"] = {
        "total": len(items),
        "pending_review": sum(1 for x in items if x["status"] == "pending_review"),
        "approved": sum(1 for x in items if x["status"] == "approved"),
        "disapproved": sum(1 for x in items if x["status"] == "disapproved"),
    }
    REVIEW_QUEUE_FILE.write_text(json.dumps(state, indent=2))
    build_site_bundle()
    return matched


class PortalRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def _send_json(self, payload: Any, code: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/data":
            bundle = build_site_bundle()
            self._send_json(bundle)
            return
        if path == "/api/health":
            self._send_json({"status": "ok"})
            return

        if path in ("/", "/index.html"):
            target = SITE_DIR / "index.html"
            ctype = "text/html; charset=utf-8"
        elif path == "/data.js":
            target = SITE_DIR / "data.js"
            ctype = "application/javascript; charset=utf-8"
        elif path == "/data.json":
            target = SITE_DIR / "data.json"
            ctype = "application/json; charset=utf-8"
        else:
            self._send_json({"error": "Not found"}, code=404)
            return

        if not target.exists():
            build_site_bundle()
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/review":
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            try:
                req = json.loads(raw_body)
                updated = record_review_decision(
                    item_id=req["id"],
                    status=req["status"],
                    note=req.get("note", ""),
                )
                state = json.loads(REVIEW_QUEUE_FILE.read_text())
                self._send_json({"ok": True, "item": updated, "review_queue": state})
            except Exception as exc:
                self._send_json({"ok": False, "error": str(exc)}, code=400)
            return
        self._send_json({"error": "Unsupported endpoint"}, code=404)


def run_server(port: int = 8765) -> None:
    build_site_bundle()
    server = HTTPServer(("127.0.0.1", port), PortalRequestHandler)
    print(f"Release Translator & Review Portal listening on http://127.0.0.1:{port}")
    server.serve_forever()
