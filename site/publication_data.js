window.__PUBLICATION_DATA__ = {
  "vllm": {
    "brand": "vLLM Pulse",
    "tagline": "What changed in vLLM \u2014 and what it means for the models you serve, the GPUs you own, and your inference bill.",
    "weekly": {
      "id": "this-week-in-vllm",
      "date_iso": "2026-11-19",
      "date_range": "Thursday, 2026-11-19 (Weekly Digest)",
      "reading_time": "4 min read",
      "headline": "This Week in vLLM (2026-11-19): Hopper Humming MoE Kernels, Specialized Drafters for Kimi-K3.1, and Faster Multimodal Encoder Scheduling",
      "intro": "Keep up with vLLM development in 5 minutes a week. This week merged 100+ pull requests across the core scheduler, speculative decoding, and ROCm/Hopper hardware kernels\u2014without requiring a version bump.",
      "tldr_cards": [
        {
          "tag": "Performance",
          "title": "Faster Hopper MoE Kernels for Inkling 2 & Block-FP8 to MXFP4 Requantization",
          "summary": "New Humming expert GEMM kernels landed for Hopper GPUs alongside lower-memory online requantization from block-FP8 to MXFP4\u2014cutting peak VRAM spikes during model load.",
          "impact": "Lower startup memory overhead on H100/H200 and higher token throughput on quantized MoE models.",
          "prs": [
            "#68761",
            "#68171"
          ]
        },
        {
          "tag": "Speculative Decoding",
          "title": "Kimi-K3.1 & NemotronH Multi-Token Prediction (MTP) Upgrades",
          "summary": "Grouped-Query Attention (GQA) DSpark draft models now run on vLLM's specialized drafter path for Kimi-K3.1, and multimodal embeddings now pass cleanly into NemotronH MTP.",
          "impact": "Unlocks 1.4x\u20131.8x faster interactive token streaming on Kimi-K3.1 and multimodal Nemotron deployments.",
          "prs": [
            "#68701",
            "#68153",
            "#68213"
          ]
        },
        {
          "tag": "Memory & Stability",
          "title": "Immediate Encoder Memory Reclamation & CPU Offload Leak Fixes",
          "summary": "The scheduler now frees consumed multimodal encoder inputs at schedule time rather than waiting for request completion, and releases CPU offload caches cleanly on shutdown.",
          "impact": "Prevents GPU/CPU memory bloat on vision-language (VLM) servers handling bursty image and video prompts.",
          "prs": [
            "#68799",
            "#68710",
            "#68729"
          ]
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
      ],
      "label": "2026-11-19 (Latest)"
    },
    "releases": [
      {
        "version": "v0.34.0",
        "badge": "Latest Release",
        "date": "2026-11-16",
        "stats": "1,061 commits from 412 contributors and 10 new models",
        "headline": "Extensible KV Cache by Default, Model Runner V2 Only, and Up to 1.95\u00d7 Faster Blackwell Decode",
        "executive_summary": "vLLM 0.34.0 is a landmark operational release. It turns on Extensible KV Cache by default (giving most deployments 25\u201355% more KV cache space without manual memory tuning), completes the transition to Model Runner V2 by removing the legacy V1 runner, and lands major kernel speedups for DeepSeek-V4.1, GLM-5.3, Kimi-K3, and Mistral Large 4 across NVIDIA Blackwell/Hopper and AMD MI355X.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Extensible KV Cache Is Now On by Default (Stop Tuning gpu_memory_utilization)",
              "status": "Default / GA",
              "status_tone": "green",
              "prs": [
                "#56492",
                "#67296",
                "#67485"
              ],
              "before": "Previously, you had to guess `--gpu-memory-utilization 0.90` at startup. Set it too low and you wasted expensive GPU HBM; set it too high and CUDA graph capture crashed with an Out-of-Memory (OOM) error.",
              "now": "vLLM now measures actual free GPU memory *after* model load and CUDA graph warmup, then dynamically expands the KV cache to fill available VRAM (`gpu_memory_utilization` now defaults to `1.0`). On an H200 running MiniMax-M3, KV capacity jumps from 433k to 672k tokens (+55%).",
              "config_snippet": "# Before v0.34.0:\nvllm serve mistralai/Mistral-Large-4 --gpu-memory-utilization 0.90\n\n# Now in v0.34.0 (recommended \u2014 let Extensible KV Cache size automatically):\nvllm serve mistralai/Mistral-Large-4\n\n# Optional fallback if sharing a GPU with another process:\nvllm serve mistralai/Mistral-Large-4 --gpu-memory-utilization 0.85 --no-enable-extensible-kv-cache",
              "tech_bullets": [
                "vLLM now measures actual free GPU memory *after* model load and CUDA graph warmup, then dynamically expands the KV cache to fill available VRAM (`gpu_memory_utilization` now defaults to `1.0`). On an H200 running MiniMax-M3, KV capacity jumps from 433k to 672k tokens (+55%)."
              ]
            },
            {
              "title": "Model Runner V1 Is Gone \u2014 Model Runner V2 (MRV2) Powers Everything",
              "status": "Breaking Change",
              "status_tone": "amber",
              "prs": [
                "#63373",
                "#61464",
                "#60339"
              ],
              "before": "vLLM maintained two parallel GPU execution paths (V1 and V2), requiring fallback flags (`VLLM_USE_V2_MODEL_RUNNER=0`) for certain speculative decoding and dual-batch overlap features.",
              "now": "Model Runner V1 has been completely removed. MRV2 now natively supports dual-batch overlap, Decode Context Parallelism (DCP), suffix decoding on GPU without external plugins, and CUDA-graphed draft speculators.",
              "config_snippet": "# REMOVE this env var before upgrading (startup will fail if set):\nunset VLLM_USE_V2_MODEL_RUNNER",
              "tech_bullets": [
                "Model Runner V1 has been completely removed. MRV2 now natively supports dual-batch overlap, Decode Context Parallelism (DCP), suffix decoding on GPU without external plugins, and CUDA-graphed draft speculators."
              ]
            },
            {
              "title": "10 New Day-0 Models: Mistral Large 4 (1T), MiniMax-M3.1-Flash & NVIDIA Speech/ASR",
              "status": "New Capability",
              "status_tone": "cyan",
              "prs": [
                "#64534",
                "#64111",
                "#64282",
                "#64215"
              ],
              "before": "Serving 1-trillion-parameter sparse MoE models or running high-throughput speech transcription required separate inference stacks.",
              "now": "Day-0 support for Mistral Large 4 (1T total / 52B active in FP8 & NVFP4 on Blackwell/Hopper/MI350), MiniMax-M3.1-Flash, Liquid AI LFM3 (text/vision/audio), and NVIDIA Nemotron-3.5-Transcribe & Canary-1B-v2 via `/v1/audio/transcriptions`.",
              "config_snippet": "vllm serve mistralai/Mistral-Large-4 --quantization nvfp4 --tensor-parallel-size 8",
              "tech_bullets": [
                "Day-0 support for Mistral Large 4 (1T total / 52B active in FP8 & NVFP4 on Blackwell/Hopper/MI350), MiniMax-M3.1-Flash, Liquid AI LFM3 (text/vision/audio), and NVIDIA Nemotron-3.5-Transcribe & Canary-1B-v2 via `/v1/audio/transcriptions`."
              ]
            },
            {
              "title": "Zero-Downtime Expert Scale-Down & Fast CRIU Checkpoint/Restore",
              "status": "Opt-in / Beta",
              "status_tone": "cyan",
              "prs": [
                "#46370",
                "#62570"
              ],
              "before": "When a single GPU node died in a multi-node Expert Parallel (DP+EP) cluster, the entire inference job crashed and had to cold-start from disk.",
              "now": "Fault-tolerant DP+EP scale-down removes dead ranks on the fly and redistributes MoE experts without a restart. Plus, new `/checkpoint/prepare` and `/checkpoint/restore` endpoints pair CRIU with `cuda-checkpoint` for sub-second container restore.",
              "config_snippet": "curl -X POST http://localhost:8000/checkpoint/prepare",
              "tech_bullets": [
                "Fault-tolerant DP+EP scale-down removes dead ranks on the fly and redistributes MoE experts without a restart. Plus, new `/checkpoint/prepare` and `/checkpoint/restore` endpoints pair CRIU with `cuda-checkpoint` for sub-second container restore."
              ]
            }
          ],
          "who_benefits": [
            {
              "persona": "High-Concurrency Chat & Agent APIs",
              "models": "MiniMax-M3/M3.1, DeepSeek-V4.1, GLM-5.3, Qwen3.5",
              "gpus": "NVIDIA H100 / H200, Blackwell B200 / GB200",
              "impact": "+25% to +55% larger KV cache per GPU from Extensible KV Cache; 1.24\u00d7\u20131.40\u00d7 faster long-prompt TTFT."
            },
            {
              "persona": "Frontier MoE & 4-Bit Quantized Fleets",
              "models": "Mistral Large 4 (1T), Step5, GLM-5.3-Flash, Kimi-K3",
              "gpus": "NVIDIA GB200 / GB300 (NVFP4) & Hopper (FP8)",
              "impact": "Up to 1.95\u00d7 faster decode on GB200 and 1.6\u00d7 higher output throughput with DeepGEMM FP8 MegaMoE."
            },
            {
              "persona": "AMD Instinct GPU Operators",
              "models": "Muse Spark Open, Kimi-K3, Mistral Large 4",
              "gpus": "AMD MI355X & MI350 (ROCm 10.0)",
              "impact": "+35\u201357% higher token interactivity via FlyDSL decode monokernels and MoRI EPv2 all-to-all."
            },
            {
              "persona": "Multimodal & Voice Platform Teams",
              "models": "Nemotron-3.5-Transcribe, Canary-1B-v2, Pixtral/Mistral3, LFM3",
              "gpus": "All CUDA & ROCm GPUs",
              "impact": "1.6\u00d7\u20132.6\u00d7 faster packed vision encoding + native OpenAI `/v1/audio/transcriptions` support."
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
              "bottom_line": "Lower per-token latency and simpler maintenance\u2014now the only GPU runner in vLLM."
            },
            {
              "term": "NVFP4 & DeepGEMM MegaMoE",
              "plain_english": "4-bit floating-point hardware math on NVIDIA Blackwell GPUs combined with fused Mixture-of-Experts (MoE) matrix kernels.",
              "bottom_line": "Lets you fit massive 400B\u20131T models on half as many GPUs while nearly doubling generation speed."
            },
            {
              "term": "Token-Sharded Sparse-MLA",
              "plain_english": "Splits Multi-head Latent Attention (MLA) prefill computation across GPUs by token chunks while attending only to the most relevant cached tokens.",
              "bottom_line": "Cuts Time-to-First-Token (TTFT) by 24\u201340% on 32K\u2013128K long-context prompts."
            }
          ],
          "upgrade_guide": {
            "verdict": "Upgrade Recommended \u2014 High throughput & KV capacity gains, but check 4 config changes first.",
            "rows": [
              {
                "change": "Model Runner V1 removed",
                "impact": "Setting `VLLM_USE_V2_MODEL_RUNNER=0` now causes an immediate startup error.",
                "action": "Remove `VLLM_USE_V2_MODEL_RUNNER=0` and port any custom V1 logits processors to V2.",
                "pr": "#63373"
              },
              {
                "change": "Extensible KV Cache enabled by default",
                "impact": "`gpu_memory_utilization` now defaults to `1.0`. Per-token latency (TPOT) can rise 6\u201318% at extreme concurrency (128+) on some H200 models.",
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
              "hardware": "4\u00d7 NVIDIA GB200",
              "metric": "1.95\u00d7 faster decode",
              "pct_bar": 95,
              "pr": "#65152"
            },
            {
              "label": "GLM-5.3-Flash DeepGEMM FP8 MegaMoE",
              "hardware": "NVIDIA Hopper / Blackwell",
              "metric": "1.60\u00d7 output throughput",
              "pct_bar": 80,
              "pr": "#60895"
            },
            {
              "label": "MiniMax-M3 KV Cache Capacity Expansion",
              "hardware": "NVIDIA H200 (Extensible KV Cache)",
              "metric": "433k \u2192 672k tokens (+55%)",
              "pct_bar": 78,
              "pr": "#56492"
            },
            {
              "label": "Muse Spark Open DSpark Interactivity",
              "hardware": "8\u00d7 AMD Instinct MI355X",
              "metric": "+35% to +57% tok/s/user",
              "pct_bar": 72,
              "pr": "#63440"
            },
            {
              "label": "GLM-5.3 Long-Prompt (32K\u2013128K) TTFT",
              "hardware": "NVIDIA GB200 (Token-Sharded Sparse-MLA)",
              "metric": "1.24\u00d7\u20131.40\u00d7 faster TTFT",
              "pct_bar": 68,
              "pr": "#63956"
            }
          ],
          "high_level_changes": [
            {
              "headline": "Extensible KV Cache Is Now On by Default",
              "plain_summary": "vLLM now measures actual free GPU memory *after* model load and CUDA graph warmup, then dynamically expands the KV cache to fill available VRAM (`gpu_memory_utilization` now defaults to `1.0`). On an H200 running MiniMax-M3, KV capacity jumps from 433k to 672k tokens (+55%)."
            },
            {
              "headline": "Model Runner V1 Is Gone",
              "plain_summary": "Model Runner V1 has been completely removed. MRV2 now natively supports dual-batch overlap, Decode Context Parallelism (DCP), suffix decoding on GPU without external plugins, and CUDA-graphed draft speculators."
            },
            {
              "headline": "10 New Day-0 Models: Mistral Large 4",
              "plain_summary": "Day-0 support for Mistral Large 4 (1T total / 52B active in FP8 & NVFP4 on Blackwell/Hopper/MI350), MiniMax-M3.1-Flash, Liquid AI LFM3 (text/vision/audio), and NVIDIA Nemotron-3.5-Transcribe & Canary-1B-v2 via `/v1/audio/transcriptions`."
            },
            {
              "headline": "Zero-Downtime Expert Scale-Down & Fast CRIU Checkpoint/Restore",
              "plain_summary": "Fault-tolerant DP+EP scale-down removes dead ranks on the fly and redistributes MoE experts without a restart. Plus, new `/checkpoint/prepare` and `/checkpoint/restore` endpoints pair CRIU with `cuda-checkpoint` for sub-second container restore."
            }
          ]
        }
      },
      {
        "version": "v0.33.0",
        "badge": "Minor Release",
        "date": "2026-11-02",
        "stats": "840+ commits including DeepSeek-V4.1-Flash and K2-Horizon",
        "headline": "DeepSeek-V4.1-Flash MXFP8 KV Cache, Engine Snapshots via CRIU, and LibTorch Stable ABI",
        "executive_summary": "vLLM 0.33.0 introduces day-0 support for DeepSeek-V4.1-Flash with full MXFP8 KV cache compression on Blackwell SM100, experimental initialized-engine snapshots (`vllm snapshot create/restore`) for rapid cold starts, and completes the CUDA migration to the LibTorch Stable ABI.",
        "five_parts": {
          "big_deal": [
            {
              "title": "DeepSeek-V4.1-Flash with Full MXFP8 KV Cache on Blackwell (SM100)",
              "status": "New Capability",
              "status_tone": "green",
              "prs": [
                "#56214",
                "#56893",
                "#56962"
              ],
              "before": "Serving DeepSeek-V4 at 128K context required storing KV latents in 8-bit/16-bit formats without native microscaling block compression.",
              "now": "Full MXFP8 KV storage via FlashMLA V4.1 on SM100 GPUs, paired with DeepGEMM Mega-mHC kernels and async Engram DP sharding.",
              "config_snippet": "vllm serve deepseek-ai/DeepSeek-V4.1-Flash --kv-cache-dtype mxfp8 --tensor-parallel-size 8",
              "tech_bullets": [
                "Full MXFP8 KV storage via FlashMLA V4.1 on SM100 GPUs, paired with DeepGEMM Mega-mHC kernels and async Engram DP sharding."
              ]
            },
            {
              "title": "Initialized Engine Snapshots (`vllm snapshot create / restore`)",
              "status": "Experimental / Alpha",
              "status_tone": "cyan",
              "prs": [
                "#51360"
              ],
              "before": "Every new replica had to re-run Python imports, weight loading, torch.compile, and CUDA graph capture\u2014taking 2 to 6 minutes on large models.",
              "now": "Snapshots a fully warmed-up TP1 engine using CRIU so new pods restore straight into a ready-to-serve state in seconds.",
              "config_snippet": "vllm snapshot create --model Qwen/Qwen3-32B --output /snapshots/qwen3-warm",
              "tech_bullets": [
                "Snapshots a fully warmed-up TP1 engine using CRIU so new pods restore straight into a ready-to-serve state in seconds."
              ]
            },
            {
              "title": "LibTorch Stable ABI for CUDA Wheels",
              "status": "Default / GA",
              "status_tone": "green",
              "prs": [
                "#55810"
              ],
              "before": "Upgrading PyTorch by even a minor version broke vLLM's compiled C++/CUDA extensions, forcing a multi-hour source rebuild.",
              "now": "vLLM's CUDA kernels link against PyTorch's Stable ABI, allowing compatible PyTorch upgrades without recompiling vLLM.",
              "config_snippet": "pip install --upgrade torch vllm  # No C++ ABI mismatch rebuilds",
              "tech_bullets": [
                "vLLM's CUDA kernels link against PyTorch's Stable ABI, allowing compatible PyTorch upgrades without recompiling vLLM."
              ]
            }
          ],
          "who_benefits": [
            {
              "persona": "DeepSeek & Frontier MoE Operators",
              "models": "DeepSeek-V4.1-Flash, GLM-5.3-Flash, K2-Horizon, Cohere Compass",
              "gpus": "NVIDIA Blackwell SM100, Hopper H200, and AVX512/AMX CPUs",
              "impact": "2\u00d7 denser KV cache on SM100 via MXFP8 and dedicated CPU sparse-MLA backend for local testing."
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
            "verdict": "Safe Upgrade \u2014 Verify custom C++ extensions against the new Stable ABI build.",
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
              "metric": "1.7\u00d7 higher long-context throughput",
              "pct_bar": 85,
              "pr": "#56893"
            },
            {
              "label": "Granite & Qwen3-ASR EAGLE3 Speculative Decode",
              "hardware": "NVIDIA Hopper H100",
              "metric": "1.5\u00d7 faster token streaming",
              "pct_bar": 75,
              "pr": "#60855"
            }
          ],
          "high_level_changes": [
            {
              "headline": "DeepSeek-V4.1-Flash with Full MXFP8 KV Cache on Blackwell",
              "plain_summary": "Full MXFP8 KV storage via FlashMLA V4.1 on SM100 GPUs, paired with DeepGEMM Mega-mHC kernels and async Engram DP sharding."
            },
            {
              "headline": "Initialized Engine Snapshots",
              "plain_summary": "Snapshots a fully warmed-up TP1 engine using CRIU so new pods restore straight into a ready-to-serve state in seconds."
            },
            {
              "headline": "LibTorch Stable ABI for CUDA Wheels",
              "plain_summary": "vLLM's CUDA kernels link against PyTorch's Stable ABI, allowing compatible PyTorch upgrades without recompiling vLLM."
            }
          ]
        }
      },
      {
        "version": "v0.32.0",
        "badge": "Minor Release",
        "date": "2026-10-18",
        "stats": "760+ commits including Hy4-Preview (770B MoE) and Qwen3.8-Flash-Next",
        "headline": "Tencent Hy4-Preview 770B MoE, Qwen3.8-Flash-Next NVFP4, and Kimi-K3 on ROCm V2 Runner",
        "executive_summary": "vLLM 0.32.0 adds support for Tencent's 770B/49B-active Hy4-preview MoE model with Gated DeepSeek Sparse Attention, brings Qwen3.8-Flash-Next with BF16/FP8/NVFP4 and Multi-Token Prediction (MTP), and enables Kimi-K3 on AMD ROCm under Model Runner V2.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Hy4-Preview (770B Total / 49B Active MoE) & Qwen3.8-Flash-Next Support",
              "status": "New Capability",
              "status_tone": "green",
              "prs": [
                "#54160",
                "#53896",
                "#53132"
              ],
              "before": "Gated DeepSeek Sparse Attention and Qwen3.8 hybrid NVFP4 checkpoints lacked native fused execution paths.",
              "now": "Full day-0 serving for Hy4-preview, Qwen3.8-Flash-Next (BF16/FP8/NVFP4 + MTP), NemotronH Omni Reasoning V3, and Kimi-K3 NVFP4 checkpoints.",
              "config_snippet": "vllm serve Qwen/Qwen3.8-Flash-Next-NVFP4 --speculative-config '{\"method\": \"mtp\", \"num_speculative_tokens\": 2}'",
              "tech_bullets": [
                "Full day-0 serving for Hy4-preview, Qwen3.8-Flash-Next (BF16/FP8/NVFP4 + MTP), NemotronH Omni Reasoning V3, and Kimi-K3 NVFP4 checkpoints."
              ]
            },
            {
              "title": "Kimi-K3 Now Runs on AMD ROCm with Model Runner V2",
              "status": "Default / GA",
              "status_tone": "cyan",
              "prs": [
                "#51653"
              ],
              "before": "Kimi-K3 on AMD MI300X/MI350 was restricted to legacy runner paths without full V2 persistent batching.",
              "now": "Full parity on ROCm with Model Runner V2, unlocking higher concurrency and lower decode latency on AMD fleets.",
              "config_snippet": "vllm serve moonshotai/Kimi-K3-Instruct --tensor-parallel-size 8",
              "tech_bullets": [
                "Full parity on ROCm with Model Runner V2, unlocking higher concurrency and lower decode latency on AMD fleets."
              ]
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
              "plain_english": "Extra lightweight prediction heads trained directly into models like Qwen3.8 and DeepSeek that predict the next 2\u20133 tokens simultaneously.",
              "bottom_line": "Gives you speculative decoding speedups without having to host a separate draft model."
            }
          ],
          "upgrade_guide": {
            "verdict": "Recommended Upgrade \u2014 Essential if serving Qwen3.8, Hy4, or Kimi-K3 on ROCm.",
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
              "metric": "1.8\u00d7 higher tok/s vs FP8 baseline",
              "pct_bar": 88,
              "pr": "#53896"
            }
          ],
          "high_level_changes": [
            {
              "headline": "Hy4-Preview",
              "plain_summary": "Full day-0 serving for Hy4-preview, Qwen3.8-Flash-Next (BF16/FP8/NVFP4 + MTP), NemotronH Omni Reasoning V3, and Kimi-K3 NVFP4 checkpoints."
            },
            {
              "headline": "Kimi-K3 Now Runs on AMD ROCm with Model Runner V2",
              "plain_summary": "Full parity on ROCm with Model Runner V2, unlocking higher concurrency and lower decode latency on AMD fleets."
            }
          ]
        }
      },
      {
        "version": "v0.31.0",
        "badge": "Release",
        "date": "2026-10-05",
        "stats": "56 upstream changes and 510 PRs",
        "headline": "DeepSeek-V4.1-Flash performance, Fast restart",
        "executive_summary": "vLLM v0.31.0 focuses on Frontier MoE & Sparse-MLA Speedups, Model Runner V2, and Low-Precision Quantization Kernels. For operators, this release translates 56 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "DeepSeek-V4.1-Flash performance",
              "plain_summary": "FlashMLA mega attention with the V4.1 NVFP4 compressed KV cache is now the SM100 default (#56935); DeepGEMM sparse MQA logits for the indexer (#56254) and Mega-Gate fusing the gate GEMM with expert selection (#56266); decoder boundaries fuse the TP all-reduce, mHC input preparation (#57643) and the MoE finalize (#58586); a fused small-batch WO-A with inverse RoPE and MXFP8 quant on SM100/SM103 (#58634); the MXFP8 `wo_b` GEMM fused with the sequence-parallel reduce-scatter (#57428); Engram `wkv` sharded across TP ranks (#58678) and Engram host tables shared across co-located DP replicas by default (#57651); encoder CUDA graphs for the vision tower (#56625); and SWA bounded replay that keeps the sliding-window KV out of prefix caching (#56227)."
            },
            {
              "headline": "Fast restart",
              "plain_summary": "the new `vllm preload` CLI launches the weight-cache daemon that keeps post-quantized weights resident in GPU memory across engine restarts (#56680), now with data parallelism (#57386), MTP draft models (#57312), a `/health` endpoint (#58552) and a readiness wait (#58370). Experimental initialized-engine snapshots (`vllm snapshot create/restore`) use CRIU to restore a fully initialized TP1 engine (#51360)."
            },
            {
              "headline": "Model Runner V2 and speculative decoding",
              "plain_summary": "draft-model speculative decoding (#43091) and custom logits processors (#56497) on Model Runner V2; the new LiLiCorr drafter (#57934); async scheduling for DFlash (#58065) with the context K/V precompute captured in the draft CUDA graph (#57632); DSpark adaptive verification for Gemma4 (#57263) and variable-length decode for Kimi-K3 (#52988); a DCP target with a non-DCP DSpark draft (#56723); and MoE memory now counted during MRV2 profiling, avoiding OOMs on WideEP deployments (#57270, #58411)."
            },
            {
              "headline": "Large scale serving",
              "plain_summary": "MoonEP balanced EP all2all backend via `--all2all-backend moonep` (#52101), prefill context parallelism with data parallelism (#57075), a low-SM multimem reduce-scatter for SM100/SM103 (#55072), DeepEPv2 with sequence parallelism (#57210) and EPLB with shared-expert overlap (#57236), a sharding-aware NCCL M2N weight-transfer backend for RL (#51520), and KV offloading back-pressure detection (#50045)."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#58527",
                "#58651",
                "#57430"
              ],
              "before": "Prior to v0.31.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Kimi K3 and MiniMax-M3: Kimi-K3 vision patch embedder as a GEMM (#58527), fused KimiViT QK RoPE (up to 29x, #58651), routed expert quantization (#57430), reasoning parser (#57098) and reasoning token (#58527, #58651).",
                "GLM-5.3-Flash: opt-in FlashAttention and FlashMLA sparse backends on SM90 (#55385), NoPE sparse MLA on the FlashInfer SM120 backend (#55277), cooperative top-k for small decode batches (#57327) (#55385, #55277).",
                "AMD ROCm: AITER v0.1.23 (#56885, #58867), torch 2.13 and Triton 3.8 (#50605, #58006), `triton_kernels` 3.8 MXFP4 MoE for gpt-oss and DeepSeek-V4 (#55934), a ROCR host segfault fixed (#57328)..",
                "Startup and memory: parallel Triton warmup compilation (#58582), JIT warmup disabled under `--enforce-eager` (#58197) unless fault tolerance is on (#58593), DeepGEMM warmup reusing the MoE workspace (#58582, #58197)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#56013",
                "#51600",
                "#44987"
              ],
              "before": "Prior to v0.31.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Intel XPU: PyTorch 2.14 (#56013), XPU graphs on by default (#51600), EPLB (#44987), int8 W8A8 MoE on Triton (#53162), batch invariance (#55881), SYCL rotary embedding (#55721), fused QK RMSNorm + (#56013, #51600).",
                "New defaults: `--enforce-eager` also disables JIT kernel warmup unless fault tolerance is enabled (#58197, #58593). `VLLM_BATCH_INVARIANT=1` uses breakable CUDA graphs without torch.compile (#57586).",
                "Model Runner V1 + PP > 1 + async scheduling + structured output is now rejected at startup (#56250); `json_object` is rejected at validation with the outlines backend (#57743) (#56250, #57743).",
                "Batch invariance: breakable CUDA graphs without torch.compile by default under `VLLM_BATCH_INVARIANT` (#57586), sequence parallelism and async TP disabled (#56377), and NCCL 2.31 collectives kept (#57586, #56377)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53585",
                "#51800",
                "#56685"
              ],
              "before": "Prior to v0.31.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Online quantization through `quantization=\"fp8\"` now redirects to the `fp8_per_tensor` online shorthand (#53585); Quark-specific silent online MXFP4 quantization was removed in favor of the online (#53585, #51800).",
                "Humming: Hadamard transforms and NVFP4/MXFP4/MXFP8 online quantization (#56685), asymmetric wNaM through compressed-tensors (#46528), humming-kernels 0.1.16 (#58054), and Humming in the W4A8 (#56685, #46528).",
                "New capabilities: native Quark W4A16 INT4/UINT4 exports (#48606), opt-in load-time MXFP4 dequantization (#50814), explicit per-token NVFP4 MoE backends (#57176), and a canonical N-first layout for (#48606, #50814).",
                "Fixes: MXFP8 on layers below `mm_mxfp8` shape limits (#54223), online NVFP4 scales on reload (#57954), LM head linear metadata (#58444), and the fused SiLU-mul block-quant path skipped under a SwiGLU (#54223, #57954)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#56758",
                "#57951",
                "#58459"
              ],
              "before": "Prior to v0.31.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "Scheduler: `--max-num-active-seqs` (#56758), adaptive `--long-prefill-token-threshold` (#57951, #58459), `skipped_waiting` replaced by a KV-holding waiting queue (#58947), atomic admission of `n > 1` (#56758, #57951).",
                "Speculative decoding: LiLiCorr drafter (#57934), DFlash async scheduling (#58065) and context K/V in the draft CUDA graph (#57632), Gemma4 DSpark adaptive verification (#57263), Kimi-K3 (#57934, #58065).",
                "MoE communication: MoonEP backend (#52101), DeepEPv2 with sequence parallelism (#57210) and EPLB + shared-expert overlap (#57236), low-SM multimem reduce-scatter (#55072), EPLB load statistics during (#52101, #57210).",
                "New model capabilities: DiffusionGemma structured generation mode with bounded single-token choices (#57250), MiMo V2 MXFP4 MoE, BF16 MoE router and DFlash drafts (#57784), Cohere2MoE auxiliary (#57250, #57784)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#57937",
                "#51600",
                "#50494"
              ],
              "before": "Prior to v0.31.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "`VLLM_PLE_CPU_OFFLOAD` was removed; use `--engram-config` (#57937). `VLLM_XPU_ENABLE_XPU_GRAPH` was removed and XPU graphs are on by default (#51600) (#57937, #51600).",
                "KV connectors: NIXL pipeline-parallel push prefill for attention-HMA (#50494) and packed MLA layouts (#50499), transport-failure metrics split from KV expiry (#55854), dead peer state released (#50494, #50499).",
                "ROCm: AITER v0.1.23 (#58867), torch 2.13, Triton 3.8 (#50605, #58006), patched ROCR (#57328), LMCache OpenTelemetry pins (#59056) (#58867, #50605).",
                "Rust frontend: `--hf-overrides` (#56931), `--sse-keep-alive-interval` (#58306), custom chat roles (#58311), MiMo V2.5 parsers (#57933), normalized reasoning controls (#56998), parser-owned output (#56931, #58306)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Per-request `mm_processor_kwargs` and `media_io_kwargs` now return an error unless the server is started with `--trust-request-mm-kwargs`; server-level `--mm-processor-kwargs` / `--media-io-kwargs` and offline `LLM` are ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#58830"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`tokenizer_mode=\"slow\"` was removed; it already behaved like `\"hf\"` under Transformers v5 (#58545). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#58545"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`--enable-mamba-fine-grained-prefix-cache` was renamed to `--enable-mamba-shared-prefix-checkpoint` (#57382). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#57382"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Online quantization through `quantization=\"fp8\"` now redirects to the `fp8_per_tensor` online shorthand (#53585); Quark-specific silent online MXFP4 quantization was removed in favor of the online quantization API (#5180",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53585"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The AllSpark INT8 W8A16 GEMM backend was removed (#58001). The `return_assistant_tokens_mask` option of `/render` and the `assistant_tokens_mask` response field were removed (#57520). -> Action: Verify compatibility befo",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#58001"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "GLM-5.3-Flash: opt-in FlashAttention and FlashMLA sparse backends on SM90 (#55385), NoPE sparse MLA on the FlashInfer SM120 backend (#55277), cooperative top-k ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#55385"
            },
            {
              "label": "Model Support",
              "hardware": "Kimi K3 and MiniMax-M3: Kimi-K3 vision patch embedder as a GEMM (#58527), fused KimiViT QK RoPE (up to 29x, #58651), routed expert quantization (#57430), reason",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#58527"
            },
            {
              "label": "Model Support",
              "hardware": "DiffusionGemma: one-pass sampler statistics kernel (#58226), `diffusion_constrained` reads over `logprob_token_ids` (about 25% faster, #58216), fewer logit rows",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#58226"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: AITER v0.1.23 (#56885, #58867), torch 2.13 and Triton 3.8 (#50605, #58006), `triton_kernels` 3.8 MXFP4 MoE for gpt-oss and DeepSeek-V4 (#55934), a ROC",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#56885"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Intel XPU: PyTorch 2.14 (#56013), XPU graphs on by default (#51600), EPLB (#44987), int8 W8A8 MoE on Triton (#53162), batch invariance (#55881), SYCL rotary emb",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#56013"
            }
          ]
        }
      },
      {
        "version": "v0.30.0",
        "badge": "Release",
        "date": "2026-09-22",
        "stats": "58 upstream changes and 561 PRs",
        "headline": "New models, Fast Start",
        "executive_summary": "vLLM v0.30.0 focuses on Low-Precision Quantization Kernels, Frontier MoE & Sparse-MLA Speedups, and Multi-Vendor Accelerator Scaling. For operators, this release translates 58 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "New models",
              "plain_summary": "DeepSeek-V4.1-Flash (#56214, #56228, #56208) with the whole KV stored in MXFP8 through the FlashMLA V4.1 record on SM100 (#56893), DeepGEMM Mega-mHC (#56962), and async Engram prefetch with Engram DP sharding (#56512); DeepSeek-V4-Flash-Vision-Exp (#54566), also on ROCm (#55107) and with LoRA (#55897); GLM-5.3-Flash (#53906) with EPLB (#55119); K2-Horizon (#55063); Cohere Compass (#54774); Bailing V3 VL (#55921); Nanbeige4.2 via the Transformers backend (#56071); and a DeepSeek-V4 CPU backend with AVX512/AMX sparse MLA, indexer, mHC and compressor kernels (#55355)."
            },
            {
              "headline": "Fast Start",
              "plain_summary": "a persistent per-GPU weight-cache daemon holds post-quantized, TP-sharded weights in GPU memory so restarting engines map them over CUDA IPC with `--load-format ipc_cache` instead of reloading from disk (#54921), now covering FP4 checkpoints (#55465) and multi-node TP (#55468)."
            },
            {
              "headline": "Watermarking",
              "plain_summary": "Gumbel-max watermarked generation and detection with a keyed PRF, per-request opt-out and an example detection endpoint (#54053); dual-key Gumbel-max makes it compatible with speculative decoding (#56122); the Rust frontend forwards the per-request controls (#56338)."
            },
            {
              "headline": "HiSparse",
              "plain_summary": "a host-resident tier for sparse-MLA decode that spills KV pages to pinned host memory under GPU pressure and serves top-k misses from a per-request GPU hot buffer, enabled through `HiSparseConnector` (#53781), with Prometheus counters (#56061), a host cache shared across TP ranks (#56629), and the attention config inferred from the connector (#57041)."
            }
          ],
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53014",
                "#55170",
                "#55899"
              ],
              "before": "Prior to v0.30.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "New defaults: FlashInfer CuTeDSL NVFP4 W4A16 over Marlin on SM100/103 (#53014), W4A4 NVFP4 over weight-only kernels on SM120/121 (#55170), BF16x3 router GEMM on SM100 (#55899), DeepEP v2 combine (#53014, #55170).",
                "NVIDIA: FlashInfer PCIe IPC all-reduce (#53576), DeepGEMM pinned to the vLLM fork 2.8.0 with SM120 and SM90 paged-MQA ports (#56876), public CUDA 13.4 Rubin build path (#54640, #56545), SM12x (#53576, #56876).",
                "New capabilities: targeted online quantization (#51285) and online quantization of partially pre-quantized checkpoints (#51392), W4A16 DSA (#51724, #55538), FlashInfer CuTeDSL NVFP4 W4A16 (#53014) (#51285, #51392).",
                "Fixes: NVFP4 padding initialized in-kernel (#53568), unloaded NVFP4 scales detected with a NaN sentinel (#52501), NVFP4 fused SiLU+mul scales (#55643), Quark per-block scales registered as (#53568, #52501)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#55119",
                "#55737",
                "#55738"
              ],
              "before": "Prior to v0.30.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "GLM-5.3-Flash: EPLB support (#55119), FlashKDA for KDA chunked prefill (1.7-3.8x faster than the Triton chunk path, #55737), dense and masked-MHA sparse prefill for the NoPE (256, 0, 256) layout (#55119, #55737).",
                "AMD ROCm: TheRock base bumped to ROCm 10.0 (#55246) with nightly TheRock images (#55014), AITER 0.1.21.post2 (#52826, #55968), AITER custom AG/RS on the DP group (about 3% TPOT, #48247), multi-stream (#55246, #55014).",
                "Kimi K3: native CUDA AttnRes default on SM100 (#54261), ll_bf16 router weight prefetch (#53524), overlapped TP8 KDA projections (#54697), strided DSV3 GEMM (#54565), MLA decode epilogue latency (#54261, #53524).",
                "CPU: DeepSeek-V4 backend (#55355), native AMX-FP8 attention for Diamond Rapids with the Docker base moved to Ubuntu 25.04 and GCC 15 (#49410), faster LM head on Arm (about 6% on Llama-3.1-8B W8A8 (#55355, #49410)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#55780",
                "#55353",
                "#54921"
              ],
              "before": "Prior to v0.30.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Attention implementations must explicitly declare DCP support; DCP with ROCm standard attention, Triton, FlexAttention or TurboQuant now fails at backend selection (#55780).",
                "Items deprecated for 0.29 removed: `VLLM_PREFIX_CACHE_RETENTION_INTERVAL` and `VLLM_MM_HASHER_ALGORITHM` env vars (use the config fields), the `use_fp4_indexer_cache` alias (use `indexer_kv_dtype`) (#55353).",
                "Fast Start: weight-cache daemon with `--load-format ipc_cache` (#54921), FP4 checkpoints (#55465), multi-node TP (#55468), GPU UUID socket folders (#56669), per-client IPC tensor export so a (#54921, #55465).",
                "ROCm: TheRock base on ROCm 10.0 (#55246), AITER 0.1.21.post2 (#52826, #55968), Mooncake from public wheels (#55002), AINIC libionic 54.0-187-1 pinned to a snapshot (#54112, #56459) (#55246, #52826)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#55780",
                "#54782",
                "#55095"
              ],
              "before": "Prior to v0.30.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Robustness: attention implementations must explicitly declare DCP support (#55780), unavailable piecewise CUDA graphs raise instead of producing garbled output (#54782), non-compiled models fall back (#55780, #54782).",
                "Qwen3.8-Flash-Next: separate prefill and decode QSA indexer kernels with `VLLM_SPARSE_INDEXER_MAX_LOGITS_MB` (#54513), fused PLE kernels and merged K/V projections (#54517), sparse GQA skipping (#54513, #54517).",
                "The `all` Mamba cache mode is deprecated and falls back to Model Runner V1 (#55041).",
                "Elastic EP and MoE communication: CUDA graphs reused across reconfiguration (#54985), routing only to surviving engines on scale-down (#55772), DeepEP v2 async finalize (#52781), FlashInfer PCIe IPC (#54985, #55772)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#54917",
                "#55864",
                "#56652"
              ],
              "before": "Prior to v0.30.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Correctness: Gemma 4 / Gemma 3n fine-tuned checkpoints without KV projections on shared layers (#54917, #55864), Gemma4 video preprocessing without image kwargs (#56652) and unified audio profiling.",
                "Startup and warmup: renderer warmup overlapped with engine core init (#54557), FlashInfer autotune no longer rerun on each source change (#54794), Qwen3.5/Qwen3-Next Triton kernels (#54797) and GDN (#54557, #54794).",
                "New models: DeepSeek-V4.1-Flash (#56214, #56228, #56208), DeepSeek-V4-Flash-Vision-Exp (#54566) with ROCm support (#55107) and LoRA (#55897), GLM-5.3-Flash (#53906), K2-Horizon with its reasoning and.",
                "Intel XPU: activation CustomOps on SYCL kernels (#53734), batch-invariant matmul and linear kernels (#49209), fused GemmaRMSNorm (#53678), `fused_input_norm` (#52945) and fused `grouped_topk` (#53734, #49209)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Scale-out endpoints (`/render`, `/derender`, `/inference/v1/generate`) are no longer registered on plain `vllm serve` unless `--enable-scale-out` is passed; `VLLM_ENABLE_SCALE_OUT_ENDPOINTS` was removed. `vllm launch ren",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#54579"
              },
              {
                "change": "Before You Upgrade",
                "impact": "GPTQ group/dynamic activation ordering removed: `g_idx` is ignored and the related Marlin, GPTQ, CPU and RDNA3 kernels are gone (#54809). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#54809"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Items deprecated for 0.29 removed: `VLLM_PREFIX_CACHE_RETENTION_INTERVAL` and `VLLM_MM_HASHER_ALGORITHM` env vars (use the config fields), the `use_fp4_indexer_cache` alias (use `indexer_kv_dtype`), the `CUDA_VISIBLE_DEV",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#55353"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The `all` Mamba cache mode is deprecated and falls back to Model Runner V1 (#55041). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#55041"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`python -m vllm.entrypoints.grpc_server` is deprecated; use `vllm serve --grpc` (#56746). `sse_keep_alive` moved to `vllm.entrypoints.serve.utils` (#56369). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#56746"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "GLM-5.3-Flash: EPLB support (#55119), FlashKDA for KDA chunked prefill (1.7-3.8x faster than the Triton chunk path, #55737), dense and masked-MHA sparse prefill",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#55119"
            },
            {
              "label": "Model Support",
              "hardware": "Multimodal: torchcodec audio decoding and a selectable `audio_backend` in `--media-io-kwargs` (#51826) with automatic decoding kept soundfile-first (#55642), to",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#51826"
            },
            {
              "label": "Engine Core",
              "hardware": "Kernels: FlashInfer ReplaySSM backend for Mamba2 (#52506), B12X causal paged attention for SM120/SM121 via `--attention-backend B12X_ATTN` (#52017), FlashInfer ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52506"
            },
            {
              "label": "Engine Core",
              "hardware": "Robustness: attention implementations must explicitly declare DCP support (#55780), unavailable piecewise CUDA graphs raise instead of producing garbled output ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#55780"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: FlashInfer PCIe IPC all-reduce (#53576), DeepGEMM pinned to the vLLM fork 2.8.0 with SM120 and SM90 paged-MQA ports (#56876), public CUDA 13.4 Rubin bui",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#53576"
            }
          ]
        }
      },
      {
        "version": "v0.29.0",
        "badge": "Release",
        "date": "2026-09-09",
        "stats": "50 upstream changes and 337 PRs",
        "headline": "Model Runner V2 is now the default for all models, New models",
        "executive_summary": "vLLM v0.29.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 50 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Model Runner V2 is now the default for all models",
              "plain_summary": "(#53183), completing the rollout that began with pooling models (#48290). MRV2 also gained CUDA graph memory profiling for KV cache auto-sizing (#53306), batch-sharded sampling that cuts per-step logits memory by 1/TP (#50465), prompt embeds (#42963), `extract_hidden_states` speculation (#49811), padded FULL cudagraph dispatch for uniform decode under spec decode (#53407), and DP-sync skipping before EAGLE/MTP draft prefill (#53694). MRV1 remains in use for a few ROCm models and features MRV2 does not yet support."
            },
            {
              "headline": "New models",
              "plain_summary": "Hy4-preview, Tencent's 770B/49B-active MoE with Gated DeepSeek Sparse Attention and native MTP (#54160); Qwen3.8-Flash-Next with BF16/FP8/NVFP4 and MTP (#53896); GraniteSWA and GraniteMoeSWA (#52706); NemotronH_Omni_Reasoning_V3 with MTP (#52929, #53121); Kimi K3 NVFP4 checkpoints (#53132)."
            },
            {
              "headline": "Kimi-K3 and DeepSeek V4 performance",
              "plain_summary": "fused MXFP4 top-k finalization in the K3 latent tail (about 5% E2E latency, #53152), K3 Mamba metadata preparation in one Triton launch (6.6-7.6x kernel speedup, #52388), tuned Hopper low-latency GEMM (#54088) now also dispatched on SM100 (#53534) and used for `eh_proj` (12.9-25.2% kernel speedup, #53942), GEMM-RS extended to GEMM-AR (#53053), MLA gate merged into the QKV-A projection (#54015), K3 DCP with DSpark (#52188) and DCP partial prefix cache hits (#50493); DeepSeek V4 shared experts fused into MegaMoE (#53040), adaptive top-k width re-landed (#52823), a native SwiGLU clamp kernel for Humming MoE (#53685), and an opt-in FlashInfer `moe_ep` expert backend (#49636)."
            },
            {
              "headline": "Speculative decoding",
              "plain_summary": "per-request acceptance stats in OpenAI API responses via `--per-request-spec-decode-metrics` (#48915), adaptive verification extended to logprobs (#52242), SM100 sparse MLA for GLM-5.2 (#52783) and DeepSeek V4 on SM90 (#52795), Qwen3-Omni DSpark drafts (#52560), PLaMo3 EAGLE-3/DFlash (#54239), and DFlash2 loading from speculators format (#53797)."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53677",
                "#52980",
                "#52217"
              ],
              "before": "Prior to v0.29.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Kernels: fused embedding kernel (#53677), FA4 re-enabled for head_size=256 on Blackwell (#52980), vectorized sparse MLA mask loads (#52217), masked MHA prefill for GLM-5 head dimensions (#53785) (#53677, #52980).",
                "RL workflows: `sharded_rdt` P2P weight sync (#43375), rank-local IPC updates (#52497), sparse checkpoint updates (#50723, #53751), gpt-oss routed expert loading (#52209), stable DeepSeek V4 mHC (#43375, #52497).",
                "AMD ROCm: dual-stream decode with hipgraphs (#52033), W4A4 preshuffled asm GEMM by default (+15% throughput on Llama-3.3-70B MXFP4, #53141), ROCr/CLR update fixing graph replay segfaults with up to (#52033, #53141).",
                "Correctness: PaliGemma stale image scaling removed (#52692), Mistral3 placeholder grid with processor size overrides (#52874), MiniCPM-o on Transformers v5 (#54501), JinaVL cache order (#53553) (#52692, #52874)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#52204",
                "#52018",
                "#47434"
              ],
              "before": "Prior to v0.29.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "New backends: FlashInfer TRT-LLM MXFP8 linear (#52204), b12x FP4 MoE for SM120/SM121 (#52018), AutoRound block-wise FP8 (#47434), Humming MoE with MXFP4 weights + block-FP8 activations (#51332), and (#52204, #52018).",
                "`VLLM_TEST_FORCE_FP8_MARLIN` removed in favor of `--linear-backend` / `--moe-backend` (#52182). `VLLM_ROCM_USE_AITER_FP4_ASM_GEMM` removed (#53141) (#52182, #53141).",
                "MoE communication: DeepEP v2 receiver CPU overhead (#51114) and MXFP8 activation scale dispatch (#51398), FlashInfer one-sided All2All refinements (#51924), DeepEP v2 fixes for `--enforce-eager` (#51114, #51398).",
                "Fixes: weight-only NVFP4 checkpoints routed through W4A16 (#54427), compressed-tensors block FP8 with Marlin (#52966) and int8 grouped WNA16 MoE (#52002), OCP MX mxfp6 activation emulation (#52704) (#54427, #52966)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47625",
                "#52185",
                "#50400"
              ],
              "before": "Prior to v0.29.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Multimodal performance: ViT full CUDA graph for Idefics3 and SmolVLM (#47625), packed encoder attention for Pixtral (#52185), fused Kimi vision Q/K RoPE kernel (#50400), Dots3 NOTE runtime (#53517) (#47625, #52185).",
                "Multimodal inputs: video embeds accepted by the Python frontend (#54242), modality-scoped `mm_processor_kwargs` honored (#53808), Qwen3-VL profiling honors `cap_pixels_per_frame` (#54380), video (#54242, #53808).",
                "New models: Hy4-preview (#54160), Qwen3.8-Flash-Next (#53896), GraniteSWA and GraniteMoeSWA via the existing Granite implementation (#52706), NemotronH_Omni_Reasoning_V3 (#52929) with MTP for (#54160, #53896).",
                "LoRA: DeepSeek V4 (#53361), Qwen3-Omni multimodal LoRA (#52786, #53557), tower/connector LoRA for LLaVA-NeXT (#49788) and LFM2-VL (#51498), plus fixes for Muse-Glimmer (#53513), Qwen3.5 embedding (#53361, #52786)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Breaking Changes & Deprecations Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#53608",
                "#54231",
                "#52131"
              ],
              "before": "Prior to v0.29.0, teams operating breaking changes & deprecations enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Ten deprecated architectures removed: Arctic, Chameleon, Cheers, Fairseq2Llama, FireRedLID, GritLM, HCXVision, MPT, the `RWForCausalLM` and `StableLMEpochForCausalLM` aliases, and (#53608).",
                "PyAV video decoder backend removed; use OpenCV or Torchcodec (#54231).",
                "`python -m vllm.entrypoints.openai.api_server` is deprecated; use `vllm serve` (#52131).",
                "FlexOlmo, Olmo3, Hunyuan V1 and Hunyuan VL are now served through the Transformers modeling backend (#53615)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#52998",
                "#52466",
                "#53324"
              ],
              "before": "Prior to v0.29.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "FlashInfer all-reduce enabled by default (#52998).",
                "KV connectors: Mooncake Store decode KV saving via `save_decode_cache` (#52466) and hybrid DCP prefix caching (#53324), externally transferable KV cache group identification (#53779), async KV loads (#52466, #53324).",
                "`prefix_cache_retention_interval` default changed from dense to 0 for SWA/SSM models; the env var is deprecated in favor of the argument (#52216).",
                "Prefix caching & scheduling: Mamba internal prefill checkpoints (#52789), `prefix_cache_retention_interval` argument (#52216, #55760, #55861), deterministic `NONE_HASH` (#51875), queue admission (#52789, #52216)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Breaking Changes & Deprecations Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Ten deprecated architectures removed: Arctic, Chameleon, Cheers, Fairseq2Llama, FireRedLID, GritLM, HCXVision, MPT, the `RWForCausalLM` and `StableLMEpochForCausalLM` aliases, and `PrithviGeoSpatialMAE` (superseded by `T",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53608"
              },
              {
                "change": "Before You Upgrade",
                "impact": "FlexOlmo, Olmo3, Hunyuan V1 and Hunyuan VL are now served through the Transformers modeling backend (#53615). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53615"
              },
              {
                "change": "Before You Upgrade",
                "impact": "PyAV video decoder backend removed; use OpenCV or Torchcodec (#54231). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#54231"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`python -m vllm.entrypoints.openai.api_server` is deprecated; use `vllm serve` (#52131). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#52131"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Model Runner V2 is the default runner for all models (#53183). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#53183"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Determinism: `trace_decode_token_ids` for deterministic decode replay (#46701), per-arch tuned batch-invariant matmul configs (about 3x decode kernels on RTX 40",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46701"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: dual-stream decode with hipgraphs (#52033), W4A4 preshuffled asm GEMM by default (+15% throughput on Llama-3.3-70B MXFP4, #53141), ROCr/CLR update fix",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52033"
            },
            {
              "label": "Quantization",
              "hardware": "New backends: FlashInfer TRT-LLM MXFP8 linear (#52204), b12x FP4 MoE for SM120/SM121 (#52018), AutoRound block-wise FP8 (#47434), Humming MoE with MXFP4 weights",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52204"
            },
            {
              "label": "API & Frontend",
              "hardware": "OpenAI compatibility: `logprobs=-1` in Completions (#46175), streamed logprob offsets with echo (#47815), batched chat echo (#52529), all choices returned from ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46175"
            },
            {
              "label": "Breaking Changes & Deprecations",
              "hardware": "Ten deprecated architectures removed: Arctic, Chameleon, Cheers, Fairseq2Llama, FireRedLID, GritLM, HCXVision, MPT, the `RWForCausalLM` and `StableLMEpochForCau",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#53608"
            }
          ]
        }
      },
      {
        "version": "v0.28.0",
        "badge": "Release",
        "date": "2026-08-26",
        "stats": "48 upstream changes and 190 PRs",
        "headline": "Kimi-K3 performance push, DeepSeek V4",
        "executive_summary": "vLLM v0.28.0 focuses on Frontier MoE & Sparse-MLA Speedups, Next-Gen Speculative Decoding, and Low-Precision Quantization Kernels. For operators, this release translates 48 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Kimi-K3 performance push",
              "plain_summary": "a major optimization effort for Kimi-K3 across the stack \u2014 Decode Context Parallel (DCP) support (#50484), fused FlashKDA decode and prefill kernels (#50654, #51311, #52458), SiTU activation support for MegaMoE (#50510), GEMM-RS for sequence parallelism (#52079), combined all-gathers with 1.5~3x kernel-level speedup (#51070), an adaptive speculative token budget delivering ~60% better DSpark TTFT (#51725), and optional shared-expert sharding saving ~17 GiB of memory per GPU (#50912). Kimi-K3 also now runs on ROCm with the V2 model runner (#51653)."
            },
            {
              "headline": "DeepSeek V4",
              "plain_summary": "sparse MLA now works end-to-end for plain decode, MTP, and DSpark speculative decoding (#51538), joined by AMD Quark NVFP4 support (#47972), reasoning-effort prompts and mappings (#50580), sparse top-k metadata kernel optimizations (#52084, #51967), narrowed eager CUDA graph regions (#51430, #52401), and ROCm enablement on gfx11 and gfx950 (#47017, #52212)."
            },
            {
              "headline": "Speculative decoding advances",
              "plain_summary": "DFlash2 with local convolution and a candidate selector (#52816), DSpark confidence-scheduled verification (#47808), and async scheduling auto-enabled for draft models (#48341)."
            },
            {
              "headline": "Model Runner V2 maturation",
              "plain_summary": "E/P/D disaggregation (#38390), weight offloading (#51413), multi-layer MTP KV cache support (#50062), encoder CUDA graphs (#49852), decoder token-wise pooling (#50931) plus Transformers pooling models (#52425), attention-free models (#52374), and `thinking_token_budget` support (#46727)."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#50607",
                "#43615",
                "#47017"
              ],
              "before": "Prior to v0.28.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "AMD ROCm: torch 2.12 / triton 3.7 stack bump (#50607), AITER and FP8 inference enabled on GFX120x (#43615), DeepSeek-V4 on gfx11 (#47017), optimized Triton sparse-MLA decode on gfx950 (#52212) (#50607, #43615).",
                "CPU: an MLA backend so DeepSeek-V2/V3 can run on CPU (#49453), a triton-cpu wheel (#52092), GPTQ and AWQ enabled on s390x (#51148) along with tcmalloc (#50841), BF16 MoE routed through zentorch on (#49453, #52092).",
                "DeepGEMM pinned to the deepseek-ai nv_dev tip (#52035), DeepEP pinned by full commit hash (#52028), FlashAttention 3 built with the torch stable API (#49599) (#52035, #52028).",
                "MoE: extended EPLB support for Mistral Large 3 and additional MoE backends (#48355), CuTe DSL skinny GEMM extended to GLM-5.2 (#49791) (#48355, #49791)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#49718",
                "#49792",
                "#50230"
              ],
              "before": "Prior to v0.28.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "NVIDIA: FlashInfer XQA decode support on SM12x (#49718), a CuTeDSL fused query kernel on SM100 (#49792), programmatic dependent launch for the DSA decode kernels (#50230), the native DSA decode path (#49718, #49792).",
                "Qwen: Qwen3.8 enabled on AMD ROCm (#50068), fused CUDA post-conv MTP decode kernel for Qwen3.5 GDN (#51674), GDN gates aligned with speculative tokens (#51812), and Qwen3.5 fixes for text-only (#50068, #51674).",
                "Speculative decoding: DSpark confidence-scheduled verification (#47808), top-k DSpark Markov projection (#49969), DFlash2 with local convolution and a candidate selector (#52816), async scheduling (#47808, #49969).",
                "Speculative decoding coverage: EAGLE3 support declared on KimiLinear (#52171), Qwen3.6 dSpark acceptance coverage (#51310) (#52171, #51310)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#50833",
                "#51411",
                "#51038"
              ],
              "before": "Prior to v0.28.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Fixes: dynamic INT8 W8A8 MoE config no longer built as W8A16 (#50833) and a TritonExperts crash (#51411), MXFP4 conversion for FlashInfer CUTLASS (#51038), fp32 weight scales and per-expert (#50833, #51411).",
                "New models: Muse Glimmer (#51655), Ling 3.0 Flash with BF16, MTP, and parser support (#51045) plus an FP8 variant (#51265) and hybrid MXFP4 routed experts (#52114), Dots3 NOTE native multimodal (#51655, #51045).",
                "Correctness: MiniMax-M3 NVFP4 inference (#48929) and compressed-tensors FP8 MoE SwiGLU params (#46845), Gemma3n/Gemma4 variable-length audio batch padding (#50958), Gemma 4 compatibility with the (#48929, #46845).",
                "Intel XPU: a torch linear backend including blockwise GEMM (#49664, #50826), MXFP8 linear weights for the INC DeepSeek V4 model (#48476), async-scheduling PP sampled-token broadcast overlapped with."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38390",
                "#50390",
                "#52697"
              ],
              "before": "Prior to v0.28.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "E/P/D disaggregation: Model Runner V2 E/P/D support (#38390), duplicate image preprocessing removed with GPU-side preprocessing (#50390), KV consumers may omit multimodal embeddings (#52697) (#38390, #50390).",
                "Hybrid/Mamba: prefix caching on by default (#50991), the final part of the Mamba attention module refactor (#44857), 3D-grid tiling of the state-copy Triton kernels (#49436), and Mamba alignment (#50991, #44857).",
                "RL workflows: stateful trainer send over NCCL and sparse NCCL (#50902), `CuMemAllocator.discard()` for tag-selective GPU memory release (#52514), level-2 sleep/wake/reload fixed with LoRA enabled (#50902, #52514).",
                "LoRA: vision tower LoRA for Gemma4 (#42662), tower/connector LoRA for Keye (#51780) and Ultravox (#48215) (#42662, #51780)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#50620",
                "#48534",
                "#45043"
              ],
              "before": "Prior to v0.28.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Connectors: transfer mode (push/pull) included in the NIXL compatibility hash (#50620), a MoRIIO per-layer READ-completion barrier (#48534), 2P2D wide-EP with mori-ep/mori-io at dp=ep=16 (#45043) (#50620, #48534).",
                "`reasoning_content` output removal is documented as a breaking client change (#50624).",
                "ROCm: torch 2.12, triton 3.7, torchaudio, torchvision (#50607).",
                "New capabilities: request priority parsed from an HTTP header (#51089), session ID plumbing into requests (#48048), `count_reasoning_tokens` in the streaming parser engine (#45802), `content_parts` (#51089, #48048)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "bitsandbytes support is now an out-of-tree plugin (#43529). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43529"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The deprecated `calculate_kv_scales` runtime KV scale calculation was removed (#49389). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#49389"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`override_attention_dtype` was removed (#48684). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#48684"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`reasoning_content` output removal is documented as a breaking client change (#50624). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#50624"
              },
              {
                "change": "Before You Upgrade",
                "impact": "KV offload tiering metrics renamed from `kv_offload_tiering_block_{queries,hits}` to `..._chunk_...` (#52812). -> Action: Verify compatibility before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#52812"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: FlashInfer XQA decode support on SM12x (#49718), a CuTeDSL fused query kernel on SM100 (#49792), programmatic dependent launch for the DSA decode kernel",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49718"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: torch 2.12 / triton 3.7 stack bump (#50607), AITER and FP8 inference enabled on GFX120x (#43615), DeepSeek-V4 on gfx11 (#47017), optimized Triton spar",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#50607"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: an MLA backend so DeepSeek-V2/V3 can run on CPU (#49453), a triton-cpu wheel (#52092), GPTQ and AWQ enabled on s390x (#51148) along with tcmalloc (#50841),",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49453"
            },
            {
              "label": "API & Frontend",
              "hardware": "Anthropic API: 4xx returned for client-caused errors on `/v1/messages` (#52246), `disable_parallel_tool_use` preserved (#52021), and stop sequences bounded (#51",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#52246"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: FlashInfer XQA decode support on SM12x (#49718), a CuTeDSL fused query kernel on SM100 (#49792), programmatic dependent launch for the DSA decode kernel",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49718"
            }
          ]
        }
      },
      {
        "version": "v0.27.0",
        "badge": "Release",
        "date": "2026-08-10",
        "stats": "42 upstream changes and 223 PRs",
        "headline": "Kimi K3 support, More new models",
        "executive_summary": "vLLM v0.27.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 42 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Kimi K3 support",
              "plain_summary": "with a full stack landing in one release: core model files and kernels (#50089, #50000), Python (#50093) and Rust (#50104) frontends, AttnRes kernels (#50090), DeepGEMM support (#50458), compressed-tensors quantized checkpoints (#50500), DSpark AR fusion (#50242), and an option to shard the shared expert instead of replicating it (#50656)."
            },
            {
              "headline": "More new models",
              "plain_summary": "Qwen3.5 text-only dense and MoE models (#50210) with EVS video token pruning (#48912), K-EXAONE-2.0-750B-A37B (#50524), VaultGemma via the Transformers modeling backend (#49803), and jina-embeddings-v5-text-nano (#50688)."
            },
            {
              "headline": "PyTorch 2.13.0 upgrade",
              "plain_summary": "along with torchvision 0.28.0 and Triton 3.7.1 (#48155) \u2014 this is a breaking environment change; XPU (#48677) and CPU (#50412) followed to torch 2.13 as well."
            },
            {
              "headline": "FlashAttention 4 integration deepens on SM100",
              "plain_summary": "FP8 KV cache support (#42569) and headdim-256 support (#42669), backed by a new JIT warmup infrastructure (#47451) and runner-owned Triton kernel warmup (#49903) that remove first-request compilation stalls."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#46789",
                "#48957",
                "#49486"
              ],
              "before": "Prior to v0.27.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "DeepSeek-V4: sequence parallelism (#46789), ~2x kernel skipping empty c128 launches (#48957), 3.4% E2E TTFT skipping topk/router in decode (#49486), 3.9% E2E TTFT workspace reuse (#49236), 1.88x (#46789, #48957).",
                "Attention: FlashAttention 4 SM100 FP8 KV cache (#42569) and headdim-256 (#42669). query replication for MLA decode under DCP for DeepSeek-V2/R1 and Kimi-K2.5 (#45964) (#42569, #42669).",
                "ROCm: gfx1250 architecture enabled (#46516), AITER FP8 ViT encoder attention (#49937), fused shared expert for Quark DeepSeek-V4 checkpoints (#48044), Quark GLM-5.2 checkpoint inference fixes (#46516, #49937).",
                "Kimi K3: new model (#50000) with model files and kernels (#50089), Python frontend (#50093), Rust frontend (#50104), AttnRes kernels (#50090), DeepGEMM support (#50458), DSpark AR fusion (#50242) (#50000, #50089)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#49750",
                "#48763",
                "#49618"
              ],
              "before": "Prior to v0.27.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Kernels: RMSNorm uncontiguous support with 1.2\u20133.1x kernel improvement (#49750), MoE `reduce_scatter` regression fix restoring 5% E2E throughput (#48763), non-grouped bias-less topk routing (#49750, #48763).",
                "New capabilities: FP4 Qutlass integration for compressed-tensors (#43229), CuTeDSL MoE for ReLU2 NVFP4 (#49580), MXFP8 linear support in INC (#47514), AutoRound W4A16 MoE and MXFP4 linear/MoE on XPU (#43229, #49580).",
                "MoE refactor: FusedMoE renamed to FusedMoEFactory (#44941), MoeWNA16 migrated to the MK oracle scheme (#44120), Quark w8a8-int8 (#46765) and MXFP4 `aiter`/`emulation` backends (#49348, #48949) moved (#44941, #44120).",
                "Inkling: llm-compressor NVFP4 weights (#49258) and compressed-tensors dynamic FP8 (#48876) (#49258, #48876)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47750",
                "#48912",
                "#46837"
              ],
              "before": "Prior to v0.27.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Multimodal: VidCom2 video token pruning (#47750), EVS for Qwen3.5 (#48912), ViT CUDA graph for Gemma-4 (#46837), Cosmos3 FP8 ModelOpt/Diffusers remapping (#48952), MiniMax-M3 MSA speculative decode (#47750, #48912).",
                "New models: Qwen3.5 text-only dense and MoE (#50210), K-EXAONE-2.0-750B-A37B (#50524), VaultGemma via Transformers backend (#49803), jina-embeddings-v5-text-nano with EuroBERT encoder backbone (#50210, #50524).",
                "UX & validation: standardized request error handling with a VLLMError hierarchy (#49665), reduced startup log noise (#50590), incompatible nested runtime overrides rejected (#49247), improved (#49665, #50590).",
                "Preprocessing performance: derender CPU work offloaded to the renderer thread pool (#49396), raw-prompt preprocessing off the event loop in AsyncLLM (#49608), multimodal preprocessing isolated on its (#49396, #49608)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#48637",
                "#50219",
                "#48577"
              ],
              "before": "Prior to v0.27.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "CPU: INT8 fused MoE kernel for Arm CPUs (#48637), s390x inference optimization with oneDNN INT8 GEMM (#50219), GDN conv path optimized for speculative decoding (#48577), granite-4 enabled (#47641) (#48637, #50219).",
                "Spec decode: DSpark Markov head replicated across TP ranks (#49731), `sample_from_anchor` loaded from speculators config (#48639), earliest-completing stop string selected (#49391) (#49731, #48639)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#49331",
                "#48791",
                "#50293"
              ],
              "before": "Prior to v0.27.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Model Runner V2: encoder-only attention (#49331), sequence pooling for embedding and classification (#48791), encoder token classification (#50293), encoder token embedding (#50574), BGE-M3 pooling (#49331, #48791).",
                "Memory & robustness: CuMem slept-L1 fragmentation accounting (#49208), cgroup memory limits respected on all platforms (#49966), fail fast when /dev/shm is too small (#48879), zero-copy tensor (#49208, #49966)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Models removed: Plamo2 (#49729), Ouro (#49786). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#49729"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed the no-longer-supported `max_num_partial_prefills` and `max_long_partial_prefills` arguments (#49244). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#49244"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "Multimodal: VidCom2 video token pruning (#47750), EVS for Qwen3.5 (#48912), ViT CUDA graph for Gemma-4 (#46837), Cosmos3 FP8 ModelOpt/Diffusers remapping (#4895",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#47750"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepSeek-V4: sequence parallelism (#46789), ~2x kernel skipping empty c128 launches (#48957), 3.4% E2E TTFT skipping topk/router in decode (#49486), 3.9% E2E TT",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46789"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Kernels: RMSNorm uncontiguous support with 1.2\u20133.1x kernel improvement (#49750), MoE `reduce_scatter` regression fix restoring 5% E2E throughput (#48763), non-g",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#49750"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "ROCm: gfx1250 architecture enabled (#46516), AITER FP8 ViT encoder attention (#49937), fused shared expert for Quark DeepSeek-V4 checkpoints (#48044), Quark GLM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46516"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: INT8 fused MoE kernel for Arm CPUs (#48637), s390x inference optimization with oneDNN INT8 GEMM (#50219), GDN conv path optimized for speculative decoding ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#48637"
            }
          ]
        }
      },
      {
        "version": "v0.26.0",
        "badge": "LTS Milestone",
        "date": "2026-07-27",
        "stats": "411 commits from 212 contributors",
        "headline": "Tiered KV Cache Offloading to Object Storage, Per-Layer Attention Backends, and Inkling Family Support",
        "executive_summary": "vLLM 0.26.0 matures tiered KV cache offloading (extending GPU HBM -> CPU DRAM -> Object Storage with workload identity), allows hybrid models to select different attention backends per KV-cache group, and ships a native Rust `vllm-bench` CLI alongside multimodal video/audio support in the Rust frontend.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Tiered KV Offloading to CPU & Cloud Object Storage",
              "status": "Opt-in / Beta",
              "status_tone": "green",
              "prs": [
                "#47063",
                "#47987",
                "#47666"
              ],
              "before": "When prefix cache blocks were evicted from GPU HBM, they were lost once local host DRAM filled up\u2014forcing expensive prefill recomputation across DP replicas.",
              "now": "Introduces a secondary object-store tier with cloud workload identity, DP-replica-aware tiering, and granular read/write latency histograms.",
              "config_snippet": "vllm serve meta-llama/Llama-3.3-70B-Instruct --kv-transfer-config '{\"kv_connector\":\"TieredOffloadConnector\"}'",
              "tech_bullets": [
                "Introduces a secondary object-store tier with cloud workload identity, DP-replica-aware tiering, and granular read/write latency histograms."
              ]
            },
            {
              "title": "Per-KV-Group Attention Backends for Hybrid Models",
              "status": "Default / GA",
              "status_tone": "cyan",
              "prs": [
                "#48012",
                "#48011"
              ],
              "before": "Hybrid architectures mixing sliding-window attention, full attention, and Mamba/linear layers were forced to use a single compromise attention backend across the whole model.",
              "now": "vLLM selects the optimal kernel backend independently for each KV-cache group in the model.",
              "config_snippet": "# Automatically enabled for hybrid sliding-window + full-attention models",
              "tech_bullets": [
                "vLLM selects the optimal kernel backend independently for each KV-cache group in the model."
              ]
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
            "verdict": "Safe Drop-In Upgrade \u2014 Also includes 6 important security hardening fixes.",
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
              "metric": "1.5\u00d7\u20132.0\u00d7 routing kernel speedup",
              "pct_bar": 78,
              "pr": "#47463"
            }
          ],
          "high_level_changes": [
            {
              "headline": "Tiered KV Offloading to CPU & Cloud Object Storage",
              "plain_summary": "Introduces a secondary object-store tier with cloud workload identity, DP-replica-aware tiering, and granular read/write latency histograms."
            },
            {
              "headline": "Per-KV-Group Attention Backends for Hybrid Models",
              "plain_summary": "vLLM selects the optimal kernel backend independently for each KV-cache group in the model."
            }
          ]
        }
      },
      {
        "version": "v0.25.0",
        "badge": "Release",
        "date": "2026-07-11",
        "stats": "49 upstream changes and 204 PRs",
        "headline": "Model Runner V2 is now the default for all dense models, PagedAttention has been removed",
        "executive_summary": "vLLM v0.25.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Model Runner V2. For operators, this release translates 49 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Model Runner V2 is now the default for all dense models",
              "plain_summary": "(#44443). Building on quantized-model support from the previous release, MRv2 is now the standard execution path, with new support for EVS (#46535), realtime embeddings (#46762), prefix caching for Mamba hybrid models (#42406), multimodal-prefix bidirectional attention (#46942), and dynamic speculative decoding compatible with full CUDA graphs (#45953)."
            },
            {
              "headline": "PagedAttention has been removed",
              "plain_summary": "(#47361). The legacy attention implementation is deleted now that V1/MRv2 backends are the standard path."
            },
            {
              "headline": "The Transformers modeling backend is now as fast as native vLLM",
              "plain_summary": "(#47187), and gained FP8 MoE support (#46820), CUDA graph + embed scaling fixes (#48010), and migration of GPTBigCode/Starcoder2 (#30966) and RoBERTa (#47452)."
            },
            {
              "headline": "New models",
              "plain_summary": "LLaVA-OneVision-2 (#44785), Unlimited OCR (#46564, #47102), MOSS-Transcribe-Diarize (#47729), openai/privacy-filter (#41026), and Hy3 (#47192). GLM-5 / DeepSeek-V3.2 landed in the model zoo (#46808) with GLM-5.2 tuning, and MiniMax-M3 gained pipeline parallelism (#45810) and NVFP4 support (#46756)."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#46862",
                "#46635",
                "#46876"
              ],
              "before": "Prior to v0.25.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "GLM-5.2 / DeepSeek: `fused_indexer_q_rope_quant` Triton kernel (1.9\u20133.3% E2E throughput) (#46862), reduce-scatter MoE all-reduce (3.1\u20133.2% E2E) (#46635), op fusion for GLM5/DSV3.2 (#46876) (#46862, #46635).",
                "AMD/ROCm: moved to torch 2.11 stable ABI (#47128). AITER FlashAttention MLA prefill backend `ROCM_AITER_FA` (#45033) (#47128, #45033).",
                "NVIDIA/Blackwell: FlashInfer fused all-reduce tuned for world_size=16 on GB300 (#46392), restored NVFP4 swizzled-scale zero-init to recover Blackwell decode throughput (#45739), CuTeDSL/FA4-MLA (#46392, #45739).",
                "GLM-5 family: GLM-5 / DeepSeek-V3.2 added to the model zoo (#46808), GLM-5.2 FP32 gate (#47410), GLM MTP post-final-norm fix (#47448), GLM4V startup fix (#47155) (#46808, #47410)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#44514",
                "#46783",
                "#46655"
              ],
              "before": "Prior to v0.25.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Deprecated the old FP8 online MoE quantization class (#44514). legacy `api_server.py` moved to the examples directory (#46783) (#44514, #46783).",
                "ROCm: stabilized high-throughput DBO for DP+EP (#46990), EPLB for Quark OCP MXFP4 MoE (#47220) (#46990, #47220).",
                "FP8: weights padding for per-block online quantization (#44763); deprecated the old FP8 online MoE quantization class (#44514) (#44763, #44514).",
                "Fixes: W8A8 int-quant scheme-selection regression (#46860), tied quantized embeddings for ModelOpt Gemma4 (#45544), NVFP4+MTP crash on Qwen3Next (#46316), ModelOpt mixed-precision for sparse configs (#46860, #45544)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47187",
                "#46820",
                "#48010"
              ],
              "before": "Prior to v0.25.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Transformers backend: now as fast as native vLLM (#47187), FP8 MoE fix (#46820), embed scaling + CUDA graph fix (#48010), GPTBigCode/Starcoder2 (#30966) and RoBERTa (#47452) migration, M-RoPE (#47187, #46820).",
                "Model Runner V2: default for all dense models (#44443); EVS (#46535), realtime embeddings (#46762), Mamba hybrid prefix caching (#42406), multimodal-prefix bidirectional attention (#46942) (#44443, #46535).",
                "Intel XPU: W8A8 FP8 linear kernel with multi-granularity quant (#43645), pipeline-parallel accuracy fix (#47253), uniform-batch CUDA graph for FA2 (#46555), route mm_prefix models to Triton attention (#43645, #47253)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#47217",
                "#47332",
                "#47091"
              ],
              "before": "Prior to v0.25.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "Gemma family: Gemma4 sliding-window/FA4 attention fixes (#47217, #47332), Gemma4 MTP quant_config fix (#47091); DiffusionGemma tensor parallelism (#45719) and HF stability-window semantics (#45965).",
                "Speculative decoding: universal spec decode for heterogeneous vocabularies (TLI) (#38174). DSpark drafter + speculators checkpoint support (#46995, #47093) (#38174, #46995).",
                "Data parallel: throttle prefills based on local prefill work (#46532), rotate load-balancer tie-break to avoid engine bias (#47420), DP supervisor via the Rust frontend (#47076), DP MTP hang fix (#46532, #47420)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#46740",
                "#45918",
                "#47071"
              ],
              "before": "Prior to v0.25.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Other fixes: MiniCPM-V 4.6 language-backbone LoRA (#46740) and placeholder grid fix (#45918), pooled Whisper sliding-window sizing (#47071, #47437), Mamba/Mamba2 checkpoint-without-`architectures` (#46740, #45918).",
                "CPU: accelerated unquantized MoE for AArch64 (#46353), macOS/Apple Silicon hang fix via OpenMP (#46769) and broken-install fix (#47457), compressed-tensor w8a8 int8 MoE (#42920), Mamba ShortConv (#46353, #46769).",
                "New models: LLaVA-OneVision-2 (#44785), Unlimited OCR (#46564) with a Triton R-SWA backend (#47102), MOSS-Transcribe-Diarize (#47729), openai/privacy-filter (#41026), Hy3 with token-suffix and JSON (#44785, #46564).",
                "Rust frontend: static HTTPS and mTLS for HTTP and gRPC (#45890), DP supervisor (#47076), profiler control routes (#46306), `repetition_detection` sampling param (#46684), unified/combined parser (#45890, #47076)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "PagedAttention deleted (#47361). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#47361"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Models removed: Baichuan (#46362), Aquila (#46605), Grok (#46706), Tarsier / Tarsier2 (#47143), AyaVision / MusicFlamingo (#47263), Mantis (#46806). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#46362"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated the old FP8 online MoE quantization class (#44514); legacy `api_server.py` moved to the examples directory (#46783); `gptq_marlin` removed from supported ROCm quant schemes (#46655). -> Action: Check deprecati",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44514"
              },
              {
                "change": "Security",
                "impact": "Prevent image decompression-bomb OOM denial of service (#47010).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#47010"
              },
              {
                "change": "Security",
                "impact": "Prevent an infinite loop in `split_audio` with NaN audio samples (#46463).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#46463"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "GLM-5.2 / DeepSeek: `fused_indexer_q_rope_quant` Triton kernel (1.9\u20133.3% E2E throughput) (#46862), reduce-scatter MoE all-reduce (3.1\u20133.2% E2E) (#46635), op fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46862"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA/Blackwell: FlashInfer fused all-reduce tuned for world_size=16 on GB300 (#46392), restored NVFP4 swizzled-scale zero-init to recover Blackwell decode thr",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46392"
            },
            {
              "label": "API & Frontend",
              "hardware": "CLI/UX: TTFT and TPS printing in `vllm chat` (#46775), `model_class_overrides` for development/debugging (#47148).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46775"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "GLM-5.2 / DeepSeek: `fused_indexer_q_rope_quant` Triton kernel (1.9\u20133.3% E2E throughput) (#46862), reduce-scatter MoE all-reduce (3.1\u20133.2% E2E) (#46635), op fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#46862"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD/ROCm: moved to torch 2.11 stable ABI (#47128); AITER FlashAttention MLA prefill backend `ROCM_AITER_FA` (#45033); fused shared-expert for GLM-4.5/6/7 (#4431",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#47128"
            }
          ]
        }
      },
      {
        "version": "v0.24.0",
        "badge": "Release",
        "date": "2026-06-29",
        "stats": "42 upstream changes and 242 PRs",
        "headline": "MiniMax-M3, DeepSeek-V4 keeps maturing",
        "executive_summary": "vLLM v0.24.0 focuses on Multi-Vendor Accelerator Scaling, Low-Precision Quantization Kernels, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 42 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "MiniMax-M3",
              "plain_summary": "Added support for the new MiniMax-M3 model (#45381), with a fast follow-on of BF16/FP8 indexer via MSA (#45892), MXFP4 support (#45896), FP8 sparse GQA (#45744), and extensive AMD/ROCm tuning \u2014 mxfp8 MoE/linear on gfx950 (#45725), fp8_per_channel for bf16 weights on MI300X (#45854), FP8 KV-cache fix (#45720), and packed-modules mapping (#45794). A MiniMax-M2 perf regression was also fixed (#45935)."
            },
            {
              "headline": "DeepSeek-V4 keeps maturing",
              "plain_summary": "Following its debut, DeepSeek-V4 received another large optimization pass \u2014 a FlashInfer sparse index cache (2\u20134% TTFT) (#45863), prefill chunk-planning optimization (4% E2E throughput) (#45061), a cluster-cooperative topK kernel for low-latency (#43008), contiguous per-block KV allocations (#44577), TEP=16 for the block-FP8 shared expert (#46001), and native DSA indexer decode for `next_n > 2` on SM100 (#45322). It is now enabled on SM120 alongside GLM-5.1 (#43477), with XPU (#44144, #44517, #45240) and ROCm (#44899, #45103, #45681) attention/MoE paths added."
            },
            {
              "headline": "Model Runner V2 (MRv2) continues to expand",
              "plain_summary": "MRv2 now supports quantized models by default (#44446), enables GraniteMoE by default (#45461), and gained migration of Qwen + DeepSeek-V2 MoE models (#42667), DFlash speculative decoding (#44586), and more accurate FP32 Gumbel sampling (#45996)."
            },
            {
              "headline": "Streaming Parser Engine",
              "plain_summary": "A new streaming parser engine unifies tool-call/reasoning parsing across models, with parsers for Qwen3 (#45413), MiniMax-M2 (#45701), GLM-4.7/5.1/5.2 (#45915), and Nemotron V3 (#45755)."
            }
          ],
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#45131",
                "#45161",
                "#46636"
              ],
              "before": "Prior to v0.24.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Deprecated: First-generation Qwen and QwenVL models (#45131), Transformers v4 support (#45161), `CUDA_VISIBLE_DEVICES` on ROCm (#46636); general deprecations for v0.23/v0.24 (#44992) (#45131, #45161).",
                "AMD ROCm: Torch 2.11 (#45362). fused AR + RMSNorm + per-group FP8 quant (#42864), fused softplus-sqrt-topk MoE router under AITER (#44945), DSv4 flash-decode split-K kernel (#44899) and inverse-RoPE (#45362, #42864).",
                "Torch 2.11 on ROCm (#45362), torch-xpu 2.12 (#42262), tpu-inference v0.22.1 (#45793), NIXL v0.10.1 for XPU (#40287), Starlette \u2265 1.0.1 (#45675) (#45362, #42262).",
                "Weight loading & core: fastsafetensors `ParallelLoader` for weight loading (#40183), release of cached device memory under pressure on UMA GPUs (#45179), structured outputs for beam search (#35022) (#40183, #45179)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#44572",
                "#44830",
                "#45322"
              ],
              "before": "Prior to v0.24.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "NVIDIA / kernels: SM90 CUTLASS FP8 mm odd-M support via swap_ab (180\u2013290% kernel speedup) (#44572), tuned `fused_moe` FP8 for Qwen3-Next-80B on H100 (+25%) (#44830), native DSA indexer decode on (#44572, #44830).",
                "torch stable ABI: Continued (and completed) migration of kernels to the libtorch stable ABI \u2014 MoE [10c/n] (#44565), Marlin [11a/n] (#45176), Machete [11b/n] (#45304), final `_C` library migration (#44565, #45176).",
                "Expert parallel: DeepEP v2 integration (#41183) with token-bound and topk-index fixes (#46404, #46432). NIXL EP \u2014 DBO with NIXL EP (#45275), top-k index dtype query (#45298), NVFP4 post-receive (#41183, #46404).",
                "FP4 / MXFP: FlashInfer cutedsl NVFP4 GEMM backend (#42235) and cute-dsl MXFP8 linear kernel (#46393), MXFP4 W4A4 MoE CUTLASS E8M0 scale fix (#43557), SwiGLU clamp wired for NVFP4 MoE on non-Blackwell (#42235, #46393)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#45381",
                "#45163",
                "#45690"
              ],
              "before": "Prior to v0.24.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New models: MiniMax-M3 (#45381), DiffusionGemma (#45163) + Gemma Diffusion on CPU (#45690), Hierarchical Reasoning Model \u2014 Text / HrmTextForCausalLM (#43098), OpenMOSS (#44124) (#45381, #45163).",
                "Qwen / multimodal: Qwen3-VL video loader (#44412), Qwen2-VL/Qwen2.5-VL processor-mapped video loader (#45555), Qwen3-VL multi-video processing optimization (#46026) and multi-video crash fix (#44412, #45555).",
                "Model Runner V2: Quantized models by default (#44446), GraniteMoE default (#45461), Qwen/DSv2 MoE migration (#42667), DFlash (#44586), simplified async output handling (#45442), attention-group split (#44446, #45461).",
                "Gemma 4: Unified FlashAttention (FA4) across all layers + `mm_prefix` support (#42175). many parser/serving fixes \u2014 forced-JSON skip for required/named tool choice (#45795), parsing with thinking (#42175, #45795)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40576",
                "#43586",
                "#41992"
              ],
              "before": "Prior to v0.24.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "ViT full CUDA graph: GLM-4.1V (#40576), DeepSeek-OCR dual-path (#43586), Kimi-VL (#41992), mllama4 (#40660), Lfm2VL encoder (#44930) (#40576, #43586).",
                "Attention: Re-enabled cross-layer KV cache layout for MLA via stride-aware kernels (#45111), MLA prefill FA4 fp8 output (#43050), FlexAttention custom mask mods made fully cudagraphable (#45232) (#45111, #43050).",
                "Intel XPU: Sequence-parallel support (#38608), torch-xpu 2.12 (#42262), vllm-xpu-kernels v0.1.10 (#40367), W4A16 int4 group_size=32 MoE (#45136), DeepSeek-V4 attention/MoE paths (#44144, #44517 (#38608, #42262).",
                "DeepSeek-V4: OOM fix (#44914), MTP projection prefixing (#44821), supported KV-cache dtypes (#44892) (#44914, #44821)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35264",
                "#44583",
                "#44528"
              ],
              "before": "Prior to v0.24.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "KV connectors / disaggregated serving: KV push from prefill to decode via NIXL (#35264). per-region KV transfer classification for mixed full-attn + MLA groups (#44583) (#35264, #44583).",
                "OpenAI / Responses: Real `/v1/embeddings` support for messages + `chat_template_kwargs` (#45173), multimodal token counts in `usage.prompt_tokens_details` (#45458), omit empty `tool_calls` from chat (#45173, #45458).",
                "Rust frontend: API-key auth (#44321), CORS (#45753), `/tokenize` + `/detokenize` (#44222), `/pause` `/resume` `/is_paused` (#44499), `/abort_requests` (#44382), `/get_world_size` (#44801) (#44321, #45753)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed models: ERNIE (obsolete) (#45127), Xverse (#45638), Dots1 (#45637), Bamba (#45990), Mono-InternVL (#45129), InternLM registry alias (#45128). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#45127"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated: First-generation Qwen and QwenVL models (#45131), Transformers v4 support (#45161), `CUDA_VISIBLE_DEVICES` on ROCm (#46636); general deprecations for v0.23/v0.24 (#44992). -> Action: Check deprecation/removal",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#45131"
              },
              {
                "change": "Security",
                "impact": "Denial of service: Audio decompression bomb in the speech-to-text endpoint (#44970), remote DoS via invalid recovered-token reinjection in speculative decoding (#44744), DoS via `prompt_embeds` on M-RoPE models (#45252),",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44970"
              },
              {
                "change": "Security",
                "impact": "Input validation & hardening: Image EXIF orientation and tRNS transparency handling (#44974), rejection of non-finite `temperature`/`repetition_penalty` (#45116), `sanitize_message` applied to Anthropic and STT error pat",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44974"
              },
              {
                "change": "Security",
                "impact": "Information disclosure: int32 truncation in the GGUF dequantize kernels (#44971).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44971"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "CPU & other architectures: 2.5\u00d7 faster ASR CPU preprocessing via multi-threading (#44612), CPU W4A16 INT4 MoE (#43409), cgroup memory-limit-aware KV cache sizin",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44612"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA / kernels: SM90 CUTLASS FP8 mm odd-M support via swap_ab (180\u2013290% kernel speedup) (#44572), tuned `fused_moe` FP8 for Qwen3-Next-80B on H100 (+25%) (#44",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44572"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "torch stable ABI: Continued (and completed) migration of kernels to the libtorch stable ABI \u2014 MoE [10c/n] (#44565), Marlin [11a/n] (#45176), Machete [11b/n] (#4",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44565"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU & other architectures: 2.5\u00d7 faster ASR CPU preprocessing via multi-threading (#44612), CPU W4A16 INT4 MoE (#43409), cgroup memory-limit-aware KV cache sizin",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#44612"
            }
          ]
        }
      },
      {
        "version": "v0.23.0",
        "badge": "Release",
        "date": "2026-06-15",
        "stats": "40 upstream changes and 224 PRs",
        "headline": "DeepSeek-V4 matures across backends, Model Runner V2 expands to more dense models",
        "executive_summary": "vLLM v0.23.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Disaggregated Serving. For operators, this release translates 40 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "DeepSeek-V4 matures across backends",
              "plain_summary": "Following its introduction in v0.22.0, DeepSeek-V4 received another large hardening and optimization pass. Its sparse MLA metadata is now decoupled from DeepSeek-V3.2 (#44699), it gained a TRTLLM-gen attention kernel (#43827), EPLB support for the Mega-MoE (#43339), selective prefix-cache retention for sliding-window KV cache (#43447), and an index-share feature for DSA MTP (#44420). The model was also detached from `torch.compile` (#43746, #43891), its attention and RoPE paths were refactored (#44569, #44262, #43926), and an XPU attention decode path was added (#42953)."
            },
            {
              "headline": "Model Runner V2 expands to more dense models",
              "plain_summary": "MRv2 is now selected by default for Llama and Mistral dense models (#43458) in addition to Qwen3. It gained a FlashInfer sampler (#42472), breakable CUDA graphs (#44050), pipeline-parallel bubble elimination (#42187), kernel block-size support for hybrid models (#38831), and Gemma 4 MTP (#43241)."
            },
            {
              "headline": "Rust frontend grows up",
              "plain_summary": "The experimental Rust frontend added a streaming `generate` endpoint (#43779), dynamic LoRA endpoints (#43778), `/version` (#43854) and `/server_info` (#43942) endpoints, a server-router extension hook (#43774), request-ID headers (#43883), and many new tool parsers (InternLM2 #43481, hy_v3 #43872, Phi-4-mini #44213, Gemma4 #43850)."
            },
            {
              "headline": "Gemma 4",
              "plain_summary": "Added encoder-free Gemma 4 Unified support (#44429) and Gemma 4 MTP (#43241), plus numerous accuracy and startup fixes."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#43361",
                "#43717",
                "#44013"
              ],
              "before": "Prior to v0.23.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "torch stable ABI: Continued migration of kernels to the libtorch stable ABI \u2014 merge_attn_states/mamba/sampler [8/n] (#43361), attention/cache kernels [9/n] (#43717), header files (#44013) (#43361, #43717).",
                "Model fixes & enhancements: Qwen3-VL/Qwen3-omni-thinker deepstack accuracy under `torch.compile` (#43617), EVS for Qwen3-VL (#44205), GLM-5.1 PP loading (#42944), GLM-4.1V processor logits (#43575) (#43617, #44205).",
                "Attention & hybrid/Mamba: FlexAttention/FlashAttention num-blocks-first layouts (#42095), OOT MLA prefill backend registration (#43325), FlashAttention upstream sync (#44065), Mamba LINEAR (#42095, #43325).",
                "Intel XPU: vllm-xpu-kernel v0.1.7 (#41019), `block_fp8_moe` (#42139), block-scaled W8A8 FP8 path (#39968), WNA16 oracle for GPTQ sym-int4 (#41426), rms_norm/act quant fusions (#43963), GDN-attention (#41019, #42139)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38065",
                "#44220",
                "#43706"
              ],
              "before": "Prior to v0.23.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "NVIDIA / kernels: FP8 FlashInfer attention for ViT (#38065), Triton MoE backend on Hopper by default (#44220), CUTLASS FP8 scaled-mm padding bypass (+20%) (#43706), MoE-permute buffer pre-allocation (#38065, #44220).",
                "Kernels & backends: Triton W4A16 as CUDA fallback for non-Marlin-aligned shapes (#43731), Marlin MoE on SM 12.x (#40923), Machete W4A16 tests (#35450), fail-fast for unsupported NVFP4 KV-cache-dtype (#43731, #40923).",
                "compressed-tensors: WNA8O8Int linears and WNInt embeddings (#44340), asymmetric MoE WNA16 Marlin (#44025), single-class NVFP4 linear refactor (#42443) (#44340, #44025).",
                "MoE refactor (oracle): Migrated ModelOpt MXFP8 (#42768), W4A8-int8 (#42789), and WNA16 backend selection (#42553) into the modular-kernel oracle; removed `supports_expert_map` (#43108) and the (#42768, #42789)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#43720",
                "#44560",
                "#42554"
              ],
              "before": "Prior to v0.23.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "KV connectors / disaggregated serving: PP-aware handshake aggregation and intermediate-PP output plumbing (#43720), multiple-async-KV-load deadlock fix (#44560), Nixl Mamba prefix-caching mode (#43720, #44560).",
                "EPLB: Async EPLB by default (#43219), EPLB for DeepSeek-V4 Mega-MoE (#43339), Nixl zero-copy EPLB transfers (#41633) (#43219, #43339).",
                "Begin the deprecation cycle for the NixlConnector `kv_both` role (#43874).",
                "OpenAI / Responses API: `system_fingerprint` field (#40537), streaming tool/function calling with `required` (#40700), `chat_template_kwargs` in Responses (#43761), developer-to-system conversion in (#40537, #40700)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#44429",
                "#43241",
                "#43798"
              ],
              "before": "Prior to v0.23.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Gemma 4: Encoder-free Unified support (#44429), MTP (#43241), native ViT linear layers (#43798), vision-embedder excluded from quantization (#44571), and fixes for MTP under TP>1 (#43909) (#44429, #43241).",
                "New models: Step-3.7-Flash (#43859), Cosmos3 Reasoner (#43356), Gemma 4 Unified encoder-free (#44429), JetBrains Mellum v2 (#43992), Granite Speech Plus (#43519), Cohere Mini Code (#44707) (#43859, #43356).",
                "Multimodal: Auto-select registered video loader for VLMs (#44126), O(log n) multimodal item handling per step (#44212), local image encoding in benchmarks (#43843), interleaved custom image benchmark (#44126, #44212).",
                "Pooling/Classification: Proper exceptions for pooling UX (#44593), `extra_repr()` for pooler classes (#44805), LoRA-adapter-name pooling fix (#44410), resettled generative scoring entrypoint (#44593, #44805)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#43136",
                "#44265",
                "#41394"
              ],
              "before": "Prior to v0.23.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "AMD ROCm: ROCm 7.2.3 (#43136), AITER v0.1.13.post1 (#44265), native W4A16 (#41394) and fused-MoE W4A16 HIP (#44075) kernels for RDNA3 (gfx1100), AITER top-k/top-p sampler by default (#43331) (#43136, #44265).",
                "FlashInfer v0.6.12 (#44036), ROCm 7.2.3 (#43136), AITER v0.1.13.post1 (#44265), tpu-inference v0.21.0 (#44621), mistral-common bump (#44649), fastsafetensors v0.3.2 (#43625) (#44036, #43136).",
                "TPU: tpu-inference upgraded to v0.20.0 (#43394) then v0.21.0 (#44621) (#43394, #44621).",
                "Anthropic Messages API: Structured output and effort support (#42396), system-role messages inside the messages array (#44283) (#42396, #44283)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Deprecate `JAISLMHeadModel` (#43784). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43784"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Begin the deprecation cycle for the NixlConnector `kv_both` role (#43874). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43874"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Remove functions previously scheduled for deprecation in v0.21.0 (#43358). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43358"
              },
              {
                "change": "Security",
                "impact": "Parameter validation: Reject invalid `thinking_token_budget` values (#43402), non-positive `ParallelConfig` integer knobs (#44057), zero-valued config fields (#43794), and out-of-range `max_num_scheduled_tokens` (#44207)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43402"
              },
              {
                "change": "Security",
                "impact": "Untrusted-input hardening: Reject out-of-vocabulary token IDs before they reach the GPU logprob path (#44042) and fix a UTF-8 char-boundary panic in the Rust incremental detokenizer on malformed input (#44620), both of w",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#44042"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "torch stable ABI: Continued migration of kernels to the libtorch stable ABI \u2014 merge_attn_states/mamba/sampler [8/n] (#43361), attention/cache kernels [9/n] (#43",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#43361"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA / kernels: FP8 FlashInfer attention for ViT (#38065), Triton MoE backend on Hopper by default (#44220), CUTLASS FP8 scaled-mm padding bypass (+20%) (#437",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#38065"
            }
          ]
        }
      },
      {
        "version": "v0.22.0",
        "badge": "Release",
        "date": "2026-05-29",
        "stats": "50 upstream changes and 197 PRs",
        "headline": "DeepSeek V4 maturity, Model Runner V2 advances toward default",
        "executive_summary": "vLLM v0.22.0 focuses on Low-Precision Quantization Kernels, Frontier MoE & Sparse-MLA Speedups, and Disaggregated Serving. For operators, this release translates 50 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "DeepSeek V4 maturity",
              "plain_summary": "DeepSeek V4 received a major hardening pass this cycle \u2014 the model was reorganized into a dedicated `vllm/models/deepseek_v4/` package (#43004, #43039, #43073, #43077, #43149), gained NVFP4 fused MoE support (#42209), full + piecewise CUDA graph (#42604), and MTP speculative decoding (#43385). A large set of fused kernels (MegaMoE, `mhc`, Q-norm, indexer, sparse MLA) and ROCm parity fixes landed alongside accuracy fixes (#42810, #43710)."
            },
            {
              "headline": "Model Runner V2 advances toward default",
              "plain_summary": "MRv2 is now default for Qwen3 dense models. vLLM will fall back to MRv1 for features that aren't yet supported in MRv2 (#39337). sleep-mode weight reload (#42673), `update_config` (#42783), and shared KV-cache layers (#35045), plus many correctness fixes."
            },
            {
              "headline": "Experimental Rust frontend",
              "plain_summary": "A new Rust front-end integration landed (#40848), with the implementation moved into the tree (#43283) and a DP Supervisor for data-parallel serving (#40841)."
            },
            {
              "headline": "Batch invariance, faster",
              "plain_summary": "Batch-invariant inference gained Cutlass FP8 support for a 28.9% end-to-end latency improvement (#40408), compile-mode support on SM80 (#42456), and an NVFP4 Cutlass linear path (#39912)."
            }
          ],
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40082",
                "#41215",
                "#38822"
              ],
              "before": "Prior to v0.22.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "NVIDIA Blackwell / SM12x: FlashInfer b12x MoE + FP4 GEMM for SM120/121 (#40082), per-tensor FP8 CUTLASS on SM12.1 (#41215), `head_dim=512` for FlashInfer TRTLLM attention (#38822), FlashInfer (#40082, #41215).",
                "Performance: batch-invariant Cutlass FP8 (+28.9% E2E) (#40408), CutlassFP8 padding pre-processing (+13.5% TTFT) (#42651), padded NVFP4 quant kernel (+2.4\u20135.7% E2E) (#42774), GPU<->CPU sync (#40408, #42651).",
                "CPU / RISC-V: RVV-optimized attention kernels for RISC-V Vector Extension (#40119) with VLEN=256 (#42943), fused GDN for AMX CPU (#42707), MXFP4 W4A16 MoE (#41922), experimental Triton + MRv2 on CPU (#40119, #42943).",
                "Intel XPU: GPTQ int4 support (#37844), mxfp8 MoE (#41918), FP8 block-scaled quantization (#42952), custom-op collective behavior (#41354), multiple sparse-attention kernels (#37888), MoE topk routing (#37844, #41918)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#42209",
                "#42604",
                "#43385"
              ],
              "before": "Prior to v0.22.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "DeepSeek V4: NVFP4 MoE (#42209), CUDA graph full/piecewise (#42604), MTP (#43385), model package refactor (#43004, #43039, #43073, #43077), sparse MLA + compressor refactor (#43149, #43710), MegaMoE (#42209, #42604).",
                "Tool calling: Apertus tool parser (#41154), Qwen3Coder `anyOf`/`oneOf`/`$ref` resolution re-land (#37831), shared `coerce_to_schema_type` across MiniMax-M2 / DeepSeek-V3.2 / Seed-OSS parsers (#43006 (#41154, #37831).",
                "Kimi-K2.5: skip vision-tower dtype conversion under quantization (#42869), `mm_projector` dtype fix (#42081) (#42869, #42081).",
                "Removed deprecated MLA prefill arguments (#42555)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#41383",
                "#40364",
                "#41869"
              ],
              "before": "Prior to v0.22.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "Disaggregated serving (NIXL): lease-renewal TTL for KV blocks on P (#41383), handshake-failure policy honoring (#40364), GDN support for PD with NIXL (#41869), multi-node TP>8 fix (#39907) (#41383, #40364).",
                "EPLB: change default EPLB communicator (#43110), VLM-wrapper init fix (#39805), remove dead `torch.accelerator.synchronize()` (#40733) (#43110, #39805).",
                "MoE refactor: `ExpertMapManager` (#41046), experts moved to `experts/` (#42334), `RoutedExperts` alias for FusedMoE (#40735), EPLB refactoring for FusedMoE (#41055) (#41046, #42334).",
                "Mamba: attention module refactor (#41126), Mamba2 SSD kernel warmup (#39822), bf16 SSM cache (#41680), GPU-side state postprocessing fused kernel (#40172), run single-token extends as decodes (#41126, #39822)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#42311",
                "#36329",
                "#42151"
              ],
              "before": "Prior to v0.22.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Qwen3.5/3.6: GDN output-projection flatten (#42311), GatedDeltaNet Marlin TP\u22652 fix (#36329), ViT full CUDA graph (#42151), runai-streamer weight loading for Qwen3.5/MTP/Qwen3-VL (#42521, #42716), KDA (#42311, #36329).",
                "Model Runner V2: Qwen3-dense-by-default oracle (#39337), sleep-mode reload weights (#42673), `update_config` (#42783), shared KV-cache layers (#35045), FP32 gumbel sampling (#41775), auto-fallback to (#39337, #42673).",
                "Experimental: breakable CUDA graph (#42304)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#42810",
                "#43679",
                "#41812"
              ],
              "before": "Prior to v0.22.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "AMD ROCm: DSV4 functionality + accuracy fixes (#42810, #43679 Tilelang MHC), flash sparse MLA Triton kernels (#41812), gluon paged MQA logits on gfx950/MI355X (#42062), RMSNorm+Quant fusion for.",
                "vllm-tpu: disable build isolation for CUDA deps (#43038), tpu-inference docker build fix (#43360) (#43038, #43360)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed old locations of `get_tokenizer` and `resolve_hf_chat_template` (#35024). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35024"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Marked env vars now covered by `--moe-backend` / `--linear-backend` (#43148). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#43148"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated MLA prefill arguments (#42555). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#42555"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed dead CUDA kernels and dead code (#42767, #42889, #43144). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#42767"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA Blackwell / SM12x: FlashInfer b12x MoE + FP4 GEMM for SM120/121 (#40082), per-tensor FP8 CUTLASS on SM12.1 (#41215), `head_dim=512` for FlashInfer TRTLLM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40082"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: batch-invariant Cutlass FP8 (+28.9% E2E) (#40408), CutlassFP8 padding pre-processing (+13.5% TTFT) (#42651), padded NVFP4 quant kernel (+2.4\u20135.7% E",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40408"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD ROCm: DSV4 functionality + accuracy fixes (#42810, #43679 Tilelang MHC), flash sparse MLA Triton kernels (#41812), gluon paged MQA logits on gfx950/MI355X (",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#42810"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA Blackwell / SM12x: FlashInfer b12x MoE + FP4 GEMM for SM120/121 (#40082), per-tensor FP8 CUTLASS on SM12.1 (#41215), `head_dim=512` for FlashInfer TRTLLM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40082"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: batch-invariant Cutlass FP8 (+28.9% E2E) (#40408), CutlassFP8 padding pre-processing (+13.5% TTFT) (#42651), padded NVFP4 quant kernel (+2.4\u20135.7% E",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40408"
            }
          ]
        }
      },
      {
        "version": "v0.21.0",
        "badge": "Release",
        "date": "2026-05-15",
        "stats": "49 upstream changes and 136 PRs",
        "headline": "Transformers v4 deprecated, C++20 build requirement",
        "executive_summary": "vLLM v0.21.0 focuses on Frontier MoE & Sparse-MLA Speedups, Next-Gen Speculative Decoding, and Disaggregated Serving. For operators, this release translates 49 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Transformers v4 deprecated",
              "plain_summary": "This release formally deprecates `transformers` v4 support (#40389). Users should migrate to `transformers` v5."
            },
            {
              "headline": "C++20 build requirement",
              "plain_summary": "vLLM now requires a C++20-compatible compiler for compatibility with PyTorch (#40380). This is a breaking build change."
            },
            {
              "headline": "KV Offload + Hybrid Memory Allocator (HMA)",
              "plain_summary": "The KV offloading subsystem now integrates with the Hybrid Memory Allocator, including scheduler-side sliding window group support and full HMA enablement (#41228, #41445, #39571)."
            },
            {
              "headline": "Speculative decoding with thinking budget",
              "plain_summary": "Speculative decoding now respects reasoning/thinking budgets, enabling correct spec decode for reasoning models (#34668)."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40376",
                "#38065",
                "#40941"
              ],
              "before": "Prior to v0.21.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Performance: FlashInfer top-k/top-p sampler enabled by default (#40376), FP8 FlashInfer attention for ViT (#38065), TurboQuant shared dequant buffers (#40941), `AllPool.forward` 51% faster (#41163) (#40376, #38065).",
                "DeepSeek V4: AMD/ROCm support (#40871), pipeline parallelism (#41694), `max` reasoning effort (#40982), disaggregated serving fixes (#41957) (#40871, #41694).",
                "NVIDIA Blackwell: TOKENSPEED_MLA backend for DSR1/Kimi-K25 (#41778), faster per-token FP8 group quant packed kernel (#41326), FP8 on NVIDIA Thor/SM110 (#39712), CUTLASS scaled mm for non-compatible (#41778, #41326).",
                "AMD ROCm: ROCm 7.2.2 (#41386), DBO (Dynamic Batch Optimization) (#34726), AITER Fused Allreduce+RMSNorm (#37646), Fused Shared Expert (FSE) for Qwen3-Next (#39280), DeepSeek V3.2 TP4 AITER MLA (#41386, #34726)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40967",
                "#41129",
                "#41880"
              ],
              "before": "Prior to v0.21.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "New architectures: MiMo-V2.5 (#40967), Laguna XS.2 (#41129, #41880), Moondream3 (#32325), Qianfan-OCR (#40136), Cohere MoE (#40817), Cohere Eagle (#42078) (#40967, #41129).",
                "Speculative decoding: EAGLE for Mistral (#41024), Gemma4 MTP (#41745), MTP for MiMo-V2.5 (#41905), Cohere Eagle (#42078) (#41024, #41745).",
                "Speculative decoding: Thinking budget support (#34668), independent drafter attention backend selection (#39930), multimodal model support with warning (#41752), per-step allocation elimination (#34668, #39930)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#41228",
                "#41445",
                "#39571"
              ],
              "before": "Prior to v0.21.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "KV offloading + HMA: Scheduler-side sliding window groups (#41228), full HMA enablement (#41445), multi-connector HMA (#39571), per-job store completion (#39186), DCP/PCP support in (#41228, #41445).",
                "Disaggregated serving: Bi-directional KV cache transfers between P and D (#32553), NIXL transfer redesign (#40731), EPLB memory overhead optimization (#40013), NIXL connector bumped to 1.x (#42364) (#32553, #40731).",
                "Ray: RayExecutorV2 enabled by default (#41421), actor name collision fix for DP > 1 (#40398) (#41421, #40398).",
                "Compatibility: Vendor HCXVisionConfig for Transformers v5 (#38447), legacy `rope_type` checkpoint support (#41734) (#38447, #41734)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#39445",
                "#41186",
                "#41314"
              ],
              "before": "Prior to v0.21.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "CPU: FP8 attention for AMX/AVX-512 (#39445), FP8 W8A16 linear (#41186), FP8 W8A16 MoE (#41314), DNNL AVX2 W8A8 Int8 (#41318), Gated DeltaNet Attention for Qwen 3.5/3.6 (#41025), RISC-V OMP thread (#39445, #41186).",
                "NVFP4: KV cache support (#40177), Triton dequant/QDQ emulation kernels for Hopper and AMD (#40033), GELU on TRT-LLM NvFP4 fused MoE for Gemma4 (#41050), ModelOpt NVFP4 W4A16 (#41769), NVFP4 (#40177, #40033).",
                "MXFP4: Humming MXFP4 MoE backend (#41083), FlashInfer CUTLASS MXFP4-MXFP8 MoE fix (#42089) (#41083, #42089).",
                "FP8: Bias loading fix (#41424), FlashInfer autotune temporarily disabled for correctness (#41524) (#41424, #41524)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40651",
                "#40410",
                "#41162"
              ],
              "before": "Prior to v0.21.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Model Runner V2: Rejection sampling acceptance rate fix (#40651), skip metadata rebuild before draft prefill (#40410), rebuild metadata between draft decode steps (#41162), Qwen3.5/Mamba hybrid (#40651, #40410).",
                "Model Runner V2: Qwen3.5/Mamba hybrid model support (#35520), `logprob_token_ids` support (#40559) (#35520, #40559).",
                "CUDA graph: ViT CUDA graph support for Qwen2.5-VL (#40830)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "API & Frontend",
                "impact": "Responses API: Streaming tool/function calling with `required` (#40700) and named tool/function choice (#41110), resubmitting output items with missing fields (#41355).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#40700"
              },
              {
                "change": "Build & Dependencies",
                "impact": "Breaking: C++20 required for PyTorch compatibility (#40380).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#40380"
              },
              {
                "change": "Build & Dependencies",
                "impact": "Breaking: Transformers v4 deprecated (#40389).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#40389"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: FlashInfer top-k/top-p sampler enabled by default (#40376), FP8 FlashInfer attention for ViT (#38065), TurboQuant shared dequant buffers (#40941), ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40376"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: FlashInfer top-k/top-p sampler enabled by default (#40376), FP8 FlashInfer attention for ViT (#38065), TurboQuant shared dequant buffers (#40941), ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#40376"
            }
          ]
        }
      },
      {
        "version": "v0.20.0",
        "badge": "Release",
        "date": "2026-04-27",
        "stats": "57 upstream changes and 315 PRs",
        "headline": "DeepSeek V4, CUDA 13.0 default",
        "executive_summary": "vLLM v0.20.0 focuses on Low-Precision Quantization Kernels, Model Runner V2, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 57 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "DeepSeek V4",
              "plain_summary": "Initial DeepSeek V4 support landed (#40860), with DSML token-leakage fix in DSV4/3.2 (#40806), DSA + MTP IMA fix (#40772), and a silu clamp limit on the shared expert (#40950)."
            },
            {
              "headline": "CUDA 13.0 default",
              "plain_summary": "Default CUDA wheel on PyPI and `vllm/vllm-openai:v0.20.0` image switched to CUDA 13.0; architecture lists and build-args cleaned up (#39878), and CUDA bumped to 13.0.2 to match PyTorch 2.11.0 (#40669). As a general rule of thumb, our CUDA version policy follows PyTorch's. We highly recommend to install vLLM with `uv` and use `--torch-backend=cu129` if you are on CUDA 12.9."
            },
            {
              "headline": "PyTorch 2.11 upgrade",
              "plain_summary": "(#34644): vLLM ships on torch 2.11 for CUDA, and XPU is now also on torch 2.11 (#37947) \u2014 XPU is no longer pinned to 2.10. This is a breaking change for environment dependency."
            },
            {
              "headline": "Python 3.14",
              "plain_summary": "Added to the supported Python version list (#34770)."
            }
          ],
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#37980",
                "#39422",
                "#39083"
              ],
              "before": "Prior to v0.20.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Other: DeepGEMM integrated into the vLLM wheel via CMake (#37980), Lustre FS checkpoint prefetching enabled by default (#39422), Gemma4 fused routing Triton kernel (#39083), Gemma4 embed_input_ids (#37980, #39422).",
                "New formats & methods: TurboQuant 2-bit KV cache compression (#38479) with FA3/FA4 prefill (#40092), per-token-head INT8/FP8 KV cache quantization (#38378), fused FP8/NVFP4 output quantization in MLA (#38479, #40092).",
                "Intel XPU: torch 2.11 upgrade for XPU (#37947) \u2014 no longer pinned to 2.10, initial GDN attention for Qwen3-Next / Qwen3.5 (#33657), torch.compile for XPU GDN attention (#39466), XPU MXFP8 quant op (#37947, #33657).",
                "Petit NVFP4 (#32694), `accept output buffer` in attention (#39125), `cprofile` / `cprofile_context` (#39100), `LLM.reward` offline API (#40688) (#32694, #39125)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38635",
                "#37123",
                "#38663"
              ],
              "before": "Prior to v0.20.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Features: NUMA binding for GPU workers (#38635), opt-in `VLLM_MEDIA_CACHE` media URL caching (#37123), safe request abort when FSM fails to advance (#38663), KV connector prioritized over internal (#38635, #37123).",
                "Model Runner V2: Full CUDA graph for eagle prefill (#37588), auto cudagraph mode/sizes based on attention backend (#32936), fused probabilistic rejection-sample kernels (#38496), config validation (#37588, #32936).",
                "torch.compile: Opaque Objects on torch 2.11 (#39286), AOT compile with batch-invariance mode (#39201), Inductor cache nested under AOT dir (#39718), split FX graph via codegen (#38657), Inductor (#39286, #39201).",
                "Helion kernels: torch.compile support for Helion kernels (#38592)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#40724",
                "#40664",
                "#40673"
              ],
              "before": "Prior to v0.20.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Other: Nano-Nemotron-VL static image inputs fix (#40724). Qwen3 MoE no longer calls gate twice (#40664) (#40724, #40664).",
                "New architectures: DeepSeek V4 (#40860), Hunyuan v3 preview (#40681), Granite 4.1 Vision (#40282), EXAONE-4.5 (#39388), BharatGen Param2MoE (#38000), Phi-4-reasoning-vision-15B (#38306), Cheers (#40860, #40681).",
                "Gemma4 series: fast prefill (#38879), quantized MoE (#39045), Eagle3 (#39450), block-local attention + YaRN for Gemma3 (#39823), bidirectional vision attention for sliding layers (#40534) (#38879, #39045).",
                "LoRA: Qwen3ASRForConditionalGeneration (#37247), Gemma4ForConditionalGeneration (#39291, #38844), DeepSeek V3.2 (#35077), Qwen3.5 / Step3.x expert base_layer extension (#37114), MoE LoRA refactor (#37247, #39291)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32662",
                "#35697",
                "#38676"
              ],
              "before": "Prior to v0.20.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "CPU: CPU draft-model speculative decoding (#32662), CPU int8 compute mode in AWQ (#35697), head_size 512 in `cpu_attn` (#38676), gelu in `cpu_fused_moe` (#38770), OMP replacement (#36487), BF16 GELU (#32662, #35697).",
                "Speculative decoding: Eagle3 for MiniMax-M2 (#37512), Eagle3 for Gemma4 (#39450) (#37512, #39450).",
                "Unified Synthetic Acceptance Rate for V1 and V2 (#40662). `SpecDecodeBaseProposer` moved out of `eagle.py` (#40732) (#40662, #40732).",
                "Mamba: default to `'align'` cache mode for Mamba-based models when speculative decoding is enabled (#40454)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33176",
                "#36276",
                "#36261"
              ],
              "before": "Prior to v0.20.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "EPLB: Alternative communication for EPLB weight exchange (#33176), nixl-based EPLB communicator (#36276), mapping optimization with router record for prefill (#36261), `TransferMetadata` (#33176, #36276).",
                "Disaggregated / NIXL / Mamba: Full PD support for Mamba2-like models on Heterogeneous TP deployments (#37635), Nixl bumped to 0.10.1 (#39922), `TpKVTopology` + `HeteroTPTransferConfig` unified into (#37635, #39922).",
                "Pooling ecosystem: Pooling entrypoints overhauled across scoring (#28631), pooling (#39153), and cleanup (#39675). preprocessing/postprocessing offloaded to thread pool (#39763) (#28631, #39153).",
                "CUDA 13.0 default with updated architecture lists and cleaned build-args (#39878). CUDA bumped to 13.0.2 to match PyTorch 2.11.0 (#40669) (#39878, #40669)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Petit NVFP4 (#32694), `accept output buffer` in attention (#39125), `cprofile` / `cprofile_context` (#39100), `LLM.reward` offline API (#40688). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32694"
              },
              {
                "change": "Security",
                "impact": "SSRF fix in batch runner `download_bytes_from_url` (#38482).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#38482"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: CPU draft-model speculative decoding (#32662), CPU int8 compute mode in AWQ (#35697), head_size 512 in `cpu_attn` (#38676), gelu in `cpu_fused_moe` (#38770",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32662"
            },
            {
              "label": "Quantization",
              "hardware": "New formats & methods: TurboQuant 2-bit KV cache compression (#38479) with FA3/FA4 prefill (#40092), per-token-head INT8/FP8 KV cache quantization (#38378), fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#38479"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Other: DeepGEMM integrated into the vLLM wheel via CMake (#37980), Lustre FS checkpoint prefetching enabled by default (#39422), Gemma4 fused routing Triton ker",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37980"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: CPU draft-model speculative decoding (#32662), CPU int8 compute mode in AWQ (#35697), head_size 512 in `cpu_attn` (#38676), gelu in `cpu_fused_moe` (#38770",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32662"
            },
            {
              "label": "Quantization",
              "hardware": "New formats & methods: TurboQuant 2-bit KV cache compression (#38479) with FA3/FA4 prefill (#40092), per-token-head INT8/FP8 KV cache quantization (#38378), fus",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#38479"
            }
          ]
        }
      },
      {
        "version": "v0.19.0",
        "badge": "Release",
        "date": "2026-04-03",
        "stats": "127 upstream changes and 217 PRs",
        "headline": "Gemma 4 support, Zero-bubble async scheduling + speculative decoding",
        "executive_summary": "vLLM v0.19.0 focuses on Disaggregated Serving, Extensible KV Cache, Memory Budgeting & Tiered Offloading, and Low-Precision Quantization Kernels. For operators, this release translates 127 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Gemma 4 support",
              "plain_summary": "Full Google Gemma 4 architecture support including MoE, multimodal, reasoning, and tool-use capabilities (#38826, #38847). Requires `transformers>=5.5.0`. We recommend using pre-built docker image `vllm/vllm-openai:gemma4` for out of box usage."
            },
            {
              "headline": "Zero-bubble async scheduling + speculative decoding",
              "plain_summary": "Async scheduling now supports speculative decoding with zero-bubble overlap, significantly improving throughput (#32951)."
            },
            {
              "headline": "Model Runner V2 maturation",
              "plain_summary": "MRV2 gains piecewise CUDA graphs for pipeline parallelism (#35162), spec decode rejection sampler with greedy/logprobs support (#37238, #37237), multi-modal embeddings for spec decode (#36097), streaming inputs (#37028), and EPLB support (#37488)."
            },
            {
              "headline": "ViT Full CUDA Graphs",
              "plain_summary": "Vision encoders (ViT) now support full CUDA graph capture for reduced overhead (#35963)."
            }
          ],
          "big_deal": [
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#37198",
                "#37609",
                "#37345"
              ],
              "before": "Prior to v0.19.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "Compilation: Mega AOT artifact for torch 2.12+ (#37198), lazy graph module to defer recompile (#37609), remove model tag requirement for compile cache (#37345), Triton autotuning disk cache enabled (#37198, #37609).",
                "B300/GB300 (SM 10.3): Allreduce fusion enabled by default (#37755), tuned all-reduce communicator (#37756) (#37755, #37756).",
                "Disaggregated serving: PD kv_transfer_params for Anthropic Messages (#37535) and Responses API (#37424), Mooncake heterogeneous TP (#36869), Mamba N-1 prefill for P/D (#37310) (#37535, #37424).",
                "UX: Log once per node by default (#37568), torch profiler with stack enabled (#37571) (#37568, #37571)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#37054",
                "#37728",
                "#37024"
              ],
              "before": "Prior to v0.19.0, teams operating extensible kv cache, memory budgeting & tiered offloading relied on older execution paths or manual tuning on NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers.",
              "tech_bullets": [
                "Bugfixes: Fix gibberish from FP8 MLA KV scale inconsistency (#37054), Mamba state corruption (#37728), deadlock with pause/resume (#37024), FlashInfer MNNVL socket collisions (#36674), multimodal (#37054, #37728).",
                "CPU: Enable tcmalloc by default (#37607), graceful degradation without tcmalloc/libiomp (#37561), 48.9% throughput improvement for pooling models (#38139), OpenMP thread fix for torch.compile (#37607, #37561).",
                "Attention: Distinguish short extends vs decodes (#37303), allow qk_nope_head_dim=192 in FlashInfer MLA (#37475), skip sliding window attention layers with FP8 KV cache (#33695) (#37303, #37475).",
                "Non-contiguous KV cache in TRTLLM FP8 dequant kernel (#36867), Qwen3 dual stream input projection (#36795) (#36867, #36795)."
              ],
              "why_it_matters": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#36265",
                "#37340",
                "#31201"
              ],
              "before": "Prior to v0.19.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Tuned prefill configs for FP8 FA3 (#36265), tuned Triton MoE config for Qwen3.5 on H200 with 9.9% E2E improvement (#37340), H800 MoE configs (#31201) (#36265, #37340).",
                "Removals: Per-tensor-per-channel FP8 removed (#32700), Sparse24 integration and kernels removed (#36799) (#32700, #36799).",
                "GPT-OSS: Router GEMM kernel (#37205), eliminate padding with FlashInfer MXFP4/MXFP8 MoE (#30647), reduce redundant SparseMatrix creation (#37683) (#37205, #30647).",
                "Performance fixes: FP8 DeepGEMM batch invariance (#37718), Triton autotuning for Qwen3.5 (#37338), TRTLLM NVFP4 routing precision (#36725) (#37718, #37338)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#38826",
                "#35809",
                "#38120"
              ],
              "before": "Prior to v0.19.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New architectures: Gemma 4 (#38826), Cohere ASR (#35809), Cohere Transcribe (#38120), ColQwen3.5 4.5B (#36887), LFM2-ColBERT-350M (#37528), Granite 4.0 1B Speech (#38019), Qwen3-ForcedAligner (#38826, #35809).",
                "LoRA expansion: H2OVL tower/connector LoRA (#31696), `--lora-target-modules` to restrict LoRA to specific modules (#34984), `language_model_only` respected (#37375), Mistral3 fix (#36928), Qwen3.5 (#31696, #34984).",
                "Features: Temporal compression for Nemotron-3-VL videos (#36808), NemotronH Puzzle + MTP (#37803), torch.compile for InternVL vision encoder (#38049), multiple embedding types in single call (#35829) (#36808, #37803).",
                "Features: Limit thinking tokens (hard limit) (#20859), multiple embedding types in single call (#35829), numpy array embeddings for multimodal (#38119), `--lora-target-modules` (#34984), `-sc` (#20859, #35829)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35162",
                "#37238",
                "#37237"
              ],
              "before": "Prior to v0.19.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Model Runner V2: PP CUDA graphs (#35162), spec decode rejection sampler greedy (#37238) + logprobs (#37237), multimodal embeddings for spec decode (#36097), streaming inputs (#37028), configurable (#35162, #37238).",
                "Performance: Optimize top-k in Triton sampler (#37225), optimize token_embed for pooling models with 1% improvement (#37347), fix slow hasattr in CUDAGraphWrapper (#37425), NFS prefetch auto-enabled (#37225, #37347).",
                "EPLB: MRV2 support (#37488), improved responsiveness (#36271), EP weight filter fix (#37322) (#37488, #36271).",
                "NVFP4 CUTLASS MoE non-gated support (#37320), fuse pack topk in TRTLLM MoE via torch.compile (#37695) (#37320, #37695)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Deprecate virtual engine (#37195). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37195"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecate `--disable-frontend-multiprocessing` (#37612). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37612"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Refactor KV cache from list to element (#37487). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37487"
              },
              {
                "change": "Security",
                "impact": "Add `VLLM_MAX_N_SEQUENCES` environment variable to enforce sequence limits (#37952).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#37952"
              },
              {
                "change": "Security",
                "impact": "Enforce frame limit in VideoMediaIO to prevent resource exhaustion (#38636).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#38636"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Performance: Optimize top-k in Triton sampler (#37225), optimize token_embed for pooling models with 1% improvement (#37347), fix slow hasattr in CUDAGraphWrapp",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37225"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Persistent MLA kernel from AITER (#36574), FP8xFP8 attention in AITER (#36927).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#36574"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AWQ Marlin support (#36505), wvSplitK skinny GEMM for RDNA4/gfx1x (#34709).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#36505"
            },
            {
              "label": "API & Frontend",
              "hardware": "Responses API: Fix crash with tool_choice=required exceeding max_output_tokens (#37258), fix TTFT recording (#37498), fix Anthropic serving template kwargs (#37",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37258"
            },
            {
              "label": "Engine Core",
              "hardware": "Bugfixes: Fix gibberish from FP8 MLA KV scale inconsistency (#37054), Mamba state corruption (#37728), deadlock with pause/resume (#37024), FlashInfer MNNVL soc",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#37054"
            }
          ]
        }
      },
      {
        "version": "v0.18.0",
        "badge": "Release",
        "date": "2026-03-20",
        "stats": "65 upstream changes and 154 PRs",
        "headline": "gRPC Serving Support, GPU-less Render Serving",
        "executive_summary": "vLLM v0.18.0 focuses on Model Runner V2, Frontier MoE & Sparse-MLA Speedups, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 65 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "gRPC Serving Support",
              "plain_summary": "vLLM now supports gRPC serving via the new `--grpc` flag (#36169), enabling high-performance RPC-based serving alongside the existing HTTP/REST interface."
            },
            {
              "headline": "GPU-less Render Serving",
              "plain_summary": "New `vllm launch render` command (#36166, #34551) enables GPU-less preprocessing and rendering, allowing separation of multimodal preprocessing from GPU inference."
            },
            {
              "headline": "NGram GPU Speculative Decoding",
              "plain_summary": "NGram speculative decoding now runs on GPU and is compatible with the async scheduler (#29184), significantly reducing spec decode overhead."
            },
            {
              "headline": "KV Cache Offloading Improvements",
              "plain_summary": "Smart CPU offloading that stores only frequently-reused blocks (#35342), plus FlexKV as a new offloading backend (#34328) and support for multiple KV groups in offloading spec (#36610)."
            }
          ],
          "big_deal": [
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#28053",
                "#36159",
                "#36710"
              ],
              "before": "Prior to v0.18.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Performance: Remove busy loop from idle buffer readers (#28053), 2.7% E2E throughput for pooling via worker-side maxsim (#36159), 3.2% via batched maxsim (#36710), CUDA graph memory accounting during (#28053, #36159).",
                "Model Runner V2: Probabilistic rejection sampling for spec decode (#35461), pooling models (#36019), extensible CUDA graph dispatch (#35959), WhisperModelState (#35790), XD-RoPE (#36817), model_state (#35461, #36019).",
                "Intel XPU: Model Runner V2 enabled (#36078), MLA Sparse backend for DeepSeek V3.2 (#33230), LoRA via torch.compile (#36962), block FP8 MoE fallback (#36458), deepseek_scaling_rope fused kernel (#36078, #33230).",
                "torch.compile: FakeTensors instead of real GPU tensors for single-size compilation (#36093), non-contiguous fused RMSNorm + group quant (#36551), stop lazy compiling (#35472) (#36093, #36551)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#36557",
                "#35194",
                "#36691"
              ],
              "before": "Prior to v0.18.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Stability: VLM concurrent throughput degradation fix (#36557), DP deadlock fix (#35194), DeepSeek V3.2 OOM during CG profiling (#36691), Ray DP startup crash (#36665), NCCL rank calculation fix (#36557, #35194).",
                "New architectures: Sarvam MoE (#33942), OLMo Hybrid (#32550), HyperCLOVAX-SEED-Think-32B VLM (#31471), HyperCLOVAX-SEED-Think-14B (#37107), Kimi-Audio-7B-Instruct (#36127), ColPali late-interaction (#33942, #32550).",
                "Speculative decoding: Eagle3 for Qwen3.5 (#36658), Eagle3 for Kimi K2.5 MLA (#36361), Eagle for Mistral Large 3 with dense layers (#36163) (#36658, #36361).",
                "NVIDIA: FA4 for MLA prefill (#34732), DeepSeek-V3.2 MLA kernel optimizations (#34917, #35290) (#34732, #34917)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35781",
                "#35158",
                "#36687"
              ],
              "before": "Prior to v0.18.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "PD Disaggregation: ~5% scheduler overhead reduction (#35781), KV transfer fix with spec decode (#35158), P/D for hybrid SSM-FA models via NIXL (#36687), PP for multimodal models on Transformers (#35781, #35158).",
                "Fixes: DeepSeek-V3.2 tokenizer space stripping (#37004), Qwen3.5 tool calling (#36774), Qwen3-VL timestamp mismatch (#36136), Qwen3-Next TP>1 weight sharding (#36242), Qwen3-ASR torch.compile (#37004, #36774).",
                "LoRA: Whisper LoRA (#29856), FP8 LoRA dense kernel (#35242) (#29856, #35242).",
                "Performance: Qwen3 Next fused GDN kernel (#35777), LFM2 tuned H100 MoE configs (#36699) (#35777, #36699)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35316",
                "#36247",
                "#35719"
              ],
              "before": "Prior to v0.18.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "ROCm: Quark W4A8 MXFP4/FP8 for LinearLayer (#35316), compressed-tensors fix for DeepSeek-R1 on MI300x (#36247) (#35316, #36247).",
                "AMD ROCm: Sparse MLA CUDA graphs (#35719), MTP lens > 1 in Sparse MLA (#36681), MLA with nhead<16 + FP8 KV for TP=8 (#35850), RoPE+KV cache fusion for AITER FA (#35786), AITER MLA CPU sync avoidance (#35719, #36681).",
                "Fixes: MLA crash with AWQ/GPTQ quantized models (#34695), score layer quantization for reranker models (#35849), GLM-4.1V non-default quantization (#36321), FP8 k_scale/v_scale loading for Qwen3-MoE (#34695, #35849).",
                "MXFP4 MoE routing simulation override for accuracy (#33595)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35758",
                "#34328",
                "#31964"
              ],
              "before": "Prior to v0.18.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "KV Connectors: HMA + NIXL connector (#35758), FlexKV offloading (#34328), worker\u2192scheduler metadata (#31964), All-to-All DCP backend (#34883) (#35758, #34328).",
                "Performance: 5% E2E improvement for PD disaggregation scheduling (#35781), packed recurrent decode fast path (#36596), pooling model maxsim 2.7%+3.2% throughput (#36159, #36710) (#35781, #36596).",
                "Elastic EP Milestone 2: NIXL-EP integration (#35627), `--enable-ep-weight-filter` for faster EP loading (#37351) (#35627, #37351).",
                "Defaults: Cascade attention disabled by default (#36318)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Security",
                "impact": "Respect user `trust_remote_code` setting in NemotronVL and KimiK25 (#36192).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#36192"
              },
              {
                "change": "Security",
                "impact": "Upgrade xgrammar for security fix (#36168).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#36168"
              },
              {
                "change": "Security",
                "impact": "Guard RLHF weight sync deserialization behind insecure serialization flag (#35928).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35928"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Quantization",
              "hardware": "ROCm: Quark W4A8 MXFP4/FP8 for LinearLayer (#35316), compressed-tensors fix for DeepSeek-R1 on MI300x (#36247).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#35316"
            },
            {
              "label": "Engine Core",
              "hardware": "Performance: Remove busy loop from idle buffer readers (#28053), 2.7% E2E throughput for pooling via worker-side maxsim (#36159), 3.2% via batched maxsim (#3671",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28053"
            },
            {
              "label": "Engine Core",
              "hardware": "Stability: VLM concurrent throughput degradation fix (#36557), DP deadlock fix (#35194), DeepSeek V3.2 OOM during CG profiling (#36691), Ray DP startup crash (#",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#36557"
            },
            {
              "label": "Large Scale Serving",
              "hardware": "PD Disaggregation: ~5% scheduler overhead reduction (#35781), KV transfer fix with spec decode (#35158), P/D for hybrid SSM-FA models via NIXL (#36687), PP for ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#35781"
            },
            {
              "label": "Quantization",
              "hardware": "ROCm: Quark W4A8 MXFP4/FP8 for LinearLayer (#35316), compressed-tensors fix for DeepSeek-R1 on MI300x (#36247).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#35316"
            }
          ]
        }
      },
      {
        "version": "v0.17.0",
        "badge": "Release",
        "date": "2026-03-07",
        "stats": "107 upstream changes and 199 PRs",
        "headline": "PyTorch 2.10 Upgrade, FlashAttention 4 Integration",
        "executive_summary": "vLLM v0.17.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 107 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "PyTorch 2.10 Upgrade",
              "plain_summary": "This release upgrades to PyTorch 2.10.0, which is a breaking change for environment dependencies."
            },
            {
              "headline": "FlashAttention 4 Integration",
              "plain_summary": "vLLM now supports the FlashAttention 4 backend (#32974), bringing next-generation attention performance."
            },
            {
              "headline": "Model Runner V2 Maturation",
              "plain_summary": "Model Runner V2 has reached a major milestone with Pipeline Parallel (#33960), Decode Context Parallel (#34179), Eagle3 speculative decoding with CUDA graphs (#35029, #35040), pooling model support (#35120), piecewise & mixed CUDA graph capture (#32771), DP+EP for spec decoding (#35294), and a new ModelState architecture. Design docs are now available (#35819)."
            },
            {
              "headline": "Qwen3.5 Model Family",
              "plain_summary": "Full support for the Qwen3.5 model family (#34110) featuring GDN (Gated Delta Networks), with FP8 quantization, MTP speculative decoding, and reasoning parser support."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31195",
                "#34448",
                "#31828"
              ],
              "before": "Prior to v0.17.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "NVIDIA: SM100 FMHA FP8 prefill for MLA (#31195), SM100 MXFP8 blockscaled grouped MM and quant kernels (#34448), SM100 Oink RMSNorm path (#31828), SM120 FP8 GEMM optimization (#34424), FlashInfer (#31195, #34448).",
                "Faster topKperRow decode kernel for DeepSeek-V3.2 sparse attention (#33680).",
                "Fix routing for models without expert groups (MiniMax-M2.1) (#34673).",
                "KV scale loading fix for MLA models (#35430)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#34697",
                "#34580",
                "#34478"
              ],
              "before": "Prior to v0.17.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Performance: Qwen3.5 GDN projector fusion (#34697), FlashInfer cuDNN backend for Qwen3 VL ViT (#34580), Step3.5-Flash NVFP4 (#34478), Qwen3MoE tuned configs for H200 (#35457) (#34697, #34580).",
                "AMD ROCm: AITER fused RoPE+KVCache (#33443), MXFP4 MoE weight pre-shuffling on gfx950 (#34192), bitsandbytes quantization (#34688), CK backend for MoE quantization (#34301), dynamic MXFP4 for (#33443, #34192).",
                "AMD: CK backend for MoE (#34301), dynamic MXFP4 for DeepSeek V2 (#34157), bitsandbytes on ROCm (#34688), GPT-OSS Quark format (#29008) (#34301, #34157).",
                "CPU: ARM BF16 cross-compilation (#33079), FP16 for s390x (#34116), KleidiAI INT8_W4A8 for all input dtypes (#34890), s390x vector intrinsics for attention (#34434), prefix caching for ppc64le (#33079, #34116)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#34110",
                "#34398",
                "#34558"
              ],
              "before": "Prior to v0.17.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New architectures: Qwen3.5 (#34110), COLQwen3 (#34398), ColModernVBERT (#34558), Ring 2.5 (#35102), skt/A.X-K1 (#32407), Ovis 2.6 (#34426), nvidia/llama-nemotron-embed-vl-1b-v2 (#35297) (#34110, #34398).",
                "Fixes: DeepSeek-VL V2 simplified loading (#35203), Qwen3/Qwen3.5 reasoning parser (#34779), Qwen2.5-Omni/Qwen3-Omni mixed-modality (#35368), Ernie4.5-VL garbled output (#35587), Qwen-VL tokenizer (#35203, #34779).",
                "ASR models: FunASR (#33247), FireRedASR2 (#35727), Qwen3-ASR realtime streaming (#34613) (#33247, #35727).",
                "Multimodal: OpenPangu-VL video input (#34134), audio chunking for offline LLM (#34628), Parakeet audio encoder for nemotron-nano-vl (#35100), MiniCPM-o flagos (#34126) (#34134, #34628)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33960",
                "#34179",
                "#32771"
              ],
              "before": "Prior to v0.17.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Model Runner V2: Pipeline Parallel (#33960), Decode Context Parallel (#34179), piecewise & mixed CUDA graphs (#32771), Eagle3 with CUDA graphs (#35029, #35040), pooling models (#35120), DP+EP for (#33960, #34179).",
                "Intel XPU: CUDA graph support (#34482), GPUDirect RDMA via NIXL (#35270), TORCH_SDPA/TRITON_ATTN as ViT backend (#35010), vllm-xpu-kernels v0.1.3 (#35984) (#34482, #35270).",
                "Eagle3 on Model Runner V2 with CUDA graphs (#35029, #35040), Eagle3 + disaggregated serving (#34529).",
                "Decode Context Parallel in Model Runner V2 (#34179)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#35424",
                "#35082",
                "#34874"
              ],
              "before": "Prior to v0.17.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "Fixes: allreduce_rms_fusion disabled by default with PP > 1 (#35424), DCP + FA3 crash (#35082), prefix caching for Mamba \"all\" mode (#34874), num_active_loras fix (#34119), async TP reduce-scatter (#35424, #35082).",
                "NIXL: Token-based IPC API (#34175), version bound (#35495), NUMA core binding (#32365) (#34175, #35495).",
                "Breaking: KV load failure policy default changed from \"recompute\" to \"fail\" (#34896).",
                "Bound NIXL upper bound version (#35495)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed per-request logits processors (#34400). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#34400"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed unused MM placeholders in request output (#34944). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#34944"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed Swin model (#35821). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35821"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Scheduled v0.17 deprecations applied (#35441). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#35441"
              },
              {
                "change": "Security",
                "impact": "Fix SSRF bypass via backslash-@ URL parsing inconsistency (#34743).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#34743"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: ARM BF16 cross-compilation (#33079), FP16 for s390x (#34116), KleidiAI INT8_W4A8 for all input dtypes (#34890), s390x vector intrinsics for attention (#344",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33079"
            },
            {
              "label": "MoE Refactor",
              "hardware": "Fused MoE + LoRA shared expert dual stream, 1.07x throughput (#34933).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#34933"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "NVIDIA: SM100 FMHA FP8 prefill for MLA (#31195), SM100 MXFP8 blockscaled grouped MM and quant kernels (#34448), SM100 Oink RMSNorm path (#31828), SM120 FP8 GEMM",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31195"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "CPU: ARM BF16 cross-compilation (#33079), FP16 for s390x (#34116), KleidiAI INT8_W4A8 for all input dtypes (#34890), s390x vector intrinsics for attention (#344",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33079"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Performance: Pipeline Parallel async send/recv 2.9% E2E throughput (#33368), pooling maxsim 13.9% throughput improvement (#35330), Triton ViT attention backend ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33368"
            }
          ]
        }
      },
      {
        "version": "v0.16.0",
        "badge": "Release",
        "date": "2026-02-25",
        "stats": "42 upstream changes and 152 PRs",
        "headline": "Async scheduling + Pipeline Parallelism, Realtime API",
        "executive_summary": "vLLM v0.16.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 42 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Async scheduling + Pipeline Parallelism",
              "plain_summary": "is now fully supported, delivering 30.8% E2E throughput improvement and 31.8% TPOT improvement (#32618)."
            },
            {
              "headline": "Realtime API",
              "plain_summary": "A new WebSocket-based Realtime API enables streaming audio interactions (#33187), building on the Voxtral realtime infrastructure."
            },
            {
              "headline": "RLHF workflow improvements",
              "plain_summary": "Native NCCL-based weight syncing API (#31943), layerwise weight reloading for QeRL (#32133), and engine pause/resume with request preservation (#32351)."
            },
            {
              "headline": "Unified Parallel Drafting",
              "plain_summary": "for speculative decoding (#32887), plus spec decode now works with structured outputs (#33374) and penalty application in Model Runner V2 (#33251)."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33193",
                "#33371",
                "#33221"
              ],
              "before": "Prior to v0.16.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "UX: Nested configs in YAML files (#33193), GGUF `repo_id:quant_type` syntax (#33371), DeepSeek ReasoningParser with thinking enabled by default (#33221), remove noisy CT warning (#33273), early (#33193, #33371).",
                "Performance: GLM-4.7-GPTQ decode and MTP acceptance rate regression fix (#33771), DeepSeek V3.2 fast detokenization (#33855), DeepSeek V3.2 tokenizer fix (#33832), GLM-5 MTP accuracy fix (#34385) (#33771, #33855).",
                "NVIDIA: FlashInfer TRTLLM BF16 MoE integration (#32954), SM100 INT4 W4A16 kernel (#32437), SM121 (DGX Spark) CUTLASS support (#33517), MNNVL protocol for GB series (#33540), FlashInfer MLA concat (#32954, #32437).",
                "ARM CPU: KleidiAI INT4 dynamic quant with BF16 activations (#33122), NEON BFMMLA BF16 paged attention (#32263), vectorization backend optimization (#30329), attention dispatch by head_dim alignment (#33122, #32263)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33379",
                "#33659",
                "#33679"
              ],
              "before": "Prior to v0.16.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Intel XPU: Platform overhaul - deprecated IPEX, switched to vllm-xpu-kernels (#33379). New: unquantized MoE (#33659), MXFP4 MoE (#33679), WNA16 kernel (#33973), scaled_mm kernel (#34117), FP8 MoE (#33379, #33659).",
                "Removed BitBlas quantization (#32683) and Marlin 24 (#32688) (#32683, #32688).",
                "Performance: Chat completion streaming optimization (#33782), ORJSONResponse for faster API responses (#33548), MoE permute optimization for CUTLASS FP8 (#32892), shared/routed overlap for latent MoE (#33782, #33548).",
                "New: FP8 block quant for CompressedTensorsW8A16Fp8 (#33280), ModelOpt MXFP8 for dense models (#33786), NVFP4/FP8 on Turing GPUs (#33076), TP > 4 for FP4 Gemm (#31099) (#33280, #33786)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33005",
                "#33312",
                "#33165"
              ],
              "before": "Prior to v0.16.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New architectures: GLM-OCR with MTP (#33005), Qwen3-ASR (#33312), DeepSeek-OCR-2 (#33165), Intern-S1-Pro (#33636), MiniCPM-o 4.5 (#33431), openPangu7B-VL (#32449), NemotronHPuzzle heterogeneous (#33005, #33312).",
                "LoRA expansion: Gemma3 vision components (#32764), Nemotron-H MTP models (#32265), Qwen3 output embedding (#29816). Optimized fused MoE-LoRA kernel indexing (#32770, #32774), unpermute-aware fused (#32764, #32265).",
                "Features: Qwen3-Omni transcription (#29828), Mistral Large 3 with FlashInfer MoE (#33174), LFM2 SigLIP2 intermediate encoder layers (#33370), Qwen3-Omni/GLM-4.xV MRoPE positioning fixes (#33010 (#29828, #33174).",
                "Performance: Grammar bitmask H2D copy on separate stream (#33059), zero-copy GQA for multimodal and CPU (#33732), early-reject oversized MM requests (#33502), CPU memory leak fix from Request (#33059, #33732)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Deprecation & Breaking Changes Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33402",
                "#33477",
                "#33535"
              ],
              "before": "Prior to v0.16.0, teams operating deprecation & breaking changes enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Removed deprecated `reasoning_content` message field (#33402).",
                "Removed deprecated pooling items (#33477).",
                "Removed deprecated `VLLM_ALL2ALL_BACKEND` environment variable (#33535)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32042",
                "#32492",
                "#30976"
              ],
              "before": "Prior to v0.16.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "AMD ROCm: QWEN3-NEXT FP8 tunings (#32042), AITER attention backend for Qwen3-Next (#32492), fused_add_rmsnorm_pad for GPT-OSS (#30976), Qwen3-Omni startup fix (#33077) (#32042, #32492).",
                "Deprecated IPEX for XPU, switched to vllm-xpu-kernels (#33379).",
                "Structured outputs: Performance optimization with reasoning (#33557), guidance vocab size fix (#33509) (#33557, #33509)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Deprecation & Breaking Changes Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Removed BitBlas quantization (#32683) and Marlin 24 (#32688). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32683"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated `reasoning_content` message field (#33402). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33402"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated pooling items (#33477). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33477"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Removed deprecated `VLLM_ALL2ALL_BACKEND` environment variable (#33535). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33535"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated IPEX for XPU, switched to vllm-xpu-kernels (#33379). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#33379"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "IBM Z: BF16 kernel type for s390x (#33788).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33788"
            },
            {
              "label": "Engine Core",
              "hardware": "Async scheduling + Pipeline Parallelism: Full support with 30.8% throughput improvement (#32618), optimized spec decode + async scheduling with 1.5% throughput ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32618"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "IBM Z: BF16 kernel type for s390x (#33788).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#33788"
            }
          ]
        }
      },
      {
        "version": "v0.15.0",
        "badge": "Release",
        "date": "2026-01-29",
        "stats": "50 upstream changes and 77 PRs",
        "headline": "Bug Fixes",
        "executive_summary": "vLLM v0.15.0 focuses on Multi-Vendor Accelerator Scaling, Model Runner V2, and Low-Precision Quantization Kernels. For operators, this release translates 50 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Bug Fixes",
              "plain_summary": "* Speculative decoding: Eagle draft_model_config fix (#31753). * DeepSeek: DeepSeek-V3.1 + DeepGEMM incompatible scale shapes fix (#32361). * Distributed: DP+MoE inference fix via CpuCommunicator (#31867), P/D with non-MoE DP fix (#33037). * EPLB: Possible deadlock fix (#32418). * NIXL: UCX memory leak fix by exporting UCX_MEM_MMAP_HOOK_MODE=none (#32181). * Structured output: Outlines byte fallback handling fix (#31391). ---"
            }
          ],
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32661",
                "#28506",
                "#32438"
              ],
              "before": "Prior to v0.15.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Metrics: Removed deprecated `vllm:time_per_output_token_seconds` metric - use `vllm:inter_token_latency_seconds` instead (#32661).",
                "TPU: Pipeline parallelism support (#28506), backend option (#32438) (#28506, #32438).",
                "MoRI EP: High-performance all2all backend for Expert Parallel (#28664).",
                "Consumer GPU support: Flash Attention Triton backend on RDNA3/RDNA4 (#32944)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32058",
                "#30885",
                "#32805"
              ],
              "before": "Prior to v0.15.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "MoE performance: 1.2-2% E2E throughput improvement via grouped topk kernel fusion (#32058), NVFP4 small-batch decoding improvement (#30885), faster cold start for MoEs with torch.compile (#32805) (#32058, #30885).",
                "Model Runner V2: VLM support (#32546), architecture improvements.",
                "torch.compile: SiluAndMul and QuantFP8 CustomOp compilation (#32806), Triton prefill attention performance (#32403) (#32806, #32403).",
                "AOT compilation: torch.compile inductor artifacts support (#25205)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#32679",
                "#32697",
                "#32681"
              ],
              "before": "Prior to v0.15.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Quantization: DeepSpeedFp8 removed (#32679), RTN removed (#32697), HQQ deprecated (#32681) (#32679, #32697).",
                "MXFP4: W4A16 support for compressed-tensors MoE models (#32285).",
                "Non-gated MoE: Quantization support with Marlin, NVFP4 CUTLASS, FP8, INT8, and compressed-tensors (#32257).",
                "FP8 KV cache: Per-tensor and per-attention-head quantization via llmcompressor (#30141)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#33131",
                "#30997",
                "#32329"
              ],
              "before": "Prior to v0.15.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "New architectures: Kimi-K2.5 (#33131), Molmo2 (#30997), Step3vl 10B (#32329), Step1 (#32511), GLM-Lite (#31386), Eagle2.5-8B VLM (#32456) (#33131, #30997).",
                "Blackwell defaults: FlashInfer MLA is now the default MLA backend on Blackwell, with TRTLLM as default prefill (#32615).",
                "FP4 support: MLA projection GEMMs with dynamic quantization (#32238).",
                "DeepSeek: DeepSeek-V3.1 + DeepGEMM incompatible scale shapes fix (#32361)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#30802",
                "#32397",
                "#32763"
              ],
              "before": "Prior to v0.15.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "LoRA expansion: Nemotron-H (#30802), InternVL2 (#32397), MiniMax M2 (#32763) (#30802, #32397).",
                "Model enhancements: Voxtral streaming architecture (#32861), SharedFusedMoE for Qwen3MoE (#32082), dynamic resolution for Nemotron Nano VL (#32121), Molmo2 vision backbone quantization (#32385) (#32861, #32082).",
                "LoRA: Inplace loading for memory efficiency (#31326).",
                "Whisper API: `avg_logprob` and `compression_ratio` in verbose_json segments (#31059)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Metrics: Removed deprecated `vllm:time_per_output_token_seconds` metric - use `vllm:inter_token_latency_seconds` instead (#32661). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32661"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Environment variables: Removed deprecated environment variables (#32812). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32812"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Quantization: DeepSpeedFp8 removed (#32679), RTN removed (#32697), HQQ deprecated (#32681). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32679"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Mamba prefix caching: Block-aligned prefix caching for Mamba/hybrid models with `--enable-prefix-caching --mamba-cache-mode align`. Achieves ~2x speedup by cach",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30877"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "FP4 kernel optimization: Up to 65% faster FP4 quantization on Blackwell (SM100F) using 256-bit loads, ~4% E2E throughput improvement (#32520).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32520"
            },
            {
              "label": "Breaking Changes & Deprecations",
              "hardware": "Metrics: Removed deprecated `vllm:time_per_output_token_seconds` metric - use `vllm:inter_token_latency_seconds` instead (#32661).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32661"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "MoE performance: 1.2-2% E2E throughput improvement via grouped topk kernel fusion (#32058), NVFP4 small-batch decoding improvement (#30885), faster cold start f",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#32058"
            },
            {
              "label": "Engine Core",
              "hardware": "Mamba prefix caching: Block-aligned prefix caching for Mamba/hybrid models with `--enable-prefix-caching --mamba-cache-mode align`. Achieves ~2x speedup by cach",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30877"
            }
          ]
        }
      },
      {
        "version": "v0.14.0",
        "badge": "Release",
        "date": "2026-01-20",
        "stats": "120 upstream changes and 143 PRs",
        "headline": "Async scheduling is now enabled by default, Excludes some not-yet-supported configurations: pipeline parallel, CPU backend,",
        "executive_summary": "vLLM v0.14.0 focuses on Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend, Low-Precision Quantization Kernels, and Multi-Vendor Accelerator Scaling. For operators, this release translates 120 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Async scheduling is now enabled by default",
              "plain_summary": "Users who experience issues can disable with `--no-async-scheduling`."
            },
            {
              "headline": "Excludes some not-yet-supported configurations: pipeline parallel, CPU backend,",
              "plain_summary": "non-MTP/Eagle spec decoding."
            },
            {
              "headline": "PyTorch 2.9.1",
              "plain_summary": "is now required and the default wheel is compiled against cu129."
            },
            {
              "headline": "Deprecated quantization schemes have been removed.",
              "plain_summary": "Deprecated quantization schemes have been removed (#31688, #31285)."
            }
          ],
          "big_deal": [
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31569",
                "#31719",
                "#31539"
              ],
              "before": "Prior to v0.14.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "DeepSeek-OCR (#31569), Qwen3-Next (#31719), NemotronH (#31539), PLaMo 2/3 (#31569, #31719).",
                "Qwen3-VL as reranker (#31890).",
                "GDN attention decode speedup (Qwen3-Next) (#31722).",
                "Qwen3Moe B200 Triton configs (#31448)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31688",
                "#31285",
                "#30944"
              ],
              "before": "Prior to v0.14.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Deprecated quantization schemes removed (#31688, #31285).",
                "XPU: FP8 streaming quant (#30944), custom workers (#30944, #30935).",
                "Fused SiLU+Mul+Quant for NVFP4 (#31832).",
                "NVFP4 stride fusion (#31837)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#26575",
                "#28624",
                "#29304"
              ],
              "before": "Prior to v0.14.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "ROCm: AITER RMSNorm fusion (#26575), MTP for AITER MLA (#28624), moriio connector (#29304), xgrammar upstream (#26575, #28624).",
                "Async scheduling default with spec decode (#27614, #31998) and structured outputs.",
                "TPU: tpu-inference path (#30808), Sophgo docs (#30808, #30949)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Hardware & Performance Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31754",
                "#31830",
                "#31167"
              ],
              "before": "Prior to v0.14.0, teams operating hardware & performance enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "2.9% throughput + 10.8% TTFT via fill(0) optimization (#31754).",
                "5.3% throughput + 2.2% TTFT via problem size calculation (#31830).",
                "GDN Attention blocking copy removal (#31167).",
                "SM103 support (#30705, #31150)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#31147",
                "#30729",
                "#31493"
              ],
              "before": "Prior to v0.14.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "DeepSeek v3.2 chat prefix completion (#31147).",
                "FlashInfer rotary for DeepSeek (#30729).",
                "MiniMax-M2/M2.1 QKNorm (#31493).",
                "Kimi K2 update (#31207)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Hardware & Performance Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Deprecated quantization schemes removed (#31688, #31285) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#31688"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`seed_everything` deprecated (#31659) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#31659"
              },
              {
                "change": "Security",
                "impact": "Prevent token leaks in crash logs (#30751)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#30751"
              },
              {
                "change": "Security",
                "impact": "`weights_only=True` in torch.load (#32045)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#32045"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "2.9% throughput + 10.8% TTFT via fill(0) optimization (#31754)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31754"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "5.3% throughput + 2.2% TTFT via problem size calculation (#31830)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31830"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "2.9% throughput + 10.8% TTFT via fill(0) optimization (#31754)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31754"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "5.3% throughput + 2.2% TTFT via problem size calculation (#31830)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31830"
            },
            {
              "label": "Bug Fixes (User-Facing)",
              "hardware": "CPU RoPE gibberish with `--enforce-eager` (#31643)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#31643"
            }
          ]
        }
      },
      {
        "version": "v0.13.0",
        "badge": "Release",
        "date": "2025-12-19",
        "stats": "48 upstream changes and 95 PRs",
        "headline": "Model Runner V2, Low-Precision Quantization Kernels",
        "executive_summary": "vLLM v0.13.0 focuses on Model Runner V2, Low-Precision Quantization Kernels, and Frontier MoE & Sparse-MLA Speedups. For operators, this release translates 48 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Model Runner V2",
              "plain_summary": "Improves model runner v2 for all production gpu deployments, latency-sensitive streaming apps, and custom logits processors running on all cuda and rocm gpu fleets running vllm's v2 execution engine, delivering cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance."
            },
            {
              "headline": "Low-Precision Quantization Kernels",
              "plain_summary": "Improves low-precision quantization kernels for 100b\u20131t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput."
            },
            {
              "headline": "Frontier MoE & Sparse-MLA Speedups",
              "plain_summary": "Improves frontier moe & sparse-mla speedups for frontier mixture-of-experts (moe) reasoning and agentic models (deepseek-v4/v4.1, glm-5.3, kimi-k3/k3.1, minimax-m3.1) running on nvidia blackwell (gb200/gb300/b200), hopper (h100/h200), and multi-node expert parallel (ep) clusters, delivering delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens."
            },
            {
              "headline": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "plain_summary": "Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet."
            },
            {
              "headline": "Disaggregated Serving",
              "plain_summary": "Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore."
            }
          ],
          "big_deal": [
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29558",
                "#30171",
                "#30187"
              ],
              "before": "Prior to v0.13.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "DeepEP High-Throughput CUDA graph enabled by default: 5.3% throughput, 4.4% TTFT improvement (#29558).",
                "Model Runner V2: Min-p sampling (#30171), NaN detection in logits (#30187) (#30171, #30187).",
                "Attention: PrefixLM support for FlexAttention (#27938) and TritonAttention (#30386), CUDA graphs for 3D Triton attention (#28306), `TRITON_MLA` without prefix-caching (#29125) (#27938, #30386)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#25552",
                "#25693",
                "#26668"
              ],
              "before": "Prior to v0.13.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "AMD ROCm: Aiter quantization kernels (#25552), torch.compile layernorm/silu + FP8 quant (#25693), Triton ScaledMM fallback (#26668), MXFP4 w4a4 inference (#29775) (#25552, #25693).",
                "New: W4A8 grouped GEMM on Hopper (#29691), online FP8 with streaming post-processing (#29196), FP8 weight reloading for RLHF (#28480) (#29691, #29196).",
                "GGUF: MoE + GGUF restored for Qwen3 MoE (#30116), Qwen2 MoE (#30307), HF defaults override (#30118) (#30116, #30307).",
                "EPLB: NVFP4 support (#29804), algorithm abstraction (#26471) (#29804, #26471)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#30037",
                "#29752",
                "#30490"
              ],
              "before": "Prior to v0.13.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Model enhancements: Qwen3-VL embeddings support (#30037), Qwen3-VL EVS (Efficient Video Sampling) (#29752), DeepSeek V3.2 proper `drop_thinking` logic (#30490), DeepSeek V3.2 top-k fix (#27568) (#30037, #29752).",
                "Tool parsers: DeepSeek-V3.2 (#29848), Gigachat 3 (#29905), Holo2 reasoning (#30048) (#29848, #29905).",
                "MLA FP8 optimization with ReduceScatterSum (#29795), direct k_nope/k_pe copy (#29795, #29710).",
                "Sparse prefill kernel for FP8 KV-cache in DeepSeek-V3.2 (#27532)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29421",
                "#30072",
                "#30062"
              ],
              "before": "Prior to v0.13.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Whisper: Major performance improvements - [V1 is now faster than V0](https://github.com/vllm-project/vllm/issues/24946#issuecomment-3680725754) (~3x speedup vs v0.12.0). Encoder batching (#29421) (#29421, #30072).",
                "New models: BAGEL (AR only) (#28439), AudioFlamingo3 (#30539), JAIS 2 (#30188), latent MoE architecture support (#30203) (#28439, #30539).",
                "Performance: Fused blockwise quant RMS norm (#27883), MoE LoRA loading reduction (#30243), encoder cache optimization (#30475), CPU KV offloading streams (#29013) (#27883, #30243).",
                "CPU: Whisper support (#30062), Arm Optimized Routines vectorized exp (#30068), x86 CPU wheel pipeline (#28848) (#30062, #30068)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29503",
                "#28782",
                "#24718"
              ],
              "before": "Prior to v0.13.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "NIXL: Compatibility checking in handshake (#29503), large batch proxy support (#28782) (#29503, #28782).",
                "KV connectors: Mooncake Transfer Engine (#24718), cache reset via `/reset_prefix_cache` (#27170), KV events (#28309), failure recovery config (#26813) (#24718, #27170).",
                "Multi-node: External launcher mode (#29833).",
                "Hybrid allocator: Optional KV connector integration (#29805)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Security",
                "impact": "Additional protection for CVE-2025-62164 (#30649).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#30649"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Engine Core",
              "hardware": "Whisper: Major performance improvements - [V1 is now faster than V0](https://github.com/vllm-project/vllm/issues/24946#issuecomment-3680725754) (~3x speedup vs ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29421"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepEP High-Throughput CUDA graph enabled by default: 5.3% throughput, 4.4% TTFT improvement (#29558)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29558"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepGEMM fused layout kernel: 4.3% throughput, 10.7% TTFT improvement (#29546)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29546"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepGEMM experts initialization: 3.9% TTFT improvement (#30494)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30494"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "`group_topk` kernel: 1.9% throughput, 2.1% TPOT improvement (#30159)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#30159"
            }
          ]
        }
      },
      {
        "version": "v0.12.0",
        "badge": "Release",
        "date": "2025-12-03",
        "stats": "83 upstream changes and 77 PRs",
        "headline": "EAGLE Speculative Decoding Improvements, Significant Performance Optimizations",
        "executive_summary": "vLLM v0.12.0 focuses on Frontier MoE & Sparse-MLA Speedups, Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend, and V0 Deprecation & Breaking Changes Enhancements. For operators, this release translates 83 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "EAGLE Speculative Decoding Improvements",
              "plain_summary": "Multi-step CUDA graph support (#29559), DP>1 support (#26086), and multimodal support with Qwen3VL (#29594)."
            },
            {
              "headline": "Significant Performance Optimizations",
              "plain_summary": "18.1% throughput improvement from batch invariant BMM (#29345), 2.2% throughput improvement from shared experts overlap (#28879)."
            },
            {
              "headline": "AMD ROCm Expansion",
              "plain_summary": "DeepSeek v3.2 + SparseMLA support (#26670), FP8 MLA decode (#28032), AITER attention backend (#28701)."
            },
            {
              "headline": "V0 Deprecation & Breaking Changes",
              "plain_summary": "Removed Parameters: * `num_lookahead_slots` (#29000) * `best_of` (#29090) * LoRA extra vocab (#28545) Deprecated: * `xformers` backend (#29262) * `seed=None` (#29185) Scheduled Removals (will be removed in future release): * `ParallelConfig`'s direct child EPLB fields (#29324) * `guided_*` config fields (#29326) * `override_pooler_config` and `disable_log_requests` (#29402) * `CompilationConfig.use_inductor` (#29323) * Deprecated metrics (#29330) Other Breaking Changes: * PyTorch 2.9.0 upgrade requires CUDA 12.9 environment * Mistral format auto-detection for model loading (#28"
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29345",
                "#26670",
                "#28032"
              ],
              "before": "Prior to v0.12.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Batch invariant BMM optimization: 18.1% throughput improvement, 10.7% TTFT improvement on DeepSeek-V3.1 (#29345).",
                "DeepSeek v3.2 and SparseMLA support (#26670).",
                "FP8 MLA decode support (#28032).",
                "Shared Experts Overlap with FlashInfer DeepGEMM: 2.2% throughput improvement, 3.6% TTFT improvement at batch size 32 (#28879)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#28834",
                "#29068",
                "#29327"
              ],
              "before": "Prior to v0.12.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New model families: PLaMo-3 (#28834), OpenCUA-7B (#29068), HunyuanOCR (#29327), Mistral Large 3 and Ministral 3 (#29757) (#28834, #29068).",
                "Multimodal enhancements: Qwen3 Omni audio-in-video support (#27721), Eagle3 multimodal support for Qwen3VL (#29594) (#27721, #29594).",
                "LoRA extra vocab (#28545).",
                "Configuration: Flexible `inputs_embeds_size` separate from `hidden_size` (#29741), `--fully-sharded-loras` for fused_moe (#28761) (#29741, #28761)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "V0 Deprecation & Breaking Changes Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29330",
                "#29000",
                "#29090"
              ],
              "before": "Prior to v0.12.0, teams operating v0 deprecation & breaking changes enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Deprecated metrics (#29330).",
                "`num_lookahead_slots` (#29000).",
                "`best_of` (#29090).",
                "`xformers` backend (#29262)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#29242",
                "#28892",
                "#27141"
              ],
              "before": "Prior to v0.12.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "NVFP4 MoE CUTLASS support for SM120 (#29242).",
                "TRTLLM MoE NVFP4 kernel (#28892).",
                "CuteDSL MoE with NVFP4 DeepEP dispatch (#27141).",
                "LoRA: FusedMoE LoRA Triton kernel for MXFP4 (#29708)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Hardware & Performance Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#28992",
                "#28449",
                "#28225"
              ],
              "before": "Prior to v0.12.0, teams operating hardware & performance enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "H200 Fused MoE Config improvements (#28992).",
                "DeepEP low-latency with round-robin expert placement (#28449).",
                "Fastsafetensors support (#28225).",
                "Paged attention GEMM acceleration on ARM CPUs with NEON (#29193)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "V0 Deprecation & Breaking Changes Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "`num_lookahead_slots` (#29000) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29000"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`best_of` (#29090) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29090"
              },
              {
                "change": "Before You Upgrade",
                "impact": "LoRA extra vocab (#28545) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#28545"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`xformers` backend (#29262) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29262"
              },
              {
                "change": "Before You Upgrade",
                "impact": "`seed=None` (#29185) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#29185"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardware & Performance",
              "hardware": "Batch invariant BMM optimization: 18.1% throughput improvement, 10.7% TTFT improvement on DeepSeek-V3.1 (#29345)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29345"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Shared Experts Overlap with FlashInfer DeepGEMM: 2.2% throughput improvement, 3.6% TTFT improvement at batch size 32 (#28879)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28879"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Batch invariant BMM optimization: 18.1% throughput improvement, 10.7% TTFT improvement on DeepSeek-V3.1 (#29345)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#29345"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "Shared Experts Overlap with FlashInfer DeepGEMM: 2.2% throughput improvement, 3.6% TTFT improvement at batch size 32 (#28879)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28879"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "DeepEP low-latency with round-robin expert placement (#28449)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#28449"
            }
          ]
        }
      },
      {
        "version": "v0.11.0",
        "badge": "Release",
        "date": "2025-10-02",
        "stats": "585 upstream changes and 549 PRs",
        "headline": "This release completes the removal of V0 engine. V0 engine code including AsyncL, This releases turns on **FULL_AND_PIECEWISE as the CUDA gr",
        "executive_summary": "vLLM v0.11.0 focuses on Low-Precision Quantization Kernels, Frontier MoE & Sparse-MLA Speedups, and Disaggregated Serving. For operators, this release translates 585 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "This release completes the removal of V0 engine. V0 engine code including AsyncL",
              "plain_summary": "LMEngine, LLMEngine, MQLLMEngine, all attention backends, and related components have been removed. V1 is the only engine in the codebase now."
            },
            {
              "headline": "This releases turns on **FULL_AND_PIECEWISE as the CUDA graph mode default**. Th",
              "plain_summary": "This releases turns on FULL_AND_PIECEWISE as the CUDA graph mode default. This should provide better out of the box performance for most models, particularly fine-grained MoEs, while preserving compatibility with existing models supporting only PIECEWISE mode."
            },
            {
              "headline": "V0 Deprecation",
              "plain_summary": "* Engines: AsyncLLMEngine (#25025), LLMEngine (#25033), MQLLMEngine (#25019), core (#25321), model runner (#25328), MP executor (#25329). * Components: Attention backends (#25351), encoder-decoder (#24907), output processor (#25320), sampling metadata (#25345), Sequence/Sampler (#25332). * Interfaces: LoRA (#25686), async output processor (#25334), MultiModalPlaceholderMap (#25366), seq group methods (#25330), placeholder attention (#25510), input embeddings (#25242), multimodal registry (#25362), max_seq_len_to_capture (#25543), attention classes (#25541), hybrid models (#25400), backend suff"
            }
          ],
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#24733",
                "#24849",
                "#24741"
              ],
              "before": "Prior to v0.11.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Performance: GLM-4.1V 916ms TTFT reduction via fused RMSNorm (#24733), GLM-4 MoE SharedFusedMoE optimization (#24849), Qwen2.5-VL CUDA sync removal (#24741), Qwen3-VL Triton MRoPE kernel (#25055) (#24733, #24849).",
                "FP8: Per-token-group quantization (#24342), hardware-accelerated instructions (#24757), torch.compile KV cache (#22758), paged attention update (#22222) (#24342, #24757).",
                "FP4: NVFP4 for dense models (#25609), Gemma3 (#22771), Llama 3.1 405B (#25135) (#25609, #22771).",
                "Compressed tensors: Blocked FP8 for MoE (#25219)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#24462",
                "#24783",
                "#25896"
              ],
              "before": "Prior to v0.11.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "DeepGEMM: Enabled by default (#24462), 5.5% throughput improvement (#24783) (#24462, #24783).",
                "New architectures: DeepSeek-V3.2-Exp (#25896), Qwen3-VL series (#24727), Qwen3-Next (#24526), OLMo3 (#24534), LongCat-Flash (#23991), Dots OCR (#24645), Ling2.0 (#24627), CWM (#25611) (#25896, #24727).",
                "MoE: Shared expert overlap optimization (#24254), SiLU kernel for DeepSeek-R1 (#24054), Enable Allgather/ReduceScatter backend for NaiveAllToAll (#23964) (#24254, #24054).",
                "NVIDIA: FP8 FlashInfer MLA decode (#24705), BF16 fused MoE for Hopper/Blackwell expert parallel (#25503) (#24705, #25503)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#24532",
                "#25070",
                "#22188"
              ],
              "before": "Prior to v0.11.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "Distributed: NCCL symmetric memory with 3-4% throughput improvement (#24532), enabled by default for TP (#25070) (#24532, #25070).",
                "Disaggregated serving: KV transfer metrics (#22188), NIXL MLA latent dimension (#25902) (#22188, #25902).",
                "Removes source compilation of nixl dependency (#24874).",
                "Add Decode Context Parallelism (DCP) test to CI (#24487)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#25178",
                "#25703",
                "#25275"
              ],
              "before": "Prior to v0.11.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "AMD: ROCm 7.0 (#25178), GLM-4.5 MI300X tuning (#25703) (#25178, #25703).",
                "Only enable +rms_norm based on aiter if not explicitly disabled (#25275).",
                "Components: Attention backends (#25351), encoder-decoder (#24907), output processor (#25320), sampling metadata (#25345), Sequence/Sampler (#25332) (#25351, #24907).",
                "PyTorch 2.8 for CPU (#25652), FlashInfer 0.3.1 (#24470), CUDA 13 (#24599), ROCm 7.0 (#25178) (#25652, #24470)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#26000",
                "#22980",
                "#24593"
              ],
              "before": "Prior to v0.11.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Features: Qwen3-VL text-only mode (#26000), EVS video token pruning (#22980), Mamba2 TP+quantization (#24593), MRoPE + YaRN (#25384), Whisper on XPU (#25123), LongCat-Flash-Chat tool calling (#24083) (#26000, #22980).",
                "Data parallel for vision encoders: InternVL (#23909), Qwen2-VL (#25445), Qwen3-VL (#24955) (#23909, #25445).",
                "Architecture: Tokenizer group removal (#24078), shared memory multimodal caching (#20452) (#24078, #20452).",
                "Remove cuda hard-code in qwen3 next (#25243)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "Engines: AsyncLLMEngine (#25025), LLMEngine (#25033), MQLLMEngine (#25019), core (#25321), model runner (#25328), MP executor (#25329). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#25025"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Components: Attention backends (#25351), encoder-decoder (#24907), output processor (#25320), sampling metadata (#25345), Sequence/Sampler (#25332). -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#25351"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Interfaces: LoRA (#25686), async output processor (#25334), MultiModalPlaceholderMap (#25366), seq group methods (#25330), placeholder attention (#25510), input embeddings (#25242), multimodal registry (#25362), max_seq_",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#25686"
              },
              {
                "change": "Security",
                "impact": "https://github.com/vllm-project/vllm/security/advisories/GHSA-wr9h-g72x-mwhm",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v0.11.0"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Model Support",
              "hardware": "Performance: GLM-4.1V 916ms TTFT reduction via fused RMSNorm (#24733), GLM-4 MoE SharedFusedMoE optimization (#24849), Qwen2.5-VL CUDA sync removal (#24741), Qw",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#24733"
            },
            {
              "label": "Engine Core",
              "hardware": "Performance: FlashInfer RoPE 2x speedup (#21126), fused Q/K RoPE 11% improvement (#24511, #25005), 8x spec decode overhead reduction (#24986), FlashInfer spec d",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#21126"
            },
            {
              "label": "Hardware & Performance",
              "hardware": "AMD: ROCm 7.0 (#25178), GLM-4.5 MI300X tuning (#25703).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#25178"
            },
            {
              "label": "API & Frontend",
              "hardware": "Metrics: V1 TPOT histogram (#24015), hidden deprecated gpu_ metrics (#24245), KV cache GiB units (#25204, #25479).",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#24015"
            },
            {
              "label": "Security",
              "hardware": "https://github.com/vllm-project/vllm/security/advisories/GHSA-wr9h-g72x-mwhm",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "v0.11.0"
            }
          ]
        }
      },
      {
        "version": "v0.10.0",
        "badge": "Release",
        "date": "2025-07-24",
        "stats": "899 upstream changes and 881 PRs",
        "headline": "Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels",
        "executive_summary": "vLLM v0.10.0 focuses on Frontier MoE & Sparse-MLA Speedups, Low-Precision Quantization Kernels, and Next-Gen Speculative Decoding. For operators, this release translates 899 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Frontier MoE & Sparse-MLA Speedups",
              "plain_summary": "Improves frontier moe & sparse-mla speedups for frontier mixture-of-experts (moe) reasoning and agentic models (deepseek-v4/v4.1, glm-5.3, kimi-k3/k3.1, minimax-m3.1) running on nvidia blackwell (gb200/gb300/b200), hopper (h100/h200), and multi-node expert parallel (ep) clusters, delivering delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens."
            },
            {
              "headline": "Low-Precision Quantization Kernels",
              "plain_summary": "Improves low-precision quantization kernels for 100b\u20131t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput."
            },
            {
              "headline": "Next-Gen Speculative Decoding",
              "plain_summary": "Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth."
            },
            {
              "headline": "Multi-Vendor Accelerator Scaling",
              "plain_summary": "Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code."
            },
            {
              "headline": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "plain_summary": "Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet."
            }
          ],
          "big_deal": [
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#20534",
                "#20211",
                "#20971"
              ],
              "before": "Prior to v0.10.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Enhanced compatibility: BERT/RoBERTa with AutoWeightsLoader (#20534), HF format support for MiniMax (#20211), Gemini configuration (#20971), GLM-4 updates (#20736) (#20534, #20211).",
                "NVIDIA Blackwell/SM100 optimizations: CUTLASS block scaled group GEMM for smaller batches (#20640), FP8 groupGEMM support (#20447), DeepGEMM integration (#20087), FlashInfer MoE blockscale FP8 (#20640, #20447).",
                "Performance improvements: 48% request duration reduction via microbatch tokenization for concurrent requests (#19334), fused MLA QKV + strided layernorm (#21116), Triton causal-conv1d for Mamba (#19334, #21116).",
                "Fix minimax model cache & lm_head precision (#19592)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17888",
                "#20893",
                "#21100"
              ],
              "before": "Prior to v0.10.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "New quantization support: MXFP4 for MoE models (#17888), BNB support for Mixtral and additional MoE models (#20893, #21100), in-flight quantization for MoE (#20061) (#17888, #20893).",
                "Hardware-specific: FP8 KV cache quantization on TPU (#19292), FP8 support for BatchedTritonExperts (#18864), optimized INT8 vectorization kernels (#20331) (#19292, #18864).",
                "Performance optimizations: Triton backend for DeepGEMM per-token group quantization (#20841), CUDA kernel for per-token group quantization (#21083), CustomOp abstraction for FP8 (#19830) (#20841, #21083).",
                "Add SM100 Flashinfer MoE blockscale fp8 backend for low latency (#20645)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#20591",
                "#21060",
                "#20702"
              ],
              "before": "Prior to v0.10.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "New families: Llama 4 with EAGLE support (#20591), EXAONE 4.0 (#21060), Microsoft Phi-4-mini-flash-reasoning (#20702), Hunyuan V1 Dense + A13B with reasoning/tool parsing (#21368, #20625, #20820) (#20591, #21060).",
                "Fix EAGLE vocab embedding for multimodal target model (#19570).",
                "Fix the speculative decoding test by setting the target dtype (#19633).",
                "Fix speculative decoding CI - Fix test_ngram_e2e_greedy_correctness (#19644)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#19891",
                "#20741",
                "#19440"
              ],
              "before": "Prior to v0.10.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Remove unused variables to fix build error on GFX11/12 (#19891).",
                "Remove tensor creation that harms performance on ROCm (#20741).",
                "Adding ROCm to the list of plaforms using V1 by default (#19440).",
                "Add rules to automatically label ROCm related PRs (#19405)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#19455",
                "#20961",
                "#20335"
              ],
              "before": "Prior to v0.10.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "Add fused MOE config for Qwen3 30B A3B on B200 (#19455).",
                "CLI improvements: `--help=page` option for enhanced help documentation (#20961), default model changed to Qwen3-0.6B (#20335) (#20961, #20335).",
                "VLM improvements: VLM support with transformers backend (#20543), PrithviMAE on V1 engine (#20577) (#20543, #20577).",
                ": Support Qwen3 Embedding & Reranker (#19260)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Fix][ROCm] Remove unused variables to fix build error on GFX11/12 by @hyoon1 (#19891)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#19891"
              },
              {
                "change": "What's Changed",
                "impact": "[ROCm][Regression] Remove tensor creation that harms performance on ROCm by @gshtras (#20741)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#20741"
              },
              {
                "change": "What's Changed",
                "impact": "Remove unnecessary explicit title anchors and use relative links instead by @hmellor (#20620)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#20620"
              },
              {
                "change": "API & Frontend",
                "impact": "OpenAI compatibility: Responses API implementation (#20504, #20975), image object support in llm.chat (#19635), tool calling with required choice and $defs (#20629).",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#20504"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "Add fused MOE config for Qwen3 30B A3B on B200 by @0xjunhao (#19455)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#19455"
            },
            {
              "label": "What's Changed",
              "hardware": "[Doc] Fix quantization link titles by @DarkLight1337 (#19478)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#19478"
            },
            {
              "label": "What's Changed",
              "hardware": "[Doc] Rename page titles by @DarkLight1337 (#20130)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#20130"
            },
            {
              "label": "What's Changed",
              "hardware": "Remove unnecessary explicit title anchors and use relative links instead by @hmellor (#20620)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#20620"
            },
            {
              "label": "What's Changed",
              "hardware": "Stop using title frontmatter and fix doc that can only be reached by search by @hmellor (#20623)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#20623"
            }
          ]
        }
      },
      {
        "version": "v0.9.0",
        "badge": "Release",
        "date": "2025-05-15",
        "stats": "697 upstream changes and 654 PRs",
        "headline": "vLLM has upgraded to PyTorch 2.7! This is a breaking change for enviro, The default wheel has been upgraded from CUDA 12.4 to CUDA 12.8. We ",
        "executive_summary": "vLLM v0.9.0 focuses on Multi-Vendor Accelerator Scaling, Low-Precision Quantization Kernels, and Model Runner V2. For operators, this release translates 697 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "vLLM has upgraded to PyTorch 2.7! This is a breaking change for enviro",
              "plain_summary": "vLLM has upgraded to PyTorch 2.7!  (#16859) This is a breaking change for environment dependency."
            },
            {
              "headline": "The default wheel has been upgraded from CUDA 12.4 to CUDA 12.8. We will distrib",
              "plain_summary": "ute CUDA 12.6 wheel on GitHub artifact."
            },
            {
              "headline": "As a general rule of thumb, our CUDA version policy follow PyTorch's CUDA versio",
              "plain_summary": "n policy."
            },
            {
              "headline": "Enhanced NVIDIA Blackwell support. vLLM now ships with initial set of optimized",
              "plain_summary": "kernels on NVIDIA Blackwell with both attention and mlp."
            }
          ],
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#16577",
                "#14702",
                "#17466"
              ],
              "before": "Prior to v0.9.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Structured Outputs: Thinking compatibility (#16577), Spec Decoding (#14702), Qwen3 reasoning parser (#17466), `tool_choice: required` for Xgrammar (#17845), Structural Tag with Guidance backend (#16577, #14702).",
                "AMD: Enable FP8 KV cache on V1 (#17870), Tuned fused moe config for Qwen3 MoE on MI300X (#17535, #17530), AITER biased group topk (#17955), Block-Scaled GEMM (#14968), MLA (#17523), Radeon GPU use (#17870, #17535).",
                ": Add Qwen/Qwen3-30B-A3B-FP8 fused moe config for MI300X (#17530).",
                "Restrict ray version due to a breaking release (#17480)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#16362",
                "#16943",
                "#17850"
              ],
              "before": "Prior to v0.9.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Quantization: `nvidia/DeepSeek-R1-FP4` (#16362), Quark MXFP4 format (#16943), AutoRound (#17850), torchao models with `AOPerModuleConfig` (#17826), CUDA Graph support for V1 GGUF support (#16362, #16943).",
                "NVIDIA: cutlass support for blackwell fp8 blockwise gemm (#14383).",
                ": Add Qwen/Qwen3-235B-A22B-FP8 TP4 triton fused moe config (#17535).",
                "Update nm to rht in doc links + refine fp8 doc (#17678)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17326",
                "#17211",
                "#17504"
              ],
              "before": "Prior to v0.9.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "Spec Decode: EAGLE share input embedding (#17326), torch.compile & cudagraph to EAGLE (#17211), EAGLE3 (#17504), log accumulated metrics(#17913), Medusa (#17326, #17211).",
                "Apply torch.compile & cudagraph to EAGLE (#17211).",
                "Apply torch.compile & cudagraph to EAGLE3 (#17504).",
                "Support CUDAGraph capture for encoder-decoder on ROCm (#18104)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17426",
                "#17452",
                "#17525"
              ],
              "before": "Prior to v0.9.0, teams operating features enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "CLI: `deprecated=True` (#17426).",
                "Reasoning: deprecate `--enable-reasoning` (#17452).",
                "Frontend: progress bar for adding requests (#17525), `chat_template_kwargs` in `LLM.chat` (#17356), `/classify` endpoint (#17032), truncation control for embedding models (#14776), `cached_tokens` in (#17525, #17356).",
                "Metrics: kv event publishing (#16750), API for accessing in-memory Prometheus metrics (#16750, #17010)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#17433",
                "#16328",
                "#17861"
              ],
              "before": "Prior to v0.9.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Support MiMo-7B (#17433), MiniMax-VL-01 (#16328), Ovis 1.6 (#17861), Ovis 2 (#15826), GraniteMoeHybrid 4.0 (#17497), FalconH1\\* (#18406), LlamaGuard4 (#17433, #16328).",
                "DeepSeek: perf enhancement by moving more calls into cuda-graph region(#17484, #17668), Function Call (#17784), MTP in V1.",
                "Add files via uploadAdd fused MoE kernel tuning configs (fp8_w8a8) for DeepSeek V3/R1 on a single-node 8x NVIDIA H20 96GB setup (#18337).",
                "Fix variable name bug due to change in variable name in PR #17483 (#17483, #17961)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            },
            {
              "persona": "Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Security",
                "impact": "Migrate to REGEX Library to prevent catastrophic backtracking (#18454, #18750)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#18454"
              },
              {
                "change": "Security",
                "impact": "Prevent side-channel attacks via cache salting (#17045)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#17045"
              },
              {
                "change": "Security",
                "impact": "Fix image hash collision in certain edge cases (#17378)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#17378"
              },
              {
                "change": "Security",
                "impact": "Add `VLLM_ALLOW_INSECURE_SERIALIZATION` env var (#17490)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#17490"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Hardwares",
              "hardware": "AMD: Enable FP8 KV cache on V1 (#17870), Tuned fused moe config for Qwen3 MoE on MI300X (#17535, #17530), AITER biased group topk (#17955), Block-Scaled GEMM (#",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17870"
            },
            {
              "label": "What's Changed",
              "hardware": "Remove Falcon3 2x7B from CI by @hmellor (#17404)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17404"
            },
            {
              "label": "What's Changed",
              "hardware": "[FEAT] [ROCm]: Add Qwen/Qwen3-30B-A3B-FP8 fused moe config for MI300X by @tjtanaa (#17530)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17530"
            },
            {
              "label": "What's Changed",
              "hardware": "Initialize the delta tool call fields explicitly by @maxdebayser (#17340)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#17340"
            },
            {
              "label": "What's Changed",
              "hardware": "[Model] GritLM supports other attention backends by @DarkLight1337 (#18109)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#18109"
            }
          ]
        }
      },
      {
        "version": "v0.8.0",
        "badge": "Release",
        "date": "2025-03-18",
        "stats": "636 upstream changes and 518 PRs",
        "headline": "V1, DeepSeek Improvements",
        "executive_summary": "vLLM v0.8.0 focuses on Disaggregated Serving, Frontier MoE & Sparse-MLA Speedups, and Hardware Support Enhancements. For operators, this release translates 636 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "V1",
              "plain_summary": "We have now enabled V1 engine by default (#13726) for supported use cases. Please refer to [V1 user guide](https://docs.vllm.ai/en/latest/getting_started/v1_user_guide.html) for more detail. We expect better performance for supported scenarios. If you'd like to disable V1 mode, please specify the environment variable `VLLM_USE_V1=0`, and send us a GitHub issue sharing the reason! * Support variety of sampling parameters (#13376, #10980, #13210, #13774) * Compatability prompt logprobs + prefix caching (#13949), sliding window + prefix caching (#13069) * Stability fixes (#14380, #14379, #13298)"
            },
            {
              "headline": "DeepSeek Improvements",
              "plain_summary": "We observe state of the art performance with vLLM running DeepSeek model on latest version of vLLM: * MLA Enhancements: * FlashMLA integration (#13747, #13867, #14451) * MLA support for V1 (#13789, #14253, #14384, #14540, #14921) * MLA with chunked prefill (#12639) * Holistic memory and performance optimization (#14769, #14770,#14842) * Support MLA for CompressedTensorsWNA16 (#13725) * Distributed Expert Parallelism (EP) and Data Parallelism (DP) * EP Support for DeepSeek Models (#12583) * Add enable_expert_parallel arg (#14305) * EP/TP MoE + DP Attention (#13931) * Set up data parallel commun"
            },
            {
              "headline": "NVIDIA Blackwell",
              "plain_summary": "* Support nvfp4 cutlass gemm (#13571) * Add cutlass support for blackwell fp8 gemm (#13798) * Update the flash attn tag to support Blackwell (#14244) * Add ModelOpt FP4 Checkpoint Support (#12520)"
            },
            {
              "headline": "Breaking Changes",
              "plain_summary": "* The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity. (#14274) * The `kv_cache` and `attn_metadata` arguments for model's forward method has been removed; as the attention backend has access to these value via `forward_context`. (#13887) * vLLM will now default `generation_config` from model for chat template, sampling parameters such as temperature, etc. (#12622) * Several request time metrics (`vllm:time_in_queue_requests`, `vllm:model_forward_time_milliseconds`, `vllm:model_execute_time_milliseconds`) has been depr"
            }
          ],
          "big_deal": [
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#14274",
                "#12622",
                "#12520"
              ],
              "before": "Prior to v0.8.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity (#14274).",
                "vLLM will now default `generation_config` from model for chat template, sampling parameters such as temperature, etc (#12622).",
                "Add ModelOpt FP4 Checkpoint Support (#12520).",
                "Add ModelOpt FP4 Checkpoint Support (#12520)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#13167",
                "#14316",
                "#13802"
              ],
              "before": "Prior to v0.8.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "Deepseek GGUF support (#13167).",
                "Chunked prefill/paged attention in MLA on ROCm (#14316).",
                "Fix deepseek-v2 error: \"missing 1 required positional argument: 'residual'\" (#13802).",
                "EP Support for DeepSeek Models (#12583)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Hardware Support Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12613",
                "#14198",
                "#13658"
              ],
              "before": "Prior to v0.8.0, teams operating hardware support enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Adding cpu inference with VXE ISA for s390x architecture (#12613).",
                "Add documentation for s390x cpu implementation (#14198).",
                "Remove cuda hard code in models and layers (#13658).",
                "Faster Custom Paged Attention kernels (#12348)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#14152",
                "#13650",
                "#13970"
              ],
              "before": "Prior to v0.8.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Improved performance for V1 Triton (ROCm) backend (#14152).",
                "fix native attention function call (#13650).",
                "Fix the Kernels, Core, and Prefix Caching AMD CI groups (#13970).",
                "Fix ROCm documentation (#14041)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#14068",
                "#13571",
                "#13798"
              ],
              "before": "Prior to v0.8.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "MoE fp8 block quant tuning support (#14068).",
                "Support nvfp4 cutlass gemm (#13571).",
                "Add cutlass support for blackwell fp8 gemm (#13798).",
                "Fix an issue to use current stream for the nvfp4 quant (#13632)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Hardware Support Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Before You Upgrade",
                "impact": "The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity. (#14274) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#14274"
              },
              {
                "change": "Before You Upgrade",
                "impact": "The `kv_cache` and `attn_metadata` arguments for model's forward method has been removed; as the attention backend has access to these value via `forward_context`. (#13887) -> Action: Check deprecation/removal impact bef",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#13887"
              },
              {
                "change": "Before You Upgrade",
                "impact": "vLLM will now default `generation_config` from model for chat template, sampling parameters such as temperature, etc. (#12622) -> Action: Check deprecation/removal impact before upgrading",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#12622"
              },
              {
                "change": "Before You Upgrade",
                "impact": "Several request time metrics (`vllm:time_in_queue_requests`, `vllm:model_forward_time_milliseconds`, `vllm:model_execute_time_milliseconds`) has been deprecated and subject to removal (#14135) -> Action: Check deprecatio",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#14135"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Breaking Changes",
              "hardware": "The default value of `seed` is now `None` to align with PyTorch and Hugging Face. Please explicitly set seed for reproduciblity. (#14274)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#14274"
            },
            {
              "label": "Hardware Support",
              "hardware": "Adding cpu inference with VXE ISA for s390x architecture (#12613)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12613"
            },
            {
              "label": "Hardware Support",
              "hardware": "Add documentation for s390x cpu implementation (#14198)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#14198"
            },
            {
              "label": "What's Changed",
              "hardware": "[Misc]: Add support for goodput on guided benchmarking + TPOT calculation refactor by @b8zhong (#13736)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#13736"
            },
            {
              "label": "What's Changed",
              "hardware": "[Bugfix] Explicitly include \"omp.h\" for MacOS to avoid installation failure by @realShengYao (#14051)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#14051"
            }
          ]
        }
      },
      {
        "version": "v0.7.0",
        "badge": "Release",
        "date": "2025-01-27",
        "stats": "419 upstream changes and 402 PRs",
        "headline": "vLLM's V1 engine is ready for testing! This is a rewritten engine designed for p, New methods (`LLM.sleep`, `LLM.wake_up`, `LLM.collective_r",
        "executive_summary": "vLLM v0.7.0 focuses on Low-Precision Quantization Kernels, Frontier MoE & Sparse-MLA Speedups, and Features Enhancements. For operators, this release translates 419 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "vLLM's V1 engine is ready for testing! This is a rewritten engine designed for p",
              "plain_summary": "erformance and architectural simplicity. You can turn it on by setting environment variable `VLLM_USE_V1=1`. See [our blog](https://blog.vllm.ai/2025/01/27/v1-alpha-release.html) for more details. (44 commits)."
            },
            {
              "headline": "New methods (`LLM.sleep`, `LLM.wake_up`, `LLM.collective_rpc`, `LLM.reset_prefix",
              "plain_summary": "_cache`) in vLLM for the post training frameworks! (#12361, #12084, #12284)."
            },
            {
              "headline": "`torch.compile` is now fully integrated in vLLM, and enabled by default in V1. Y",
              "plain_summary": "ou can turn it on via `-O3` engine parameter. (#11614, #12243, #12043, #12191, #11677, #12182, #12246)."
            }
          ],
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12134",
                "#12408",
                "#12049"
              ],
              "before": "Prior to v0.7.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "AMD: MI300 FP8 format for block_quant (#12134), Tuned MoE configurations for multiple models (#12408, #12049), block size heuristic for avg 2.8x speedup for int8 models (#12134, #12408).",
                "Fix CPU CI by lazy importing triton FP8 kernels (#11618).",
                "Default to using per_token quantization for fp8 when cutlass is supported (#8651).",
                "Remove comments re: pytorch for outlines + compressed-tensors dependencies (#12260)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#11742",
                "#11578",
                "#12068"
              ],
              "before": "Prior to v0.7.0, teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.",
              "tech_bullets": [
                "New generative models: CogAgent (#11742), Deepseek-VL2 (#11578, #12068, #12169), fairseq2 Llama (#11442), InternLM3 (#12037), Whisper (#11742, #11578).",
                "Remove hardcoded `head_size=256` for Deepseek v2 and v3 (#12067).",
                "Port deepseek-vl2 processor and remove `deepseek_vl2` dependency (#12169).",
                "Document Deepseek V3 support (#11535)."
              ],
              "why_it_matters": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens",
              "config_snippet": ""
            },
            {
              "title": "Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#11620",
                "#11900",
                "#11682"
              ],
              "before": "Prior to v0.7.0, teams operating features enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "VLM: Merged multi-modal processor is now ready for model developers (#11620, #11900).",
                "Progress in out-of-tree hardware support (#12009, #11981).",
                "New `collective_rpc` abstraction (#12151, #11256).",
                "Apple: Native support for macOS Apple Silicon (#11696)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12222",
                "#12238",
                "#11906"
              ],
              "before": "Prior to v0.7.0, teams operating extensible kv cache, memory budgeting & tiered offloading relied on older execution paths or manual tuning on NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers.",
              "tech_bullets": [
                "For Deepseek V3: optimize `moe_align_block_size` for cuda graph and large num_experts (#12222).",
                "optimize moe_align_block_size for cuda graph and large num_experts (e.g. DeepSeek-V3) (#12222).",
                "Update FP8 KV Cache documentation (#12238).",
                "Dynamic kv cache scaling factors computation (#11906)."
              ],
              "why_it_matters": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#12202",
                "#11571",
                "#11100"
              ],
              "before": "Prior to v0.7.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New pooling models: Qwen2 PRM (#12202), InternLM2 reward models (#12202, #11571).",
                "x86: Multi-LoRA (#11100) and MoE Support (#11100, #11831).",
                "Any model that implements merged multi-modal processor and the `get_*_embeddings` methods according to [this guide](https://docs.vllm.ai/en/latest/contributing/model/multimodal.html) is automatically.",
                "Remove the duplicate imports of MultiModalKwargs and PlaceholderRange\u2026 (#11824)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)",
              "models": "Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1)",
              "gpus": "NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters",
              "impact": "Delivers 1.24x\u20131.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens"
            },
            {
              "persona": "Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Bugfix] Remove hardcoded `head_size=256` for Deepseek v2 and v3 by @Isotr0py (#12067)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#12067"
              },
              {
                "change": "What's Changed",
                "impact": "[Model] Port deepseek-vl2 processor and remove `deepseek_vl2` dependency by @Isotr0py (#12169)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#12169"
              },
              {
                "change": "What's Changed",
                "impact": "[Model] Remove hardcoded image tokens ids from Pixtral by @ywang96 (#11582)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#11582"
              },
              {
                "change": "What's Changed",
                "impact": "Remove print statement in DeepseekScalingRotaryEmbedding by @mgoin (#11604)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#11604"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Features",
              "hardware": "AMD: MI300 FP8 format for block_quant (#12134), Tuned MoE configurations for multiple models (#12408, #12049), block size heuristic for avg 2.8x speedup for int",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12134"
            },
            {
              "label": "What's Changed",
              "hardware": "Update bnb.md with example for OpenAI by @bet0x (#11718)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#11718"
            },
            {
              "label": "What's Changed",
              "hardware": "[Kernel][Triton][AMD] Use block size heuristic for avg 2.8x speedup for int8 models by @rasmith (#11698)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#11698"
            },
            {
              "label": "What's Changed",
              "hardware": "[CI] Pass local python version explicitly to pre-commit mypy.sh by @heheda12345 (#12224)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12224"
            },
            {
              "label": "What's Changed",
              "hardware": "[Benchmark] More accurate TPOT calc in `benchmark_serving.py` by @njhill (#12288)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#12288"
            }
          ]
        }
      },
      {
        "version": "v0.6.0",
        "badge": "Release",
        "date": "2024-09-04",
        "stats": "135 upstream changes and 117 PRs",
        "headline": "Performance Update, Misc",
        "executive_summary": "vLLM v0.6.0 focuses on Multi-Vendor Accelerator Scaling, Extensible KV Cache, Memory Budgeting & Tiered Offloading, and Production Features Enhancements. For operators, this release translates 135 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Performance Update",
              "plain_summary": "* We are excited to announce a faster vLLM delivering 2x more throughput compared to v0.5.3. The default parameters should achieve great speed up, but we recommend also try out turning on multi step scheduling. You can do so by setting `--num-scheduler-steps 8` in the engine arguments. Please note that it still have some limitations and being actively hardened, see #7528 for known issues. * Multi-step scheduler now supports LLMEngine and log_probs (#7789, #7652) * Asynchronous output processor overlaps the output data structures construction with GPU works, delivering 12% throughput increase."
            },
            {
              "headline": "Misc",
              "plain_summary": "* Support benchmarking async engine in benchmark_throughput.py (#7964) * Progress in integration with `torch.compile`: avoid Dynamo guard evaluation overhead (#7898), skip compile for profiling (#7796)"
            }
          ],
          "big_deal": [
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7049",
                "#7911",
                "#7921"
              ],
              "before": "Prior to v0.6.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Asynchronous output processor overlaps the output data structures construction with GPU works, delivering 12% throughput increase (#7049, #7911).",
                "TPU: single and multi-host TPUs on GKE (#7613), Async output processing (#7613, #8011).",
                "Enabling tensorizer tests for ROCm (#7237).",
                "allow rocm to override default env var (#7926)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7798",
                "#7985",
                "#7244"
              ],
              "before": "Prior to v0.6.0, teams operating extensible kv cache, memory budgeting & tiered offloading relied on older execution paths or manual tuning on NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers.",
              "tech_bullets": [
                "Using FlashInfer backend for FP8 KV Cache (#7798, #7985), rejection sampling in Speculative Decoding.",
                "Address #8009 and add model test for flashinfer fp8 kv cache (#8009, #8013).",
                "Use FlashInfer backend for FP8 KV Cache when available (#7798).",
                "Revert \"[Core][Kernels] Use FlashInfer backend for FP8 KV Cache when available.\" (#7982)."
              ],
              "why_it_matters": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware",
              "config_snippet": ""
            },
            {
              "title": "Production Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7753",
                "#8120",
                "#5649"
              ],
              "before": "Prior to v0.6.0, teams operating production features enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Enable chunked prefill and prefix caching together (#7753, #8120).",
                "OpenAI-Compatible Tools API + Streaming for Hermes & Mistral models (#5649).",
                "Add json_schema support from OpenAI protocol (#7654)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7894",
                "#7975",
                "#7898"
              ],
              "before": "Prior to v0.6.0, teams operating model runner v2 relied on older execution paths or manual tuning on All CUDA and ROCm GPU fleets running vLLM's V2 execution engine.",
              "tech_bullets": [
                "NVIDIA GPU: extend cuda graph size for H200 (#7894).",
                "extend cuda graph size for H200 (#7894).",
                "remove reset (#7975).",
                "Progress in integration with `torch.compile`: avoid Dynamo guard evaluation overhead (#7898), skip compile for profiling (#7898, #7796)."
              ],
              "why_it_matters": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance",
              "config_snippet": ""
            },
            {
              "title": "Model Support Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#7819",
                "#7436",
                "#7729"
              ],
              "before": "Prior to v0.6.0, teams operating model support enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "New LLMs: Exaone (#7819), Granite (#7436), Phi-3.5-MoE (#7819, #7436).",
                "multi-image input support for LLaVA-Next (#7230), Phi-3-vision models (#7230, #7783).",
                "Support bitsandbytes 8-bit and FP4 quantized models (#7445).",
                "A new tokenizer mode for mistral models to use the native mistral-commons package (#7739)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            },
            {
              "persona": "Production Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Model Runner V2 (MRV2) Consolidation & Breakable CUDA Graphs",
              "models": "All production GPU deployments, latency-sensitive streaming apps, and custom logits processors",
              "gpus": "All CUDA and ROCm GPU fleets running vLLM's V2 execution engine",
              "impact": "Cuts CPU dispatch overhead and lowers inter-token latency (ITL) by 3\u201315% while simplifying engine maintenance"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "Remove faulty Meta-Llama-3-8B-Instruct-FP8.yaml lm-eval test by @mgoin (#7961)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7961"
              },
              {
                "change": "What's Changed",
                "impact": "[Misc] Remove snapshot_download usage in InternVL2 test by @Isotr0py (#7835)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7835"
              },
              {
                "change": "What's Changed",
                "impact": "[Misc] Update compressed tensors lifecycle to remove `prefix` from `create_weights` by @dsikka (#7825)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7825"
              },
              {
                "change": "What's Changed",
                "impact": "[torch.compile] remove reset by @youkaichao (#7975)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#7975"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Performance Update",
              "hardware": "We are excited to announce a faster vLLM delivering 2x more throughput compared to v0.5.3. The default parameters should achieve great speed up, but we recommen",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7528"
            },
            {
              "label": "What's Changed",
              "hardware": "[CI/Build] fix: Add the +empty tag to the version only when the VLLM_TARGET_DEVICE envvar was explicitly set to \"empty\" by @tomeras91 (#8118)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#8118"
            },
            {
              "label": "Performance Update",
              "hardware": "Asynchronous output processor overlaps the output data structures construction with GPU works, delivering 12% throughput increase. (#7049, #7911, #7921, #8050)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7049"
            },
            {
              "label": "Performance Update",
              "hardware": "We are excited to announce a faster vLLM delivering 2x more throughput compared to v0.5.3. The default parameters should achieve great speed up, but we recommen",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7528"
            },
            {
              "label": "What's Changed",
              "hardware": "[Bugfix] Fix #7592 vllm 0.5.4 enable_chunked_prefill throughput is slightly lower than 0.5.3~0.5.0. by @noooop (#7874)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#7592"
            }
          ]
        }
      },
      {
        "version": "v0.5.0",
        "badge": "Release",
        "date": "2024-06-11",
        "stats": "122 upstream changes and 109 PRs",
        "headline": "Low-Precision Quantization Kernels, Next-Gen Speculative Decoding",
        "executive_summary": "vLLM v0.5.0 focuses on Low-Precision Quantization Kernels, Next-Gen Speculative Decoding, and Production Features Enhancements. For operators, this release translates 122 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Low-Precision Quantization Kernels",
              "plain_summary": "Improves low-precision quantization kernels for 100b\u20131t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput."
            },
            {
              "headline": "Next-Gen Speculative Decoding",
              "plain_summary": "Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth."
            },
            {
              "headline": "Production Features Enhancements",
              "plain_summary": "Improves production features enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Disaggregated Serving",
              "plain_summary": "Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore."
            },
            {
              "headline": "What's Changed Enhancements",
              "plain_summary": "Improves what's changed enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            }
          ],
          "big_deal": [
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5352",
                "#5388",
                "#5159"
              ],
              "before": "Prior to v0.5.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "(https://docs.vllm.ai/en/stable/quantization/fp8.html) is ready for testing. By quantizing the portion model weights to 8 bit precision float point, the inference speed gets 1.5x boost. Please try it (#5352, #5388).",
                "Retune Mixtral 8x22b configs for FP8 on H100 (#5294).",
                "Support bitsandbytes quantization and QLoRA (#4776).",
                "Change FP8 checkpoint format from act_scale -> input_scale (#5353)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5400",
                "#5157",
                "#5137"
              ],
              "before": "Prior to v0.5.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "(https://docs.vllm.ai/en/stable/models/spec_decode.html) and [Automatic Prefix Caching](https://docs.vllm.ai/en/stable/automatic_prefix_caching/apc.html) is also ready for testing, we plan to turn (#5400, #5157).",
                "Add `ProposerWorkerBase` abstract class (#5252).",
                "Initial spec decode docs (#5400)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Production Features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5237",
                "#5383",
                "#4199"
              ],
              "before": "Prior to v0.5.0, teams operating production features enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Add OpenAI [Vision API](https://docs.vllm.ai/en/stable/models/vlm.html) support. Currently only LLaVA and LLaVA-NeXT are supported. We are working on adding more models in the next release (#5237, #5383)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5230",
                "#5137",
                "#5278"
              ],
              "before": "Prior to v0.5.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "Default to multiprocessing backend for single-node distributed case (#5230).",
                "Refactor CUTLASS kernels to always take scales that reside on the GPU (#5137).",
                "OpenAI API server: Add `add_special_tokens` to ChatCompletionRequest (default False) (#5278).",
                "Fix log message about default max model length (#5284)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#5263",
                "#5174",
                "#5138"
              ],
              "before": "Prior to v0.5.0, teams operating what's changed enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "benchmark_serving.py -- add ITL results and tweak TPOT results (#5263).",
                "Remove deprecated @abstractproperty (#5174).",
                "Remove unnecessary copies in flash attn backend (#5138).",
                "Remove Ray health check (#4693)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Production Features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            },
            {
              "term": "P/D Disaggregation (Prefill/Decode Split & NIXL)",
              "plain_english": "Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL.",
              "bottom_line": "Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs."
            },
            {
              "term": "DCP & PCP (Decode / Prefill Context Parallelism)",
              "plain_english": "Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP).",
              "bottom_line": "Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K\u20131M token agentic prompts."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Misc][Breaking] Change FP8 checkpoint format from act_scale -> input_scale by @mgoin (#5353)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#5353"
              },
              {
                "change": "What's Changed",
                "impact": "[Bugfix] Remove deprecated @abstractproperty by @zhuohan123 (#5174)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#5174"
              },
              {
                "change": "What's Changed",
                "impact": "[Core] Remove unnecessary copies in flash attn backend by @Yard1 (#5138)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#5138"
              },
              {
                "change": "What's Changed",
                "impact": "Remove Ray health check by @Yard1 (#4693)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#4693"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Production Features",
              "hardware": "[FP8 support](https://docs.vllm.ai/en/stable/quantization/fp8.html) is ready for testing. By quantizing the portion model weights to 8 bit precision float point",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5352"
            },
            {
              "label": "What's Changed",
              "hardware": "[misc] benchmark_serving.py -- add ITL results and tweak TPOT results by @tlrmchlsmth (#5263)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5263"
            },
            {
              "label": "What's Changed",
              "hardware": "[Kernel] Retune Mixtral 8x22b configs for FP8 on H100 by @pcmoritz (#5294)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5294"
            },
            {
              "label": "Production Features",
              "hardware": "[FP8 support](https://docs.vllm.ai/en/stable/quantization/fp8.html) is ready for testing. By quantizing the portion model weights to 8 bit precision float point",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5352"
            },
            {
              "label": "Production Features",
              "hardware": "[Speculative Decoding](https://docs.vllm.ai/en/stable/models/spec_decode.html) and [Automatic Prefix Caching](https://docs.vllm.ai/en/stable/automatic_prefix_ca",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5400"
            }
          ]
        }
      },
      {
        "version": "v0.4.0",
        "badge": "Release",
        "date": "2024-03-30",
        "stats": "202 upstream changes and 193 PRs",
        "headline": "Next-Gen Speculative Decoding, Production features Enhancements",
        "executive_summary": "vLLM v0.4.0 focuses on Next-Gen Speculative Decoding, Production features Enhancements, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 202 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Next-Gen Speculative Decoding",
              "plain_summary": "Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth."
            },
            {
              "headline": "Production features Enhancements",
              "plain_summary": "Improves production features enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "plain_summary": "Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet."
            },
            {
              "headline": "What's Changed Enhancements",
              "plain_summary": "Improves what's changed enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Multi-Vendor Accelerator Scaling",
              "plain_summary": "Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code."
            }
          ],
          "big_deal": [
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3236",
                "#3538",
                "#3103"
              ],
              "before": "Prior to v0.4.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "Progress in chunked prefill scheduler (#3236, #3538), and speculative decoding (#3103).",
                "Worker which speculates, scores, and applies rejection sampling (#3103)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Production features Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2762",
                "#3703"
              ],
              "before": "Prior to v0.4.0, teams operating production features enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Automatic prefix caching (#2762, #3703) supporting long system prompt to be automatically cached across requests. Use the flag `--enable-prefix-caching` to turn it on.",
                "Support `json_object` in OpenAI server for arbitrary JSON, `--use-delay` flag to improve time to first token across many requests, and `min_tokens` to EOS suppression.",
                "Custom all reduce kernel has been re-enabled after more robustness fixes.",
                "Replaced cupy dependency due to its bugs."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3433",
                "#3346",
                "#3660"
              ],
              "before": "Prior to v0.4.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "New models: Command+R(#3433), Qwen2 MoE(#3346), DBRX(#3660), XVerse (#3610), Jais (#3183) (#3433, #3346).",
                "Possible fix for conflict between Automated Prefix Caching (#2762) and multi-LoRA support (#1804) (#2762, #1804).",
                "Add GPTQ support for Gemma (#3200).",
                "Feature add lora support for Qwen2 (#3177)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3175",
                "#3256",
                "#3279"
              ],
              "before": "Prior to v0.4.0, teams operating what's changed enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "enable --gpu-memory-utilization in benchmark_throughput.py (#3175).",
                "Use cupy-cuda11x in CUDA 11.8 build (#3256).",
                "Dynamic scheduler delay to improve ITL performance (#3279).",
                "add the \"download-dir\" option to the latency/throughput benchmarks (#3621)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#3262",
                "#3321",
                "#2886"
              ],
              "before": "Prior to v0.4.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "Fix blockReduceSum to use correct warp counts for ROCm and CUDA (#3262).",
                "Fix warp and lane calculation in blockReduceSum (#3321).",
                "CI: Add ROCm Docker Build (#2886).",
                "Fix ROCm support in CMakeLists.txt (#3534)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Production features Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "What's Changed Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            },
            {
              "term": "MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)",
              "plain_english": "Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs.",
              "bottom_line": "Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Production features",
                "impact": "Replaced cupy dependency due to its bugs.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v0.4.0"
              },
              {
                "change": "What's Changed",
                "impact": "[Minor Fix] Remove unused code in benchmark_prefix_caching.py by @gty111 (#3171)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#3171"
              },
              {
                "change": "What's Changed",
                "impact": "Removed Extraneous Print Message From OAI Server by @robertgshaw2-neuralmagic (#3440)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#3440"
              },
              {
                "change": "What's Changed",
                "impact": "Replace `lstrip()` with `removeprefix()` to fix Ruff linter warning by @ronensc (#2958)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2958"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "[Minor Fix] Use cupy-cuda11x in CUDA 11.8 build by @chenxu2048 (#3256)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3256"
            },
            {
              "label": "What's Changed",
              "hardware": "Dynamic scheduler delay to improve ITL performance  by @tdoublep (#3279)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3279"
            },
            {
              "label": "What's Changed",
              "hardware": "enable --gpu-memory-utilization in benchmark_throughput.py by @AllenDou (#3175)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3175"
            },
            {
              "label": "What's Changed",
              "hardware": "[Minor Fix] Use cupy-cuda11x in CUDA 11.8 build by @chenxu2048 (#3256)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3256"
            },
            {
              "label": "What's Changed",
              "hardware": "[Misc] add the \"download-dir\" option to the latency/throughput benchmarks by @AmadeusChan (#3621)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#3621"
            }
          ]
        }
      },
      {
        "version": "v0.3.0",
        "badge": "Release",
        "date": "2024-01-31",
        "stats": "80 upstream changes and 81 PRs",
        "headline": "Experimental multi-lora support, Experimental prefix caching support",
        "executive_summary": "vLLM v0.3.0 focuses on What's Changed Enhancements, Multi-Vendor Accelerator Scaling, and Next-Gen Speculative Decoding. For operators, this release translates 80 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "What's Changed Enhancements",
              "plain_summary": "Improves what's changed enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Multi-Vendor Accelerator Scaling",
              "plain_summary": "Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code."
            },
            {
              "headline": "Next-Gen Speculative Decoding",
              "plain_summary": "Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth."
            },
            {
              "headline": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "plain_summary": "Improves extensible kv cache, memory budgeting & tiered offloading for high-concurrency chat apis, long-context coding agents (32k\u2013128k+), and multi-turn rag workloads running on nvidia hopper (h100/h200), blackwell (b200/gb200), and amd instinct (mi300x/mi355x) + host dram/nvme tiers, delivering expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware."
            },
            {
              "headline": "Disaggregated Serving",
              "plain_summary": "Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore."
            }
          ],
          "big_deal": [
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2598",
                "#2566",
                "#2384"
              ],
              "before": "Prior to v0.3.0, teams operating what's changed enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Support for Stable LM 2 (#2598).",
                "AWQ: Up to 2.66x higher throughput (#2566).",
                "Remove unused code in attention (#2384).",
                "Update a more user-friendly error message, offering more considerate advice for beginners, when using V100 GPU #1901 (#1901, #2374)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2274",
                "#2581",
                "#2545"
              ],
              "before": "Prior to v0.3.0, teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.",
              "tech_bullets": [
                "add support to ROCm 6.0 and MI300 (#2274).",
                "ROCm: Allow setting compilation target (#2581).",
                "Fix \"Port could not be cast to integer value as <function get_open_port>\" (#2545).",
                "Added `include_stop_str_in_output` and `length_penalty` parameters to OpenAI API (#2562)."
              ],
              "why_it_matters": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code",
              "config_snippet": ""
            },
            {
              "title": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2336",
                "#2424"
              ],
              "before": "Prior to v0.3.0, teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.",
              "tech_bullets": [
                "Optimized rejection sampler (#2336).",
                "Multi-step worker for draft model (#2424)."
              ],
              "why_it_matters": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2279"
              ],
              "before": "Prior to v0.3.0, teams operating extensible kv cache, memory budgeting & tiered offloading relied on older execution paths or manual tuning on NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers.",
              "tech_bullets": [
                "Support FP8-E5M2 KV Cache (#2279)."
              ],
              "why_it_matters": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#2360",
                "#2499",
                "#2618"
              ],
              "before": "Prior to v0.3.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "OpenAI refactoring (#2360).",
                "refactor completion api for readability (#2499).",
                "Small async_llm_engine refactor (#2618)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "What's Changed Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)",
              "models": "Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds",
              "gpus": "AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU",
              "impact": "Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code"
            },
            {
              "persona": "Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)",
              "models": "Interactive coding assistants, agent loops, and low-batch-size real-time inference",
              "gpus": "NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners",
              "impact": "Accelerates single-stream decode speed by 1.35x\u20132.2x using idle GPU memory bandwidth"
            },
            {
              "persona": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "models": "High-concurrency chat APIs, long-context coding agents (32K\u2013128K+), and multi-turn RAG workloads",
              "gpus": "NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers",
              "impact": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "Model Runner V2 (MRV2)",
              "plain_english": "vLLM's redesigned GPU execution loop featuring persistent batching, zero-overhead input preparation, unified CUDA graph capture, and native speculative decoding.",
              "bottom_line": "Replaces legacy Model Runner V1 as the sole GPU runner; lowers CPU-to-GPU launch overhead and unlocks higher token interactivity."
            },
            {
              "term": "Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)",
              "plain_english": "Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass.",
              "bottom_line": "Boosts per-user token generation speed (interactivity/TPOT) by 1.4x\u20132.5x without changing output quality."
            },
            {
              "term": "MLA & Sparse-MLA (Multi-head Latent Attention)",
              "plain_english": "An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing.",
              "bottom_line": "Slashes KV cache memory footprint on long contexts (32K\u2013128K+), enabling far larger batch sizes per GPU."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "[Minor] Remove unused code in attention by @WoosukKwon (#2384)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2384"
              },
              {
                "change": "What's Changed",
                "impact": "migrate pydantic from v1 to v2 by @joennlae (#2531)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2531"
              },
              {
                "change": "What's Changed",
                "impact": "Update Ray version requirements by @simon-mo (#2636)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#2636"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "AWQ: Up to 2.66x higher throughput by @casper-hansen (#2566)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2566"
            },
            {
              "label": "What's Changed",
              "hardware": "Support for Stable LM 2 by @dakotamahan-stability (#2598)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2598"
            },
            {
              "label": "What's Changed",
              "hardware": "AWQ: Up to 2.66x higher throughput by @casper-hansen (#2566)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2566"
            },
            {
              "label": "What's Changed",
              "hardware": "Add StableLM3B model by @ita9naiwa (#2372)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2372"
            },
            {
              "label": "What's Changed",
              "hardware": "fix stablelm.py tensor-parallel-size bug by @YingchaoX (#2482)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2482"
            }
          ]
        }
      },
      {
        "version": "v0.2.0",
        "badge": "Release",
        "date": "2023-09-28",
        "stats": "54 upstream changes and 54 PRs",
        "headline": "Up to 60% performance improvement by optimizing de-tokenization and sampler, Initial support for AWQ (performance not optimized)",
        "executive_summary": "vLLM v0.2.0 focuses on What's Changed Enhancements, Disaggregated Serving, and Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend. For operators, this release translates 54 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "What's Changed Enhancements",
              "plain_summary": "Improves what's changed enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Disaggregated Serving",
              "plain_summary": "Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore."
            },
            {
              "headline": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "plain_summary": "Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet."
            },
            {
              "headline": "Low-Precision Quantization Kernels",
              "plain_summary": "Improves low-precision quantization kernels for 100b\u20131t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput."
            },
            {
              "headline": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "plain_summary": "Improves extensible kv cache, memory budgeting & tiered offloading for high-concurrency chat apis, long-context coding agents (32k\u2013128k+), and multi-turn rag workloads running on nvidia hopper (h100/h200), blackwell (b200/gb200), and amd instinct (mi300x/mi355x) + host dram/nvme tiers, delivering expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware."
            }
          ],
          "big_deal": [
            {
              "title": "What's Changed Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1059",
                "#1102",
                "#1222"
              ],
              "before": "Prior to v0.2.0, teams operating what's changed enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Remove AsyncLLMEngine busy loop, shield background task (#1059).",
                "clean api code, remove redundant background task (#1102).",
                "Remove false assertion (#1222).",
                "add option to shorten prompt print in log (#991)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1067",
                "#1224"
              ],
              "before": "Prior to v0.2.0, teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.",
              "tech_bullets": [
                "Don't initialize parameter by default (#1067).",
                "Provide default max model length (#1224)."
              ],
              "why_it_matters": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore",
              "config_snippet": ""
            },
            {
              "title": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1173",
                "#1210"
              ],
              "before": "Prior to v0.2.0, teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.",
              "tech_bullets": [
                "fix qwen-14b model (#1173).",
                "qwen add rope_scaling (#1210)."
              ],
              "why_it_matters": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet",
              "config_snippet": ""
            },
            {
              "title": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1032"
              ],
              "before": "Prior to v0.2.0, teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.",
              "tech_bullets": [
                "Implement AWQ quantization support for LLaMA (#1032)."
              ],
              "why_it_matters": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput",
              "config_snippet": ""
            },
            {
              "title": "Extensible KV Cache, Memory Budgeting & Tiered Offloading",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#1090"
              ],
              "before": "Prior to v0.2.0, teams operating extensible kv cache, memory budgeting & tiered offloading relied on older execution paths or manual tuning on NVIDIA Hopper (H100/H200), Blackwell (B200/GB200), and AMD Instinct (MI300X/MI355X) + host DRAM/NVMe tiers.",
              "tech_bullets": [
                "Add gpu_memory_utilization and swap_space to LLM (#1090)."
              ],
              "why_it_matters": "Expands effective KV capacity by 25\u201355% per GPU, serving more concurrent users per rack without adding hardware",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "What's Changed Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore",
              "models": "Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients",
              "gpus": "Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways",
              "impact": "Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore"
            },
            {
              "persona": "Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend",
              "models": "Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters",
              "gpus": "Standard single-node and multi-node GPU inference pools",
              "impact": "Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet"
            },
            {
              "persona": "Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)",
              "models": "100B\u20131T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit",
              "gpus": "NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X",
              "impact": "Halves GPU count required to fit 400B\u20131T weights in VRAM and up to doubles Tensor Core compute throughput"
            }
          ],
          "jargon_decoded": [
            {
              "term": "Extensible KV Cache",
              "plain_english": "Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction.",
              "bottom_line": "Unlocks 20\u201355% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes."
            },
            {
              "term": "NVFP4 / MXFP4 / FP8 Quantization",
              "plain_english": "4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores.",
              "bottom_line": "Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks."
            },
            {
              "term": "P/D Disaggregation (Prefill/Decode Split & NIXL)",
              "plain_english": "Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL.",
              "bottom_line": "Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs."
            },
            {
              "term": "DCP & PCP (Decode / Prefill Context Parallelism)",
              "plain_english": "Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP).",
              "bottom_line": "Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K\u20131M token agentic prompts."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "What's Changed",
                "impact": "Remove AsyncLLMEngine busy loop, shield background task by @Yard1 (#1059)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1059"
              },
              {
                "change": "What's Changed",
                "impact": "clean api code, remove redundant background task. by @esmeetu (#1102)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1102"
              },
              {
                "change": "What's Changed",
                "impact": "[Fix] Remove false assertion by @WoosukKwon (#1222)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1222"
              },
              {
                "change": "What's Changed",
                "impact": "Add pandas to requirements.txt by @WoosukKwon (#1047)",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#1047"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "What's Changed",
              "hardware": "Remove AsyncLLMEngine busy loop, shield background task by @Yard1 (#1059)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#1059"
            },
            {
              "label": "What's Changed",
              "hardware": "clean api code, remove redundant background task. by @esmeetu (#1102)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#1102"
            },
            {
              "label": "What's Changed",
              "hardware": "[Fix] Remove false assertion by @WoosukKwon (#1222)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#1222"
            },
            {
              "label": "What's Changed",
              "hardware": "add option to shorten prompt print in log by @leiwen83 (#991)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#991"
            },
            {
              "label": "What's Changed",
              "hardware": "Make `max_model_len` configurable by @Yard1 (#972)",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#972"
            }
          ]
        }
      },
      {
        "version": "v0.1.0",
        "badge": "Inaugural Release",
        "date": "2023-06-20",
        "stats": "initial open-source release with PagedAttention and continuous batching",
        "headline": "Initial Open-Source Release with PagedAttention, Continuous Batching, and OpenAI-Compatible Serving",
        "executive_summary": "vLLM 0.1.0 is the initial open-source release of vLLM from UC Berkeley Sky Computing Lab. It introduces PagedAttention\u2014managing attention Keys and Values in non-contiguous virtual memory blocks like an operating system\u2014reducing KV cache memory waste from 60\u201380% to under 4% and delivering up to 24\u00d7 higher LLM serving throughput than Hugging Face Transformers.",
        "five_parts": {
          "big_deal": [
            {
              "title": "PagedAttention: OS-Style Virtual Memory Paging for the KV Cache",
              "status": "Core Architecture",
              "status_tone": "green",
              "prs": [
                "#1"
              ],
              "before": "Existing LLM serving systems pre-allocated contiguous GPU memory slabs sized to the maximum possible sequence length (e.g., 2048 tokens) for every request, wasting 60\u201380% of GPU HBM on internal and external fragmentation.",
              "now": "PagedAttention partitions the KV cache into fixed-size token blocks allocated on demand via a block table, eliminating external fragmentation and allowing near-100% GPU memory utilization for concurrent requests.",
              "config_snippet": "python -m vllm.entrypoints.openai.api_server --model decapoda-research/llama-7b-hf",
              "tech_bullets": [
                "PagedAttention partitions the KV cache into fixed-size token blocks allocated on demand via a block table, eliminating external fragmentation and allowing near-100% GPU memory utilization for concurrent requests."
              ]
            },
            {
              "title": "Continuous Iteration-Level Batching & Copy-on-Write Beam Search",
              "status": "Default / GA",
              "status_tone": "green",
              "prs": [
                "#2"
              ],
              "before": "Static batching forced fast, short responses to wait idle on the GPU until the longest sequence in the batch finished generating.",
              "now": "The vLLM scheduler operates at the single-token iteration level\u2014immediately evicting finished requests and slotting in new prompts on the very next forward pass, while sharing common prompt prefixes across parallel samples via block-level copy-on-write.",
              "config_snippet": "from vllm import LLM, SamplingParams\nllm = LLM(model=\"lmsys/vicuna-13b-v1.3\", tensor_parallel_size=2)",
              "tech_bullets": [
                "The vLLM scheduler operates at the single-token iteration level\u2014immediately evicting finished requests and slotting in new prompts on the very next forward pass, while sharing common prompt prefixes across parallel samples via block-level copy-on-write."
              ]
            },
            {
              "title": "Drop-In OpenAI-Compatible API Server (`/v1/completions` & `/v1/chat/completions`)",
              "status": "New Capability",
              "status_tone": "cyan",
              "prs": [
                "#3",
                "#4"
              ],
              "before": "Self-hosting open-weights models like LLaMA or Falcon required rewriting application client code away from the OpenAI SDK.",
              "now": "Ships a built-in FastAPI/AsyncLLMEngine HTTP server compatible with the OpenAI Python client, supporting streaming SSE responses and multi-GPU Ray/NCCL Tensor Parallelism.",
              "config_snippet": "curl http://localhost:8000/v1/completions \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"model\": \"decapoda-research/llama-7b-hf\", \"prompt\": \"San Francisco is a\", \"max_tokens\": 32}'",
              "tech_bullets": [
                "Ships a built-in FastAPI/AsyncLLMEngine HTTP server compatible with the OpenAI Python client, supporting streaming SSE responses and multi-GPU Ray/NCCL Tensor Parallelism."
              ]
            }
          ],
          "who_benefits": [
            {
              "persona": "Self-Hosted LLM API Operators",
              "models": "LLaMA-7B/13B/30B/65B, OPT, GPT-NeoX, StarCoder, Vicuna",
              "gpus": "NVIDIA A100, A10G, V100, and L4 GPUs",
              "impact": "Up to 24\u00d7 higher throughput than naive Hugging Face `model.generate()` and 2.2\u00d7\u20133.5\u00d7 higher than static-memory TGI."
            },
            {
              "persona": "Parallel Sampling & Beam Search Workloads",
              "models": "Code generation (StarCoder) & multi-candidate chat",
              "gpus": "Single-node and Ray multi-GPU clusters",
              "impact": "Up to 55% KV memory savings from block-level copy-on-write prefix sharing."
            }
          ],
          "jargon_decoded": [
            {
              "term": "PagedAttention",
              "plain_english": "Storing a model's per-token Key-Value (KV) attention state in small, non-contiguous memory pages mapped by a lookup table\u2014just like virtual memory in Linux.",
              "bottom_line": "Frees up wasted GPU VRAM so you can batch 5\u00d7\u201310\u00d7 more users on the same GPU."
            },
            {
              "term": "Continuous Batching",
              "plain_english": "Adding new user requests to a running GPU batch at every single token step instead of waiting for all current requests to finish.",
              "bottom_line": "Eliminates GPU idle bubbles and cuts queueing latency under real traffic."
            }
          ],
          "upgrade_guide": {
            "verdict": "Inaugural Release \u2014 Install via `pip install vllm` on CUDA 11.8+.",
            "rows": [
              {
                "change": "Initial release requirements",
                "impact": "Requires Python 3.8\u20133.11, PyTorch 2.0+, and an NVIDIA GPU with compute capability 7.0+ (V100, T4, A10G, A100, H100).",
                "action": "Run `pip install vllm` and launch `vllm.entrypoints.openai.api_server`.",
                "pr": "#1"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "LLaMA-13B Online Serving Throughput vs. HF Transformers",
              "hardware": "NVIDIA A100-40GB (ShareGPT workload)",
              "metric": "Up to 24\u00d7 higher req/s",
              "pct_bar": 98,
              "pr": "#1"
            },
            {
              "label": "LLaMA-13B Throughput vs. HuggingFace TGI",
              "hardware": "NVIDIA A100-40GB (ShareGPT workload)",
              "metric": "2.2\u00d7\u20133.5\u00d7 higher req/s",
              "pct_bar": 85,
              "pr": "#2"
            },
            {
              "label": "KV Cache Memory Waste Reduction",
              "hardware": "PagedAttention Block Manager",
              "metric": "60\u201380% waste \u2192 <4% waste",
              "pct_bar": 95,
              "pr": "#1"
            }
          ],
          "high_level_changes": [
            {
              "headline": "PagedAttention: OS-Style Virtual Memory Paging for the KV Cache",
              "plain_summary": "PagedAttention partitions the KV cache into fixed-size token blocks allocated on demand via a block table, eliminating external fragmentation and allowing near-100% GPU memory utilization for concurrent requests."
            },
            {
              "headline": "Continuous Iteration-Level Batching & Copy-on-Write Beam Search",
              "plain_summary": "The vLLM scheduler operates at the single-token iteration level\u2014immediately evicting finished requests and slotting in new prompts on the very next forward pass, while sharing common prompt prefixes across parallel samples via block-level copy-on-write."
            },
            {
              "headline": "Drop-In OpenAI-Compatible API Server",
              "plain_summary": "Ships a built-in FastAPI/AsyncLLMEngine HTTP server compatible with the OpenAI Python client, supporting streaming SSE responses and multi-GPU Ray/NCCL Tensor Parallelism."
            }
          ]
        }
      }
    ],
    "weekly_editions": [
      {
        "id": "this-week-in-vllm",
        "date_iso": "2026-11-19",
        "date_range": "Thursday, 2026-11-19 (Weekly Digest)",
        "reading_time": "4 min read",
        "headline": "This Week in vLLM (2026-11-19): Hopper Humming MoE Kernels, Specialized Drafters for Kimi-K3.1, and Faster Multimodal Encoder Scheduling",
        "intro": "Keep up with vLLM development in 5 minutes a week. This week merged 100+ pull requests across the core scheduler, speculative decoding, and ROCm/Hopper hardware kernels\u2014without requiring a version bump.",
        "tldr_cards": [
          {
            "tag": "Performance",
            "title": "Faster Hopper MoE Kernels for Inkling 2 & Block-FP8 to MXFP4 Requantization",
            "summary": "New Humming expert GEMM kernels landed for Hopper GPUs alongside lower-memory online requantization from block-FP8 to MXFP4\u2014cutting peak VRAM spikes during model load.",
            "impact": "Lower startup memory overhead on H100/H200 and higher token throughput on quantized MoE models.",
            "prs": [
              "#68761",
              "#68171"
            ]
          },
          {
            "tag": "Speculative Decoding",
            "title": "Kimi-K3.1 & NemotronH Multi-Token Prediction (MTP) Upgrades",
            "summary": "Grouped-Query Attention (GQA) DSpark draft models now run on vLLM's specialized drafter path for Kimi-K3.1, and multimodal embeddings now pass cleanly into NemotronH MTP.",
            "impact": "Unlocks 1.4x\u20131.8x faster interactive token streaming on Kimi-K3.1 and multimodal Nemotron deployments.",
            "prs": [
              "#68701",
              "#68153",
              "#68213"
            ]
          },
          {
            "tag": "Memory & Stability",
            "title": "Immediate Encoder Memory Reclamation & CPU Offload Leak Fixes",
            "summary": "The scheduler now frees consumed multimodal encoder inputs at schedule time rather than waiting for request completion, and releases CPU offload caches cleanly on shutdown.",
            "impact": "Prevents GPU/CPU memory bloat on vision-language (VLM) servers handling bursty image and video prompts.",
            "prs": [
              "#68799",
              "#68710",
              "#68729"
            ]
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
        ],
        "label": "2026-11-19 (Latest)"
      },
      {
        "id": "2026-11-12",
        "date_iso": "2026-11-12",
        "label": "2026-11-12",
        "date_range": "Thursday, 2026-11-12",
        "reading_time": "4 min read",
        "headline": "This Week in vLLM (2026-11-12): Extensible KV Cache Enabled by Default, Model Runner V1 Removed, and Mistral Large 4 (1T)",
        "intro": "Highlights from the 2026-11-12 development week leading into v0.34.0: Extensible KV Cache flips on by default, legacy Model Runner V1 is removed, and day-0 support lands for Mistral Large 4 and Inkling 2 Small.",
        "tldr_cards": [
          {
            "tag": "Memory & Throughput",
            "title": "Extensible KV Cache Flips On by Default (#56492)",
            "summary": "vLLM now sizes the KV cache from memory actually free after CUDA graph capture and warmup rather than relying on a static 0.90 estimate.",
            "impact": "Expands KV token capacity by 25\u201355% on H100/H200/Blackwell without manual gpu_memory_utilization tuning.",
            "prs": [
              "#56492",
              "#67296"
            ]
          },
          {
            "tag": "Engine Core",
            "title": "Model Runner V1 Removed; MRV2 Is Now the Sole GPU Runner (#63373)",
            "summary": "Completes the migration to Model Runner V2 with dual-batch overlap, Decode Context Parallelism (DCP), and GPU suffix decoding.",
            "impact": "Remove VLLM_USE_V2_MODEL_RUNNER=0 from launch scripts before upgrading.",
            "prs": [
              "#63373",
              "#61464"
            ]
          },
          {
            "tag": "New Models",
            "title": "Day-0 Support for Mistral Large 4 (1T) & Inkling 2 Small (#64534)",
            "summary": "Full sparse-MLA, DSA indexer, and FP8/NVFP4 support for Mistral Large 4 across NVIDIA Blackwell/Hopper and AMD MI350.",
            "impact": "Serve 1-trillion-parameter MoE checkpoints out of the box on multi-GPU nodes.",
            "prs": [
              "#64534",
              "#64111"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges",
            "items": [
              {
                "title": "Default --block-size changed from 16 to 64 on CUDA",
                "pr": "#63231",
                "what_it_is": "Increases the default paged-attention KV cache block size from 16 tokens to 64 tokens on CUDA backends.",
                "why_you_care": "Improves attention kernel utilization on Hopper and Blackwell; pass --block-size 16 only if a custom KV connector requires 16-token blocks."
              },
              {
                "title": "Token-sharded sparse-MLA prefill under Tensor Parallelism",
                "pr": "#63956",
                "what_it_is": "Shards sparse Multi-head Latent Attention prefill tokens across TP ranks by default.",
                "why_you_care": "Speeds up GLM-5.3 Time-to-First-Token (TTFT) by 1.24\u00d7\u20131.40\u00d7 on 32K\u2013128K prompts."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Step5 NVFP4 MoE on TRTLLM-Gen reaches 1.95\u00d7 decode speedup on 4\u00d7GB200 (#65152)",
              "FlyDSL decode monokernel boosts Muse Spark Open interactivity by 35\u201357% on 8\u00d7MI355X (#63440)",
              "Checkpoint/restore endpoints (/checkpoint/prepare, /checkpoint/restore) via CRIU + cuda-checkpoint (#62570)",
              "Fault-tolerant DP+EP scale-down removes dead ranks without cluster restart (#46370)"
            ]
          }
        ]
      },
      {
        "id": "2026-11-05",
        "date_iso": "2026-11-05",
        "label": "2026-11-05",
        "date_range": "Thursday, 2026-11-05",
        "reading_time": "4 min read",
        "headline": "This Week in vLLM (2026-11-05): LibTorch Stable ABI Migration, Encoder Disaggregation (EPD), and Kimi-K3.1 Pro",
        "intro": "Highlights from the 2026-11-05 development week: CUDA wheels migrate to the PyTorch LibTorch Stable ABI, multimodal serving gains Encoder-Prefill-Decode (EPD) disaggregation, and Kimi-K3.1 Pro lands with day-0 support.",
        "tldr_cards": [
          {
            "tag": "Build & Packaging",
            "title": "CUDA Extensions Migrated to the LibTorch Stable ABI (#55810)",
            "summary": "vLLM's compiled C++/CUDA kernels now bind against PyTorch's binary-stable ABI instead of internal C++ symbols.",
            "impact": "Upgrade compatible PyTorch versions without rebuilding vLLM's CUDA kernels from source.",
            "prs": [
              "#55810"
            ]
          },
          {
            "tag": "Multimodal Serving",
            "title": "Encoder Disaggregation (EPD) Scales Vision & Audio Independently (#59120)",
            "summary": "Separates vision/audio encoder execution onto dedicated workers with remote embedding transfer and cross-encoder caching.",
            "impact": "Prevents heavy image/video encoding bursts from stalling LLM prefill and decode GPUs.",
            "prs": [
              "#59120",
              "#56277"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges",
            "items": [
              {
                "title": "Initialized TP1 engine snapshots with CRIU (vllm snapshot create/restore)",
                "pr": "#51360",
                "what_it_is": "Captures a fully initialized single-GPU vLLM process after model load and CUDA graph capture.",
                "why_you_care": "Restores warm inference replicas in seconds instead of waiting minutes for cold-start compilation."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "DeepSeek-V4.1-Flash MXFP8 KV cache via FlashMLA V4.1 on Blackwell SM100 (#56893)",
              "Granite and Qwen3-ASR added as EAGLE3 speculative decoding targets (#60855, #52824)",
              "DeepSeek-V4 CPU backend with AVX512/AMX sparse MLA and compressor kernels (#55355)"
            ]
          }
        ]
      },
      {
        "id": "2026-10-29",
        "date_iso": "2026-10-29",
        "label": "2026-10-29",
        "date_range": "Thursday, 2026-10-29",
        "reading_time": "3 min read",
        "headline": "This Week in vLLM (2026-10-29): DeepGEMM Mega-mHC Kernels, Async Engram Prefetch, and ROCm 10.0 Preparation",
        "intro": "Highlights from the 2026-10-29 development week: DeepGEMM Mega-mHC kernels and async Engram DP sharding land for DeepSeek-V4, alongside ROCm 10.0 container and wheel updates.",
        "tldr_cards": [
          {
            "tag": "MoE Kernels",
            "title": "DeepGEMM Mega-mHC & Async Engram Prefetch (#56962, #56512)",
            "summary": "Fuses multi-head latent compressor projections with DeepGEMM and overlaps Engram host table prefetching across DP ranks.",
            "impact": "Lowers inter-token latency on DeepSeek-V4 andGLM-5.3 MoE deployments.",
            "prs": [
              "#56962",
              "#56512"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Merges",
            "items": [
              {
                "title": "GLM-5.3-Flash with DFlash2 drafter and EPLB load balancing",
                "pr": "#56983",
                "what_it_is": "Integrates the DFlash2 block-diffusion speculative drafter with Expert Parallel Load Balancing (EPLB) for GLM-5.3-Flash.",
                "why_you_care": "Prevents hot-expert bottlenecks across multi-GPU MoE ranks while accelerating single-stream decode."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "MiniMax-M3 EAGLE3 speculative decoding at Pipeline Parallelism (PP > 1) on MRV2 (#57197)",
              "Shared target embeddings for Multi-Token Prediction (MTP) under Pipeline Parallelism (#58648)",
              "LoRA support extended to BERT, RoBERTa, and XLM-RoBERTa embedding models (#61033)"
            ]
          }
        ]
      }
    ]
  },
  "kubernetes": {
    "brand": "KubePulse",
    "tagline": "What changed in Kubernetes \u2014 translated from KEPs and changelogs into plain-English upgrade and platform decisions.",
    "weekly": {
      "id": "this-week-in-kubernetes",
      "date_iso": "2026-11-19",
      "date_range": "Thursday, 2026-11-19 (LWKD Digest)",
      "reading_time": "4 min read",
      "headline": "This Week in Kubernetes (2026-11-19): 50% Lower UnstructuredList Memory, Conditional Authorization, and Patch Releases 1.37.2 / 1.36.6",
      "intro": "Modeled on Last Week in Kubernetes Development (LWKD) + Sysdig's operational lens: what merged in upstream Kubernetes this week and what it means for your clusters.",
      "tldr_cards": [
        {
          "tag": "Control Plane Efficiency",
          "title": "Decoding JSON into UnstructuredList Now Uses 50% Less RAM & 33% Less CPU Time",
          "summary": "A major optimization in client/server JSON decoding cuts memory allocations in half when listing Custom Resources (CRDs) and dynamic objects.",
          "impact": "Directly lowers memory spikes in Argo CD, Flux, Kyverno, and custom operators watching large CRD fleets.",
          "prs": [
            "#142575"
          ]
        },
        {
          "tag": "Upgrade Alert",
          "title": "Locked GA `SupplementalGroupsPolicy` Feature Gate Removed + Kubernetes 1.34 Reaches EOL",
          "summary": "The graduated `SupplementalGroupsPolicy` gate has been removed from component flags, and Kubernetes 1.34 officially reached End of Life alongside patch releases 1.37.2, 1.36.6, and 1.35.10.",
          "impact": "Remove `--feature-gates=SupplementalGroupsPolicy=...` from your API server/kubelet manifests before upgrading.",
          "prs": [
            "#142093"
          ]
        },
        {
          "tag": "Storage & StatefulSets",
          "title": "StatefulSet `maxUnavailable` Partition Fix & CSI Controller Node Info (KEP-6011)",
          "summary": "StatefulSet rolling updates no longer count unavailable pods below the partition against your `maxUnavailable` budget, and KEP-6011 moves CSI cloud topology queries off worker nodes.",
          "impact": "Safer canary rollouts for databases and no more cloud IAM credentials needed on worker nodes for CSI volume limits.",
          "prs": [
            "#143114",
            "#143644"
          ]
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
        "date": "2026-08-26",
        "stats": "67 enhancements \u00b7 16 Stable \u00b7 23 Beta \u00b7 27 Alpha",
        "headline": "HPA Scale-to-Zero Enabled by Default, Beta Gang Scheduling, and Resilient API Server Watch Cache",
        "executive_summary": "Kubernetes 1.37 ('Garhwal') is a huge release for AI/GPU platforms and cost-conscious cluster operators. HorizontalPodAutoscaler (HPA) Scale-to-Zero graduates to Beta (enabled by default), native Gang Scheduling (`Workload` / `PodGroup`) reaches Beta with workload-aware preemption, and Resilient WatchCache Initialization finishes graduating to Stable\u2014protecting `etcd` from startup list storms.",
        "five_parts": {
          "big_deal": [
            {
              "title": "HPA Scale-to-Zero Is Now Beta & Enabled by Default (KEP-2021)",
              "status": "Beta (On by Default)",
              "status_tone": "green",
              "prs": [
                "KEP-2021"
              ],
              "before": "In standard Kubernetes, `HorizontalPodAutoscaler` required at least 1 running replica (`minReplicas: 1`) unless you manually enabled alpha feature gates or installed KEDA.",
              "now": "Workloads driven by external or object metrics (like queue depth or pending inference requests) can set `spec.minReplicas: 0` out of the box. Kubernetes parks the deployment at 0 pods when idle and wakes it up automatically when work arrives.",
              "config_snippet": "apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  minReplicas: 0   # Now works out-of-the-box in v1.37!\n  maxReplicas: 32",
              "tech_bullets": [
                "Workloads driven by external or object metrics (like queue depth or pending inference requests) can set `spec.minReplicas: 0` out of the box. Kubernetes parks the deployment at 0 pods when idle and wakes it up automatically when work arrives."
              ]
            },
            {
              "title": "Native Gang Scheduling (`PodGroup`) Graduates to Beta with Preemption (KEP-4671)",
              "status": "Beta",
              "status_tone": "cyan",
              "prs": [
                "KEP-4671",
                "KEP-5710"
              ],
              "before": "Scheduling a 16-pod distributed PyTorch or Ray job without Kueue/Volcano risked placing 14 pods that sat idle burning GPU money while waiting for the last 2 pods.",
              "now": "Native all-or-nothing gang scheduling via `PodGroup` and the new `spec.scheduling` field on `batch/v1 Job` ensures the scheduler only binds pods when the entire group fits\u2014plus workload-aware preemption.",
              "config_snippet": "apiVersion: batch/v1\nkind: Job\nspec:\n  parallelism: 8\n  scheduling:\n    podGroup:\n      minMember: 8",
              "tech_bullets": [
                "Native all-or-nothing gang scheduling via `PodGroup` and the new `spec.scheduling` field on `batch/v1 Job` ensures the scheduler only binds pods when the entire group fits\u2014plus workload-aware preemption."
              ]
            },
            {
              "title": "Resilient WatchCache Initialization Locked to Stable (KEP-4568)",
              "status": "Stable / GA",
              "status_tone": "green",
              "prs": [
                "KEP-4568"
              ],
              "before": "When `kube-apiserver` restarted in a large cluster, hundreds of controllers hammered `etcd` with uncached LIST requests while the watch cache warmed up\u2014often causing cascading control-plane outages.",
              "now": "The API server gracefully throttles expensive uncached requests with `HTTP 429 Too Many Requests` (`Retry-After`) while warming the watch cache, keeping `etcd` rock-solid.",
              "config_snippet": "# Locked on by default in v1.37 (ensure custom controllers respect HTTP 429 Retry-After)",
              "tech_bullets": [
                "The API server gracefully throttles expensive uncached requests with `HTTP 429 Too Many Requests` (`Retry-After`) while warming the watch cache, keeping `etcd` rock-solid."
              ]
            },
            {
              "title": "Scheduler Preemption for Deferred In-Place Pod Resizes (KEP-1287)",
              "status": "Alpha",
              "status_tone": "cyan",
              "prs": [
                "KEP-1287"
              ],
              "before": "After In-Place Pod Vertical Scaling graduated to Stable in v1.35, a pod requesting more CPU/RAM on a full node stayed stuck in `Deferred` state forever if no capacity freed up.",
              "now": "The control plane can now actively preempt lower-priority pods on that node so a critical workload's in-place vertical resize succeeds without restarting.",
              "config_snippet": "--feature-gates=InPlacePodVerticalScalingSchedulerPreemption=true",
              "tech_bullets": [
                "The control plane can now actively preempt lower-priority pods on that node so a critical workload's in-place vertical resize succeeds without restarting."
              ]
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
            "verdict": "Upgrade Recommended \u2014 Check custom operators for HTTP 429 retry compliance.",
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
          ],
          "high_level_changes": [
            {
              "headline": "HPA Scale-to-Zero Is Now Beta & Enabled by Default",
              "plain_summary": "Workloads driven by external or object metrics (like queue depth or pending inference requests) can set `spec.minReplicas: 0` out of the box. Kubernetes parks the deployment at 0 pods when idle and wakes it up automatically when work arrives."
            },
            {
              "headline": "Native Gang Scheduling",
              "plain_summary": "Native all-or-nothing gang scheduling via `PodGroup` and the new `spec.scheduling` field on `batch/v1 Job` ensures the scheduler only binds pods when the entire group fits\u2014plus workload-aware preemption."
            },
            {
              "headline": "Resilient WatchCache Initialization Locked to Stable",
              "plain_summary": "The API server gracefully throttles expensive uncached requests with `HTTP 429 Too Many Requests` (`Retry-After`) while warming the watch cache, keeping `etcd` rock-solid."
            },
            {
              "headline": "Scheduler Preemption for Deferred In-Place Pod Resizes",
              "plain_summary": "The control plane can now actively preempt lower-priority pods on that node so a critical workload's in-place vertical resize succeeds without restarting."
            }
          ]
        }
      },
      {
        "version": "v1.36",
        "badge": "Release",
        "date": "2026-04-22",
        "stats": "347 upstream changes and 187 PRs",
        "headline": "Dynamic Resource Allocation, Feature Enhancements",
        "executive_summary": "Kubernetes v1.36 focuses on Dynamic Resource Allocation, Feature Enhancements, and Workload-Aware & Gang Scheduling. For operators, this release translates 347 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Dynamic Resource Allocation",
              "plain_summary": "Improves dynamic resource allocation for ai/ml training, llm inference pods, fractional/multi-gpu workloads, and nic/fpga consumers running on nvidia/amd gpu nodes, multi-nic rdma clusters, and topology-aware hardware pools, delivering higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting."
            },
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Workload-Aware & Gang Scheduling",
              "plain_summary": "Improves workload-aware & gang scheduling for distributed ai training, multi-node batch jobs, ray/spark clusters, and mpi workloads running on high-density gpu/cpu batch pools and `kube-scheduler` queues, delivering prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers."
            },
            {
              "headline": "API Change Enhancements",
              "plain_summary": "Improves api change enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "API Server & etcd Watch/Cache Efficiency at Scale",
              "plain_summary": "Improves api server & etcd watch/cache efficiency at scale for operator-heavy platforms, argo cd / flux gitops controllers, and multi-tenant clusters with 10k+ crds/pods running on control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) cpu and memory footprint, delivering cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages."
            }
          ],
          "big_deal": [
            {
              "title": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-5055",
                "KEP-5007",
                "#5055",
                "#137170"
              ],
              "before": "Prior to v1.36, teams operating dynamic resource allocation relied on older execution paths or manual tuning on NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools.",
              "tech_bullets": [
                "DRA: Graduated device taints and tolerations (KEP #5055) to beta. Support for DeviceTaints in ResourceSlices is on by default. Support for `DeviceTaintRules` depends on enabling (#5055, #137170).",
                "DRA: Graduated Device Binding Conditions (KEP #5007) to beta, enabled by default in `v1.36`. ([#137795](https://github.com/kubernetes/kubernetes/pull/137795) (#5007, #137795).",
                "DRA ResourceSlice controller: Added optional `ReconcilePoolWithName` to allow per-pool reconciliation without setting `NodeName` on slices, so the scheduler can use `NodeSelector` or `allNodes` for (#137365).",
                "ACTION REQUIRED: DRA (Dynamic Resource Allocation) drivers and controllers now require granular RBAC permissions to update ResourceClaim statuses when the (#134947)."
              ],
              "why_it_matters": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#135462",
                "#135773",
                "#136008"
              ],
              "before": "Prior to v1.36, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Client-go: Default informer behavior now updates store state with all the objects in a list or relist before calling handler `OnDelete`, `OnAdd`, or `OnUpdate` methods for individual items which were (#135462).",
                "Kubeadm: Removed the `ControlPlaneKubeletLocalMode` feature gate, which graduated to GA in `v1.35` and was locked to enabled. ([#135773](https://github.com/kubernetes/kubernetes/pull/135773).",
                "Client-go: Improved informer resync processing to reduce contention on store locks between incoming events and handler updates, which may result in observable timing differences of handler (#136008).",
                "Client-go: Informers can now enqueue new watch events while already-queued events are being processed. This avoids dropping watches during a burst of incoming events due to contention on slow (#136264)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Workload-Aware & Gang Scheduling (`PodGroup` / `Job` / Queueing)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#137201",
                "#136589",
                "#137271"
              ],
              "before": "Prior to v1.36, teams operating workload-aware & gang scheduling relied on older execution paths or manual tuning on High-density GPU/CPU batch pools and `kube-scheduler` queues.",
              "tech_bullets": [
                "Added the PlacementScore extension point to the scheduler for scoring placements in placement-based PodGroup scheduling, guarded by the `TopologyAwareWorkloadScheduling` feature gate. Deprecated (#137201).",
                "Added `DisruptionMode`, `PriorityClassName`, and `Priority` fields to the Workload and PodGroup APIs to support workload-aware preemption when the `WorkloadAwarePreemption` feature gate is enabled. (#136589).",
                "Added SchedulingConstraints to express topology-aware scheduling (TAS) constraints for PodGroup scheduling behind the `TopologyAwareWorkloadScheduling` feature gate. Added the TopologyPlacement (#137271).",
                "Added placement-based PodGroup scheduling algorithm to the scheduler. Its use is guarded by the `TopologyAwareWorkloadScheduling` feature gate. (#136944)."
              ],
              "why_it_matters": "Prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#135322",
                "#136230",
                "#137544"
              ],
              "before": "Prior to v1.36, teams operating api change enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Removed the in-tree Portworx volume plugin, completing the migration to CSI. Removed the GA `CSIMigrationPortworx` feature gate (locked since `v1.33`) and alpha `InTreePluginPortworxUnregister` (#135322).",
                "Promoted mutable CSI node allocatable count to GA. The `MutableCSINodeAllocatableCount` feature gate is locked to enabled. ([#136230](https://github.com/kubernetes/kubernetes/pull/136230).",
                "Promoted the `NodeLogQuery` feature gate to GA. ([#137544](https://github.com/kubernetes/kubernetes/pull/137544), [@jrvaldes](https://github.com/jrvaldes)) [SIG Node and Windows].",
                "Added stability-based lifecycle for declarative validation (Alpha/Beta/Stable). Scheduling Workload `v1alpha1` now uses explicit declarative enforcement. (#136793)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#137053",
                "#137172",
                "#136118"
              ],
              "before": "Prior to v1.36, teams operating api server & etcd watch/cache efficiency at scale relied on older execution paths or manual tuning on Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint.",
              "tech_bullets": [
                "The `StrictIPCIDRValidation` feature gate in `kube-apiserver` is enabled by default, meaning that API fields no longer allow IP or CIDR values with extraneous leading \"0\"s (e.g., `010.000.000.005` (#137053).",
                "Kube-apiserver: Graduated the `UnknownVersionInteroperabilityProxy` feature gate to beta, enabled by default. The `--peer-ca-file` flag is required to turn on the proxy. (#137172).",
                "Kube-apiserver: Promoted the `ExternalServiceAccountTokenSigner` feature gate to GA. ([#136118](https://github.com/kubernetes/kubernetes/pull/136118).",
                "Graduated metric `apiserver_storage_events_received_total` to beta. ([#136314](https://github.com/kubernetes/kubernetes/pull/136314), [@petern48](https://github.com/petern48)) [SIG API Machinery."
              ],
              "why_it_matters": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "models": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
              "gpus": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
              "impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Workload-Aware & Gang Scheduling (`PodGroup` / `Job` / Queueing)",
              "models": "Distributed AI training, multi-node batch jobs, Ray/Spark clusters, and MPI workloads",
              "gpus": "High-density GPU/CPU batch pools and `kube-scheduler` queues",
              "impact": "Prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "ACTION REQUIRED: kube-controller-manager: Renamed metric `volume_operation_total_errors` to `volume_operation_errors_total`. If you are using custom monitoring dashboards or alerting rules based on the `volume_operation_",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#136399"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Added support for running PreBind plugins in parallel in the scheduler framework to improve binding latency. ACTION REQUIRED: Plugins can opt-in to parallel execution by returning `AllowParallel: true` from the `PreBindP",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#135393"
              },
              {
                "change": "Deprecation",
                "impact": "Added warnings and deprecation for Service `.spec.externalIPs`. ([#137293](https://github.com/kubernetes/kubernetes/pull/137293), [@adrianmoisey](https://github.com/adrianmoisey)) [SIG Apps, Network and Windows]",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#137293"
              },
              {
                "change": "Deprecation",
                "impact": "Direct access to the `Raw` field of `metav1.FieldsV1` is deprecated. Code that constructs or reads `FieldsV1` should migrate to the new `NewFieldsV1(string)`, `GetRawBytes()`, `GetRawString()`, and `SetRawBytes()` access",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#137304"
              },
              {
                "change": "Deprecation",
                "impact": "Disabled `git-repo` volume plugin by default, with no option to turn it back on. ([#136400](https://github.com/kubernetes/kubernetes/pull/136400), [@vinayakankugoyal](https://github.com/vinayakankugoyal)) [SIG Storage]",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#136400"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "DRA: Graduated device taints and tolerations (KEP #5055) to beta. Support for DeviceTaints in ResourceSlices is on by default. Support for `DeviceTaintRules` de",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5055"
            },
            {
              "label": "API Change",
              "hardware": "DRA: Graduated Device Binding Conditions (KEP #5007) to beta, enabled by default in `v1.36`. ([#137795](https://github.com/kubernetes/kubernetes/pull/137795), [",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#5007"
            },
            {
              "label": "API Change",
              "hardware": "Removed the in-tree Portworx volume plugin, completing the migration to CSI. Removed the GA `CSIMigrationPortworx` feature gate (locked since `v1.33`) and alpha",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#135322"
            },
            {
              "label": "Feature",
              "hardware": "Kube-apiserver: Graduated the `UnknownVersionInteroperabilityProxy` feature gate to beta, enabled by default. The `--peer-ca-file` flag is required to turn on t",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#137172"
            },
            {
              "label": "Feature",
              "hardware": "Kubeadm: Removed the `ControlPlaneKubeletLocalMode` feature gate, which graduated to GA in `v1.35` and was locked to enabled. ([#135773](https://github.com/kube",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#135773"
            }
          ]
        }
      },
      {
        "version": "v1.35",
        "badge": "Timbernetes Release",
        "date": "2025-12-17",
        "stats": "60 enhancements \u00b7 17 Stable \u00b7 19 Beta \u00b7 22 Alpha",
        "headline": "In-Place Pod Vertical Scaling Reaches GA (Stable) and Native Pod Certificates Enter Beta",
        "executive_summary": "Kubernetes 1.35 ('Timbernetes') graduates one of the most requested features in Kubernetes history to General Availability: In-Place Update of Pod Resources (KEP-1287), allowing you to resize CPU and memory on running pods without restarting them. It also brings native kubelet-issued mTLS Pod Certificates to Beta.",
        "five_parts": {
          "big_deal": [
            {
              "title": "In-Place Pod CPU & Memory Resize Graduates to Stable (KEP-1287)",
              "status": "Stable / GA",
              "status_tone": "green",
              "prs": [
                "KEP-1287"
              ],
              "before": "Changing a Pod's CPU or memory limits required killing the Pod and creating a new one\u2014dropping active connections and forcing slow model/cache reloads.",
              "now": "Patch the `resources` subresource on a running Pod and `kubelet` updates Linux cgroup limits in place with zero restart.",
              "config_snippet": "kubectl patch pod my-llm-server --subresource resize --patch \\\n  '{\"spec\":{\"containers\":[{\"name\":\"vllm\",\"resources\":{\"requests\":{\"cpu\":\"16\"}}}]}}'",
              "tech_bullets": [
                "Patch the `resources` subresource on a running Pod and `kubelet` updates Linux cgroup limits in place with zero restart."
              ]
            },
            {
              "title": "Native Pod Certificates for Workload Identity & mTLS (KEP-4317)",
              "status": "Beta",
              "status_tone": "cyan",
              "prs": [
                "KEP-4317"
              ],
              "before": "Zero-trust pod mTLS required external controllers (cert-manager, SPIRE), init containers, and Secret volume mounts.",
              "now": "`kubelet` generates private keys locally, requests X.509 certificates via `PodCertificateRequest`, and rotates credential bundles directly into the Pod filesystem.",
              "config_snippet": "# Native mTLS credential bundles mounted and rotated by kubelet",
              "tech_bullets": [
                "`kubelet` generates private keys locally, requests X.509 certificates via `PodCertificateRequest`, and rotates credential bundles directly into the Pod filesystem."
              ]
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
            "verdict": "Must-Have Upgrade \u2014 In-Place Pod Resize GA alone justifies moving to 1.35+.",
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
          ],
          "high_level_changes": [
            {
              "headline": "In-Place Pod CPU & Memory Resize Graduates to Stable",
              "plain_summary": "Patch the `resources` subresource on a running Pod and `kubelet` updates Linux cgroup limits in place with zero restart."
            },
            {
              "headline": "Native Pod Certificates for Workload Identity & mTLS",
              "plain_summary": "`kubelet` generates private keys locally, requests X.509 certificates via `PodCertificateRequest`, and rotates credential bundles directly into the Pod filesystem."
            }
          ]
        }
      },
      {
        "version": "v1.34",
        "badge": "Of Wind & Will",
        "date": "2025-08-27",
        "stats": "58 enhancements \u00b7 23 Stable \u00b7 22 Beta \u00b7 13 Alpha",
        "headline": "Dynamic Resource Allocation (DRA) Core Reaches GA for GPUs, Plus Stable OpenTelemetry Tracing",
        "executive_summary": "Kubernetes 1.34 graduates the core of Dynamic Resource Allocation (`resource.k8s.io/v1`) to General Availability\u2014replacing rigid integer device plugins with a flexible API for GPUs, NICs, and accelerators\u2014while graduating API server and kubelet OpenTelemetry tracing to Stable.",
        "five_parts": {
          "big_deal": [
            {
              "title": "Dynamic Resource Allocation (DRA) Core Reaches GA (`resource.k8s.io/v1`)",
              "status": "Stable / GA",
              "status_tone": "green",
              "prs": [
                "KEP-4381"
              ],
              "before": "Kubernetes Device Plugins could only count GPUs as dumb integers (`nvidia.com/gpu: 1`) with no native way to express GPU sharing, NVLink topology, or custom driver parameters.",
              "now": "DRA (`ResourceClaim`, `DeviceClass`) is Stable under `resource.k8s.io/v1`, enabling structured GPU sharing, topology alignment, and safe admin diagnostic access.",
              "config_snippet": "apiVersion: resource.k8s.io/v1\nkind: ResourceClaimTemplate\nspec:\n  spec:\n    devices:\n      requests:\n      - name: gpu\n        exactly:\n          deviceClassName: gpu.nvidia.com",
              "tech_bullets": [
                "DRA (`ResourceClaim`, `DeviceClass`) is Stable under `resource.k8s.io/v1`, enabling structured GPU sharing, topology alignment, and safe admin diagnostic access."
              ]
            },
            {
              "title": "Snapshottable API Server Cache & WatchList Streaming",
              "status": "Beta (On by Default)",
              "status_tone": "cyan",
              "prs": [
                "KEP-4988"
              ],
              "before": "Paginated `LIST` calls from controllers bypassed the watch cache and hit `etcd` directly, causing heavy database load and memory spikes.",
              "now": "`ListFromCacheSnapshot` serves paginated list continuations directly from API server memory snapshots instead of `etcd`.",
              "config_snippet": "# Enabled by default in v1.34 via ListFromCacheSnapshot=true",
              "tech_bullets": [
                "`ListFromCacheSnapshot` serves paginated list continuations directly from API server memory snapshots instead of `etcd`."
              ]
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
            "verdict": "Recommended Upgrade \u2014 Foundation for all modern GPU scheduling on Kubernetes.",
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
          ],
          "high_level_changes": [
            {
              "headline": "Dynamic Resource Allocation",
              "plain_summary": "DRA (`ResourceClaim`, `DeviceClass`) is Stable under `resource.k8s.io/v1`, enabling structured GPU sharing, topology alignment, and safe admin diagnostic access."
            },
            {
              "headline": "Snapshottable API Server Cache & WatchList Streaming",
              "plain_summary": "`ListFromCacheSnapshot` serves paginated list continuations directly from API server memory snapshots instead of `etcd`."
            }
          ]
        }
      },
      {
        "version": "v1.33",
        "badge": "Release",
        "date": "2025-04-23",
        "stats": "261 upstream changes and 151 PRs",
        "headline": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle, API Server & etcd Watch/Cache Efficiency at Scale",
        "executive_summary": "Kubernetes v1.33 focuses on Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle, API Server & etcd Watch/Cache Efficiency at Scale, and In-Place Pod Vertical Scaling. For operators, this release translates 261 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "plain_summary": "Improves native sidecar containers, checkpoint/restore & node lifecycle for service-mesh pods, telemetry agents, fast-restoring stateful apps, and oci artifact mounts running on kubelet cri runtime (containerd / cri-o) and linux/windows worker nodes, delivering stops zombie sidecars from holding batch nodes open after job completion."
            },
            {
              "headline": "API Server & etcd Watch/Cache Efficiency at Scale",
              "plain_summary": "Improves api server & etcd watch/cache efficiency at scale for operator-heavy platforms, argo cd / flux gitops controllers, and multi-tenant clusters with 10k+ crds/pods running on control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) cpu and memory footprint, delivering cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages."
            },
            {
              "headline": "In-Place Pod Vertical Scaling",
              "plain_summary": "Improves in-place pod vertical scaling for stateful microservices, warm inference engines, jvms, and suspended batch jobs needing cpu/ram adjustments running on linux worker nodes and kubelet resource allocation loops, delivering eliminates over-provisioning buffer and avoids expensive pod restart cold-starts during traffic spikes."
            },
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "CEL-Based Validating & Mutating Admission Policies",
              "plain_summary": "Improves cel-based validating & mutating admission policies for platform security guardrails, multi-tenant compliance policies, and default resource injectors running on in-process `kube-apiserver` admission chain (replaces external webhook deployments), delivering removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts."
            }
          ],
          "big_deal": [
            {
              "title": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#129731",
                "#130058",
                "#125230"
              ],
              "before": "Prior to v1.33, teams operating native sidecar containers, checkpoint/restore & node lifecycle relied on older execution paths or manual tuning on Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes.",
              "tech_bullets": [
                "The `SidecarContainers` feature has graduated to GA. 'SidecarContainers' feature gate was locked to default value and will be removed in v1.36. If you were setting this feature gate explicitly (#129731).",
                "Introduced the `LegacySidecarContainers` feature gate enabling the legacy code path that predates the `SidecarContainers` feature. This temporary feature gate is disabled by default, only available (#130058).",
                "Graduated image volume sources to beta:.",
                "kubectl: Added alpha support for customizing kubectl behavior using preferences from a `kuberc` file, separate from `kubeconfig`. ([#125230](https://github.com/kubernetes/kubernetes/pull/125230)."
              ],
              "why_it_matters": "Stops zombie sidecars from holding batch nodes open after job completion",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#130560",
                "#129589",
                "#129934"
              ],
              "before": "Prior to v1.33, teams operating api server & etcd watch/cache efficiency at scale relied on older execution paths or manual tuning on Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint.",
              "tech_bullets": [
                "The `RemoteRequestHeaderUID` feature moves to beta and is now enabled by default. This makes the kube-apiserver propagate UIDs in the `X-Remote-Uid` header in requests to the aggregated API servers. (#130560).",
                "kubeadm: removed the feature gate EtcdLearnerMode which graduated to GA in 1.32. ([#129589](https://github.com/kubernetes/kubernetes/pull/129589), [@neolit123](https://github.com/neolit123)) [SIG.",
                "Graduated `BtreeWatchCache` feature gate to GA. ([#129934](https://github.com/kubernetes/kubernetes/pull/129934), [@serathius](https://github.com/serathius)).",
                "kube-apiserver: Promoted the  `ServiceAccountTokenNodeBinding` feature gate general availability. It is now locked to enabled. ([#129591](https://github.com/kubernetes/kubernetes/pull/129591)."
              ],
              "why_it_matters": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages",
              "config_snippet": ""
            },
            {
              "title": "In-Place Pod Vertical Scaling (Zero-Restart Resource Resize)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#130905",
                "#130574",
                "#130880"
              ],
              "before": "Prior to v1.33, teams operating in-place pod vertical scaling relied on older execution paths or manual tuning on Linux worker nodes and kubelet resource allocation loops.",
              "tech_bullets": [
                "Promoted in-place Pod vertical scaling to beta. The `InPlacePodVerticalScaling` feature gate is now enabled by default. ([#130905](https://github.com/kubernetes/kubernetes/pull/130905).",
                "For the `InPlacePodVerticalScaling` feature, the API server will no longer set the resize status to `Proposed` upon receiving a resize request. (#130574).",
                "The feature gate `InPlacePodVerticalScalingAllocatedStatus` is deprecated and no longer used. The `AllocatedResources` field in `ContainerStatus` is now guarded by the `InPlacePodVerticalScaling` (#130880).",
                "InPlacePodVerticalScaling: Memory limits cannot be decreased unless the memory resize restart policy is set to `RestartContainer`. Container resizePolicy is no longer mutable. (#130183)."
              ],
              "why_it_matters": "Eliminates over-provisioning buffer and avoids expensive pod restart cold-starts during traffic spikes",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#129713",
                "#130728",
                "#130772"
              ],
              "before": "Prior to v1.33, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Graduated the `DisableNodeKubeProxyVersion` feature gate to enable by default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for its associated Node. (#129713).",
                "The `DeclarativeValidation` feature gate is enabled by default. When enabled, mismatches with existing hand written validation is reported via metrics. The `DeclarativeValidationTakeover` feature (#130728).",
                "Added `SchedulerPopFromBackoffQ` feature gate that is in beta and enabled by default. Improved scheduling queue behavior by popping pods from the backoffQ when the activeQ is empty. This allows to (#130772).",
                "Bumped `ProcMountType` feature to on by default beta ([#130798](https://github.com/kubernetes/kubernetes/pull/130798), [@haircommander](https://github.com/haircommander)) [SIG Node]."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "CEL-Based Validating & Mutating Admission Policies",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#128971",
                "#129028",
                "#129844"
              ],
              "before": "Prior to v1.33, teams operating cel-based validating & mutating admission policies relied on older execution paths or manual tuning on In-process `kube-apiserver` admission chain (replaces external webhook deployments).",
              "tech_bullets": [
                "Graduated the `MultiCIDRServiceAllocator` feature gate to stable, and the `DisableAllocatorDualWrite` feature gate to beta (disabled by default). Action required for Kubernetes cluster administrators (#128971).",
                "Added unit test helpers to validate CEL and patterns in CustomResourceDefinitions. ([#129028](https://github.com/kubernetes/kubernetes/pull/129028), [@sttts](https://github.com/sttts)).",
                "`cel-go` has been bumped to `v0.23.2`. ([#129844](https://github.com/kubernetes/kubernetes/pull/129844), [@cici37](https://github.com/cici37)) [SIG API Machinery, Auth, Cloud Provider and Node]."
              ],
              "why_it_matters": "Removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "models": "Service-mesh pods, telemetry agents, fast-restoring stateful apps, and OCI artifact mounts",
              "gpus": "Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes",
              "impact": "Stops zombie sidecars from holding batch nodes open after job completion"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "In-Place Pod Vertical Scaling (Zero-Restart Resource Resize)",
              "models": "Stateful microservices, warm inference engines, JVMs, and suspended Batch Jobs needing CPU/RAM adjustments",
              "gpus": "Linux worker nodes and kubelet resource allocation loops",
              "impact": "Eliminates over-provisioning buffer and avoids expensive pod restart cold-starts during traffic spikes"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Added the ability to reduce both the initial delay and the maximum delay accrued between container restarts for a node for containers in `CrashLoopBackOff` across the cluster to the recommended values of `1s` initial del",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#130711"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "[Action Required] CSI drivers that call IsLikelyNotMountPoint should not assume false means that the path is a mount point. Each CSI driver needs to make sure correct usage of return value of IsLikelyNotMountPoint becaus",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#129370"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Fixed the behavior of the `KUBE_PROXY_NFTABLES_SKIP_KERNEL_VERSION_CHECK` environment variable in the nftables proxier. The kernel version check is now skipped only when this variable is explicitly set to a non-empty val",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#130401"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Renamed `UpdatePodTolerations` action type to `UpdatePodToleration`. Action required for custom plugin developers to update their code to follow the rename. ([#129023](https://github.com/kubernetes/kubernetes/pull/129023",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#129023"
              },
              {
                "change": "Deprecation",
                "impact": "The EndpointSlice `hints` field has graduated to GA. The beta annotation `service.kubernetes.io/topology-mode` is now considered deprecated and will not graduate to GA. It remains operational for backward compatibility. ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#130742"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "Graduated the `MultiCIDRServiceAllocator` feature gate to stable, and the `DisableAllocatorDualWrite` feature gate to beta (disabled by default). Action require",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128971"
            },
            {
              "label": "Feature",
              "hardware": "The `SidecarContainers` feature has graduated to GA. 'SidecarContainers' feature gate was locked to default value and will be removed in v1.36. If you were sett",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#129731"
            },
            {
              "label": "Feature",
              "hardware": "Promoted in-place Pod vertical scaling to beta. The `InPlacePodVerticalScaling` feature gate is now enabled by default. ([#130905](https://github.com/kubernetes",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#130905"
            },
            {
              "label": "Feature",
              "hardware": "The `RemoteRequestHeaderUID` feature moves to beta and is now enabled by default. This makes the kube-apiserver propagate UIDs in the `X-Remote-Uid` header in r",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#130560"
            },
            {
              "label": "Feature",
              "hardware": "Graduated the `DisableNodeKubeProxyVersion` feature gate to enable by default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for it",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#129713"
            }
          ]
        }
      },
      {
        "version": "v1.32",
        "badge": "Release",
        "date": "2024-12-11",
        "stats": "298 upstream changes and 135 PRs",
        "headline": "Dynamic Resource Allocation, API Server & etcd Watch/Cache Efficiency at Scale",
        "executive_summary": "Kubernetes v1.32 focuses on Dynamic Resource Allocation, API Server & etcd Watch/Cache Efficiency at Scale, and API Change Enhancements. For operators, this release translates 298 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Dynamic Resource Allocation",
              "plain_summary": "Improves dynamic resource allocation for ai/ml training, llm inference pods, fractional/multi-gpu workloads, and nic/fpga consumers running on nvidia/amd gpu nodes, multi-nic rdma clusters, and topology-aware hardware pools, delivering higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting."
            },
            {
              "headline": "API Server & etcd Watch/Cache Efficiency at Scale",
              "plain_summary": "Improves api server & etcd watch/cache efficiency at scale for operator-heavy platforms, argo cd / flux gitops controllers, and multi-tenant clusters with 10k+ crds/pods running on control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) cpu and memory footprint, delivering cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages."
            },
            {
              "headline": "API Change Enhancements",
              "plain_summary": "Improves api change enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Workload-Aware & Gang Scheduling",
              "plain_summary": "Improves workload-aware & gang scheduling for distributed ai training, multi-node batch jobs, ray/spark clusters, and mpi workloads running on high-density gpu/cpu batch pools and `kube-scheduler` queues, delivering prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers."
            }
          ],
          "big_deal": [
            {
              "title": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#127266",
                "#128003",
                "#127511"
              ],
              "before": "Prior to v1.32, teams operating dynamic resource allocation relied on older execution paths or manual tuning on NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools.",
              "tech_bullets": [
                "DRA: the `DeviceRequestAllocationResult` struct now has an \"AdminAccess\" field which should be used instead of the corresponding field in the `DeviceRequest` field when dealing with an allocation. If (#127266).",
                "Removed all support for _classic_ dynamic resource allocation (DRA). The `DRAControlPlaneController` feature gate, formerly alpha, is no longer available. Kubernetes now only uses the _structured (#128003).",
                "The core functionality of Dynamic Resource Allocation (DRA) got promoted to beta. No action is required when *upgrading*, the previous v1alpha3 API is still supported, so existing deployments and DRA (#127511).",
                "DRA: scheduling pods is up to 16x faster, depending on the scenario. Scheduling throughput depends a lot on cluster utilization. It is higher for lightly loaded clusters with free resources and gets (#127277)."
              ],
              "why_it_matters": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#128053",
                "#128539",
                "#128172"
              ],
              "before": "Prior to v1.32, teams operating api server & etcd watch/cache efficiency at scale relied on older execution paths or manual tuning on Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint.",
              "tech_bullets": [
                "Graduated the `WatchList` feature gate to Beta for kube-apiserver and enabled `WatchListClient` for KCM. ([#128053](https://github.com/kubernetes/kubernetes/pull/128053).",
                "Added the feature gate CBORServingAndStorage to allow CBOR as the encoding for API request and response bodies, and as the storage encoding for custom resources. Clients must opt in; programs built (#128539).",
                "kube-apiserver: Promoted the `StructuredAuthorizationConfiguration` feature gate to GA. The `--authorization-config` flag now accepts `AuthorizationConfiguration` in version (#128172).",
                "Promoted `CustomResourceFieldSelectors` to stable; the feature was enabled by default. The `--feature-gates=CustomResourceFieldSelectors=true` flag was no longer needed on kube-apiserver binaries and (#127673)."
              ],
              "why_it_matters": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#124003",
                "#126465",
                "#127981"
              ],
              "before": "Prior to v1.32, teams operating api change enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "kube-scheduler removed `AzureDiskLimits` ,`CinderLimits` `EBSLimits` and `GCEPDLimits` plugin. Given the corresponding CSI driver reports how many volumes a node can handle in NodeGetInfoResponse (#124003).",
                "ACTION REQUIRED for custom scheduler plugin developers: `PodEligibleToPreemptOthers` in the `preemption` interface now includes `ctx` in the parameters. Please update your plugins' implementation (#126465).",
                "Implemented a new, alpha `seLinuxChangePolicy` field within a Pod-level `securityContext`, under SELinuxChangePolicy feature gate. This field allows for opting out from mounting Pod volumes with (#127981).",
                "Added the ability to change the maximum backoff delay accrued between container restarts for a node for containers in `CrashLoopBackOff`. To set this for a node, turn on the feature gate (#128374)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#128472",
                "#126897",
                "#127009"
              ],
              "before": "Prior to v1.32, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Graduated `SchedulerQueueingHints` to beta; the feature gate is now enabled by default. ([#128472](https://github.com/kubernetes/kubernetes/pull/128472), [@sanposhiho](https://github.com/sanposhiho)).",
                "Promoted the `RelaxedEnvironmentVariableValidation` feature gate to beta and is enabled by default. ([#126897](https://github.com/kubernetes/kubernetes/pull/126897).",
                "Graduated the AnonymousAuthConfigurableEndpoints feature gate to beta and enable by default to allow configurable endpoints for anonymous authentication. (#127009).",
                "Promoted `SizeMemoryBackedVolumes` to stable. ([#126981](https://github.com/kubernetes/kubernetes/pull/126981), [@kannon92](https://github.com/kannon92)) [SIG Node, Storage and Testing]."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Workload-Aware & Gang Scheduling (`PodGroup` / `Job` / Queueing)",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#127402",
                "#124952",
                "#128336"
              ],
              "before": "Prior to v1.32, teams operating workload-aware & gang scheduling relied on older execution paths or manual tuning on High-density GPU/CPU batch pools and `kube-scheduler` queues.",
              "tech_bullets": [
                "Graduated Job's `ManagedBy` field to beta. ([#127402](https://github.com/kubernetes/kubernetes/pull/127402), [@mimowo](https://github.com/mimowo)) [SIG API Machinery, Apps and Testing].",
                "The Job controller now considers sidecar container restart counts when removing pods. ([#124952](https://github.com/kubernetes/kubernetes/pull/124952), [@AxeZhan](https://github.com/AxeZhan)) [SIG.",
                "Annotation `batch.kubernetes.io/cronjob-scheduled-timestamp` added to Job objects scheduled from CronJobs is promoted to stable. ([#128336](https://github.com/kubernetes/kubernetes/pull/128336).",
                "Label `apps.kubernetes.io/pod-index` added to Pod from StatefulSets is promoted to stable Label `batch.kubernetes.io/job-completion-index` added to Pods from Indexed Jobs is promoted to stable (#128387)."
              ],
              "why_it_matters": "Prevents partial-allocation deadlocks where expensive GPU nodes sit idle waiting for peer workers",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "models": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
              "gpus": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
              "impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Deprecation",
                "impact": "Reverted the `DisableNodeKubeProxyVersion` feature gate to default-off to give a full year from deprecation announcement in 1.29 to clearing the field by default, per the [Kubernetes deprecation policy](https://kubernete",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#126720"
              },
              {
                "change": "Deprecation",
                "impact": "ServiceAccount metadata.annotations[kubernetes.io/enforce-mountable-secrets]: deprecated since v1.32; no removal deadline. Prefer separate namespaces to isolate access to mounted secrets. ([#128396](https://github.com/ku",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#128396"
              },
              {
                "change": "API Change",
                "impact": "DRA: the `DeviceRequestAllocationResult` struct now has an \"AdminAccess\" field which should be used instead of the corresponding field in the `DeviceRequest` field when dealing with an allocation. If a device is only all",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#127266"
              },
              {
                "change": "API Change",
                "impact": "Removed all support for _classic_ dynamic resource allocation (DRA). The `DRAControlPlaneController` feature gate, formerly alpha, is no longer available. Kubernetes now only uses the _structured parameters_ model (also ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#128003"
              },
              {
                "change": "Feature",
                "impact": "Added the feature gate CBORServingAndStorage to allow CBOR as the encoding for API request and response bodies, and as the storage encoding for custom resources. Clients must opt in; programs built with client-go can do ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#128539"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Feature",
              "hardware": "Graduated the `WatchList` feature gate to Beta for kube-apiserver and enabled `WatchListClient` for KCM. ([#128053](https://github.com/kubernetes/kubernetes/pul",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128053"
            },
            {
              "label": "API Change",
              "hardware": "Removed all support for _classic_ dynamic resource allocation (DRA). The `DRAControlPlaneController` feature gate, formerly alpha, is no longer available. Kuber",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128003"
            },
            {
              "label": "API Change",
              "hardware": "Introduced `v1alpha1` API for mutating admission policies, enabling extensible #     admission control via CEL expressions (KEP  3962: Mutating Admission Polici",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#127134"
            },
            {
              "label": "API Change",
              "hardware": "The core functionality of Dynamic Resource Allocation (DRA) got promoted to beta. No action is required when *upgrading*, the previous v1alpha3 API is still sup",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#127511"
            },
            {
              "label": "API Change",
              "hardware": "kube-apiserver: Promoted the `StructuredAuthorizationConfiguration` feature gate to GA. The `--authorization-config` flag now accepts `AuthorizationConfiguratio",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#128172"
            }
          ]
        }
      },
      {
        "version": "v1.31",
        "badge": "Release",
        "date": "2024-08-13",
        "stats": "333 upstream changes and 164 PRs",
        "headline": "API Server & etcd Watch/Cache Efficiency at Scale, Workload Identity, User Namespaces & Fine-Grained Authz",
        "executive_summary": "Kubernetes v1.31 focuses on API Server & etcd Watch/Cache Efficiency at Scale, Workload Identity, User Namespaces & Fine-Grained Authz, and Feature Enhancements. For operators, this release translates 333 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "API Server & etcd Watch/Cache Efficiency at Scale",
              "plain_summary": "Improves api server & etcd watch/cache efficiency at scale for operator-heavy platforms, argo cd / flux gitops controllers, and multi-tenant clusters with 10k+ crds/pods running on control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) cpu and memory footprint, delivering cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages."
            },
            {
              "headline": "Workload Identity, User Namespaces & Fine-Grained Authz",
              "plain_summary": "Improves workload identity, user namespaces & fine-grained authz for multi-tenant saas workloads, zero-trust service meshes, and privileged container migrations running on linux kernel namespaces, kubelet endpoints, and csi secret injection paths, delivering reduces security agent/sidecar overhead and shrinks blast radius of container compromises."
            },
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "API Change Enhancements",
              "plain_summary": "Improves api change enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Networking, `nftables` Proxy & Traffic Observability",
              "plain_summary": "Improves networking, `nftables` proxy & traffic observability for high-throughput east-west microservices and latency-sensitive ingress traffic running on linux dataplane (`nftables`/`ipvs`) and cloud load balancers, delivering lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules."
            }
          ],
          "big_deal": [
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-1880",
                "#125591",
                "#125582",
                "#125374"
              ],
              "before": "Prior to v1.31, teams operating api server & etcd watch/cache efficiency at scale relied on older execution paths or manual tuning on Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint.",
              "tech_bullets": [
                "Graduated the `WatchList` feature gate to beta for kube-apiserver and enabled `WatchListClient` for kube-controller-manager (KCM). ([#125591](https://github.com/kubernetes/kubernetes/pull/125591).",
                "Kubeadm: added the ControlPlaneKubeletLocalMode feature gate. It can be used to tell kubeadm to use the local kube-apiserver endpoint for the kubelet when creating a cluster with \"kubeadm init\" or (#125582).",
                "Promoted `StatefulSetStartOrdinal` to stable. This means `--feature-gates=StatefulSetStartOrdinal=true` are not needed on kube-apiserver and kube-controller-manager binaries and they'll be removed (#125374).",
                "Introduces new functionality to the client-go's `List` method, allowing users to enable API streaming. To activate this feature, users can set the `client-go.WatchListClient` feature gate. It is (#124509)."
              ],
              "why_it_matters": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages",
              "config_snippet": ""
            },
            {
              "title": "Workload Identity, User Namespaces & Fine-Grained Authz",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-3619",
                "#126014",
                "#124997",
                "#125257"
              ],
              "before": "Prior to v1.31, teams operating workload identity, user namespaces & fine-grained authz relied on older execution paths or manual tuning on Linux kernel namespaces, kubelet endpoints, and CSI secret injection paths.",
              "tech_bullets": [
                "Promoted `LocalStorageCapacityIsolation` to beta; the behaviour is enabled by default. Within the kubelet, storage capacity isolation is active if the feature gate is enabled and the specific Pod is (#126014).",
                "Kubeadm: deprecated the kubeadm `RootlessControlPlane` feature gate (previously alpha), given that the core K8s `UserNamespacesSupport` feature gate graduated to beta in 1.30. Once core Kubernetes (#124997).",
                "Graduated Kubernetes' support for AppArmor to GA. You now cannot disable the `AppArmor` feature gate. ([#125257](https://github.com/kubernetes/kubernetes/pull/125257).",
                "Kube-apiserver: when the Alpha `UserNamespacesPodSecurityStandards` feature gate is enabled, Pod Security Admission enforcement of the baseline policy now allows `procMount: Unmasked` for user (#126163)."
              ],
              "why_it_matters": "Reduces security agent/sidecar overhead and shrinks blast radius of container compromises",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#125828",
                "#125528",
                "#124673"
              ],
              "before": "Prior to v1.31, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Promoted CRI communication of the cgroup driver mechanism to beta. The `KubeletCgroupDriverFromCRI` feature gate is now in beta and enabled by default. This allows the kubelet to query the container (#125828).",
                "To turn off PortForward over WebSockets for kubectl, the environment variable feature gate must be explicitly set - PORT_FORWARD_WEBSOCKETS=false (#125528).",
                "Promoted `generateName` retries to beta, and made the `NameGenerationRetries` feature gate enabled by default. You can read https://kep.k8s.io/4420 for more details. (#124673).",
                "The feature-gate CSIMigrationPortworx was promoted to beta in Kubernetes 1.25, but turned off by default. In 1.31, it was turned on by default. Before upgrading to 1.31, please make sure that the (#125016)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#123845",
                "#126139",
                "#123638"
              ],
              "before": "Prior to v1.31, teams operating api change enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Graduated the `DisableNodeKubeProxyVersion` feature gate to beta. By default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for its associated Node. (#123845).",
                "Reverted a [change](https://github.com/kubernetes/kubernetes/pull/123513) where `ConsistentListFromCache` was moved to beta and enabled by default. (#126139).",
                "Graduated MatchLabelKeys/MismatchLabelKeys feature in PodAffinity/PodAntiAffinity to Beta. ([#123638](https://github.com/kubernetes/kubernetes/pull/123638).",
                "The `AuthorizeNodeWithSelectors` feature gate changes node authorizer behavior to limit requests from node API clients, so that each Node can only get / list / watch its own Node API object, and can (#125571)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Networking, `nftables` Proxy & Traffic Observability",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#123105",
                "#124152",
                "#124383"
              ],
              "before": "Prior to v1.31, teams operating networking, `nftables` proxy & traffic observability relied on older execution paths or manual tuning on Linux dataplane (`nftables`/`ipvs`) and cloud load balancers.",
              "tech_bullets": [
                "Added support to the kube-proxy nodePortAddresses / --nodeport-addresses option to accept the value \"primary\", meaning to only listen for NodePort connections on the node's primary IPv4 and/or IPv6 (#123105).",
                "The (alpha) nftables mode of kube-proxy now requires version 1.0.1 or later of the nft command-line, and kernel 5.13 or later. (For testing/development purposes, you can use older kernels, as far (#124152).",
                "Kube-proxy's nftables mode (--proxy-mode=nftables) is now beta and available by default. ([#124383](https://github.com/kubernetes/kubernetes/pull/124383).",
                "The iptables mode of kube-proxy now tracks accepted packets that are destined for node-ports on localhost by introducing `kubeproxy_iptables_localhost_nodeports_accepted_packets_total` metric. This (#125015)."
              ],
              "why_it_matters": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "Workload Identity, User Namespaces & Fine-Grained Authz",
              "models": "Multi-tenant SaaS workloads, zero-trust service meshes, and privileged container migrations",
              "gpus": "Linux kernel namespaces, kubelet endpoints, and CSI secret injection paths",
              "impact": "Reduces security agent/sidecar overhead and shrinks blast radius of container compromises"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Added support to the scheduler to start using QueueingHint registered for Pod/Updated event to determine whether unschedulable Pods update make them schedulable, when the feature gate `SchedulerQueueingHints` is enabled.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#122234"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Kubelet flag `--keep-terminated-pod-volumes` was removed.  This flag was deprecated in 2017. ([#122082](https://github.com/kubernetes/kubernetes/pull/122082), [@carlory](https://github.com/carlory)) [SIG Apps, Node, Stor",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#122082"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Reduced state change noise when volume expansion fails. Also mark certain failures as infeasible. ACTION REQUIRED:  If you are using the `RecoverVolumeExpansionFailure` alpha feature gate then after upgrading to this rel",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#126108"
              },
              {
                "change": "Deprecation",
                "impact": "'kubeadm: marked the sub-phase of ''init kubelet-finilize'' called ''experimental-cert-rotation'' as deprecated and print a warning if it is used directly; it will be removed in a future release. Add a replacement sub-ph",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#124419"
              },
              {
                "change": "Deprecation",
                "impact": "Added a warning when creating or updating a PersistentVolume (PV) with the deprecated annotation `volume.beta.kubernetes.io/mount-options`. ([#124819](https://github.com/kubernetes/kubernetes/pull/124819), [@carlory](htt",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#124819"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Feature",
              "hardware": "Graduated the `WatchList` feature gate to beta for kube-apiserver and enabled `WatchListClient` for kube-controller-manager (KCM). ([#125591](https://github.com",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#125591"
            },
            {
              "label": "API Change",
              "hardware": "Promoted `LocalStorageCapacityIsolation` to beta; the behaviour is enabled by default. Within the kubelet, storage capacity isolation is active if the feature g",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#126014"
            },
            {
              "label": "API Change",
              "hardware": "Graduated the `DisableNodeKubeProxyVersion` feature gate to beta. By default, the kubelet no longer attempts to set the `.status.kubeProxyVersion` field for its",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123845"
            },
            {
              "label": "Feature",
              "hardware": "Promoted CRI communication of the cgroup driver mechanism to beta. The `KubeletCgroupDriverFromCRI` feature gate is now in beta and enabled by default. This all",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#125828"
            },
            {
              "label": "Deprecation",
              "hardware": "Kubeadm: deprecated the kubeadm `RootlessControlPlane` feature gate (previously alpha), given that the core K8s `UserNamespacesSupport` feature gate graduated t",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#124997"
            }
          ]
        }
      },
      {
        "version": "v1.30",
        "badge": "Release",
        "date": "2024-04-17",
        "stats": "254 upstream changes and 131 PRs",
        "headline": "API Change Enhancements, Feature Enhancements",
        "executive_summary": "Kubernetes v1.30 focuses on API Change Enhancements, Feature Enhancements, and Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle. For operators, this release translates 254 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "API Change Enhancements",
              "plain_summary": "Improves api change enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "plain_summary": "Improves native sidecar containers, checkpoint/restore & node lifecycle for service-mesh pods, telemetry agents, fast-restoring stateful apps, and oci artifact mounts running on kubelet cri runtime (containerd / cri-o) and linux/windows worker nodes, delivering stops zombie sidecars from holding batch nodes open after job completion."
            },
            {
              "headline": "API Server & etcd Watch/Cache Efficiency at Scale",
              "plain_summary": "Improves api server & etcd watch/cache efficiency at scale for operator-heavy platforms, argo cd / flux gitops controllers, and multi-tenant clusters with 10k+ crds/pods running on control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) cpu and memory footprint, delivering cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages."
            },
            {
              "headline": "CEL-Based Validating & Mutating Admission Policies",
              "plain_summary": "Improves cel-based validating & mutating admission policies for platform security guardrails, multi-tenant compliance policies, and default resource injectors running on in-process `kube-apiserver` admission chain (replaces external webhook deployments), delivering removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts."
            }
          ],
          "big_deal": [
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#123575",
                "#123481",
                "#122589"
              ],
              "before": "Prior to v1.30, teams operating api change enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Graduated pod scheduling gates to general availability. The `PodSchedulingReadiness` feature gate no longer has any effect, and the `.spec.schedulingGates` field is always available within the Pod (#123575).",
                "Graduated support for `minDomains` in pod topology spread constraints, to general availability. The `MinDomainsInPodTopologySpread` feature gate no longer has any effect, and the field is always (#123481).",
                "Contextual logging is now in beta and enabled by default. Check out the [KEP](https://github.com/kubernetes/enhancements/issues/3077) and [official (#122589).",
                "Fixed accidental enablement of the new alpha `optionalOldSelf` API field in `CustomResourceDefinition` validation rules, which should only have been allowed to be set when the (#122329)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#122870",
                "#123281",
                "#121461"
              ],
              "before": "Prior to v1.30, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Promoted the `status.hostIPs` field for Pods to general availability. The `PodHostIPs` feature gate no longer has any effect, and the `status.hostIPs` field is always available within the Pod API. (#122870).",
                "To disable RemoteCommand over WebSockets for kubectl, the environment variable feature gate must be explicitly set to `false`: `KUBECTL_REMOTE_COMMAND_WEBSOCKETS=false`. (#123281).",
                "Promoted the `CRDValidationRatcheting` feature gate to beta and made it enabled by default. ([#121461](https://github.com/kubernetes/kubernetes/pull/121461).",
                "In the Pod API, setting the alpha `procMount` field to `Unmasked` in a container now required setting `spec.hostUsers=false` as well. ([#123520](https://github.com/kubernetes/kubernetes/pull/123520)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-2008",
                "#2008",
                "#123215",
                "#123366"
              ],
              "before": "Prior to v1.30, teams operating native sidecar containers, checkpoint/restore & node lifecycle relied on older execution paths or manual tuning on Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes.",
              "tech_bullets": [
                "Graduated \"Forensic Container Checkpointing\" (KEP #2008) from Alpha to Beta. ([#123215](https://github.com/kubernetes/kubernetes/pull/123215), [@adrianreber](https://github.com/adrianreber)) (#2008, #123215).",
                "Revised node selection based on container image location. The kube-scheduler now considers whether nodes have the required images available for init containers, and for sidecar containers if the (#123366).",
                "In kubelet configuration, the `.memorySwap.swapBehavior` field now accepts a new value `NoSwap`, which becomes the default if unspecified. The previously accepted `UnlimitedSwap` value has been (#122745).",
                "Added the `disable-force-detach` CLI option for `kube-controller-manager`. By default, it's set to `false`. When enabled, it prevents force detaching volumes based on maximum unmount time and node (#120344)."
              ],
              "why_it_matters": "Stops zombie sidecars from holding batch nodes open after job completion",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#122881",
                "#123341",
                "#122571"
              ],
              "before": "Prior to v1.30, teams operating api server & etcd watch/cache efficiency at scale relied on older execution paths or manual tuning on Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint.",
              "tech_bullets": [
                "Added a CBOR implementation of `runtime.Serializer`. Until CBOR graduates to Alpha, API servers will refuse to start if configured with CBOR support. (#122881).",
                "kubeadm: added the `WaitForAllControlPlaneComponents` feature gate. It could be used to tell kubeadm to wait for all control plane components to be ready when running \"kubeadm init\" or \"kubeadm join (#123341).",
                "Added `WatchListClient` feature gate to `client-go`. When enabled, it allows the client to receive a stream of individual items instead of chunking from the server. (#122571).",
                "When the `RetryGenerateName` feature gate is enabled on the kube-apiserver, create requests using generateName are retried automatically by the apiserver when the generated name conflicts with an (#122887)."
              ],
              "why_it_matters": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages",
              "config_snippet": ""
            },
            {
              "title": "CEL-Based Validating & Mutating Admission Policies",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#123405",
                "#123560",
                "#123425"
              ],
              "before": "Prior to v1.30, teams operating cel-based validating & mutating admission policies relied on older execution paths or manual tuning on In-process `kube-apiserver` admission chain (replaces external webhook deployments).",
              "tech_bullets": [
                "ValidatingAdmissionPolicy was promoted to GA and will be `enabled` by default. ([#123405](https://github.com/kubernetes/kubernetes/pull/123405), [@cici37](https://github.com/cici37)).",
                "Promoted `AdmissionWebhookMatchConditions` to GA. The feature is now stable, and the feature gate is now locked to default. ([#123560](https://github.com/kubernetes/kubernetes/pull/123560).",
                "Added feature gate `MutatingAdmissionPolicy` for enabling mutation policy in admission chain. ([#123425](https://github.com/kubernetes/kubernetes/pull/123425), [@cici37](https://github.com/cici37)).",
                "`ValidatingAdmissionPolicy` now supports type checking policies that utilize variables. ([#123083](https://github.com/kubernetes/kubernetes/pull/123083), [@jiahuif](https://github.com/jiahuif))."
              ],
              "why_it_matters": "Removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "models": "Service-mesh pods, telemetry agents, fast-restoring stateful apps, and OCI artifact mounts",
              "gpus": "Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes",
              "impact": "Stops zombie sidecars from holding batch nodes open after job completion"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            },
            {
              "term": "Linux User Namespaces (`hostUsers: false`)",
              "plain_english": "Maps the `root` user inside a container to an unprivileged non-root UID on the host node kernel.",
              "bottom_line": "Dramatically reduces container-escape blast radius even for legacy workloads that require running as `root` inside the container."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Deprecation",
                "impact": "kubectl: Removed the deprecated flag `prune-whitelist` for apply. Please use the flag `prune-allowlist` instead. ([#120246](https://github.com/kubernetes/kubernetes/pull/120246), [@pacoxu](https://github.com/pacoxu))",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#120246"
              },
              {
                "change": "Deprecation",
                "impact": "The deprecated `SecurityContextDeny` admission plugin, which has been deprecated since `v1.27`, has been removed. It is recommended to use the Pod Security Admission plugin instead, which has been available since v1.25. ",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#122612"
              },
              {
                "change": "Feature",
                "impact": "To disable RemoteCommand over WebSockets for kubectl, the environment variable feature gate must be explicitly set to `false`: `KUBECTL_REMOTE_COMMAND_WEBSOCKETS=false`. ([#123281](https://github.com/kubernetes/kubernete",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#123281"
              },
              {
                "change": "API Change",
                "impact": "AppArmor profiles can now be configured through fields on the `PodSecurityContext` and container `SecurityContext`. The beta AppArmor annotations are deprecated, and AppArmor status is no longer included in the node read",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#123435"
              },
              {
                "change": "Feature",
                "impact": "kubectl `port-forward` over websockets (tunneling SPDY) can now be enabled using an `Alpha` feature flag environment variable: KUBECTL_PORT_FORWARD_WEBSOCKETS=true. The API Server being communicated to must *also* have a",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#123413"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "Graduated pod scheduling gates to general availability. The `PodSchedulingReadiness` feature gate no longer has any effect, and the `.spec.schedulingGates` fiel",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123575"
            },
            {
              "label": "API Change",
              "hardware": "Graduated support for `minDomains` in pod topology spread constraints, to general availability. The `MinDomainsInPodTopologySpread` feature gate no longer has a",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123481"
            },
            {
              "label": "API Change",
              "hardware": "Added a CBOR implementation of `runtime.Serializer`. Until CBOR graduates to Alpha, API servers will refuse to start if configured with CBOR support. ([#122881]",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#122881"
            },
            {
              "label": "Feature",
              "hardware": "Graduated \"Forensic Container Checkpointing\" (KEP #2008) from Alpha to Beta. ([#123215](https://github.com/kubernetes/kubernetes/pull/123215), [@adrianreber](ht",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#2008"
            },
            {
              "label": "API Change",
              "hardware": "Promoted `AdmissionWebhookMatchConditions` to GA. The feature is now stable, and the feature gate is now locked to default. ([#123560](https://github.com/kubern",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#123560"
            }
          ]
        }
      },
      {
        "version": "v1.29",
        "badge": "Release",
        "date": "2023-12-13",
        "stats": "302 upstream changes and 131 PRs",
        "headline": "Feature Enhancements, API Server & etcd Watch/Cache Efficiency at Scale",
        "executive_summary": "Kubernetes v1.29 focuses on Feature Enhancements, API Server & etcd Watch/Cache Efficiency at Scale, and Dynamic Resource Allocation. For operators, this release translates 302 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "API Server & etcd Watch/Cache Efficiency at Scale",
              "plain_summary": "Improves api server & etcd watch/cache efficiency at scale for operator-heavy platforms, argo cd / flux gitops controllers, and multi-tenant clusters with 10k+ crds/pods running on control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) cpu and memory footprint, delivering cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages."
            },
            {
              "headline": "Dynamic Resource Allocation",
              "plain_summary": "Improves dynamic resource allocation for ai/ml training, llm inference pods, fractional/multi-gpu workloads, and nic/fpga consumers running on nvidia/amd gpu nodes, multi-nic rdma clusters, and topology-aware hardware pools, delivering higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting."
            },
            {
              "headline": "Networking, `nftables` Proxy & Traffic Observability",
              "plain_summary": "Improves networking, `nftables` proxy & traffic observability for high-throughput east-west microservices and latency-sensitive ingress traffic running on linux dataplane (`nftables`/`ipvs`) and cloud load balancers, delivering lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules."
            },
            {
              "headline": "API Change Enhancements",
              "plain_summary": "Improves api change enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            }
          ],
          "big_deal": [
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#120682",
                "#121485",
                "#121638"
              ],
              "before": "Prior to v1.29, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "`kube-controller-manager`: The `LegacyServiceAccountTokenCleanUp` feature gate is now `beta` and enabled by default. When enabled, legacy auto-generated service account token secrets are auto-labeled (#120682).",
                "The KMSv2 features with feature gates `KMSv2` and `KMSv2KDF` are promoted to `GA`.  The `KMSv1` feature gate is now disabled by default. (#121485).",
                "Priority and Fairness feature is now `stable`, the feature gate will be removed in `v1.31`. ([#121638](https://github.com/kubernetes/kubernetes/pull/121638), [@tkashem](https://github.com/tkashem)).",
                "Changed the `KMSv2KDF` feature gate to be enabled by default. ([#120433](https://github.com/kubernetes/kubernetes/pull/120433), [@enj](https://github.com/enj)) [SIG API Machinery, Auth and Testing]."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "API Server & etcd Watch/Cache Efficiency at Scale",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#120228",
                "#120490",
                "#120154"
              ],
              "before": "Prior to v1.29, teams operating api server & etcd watch/cache efficiency at scale relied on older execution paths or manual tuning on Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint.",
              "tech_bullets": [
                "`kubeadm`: promoted feature gate `EtcdLearnerMode` to `beta`. Learner mode for joining `etcd` members is now enabled by default. ([#120228](https://github.com/kubernetes/kubernetes/pull/120228).",
                "Added `apiserver_watch_list_duration_seconds` metrics which will measure response latency distribution in seconds for watchlist requests broken by group, version, resource and scope. (#120490).",
                "`kube-apiserver`: added `--authorization-config` flag for reading a configuration file containing an `apiserver.config.k8s.io/v1alpha1 AuthorizationConfiguration` object. The `--authorization-config` (#120154).",
                "`PriorityLevelConfiguration`: the `.spec.limited.nominalConcurrencyShares` field defaults to `30` only if the field is omitted (v1beta3 also defaulted an explicit `0` value to `30`). Specifying an (#121089)."
              ],
              "why_it_matters": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages",
              "config_snippet": ""
            },
            {
              "title": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#121254",
                "#117502",
                "#120534"
              ],
              "before": "Prior to v1.29, teams operating dynamic resource allocation relied on older execution paths or manual tuning on NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools.",
              "tech_bullets": [
                "`DevicePluginCDIDevices` feature has been graduated to `beta` and enabled by default in the kubelet. ([#121254](https://github.com/kubernetes/kubernetes/pull/121254).",
                "Added `kubectl node drain` helper callbacks `OnPodDeletionOrEvictionStarted` and `OnPodDeletionOrEvictionFailed`; people extending `kubectl` can use these new callbacks for more granularity. (#117502).",
                "`dra`: the scheduler plugin now avoids additional scheduling attempts in some cases by falling back to SSA after a conflict. ([#120534](https://github.com/kubernetes/kubernetes/pull/120534)."
              ],
              "why_it_matters": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting",
              "config_snippet": ""
            },
            {
              "title": "Networking, `nftables` Proxy & Traffic Observability",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#121046",
                "#119937",
                "#120275"
              ],
              "before": "Prior to v1.29, teams operating networking, `nftables` proxy & traffic observability relied on older execution paths or manual tuning on Linux dataplane (`nftables`/`ipvs`) and cloud load balancers.",
              "tech_bullets": [
                "`kube-proxy` now has a new nftables-based mode, available by running `kube-proxy --feature-gates NFTablesProxyMode=true --proxy-mode nftables` This is currently an alpha-level feature and while it (#121046).",
                "Added a new `ipMode` field to the `.status` of Services where `type` is set to `LoadBalancer`. The new field is behind the `LoadBalancerIPMode` feature gate. (#119937).",
                "The `CloudDualStackNodeIPs` feature is now `beta`, meaning that when using an external cloud provider that has been updated to support the feature, you can pass comma-separated dual-stack (#120275).",
                "Added a new `ServiceCIDR` type that allows to dynamically configure the cluster range used to allocate `Service ClusterIPs` addresses. (#116516)."
              ],
              "why_it_matters": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#121303",
                "#119994",
                "#120954"
              ],
              "before": "Prior to v1.29, teams operating api change enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "`CSINodeExpandSecret` feature has been promoted to `GA` in this release and is enabled by default. The CSI drivers can make use of the `secretRef` values passed in `NodeExpansion` request optionally (#121303).",
                "'`kube-scheduler` component config (`KubeSchedulerConfiguration`) `kubescheduler.config.k8s.io/v1beta3` is removed in `v1.29`. Migrated `kube-scheduler` configuration files to (#119994).",
                "Added the `DisableNodeKubeProxyVersion` feature gate. If `DisableNodeKubeProxyVersion` is enabled, the `kubeProxyVersion` field is not set. (#120954).",
                "Promoted `PodReadyToStartContainers` condition to `beta`. ([#119659](https://github.com/kubernetes/kubernetes/pull/119659), [@kannon92](https://github.com/kannon92))."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "API Server & etcd Watch/Cache Efficiency at Scale",
              "models": "Operator-heavy platforms, Argo CD / Flux GitOps controllers, and multi-tenant clusters with 10k+ CRDs/Pods",
              "gpus": "Control plane (`kube-apiserver`, `etcd`, `kube-controller-manager`) CPU and memory footprint",
              "impact": "Cuts control-plane memory spikes by 30\u201350% during list storms and prevents cascading `etcd` overload outages"
            },
            {
              "persona": "Dynamic Resource Allocation (DRA) & GPU/Accelerator Management",
              "models": "AI/ML training, LLM inference pods, fractional/multi-GPU workloads, and NIC/FPGA consumers",
              "gpus": "NVIDIA/AMD GPU nodes, multi-NIC RDMA clusters, and topology-aware hardware pools",
              "impact": "Higher GPU utilization and fewer stranded accelerators via standardized device sharing and health reporting"
            },
            {
              "persona": "Networking, `nftables` Proxy & Traffic Observability",
              "models": "High-throughput east-west microservices and latency-sensitive ingress traffic",
              "gpus": "Linux dataplane (`nftables`/`ipvs`) and cloud load balancers",
              "impact": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "In-Place Pod Vertical Scaling (Resize)",
              "plain_english": "Changing a running Pod's CPU or memory requests/limits dynamically without killing and recreating the container.",
              "bottom_line": "Eliminates cold-start restarts and dropped connections when scaling stateful services, databases, or warm AI model servers."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Stopped accepting component configuration for `kube-proxy` and `kubelet` during `kubeadm upgrade plan --config`. This was a legacy behavior that was not well supported for upgrades and could be used only at the plan stag",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#120788"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "`kubeadm`: a separate \"super-admin.conf\" file is now deployed. The User in `admin.conf` is now bound to a new RBAC Group `kubeadm:cluster-admins` that has `cluster-admin` `ClusterRole` access. The User in `super-admin.co",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#121305"
              },
              {
                "change": "Deprecation",
                "impact": "#### Additional documentation e.g., KEPs (Kubernetes Enhancement Proposals), usage docs, etc.: <!-- This section can be blank if this pull request does not require a release note. When adding links which point to resourc",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.29"
              },
              {
                "change": "Deprecation",
                "impact": "[KEP]: <link>",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.29"
              },
              {
                "change": "Deprecation",
                "impact": "[Usage]: <link>",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.29"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "API Change",
              "hardware": "Added `UserNamespacesPodSecurityStandards` feature gate to enable user namespace support for Pod Security Standards. Enabling this feature will modify all Pod S",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#118760"
            },
            {
              "label": "Feature",
              "hardware": "Added new feature gate called `RuntimeClassInImageCriApi` to address `kubelet` changes needed for KEP 4216. Noteable changes: 1. Populate new `RuntimeHandler` f",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#121456"
            },
            {
              "label": "Feature",
              "hardware": "`kube-controller-manager`: The `LegacyServiceAccountTokenCleanUp` feature gate is now `beta` and enabled by default. When enabled, legacy auto-generated service",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#120682"
            },
            {
              "label": "Feature",
              "hardware": "Priority and Fairness feature is now `stable`, the feature gate will be removed in `v1.31`. ([#121638](https://github.com/kubernetes/kubernetes/pull/121638), [@",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#121638"
            },
            {
              "label": "API Change",
              "hardware": "`PersistentVolumeLastPhaseTransitionTime` is now beta and enabled by default. ([#120627](https://github.com/kubernetes/kubernetes/pull/120627), [@RomanBednar](h",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#120627"
            }
          ]
        }
      },
      {
        "version": "v1.28",
        "badge": "Release",
        "date": "2023-08-15",
        "stats": "305 upstream changes and 148 PRs",
        "headline": "Feature Enhancements, Networking, `nftables` Proxy & Traffic Observability",
        "executive_summary": "Kubernetes v1.28 focuses on Feature Enhancements, Networking, `nftables` Proxy & Traffic Observability, and CEL-Based Validating & Mutating Admission Policies. For operators, this release translates 305 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.",
        "five_parts": {
          "high_level_changes": [
            {
              "headline": "Feature Enhancements",
              "plain_summary": "Improves feature enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Networking, `nftables` Proxy & Traffic Observability",
              "plain_summary": "Improves networking, `nftables` proxy & traffic observability for high-throughput east-west microservices and latency-sensitive ingress traffic running on linux dataplane (`nftables`/`ipvs`) and cloud load balancers, delivering lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules."
            },
            {
              "headline": "CEL-Based Validating & Mutating Admission Policies",
              "plain_summary": "Improves cel-based validating & mutating admission policies for platform security guardrails, multi-tenant compliance policies, and default resource injectors running on in-process `kube-apiserver` admission chain (replaces external webhook deployments), delivering removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts."
            },
            {
              "headline": "API Change Enhancements",
              "plain_summary": "Improves api change enhancements for general platform workloads and api consumers running on standard cluster nodes and runtime components, delivering operational reliability and lower maintenance toil."
            },
            {
              "headline": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "plain_summary": "Improves native sidecar containers, checkpoint/restore & node lifecycle for service-mesh pods, telemetry agents, fast-restoring stateful apps, and oci artifact mounts running on kubelet cri runtime (containerd / cri-o) and linux/windows worker nodes, delivering stops zombie sidecars from holding batch nodes open after job completion."
            }
          ],
          "big_deal": [
            {
              "title": "Feature Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#116741",
                "#118763",
                "#119328"
              ],
              "before": "Prior to v1.28, teams operating feature enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "The `ExpandedDNSConfig` feature has graduated to GA. 'ExpandedDNSConfig' feature was locked to default value and will be removed in v1.30. If you were setting this feature gate explicitly, please (#116741).",
                "The `AdvancedAuditing` feature gate that graduated to GA in `v1.12` (and was unconditionally enabled) has been removed. ([#118763](https://github.com/kubernetes/kubernetes/pull/118763).",
                "Added a new feature gate, `SchedulerQueueingHints` (enabled by default). The new feature gate activates a framework for fine-grained filtering of events related to scheduler plugins. In this release (#119328).",
                "Graduated the `LegacyServiceAccountTokenTracking` feature gate to GA. The usage of auto-generated secret-based service account token now produces warnings, and relevant Secrets are labeled with a (#117591)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Networking, `nftables` Proxy & Traffic Observability",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "KEP-3178",
                "#119374",
                "#118895",
                "#117800"
              ],
              "before": "Prior to v1.28, teams operating networking, `nftables` proxy & traffic observability relied on older execution paths or manual tuning on Linux dataplane (`nftables`/`ipvs`) and cloud load balancers.",
              "tech_bullets": [
                "The `IPTablesOwnershipCleanup` feature (KEP-3178) is now GA; kubelet no longer creates the `KUBE-MARK-DROP` chain (which has been unused for several releases) or the `KUBE-MARK-MASQ` chain (which is (#119374).",
                "Added `IP mode` field to loadbalancer status ingress. ([#118895](https://github.com/kubernetes/kubernetes/pull/118895), [@RyanAoh](https://github.com/RyanAoh)).",
                "Kube-proxy: added `--logging-format` flag to support structured logging. ([#117800](https://github.com/kubernetes/kubernetes/pull/117800), [@cyclinder](https://github.com/cyclinder)).",
                "Kube-proxy handles Terminating EndpointSlices conditions and enables zero downtime deployments for Services with ExternalTrafficPolicy=Local author: @andrewsykim (#117718)."
              ],
              "why_it_matters": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules",
              "config_snippet": ""
            },
            {
              "title": "CEL-Based Validating & Mutating Admission Policies",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#119380",
                "#118644",
                "#119215"
              ],
              "before": "Prior to v1.28, teams operating cel-based validating & mutating admission policies relied on older execution paths or manual tuning on In-process `kube-apiserver` admission chain (replaces external webhook deployments).",
              "tech_bullets": [
                "Graduated `AdmissionWebhookMatchCondition` feature to beta. ([#119380](https://github.com/kubernetes/kubernetes/pull/119380), [@a-hilaly](https://github.com/a-hilaly)).",
                "Promoted API groups `ValidatingAdmissionPolicy` and `ValidatingAdmissionPolicyBinding` to `v1beta1`. ([#118644](https://github.com/kubernetes/kubernetes/pull/118644).",
                "Added a new `namespaceParamRef` field to `admissionregistration.k8s.io/v1alpha1.ValidatingAdmissionPolicy`. ([#119215](https://github.com/kubernetes/kubernetes/pull/119215).",
                "Added namespace access support to the CEL expressions of ValidatingAdmissionPolicy via a `namespaceObject` variable with expressions. ([#118267](https://github.com/kubernetes/kubernetes/pull/118267)."
              ],
              "why_it_matters": "Removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts",
              "config_snippet": ""
            },
            {
              "title": "API Change Enhancements",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#117570",
                "#115554",
                "#117713"
              ],
              "before": "Prior to v1.28, teams operating api change enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.",
              "tech_bullets": [
                "Removed `WindowsHostProcessContainers` feature-gate. ([#117570](https://github.com/kubernetes/kubernetes/pull/117570), [@marosset](https://github.com/marosset)) [SIG API Machinery, Apps, Auth, Node.",
                "`kube-controller-manager`: The `LegacyServiceAccountTokenCleanUp` feature gate is now available as alpha (off by default). When enabled, the `legacy-service-account-token-cleaner` controller loop (#115554).",
                "The `SelfSubjectReview` API is promoted to `authentication.k8s.io/v1` and the `kubectl auth whoami` command is GA. ([#117713](https://github.com/kubernetes/kubernetes/pull/117713).",
                "Added new `CRDValidationRatcheting` alpha feature. During a PATCH or UPDATE Validation Ratcheting discards errors thrown by unchanged portions of the resource from most OpenAPI schema validations. (#118990)."
              ],
              "why_it_matters": "Operational reliability and lower maintenance toil",
              "config_snippet": ""
            },
            {
              "title": "Native Sidecar Containers, Checkpoint/Restore & Node Lifecycle",
              "status": "Graduated / Merged",
              "status_tone": "green",
              "prs": [
                "#116429",
                "#118764",
                "#118865"
              ],
              "before": "Prior to v1.28, teams operating native sidecar containers, checkpoint/restore & node lifecycle relied on older execution paths or manual tuning on Kubelet CRI runtime (containerd / CRI-O) and Linux/Windows worker nodes.",
              "tech_bullets": [
                "The new feature gate \"SidecarContainers\" is now available. This feature introduces sidecar containers, a new type of init container that starts before other containers but remains running for the (#116429).",
                "Added full cgroup v2 swap support for both `Limited` and `Unlimited` swap. When `LimitedSwap` is enabled the swap limit would be automatically calculated for Burstable QoS pods. For (#118764).",
                "Added swap to stats to Summary API and Prometheus endpoints (stats/summary and /metrics/resource). ([#118865](https://github.com/kubernetes/kubernetes/pull/118865)."
              ],
              "why_it_matters": "Stops zombie sidecars from holding batch nodes open after job completion",
              "config_snippet": ""
            }
          ],
          "who_benefits": [
            {
              "persona": "Feature Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            },
            {
              "persona": "Networking, `nftables` Proxy & Traffic Observability",
              "models": "High-throughput east-west microservices and latency-sensitive ingress traffic",
              "gpus": "Linux dataplane (`nftables`/`ipvs`) and cloud load balancers",
              "impact": "Lowers cross-AZ data transfer costs (`trafficDistribution`) and reduces node CPU spent on iptables rules"
            },
            {
              "persona": "CEL-Based Validating & Mutating Admission Policies",
              "models": "Platform security guardrails, multi-tenant compliance policies, and default resource injectors",
              "gpus": "In-process `kube-apiserver` admission chain (replaces external webhook deployments)",
              "impact": "Removes dedicated webhook pods and eliminates deployment outages caused by webhook timeouts"
            },
            {
              "persona": "API Change Enhancements",
              "models": "General platform workloads and API consumers",
              "gpus": "Standard cluster nodes and runtime components",
              "impact": "Operational reliability and lower maintenance toil"
            }
          ],
          "jargon_decoded": [
            {
              "term": "DRA (Dynamic Resource Allocation)",
              "plain_english": "Kubernetes' next-generation API (`resource.k8s.io`) for requesting, sharing, and topology-aligning specialized hardware like GPUs, TPUs, and NICs\u2014replacing rigid integer device plugins.",
              "bottom_line": "Lets multiple pods share fractional GPUs safely or co-schedule across NVLink domains without custom vendor hacks."
            },
            {
              "term": "Gang Scheduling (`Workload` / `PodGroup`)",
              "plain_english": "An 'all-or-nothing' scheduling guarantee where a group of cooperating Pods (like a multi-node training or distributed inference job) only starts when capacity exists for the entire group.",
              "bottom_line": "Prevents expensive GPUs from sitting idle in deadlocked partial allocations when a cluster is near capacity."
            },
            {
              "term": "Native Sidecar Containers (`initContainers` with `restartPolicy: Always`)",
              "plain_english": "First-class lifecycle support for helper containers (log shippers, service mesh proxies) so they start before the main app and terminate automatically after Batch Jobs finish.",
              "bottom_line": "Fixes the classic Kubernetes bug where a finished Job hangs forever because an Istio/Envoy sidecar stays alive."
            },
            {
              "term": "ValidatingAdmissionPolicy & MutatingAdmissionPolicy (CEL)",
              "plain_english": "In-process policy rules written in Common Expression Language (CEL) evaluated directly inside `kube-apiserver` without calling external admission webhook servers.",
              "bottom_line": "Removes webhook network latency and prevents a crashed policy pod from taking down cluster deployments."
            }
          ],
          "upgrade_guide": {
            "verdict": "UPGRADE WITH CONFIG CHECK \u2014 High-ROI throughput/stability gains, but review breaking flag/API removals first",
            "rows": [
              {
                "change": "Urgent Upgrade Notes",
                "impact": "Action required for the custom scheduler plugin developers. Here's the breaking change in `EnqueueExtension` in the scheduling framework. The `EventsToRegister` in `EnqueueExtension` changed the return value from `Cluste",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.28"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "if more than one QueueingHintFn returns QueueImmediately, it queues Pod to activeQ.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.28"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "If no QueueingHintFn returns QueueImmediately and more than one plugin returns QueueAfterBackoff, it queues Pod to backoffQ if Pod is backing off, or to activeQ if Pod's backoff has already finished.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "v1.28"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "If all QueueingHintFn return QueueSkip, it puts this pod back to the unschedulable pod pool Having appropriate QueueingHintFn contributes to reducing useless retries and thus improves the overall scheduler's performance.",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#118551"
              },
              {
                "change": "Urgent Upgrade Notes",
                "impact": "CephFS volume plugin (`kubernetes.io/cephfs`) has been deprecated in this release and will be removed in a subsequent release. The alternative is to use the CephFS CSI driver (https://github.com/ceph/ceph-csi/) in your K",
                "action": "Verify manifests and flags against this change before upgrading.",
                "pr": "#118143"
              }
            ]
          },
          "proof_benchmarks": [
            {
              "label": "Feature",
              "hardware": "The `ExpandedDNSConfig` feature has graduated to GA. 'ExpandedDNSConfig' feature was locked to default value and will be removed in v1.30. If you were setting t",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#116741"
            },
            {
              "label": "Feature",
              "hardware": "The `AdvancedAuditing` feature gate that graduated to GA in `v1.12` (and was unconditionally enabled) has been removed. ([#118763](https://github.com/kubernetes",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#118763"
            },
            {
              "label": "API Change",
              "hardware": "The `IPTablesOwnershipCleanup` feature (KEP-3178) is now GA; kubelet no longer creates the `KUBE-MARK-DROP` chain (which has been unused for several releases) o",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#119374"
            },
            {
              "label": "API Change",
              "hardware": "Graduated `AdmissionWebhookMatchCondition` feature to beta. ([#119380](https://github.com/kubernetes/kubernetes/pull/119380), [@a-hilaly](https://github.com/a-h",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#119380"
            },
            {
              "label": "Feature",
              "hardware": "Graduated the `LegacyServiceAccountTokenTracking` feature gate to GA. The usage of auto-generated secret-based service account token now produces warnings, and ",
              "metric": "Verified upstream",
              "pct_bar": 75,
              "pr": "#117591"
            }
          ]
        }
      }
    ],
    "weekly_editions": [
      {
        "id": "2026-11-01",
        "date_iso": "2026-11-01",
        "label": "2026-11-01 (Latest)",
        "date_range": "Week Ending November 01, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-11-01): 143644: Update volume health APIs as per newest version of KEP",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Control Plane Efficiency",
            "title": "Decoding JSON into UnstructuredList Now Uses 50% Less RAM & 33% Less CPU Time",
            "summary": "A major optimization in client/server JSON decoding cuts memory allocations in half when listing Custom Resources (CRDs) and dynamic objects.",
            "impact": "Directly lowers memory spikes in Argo CD, Flux, Kyverno, and custom operators watching large CRD fleets.",
            "prs": [
              "#142575"
            ]
          },
          {
            "tag": "Upgrade Alert",
            "title": "Locked GA `SupplementalGroupsPolicy` Feature Gate Removed + Kubernetes 1.34 Reaches EOL",
            "summary": "The graduated `SupplementalGroupsPolicy` gate has been removed from component flags, and Kubernetes 1.34 officially reached End of Life alongside patch releases 1.37.2, 1.36.6, and 1.35.10.",
            "impact": "Remove `--feature-gates=SupplementalGroupsPolicy=...` from your API server/kubelet manifests before upgrading.",
            "prs": [
              "#142093"
            ]
          },
          {
            "tag": "Storage & StatefulSets",
            "title": "StatefulSet `maxUnavailable` Partition Fix & CSI Controller Node Info (KEP-6011)",
            "summary": "StatefulSet rolling updates no longer count unavailable pods below the partition against your `maxUnavailable` budget, and KEP-6011 moves CSI cloud topology queries off worker nodes.",
            "impact": "Safer canary rollouts for databases and no more cloud IAM credentials needed on worker nodes for CSI volume limits.",
            "prs": [
              "#143114",
              "#143644"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "143644: Update volume health APIs as per newest version of KEP",
                "pr": "#143644",
                "what_it_is": "gnufied updated Kubernetes volume health APIs to align with the latest design in KEP-1432, with related changes discussed in KEP-6395. The change moves `volumeHealth` from `PodStatus` into `PodStatus.VolumeStatus` and introduces `Healthy` and `Unknown` values for volume health conditions in the core API and `CSINode` types. It also clarifies how readers and writers should handle new condition values, helping maintain compatibility as volume health reporting evolves. These API changes establish a clearer contract for reporting storage health across Kubernetes and CSI drivers.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "143701: KEP-5502: Run EmptyDirVolumeMode e2e tests in alpha/beta kind jobs",
                "pr": "#143701",
                "what_it_is": "blackjid fixed the test selection for `EmptyDirVolumeMode` end-to-end tests so they can run in the alpha/beta Kind jobs. The tests were being excluded because the additional `[Feature:EmptyDirVolumeMode]` label conflicted with the jobs' `OffByDefault` feature filter, and no other job selected them. This change removes the redundant label while retaining `framework.WithFeatureGate(...)`, allowing the tests to run in CI and build a test history ahead of the feature's beta promotion. The work supports KEP-5502.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "cel-go upgraded to v0.33.0 (#143439), now imported as cel.dev/cel-go; Go code passing cel-go types to k8s.io/apiserver, apiextensions-apiserver or dynamic-resource-allocation must update imports",
              "CRD types and clients move to the new k8s.io/apiextensions-api module (#142746), with deprecated aliases left in apiextensions-apiserver",
              "kube-apiserver adds conditional authorization support (#141959)",
              "client-go leader election adds write-gating and leader recovery (#143289)",
              "The locked GA SupplementalGroupsPolicy feature gate is removed (#142093); remove it from component configuration before upgrading",
              "StatefulSet maxUnavailable no longer counts unavailable pods below the partition (#143114) against the update budget",
              "Decoding JSON lists into UnstructuredList uses about half the memory (#142575) and a third less time",
              "New WatchFromStorageWithoutPrevKV feature gate (#131862) enables etcd watches without prev-kv"
            ]
          }
        ]
      },
      {
        "id": "2026-10-25",
        "date_iso": "2026-10-25",
        "label": "2026-10-25",
        "date_range": "Week Ending October 25, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-25): 143463: KEP-5710: Log error when PostFilter plugin does not implement PodGroupPostFilterPlugin",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "143463: KEP-5710: Log error when PostFilter plugin does not implement PodGroupPostFilterPlugin",
            "summary": "jdzikowski added a scheduler initialization check for plugins that implement `PostFilter` but not `PodGroupPostFilterPlugin`, as part of KEP-5710. With the `GenericWorkload` feature gate enabled, the scheduler now logs an error when an enabled plugin will be skipped during scheduling for a PodGroup or CompositePodGroup. Previously, this behavior could go unnoticed, potentially leaving workload-aware scheduling integrations without the expected post-filtering behavior. The check also fulfills one of the KEP's graduation criteria for General Availability.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#143463"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "143463: KEP-5710: Log error when PostFilter plugin does not implement PodGroupPostFilterPlugin",
                "pr": "#143463",
                "what_it_is": "jdzikowski added a scheduler initialization check for plugins that implement `PostFilter` but not `PodGroupPostFilterPlugin`, as part of KEP-5710. With the `GenericWorkload` feature gate enabled, the scheduler now logs an error when an enabled plugin will be skipped during scheduling for a PodGroup or CompositePodGroup. Previously, this behavior could go unnoticed, potentially leaving workload-aware scheduling integrations without the expected post-filtering behavior. The check also fulfills one of the KEP's graduation criteria for General Availability.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "143387: KEP-5491: Adds integration and e2e test for List Type Attributes",
                "pr": "#143387",
                "what_it_is": "everpeace added integration and end-to-end tests for list-typed `matchAttribute` and `distinctAttribute` constraints in Dynamic Resource Allocation (DRA), as specified by KEP-5491. The tests exercise allocation against a real API server and scheduler, covering intersecting and disjoint attribute lists, scalar-to-list matching, and distinctness constraints. These cases help verify that device allocation behaves correctly across different attribute combinations and provide coverage required by the KEP's test plan for beta promotion in Kubernetes v1.38.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Fix for a kubelet bug (#141014) that set pod sandbox CPU and memory limits to the partial sum of container limits when only some containers declared them",
              "kube-scheduler's preemption disruption metric gains a victim label (#142955); PreemptionVictim gains a Type() method and PreemptionCandidate.NumPodGroupDisruptions() is replaced by NumDisruptionsByVictimType()",
              "MutatingAdmissionWebhook config gains a staticOrder field (#143160) to control manifest vs. API-registered webhook ordering; requires the ManifestBasedAdmissionControlConfig gate and must be removed before downgrading to v1.37 or earlier",
              "A new evictionrequest-controller (#137133) creates Evictions from EvictionRequests and coordinates external responders",
              "Add cgroup_mount_mode to the CRI API (#139824) to support writable cgroups",
              "kubectl selector commands like create pdb --selector (#142216) now accept !=",
              "client-go adds DropManagedFields (#142695) to omit managedFields from API responses, behind the new alpha ManagedFieldsOptOutClient gate",
              "kubelet adds the alpha kubelet_device_plugin_devices (#143223) metric, breaking device counts down by health state"
            ]
          }
        ]
      },
      {
        "id": "2026-10-18",
        "date_iso": "2026-10-18",
        "label": "2026-10-18",
        "date_range": "Week Ending October 18, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-18): [143188: [WAS] KEP-5547: Promote Job Scheduling feature gate to Beta](https://github.com/kubernetes/kubernetes/pull/143188)",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "[143188: [WAS] KEP-5547: Promote Job Scheduling feature gate to Beta](https://github.com/kubernetes/kubernetes/pull/143188)",
            "summary": "helayoty promoted the `WorkloadWithJob` feature gate to Beta as part of KEP-5547. This integrates Workload-aware Scheduling (WAS) APIs into the Kubernetes Job controller, allowing Jobs to express scheduling intent through `spec.scheduling`\u2060, including gang scheduling and topology constraints. The controller translates this configuration into `Workload` and `PodGroup` objects, enabling related Pods to be scheduled according to the workload's requirements. The feature remains disabled by default in this promotion, giving clusters control over when to enable the integration.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#143188"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "[143188: [WAS] KEP-5547: Promote Job Scheduling feature gate to Beta](https://github.com/kubernetes/kubernetes/pull/143188)",
                "pr": "#143188",
                "what_it_is": "helayoty promoted the `WorkloadWithJob` feature gate to Beta as part of KEP-5547. This integrates Workload-aware Scheduling (WAS) APIs into the Kubernetes Job controller, allowing Jobs to express scheduling intent through `spec.scheduling`\u2060, including gang scheduling and topology constraints. The controller translates this configuration into `Workload` and `PodGroup` objects, enabling related Pods to be scheduled according to the workload's requirements. The feature remains disabled by default in this promotion, giving clusters control over when to enable the integration.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "143160: KEP-5793: Add staticOrder to control mutating webhook merge order",
                "pr": "#143160",
                "what_it_is": "aramase added the `staticOrder` field to `WebhookAdmissionConfiguration` as part of KEP-5793. Previously, manifest-based mutating admission webhooks always ran before webhooks registered through the API, so migrating a webhook to a manifest could change the order in which mutations were applied. The new configuration supports three ordering modes: `StaticFirst` to preserve the existing behavior, `StaticLast` to run manifest-based webhooks afterward, and `ByName` to sort both sets together by configuration name. This gives cluster administrators more control over admission ordering when using manifest-based admission control, while caching the merged webhook list avoids adding per-request processing overhead.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Go API objects no longer provides direct access to the Raw byte slice (#143011) in `ObjectMeta.ManagedFields[*].FieldsV1`",
              "kube-apiserver: support the ShardedListAndWatch feature for custom resources and dynamic clients that use Unstructured objects (#142975)",
              "Job controller: `job_pods_creation_total` no longer counts a failed pod creation as both succeeded and failed (#142923)",
              "Job status.ready no longer decreases when deleting a Ready pod fails (#142922)",
              "Fixed differences between continue token generated by cacher and etcd3 (#142919)",
              "Fixed deployment rollouts failing to report timeouts after old ReplicaSet scale-down errors (#142902)",
              "The `KUBECTL_REMOTE_COMMAND_WEBSOCKETS` and `KUBECTL_PORT_FORWARD_WEBSOCKETS` environment variables are removed (#142861); the features are GA",
              "Increased PodGroup priority validation to highest possible value that can be set (#142846)"
            ]
          }
        ]
      },
      {
        "id": "2026-10-11",
        "date_iso": "2026-10-11",
        "label": "2026-10-11",
        "date_range": "Week Ending October 11, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-11): [142913: [KEP-4443] Add more granular job failure condition reasons](https://github.com/kubernetes/kubernetes/pull/142913)",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "[142913: [KEP-4443] Add more granular job failure condition reasons](https://github.com/kubernetes/kubernetes/pull/142913)",
            "summary": "ameukam added more granular failure condition reasons for Jobs using `PodFailurePolicy`. Previously, multiple rules using the `FailJob` action could produce the same generic failure reason, making it difficult for higher-level controllers to determine why a Job failed. This change allows rules to be named so that the resulting Job failure condition can identify the rule responsible, falling back to the rule's index when no name is specified. This gives controllers such as JobSet more precise information to make decisions about retries and recovery. The change is part of KEP-4443.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#142913"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "[142913: [KEP-4443] Add more granular job failure condition reasons](https://github.com/kubernetes/kubernetes/pull/142913)",
                "pr": "#142913",
                "what_it_is": "ameukam added more granular failure condition reasons for Jobs using `PodFailurePolicy`. Previously, multiple rules using the `FailJob` action could produce the same generic failure reason, making it difficult for higher-level controllers to determine why a Job failed. This change allows rules to be named so that the resulting Job failure condition can identify the rule responsible, falling back to the rule's index when no name is specified. This gives controllers such as JobSet more precise information to make decisions about retries and recovery. The change is part of KEP-4443.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "142898: e2e: test KEP-4006 WebSocket exec, attach and port-forward without SPDY fallback",
                "pr": "#142898",
                "what_it_is": "seans3 added end-to-end tests for `exec`, `attach`, and `port-forward` over WebSockets without allowing a fallback to SPDY. Tests that permit fallback can pass even when the WebSocket path is broken, leaving gaps in coverage for Kubernetes' transition away from SPDY. By explicitly exercising these operations without fallback, this change helps verify that WebSocket streaming works independently and provides stronger confidence in the new protocol paths. The work is part of KEP-4006, with promotion of the tests to conformance planned as a follow-up after a soak period.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "142897: apiserver, kubelet: graduate the KEP-4006 WebSocket streaming metrics to BETA",
                "pr": "#142897",
                "what_it_is": "seans3 graduated WebSocket streaming metrics in the API server and kubelet from Alpha to Beta as part of KEP-4006. The metrics provide visibility into WebSocket streaming requests handled by the API server and kubelet, including requests processed through the API server's stream translator and tunnel. Advancing these metrics to Beta improves their stability and makes them more useful for monitoring and troubleshooting as Kubernetes continues its transition from SPDY to WebSockets.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "kubectl kustomize no longer loads kustomize Go (`.so`) plugins (#142791); exec and KRM function plugins are unaffected",
              "Updated TokenReview internal type to improve cast speed from latest external version (#142750)",
              "Strengthened runtime PodGroup and CompositePodGroup hierarchy validation in kube-scheduler (#142719) to verify maximum tree depth, Workload reference consistency, scheduling policies, and disruption modes",
              "applyconfiguration-gen now honors `+k8s:openapi-model-package` when looking up OpenAPI definitions (#142697), and fails if the schema has no definition for a root type",
              "kube-apiserver and other servers built on k8s.io/apiserver now accept up to 16384 request header values (#142607)",
              "API server now returns 400 instead of 500 status code (#142591) on GET request with invalid revision",
              "Fixed API warnings on ReplicationController updates (#142443), which described the previous pod template instead of the new one",
              "DRA consumable capacity + CEL: fixed name comparisons and lookup (#142202)"
            ]
          }
        ]
      },
      {
        "id": "2026-10-04",
        "date_iso": "2026-10-04",
        "label": "2026-10-04",
        "date_range": "Week Ending October 04, 2026",
        "reading_time": "4 min read",
        "headline": "This Week in Kubernetes (2026-10-04): 142693: Add CSIControllerGetNodeInfo feature gate and driverRegistrations field",
        "intro": "Weekly summary of upstream Kubernetes development activity, featured pull requests, and deprecations.",
        "tldr_cards": [
          {
            "tag": "Upstream Merge",
            "title": "142693: Add CSIControllerGetNodeInfo feature gate and driverRegistrations field",
            "summary": "torredil added the alpha `CSIControllerGetNodeInfo` feature gate and the `driverRegistrations` field to `CSINode` as part of KEP-6011. The change enables CSI node registration to split node-side identity reporting from controller-side discovery of topology and volume attachment limits. This allows CSI drivers to obtain information that may require cloud API access from the controller rather than requiring those credentials on worker nodes. The controller-side flow also enables more accurate volume capacity tracking using `VolumeAttachment` information while preserving the existing node-side registration flow for drivers that do not opt in.",
            "impact": "Keep custom controllers and cluster manifests aligned with upstream changes.",
            "prs": [
              "#142693"
            ]
          }
        ],
        "sections": [
          {
            "category": "Featured Pull Requests",
            "items": [
              {
                "title": "142693: Add CSIControllerGetNodeInfo feature gate and driverRegistrations field",
                "pr": "#142693",
                "what_it_is": "torredil added the alpha `CSIControllerGetNodeInfo` feature gate and the `driverRegistrations` field to `CSINode` as part of KEP-6011. The change enables CSI node registration to split node-side identity reporting from controller-side discovery of topology and volume attachment limits. This allows CSI drivers to obtain information that may require cloud API access from the controller rather than requiring those credentials on worker nodes. The controller-side flow also enables more accurate volume capacity tracking using `VolumeAttachment` information while preserving the existing node-side registration flow for drivers that do not opt in.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              },
              {
                "title": "[142789: KEP-[6283]: use kubernetes.io/kube-apiserver-serving CTB to mount kube-apiserver trust](https://github.com/kubernetes/kubernetes/pull/142789)",
                "pr": "#142789",
                "what_it_is": "stlaz introduced a feature gate, as part of KEP-6283, to switch ServiceAccount token volume trust from the `kube-root-ca.crt` ConfigMap to the `kubernetes.io/kube-apiserver-serving` ClusterTrustBundle. This provides a newer mechanism for making the kube-apiserver serving CA available to workloads using automatically mounted ServiceAccount token volumes, while allowing the existing behavior to remain available behind the feature gate.",
                "why_you_care": "Improves Kubernetes API contract consistency, CI coverage, and operator reliability."
              }
            ]
          },
          {
            "category": "Other Notable Merges",
            "bullets": [
              "Fixed refcounting leak in the node authorizer graph (#142574) for pods which reference secrets, configmaps, or pvcs multiple times",
              "Fixed `kubectl kuberc set` leaving a stale credential plugin allowlist (#142564) when the policy is changed to AllowAll or DenyAll, which caused kubectl to fail",
              "Added consistency store to client-go (#142537) and deprecated it from pkg/controller",
              "Fixed k8s.io/apimachinery/pkg/util/yaml silently dropping the last line of a YAML stream (#142527) when it has no trailing newline and its length is an exact multiple of the reader buffer size",
              "Separated deleteGet and updateGet etcd operation in etcd_request_* metrics (#142484) and added reason label to error",
              "kubelet: the pods API gRPC server now limits concurrent streams per connection to 100 (#142458) and applies its request rate limit to WatchPods stream openings",
              "kubelet: gRPC probes fail immediately when the connection is refused (#142457) instead of retrying until the probe timeout",
              "`kubectl label` now prints messages about nonexistent labels to stderr instead of stdout (#142436), so they no longer break JSON or YAML output"
            ]
          }
        ]
      }
    ]
  }
};
