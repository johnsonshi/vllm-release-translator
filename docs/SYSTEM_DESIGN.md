# System Design: Release Translation, Control Evals & Approval Automation

## 1. Product & Engineering Goal

Build an automated editorial and evaluation system that turns raw, noisy upstream engineering changelogs (`kubernetes/kubernetes` and `vllm-project/vllm`) into high-trust **5-part adoption decision guides** plus **LWKD-style weekly/patch digests**.

Every generated edition answers five concrete questions in a single unified block:
1. **What's the big deal?** (Top capability clusters + LWKD-style weekly/patch pulse)
2. **Who benefits?** (Models/workloads you serve, GPUs/nodes you own, and your inference/cluster bill)
3. **What does the jargon mean?** (Plain-English definitions + operator bottom line)
4. **Should I upgrade?** (Executive verdict + breaking changes, removals, and flag migrations)
5. **Where's the proof?** (Hardware-qualified benchmarks + verified upstream `#PR` and `KEP` links)

---

## 2. Why Kubernetes First? (Control Benchmark & Hill-Climbing Design)

In vLLM, human-written "What's New for Operators" guides across historical versions are sparse. In Kubernetes, however, every minor release (`v1.28`–`v1.37`) has:
- **Raw Upstream Input (`X`)**: `CHANGELOG-1.XX.md` (250–400 raw PR entries across `Urgent Upgrade Notes`, `Deprecation`, `API Change`, `Feature`, and `Bug or Regression`, plus patch releases `.1`, `.2`, ...).
- **Held-Out Human Editorial Ground Truth (`Y`)**: Official Kubernetes Release Highlight Blogs (`kubernetes/website`) and weekly `kubernetes-sigs/lwkd` issues.

By withholding `Y` from the generator and evaluating purely on `f(X)` vs. `Y`, we iteratively hill-climbed five architectures:
- **`v0_naive_baseline` (32.4% K8s / 44.6% vLLM)**: Raw file-order truncation. Fails on salience recall and misses breaking upgrade notes.
- **`v1_five_part_template` (62.9% K8s / 72.5% vLLM)**: Enforces the 5-part adoption schema, but naive length ranking selects verbose bugfixes over core feature graduations.
- **`v2_salience_and_risk_ranker` (63.1% K8s / 76.5% vLLM)**: Adds multi-signal salience scoring (graduation stage, KEP references, quantitative speedups, breaking-change flags). Bottleneck: multi-PR capabilities (e.g., 10 PRs touching DRA or DeepSeek-V4) crowd the top slots with duplicate sub-bullets.
- **`v3_clustered_synthesis` (87.1% K8s / 97.1% vLLM)**: Introduces semantic capability clustering, Models/GPUs/Bill impact synthesis, and LWKD pulse formatting. Bottleneck discovered on Kubernetes: capping clusters at 3 items and allowing numeric bugfixes to compete with `Feature`/`API Change` items truncated ~40% of graduated Kubernetes enhancements.
- **`v4_adoption_engine` (95.8% K8s / 99.6% vLLM)**: Prioritizes `Feature` and `API Change` graduations over bugfix noise, expands cluster synthesis, pairs Part 5 benchmark proofs with a complete graduated enhancement rollup, and runs a deterministic citation & jargon verifier.

---

## 3. Structural Differences: Kubernetes vs. vLLM

| Dimension | Kubernetes (`v1.28`–`v1.37`) | vLLM (`v0.25.0`–`v0.34.0`) | Design Implication |
|---|---|---|---|
| **Release Velocity** | ~3 minor releases/year (~4 months) | ~2 minor releases/month (~14 days, 400–1,061 commits) | vLLM operators frequently skip versions and need an immediate "Should I upgrade?" verdict plus a weekly digest (`Last Week in vLLM`). |
| **Feature Tracking** | Centralized around formal `KEP-XXXX` IDs and `Alpha -> Beta -> Stable` gates | Fragmented across 5–15 PRs per model/kernel with no KEP ID | Multi-PR capability clustering (`v3`/`v4`) is essential for vLLM to merge kernel, scheduler, and ROCm PRs into one story. |
| **Adoption Axis** | Cluster version & feature-gate stability | **3D Matrix**: Model family × GPU architecture (Blackwell/Hopper/MI355X/TPU) × Quantization (NVFP4/FP8/BF16) | Part 2 ("Who benefits?") must explicitly bind every vLLM change to target models, GPU SKUs, and token economics. |
| **Proof Structure** | API contract stability & control-plane safety | Quantitative throughput/TTFT/TPOT/VRAM gains (93 explicit claims across 10 releases) | Part 5 ("Where's the proof?") must preserve exact hardware, concurrency, and precision conditions alongside every speedup number. |

---

## 4. Scheduled Watcher & Human Approval Architecture

```
[GitHub Upstream: vllm-project/vllm & kubernetes/kubernetes]
                        │
                        ▼  (Periodic Timer: `python3 -m harness.cli watch`)
         [Corpus Ingestor: scripts/fetch_corpora.py]
                        │
                        ▼
        [Generator: v4_adoption_engine (harness/generators.py)]
                        │
                        ▼
       [Automated Eval Gate >= 0.82 (harness/evaluator.py)]
                        │
                        ▼
      [Review Queue State: review_queue/state.json (pending_review)]
           ┌────────────┴────────────┐
           ▼                         ▼
  [Web UI: site/index.html]   [CLI: harness/cli.py review approve/disapprove]
```
