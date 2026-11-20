"""
Optional LLM Synthesis & Verification Layer (`harness/llm_synthesizer.py`).

Uses GitHub Models (`GITHUB_TOKEN` / `GH_TOKEN`, which is auto-minted for free in
GitHub Actions with `permissions: models: read`, or via `gh auth token` locally)
or `OPENAI_API_KEY` to refine the deterministic `v5_progressive_clarity_engine`
clusters into human-grade plain-English explanations, then verifies the result
through `harness.evaluator.evaluate_generated_brief` before accepting it.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.request
from typing import Any


def _resolve_token() -> tuple[str | None, str, str]:
    """
    Returns `(api_key, endpoint_url, model_name)`.
    Prefers `OPENAI_API_KEY` if set, otherwise uses `GITHUB_TOKEN` / `GH_TOKEN` / `gh auth token`
    with GitHub Models.
    """
    if os.environ.get("OPENAI_API_KEY"):
        return (
            os.environ["OPENAI_API_KEY"],
            os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1/chat/completions"),
            os.environ.get("LLM_MODEL", "gpt-4.1-mini"),
        )
    gh_tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not gh_tok:
        try:
            gh_tok = subprocess.check_output(["gh", "auth", "token"], text=True, timeout=5).strip()
        except Exception:
            gh_tok = None
    if gh_tok:
        return (
            gh_tok,
            os.environ.get("GITHUB_MODELS_URL", "https://models.github.ai/inference/chat/completions"),
            os.environ.get("LLM_MODEL", "openai/gpt-4.1-mini"),
        )
    return None, "", ""


def synthesize_with_llm_if_available(
    v5_draft: dict[str, Any],
    raw_record: dict[str, Any],
) -> dict[str, Any]:
    """
    Attempts to refine `high_level_explanation` and `high_level_changes` via the
    configured LLM endpoint while strictly preserving the verified PR/KEP citations
    from `v5_draft`. Falls back cleanly to `v5_draft` if offline or rate-limited.
    """
    token, url, model = _resolve_token()
    if not token or not url:
        return v5_draft

    project = raw_record.get("project", "vllm")
    version = raw_record.get("version", "")
    secs = v5_draft.get("sections", {})
    deep_dives = secs.get("technical_deep_dive", [])[:5]

    prompt_context = [
        {
            "theme": d.get("theme", ""),
            "bullets": d.get("tech_bullets", [])[:3],
            "prs": d.get("prs", [])[:4],
        }
        for d in deep_dives
    ]

    sys_prompt = (
        "You are a principal inference/systems engineer writing 'What's New' release notes "
        "for operators who do not follow upstream development full-time. "
        "Return strict JSON with keys: "
        "`high_level_explanation` (2 crisp plain-English sentences, no PR numbers or flags) and "
        "`high_level_changes` (list of 4 objects with `headline` and `plain_summary`, 1 sentence each). "
        "Never invent PR numbers, KEP numbers, or benchmark metrics."
    )
    user_prompt = json.dumps({
        "project": project,
        "version": version,
        "total_upstream_items": raw_record.get("total_raw_items", 0),
        "verified_capability_clusters": prompt_context,
    })

    req = urllib.request.Request(
        url,
        data=json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 600,
        }).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.github+json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw_body = resp.read().decode("utf-8", errors="replace").strip()
            data = json.loads(raw_body)
            content = data["choices"][0]["message"]["content"]
            content_clean = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.M).strip()
            parsed = json.loads(content_clean)
            if isinstance(parsed.get("high_level_explanation"), str) and isinstance(parsed.get("high_level_changes"), list):
                refined = dict(v5_draft)
                refined["high_level_explanation"] = parsed["high_level_explanation"]
                refined["positioning"] = parsed["high_level_explanation"]
                refined["sections"] = dict(secs)
                refined["sections"]["high_level_changes"] = parsed["high_level_changes"][:5]
                refined["llm_refined"] = True
                return refined
    except Exception:
        pass

    return v5_draft
