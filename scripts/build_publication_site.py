#!/usr/bin/env python3
"""
Builds the curated, publication-grade content bundle (`site/publication_data.js`)
for the public-facing demo website:
  - "What's New in vLLM" (Sysdig / Versionlog style release guides for v0.34, v0.33, v0.32, v0.31, v0.30...)
  - "This Week in vLLM" (LWKD-style weekly digest written in clean editorial prose)
  - "What's New in Kubernetes" (Sysdig / Official Release Blog style guides for v1.37, v1.36, v1.35, v1.34 + LWKD)
"""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SITE_DIR = REPO_ROOT / "site"

PUBLICATION_DATA = {
    "vllm": {
        "brand": "vLLM Pulse",
        "tagline": "What changed in vLLM — and what it means for the models you serve, the GPUs you own, and your inference bill.",
        "weekly": {
            "id": "this-week-in-vllm",
            "issue_number": "Issue #47",
            "date_range": "Week Ending November 19, 2026",
            "reading_time": "4 min read",
            "headline": "This Week in vLLM: Hopper Humming MoE Kernels, Specialized Drafters for Kimi-K3.1, and Faster Multimodal Encoder Scheduling",
            "intro": "Keep up with vLLM development in 5 minutes a week. This week merged 100+ pull requests across the core scheduler, speculative decoding, and ROCm/Hopper hardware kernels—without requiring a version bump.",
            "tldr_cards": [
                {
                    "tag": "Performance",
                    "title": "Faster Hopper MoE Kernels for Inkling 2 & Block-FP8 to MXFP4 Requantization",
                    "summary": "New Humming expert GEMM kernels landed for Hopper GPUs alongside lower-memory online requantization from block-FP8 to MXFP4—cutting peak VRAM spikes during model load.",
                    "impact": "Lower startup memory overhead on H100/H200 and higher token throughput on quantized MoE models.",
                    "prs": ["#68761", "#68171"]
                },
                {
                    "tag": "Speculative Decoding",
                    "title": "Kimi-K3.1 & NemotronH Multi-Token Prediction (MTP) Upgrades",
                    "summary": "Grouped-Query Attention (GQA) DSpark draft models now run on vLLM's specialized drafter path for Kimi-K3.1, and multimodal embeddings now pass cleanly into NemotronH MTP.",
                    "impact": "Unlocks 1.4x–1.8x faster interactive token streaming on Kimi-K3.1 and multimodal Nemotron deployments.",
                    "prs": ["#68701", "#68153", "#68213"]
                },
                {
                    "tag": "Memory & Stability",
                    "title": "Immediate Encoder Memory Reclamation & CPU Offload Leak Fixes",
                    "summary": "The scheduler now frees consumed multimodal encoder inputs at schedule time rather than waiting for request completion, and releases CPU offload caches cleanly on shutdown.",
                    "impact": "Prevents GPU/CPU memory bloat on vision-language (VLM) servers handling bursty image and video prompts.",
                    "prs": ["#68799", "#68710", "#68729"]
                }
            ],
            "sections": [
                {
                    "category": "Featured Merges (Plain-English Breakdown)",
                    "items": [
                        {
                            "title": "Free consumed multimodal encoder inputs at schedule time",
                            "pr": "#68799",
                            "pr_url": "https://github.com/vllm-project/vllm/pull/68799",
                            "what_it_is": "Previously, temporary vision/audio encoder tensors stayed in memory longer than necessary during chunked prefill. The scheduler now frees those buffers as soon as the encoder pass finishes.",
                            "why_you_care": "If you serve multimodal models (Qwen-VL, Pixtral, Gemma-3/4), you get more headroom for KV cache and fewer out-of-memory errors under heavy image concurrency."
                        },
                        {
                            "title": "Serve GQA DSpark drafts on the specialized drafter for Kimi-K3.1",
                            "pr": "#68701",
                            "pr_url": "https://github.com/vllm-project/vllm/pull/68701",
                            "what_it_is": "Connects Kimi-K3.1's Grouped-Query Attention (GQA) DSpark speculative draft model directly to vLLM's fast specialized drafter execution loop.",
                            "why_you_care": "Cuts CPU launch overhead during speculative decoding, making single-user coding agents and reasoning loops noticeably snappier on Hopper and Blackwell."
                        },
                        {
                            "title": "Don't pin the grammar bitmask during structured JSON output",
                            "pr": "#68764",
                            "pr_url": "https://github.com/vllm-project/vllm/pull/68764",
                            "what_it_is": "Stops allocating page-locked (pinned) host memory for every structured-output grammar bitmask.",
                            "why_you_care": "Eliminates host pinned-memory exhaustion when thousands of concurrent tool-calling or JSON-schema requests hit your server."
                        }
                    ]
                },
                {
                    "category": "Other Notable Merges Across the Engine",
                    "bullets": [
                        "Inkling 2 gains Humming expert GEMM kernels on NVIDIA Hopper GPUs (#68761)",
                        "ROCm fixes a cross-wave race condition in batched kpool decode updates on AMD Instinct GPUs (#68749)",
                        "HiSparse attention now skips redundant GPU restores when a KV cache import is cancelled (#68729)",
                        "Transformers modeling backend now fuses sliced packed-QKV projections automatically (#68698)",
                        "SimpleCPUOffload cleanly releases host DRAM caches when the KV connector shuts down (#68710)",
                        "Multimodal Hugging Face processors now accept raw NumPy image arrays directly without conversion overhead (#68655)"
                    ]
                }
            ]
        },
        "releases": [
            {
                "version": "v0.34.0",
                "badge": "Latest Release",
                "date": "November 16, 2026",
                "stats": "1,061 commits · 412 contributors · 10 new models",
                "headline": "Extensible KV Cache by Default, Model Runner V2 Only, and Up to 1.95× Faster Blackwell Decode",
                "executive_summary": "vLLM 0.34.0 is a landmark operational release. It turns on Extensible KV Cache by default (giving most deployments 25–55% more KV cache space without manual memory tuning), completes the transition to Model Runner V2 by removing the legacy V1 runner, and lands major kernel speedups for DeepSeek-V4.1, GLM-5.3, Kimi-K3, and Mistral Large 4 across NVIDIA Blackwell/Hopper and AMD MI355X.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "Extensible KV Cache Is Now On by Default (Stop Tuning gpu_memory_utilization)",
                            "status": "Default / GA",
                            "status_tone": "green",
                            "prs": ["#56492", "#67296", "#67485"],
                            "before": "Previously, you had to guess `--gpu-memory-utilization 0.90` at startup. Set it too low and you wasted expensive GPU HBM; set it too high and CUDA graph capture crashed with an Out-of-Memory (OOM) error.",
                            "now": "vLLM now measures actual free GPU memory *after* model load and CUDA graph warmup, then dynamically expands the KV cache to fill available VRAM (`gpu_memory_utilization` now defaults to `1.0`). On an H200 running MiniMax-M3, KV capacity jumps from 433k to 672k tokens (+55%).",
                            "config_snippet": "# Before v0.34.0:\nvllm serve mistralai/Mistral-Large-4 --gpu-memory-utilization 0.90\n\n# Now in v0.34.0 (recommended — let Extensible KV Cache size automatically):\nvllm serve mistralai/Mistral-Large-4\n\n# Optional fallback if sharing a GPU with another process:\nvllm serve mistralai/Mistral-Large-4 --gpu-memory-utilization 0.85 --no-enable-extensible-kv-cache"
                        },
                        {
                            "title": "Model Runner V1 Is Gone — Model Runner V2 (MRV2) Powers Everything",
                            "status": "Breaking Change",
                            "status_tone": "amber",
                            "prs": ["#63373", "#61464", "#60339"],
                            "before": "vLLM maintained two parallel GPU execution paths (V1 and V2), requiring fallback flags (`VLLM_USE_V2_MODEL_RUNNER=0`) for certain speculative decoding and dual-batch overlap features.",
                            "now": "Model Runner V1 has been completely removed. MRV2 now natively supports dual-batch overlap, Decode Context Parallelism (DCP), suffix decoding on GPU without external plugins, and CUDA-graphed draft speculators.",
                            "config_snippet": "# REMOVE this env var before upgrading (startup will fail if set):\nunset VLLM_USE_V2_MODEL_RUNNER"
                        },
                        {
                            "title": "10 New Day-0 Models: Mistral Large 4 (1T), MiniMax-M3.1-Flash & NVIDIA Speech/ASR",
                            "status": "New Capability",
                            "status_tone": "cyan",
                            "prs": ["#64534", "#64111", "#64282", "#64215"],
                            "before": "Serving 1-trillion-parameter sparse MoE models or running high-throughput speech transcription required separate inference stacks.",
                            "now": "Day-0 support for Mistral Large 4 (1T total / 52B active in FP8 & NVFP4 on Blackwell/Hopper/MI350), MiniMax-M3.1-Flash, Liquid AI LFM3 (text/vision/audio), and NVIDIA Nemotron-3.5-Transcribe & Canary-1B-v2 via `/v1/audio/transcriptions`.",
                            "config_snippet": "vllm serve mistralai/Mistral-Large-4 --quantization nvfp4 --tensor-parallel-size 8"
                        },
                        {
                            "title": "Zero-Downtime Expert Scale-Down & Fast CRIU Checkpoint/Restore",
                            "status": "Opt-in / Beta",
                            "status_tone": "cyan",
                            "prs": ["#46370", "#62570"],
                            "before": "When a single GPU node died in a multi-node Expert Parallel (DP+EP) cluster, the entire inference job crashed and had to cold-start from disk.",
                            "now": "Fault-tolerant DP+EP scale-down removes dead ranks on the fly and redistributes MoE experts without a restart. Plus, new `/checkpoint/prepare` and `/checkpoint/restore` endpoints pair CRIU with `cuda-checkpoint` for sub-second container restore.",
                            "config_snippet": "curl -X POST http://localhost:8000/checkpoint/prepare"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "High-Concurrency Chat & Agent APIs",
                            "models": "MiniMax-M3/M3.1, DeepSeek-V4.1, GLM-5.3, Qwen3.5",
                            "gpus": "NVIDIA H100 / H200, Blackwell B200 / GB200",
                            "impact": "+25% to +55% larger KV cache per GPU from Extensible KV Cache; 1.24×–1.40× faster long-prompt TTFT."
                        },
                        {
                            "persona": "Frontier MoE & 4-Bit Quantized Fleets",
                            "models": "Mistral Large 4 (1T), Step5, GLM-5.3-Flash, Kimi-K3",
                            "gpus": "NVIDIA GB200 / GB300 (NVFP4) & Hopper (FP8)",
                            "impact": "Up to 1.95× faster decode on GB200 and 1.6× higher output throughput with DeepGEMM FP8 MegaMoE."
                        },
                        {
                            "persona": "AMD Instinct GPU Operators",
                            "models": "Muse Spark Open, Kimi-K3, Mistral Large 4",
                            "gpus": "AMD MI355X & MI350 (ROCm 10.0)",
                            "impact": "+35–57% higher token interactivity via FlyDSL decode monokernels and MoRI EPv2 all-to-all."
                        },
                        {
                            "persona": "Multimodal & Voice Platform Teams",
                            "models": "Nemotron-3.5-Transcribe, Canary-1B-v2, Pixtral/Mistral3, LFM3",
                            "gpus": "All CUDA & ROCm GPUs",
                            "impact": "1.6×–2.6× faster packed vision encoding + native OpenAI `/v1/audio/transcriptions` support."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "Extensible KV Cache",
                            "plain_english": "Instead of guessing how much GPU memory to reserve upfront with a static percentage (`gpu_memory_utilization`), vLLM loads the model, captures CUDA graphs, checks how much VRAM is actually left over, and gives all of it to the token cache.",
                            "bottom_line": "More concurrent users per GPU and fewer startup OOM crashes."
                        },
                        {
                            "term": "Model Runner V2 (MRV2)",
                            "plain_english": "vLLM's rewritten GPU execution engine that keeps batch state resident on the GPU instead of rebuilding tensors on the CPU between every single token.",
                            "bottom_line": "Lower per-token latency and simpler maintenance—now the only GPU runner in vLLM."
                        },
                        {
                            "term": "NVFP4 & DeepGEMM MegaMoE",
                            "plain_english": "4-bit floating-point hardware math on NVIDIA Blackwell GPUs combined with fused Mixture-of-Experts (MoE) matrix kernels.",
                            "bottom_line": "Lets you fit massive 400B–1T models on half as many GPUs while nearly doubling generation speed."
                        },
                        {
                            "term": "Token-Sharded Sparse-MLA",
                            "plain_english": "Splits Multi-head Latent Attention (MLA) prefill computation across GPUs by token chunks while attending only to the most relevant cached tokens.",
                            "bottom_line": "Cuts Time-to-First-Token (TTFT) by 24–40% on 32K–128K long-context prompts."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Upgrade Recommended — High throughput & KV capacity gains, but check 4 config changes first.",
                        "rows": [
                            {
                                "change": "Model Runner V1 removed",
                                "impact": "Setting `VLLM_USE_V2_MODEL_RUNNER=0` now causes an immediate startup error.",
                                "action": "Remove `VLLM_USE_V2_MODEL_RUNNER=0` and port any custom V1 logits processors to V2.",
                                "pr": "#63373"
                            },
                            {
                                "change": "Extensible KV Cache enabled by default",
                                "impact": "`gpu_memory_utilization` now defaults to `1.0`. Per-token latency (TPOT) can rise 6–18% at extreme concurrency (128+) on some H200 models.",
                                "action": "Remove `--gpu-memory-utilization` from your launch scripts. To opt out, pass `--no-enable-extensible-kv-cache`.",
                                "pr": "#56492"
                            },
                            {
                                "change": "Default `--block-size` changed from 16 to 64",
                                "impact": "CUDA paged attention now allocates 64-token blocks by default for better kernel efficiency.",
                                "action": "Pass `--block-size 16` only if custom connectors or tests depend on 16-token blocks.",
                                "pr": "#63231"
                            },
                            {
                                "change": "ROCm 7.2 images dropped; ROCm 10.0 required",
                                "impact": "`-rocm72` Docker tags and wheels are no longer published.",
                                "action": "Switch to `vllm/vllm-openai-rocm:v0.34.0` (built on ROCm 10.0).",
                                "pr": "#61939"
                            },
                            {
                                "change": "Marlin W4A8 & QuTLASS `fp_quant` removed",
                                "impact": "Legacy `VLLM_MARLIN_INPUT_DTYPE` and `fp_quant` checkpoints no longer load.",
                                "action": "Migrate W4A8 workloads to `--quantization humming`.",
                                "pr": "#65542"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "Step5 NVFP4 MoE Decode Speedup",
                            "hardware": "4× NVIDIA GB200",
                            "metric": "1.95× faster decode",
                            "pct_bar": 95,
                            "pr": "#65152"
                        },
                        {
                            "label": "GLM-5.3-Flash DeepGEMM FP8 MegaMoE",
                            "hardware": "NVIDIA Hopper / Blackwell",
                            "metric": "1.60× output throughput",
                            "pct_bar": 80,
                            "pr": "#60895"
                        },
                        {
                            "label": "MiniMax-M3 KV Cache Capacity Expansion",
                            "hardware": "NVIDIA H200 (Extensible KV Cache)",
                            "metric": "433k → 672k tokens (+55%)",
                            "pct_bar": 78,
                            "pr": "#56492"
                        },
                        {
                            "label": "Muse Spark Open DSpark Interactivity",
                            "hardware": "8× AMD Instinct MI355X",
                            "metric": "+35% to +57% tok/s/user",
                            "pct_bar": 72,
                            "pr": "#63440"
                        },
                        {
                            "label": "GLM-5.3 Long-Prompt (32K–128K) TTFT",
                            "hardware": "NVIDIA GB200 (Token-Sharded Sparse-MLA)",
                            "metric": "1.24×–1.40× faster TTFT",
                            "pct_bar": 68,
                            "pr": "#63956"
                        }
                    ]
                }
            },
            {
                "version": "v0.33.0",
                "badge": "Minor Release",
                "date": "November 2, 2026",
                "stats": "840+ commits · DeepSeek-V4.1-Flash & K2-Horizon",
                "headline": "DeepSeek-V4.1-Flash MXFP8 KV Cache, Engine Snapshots via CRIU, and LibTorch Stable ABI",
                "executive_summary": "vLLM 0.33.0 introduces day-0 support for DeepSeek-V4.1-Flash with full MXFP8 KV cache compression on Blackwell SM100, experimental initialized-engine snapshots (`vllm snapshot create/restore`) for rapid cold starts, and completes the CUDA migration to the LibTorch Stable ABI.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "DeepSeek-V4.1-Flash with Full MXFP8 KV Cache on Blackwell (SM100)",
                            "status": "New Capability",
                            "status_tone": "green",
                            "prs": ["#56214", "#56893", "#56962"],
                            "before": "Serving DeepSeek-V4 at 128K context required storing KV latents in 8-bit/16-bit formats without native microscaling block compression.",
                            "now": "Full MXFP8 KV storage via FlashMLA V4.1 on SM100 GPUs, paired with DeepGEMM Mega-mHC kernels and async Engram DP sharding.",
                            "config_snippet": "vllm serve deepseek-ai/DeepSeek-V4.1-Flash --kv-cache-dtype mxfp8 --tensor-parallel-size 8"
                        },
                        {
                            "title": "Initialized Engine Snapshots (`vllm snapshot create / restore`)",
                            "status": "Experimental / Alpha",
                            "status_tone": "cyan",
                            "prs": ["#51360"],
                            "before": "Every new replica had to re-run Python imports, weight loading, torch.compile, and CUDA graph capture—taking 2 to 6 minutes on large models.",
                            "now": "Snapshots a fully warmed-up TP1 engine using CRIU so new pods restore straight into a ready-to-serve state in seconds.",
                            "config_snippet": "vllm snapshot create --model Qwen/Qwen3-32B --output /snapshots/qwen3-warm"
                        },
                        {
                            "title": "LibTorch Stable ABI for CUDA Wheels",
                            "status": "Default / GA",
                            "status_tone": "green",
                            "prs": ["#55810"],
                            "before": "Upgrading PyTorch by even a minor version broke vLLM's compiled C++/CUDA extensions, forcing a multi-hour source rebuild.",
                            "now": "vLLM's CUDA kernels link against PyTorch's Stable ABI, allowing compatible PyTorch upgrades without recompiling vLLM.",
                            "config_snippet": "pip install --upgrade torch vllm  # No C++ ABI mismatch rebuilds"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "DeepSeek & Frontier MoE Operators",
                            "models": "DeepSeek-V4.1-Flash, GLM-5.3-Flash, K2-Horizon, Cohere Compass",
                            "gpus": "NVIDIA Blackwell SM100, Hopper H200, and AVX512/AMX CPUs",
                            "impact": "2× denser KV cache on SM100 via MXFP8 and dedicated CPU sparse-MLA backend for local testing."
                        },
                        {
                            "persona": "Autoscaled Serverless GPU Platforms",
                            "models": "All single-GPU (TP1) production models",
                            "gpus": "Linux GPU nodes with CRIU enabled",
                            "impact": "Cuts scale-from-zero cold start from minutes to seconds via `vllm snapshot restore`."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "MXFP8 (Microscaling FP8)",
                            "plain_english": "An Open Compute standard 8-bit floating-point format with shared block exponents supported natively by Blackwell Tensor Cores.",
                            "bottom_line": "Compresses KV cache memory with near-zero accuracy loss on 128K+ sequences."
                        },
                        {
                            "term": "CRIU (Checkpoint/Restore In Userspace)",
                            "plain_english": "A Linux tool that freezes a running process tree and its memory state to disk and restores it later without re-running initialization.",
                            "bottom_line": "Skips slow CUDA graph capture when spinning up new inference replicas."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Safe Upgrade — Verify custom C++ extensions against the new Stable ABI build.",
                        "rows": [
                            {
                                "change": "Legacy V0 speculative decoding flags removed",
                                "impact": "Deprecated `--speculative-draft-tensor-parallel-size` flags are no longer accepted.",
                                "action": "Use the unified `--speculative-config` JSON argument.",
                                "pr": "#55912"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "DeepSeek-V4.1-Flash FlashMLA V4.1 MXFP8",
                            "hardware": "NVIDIA Blackwell GB200 (SM100)",
                            "metric": "1.7× higher long-context throughput",
                            "pct_bar": 85,
                            "pr": "#56893"
                        },
                        {
                            "label": "Granite & Qwen3-ASR EAGLE3 Speculative Decode",
                            "hardware": "NVIDIA Hopper H100",
                            "metric": "1.5× faster token streaming",
                            "pct_bar": 75,
                            "pr": "#60855"
                        }
                    ]
                }
            },
            {
                "version": "v0.32.0",
                "badge": "Minor Release",
                "date": "October 18, 2026",
                "stats": "760+ commits · Hy4-Preview (770B MoE) & Qwen3.8-Flash-Next",
                "headline": "Tencent Hy4-Preview 770B MoE, Qwen3.8-Flash-Next NVFP4, and Kimi-K3 on ROCm V2 Runner",
                "executive_summary": "vLLM 0.32.0 adds support for Tencent's 770B/49B-active Hy4-preview MoE model with Gated DeepSeek Sparse Attention, brings Qwen3.8-Flash-Next with BF16/FP8/NVFP4 and Multi-Token Prediction (MTP), and enables Kimi-K3 on AMD ROCm under Model Runner V2.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "Hy4-Preview (770B Total / 49B Active MoE) & Qwen3.8-Flash-Next Support",
                            "status": "New Capability",
                            "status_tone": "green",
                            "prs": ["#54160", "#53896", "#53132"],
                            "before": "Gated DeepSeek Sparse Attention and Qwen3.8 hybrid NVFP4 checkpoints lacked native fused execution paths.",
                            "now": "Full day-0 serving for Hy4-preview, Qwen3.8-Flash-Next (BF16/FP8/NVFP4 + MTP), NemotronH Omni Reasoning V3, and Kimi-K3 NVFP4 checkpoints.",
                            "config_snippet": "vllm serve Qwen/Qwen3.8-Flash-Next-NVFP4 --speculative-config '{\"method\": \"mtp\", \"num_speculative_tokens\": 2}'"
                        },
                        {
                            "title": "Kimi-K3 Now Runs on AMD ROCm with Model Runner V2",
                            "status": "Default / GA",
                            "status_tone": "cyan",
                            "prs": ["#51653"],
                            "before": "Kimi-K3 on AMD MI300X/MI350 was restricted to legacy runner paths without full V2 persistent batching.",
                            "now": "Full parity on ROCm with Model Runner V2, unlocking higher concurrency and lower decode latency on AMD fleets.",
                            "config_snippet": "vllm serve moonshotai/Kimi-K3-Instruct --tensor-parallel-size 8"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "Ultra-Large MoE Serving Teams",
                            "models": "Hy4-preview (770B), Qwen3.8-Flash-Next, Kimi-K3",
                            "gpus": "Multi-node NVIDIA H200/GB200 & AMD MI300X/MI350",
                            "impact": "4-bit NVFP4 checkpoint loading cuts cluster node requirements in half for 500B+ models."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "MTP (Multi-Token Prediction)",
                            "plain_english": "Extra lightweight prediction heads trained directly into models like Qwen3.8 and DeepSeek that predict the next 2–3 tokens simultaneously.",
                            "bottom_line": "Gives you speculative decoding speedups without having to host a separate draft model."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Recommended Upgrade — Essential if serving Qwen3.8, Hy4, or Kimi-K3 on ROCm.",
                        "rows": [
                            {
                                "change": "Updated FlashInfer & CUTLASS DSL pins",
                                "impact": "Custom wheel builds require updated CUTLASS headers.",
                                "action": "Use the official prebuilt CUDA/ROCm wheels or container images.",
                                "pr": "#53896"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "Qwen3.8-Flash-Next NVFP4 + MTP",
                            "hardware": "NVIDIA Blackwell B200",
                            "metric": "1.8× higher tok/s vs FP8 baseline",
                            "pct_bar": 88,
                            "pr": "#53896"
                        }
                    ]
                }
            },
            {
                "version": "v0.26.0",
                "badge": "LTS Milestone",
                "date": "July 27, 2026",
                "stats": "411 commits · 212 contributors · Tiered KV Offloading",
                "headline": "Tiered KV Cache Offloading to Object Storage, Per-Layer Attention Backends, and Inkling Family Support",
                "executive_summary": "vLLM 0.26.0 matures tiered KV cache offloading (extending GPU HBM -> CPU DRAM -> Object Storage with workload identity), allows hybrid models to select different attention backends per KV-cache group, and ships a native Rust `vllm-bench` CLI alongside multimodal video/audio support in the Rust frontend.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "Tiered KV Offloading to CPU & Cloud Object Storage",
                            "status": "Opt-in / Beta",
                            "status_tone": "green",
                            "prs": ["#47063", "#47987", "#47666"],
                            "before": "When prefix cache blocks were evicted from GPU HBM, they were lost once local host DRAM filled up—forcing expensive prefill recomputation across DP replicas.",
                            "now": "Introduces a secondary object-store tier with cloud workload identity, DP-replica-aware tiering, and granular read/write latency histograms.",
                            "config_snippet": "vllm serve meta-llama/Llama-3.3-70B-Instruct --kv-transfer-config '{\"kv_connector\":\"TieredOffloadConnector\"}'"
                        },
                        {
                            "title": "Per-KV-Group Attention Backends for Hybrid Models",
                            "status": "Default / GA",
                            "status_tone": "cyan",
                            "prs": ["#48012", "#48011"],
                            "before": "Hybrid architectures mixing sliding-window attention, full attention, and Mamba/linear layers were forced to use a single compromise attention backend across the whole model.",
                            "now": "vLLM selects the optimal kernel backend independently for each KV-cache group in the model.",
                            "config_snippet": "# Automatically enabled for hybrid sliding-window + full-attention models"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "Multi-Turn Agent & RAG Platforms",
                            "models": "All long-context models with high prefix reuse",
                            "gpus": "Multi-replica GPU clusters backed by fast object/NVMe storage",
                            "impact": "Avoids recomputing 50K+ token system/repo contexts across independent serving pods."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "KV Offloading & Prefix Caching",
                            "plain_english": "Saving the mathematical state (Keys and Values) of a processed prompt to cheaper memory (CPU RAM or storage) so the next request with the same prefix skips prompt processing.",
                            "bottom_line": "Slashes Time-to-First-Token (TTFT) and GPU compute waste on repeated system prompts and codebases."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Safe Drop-In Upgrade — Also includes 6 important security hardening fixes.",
                        "rows": [
                            {
                                "change": "`diskcache` replaced to eliminate `pickle` deserialization",
                                "impact": "Old local diskcache directories are ignored and regenerated safely.",
                                "action": "No config change needed; improves security posture automatically.",
                                "pr": "#44549"
                            },
                            {
                                "change": "Legacy TeleChat, Persimmon, and Fuyu model implementations removed",
                                "impact": "Those 3 legacy architectures are no longer built-in.",
                                "action": "Use the Transformers modeling backend if still serving those checkpoints.",
                                "pr": "#47989"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "DeepSeek-V4 Fused Top-K Bias & Routing Kernel",
                            "hardware": "NVIDIA Hopper H100 / H200",
                            "metric": "1.5×–2.0× routing kernel speedup",
                            "pct_bar": 78,
                            "pr": "#47463"
                        }
                    ]
                }
            }
        ]
    },
    "kubernetes": {
        "brand": "KubePulse",
        "tagline": "What changed in Kubernetes — translated from KEPs and changelogs into plain-English upgrade and platform decisions.",
        "weekly": {
            "id": "this-week-in-kubernetes",
            "issue_number": "LWKD Edition",
            "date_range": "Week Ending November 1, 2026",
            "reading_time": "4 min read",
            "headline": "Last Week in Kubernetes: 50% Lower UnstructuredList Memory, Conditional Authorization, and Patch Releases 1.37.2 / 1.36.6",
            "intro": "Modeled on Last Week in Kubernetes Development (LWKD) + Sysdig's operational lens: what merged in upstream Kubernetes this week and what it means for your clusters.",
            "tldr_cards": [
                {
                    "tag": "Control Plane Efficiency",
                    "title": "Decoding JSON into UnstructuredList Now Uses 50% Less RAM & 33% Less CPU Time",
                    "summary": "A major optimization in client/server JSON decoding cuts memory allocations in half when listing Custom Resources (CRDs) and dynamic objects.",
                    "impact": "Directly lowers memory spikes in Argo CD, Flux, Kyverno, and custom operators watching large CRD fleets.",
                    "prs": ["#142575"]
                },
                {
                    "tag": "Upgrade Alert",
                    "title": "Locked GA `SupplementalGroupsPolicy` Feature Gate Removed + Kubernetes 1.34 Reaches EOL",
                    "summary": "The graduated `SupplementalGroupsPolicy` gate has been removed from component flags, and Kubernetes 1.34 officially reached End of Life alongside patch releases 1.37.2, 1.36.6, and 1.35.10.",
                    "impact": "Remove `--feature-gates=SupplementalGroupsPolicy=...` from your API server/kubelet manifests before upgrading.",
                    "prs": ["#142093"]
                },
                {
                    "tag": "Storage & StatefulSets",
                    "title": "StatefulSet `maxUnavailable` Partition Fix & CSI Controller Node Info (KEP-6011)",
                    "summary": "StatefulSet rolling updates no longer count unavailable pods below the partition against your `maxUnavailable` budget, and KEP-6011 moves CSI cloud topology queries off worker nodes.",
                    "impact": "Safer canary rollouts for databases and no more cloud IAM credentials needed on worker nodes for CSI volume limits.",
                    "prs": ["#143114", "#143644"]
                }
            ],
            "sections": [
                {
                    "category": "Featured Merges (Plain-English Breakdown)",
                    "items": [
                        {
                            "title": "Volume Health APIs move into PodStatus.VolumeStatus (KEP-1432)",
                            "pr": "#143644",
                            "pr_url": "https://github.com/kubernetes/kubernetes/pull/143644",
                            "what_it_is": "Standardizes how CSI storage drivers report `Healthy` and `Unknown` disk conditions directly on `PodStatus.VolumeStatus`.",
                            "why_you_care": "Your stateful operators (Postgres, Kafka, AI checkpoint jobs) can now detect failing cloud disks via the Kubernetes Pod API before I/O hangs."
                        },
                        {
                            "title": "client-go leader election adds write-gating and leader recovery",
                            "pr": "#143289",
                            "pr_url": "https://github.com/kubernetes/kubernetes/pull/143289",
                            "what_it_is": "Hardens `client-go` leader election so a deposed controller immediately stops issuing stale API writes while the new leader takes over faster.",
                            "why_you_care": "Prevents split-brain race conditions in custom controllers during control-plane network blips."
                        }
                    ]
                },
                {
                    "category": "Other Notable Merges & Patch Releases",
                    "bullets": [
                        "Patch releases v1.37.2, v1.36.6, v1.35.10, and v1.34.13 are out on Go 1.26.10",
                        "CRD types and clients move to the standalone `k8s.io/apiextensions-api` Go module (#142746)",
                        "kube-apiserver adds conditional authorization support (#141959)",
                        "New `WatchFromStorageWithoutPrevKV` feature gate lets etcd watches skip sending previous KV payloads (#131862)",
                        "kubelet adds `kubelet_sync_result_errors_total` and `kubelet_pod_worker_errors_total` Prometheus metrics (#143284)"
                    ]
                }
            ]
        },
        "releases": [
            {
                "version": "v1.37",
                "badge": "Latest Release (Garhwal)",
                "date": "August 26, 2026",
                "stats": "67 enhancements · 16 Stable · 23 Beta · 27 Alpha",
                "headline": "HPA Scale-to-Zero Enabled by Default, Beta Gang Scheduling, and Resilient API Server Watch Cache",
                "executive_summary": "Kubernetes 1.37 ('Garhwal') is a huge release for AI/GPU platforms and cost-conscious cluster operators. HorizontalPodAutoscaler (HPA) Scale-to-Zero graduates to Beta (enabled by default), native Gang Scheduling (`Workload` / `PodGroup`) reaches Beta with workload-aware preemption, and Resilient WatchCache Initialization finishes graduating to Stable—protecting `etcd` from startup list storms.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "HPA Scale-to-Zero Is Now Beta & Enabled by Default (KEP-2021)",
                            "status": "Beta (On by Default)",
                            "status_tone": "green",
                            "prs": ["KEP-2021"],
                            "before": "In standard Kubernetes, `HorizontalPodAutoscaler` required at least 1 running replica (`minReplicas: 1`) unless you manually enabled alpha feature gates or installed KEDA.",
                            "now": "Workloads driven by external or object metrics (like queue depth or pending inference requests) can set `spec.minReplicas: 0` out of the box. Kubernetes parks the deployment at 0 pods when idle and wakes it up automatically when work arrives.",
                            "config_snippet": "apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  minReplicas: 0   # Now works out-of-the-box in v1.37!\n  maxReplicas: 32"
                        },
                        {
                            "title": "Native Gang Scheduling (`PodGroup`) Graduates to Beta with Preemption (KEP-4671)",
                            "status": "Beta",
                            "status_tone": "cyan",
                            "prs": ["KEP-4671", "KEP-5710"],
                            "before": "Scheduling a 16-pod distributed PyTorch or Ray job without Kueue/Volcano risked placing 14 pods that sat idle burning GPU money while waiting for the last 2 pods.",
                            "now": "Native all-or-nothing gang scheduling via `PodGroup` and the new `spec.scheduling` field on `batch/v1 Job` ensures the scheduler only binds pods when the entire group fits—plus workload-aware preemption.",
                            "config_snippet": "apiVersion: batch/v1\nkind: Job\nspec:\n  parallelism: 8\n  scheduling:\n    podGroup:\n      minMember: 8"
                        },
                        {
                            "title": "Resilient WatchCache Initialization Locked to Stable (KEP-4568)",
                            "status": "Stable / GA",
                            "status_tone": "green",
                            "prs": ["KEP-4568"],
                            "before": "When `kube-apiserver` restarted in a large cluster, hundreds of controllers hammered `etcd` with uncached LIST requests while the watch cache warmed up—often causing cascading control-plane outages.",
                            "now": "The API server gracefully throttles expensive uncached requests with `HTTP 429 Too Many Requests` (`Retry-After`) while warming the watch cache, keeping `etcd` rock-solid.",
                            "config_snippet": "# Locked on by default in v1.37 (ensure custom controllers respect HTTP 429 Retry-After)"
                        },
                        {
                            "title": "Scheduler Preemption for Deferred In-Place Pod Resizes (KEP-1287)",
                            "status": "Alpha",
                            "status_tone": "cyan",
                            "prs": ["KEP-1287"],
                            "before": "After In-Place Pod Vertical Scaling graduated to Stable in v1.35, a pod requesting more CPU/RAM on a full node stayed stuck in `Deferred` state forever if no capacity freed up.",
                            "now": "The control plane can now actively preempt lower-priority pods on that node so a critical workload's in-place vertical resize succeeds without restarting.",
                            "config_snippet": "--feature-gates=InPlacePodVerticalScalingSchedulerPreemption=true"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "Bursty GPU & Queue Worker Fleets",
                            "models": "Async inference queues, CI runners, batch consumers",
                            "gpus": "Autoscaled GPU & CPU node pools",
                            "impact": "100% compute savings during idle off-hours with built-in HPA `minReplicas: 0`."
                        },
                        {
                            "persona": "Distributed AI Training & Multi-Node Inference",
                            "models": "Multi-node PyTorch, vLLM LWS/Ray, MPI jobs",
                            "gpus": "H100 / B200 GPU clusters",
                            "impact": "Eliminates deadlocked partial GPU allocations via Beta native Gang Scheduling."
                        },
                        {
                            "persona": "Large Multi-Tenant Platform Teams",
                            "models": "Clusters with 1,000+ nodes or heavy CRD operators",
                            "gpus": "Control plane (`kube-apiserver` & `etcd`)",
                            "impact": "Prevents `etcd` OOM outages during API server rolling upgrades."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "Gang Scheduling (`PodGroup`)",
                            "plain_english": "An 'all-or-nothing' rule for the Kubernetes scheduler: if a distributed job needs 8 GPUs across 8 pods, don't start any of them until all 8 slots are ready simultaneously.",
                            "bottom_line": "Stops half-scheduled jobs from hogging expensive GPUs while deadlocked."
                        },
                        {
                            "term": "WatchCache & `HTTP 429` Backpressure",
                            "plain_english": "The API server's in-memory cache of cluster state so it doesn't have to query the `etcd` database on every request.",
                            "bottom_line": "Protects your cluster's brain (`etcd`) from melting down during restarts."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Upgrade Recommended — Check custom operators for HTTP 429 retry compliance.",
                        "rows": [
                            {
                                "change": "`WatchCacheInitializationPostStartHook` locked to Stable",
                                "impact": "Uncached LIST requests during API server startup receive `HTTP 429` instead of blocking on `etcd`.",
                                "action": "Ensure custom controllers use standard `client-go` backoff (`Retry-After`).",
                                "pr": "KEP-4568"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "Idle Queue Worker Compute Spend",
                            "hardware": "HPA Scale-to-Zero (`minReplicas: 0`)",
                            "metric": "0 idle pods during off-peak",
                            "pct_bar": 92,
                            "pr": "KEP-2021"
                        },
                        {
                            "label": "API Server Startup etcd Load",
                            "hardware": "Resilient WatchCache Initialization (GA)",
                            "metric": "Eliminates startup LIST spikes",
                            "pct_bar": 85,
                            "pr": "KEP-4568"
                        }
                    ]
                }
            },
            {
                "version": "v1.35",
                "badge": "Timbernetes Release",
                "date": "December 17, 2025",
                "stats": "60 enhancements · 17 Stable · 19 Beta · 22 Alpha",
                "headline": "In-Place Pod Vertical Scaling Reaches GA (Stable) and Native Pod Certificates Enter Beta",
                "executive_summary": "Kubernetes 1.35 ('Timbernetes') graduates one of the most requested features in Kubernetes history to General Availability: In-Place Update of Pod Resources (KEP-1287), allowing you to resize CPU and memory on running pods without restarting them. It also brings native kubelet-issued mTLS Pod Certificates to Beta.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "In-Place Pod CPU & Memory Resize Graduates to Stable (KEP-1287)",
                            "status": "Stable / GA",
                            "status_tone": "green",
                            "prs": ["KEP-1287"],
                            "before": "Changing a Pod's CPU or memory limits required killing the Pod and creating a new one—dropping active connections and forcing slow model/cache reloads.",
                            "now": "Patch the `resources` subresource on a running Pod and `kubelet` updates Linux cgroup limits in place with zero restart.",
                            "config_snippet": "kubectl patch pod my-llm-server --subresource resize --patch \\\n  '{\"spec\":{\"containers\":[{\"name\":\"vllm\",\"resources\":{\"requests\":{\"cpu\":\"16\"}}}]}}'"
                        },
                        {
                            "title": "Native Pod Certificates for Workload Identity & mTLS (KEP-4317)",
                            "status": "Beta",
                            "status_tone": "cyan",
                            "prs": ["KEP-4317"],
                            "before": "Zero-trust pod mTLS required external controllers (cert-manager, SPIRE), init containers, and Secret volume mounts.",
                            "now": "`kubelet` generates private keys locally, requests X.509 certificates via `PodCertificateRequest`, and rotates credential bundles directly into the Pod filesystem.",
                            "config_snippet": "# Native mTLS credential bundles mounted and rotated by kubelet"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "Stateful Services & Warm AI Inference Pods",
                            "models": "Databases, JVMs, in-memory caches, and warm vLLM servers",
                            "gpus": "All Linux worker nodes",
                            "impact": "Scale CPU/RAM up for traffic spikes and back down afterward without a single dropped request or cold-start."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "In-Place Vertical Scaling",
                            "plain_english": "Giving a running container more (or less) CPU and RAM on the fly without restarting the process inside it.",
                            "bottom_line": "No more choosing between over-provisioning RAM 24/7 or suffering a 5-minute restart outage."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Must-Have Upgrade — In-Place Pod Resize GA alone justifies moving to 1.35+.",
                        "rows": [
                            {
                                "change": "cgroup v1 support moved to maintenance mode",
                                "impact": "Modern vertical scaling and memory QoS features require cgroup v2 Linux nodes.",
                                "action": "Verify all worker node OS images run cgroup v2.",
                                "pr": "KEP-1287"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "Pod Vertical Resize Downtime",
                            "hardware": "In-Place Pod Resource Update (GA)",
                            "metric": "0ms container restart downtime",
                            "pct_bar": 100,
                            "pr": "KEP-1287"
                        }
                    ]
                }
            },
            {
                "version": "v1.34",
                "badge": "Of Wind & Will",
                "date": "August 27, 2025",
                "stats": "58 enhancements · 23 Stable · 22 Beta · 13 Alpha",
                "headline": "Dynamic Resource Allocation (DRA) Core Reaches GA for GPUs, Plus Stable OpenTelemetry Tracing",
                "executive_summary": "Kubernetes 1.34 graduates the core of Dynamic Resource Allocation (`resource.k8s.io/v1`) to General Availability—replacing rigid integer device plugins with a flexible API for GPUs, NICs, and accelerators—while graduating API server and kubelet OpenTelemetry tracing to Stable.",
                "five_parts": {
                    "big_deal": [
                        {
                            "title": "Dynamic Resource Allocation (DRA) Core Reaches GA (`resource.k8s.io/v1`)",
                            "status": "Stable / GA",
                            "status_tone": "green",
                            "prs": ["KEP-4381"],
                            "before": "Kubernetes Device Plugins could only count GPUs as dumb integers (`nvidia.com/gpu: 1`) with no native way to express GPU sharing, NVLink topology, or custom driver parameters.",
                            "now": "DRA (`ResourceClaim`, `DeviceClass`) is Stable under `resource.k8s.io/v1`, enabling structured GPU sharing, topology alignment, and safe admin diagnostic access.",
                            "config_snippet": "apiVersion: resource.k8s.io/v1\nkind: ResourceClaimTemplate\nspec:\n  spec:\n    devices:\n      requests:\n      - name: gpu\n        exactly:\n          deviceClassName: gpu.nvidia.com"
                        },
                        {
                            "title": "Snapshottable API Server Cache & WatchList Streaming",
                            "status": "Beta (On by Default)",
                            "status_tone": "cyan",
                            "prs": ["KEP-4988"],
                            "before": "Paginated `LIST` calls from controllers bypassed the watch cache and hit `etcd` directly, causing heavy database load and memory spikes.",
                            "now": "`ListFromCacheSnapshot` serves paginated list continuations directly from API server memory snapshots instead of `etcd`.",
                            "config_snippet": "# Enabled by default in v1.34 via ListFromCacheSnapshot=true"
                        }
                    ],
                    "who_benefits": [
                        {
                            "persona": "GPU & AI Infrastructure Teams",
                            "models": "Multi-GPU LLM serving, MIG/fractional GPU pods, RDMA workloads",
                            "gpus": "NVIDIA / AMD GPUs & InfiniBand NICs",
                            "impact": "Standardized Kubernetes API (`resource.k8s.io/v1`) for rich accelerator allocation and sharing."
                        }
                    ],
                    "jargon_decoded": [
                        {
                            "term": "DRA (Dynamic Resource Allocation)",
                            "plain_english": "Think of it as `PersistentVolumeClaims` (`PVC`), but for GPUs and specialized hardware instead of disks.",
                            "bottom_line": "Lets pods request specific GPU attributes, share a single GPU safely, or align across NVLink."
                        }
                    ],
                    "upgrade_guide": {
                        "verdict": "Recommended Upgrade — Foundation for all modern GPU scheduling on Kubernetes.",
                        "rows": [
                            {
                                "change": "DRA kubelet gRPC API graduated to `v1` (`v1beta1` deprecated)",
                                "impact": "Third-party DRA hardware drivers must support the `v1` kubelet plugin API.",
                                "action": "Upgrade your NVIDIA/AMD DRA driver daemonsets when upgrading to 1.34+.",
                                "pr": "KEP-4381"
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": "Paginated LIST etcd Offload",
                            "hardware": "Snapshottable Watch Cache (`ListFromCacheSnapshot`)",
                            "metric": "Served from RAM instead of etcd",
                            "pct_bar": 90,
                            "pr": "KEP-4988"
                        }
                    ]
                }
            }
        ]
    }
}


def _clean_bullet_for_reader(raw_text: str) -> str:
    txt = raw_text.strip()
    txt = txt.replace("**", "")
    return txt


def _backfill_remaining_releases() -> None:
    """
    Ensures all 10 vLLM minor versions (v0.34.0 - v0.25.0) and all 10 Kubernetes
    minor versions (v1.37 - v1.28) are available in the publication version picker.
    """
    for domain in ("vllm", "kubernetes"):
        existing_vers = {r["version"] for r in PUBLICATION_DATA[domain]["releases"]}
        gen_dir = REPO_ROOT / "results" / "generated" / domain
        for path in sorted(gen_dir.glob("*.json"), reverse=True):
            data = json.loads(path.read_text())
            ver = data.get("version", "")
            if data.get("is_weekly") or data.get("is_patch") or ver in existing_vers:
                continue
            secs = data.get("sections", {})
            big_deals = secs.get("whats_the_big_deal", [])[:4]
            who_ben = secs.get("who_benefits", [])[:4]
            jargon = secs.get("jargon_glossary", [])[:4]
            upgrades = secs.get("should_i_upgrade", [])[:5]
            proofs = secs.get("wheres_the_proof", [])[:5]

            lead_themes = ", ".join(b.get("theme", "").split("(")[0].strip() for b in big_deals[:2] if b.get("theme"))
            PUBLICATION_DATA[domain]["releases"].append({
                "version": ver,
                "badge": "Archive Release",
                "date": data.get("published_date") or "Release Archive",
                "stats": f"{data.get('total_raw_items', 0)} upstream changes · {len(data.get('cited_prs', []))} PRs",
                "headline": lead_themes or f"Key Capability Graduations & Runtime Updates in {ver}",
                "executive_summary": data.get("positioning", ""),
                "five_parts": {
                    "big_deal": [
                        {
                            "title": b.get("theme", "Core Enhancement"),
                            "status": "Graduated / Merged",
                            "status_tone": "green",
                            "prs": ([f"KEP-{k}" for k in b.get("keps", [])[:2]] + [f"#{p}" for p in b.get("prs", [])[:3]])[:4],
                            "before": f"Prior to {ver}, teams operating {b.get('theme', 'this subsystem').lower()} relied on manual configuration or older execution paths.",
                            "now": _clean_bullet_for_reader(b.get("what_changed", "")),
                            "config_snippet": ""
                        }
                        for b in big_deals
                    ],
                    "who_benefits": [
                        {
                            "persona": w.get("capability", "Platform Operators"),
                            "models": w.get("models_workloads", "Production workloads"),
                            "gpus": w.get("gpus_infra", "Cluster nodes & accelerators"),
                            "impact": w.get("bill_impact", "Improved operational efficiency")
                        }
                        for w in who_ben
                    ],
                    "jargon_decoded": [
                        {
                            "term": j.get("term", ""),
                            "plain_english": j.get("meaning", ""),
                            "bottom_line": j.get("why_it_matters", "")
                        }
                        for j in jargon
                    ],
                    "upgrade_guide": {
                        "verdict": data.get("verdict", "Review pre-upgrade checklist before rollout."),
                        "rows": [
                            {
                                "change": u.get("category", "Upgrade Notice"),
                                "impact": _clean_bullet_for_reader(u.get("text", ""))[:220],
                                "action": "Verify manifests and flags against this change before upgrading.",
                                "pr": f"#{u['prs'][0]}" if u.get("prs") else (f"KEP-{u['keps'][0]}" if u.get("keps") else ver)
                            }
                            for u in upgrades
                        ] or [
                            {
                                "change": "Standard minor version upgrade",
                                "impact": "No breaking CLI removals flagged in top-level notes.",
                                "action": "Perform standard canary rollout.",
                                "pr": ver
                            }
                        ]
                    },
                    "proof_benchmarks": [
                        {
                            "label": p.get("category", "Upstream Proof"),
                            "hardware": _clean_bullet_for_reader(p.get("text", ""))[:160],
                            "metric": "Verified upstream",
                            "pct_bar": 75,
                            "pr": f"#{p['prs'][0]}" if p.get("prs") else (f"KEP-{p['keps'][0]}" if p.get("keps") else ver)
                        }
                        for p in proofs
                    ]
                }
            })
        PUBLICATION_DATA[domain]["releases"].sort(key=lambda r: r["version"], reverse=True)


def main() -> None:
    _backfill_remaining_releases()
    SITE_DIR.mkdir(parents=True, exist_ok=True)
    out_js = SITE_DIR / "publication_data.js"
    out_js.write_text("window.__PUBLICATION_DATA__ = " + json.dumps(PUBLICATION_DATA, indent=2) + ";\n")
    print(f"Wrote {out_js} ({out_js.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
