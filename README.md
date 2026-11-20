# What's New in vLLM — Release Adoption Translator & Evaluation Harness

> **Positioning**: *Translating inference engine changes into adoption decisions for people who don't follow inference engineering full-time — what changed, and what it means for the models you serve, the GPUs you own, and your inference bill.*

---

## Overview

Raw upstream changelogs (`vllm-project/vllm` and `kubernetes/kubernetes`) list hundreds of low-level PR titles, kernel flags, and internal refactors per release. Operators and engineering leaders need a clear answer to a much simpler question: **What changed at a high level, who benefits, what does the jargon mean, should we upgrade, and what are the technical details and proof?**

This repository provides:
1. **A Progressive 6-Part Release Translation Engine (`v5_progressive_clarity_engine`)** across all **34 vLLM minor releases (`v0.1.0` – `v0.34.0`)**:
   - **High-Level Explanation** (2 crisp plain-English sentences)
   - **1. What are the high-level changes?** (Non-technical plain-English bullets)
   - **2. Who benefits? (Models, GPUs & Your Bill)** (3D matrix mapping capabilities to Models/Workloads, GPUs/Hardware, and Cost/Latency impact)
   - **3. What does the jargon mean?** (Plain-English glossary with operator takeaways)
   - **4. Should I upgrade?** (Executive verdict + pre-upgrade checklist of breaking changes, flag migrations, and removals)
   - **5. Technical deep dive (What's the big deal under the hood?)** (Detailed subsystem breakdown with clean bullets and CLI/config examples)
   - **6. Where's the proof?** (Hardware-qualified benchmark claims + verified upstream `#PR` and `KEP` citations)
2. **A Ground-Truth A/B Evaluation & Hill-Climbing Control Harness**:
   - Uses **all 38 Kubernetes minor releases (`v1.0`–`v1.37`, 11,495 raw changelog items)** against held-out human-written Official Kubernetes Release Announcement Blogs (`kubernetes/website`, CC-BY-4.0 / Apache-2.0) as the control benchmark.
   - Hill-climbs across 6 generator architectures (`v0_naive_baseline` -> `v1_five_part_template` -> `v2_salience_and_risk_ranker` -> `v3_clustered_synthesis` -> `v4_adoption_engine` -> `v5_progressive_clarity_engine`), improving composite score on all 38 Kubernetes releases from **33.4% to 96.8%**.
   - Evaluates and transfers the winning architecture onto **all 34 vLLM minor releases (`v0.1.0`–`v0.34.0`, 5,302 raw changelog items)**, achieving **97.6%** composite score (vs. **44.5%** baseline).
3. **Static GitHub Pages Website + Automated GitHub Actions Sync**:
   - Frameworkless, lightweight static site in `site/index.html` with light/dark mode toggle.
   - `.github/workflows/pages.yml`: Deploys `site/` to GitHub Pages on push to `main`.
   - `.github/workflows/release-hillclimb-and-sync.yml`: Periodically polls upstream Kubernetes (`v1.0`–`v1.38+`) and vLLM (`v0.1.0`–`v0.35.0+`) releases, runs the full hill-climb control & target test suite, and updates the site automatically.

---

## Local Commands & Test Suite

```bash
# 1. Fetch/sync upstream Kubernetes (v1.0 - v1.37+) & vLLM (v0.1.0 - v0.34.0+) releases
python3 scripts/fetch_corpora.py

# 2. Run the 6-stage A/B evaluation & hill-climbing pipeline
PYTHONPATH=. python3 -m harness.cli eval

# 3. Run the local unit & regression test suite
PYTHONPATH=. python3 -m unittest discover -s tests -v

# 4. Build the static GitHub Pages bundle (site/publication_data.js)
python3 scripts/build_publication_site.py

# 5. Serve locally on http://127.0.0.1:8765
PYTHONPATH=. python3 -m harness.cli serve --port 8765
```

---

## Full Hill-Climbing Results (`v0` $\rightarrow$ `v5_progressive_clarity_engine`)

### 1. Kubernetes Control Benchmark (All 38 Minor Releases: `v1.0` – `v1.37`, 11,495 Raw Items)

| Generator Variant | Salience Recall | Risk Recall | Citation Precision | 5-Part Schema | Jargon Translation | Cluster Diversity | Anti-Blob Clarity | **Composite Score** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `v0_naive_baseline` | 15.6% | 5.3% | 97.4% | 30.1% | 0.0% | 90.3% | 20.0% | **33.4%** |
| `v1_five_part_template` | 26.5% | 67.2% | 97.4% | 56.4% | 75.3% | 93.7% | 19.5% | **58.9%** |
| `v2_salience_and_risk_ranker` | 35.2% | 43.2% | 100.0% | 71.4% | 92.2% | 89.1% | 20.0% | **59.7%** |
| `v3_clustered_synthesis` | 57.8% | 100.0% | 100.0% | 97.7% | 97.5% | 94.7% | 16.8% | **80.6%** |
| `v4_adoption_engine` | 89.6% | 100.0% | 100.0% | 100.0% | 97.6% | 94.3% | 0.0% | **86.8%** |
| **`v5_progressive_clarity_engine`** | **89.6%** | **100.0%** | **100.0%** | **100.0%** | **97.6%** | **94.2%** | **100.0%** | **96.8%** |

### 2. vLLM Target Benchmark (All 34 Minor Releases: `v0.1.0` – `v0.34.0`, 5,302 Raw Items)

| Generator Variant | Salience Recall | Risk Recall | Citation Precision | 5-Part Schema | Jargon Translation | Cluster Diversity | Anti-Blob Clarity | **Composite Score** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `v0_naive_baseline` | 46.9% | 17.6% | 100.0% | 32.8% | 0.0% | 98.2% | 16.5% | **44.5%** |
| `v1_five_part_template` | 51.4% | 70.5% | 100.0% | 52.1% | 72.3% | 97.7% | 17.1% | **65.2%** |
| `v2_salience_and_risk_ranker` | 63.5% | 81.4% | 100.0% | 70.6% | 80.3% | 97.6% | 15.9% | **73.3%** |
| `v3_clustered_synthesis` | 83.8% | 86.8% | 100.0% | 95.0% | 92.9% | 95.0% | 13.5% | **83.1%** |
| `v4_adoption_engine` | 94.8% | 100.0% | 100.0% | 100.0% | 97.0% | 94.6% | 0.0% | **88.0%** |
| **`v5_progressive_clarity_engine`** | **93.5%** | **100.0%** | **100.0%** | **100.0%** | **97.0%** | **94.8%** | **99.0%** | **97.6%** |
