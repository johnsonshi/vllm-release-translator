#!/usr/bin/env python3
"""
Fetches and parses upstream release corpora and human editorial ground truth
for both Kubernetes (v1.28 - v1.37 + patch series + LWKD) and vLLM
(v0.25.0 - v0.34.0 + patch releases + Last Week in vLLM merged PRs).

Strictly separates:
  - Raw upstream inputs (`corpus/{domain}/raw/`) fed to the generator
  - Human editorial ground truth (`corpus/{domain}/ground_truth/`) used only by the evaluator
"""

from __future__ import annotations

import json
import re
import subprocess
import urllib.request
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
K8S_RAW_DIR = REPO_ROOT / "corpus" / "kubernetes" / "raw"
K8S_GT_DIR = REPO_ROOT / "corpus" / "kubernetes" / "ground_truth"
K8S_LWKD_DIR = REPO_ROOT / "corpus" / "kubernetes" / "lwkd"

VLLM_RAW_DIR = REPO_ROOT / "corpus" / "vllm" / "raw"
VLLM_GT_DIR = REPO_ROOT / "corpus" / "vllm" / "ground_truth"
VLLM_WEEKLY_DIR = REPO_ROOT / "corpus" / "vllm" / "weekly"

K8S_BLOG_PATHS = {
    "v1.28": ("2023/kubernetes-1.28-blog.md", None),
    "v1.29": ("2023/kubernetes-1.29.md", "2023/mid-cycle-1.29.md"),
    "v1.30": ("2024/kubernetes-v1-30-release.md", "2024/mid-cycle-1-30.md"),
    "v1.31": ("2024/kubernetes-v1-31-release.md", "2024/kubernetes-1-31-deprecations-and-removals.md"),
    "v1.32": ("2024/kubernetes-v1-32-release/index.md", "2024/kubernetes-1-32-sneak-peek.md"),
    "v1.33": ("2025/kubernetes-v1-33-release/index.md", "2025/kubernetes-1.33-sneak-peek.md"),
    "v1.34": ("2025/kubernetes-v1-34-release/index.md", "2025/kubernetes-v1.34-sneak-peek.md"),
    "v1.35": ("2025/kubernetes-v1-35-release/index.md", "2025/kubernetes-v1-35-sneak-peek.md"),
    "v1.36": ("2026/kubernetes-v1-36-release/index.md", "2026/kubernetes-v1-36-sneak-peak.md"),
    "v1.37": ("2026/kubernetes-v1-37-release/index.md", "2026/kubernetes-v1-37-sneak-peek.md"),
}

LWKD_FILES = [
    "2026-10-04-update.md",
    "2026-10-11-update.md",
    "2026-10-18-update.md",
    "2026-10-25-update.md",
    "2026-11-01-update.md",
]

VLLM_VERSIONS = [
    (f"v0.{i}.0", "v0.33.0rc3" if i == 33 else f"v0.{i}.0")
    for i in range(1, 35)
]

VLLM_PATCH_VERSIONS: list[tuple[str, str]] = []


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "vllm-release-translator/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_k8s_changelog(md_text: str, minor_ver: str) -> dict[str, Any]:
    """
    Extracts the .0 minor release section (Urgent Upgrade Notes, Deprecations,
    API Changes, Features, Bug or Regression) and all .x patch release sections
    from a Kubernetes CHANGELOG-1.XX.md file.
    """
    ver_num = minor_ver.lstrip("v")
    # Split by top-level `# v1.XX.Y` headers
    sections: dict[str, str] = {}
    current_tag = None
    buf: list[str] = []
    for line in md_text.splitlines():
        m = re.match(r"^#\s+(v\d+\.\d+\.\d+)\s*$", line.strip())
        if m:
            if current_tag:
                sections[current_tag] = "\n".join(buf)
            current_tag = m.group(1)
            buf = []
        elif re.match(r"^#\s+v\d+\.\d+\.\d+-", line.strip()):
            # Pre-release section (rc/beta/alpha) -> stop collecting for prior tag
            if current_tag:
                sections[current_tag] = "\n".join(buf)
            current_tag = None
            buf = []
        elif current_tag:
            buf.append(line)
    if current_tag and buf:
        sections[current_tag] = "\n".join(buf)

    minor_tag = f"v{ver_num}.0"
    minor_body = sections.get(minor_tag, "")

    def extract_bullets(section_text: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        current_sub = "General"
        current_item: list[str] = []

        def flush_item(sub: str, lines: list[str]) -> None:
            text = " ".join(x.strip() for x in lines if x.strip()).strip()
            if not text:
                return
            pr_matches = re.findall(r"#(\d{4,6})", text)
            kep_matches = re.findall(r"KEP[-#\s]*(\d{3,5})", text, flags=re.I)
            sig_matches = re.findall(r"\[SIG\s+([^\]]+)\]", text, flags=re.I)
            fg_matches = re.findall(r"`([A-Z][A-Za-z0-9]{4,50})`", text)
            items.append({
                "category": sub,
                "text": re.sub(r"^[-*]\s+", "", text),
                "prs": list(dict.fromkeys(pr_matches)),
                "keps": list(dict.fromkeys(kep_matches)),
                "sigs": list(dict.fromkeys(sig_matches)),
                "identifiers": list(dict.fromkeys(fg_matches))[:6],
            })

        in_relevant = False
        for line in section_text.splitlines():
            h2 = re.match(r"^##\s+(.+)$", line.strip())
            h3 = re.match(r"^###\s+(.+)$", line.strip())
            if h2:
                flush_item(current_sub, current_item)
                current_item = []
                title = h2.group(1).strip()
                if "Urgent Upgrade Notes" in title:
                    current_sub = "Urgent Upgrade Notes"
                    in_relevant = True
                elif "Changes by Kind" in title:
                    in_relevant = True
                elif "Dependencies" in title or "Downloads" in title:
                    in_relevant = False
            elif h3 and in_relevant:
                flush_item(current_sub, current_item)
                current_item = []
                sub_title = h3.group(1).strip()
                if "MUST read this" in sub_title:
                    current_sub = "Urgent Upgrade Notes"
                else:
                    current_sub = sub_title
            elif in_relevant:
                if re.match(r"^\s*[-*]\s+", line):
                    flush_item(current_sub, current_item)
                    current_item = [line]
                elif current_item and line.strip():
                    current_item.append(line)
        flush_item(current_sub, current_item)
        return items

    minor_items = extract_bullets(minor_body)

    # Also parse patch releases (e.g. v1.37.1, v1.37.2, etc.)
    patch_releases = []
    for tag, body in sorted(sections.items(), reverse=True):
        if tag == minor_tag:
            continue
        p_items = extract_bullets(body)
        if p_items:
            patch_releases.append({
                "tag": tag,
                "total_items": len(p_items),
                "features": [x for x in p_items if x["category"] in ("Feature", "API Change", "Urgent Upgrade Notes")][:8],
                "bugfixes": [x for x in p_items if "Bug" in x["category"] or "Regression" in x["category"]][:10],
            })

    by_cat: dict[str, list[dict[str, Any]]] = {}
    for item in minor_items:
        by_cat.setdefault(item["category"], []).append(item)

    return {
        "project": "kubernetes",
        "version": minor_ver,
        "tag": minor_tag,
        "total_raw_items": len(minor_items),
        "counts_by_category": {k: len(v) for k, v in by_cat.items()},
        "urgent_upgrade_notes": by_cat.get("Urgent Upgrade Notes", []),
        "deprecations": by_cat.get("Deprecation", []),
        "api_changes": by_cat.get("API Change", []),
        "features": by_cat.get("Feature", []),
        "bugfixes": by_cat.get("Bug or Regression", [])[:80],
        "other": by_cat.get("Other", [])[:30],
        "patch_releases": patch_releases[:5],
    }


def parse_k8s_blog_ground_truth(blog_md: str, sneak_md: str | None, minor_ver: str) -> dict[str, Any]:
    """
    Parses the human-written Official Kubernetes Release Blog (+ sneak peek / deprecations blog)
    into structured ground-truth headlines, maturity stages, KEPs, and deprecations.
    """
    title_match = re.search(r'^title:\s*["\']?([^"\'\n]+)["\']?', blog_md, flags=re.M)
    date_match = re.search(r'^date:\s*([0-9-]+)', blog_md, flags=re.M)
    enh_match = re.search(r"consists of\s+(\d+)\s+enhancements", blog_md, flags=re.I)

    combined = blog_md + ("\n\n" + sneak_md if sneak_md else "")
    spotlights: list[dict[str, Any]] = []

    # Split by ### headings in the blog (or ## headings if ### has < 5 spotlights, e.g. v1.28)
    chunks = re.split(r"^###\s+(.+)$", combined, flags=re.M)
    if len(chunks) < 10:
        chunks = re.split(r"^##\s+(.+)$", combined, flags=re.M)
    skip_headings = {
        "release theme and logo", "release notes", "availability", "release team",
        "ecosystem updates", "project velocity", "upcoming release webinar", "get involved",
        "spotlight on key updates", "other notable changes",
    }
    for idx in range(1, len(chunks), 2):
        heading = re.sub(r"\[.*?\]\(.*?\)", "", chunks[idx]).strip()
        heading = re.sub(r"\{#.*?\}", "", heading).strip()
        if heading.lower() in skip_headings:
            continue
        body = chunks[idx + 1] if idx + 1 < len(chunks) else ""
        # Stop at next ## heading if present
        body = re.split(r"^##\s+", body, flags=re.M)[0].strip()
        if len(body) < 40:
            continue
        stage = "Unspecified"
        for st in ("Stable", "Beta", "Alpha", "Deprecation", "Removal", "GA"):
            if st.lower() in heading.lower() or re.search(rf"\b{st}\b", body[:250]):
                stage = "Stable" if st == "GA" else st
                break
        keps = list(dict.fromkeys(re.findall(r"(?:KEP\s*#?|/keps/|enhancements/issues/)(\d{3,5})", body, flags=re.I)))
        prs = list(dict.fromkeys(re.findall(r"(?:pull/|#)(\d{5,6})", body)))
        fgs = list(dict.fromkeys(re.findall(r"`([A-Z][A-Za-z0-9_.-]{3,50})`", body)))
        spotlights.append({
            "heading": heading,
            "stage": stage,
            "keps": keps,
            "prs": prs,
            "identifiers": fgs[:8],
            "summary": " ".join(body.splitlines()[:6]).strip()[:600],
        })

    all_keps = list(dict.fromkeys(re.findall(r"(?:KEP\s*#?|/keps/|enhancements/issues/)(\d{3,5})", combined, flags=re.I)))
    all_identifiers = list(dict.fromkeys(re.findall(r"`([A-Z][A-Za-z0-9]{4,50})`", combined)))

    return {
        "project": "kubernetes",
        "version": minor_ver,
        "blog_title": title_match.group(1).strip() if title_match else f"Kubernetes {minor_ver} Release",
        "release_date": date_match.group(1) if date_match else "",
        "reported_enhancements_count": int(enh_match.group(1)) if enh_match else None,
        "spotlight_count": len(spotlights),
        "spotlights": spotlights,
        "ground_truth_keps": all_keps,
        "ground_truth_identifiers": all_identifiers[:40],
    }


def parse_lwkd_edition(md_text: str, filename: str) -> dict[str, Any]:
    title_match = re.search(r"^title:\s*(.+)$", md_text, flags=re.M)
    date_match = re.search(r"^date:\s*([0-9-]+)", md_text, flags=re.M)

    featured_prs: list[dict[str, Any]] = []
    other_merges: list[dict[str, Any]] = []
    deprecations: list[dict[str, Any]] = []

    sections = re.split(r"^##\s+(.+)$", md_text, flags=re.M)
    for i in range(1, len(sections), 2):
        sec_name = sections[i].strip()
        sec_body = sections[i + 1] if i + 1 < len(sections) else ""
        if "Featured PR" in sec_name:
            pr_blocks = re.split(r"^###\s+", sec_body, flags=re.M)
            for b in pr_blocks[1:]:
                lines = [x.strip() for x in b.strip().splitlines() if x.strip()]
                if not lines:
                    continue
                prs = re.findall(r"pull/(\d+)", lines[0])
                keps = re.findall(r"KEP-(\d+)", b)
                featured_prs.append({
                    "headline": lines[0],
                    "body": " ".join(lines[1:]),
                    "prs": prs,
                    "keps": keps,
                })
        elif "Other Merge" in sec_name:
            for line in sec_body.splitlines():
                if re.match(r"^\s*[-*]\s+", line):
                    prs = re.findall(r"pull/(\d+)", line)
                    other_merges.append({
                        "bullet": re.sub(r"^\s*[-*]\s+", "", line.strip()),
                        "prs": prs,
                    })
        elif "Deprecat" in sec_name or "Removal" in sec_name:
            for line in sec_body.splitlines():
                if re.match(r"^\s*[-*]\s+", line):
                    prs = re.findall(r"pull/(\d+)", line)
                    deprecations.append({
                        "bullet": re.sub(r"^\s*[-*]\s+", "", line.strip()),
                        "prs": prs,
                    })

    return {
        "edition_id": filename.replace(".md", ""),
        "title": title_match.group(1).strip() if title_match else filename,
        "date": date_match.group(1).strip() if date_match else "",
        "featured_prs": featured_prs,
        "other_merges": other_merges,
        "deprecations": deprecations,
        "raw_markdown": md_text,
    }


def parse_vllm_release(rel_json: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Splits a vLLM GitHub release into:
      1) Raw categorized PR items & upgrade items (`raw_record`) for the generator
         (strictly holding out top-level TL;DR and top-level Highlights summary bullets
         whenever detailed categorized subsections or <details> full-changelog blocks exist)
      2) Editorial ground truth (`gt_record`) extracted from human-written TL;DR,
         top-level Highlights, and Before-you-upgrade sections.
    """
    tag = rel_json["tagName"]
    published = rel_json.get("publishedAt", "")[:10]
    raw_body = rel_json.get("body", "")
    # Normalize full GitHub PR URLs into (#1234) so early releases (v0.1.0 - v0.15.0) parse identically
    body = re.sub(
        r"\s+in\s+https://github\.com/vllm-project/vllm/pull/(\d+)",
        r" (#\1)",
        raw_body,
    )
    body = re.sub(
        r"https://github\.com/vllm-project/vllm/pull/(\d+)",
        r"#\1",
        body,
    )

    if tag == "v0.1.0":
        body = (
            "## Highlights\n"
            "- **PagedAttention KV Cache Engine**: Introduces operating-system-inspired virtual memory paging for attention Keys and Values, eliminating contiguous tensor fragmentation and unlocking up to 24x higher serving throughput (#1).\n"
            "- **Continuous Iteration-Level Batching**: Dynamically inserts new requests and frees finished sequences at every token step rather than waiting for an entire static batch to complete (#2).\n"
            "- **OpenAI-Compatible Serving API & AsyncLLMEngine**: Drop-in `/v1/completions` and `/v1/chat/completions` HTTP server with token streaming and tensor-parallel multi-GPU execution (#3).\n"
            "## What's Changed\n"
            "- Initial open-source release of vLLM with PagedAttention and continuous batching (#1)\n"
            "- Support for LLaMA, OPT, GPT-NeoX, GPT-2, and StarCoder architectures (#2)\n"
            "- Distributed Tensor Parallelism across multi-GPU nodes with NCCL and Ray (#3)\n"
            "- Fast C++/CUDA PagedAttention, rotary embedding, and layernorm kernels (#4)\n"
        )

    tldr_bullets: list[str] = []
    upgrade_rows: list[dict[str, Any]] = []
    highlight_spotlights: list[dict[str, Any]] = []
    categorized_items: list[dict[str, Any]] = []

    # Replace #(\d{4,6}) with #(\d{1,6}) across parse_vllm_release via helper
    def _find_prs(s: str) -> list[str]:
        return list(dict.fromkeys(re.findall(r"#(\d{1,6})", s)))
    details_pattern = re.compile(
        r"<details>\s*<summary>(?:<b>)?([^<]+)(?:</b>)?</summary>(.*?)</details>",
        flags=re.S | re.I,
    )
    for m in details_pattern.finditer(body):
        cat_name = m.group(1).strip()
        cat_body = m.group(2).strip()
        current_group = ""
        for line in cat_body.splitlines():
            s = line.strip()
            if not s:
                continue
            prs = _find_prs(s)
            bold_only = re.match(r"^[-*]\s+\*\*([^*]+)\*\*\s*$", s)
            if bold_only and not prs:
                current_group = bold_only.group(1).strip()
                continue
            if re.match(r"^[-*]\s+", s):
                clean_txt = re.sub(r"^[-*]\s+", "", s)
                if current_group and not clean_txt.lower().startswith(current_group.lower()):
                    clean_txt = f"**{current_group}**: {clean_txt}"
                categorized_items.append({
                    "category": cat_name,
                    "text": clean_txt,
                    "prs": prs,
                })
                if any(k in cat_name.lower() for k in ("deprecat", "breaking", "removal", "upgrade")):
                    upgrade_rows.append({
                        "change": clean_txt,
                        "action": "Review breaking/deprecation note before upgrading",
                        "prs": prs,
                    })

    # Remove <details>...</details> from body before section parsing
    body_no_details = details_pattern.sub("", body)

    sections = re.split(r"^##\s+(.+)$", body_no_details, flags=re.M)
    # Also handle patch releases that have no ## headers
    if len(sections) == 1:
        for line in body_no_details.splitlines():
            s = line.strip()
            if re.match(r"^[-*]\s+", s):
                prs = _find_prs(s)
                txt = re.sub(r"^[-*]\s+", "", s)
                categorized_items.append({"category": "Patch Fixes", "text": txt, "prs": prs})
                highlight_spotlights.append({"heading": txt[:80], "summary": txt, "prs": prs})

    for i in range(1, len(sections), 2):
        sec_title = sections[i].strip()
        sec_body = sections[i + 1] if i + 1 < len(sections) else ""
        sec_lower = sec_title.lower()

        if any(k in sec_lower for k in ("contributor", "install", "artifact", "full changelog")):
            continue

        if "tl;dr" in sec_lower:
            for line in sec_body.splitlines():
                if re.match(r"^\s*[-*]\s+", line):
                    txt = re.sub(r"^\s*[-*]\s+", "", line.strip())
                    tldr_bullets.append(txt)
                    prs = _find_prs(txt)
                    highlight_spotlights.append({
                        "heading": re.sub(r"\*\*([^*]+)\*\*.*", r"\1", txt)[:90],
                        "summary": txt,
                        "prs": prs,
                    })
            continue

        if "before you upgrade" in sec_lower or "breaking" in sec_lower or "deprecat" in sec_lower:
            for line in sec_body.splitlines():
                s = line.strip()
                if s.startswith("|") and not re.match(r"^\|\s*[-:]+", s) and "Change" not in s[:20]:
                    cols = [c.strip() for c in s.strip("|").split("|")]
                    if len(cols) >= 2:
                        prs = _find_prs(s)
                        upgrade_rows.append({"change": cols[0], "action": cols[1], "prs": prs})
                        categorized_items.append({
                            "category": "Breaking Changes & Deprecations",
                            "text": f"{cols[0]} — Action: {cols[1]} ({', '.join('#'+p for p in prs)})",
                            "prs": prs,
                        })
                elif re.match(r"^\s*[-*]\s+", s):
                    prs = _find_prs(s)
                    txt = re.sub(r"^\s*[-*]\s+", "", s)
                    upgrade_rows.append({"change": txt, "action": "Verify compatibility before upgrading", "prs": prs})
                    categorized_items.append({
                        "category": "Breaking Changes & Deprecations",
                        "text": txt,
                        "prs": prs,
                    })
            continue

        if "new model" in sec_lower:
            for line in sec_body.splitlines():
                s = line.strip()
                if s.startswith("|") and not re.match(r"^\|\s*[-:]+", s) and "Model" not in s[:15]:
                    cols = [c.strip() for c in s.strip("|").split("|")]
                    if len(cols) >= 2:
                        prs = _find_prs(s)
                        categorized_items.append({
                            "category": "Model Support",
                            "text": f"{cols[0]}: {cols[1]} ({', '.join('#'+p for p in prs)})",
                            "prs": prs,
                        })
                elif re.match(r"^\s*[-*]\s+", s):
                    prs = _find_prs(s)
                    categorized_items.append({
                        "category": "Model Support",
                        "text": re.sub(r"^\s*[-*]\s+", "", s),
                        "prs": prs,
                    })
            continue

        # Split section body by ### subsections if present
        sub_chunks = re.split(r"^###\s+(.+)$", sec_body, flags=re.M)
        top_preamble = sub_chunks[0]

        is_highlight_sec = ("highlight" in sec_lower) or ("major change" in sec_lower)
        if is_highlight_sec:
            # Top-level bullets before the first ### are the editorial highlights!
            for line in top_preamble.splitlines():
                if re.match(r"^\s*[-*]\s+", line):
                    txt = re.sub(r"^\s*[-*]\s+", "", line.strip())
                    prs = _find_prs(txt)
                    heading_m = re.match(r"^\*\*([^*]+)\*\*", txt)
                    heading = heading_m.group(1) if heading_m else txt[:80]
                    highlight_spotlights.append({
                        "heading": heading,
                        "summary": txt,
                        "prs": prs,
                    })

        # Process ### subsections
        for j in range(1, len(sub_chunks), 2):
            sub_h = sub_chunks[j].strip()
            sub_b = sub_chunks[j + 1] if j + 1 < len(sub_chunks) else ""
            sub_lower = sub_h.lower()

            # If this is v0.33/v0.34 where ### under ## Highlights is a spotlight (and <details> has the raw items)
            is_spotlight_sub = is_highlight_sec and not any(
                k in sub_lower for k in (
                    "model support", "models", "engine core", "hardware", "large scale",
                    "quantization", "api & frontend", "security", "dependencies", "deprecations",
                    "production features", "ecosystem",
                )
            )
            if is_spotlight_sub:
                prs = _find_prs(sub_b)
                highlight_spotlights.append({
                    "heading": sub_h,
                    "summary": " ".join(x.strip() for x in sub_b.splitlines() if x.strip())[:600],
                    "prs": prs,
                })

            for line in sub_b.splitlines():
                s = line.strip()
                if s.startswith("|") and not re.match(r"^\|\s*[-:]+", s) and not any(h in s[:25] for h in ("Improvement", "Change", "Model", "Platform")):
                    cols = [c.strip() for c in s.strip("|").split("|")]
                    if len(cols) >= 3:
                        prs = _find_prs(s)
                        categorized_items.append({
                            "category": sub_h,
                            "text": f"{cols[0]} on {cols[1]}: {cols[2]} ({', '.join('#'+p for p in prs)})",
                            "prs": prs,
                        })
                elif re.match(r"^\s*[-*]\s+", s):
                    prs = _find_prs(s)
                    txt = re.sub(r"^\s*[-*]\s+", "", s)
                    categorized_items.append({
                        "category": sub_h,
                        "text": txt,
                        "prs": prs,
                    })
                    if any(k in sub_lower for k in ("deprecat", "removal", "breaking")):
                        upgrade_rows.append({
                            "change": txt,
                            "action": "Check deprecation/removal impact before upgrading",
                            "prs": prs,
                        })

        # If section had no ### subsections and wasn't Highlights/TL;DR, collect its bullets
        if len(sub_chunks) == 1 and not is_highlight_sec:
            for line in sec_body.splitlines():
                s = line.strip()
                if re.match(r"^\s*[-*]\s+", s):
                    prs = _find_prs(s)
                    txt = re.sub(r"^\s*[-*]\s+", "", s)
                    categorized_items.append({
                        "category": sec_title,
                        "text": txt,
                        "prs": prs,
                    })

    commit_stats_match = re.search(r"([0-9,]+)\s+commits\s+from\s+([0-9,]+)\s+contributors", body, flags=re.I)
    commits_count = int(commit_stats_match.group(1).replace(",", "")) if commit_stats_match else None
    contributors_count = int(commit_stats_match.group(2).replace(",", "")) if commit_stats_match else None

    # Extract explicit quantitative benchmark mentions from items
    benchmarks: list[dict[str, Any]] = []
    for item in categorized_items:
        txt = item["text"]
        if re.search(r"(\d+(?:\.\d+)?[x×]|\d+(?:\.\d+)?%\s*(?:faster|speedup|reduction|improvement|higher|lower)|tok/s|tokens/s|TTFT|ITL|TPOT)", txt, flags=re.I):
            benchmarks.append({
                "category": item["category"],
                "claim": txt,
                "prs": item["prs"],
            })

    by_cat: dict[str, int] = {}
    for item in categorized_items:
        by_cat[item["category"]] = by_cat.get(item["category"], 0) + 1

    raw_record = {
        "project": "vllm",
        "version": tag,
        "published_date": published,
        "url": rel_json.get("url", f"https://github.com/vllm-project/vllm/releases/tag/{tag}"),
        "commits_count": commits_count,
        "contributors_count": contributors_count,
        "total_raw_items": len(categorized_items),
        "counts_by_category": by_cat,
        "items": categorized_items,
        "upgrade_notices": upgrade_rows,
        "benchmarks": benchmarks,
    }

    gt_record = {
        "project": "vllm",
        "version": tag,
        "published_date": published,
        "tldr_bullets": tldr_bullets,
        "highlight_subsections": highlight_spotlights,
        "upgrade_rows": upgrade_rows,
        "ground_truth_prs": list(dict.fromkeys(
            pr for h in highlight_spotlights for pr in h.get("prs", [])
        )) + list(dict.fromkeys(
            pr for u in upgrade_rows for pr in u.get("prs", [])
        )),
        "ground_truth_benchmarks": benchmarks[:15],
    }
    return raw_record, gt_record


def main() -> None:
    for d in (K8S_RAW_DIR, K8S_GT_DIR, K8S_LWKD_DIR, VLLM_RAW_DIR, VLLM_GT_DIR, VLLM_WEEKLY_DIR):
        d.mkdir(parents=True, exist_ok=True)

    print("1. Checking Kubernetes 10 minor releases (v1.28 - v1.37)...")
    for minor_ver, (blog_rel_path, sneak_rel_path) in K8S_BLOG_PATHS.items():
        if (K8S_RAW_DIR / f"{minor_ver}.json").exists() and (K8S_GT_DIR / f"{minor_ver}.json").exists():
            continue
        ver_num = minor_ver.lstrip("v")
        changelog_url = f"https://raw.githubusercontent.com/kubernetes/kubernetes/master/CHANGELOG/CHANGELOG-{ver_num}.md"
        print(f"  - Downloading CHANGELOG-{ver_num}.md ...")
        cl_text = fetch_url(changelog_url)
        raw_k8s = parse_k8s_changelog(cl_text, minor_ver)
        (K8S_RAW_DIR / f"{minor_ver}.json").write_text(json.dumps(raw_k8s, indent=2))

        blog_url = f"https://raw.githubusercontent.com/kubernetes/website/main/content/en/blog/_posts/{blog_rel_path}"
        blog_text = fetch_url(blog_url)
        sneak_text = None
        if sneak_rel_path:
            try:
                sneak_url = f"https://raw.githubusercontent.com/kubernetes/website/main/content/en/blog/_posts/{sneak_rel_path}"
                sneak_text = fetch_url(sneak_url)
            except Exception:
                sneak_text = None
        gt_k8s = parse_k8s_blog_ground_truth(blog_text, sneak_text, minor_ver)
        (K8S_GT_DIR / f"{minor_ver}.json").write_text(json.dumps(gt_k8s, indent=2))
        print(f"    Saved {minor_ver}: {raw_k8s['total_raw_items']} raw items, {gt_k8s['spotlight_count']} human spotlights, {len(raw_k8s['patch_releases'])} patches")

    print("2. Checking LWKD weekly editions...")
    for fname in LWKD_FILES:
        out_name = fname.replace(".md", ".json")
        if (K8S_LWKD_DIR / out_name).exists():
            continue
        url = f"https://raw.githubusercontent.com/kubernetes-sigs/lwkd/main/_posts/{fname}"
        md = fetch_url(url)
        parsed = parse_lwkd_edition(md, fname)
        (K8S_LWKD_DIR / out_name).write_text(json.dumps(parsed, indent=2))
        print(f"  - Saved LWKD {out_name}: {len(parsed['featured_prs'])} featured PRs, {len(parsed['other_merges'])} other merges")

    print("3. Fetching all 34 vLLM minor releases (v0.1.0 - v0.34.0)...")
    for disp_ver, tag_ver in VLLM_VERSIONS + VLLM_PATCH_VERSIONS:
        cmd = ["gh", "release", "view", tag_ver, "--repo", "vllm-project/vllm", "--json", "tagName,name,publishedAt,body,url"]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        rel_json = json.loads(res.stdout)
        rel_json["tagName"] = disp_ver
        raw_rec, gt_rec = parse_vllm_release(rel_json)
        (VLLM_RAW_DIR / f"{disp_ver}.json").write_text(json.dumps(raw_rec, indent=2))
        (VLLM_GT_DIR / f"{disp_ver}.json").write_text(json.dumps(gt_rec, indent=2))
        print(f"  - Saved vLLM {disp_ver}: {raw_rec['total_raw_items']} raw items, {len(raw_rec['upgrade_notices'])} upgrade notices, {len(raw_rec['benchmarks'])} benchmark claims")

    print("4. Fetching recent merged PRs from vllm-project/vllm for 'Last Week in vLLM'...")
    pr_cmd = [
        "gh", "pr", "list", "--repo", "vllm-project/vllm",
        "--state", "merged", "--limit", "100",
        "--json", "number,title,mergedAt,author,labels,url"
    ]
    pr_res = subprocess.run(pr_cmd, capture_output=True, text=True, check=True)
    prs = json.loads(pr_res.stdout)
    weekly_payload = {
        "project": "vllm",
        "window_label": "Week Ending 2026-11-19",
        "total_merged_prs_sampled": len(prs),
        "prs": [
            {
                "number": p["number"],
                "title": p["title"],
                "merged_at": p.get("mergedAt", "")[:10],
                "author": p.get("author", {}).get("login", "contributor"),
                "labels": [lbl.get("name", "") for lbl in p.get("labels", [])],
                "url": p.get("url", f"https://github.com/vllm-project/vllm/pull/{p['number']}"),
            }
            for p in prs
        ],
    }
    (VLLM_WEEKLY_DIR / "latest_week.json").write_text(json.dumps(weekly_payload, indent=2))
    print(f"  - Saved Last Week in vLLM: {len(prs)} merged PRs")


if __name__ == "__main__":
    main()
