#!/usr/bin/env python3
"""
Unified CLI for the vLLM & Kubernetes Release Translation System:
  - `eval`: Run the 5-stage A/B evaluation & hill-climbing pipeline
  - `build-site`: Rebuild `site/data.json` and `site/data.js`
  - `serve`: Start the interactive web portal and approval server
  - `review`: List, approve, or disapprove generated release/weekly guides
  - `watch`: Timer/daemon loop that checks upstream GitHub releases/PRs and queues drafts
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import time
from pathlib import Path

from harness.pipeline import REVIEW_QUEUE_FILE, render_ab_markdown_report, run_full_pipeline
from harness.server import build_site_bundle, record_review_decision, run_server

REPO_ROOT = Path(__file__).resolve().parent.parent


def cmd_eval(_args: argparse.Namespace) -> None:
    summary = run_full_pipeline()
    build_site_bundle()
    print(render_ab_markdown_report(summary))


def cmd_build_site(_args: argparse.Namespace) -> None:
    bundle = build_site_bundle()
    print(
        f"Built site bundle at {bundle['built_at']}: "
        f"{len(bundle['vllm_guides'])} vLLM guides, "
        f"{len(bundle['kubernetes_guides'])} Kubernetes guides."
    )


def cmd_serve(args: argparse.Namespace) -> None:
    run_server(port=args.port)


def cmd_review(args: argparse.Namespace) -> None:
    if args.review_action == "list":
        if not REVIEW_QUEUE_FILE.exists():
            run_full_pipeline()
        state = json.loads(REVIEW_QUEUE_FILE.read_text())
        items = state.get("items", [])
        if args.status:
            items = [x for x in items if x["status"] == args.status]
        print(f"Review Queue ({len(items)} items shown | counts: {state.get('counts', {})}):")
        print(f"{'ID':<38} {'STATUS':<16} {'SCORE':<8} {'NOTE'}")
        print("-" * 88)
        for it in items:
            score_pct = f"{it.get('composite_score', 0)*100:.1f}%"
            print(f"{it['id']:<38} {it['status']:<16} {score_pct:<8} {it.get('reviewer_note', '')}")
    elif args.review_action in ("approve", "disapprove", "reset"):
        target_status = {
            "approve": "approved",
            "disapprove": "disapproved",
            "reset": "pending_review",
        }[args.review_action]
        updated = record_review_decision(args.id, target_status, note=args.note or "")
        print(f"Updated {updated['id']} -> status={updated['status']} (note='{updated.get('reviewer_note', '')}')")


def check_upstream_and_sync() -> dict[str, str]:
    """
    Polls upstream `vllm-project/vllm` for the latest release tag and latest merged PR,
    compares with local corpus, refreshes if newer, runs the v4 generator + eval gate,
    and updates the review queue.
    """
    now_iso = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rel_cmd = ["gh", "release", "list", "--repo", "vllm-project/vllm", "--limit", "1", "--json", "tagName,publishedAt"]
    rel_res = subprocess.run(rel_cmd, capture_output=True, text=True, check=False)
    latest_tag = "unknown"
    if rel_res.returncode == 0 and rel_res.stdout.strip():
        rows = json.loads(rel_res.stdout)
        if rows:
            latest_tag = rows[0].get("tagName", "unknown")

    local_vllm_raw = REPO_ROOT / "corpus" / "vllm" / "raw" / f"{latest_tag}.json"
    if latest_tag != "unknown" and not local_vllm_raw.exists():
        print(f"[{now_iso}] New upstream vLLM release detected ({latest_tag})! Running fetch_corpora.py...")
        subprocess.run(["python3", str(REPO_ROOT / "scripts" / "fetch_corpora.py")], check=True)

    summary = run_full_pipeline()
    build_site_bundle()
    q_counts = summary.get("review_queue_summary", {})
    print(
        f"[{now_iso}] Watcher sync complete | Latest vLLM release={latest_tag} | "
        f"Queue: {q_counts.get('pending_review', 0)} pending_review, "
        f"{q_counts.get('approved', 0)} approved, {q_counts.get('disapproved', 0)} disapproved."
    )
    return {"checked_at": now_iso, "latest_vllm_tag": latest_tag}


def cmd_watch(args: argparse.Namespace) -> None:
    if args.once:
        check_upstream_and_sync()
        return
    print(f"Starting periodic upstream release watcher (interval={args.interval}s)...")
    while True:
        check_upstream_and_sync()
        time.sleep(args.interval)


def main() -> None:
    parser = argparse.ArgumentParser(description="vLLM & Kubernetes Release Translator CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("eval", help="Run A/B benchmark & hill-climb across Kubernetes and vLLM")
    sub.add_parser("build-site", help="Build static site data bundle")

    p_serve = sub.add_parser("serve", help="Run local interactive review & release portal")
    p_serve.add_argument("--port", type=int, default=8765)

    p_rev = sub.add_parser("review", help="Inspect, approve, or disapprove generated releases")
    rev_sub = p_rev.add_subparsers(dest="review_action", required=True)

    p_list = rev_sub.add_parser("list", help="List items in the review queue")
    p_list.add_argument("--status", choices=["pending_review", "approved", "disapproved"], default=None)

    for act in ("approve", "disapprove", "reset"):
        p_act = rev_sub.add_parser(act, help=f"Mark an item as {act}")
        p_act.add_argument("id", help="Item ID (e.g., vllm:v0.34.0 or vllm:last-week-in-vllm)")
        p_act.add_argument("--note", default="", help="Optional reviewer note")

    p_watch = sub.add_parser("watch", help="Poll upstream releases/weekly PRs on a timer")
    p_watch.add_argument("--interval", type=int, default=3600, help="Polling interval in seconds")
    p_watch.add_argument("--once", action="store_true", help="Run one check cycle and exit")

    args = parser.parse_args()
    if args.command == "eval":
        cmd_eval(args)
    elif args.command == "build-site":
        cmd_build_site(args)
    elif args.command == "serve":
        cmd_serve(args)
    elif args.command == "review":
        cmd_review(args)
    elif args.command == "watch":
        cmd_watch(args)


if __name__ == "__main__":
    main()
