# A/B Evaluation & Hill-Climbing Report: Kubernetes Control vs. vLLM Target

## 1. Executive Summary

We evaluated six progressive release-translation architectures (`v0_naive_baseline` -> `v1_five_part_template` -> `v2_salience_and_risk_ranker` -> `v3_clustered_synthesis` -> `v4_adoption_engine` -> `v5_progressive_clarity_engine`) on:
1. **Kubernetes Control Benchmark**: All 38 minor releases (`v1.0`–`v1.37`, 11,495 raw changelog items) + 177 patch releases + 5 LWKD weekly editions, scored against held-out Official Kubernetes Release Blogs (`kubernetes/website`).
2. **vLLM Target Benchmark**: All 34 minor releases (`v0.1.0`–`v0.34.0`, 5,302 raw changelog items) + **Last Week in vLLM** (100 merged PRs), scored against held-out human-written `TL;DR`, `Highlights`, and `Before you upgrade` tables.

## 2. Kubernetes Control Benchmark (All 38 Minor Releases: v1.0 – v1.37) Hill-Climbing Results

| Generator Variant | Salience Recall | Risk Recall | Citation Precision | 5-Part Schema | Jargon Translation | Cluster Diversity | Anti-Blob Clarity | **Composite Score** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `v0_naive_baseline` | 15.6% | 5.3% | 97.4% | 30.1% | 0.0% | 90.3% | 20.0% | **33.4%** |
| `v1_five_part_template` | 26.5% | 67.2% | 97.4% | 56.4% | 75.3% | 93.7% | 19.5% | **58.9%** |
| `v2_salience_and_risk_ranker` | 35.2% | 43.2% | 100.0% | 71.4% | 92.2% | 89.1% | 20.0% | **59.7%** |
| `v3_clustered_synthesis` | 57.8% | 100.0% | 100.0% | 97.7% | 97.5% | 94.7% | 16.8% | **80.6%** |
| `v4_adoption_engine` | 89.6% | 100.0% | 100.0% | 100.0% | 97.6% | 94.3% | 0.0% | **86.8%** |
| `v5_progressive_clarity_engine` | 89.6% | 100.0% | 100.0% | 100.0% | 97.6% | 94.2% | 100.0% | **96.8%** |

## 3. vLLM Target Benchmark (All 34 Minor Releases: v0.1.0 – v0.34.0) A/B Transfer Results

| Generator Variant | Salience Recall | Risk Recall | Citation Precision | 5-Part Schema | Jargon Translation | Cluster Diversity | Anti-Blob Clarity | **Composite Score** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `v0_naive_baseline` | 46.9% | 17.6% | 100.0% | 32.8% | 0.0% | 98.2% | 16.5% | **44.5%** |
| `v1_five_part_template` | 51.4% | 70.5% | 100.0% | 52.1% | 72.3% | 97.7% | 17.1% | **65.2%** |
| `v2_salience_and_risk_ranker` | 63.5% | 81.4% | 100.0% | 70.6% | 80.3% | 97.6% | 15.9% | **73.3%** |
| `v3_clustered_synthesis` | 84.7% | 86.8% | 100.0% | 95.0% | 91.5% | 95.0% | 13.5% | **83.2%** |
| `v4_adoption_engine` | 94.8% | 100.0% | 100.0% | 100.0% | 96.5% | 94.6% | 0.0% | **87.9%** |
| `v5_progressive_clarity_engine` | 93.5% | 100.0% | 100.0% | 100.0% | 96.5% | 94.8% | 99.0% | **97.5%** |

## 4. Structural Comparison: Kubernetes vs. vLLM Releases

| Dimension | Kubernetes (All 38 Releases: v1.0–v1.37) | vLLM (All 34 Releases: v0.1.0–v0.34.0) | Architectural Adaptation in `v5_progressive_clarity_engine` |
|---|---|---|---|
| **1. Release Cadence & Velocity** | Every ~4 months; operators plan upgrades quarterly with long deprecation windows (3 releases). | Every ~2 weeks (400–1,061 commits per release); teams skip versions or upgrade for a specific model/GPU drop, requiring immediate 'Should I upgrade?' triage. | Added explicit Executive Upgrade Verdict + breaking CLI/env-var migration table + weekly 'Last Week in vLLM' digest for teams tracking main. |
| **2. Signal-to-Noise & Multi-PR Fragmentation** | One capability maps cleanly to one KEP ID (`KEP-1287`), even if implemented across 4 PRs. | No KEP IDs in release notes; a single breakthrough (e.g., DeepSeek-V4.1 support or Extensible KV Cache) fragments across 8–15 PRs touching kernels, quantization, scheduler, and ROCm. | Replaced single-bullet ranking (v2) with Multi-PR Capability Clustering (v3), merging fragmented PRs into unified capability theses. |
| **3. Maturity vs. Hardware/Model Matrix** | Adoption depends on Feature Gate maturity (`Alpha` / `Beta` / `Stable`) and cluster version. | Adoption depends on a 3D matrix: **Models Served** (DeepSeek, Qwen, GLM, Llama) × **GPUs Owned** (Blackwell GB200/B200, Hopper H100/H200, AMD MI355X) × **Quantization Precision** (NVFP4, FP8, BF16). | Built the Part 2 'Who Benefits? (Models, GPUs & Bill)' table that explicitly binds each capability cluster to target model families, GPU architectures, and unit economics. |
| **4. Proof & Quantitative Benchmarks** | Proof is primarily architectural correctness, API stability, and control-plane memory/latency safety. | Proof is heavily quantitative (165 explicit speedup/memory claims across 10 releases, e.g., '1.95x decode on 4xGB200', '433k -> 672k KV tokens on H200'). Stripping hardware/model context makes numbers meaningless. | Preserved exact hardware, concurrency, precision, and model conditions alongside every benchmark claim in Part 5 ('Where's the proof?'). |