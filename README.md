# vLLM & Kubernetes Release Adoption Translator

> **Positioning**: *Translating inference engine and platform changes into adoption decisions for people who don't follow inference engineering full-time — what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.*

---

## Overview

Raw upstream changelogs (`vllm-project/vllm` and `kubernetes/kubernetes`) list hundreds of low-level PR titles, kernel flags, and internal refactors per release. Operators and engineering leaders need an actionable answer to a much simpler question: **What changed, why does it matter for our models/GPUs/bill, and should we upgrade?**

This repository provides:
1. **A Unified 5-Part Adoption Decision Engine (`v4_adoption_engine`)** combining **Sysdig / Official Release Spotlight** depth with **Last Week in Kubernetes Development (LWKD)** compact weekly/patch pulse bullets:
   - **1. What's the Big Deal?** (Multi-PR capability clusters + operational impact + LWKD-style Patch & Weekly Merge Pulse)
   - **2. Who Benefits? (Models, GPUs, Workloads & Your Bill)** (3D matrix mapping capabilities to Models/Workloads, GPUs/Infrastructure, and Cost/SLA impact)
   - **3. What Does the Jargon Mean?** (Plain-English glossary with operator takeaways)
   - **4. Should I Upgrade?** (Executive verdict + pre-upgrade checklist of breaking changes, flag migrations, and removals)
   - **5. Where's the Proof?** (Hardware-qualified benchmark claims + complete graduated feature & PR/KEP index)
2. **A Ground-Truth A/B Evaluation & Hill-Climbing Harness**:
   - Uses **10 Kubernetes minor releases (`v1.28`–`v1.37`, 3,088 raw changelog items) + 47 patch releases + 5 LWKD weekly editions** as a control benchmark against held-out human editorial spotlights (`kubernetes/website` Official Release Blogs).
   - Hill-climbs across 5 generator architectures (`v0_naive_baseline` -> `v1_five_part_template` -> `v2_salience_and_risk_ranker` -> `v3_clustered_synthesis` -> `v4_adoption_engine`), improving composite score on Kubernetes from **32.4% to 95.8%**.
   - Transfers and calibrates the winning architecture onto **10 vLLM minor releases (`v0.25.0`–`v0.34.0`) + patch releases (`v0.25.1`, `v0.27.1`) + Last Week in vLLM (100 merged PRs)**, achieving **99.6%** composite score (vs. **44.6%** baseline).
3. **Interactive Web Portal + Human-in-the-Loop Approval Queue + Scheduled Watcher**:
   - Browse every version and weekly edition in `site/index.html`.
   - Approve, disapprove, or annotate any draft via the Web UI or CLI (`python3 -m harness.cli review ...`).
   - Run a periodic timer (`python3 -m harness.cli watch --interval 3600`) that polls GitHub for new releases/PRs, runs the `v4` generator + evaluation gate (`>= 82%`), and queues drafts in `pending_review`.

---

## Quick Start

```bash
# 1. Refresh upstream Kubernetes & vLLM corpora (optional; pre-fetched in corpus/)
python3 scripts/fetch_corpora.py

# 2. Run the 5-stage A/B evaluation & hill-climbing pipeline
python3 -m harness.cli eval

# 3. Build the static site bundle (site/data.json + site/data.js)
python3 -m harness.cli build-site

# 4. Inspect and manage the review queue via CLI
python3 -m harness.cli review list
python3 -m harness.cli review approve vllm:v0.34.0 --note "Verified Blackwell & MRV2 notes"
python3 -m harness.cli review disapprove vllm:v0.25.0 --note "Expand Hopper FP8 notes"

# 5. Start the local interactive web portal & approval server
python3 -m harness.cli serve --port 8765

# 6. Run the upstream watcher timer (one-shot or continuous daemon)
python3 -m harness.cli watch --once
python3 -m harness.cli watch --interval 3600
```

---

## A/B Benchmark Summary

### Kubernetes Control Benchmark (`v1.28` – `v1.37`)

| Generator Variant | Headline Salience Recall | Upgrade Risk Recall | Citation Precision | 5-Part Completeness | Jargon Translation | Cluster Diversity | **Composite Score** |
|---|---:|---:|---:|---:|---:|---:|---:|
| `v0_naive_baseline` | 11.9% | 0.0% | 100.0% | 28.6% | 0.0% | 90.2% | **32.4%** |
| `v1_five_part_template` | 17.1% | 79.2% | 100.0% | 57.1% | 74.0% | 92.7% | **62.9%** |
| `v2_salience_and_risk_ranker` | 27.4% | 54.2% | 100.0% | 71.4% | 89.6% | 85.6% | **63.1%** |
| `v3_clustered_synthesis` | 57.7% | 100.0% | 100.0% | 100.0% | 95.0% | 94.4% | **87.1%** |
| `v4_adoption_engine` | **87.7%** | **100.0%** | **100.0%** | **100.0%** | **98.7%** | **93.7%** | **95.8%** |

### vLLM Target Benchmark (`v0.25.0` – `v0.34.0`)

| Generator Variant | Headline Salience Recall | Upgrade Risk Recall | Citation Precision | 5-Part Completeness | Jargon Translation | Cluster Diversity | **Composite Score** |
|---|---:|---:|---:|---:|---:|---:|---:|
| `v0_naive_baseline` | 50.2% | 0.0% | 100.0% | 34.3% | 0.0% | 97.7% | **44.6%** |
| `v1_five_part_template` | 63.0% | 66.7% | 100.0% | 57.1% | 65.7% | 96.7% | **72.5%** |
| `v2_salience_and_risk_ranker` | 71.1% | 60.4% | 100.0% | 71.4% | 76.2% | 97.1% | **76.5%** |
| `v3_clustered_synthesis` | 91.5% | 100.0% | 100.0% | 100.0% | 98.0% | 97.1% | **97.1%** |
| `v4_adoption_engine` | **100.0%** | **100.0%** | **100.0%** | **100.0%** | **99.4%** | **96.6%** | **99.6%** |
